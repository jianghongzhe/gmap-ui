const path = require('path');
const fs = require('fs');

const ws=require('./ws');



/**
 * 从连接websocket服务后指定毫秒数开始发送心跳
 */
const wsHeartBeatDelayMs=5000;

/**
 * 发送心跳的间隔毫秒数
 */
const wsHeartBeatIntervalMs=30000;

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
    return new Promise((res, rej)=>{
        wsClient = new ws(url);    
        wsClient.on('open', ()=>{
            log(`后台websocket服务已连接：${url}`);
            wsConnected=true;
            setTimeout(beginHeartbeat, wsHeartBeatDelayMs);
            res();
        });
        wsClient.on('message', function incoming(message) {
            if(message instanceof Buffer){
                const str=message.toString('utf-8');
                const resp=JSON.parse(str);
                if(reqIdCallbackMap[resp.reqId]){
                    const func=reqIdCallbackMap[resp.reqId];
                    func(resp);
                    delete reqIdCallbackMap[resp.reqId];
                }
            }
        });
        wsClient.on('pong', ()=>{
            log("收到心跳");
        });
    });
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
    // log("向服务端发送心跳");
    // wsClient.send("ping");
    log("发送心跳");
    wsClient.ping();
    setTimeout(beginHeartbeat, wsHeartBeatIntervalMs);
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
 * 把一个目录中的所有内容（包含子目录）复制到另一个目录
 * @param {*} srcDir 
 * @param {*} destDir 
 */
const dirCopy=(srcDir, destDir)=>{
    if(!fs.existsSync(destDir)){
        fs.mkdirSync(destDir,{recursive:true});
    }

    const recursivelyCopy=(baseDir)=>{
        fs.readdirSync(baseDir, { withFileTypes: true }).forEach(ent=>{
            const fromFullpath=path.join(baseDir, ent.name);
            const fromRelaPath=path.relative(srcDir, fromFullpath);
            const toFullpath=path.join(destDir, fromRelaPath);

            if(ent.isFile()){
                fs.copyFileSync(fromFullpath, toFullpath);
                return;
            }

            if(!fs.existsSync(toFullpath)){
                fs.mkdirSync(toFullpath);
            }
            recursivelyCopy(fromFullpath);
        });
    };
    recursivelyCopy(srcDir);
};


/**
 * 记录日志
 * @param {*} info 
 * @param {*} printToConsole 是否也打印到控制台
 */
const log=(info, printToConsole=false)=>{
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

    fs.appendFile(
        localpath,
        `[${ymd} ${hms}] ${info}\r\n`,
        'utf-8',
        ()=>{}
    );
    if(printToConsole){
        console.log(info);
    }
};


/**
 * 获取年月日时分秒：210830_153025
 * @returns 
 */
const getYmdhms=()=>{
    const now=new Date();
    const m=now.getMonth()+1;
    const d=now.getDate();
    const h=now.getHours();
    const min=now.getMinutes();
    const s=now.getSeconds();
    const ms=now.getMilliseconds();

    const ymd=`${now.getFullYear()-2000}${m<10 ? "0"+m : m}${d<10 ? "0"+d : d}`;
    const hms=`${h<10 ? '0'+h : h}${min<10 ? '0'+min : min}${s<10 ? '0'+s : s}`;
    return ymd+"_"+hms;
};


/**
 * 是否为开发模式
 * @returns 
 */
const isDevMode = () => (process && process.env && process.env.DEV_SERVER_URL ? true : false);


/**
 * 获得开发模式的主页访问地址
 */
 const getDevServerUrl=()=>{
    if(isDevMode()){
        return process.env.DEV_SERVER_URL;
    }
    return '';
}

/**
 * 获取开发服务器的favicon图标
 * @returns 
 */
const getDevServerFaviconUrl=()=>{
    return getDevServerUrl().trim()+"/favicon.ico"
};


module.exports={
    connWs,
    send,
    log,
    getYmdhms,
    dirCopy,
    isDevMode,
    getDevServerUrl,
    getDevServerFaviconUrl,
};