const net = require('net');
const crypto=require("crypto");
const zlib = require('node:zlib');


// --------------------- 常量 -----------------------------------------------------
// 向请求数据中增加的唯一标识，用来实现请求响应模型
const REQUEST_ID_KEY="REQ_ID___";

// 心跳包发送频率
const KEEPALIVE_INTERVAL_MS=30_000;

// 超时检测的间隔时间
const TIMEOUT_CHECK_INTERVAL=3*60_000;

// 请求发出后等待响应的超时时间
const WAIT_RESP_TIMEOUT=10*60_000;

// ping帧
const PING_BUFFER = Buffer.allocUnsafe(4);
PING_BUFFER.writeUInt32BE(0, 0);

/**
 * 默认客户端配置
 * 请求不压缩、响应不压缩
 */
const defaultConf={
    reqCompress:    false,
    reqCompressLev: 0,
    respCompress:   false,
    hasErr:         (json)=>false,
    onPong:         ()=>{},
};



// --------------------- 全局状态数据 -----------------------------------------------------
/**
 *  请求id与res、rej对应关系
 *  {
 *    req_id_1 :{
 *      res,
 *      rej,
 *      requestTime:
 *    }
 *  }
 */
const reqIdPromiseMap={
};

// socket客户端
let client=null;

// 创建连接时的配置信息
let globalOption=defaultConf;


/**
 * 用于累计响应数据的信息，由于会有半包粘包问题，每次得到的数据不一定是完成响应结果，用全局变量累计
 * head.buf - 头信息的缓冲，固定4个字节
 * head.readSize - 头信息已读取到的字节数
 * payload.buf - 体信息的缓冲，默认为null，当头信息读取完成后填充
 * payload.sumSize - 体信息总字节数，当头信息读取完成后填充
 * payload.readSize - 体信息已读取到的字节数
 */
const accuData={
    head: {
        buf: Buffer.allocUnsafe(4),
        readSize: 0,
    },
    payload: {
        buf: null,
        sumSize: 0,
        readSize: 0,
    },
};





/**
 * 连接到管道服务器端，开始心跳保活，注册接收数据事件
 * @param pipeFullPath
 * @return {Promise<unknown>}
 */
const connectToIpcServer=(pipeFullPath, option=defaultConf)=>{
    if(client){
        console.error("只允许连接一次管道服务器");
        return;
    }

    if(!option){
        option=defaultConf;
    }
    globalOption=option;

    return new Promise((res, rej)=>{
        const tmpClient = net.connect(pipeFullPath, ()=>{
            client=tmpClient;
            beginKeepAlive();
            beginCheckTimeout();
            client.on('data', (data)=>{
                handleData(data, option);
            });
            client.on('end', ()=>{
                if(client){
                    try{client.destroy();}catch (e){}
                    client=null;
                }
            });
            res();
        });
    });
};


/**
 * 连接保活
 */
const beginKeepAlive=()=>{
    const sendPing=()=>{
        if(client){
            try{client.write(PING_BUFFER);}catch(e){}
        }
    };
    const timer=setInterval(()=>{
        sendPing();
        if(!client) {
            clearInterval(timer);
        }
    },KEEPALIVE_INTERVAL_MS);
    sendPing();
};


/**
 * 定期剔除过期请求的id与res/rej对应关系
 */
const beginCheckTimeout=()=>{
    setInterval(()=>{
        Object.keys(reqIdPromiseMap).forEach(reqId=>{
            if(new Date().getTime()-reqIdPromiseMap[reqId].requestTime>WAIT_RESP_TIMEOUT){
                reqIdPromiseMap[reqId].rej("request timeout");
                delete reqIdPromiseMap[reqId];
            }
        });
    }, TIMEOUT_CHECK_INTERVAL);
};


/**
 * 发送请求
 * @param json 请求数据，
 * @return {Promise<unknown>}
 */
