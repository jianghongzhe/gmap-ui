const http = require('http');
const fs=require("fs");
const pathapi = require('path');
const common=require("./common");
const {cachePath}=require("./consts");

const PORT=56666;

/**
 * 处理缓存文件查询 /cache/abc/png
 * 读取缓存目录下对应文件
 * @type {{canHandle: (function(*): *), handle: cacheHandler.handle}}
 */
const cacheHandler={
    canHandle: (url)=>url.startsWith("/cache/"),
    handle: (req, resp)=>{
        const path= pathapi.join(cachePath, common.trimPrefs(req.url, ["/cache/"]).trim());
        if(!fs.existsSync(path)){
            resp.writeHeader(404, {});
            resp.end();
            return;
        }
        let mime="image/jpeg";
        if(path.toLowerCase().endsWith(".svg")){
            mime="image/svg+xml";
        }
        if(path.toLowerCase().endsWith(".png")){
            mime="image/png";
        }
        if(path.toLowerCase().endsWith(".gif")){
            mime="image/gif";
        }
        const buffer = fs.readFileSync(path);
        resp.writeHeader(200, {"Content-Type":mime,});
        resp.write(buffer);
        resp.end();
    },
};

const allHandlers=[
    cacheHandler,
];


/**
 * 转换缓冲文件的本地路径url为http格式，对应的http服务由开发服务器提供
 * file:///d:/gmap/cache/abc.png -> http://localhost:56666/cache/abc.png
 * @param fileUrl
 */
const convertCacheUrlFileToHttp=(fileUrl)=>{
    fileUrl=fileUrl.replace(/\\/g, "/");
    const subPath= fileUrl.substring(fileUrl.indexOf("/cache/")).trim();
    return `http://localhost:${PORT}${subPath}`;
};


/**
 * 初始化开发服务器：
 * 在生产环境下不会启动，在开发环境下启动以把file://协议转换为http://协议
 * @return {Promise<unknown>}
 */
const init=()=>{
    return new Promise((res, rej)=>{
        if(!common.isDevMode()){
            res();
            return;
        }
        http.createServer((req, resp)=>{
            let foundHandler=false;
            for (let handler of allHandlers) {
                if(!handler.canHandle(req.url)){
                    continue;
                }
                foundHandler=true;
                handler.handle(req, resp);
                break;
            }
            if(!foundHandler){
                resp.writeHeader(404, {});
                resp.end();
            }
        }).listen(PORT);
        console.log(`dev server started as port: ${PORT}`);
        res();
    });
};




module.exports={
    init,
    convertCacheUrlFileToHttp,
};