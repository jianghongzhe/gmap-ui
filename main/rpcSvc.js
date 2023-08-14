const crypto= require("crypto");
const { spawn} = require('child_process');
const path=require("path");
const fs = require("fs");

const common = require('./common');
const ipcClient= require("./ipc_client");

const {
    backendExePath,
    workPath,
}=require("./consts");






/**
 * 把rpc服务注册到electron ipc，以便被前端调用
 */
const regRpcSvcToIpc=(res)=>{
    // {"Pid":17252, "PipeFullName":'xxx'}
    let server_info=JSON.parse(fs.readFileSync(path.join(workPath, 'backend_info'), 'utf-8'));
    const opt={
        reqCompress:     false,
        reqCompressLev:  0,
        respCompress:    false,
        hasErr:          (json)=>0!==json.State
    };
    ipcClient.connectToIpcServer( server_info.PipeFullName, opt).then(()=>{
        common.log(`connected to backend service on pipe: ${server_info.PipeFullName}`, true);
        common.regSyncAndAsyncIpcHandlers({
            ipc: ipcClient.sendReq,
        });
        res();
    });
};



const init=(_mainWindow)=>{
    return new Promise((res,rej)=>{
        // 启动后台程序作为子进程，增加命令行参数以便启动完成后打印到控制台上
        const readySymbol= crypto.randomUUID().replace(/[-]/g,'');
        const assistProcess= spawn(
            backendExePath,
            [
                `-ready_symbol=${readySymbol}`,
            ],
        );


        if(assistProcess && assistProcess.stdout){
            const maxBufferCnt=5;
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

                // 控制台输出内容可能分多次回调：
                // 因此除了判断当前回调结果中有无启动完成标识符，还要判断最近N次结果拼串后是否包含，以免标识符被拆到多次回调结果中（类似tcp半包的方式）
                if(strData.includes(readySymbol) || appendBuf(strData).includes(readySymbol)){
                    assistProcess.stdout.removeListener("data", assistListener);
                    regRpcSvcToIpc(res);
                }
            };
            assistProcess.stdout.on("data", assistListener);
        }
    });
};

module.exports={
    init,
}