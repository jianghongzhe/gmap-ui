const crypto= require("crypto");
const { spawn} = require('child_process');

const path=require("path");

const grpc = require('./node_modules/@grpc/grpc-js');
const protoLoader = require('./node_modules/@grpc/proto-loader');

const common = require('./common');

const {
    backendExePath,
    protoPath,
    workPath,
}=require("./consts");
const fs = require("fs");


const DEFAULT_CLIENT_CONFIG={
    "grpc.keepalive_time_ms": 30_000,
    "grpc.keepalive_timeout_ms": 20_000,
    "grpc.keepalive_permit_without_calls": 1,
};


/**
 * 把rpc服务注册到electron ipc，以便被前端调用
 */
const regRpcSvcToIpc=()=>{
    // {"pid":17252,"connectUrl":"localhost:56790"}
    const server_info=JSON.parse(fs.readFileSync(path.join(workPath,'backend_info'),'utf-8'));

    // 加载proto配置信息：
    // 用正则取出其中的包名、服务名等信息
    const rpcConfig=fs.readdirSync(protoPath, { withFileTypes: true })
        .filter(ent => (ent.isFile() && ent.name.endsWith(".proto")))
        .map(ent=>{
            const fullProtoPath=path.join(protoPath, ent.name);
            const lines = fs.readFileSync(fullProtoPath, "utf-8")
                .replace(/\r/g,'')
                .split("\n")
                .map(t=>t.trim());

            let svcName=null;
            let packageName=null;
            let methodNames=[];
            lines.forEach(line=>{
                // service EncService {
                let matches= line.match(/^service[\s]+([a-zA-Z0-9_]+)[\s]*[{]$/);
                if(matches && matches[1] && !svcName){
                    svcName=matches[1];
                }
                // package rpc;
                matches= line.match(/^package[\s]+([a-zA-Z0-9_]+)[\s]*[;]$/);
                if(matches && matches[1] && !packageName){
                    packageName=matches[1];
                }
                // rpc Encrypt (rpc.TxtMsg) returns (rpc.TxtMsg) {}
                matches= line.match(/^rpc[\s]+([a-zA-Z0-9_]+)[\s]*[(].+$/);
                if(matches && matches[1]){
                    methodNames.push(matches[1]);
                }
            });

            if(0<methodNames.length){
                return {
                    protoFileName: fullProtoPath,
                    svcName: svcName,
                    methods: methodNames,
                    packageName,
                };
            }
            return null;
        }).filter(item=>null!==item);

    // 注册ipc函数
    const ipcHandlers= rpcConfig.reduce((accu, {protoFileName,svcName, methods, packageName,})=>{
        const packageDef = protoLoader.loadSync(
            protoFileName,
            {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
            }
        );
        const protoDesc = grpc.loadPackageDefinition(packageDef)[packageName];
        const client = new protoDesc[svcName](server_info.connectUrl, grpc.credentials.createInsecure(), DEFAULT_CLIENT_CONFIG);

        // 之前使用client[m]整体bind，结果无法正常访问，一度怀疑服务端的问题，结果是js函数this指向的问题；
        // 改为client和m分开绑定后，实际函数调用时为client.m方式，this指向client，不再出错，为了保险，现在改为.call方式，手动传入this指向
        // 注册的ipc加高名称为：服务名_方法名
        methods.forEach(m=> accu[`${svcName}_${m}`]=stub.bind(this, client[m], client));
        return accu;
    }, {});
    common.regSyncAndAsyncIpcHandlers(ipcHandlers);
};


const stub=(fun, scope, ...args)=>{
    return new Promise((res, rej)=>{
        fun.call(scope, args[0], (err,resp)=>{
            if(err){
                rej(err);
                return;
            }
            res(resp);
        });
    });
};



const init=(_mainWindow)=>{
    return new Promise((res,rej)=>{
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
                    regRpcSvcToIpc();
                    res();
                    return;
                }
            };
            assistProcess.stdout.on("data", assistListener);
        }


    });
};

module.exports={
    init,
}