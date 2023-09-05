const crypto= require("crypto");
const { spawn} = require('child_process');
const path=require("path");
const fs = require("fs");
const {nativeImage, clipboard} = require("electron");

const common = require('./common');
const ipcClient= require("./ipc_client");
const {createTimeoutDetector}= require("./timeout_detect");

const {
    backendExePath,
    workPath,
}=require("./consts");
const appSvc = require("./appSvc");



// 连续多长时间未收到pong响应，认为连接异常（超时）
const PONG_TIMEOUT_MS=3*60_000;

// 检查pong超时的时间间隔
const CHECK_PONG_TIMEOUT_INTERVAL_MS=60_000;


/**
 * 把rpc服务注册到electron ipc，以便被前端调用
 * @param serverInfo
 * {
 *      "Pid":18728,
 *      "PipeFullName":"\\\\.\\pipe\\gmap_1692297950985184800"
 * }
 * @param res
 */
const regRpcSvcToIpc=(serverInfo, res)=>{
    const timeoutDetector= createTimeoutDetector(PONG_TIMEOUT_MS, CHECK_PONG_TIMEOUT_INTERVAL_MS, (distMs)=>{
        common.log(`pipe server connection exception, not receive pong over ${parseInt(distMs/1000)}sec`, true);
        //appSvc.showNotification("错误", "后台服务连接失败", "err");
    });

    const opt={
        reqCompress:     false,
        reqCompressLev:  0,
        respCompress:    false,
        hasErr:          (json)=>0!==json.State,
        onPong:          ()=> timeoutDetector.signal(),
    };
    ipcClient.connectToIpcServer( serverInfo.PipeFullName, opt).then(()=>{
        common.log(`connected to backend service on pipe: ${serverInfo.PipeFullName}`, true);
        common.regSyncAndAsyncIpcHandlers({
            ipc: decodeErrHandler.bind(this, ipcClient.sendReq),
        });
        res();
    });
};

/**
 * 由于从ipcmain到ipcrenderer传递异常（reject）时会变形，即不能设置自定义属性，也不能设置自定义异常信息（信息前会加一些error invoking remote method...）,
 * 因此在这里捕获异常，把返回结果设置成数组，[0]为异常信息，[1]为正常结果
 * @param fun
 * @param req
 * @return {Promise<[null,*]|[*,null]|undefined>}
 */
const decodeErrHandler=(fun, req)=>{
    // 处理二进制数据，把二进制部分转换为base64字符串，以防止从ipcMain-ipcRender传输时不支持
    const handleBinarys=(data)=>{
        const binCnt = data[ipcClient.binDatasKey]?.length ?? 0;
        for (let i = 0; i < binCnt; ++i) {
            data[ipcClient.binDatasKey][i]=data[ipcClient.binDatasKey][i].toString("base64");
        }
        return data;
    };

    return (async()=>{
        try {
            const resp = await fun(req);
            return [null, handleBinarys(resp)];
        }catch (e){
            return [handleBinarys(e), null];
        }
    })();
};


const init=(_mainWindow)=>{
    return new Promise((res,rej)=>{
        // 启动后台程序作为子进程，增加命令行参数以便启动完成后打印到控制台上
        const readySymbol= crypto.randomUUID().replace(/[-]/g,'');
        const reg = new RegExp(`.*${readySymbol}(.+?)${readySymbol}.*`);
        const assistProcess= spawn(
            backendExePath,
            [
                `-ready_symbol=${readySymbol}`,
            ],
        );


        if(assistProcess && assistProcess.stdout){
            const maxBufferCnt=8;
            const stdoutBuffer=[];

            const appendBuf=(str)=>{
                if(stdoutBuffer.length>=maxBufferCnt){
                    stdoutBuffer.shift();
                }
                stdoutBuffer.push(str);
                return stdoutBuffer.join("");
            };

            const assistListener=(data)=>{
                if(!(data instanceof Buffer)){
                    return;
                }
                const strData = data.toString("utf-8");
                const sumBugStr = appendBuf(strData);
                const match = sumBugStr.match(reg);
                // 找到readySymbol包裹的内容，按base64解码、JSON.parse，得到服务器信息对象
                // {"Pid":18728,"PipeFullName":"\\\\.\\pipe\\gmap_1692297950985184800"}
                // 原来方式为只判断readySymbol，再从指定文件中读取服务器信息，现在不经过文件，直接从控制台读取
                if(match && match[1]){
                    assistProcess.stdout.removeListener("data", assistListener);
                    const serverInfo=JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));
                    console.log("serverInfo", Buffer.from(match[1], 'base64').toString('utf8'));
                    regRpcSvcToIpc(serverInfo, res);
                }
            };
            assistProcess.stdout.on("data", assistListener);
        }
    });
};

module.exports={
    init,
}