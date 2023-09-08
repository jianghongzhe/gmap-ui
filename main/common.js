const path = require('path');
const fs = require('fs');
const { ipcMain   } = require('electron');


const {BACK_SLASH, SLASH} = require("./consts");






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

const saveJsonToFile=(json, path)=>{
    const str=('string'===typeof(json) ? json : JSON.stringify(json, null, 4));
    fs.writeFileSync(path, str, 'utf-8');
};

const readJsonFromFile=(path)=>{
    return JSON.parse(fs.readFileSync(path, 'utf-8'));
};


const toSlash=(path)=>(path.trim().replace(/\\/g,SLASH));

const wrapFileProtocol=(fullpath, encode=false)=>{
    let url="file:///"+toSlash((fullpath??'').trim());
    if(true===encode){
        url=encodeURI(url);
    }
    return url;
};


/**
 * 异步方法的代理
 * @param {*} handler
 * @param {*} evt
 * @param  {...any} args
 * @returns
 */
const delegateHandler=async (handler, evt, ...args)=>{
    const result = await handler(...args);
    return result;
};

/**
 * 同步方法的代理
 * @param {*} handler
 * @param {*} evt
 * @param  {...any} args
 */
const delegateHandlerSync=(handler, evt, ...args)=>{
    (async()=>{
        const result=await handler(...args);
        evt.returnValue=result;
    })();
};


const directGrpcCall={};


/**
 * 注册异步ipc处理器
 */
const regIpcHandlers=(ipcHandlers)=>{
    for(let key in ipcHandlers){
        const bindedHandler=delegateHandler.bind(this, ipcHandlers[key]);
        ipcMain.handle(key, bindedHandler);
        directGrpcCall[key]=ipcHandlers[key];
    }
};


/**
 * 注册同步ipc处理器
 */
const regIpcHandlersSync=(ipcHandlers)=>{
    for(let key in ipcHandlers){
        const bindedHandler = delegateHandlerSync.bind(this, ipcHandlers[key]);
        ipcMain.on(key+"Sync", bindedHandler);
    }
};


const regSyncAndAsyncIpcHandlers=(ipcHandlers)=>{
    regIpcHandlers(ipcHandlers);
    regIpcHandlersSync(ipcHandlers);
};



const trimPrefs=(txt="", prefs=[])=>{
    return prefs.reduce((accu, pref)=>{
        accu=accu.trim();
        if(accu.startsWith(pref)){
            accu=accu.substring(pref.length).trim();
        }
        return accu;
    },txt.trim());
};



module.exports={
    log,
    getYmdhms,
    dirCopy,
    isDevMode,
    getDevServerUrl,
    getDevServerFaviconUrl,
    saveJsonToFile,
    readJsonFromFile,
    wrapFileProtocol,
    // regIpcHandlers,
    // regIpcHandlersSync,
    regSyncAndAsyncIpcHandlers,
    directGrpcCall,
    trimPrefs,
};