const sendReq=(json)=>{
    if(!client){
        console.error("named pipe client not connected");
        return;
    }

    // 对请求json增强，增加请求id
    const reqId = crypto.randomUUID().replace(/-/g, '').toLowerCase();
    const enhJson={
        ...json,
        [REQUEST_ID_KEY]: reqId,
    };

    // 压缩后发送请求，并注册请求id和promise关系，以便接收结果后回调
    return new Promise((res, rej)=>{
        new Promise((resSub, rejSub)=>{
            const jsonStr = JSON.stringify(enhJson);
            if(true!==globalOption?.reqCompress){
                resSub(Buffer.from(jsonStr, 'utf8'));
                return;
            }
            zlib.gzip(jsonStr, {level: globalOption?.reqCompressLev}, (err, buf)=>{
                if(err){
                    console.error(err);
                    rejSub(err);
                    return;
                }
                resSub(buf);
            });
        }).then(buf=>{
            const payloadSize=buf.length;
            const sendDataBuf = Buffer.allocUnsafe(payloadSize+4);
            sendDataBuf.writeUInt32BE(payloadSize, 0);
            buf.copy(sendDataBuf, 4, 0, payloadSize);
            client.write(sendDataBuf);

            reqIdPromiseMap[reqId]={
                res,
                rej,
                requestTime: new Date().getTime(),
            };
        }).catch(e=>{});
    });
};








/**
 * 处理数据事件
 * @param data
 */
const handleData=(data, option)=>{
    // data中当前读取位置
    let offset=0;

    while(true){
        // 读取完成
        if(offset>=data.length){
            break;
        }

        // 还未读够长度帧的4个字节
        if(accuData.head.readSize<4){
            const readCnt=Math.min(4-accuData.head.readSize, data.length-offset);
            data.copy(accuData.head.buf, accuData.head.readSize, offset, offset+readCnt);
            offset+=readCnt;
            accuData.head.readSize+=readCnt;

            // 读取完头帧已经有完整4个字节，从中获取体帧长度：
            // 长度为0，则认为是pong帧，头帧读取长度重新初始化为0；
            // 否则初始化体帧的buffer
            if(4===accuData.head.readSize){
                accuData.payload.sumSize=accuData.head.buf.readUint32BE(0);
                if(0===accuData.payload.sumSize){
                    accuData.head.readSize=0;
                    if(option?.onPong){
                        option.onPong();
                    }
                    continue;
                }
                accuData.payload.buf=Buffer.allocUnsafe(accuData.payload.sumSize);
                accuData.payload.readSize=0;
            }
            continue;
        }

        // 读取payload帧
        const readCnt=Math.min(accuData.payload.sumSize-accuData.payload.readSize, data.length-offset);
        data.copy(accuData.payload.buf, accuData.payload.readSize, offset, offset+readCnt);
        accuData.payload.readSize+=readCnt;
        offset+=readCnt;

        // 如果体帧读取完成，则把头帧状态改为未读，并处理体帧结果
        if(accuData.payload.readSize===accuData.payload.sumSize){
            accuData.head.readSize=0;
            handleResp(accuData.payload.buf, option);
        }
    }
};


/**
 * 处理响应结果：数据事件中处理完半包粘包后的完整响应结果
 * 解压数据(如果需要)后，找到原请求id关联的promise信息（res/rej）并调用，删除相应的关联关系
 * @param buf
 */
const handleResp=(buf, option)=>{
    new Promise((res,rej)=> {
        if(true!==option?.respCompress){
            res(buf);
            return;
        }
        zlib.unzip(buf, {}, (err, originBuf)=>{
            if(err){
                rej(err);
                console.error(err);
                return;
            }
            res(originBuf);
        });
    }).then(originBuf=>{
        const json = JSON.parse(originBuf.toString("utf8"));
        const reqId=json[REQUEST_ID_KEY];

        if(reqIdPromiseMap[reqId]){
            // 如果配置项中有判断请求成功失败的函数，则根据结果调用res/rej，否则直接认为成功（res）
            if(option?.hasErr && 'function'===typeof(option.hasErr)){
                const func= option.hasErr(json) ?  reqIdPromiseMap[reqId].rej : reqIdPromiseMap[reqId].res;
                func(json);
            }else{
                reqIdPromiseMap[reqId].res(json);
            }
            delete reqIdPromiseMap[reqId];
        }
    }).catch(e=>{});
};


module.exports={
    connectToIpcServer,
    sendReq,
};