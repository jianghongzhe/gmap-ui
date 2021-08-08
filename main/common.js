const path = require('path');
const fs = require('fs');

const ws=require('./ws');


/**
 * 是否已连接websocket服务
 */
let wsConnected=false;

/**
 * websocket客户端对象
 */
let wsClient=null;

/**
 * 生成请求Id的计数器
 */
let reqIdCounter=0;

/**
 * 请求Id与promise是resolve的对应关系：用于把分离的请求发送和响应接收关联到一起
 */
let reqIdCallbackMap={};



/**
 * 连接后台websocket服务并定时发送心跳
 * @param {*} url 
 */
const connWs=(url)=>{
    wsClient = new ws(url);
    wsClient.on('open', ()=>{
        log(`后台websocket服务已连接：${url}`);
        wsConnected=true;
    });
    wsClient.on('message', function incoming(message) {
        if(message instanceof Buffer){
            const str=message.toString('utf-8');
            if('pong'===str){
                log("从服务端接收到心跳");
                return;
            }
            const resp=JSON.parse(str);
            if(reqIdCallbackMap[resp.reqId]){
                reqIdCallbackMap[resp.reqId](resp);
            }
        }
    });
    setTimeout(beginHeartbeat, 5000);
};


/**
 * 定时发送心跳
 * @returns 
 */
const beginHeartbeat=()=>{
    if(null==wsClient){
        log("还未初始化websocket client，无法发送心跳消息");
        return;
    }
    if(!wsConnected){
        log("尚未连接到websocket服务端，无法发送心跳消息");
        return;
    }
    log("向服务端发送心跳");
    wsClient.send("ping");
    setTimeout(beginHeartbeat, 30000);
};


/**
 * 向后台服务发送信息并得到异步结果（promise）
 * @param {*} action 操作类型
 * @param {*} data 操作数据的json对象
 * @returns 
 */
const send=(action, data)=>{
    if(null==wsClient){
        log("还未初始化websocket client，无法发送消息");
        return;
    }
    if(!wsConnected){
        log("尚未连接到websocket服务端，无法发送消息");
        return;
    }

    const reqId = ++reqIdCounter;
    return new Promise((res, rej)=>{
        reqIdCallbackMap[reqId]=res;
        wsClient.send(JSON.stringify({
            reqId,
            action,
            data: "string"===typeof(data) ? data.trim() : JSON.stringify(data)       
        }));
    });
};


/**
 * 记录日志
 * @param {*} info 
 */
const log=(info)=>{
    const now=new Date();
    const m=now.getMonth()+1;
    const d=now.getDate();
    const h=now.getHours();
    const min=now.getMinutes();
    const s=now.getSeconds();
    const ms=now.getMilliseconds();

    const ymd=`${now.getFullYear()}-${m<10 ? "0"+m : m}-${d<10 ? "0"+d : d}`;
    const hms=`${h<10 ? '0'+h : h}:${min<10 ? '0'+min : min}:${s<10 ? '0'+s : s}.${ms<10?'00'+ms:(ms<100?'0'+ms:ms)}`;
    const localpath=path.join(__dirname, '../', 'work', `main_${ymd}.log`);

    fs.appendFileSync(
        localpath,
        `[${ymd} ${hms}] ${info}\r\n`,
        'utf-8'
    );
};






module.exports={
    connWs,
    send,
    log,
};