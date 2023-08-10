const { spawn, execFile } = require('child_process');
const fs = require('fs');
const common= require('./common');
const toastSvc=require("./toastSvc")

const {
    mapsPath,
    packageJsonPath,
    autoUpdaterPath,
    autoUpdaterDir,
    icons,
} =require("./consts");

let mainWindow=null;
let appInfoCache=null;

/**
 * 在图表目录打开bash，以方便git提交
 */
const openGitBash = () => {
    const now=new Date();
    const m=now.getMonth()+1;
    const d=now.getDate();
    const ymd=`${now.getFullYear()}-${m<10 ? "0"+m : m}-${d<10 ? "0"+d : d}`;

    spawn(
        'cmd.exe',
        ['/c', `start "GMap_${ymd}" cmd`],
        {
            shell: true,            //使用shell运行
            cwd: mapsPath           //当前目录为图表文件目录
        }
    );
}


/**
 * 加载应用名称版本等信息
 */
const loadAppInfo=()=>{
    if(appInfoCache){
        return appInfoCache;
    }
    // dependencies react antd
    let {name,showname,version,dependencies:{react,antd}}=common.readJsonFromFile(packageJsonPath);
    if(react.startsWith("^")){
        react=react.substring(1);
    }
    if(antd.startsWith("^")){
        antd=antd.substring(1);
    }
    appInfoCache={name,showname,version,react,antd};
    return appInfoCache;
}

const reloadAppPage=()=>{
    mainWindow.webContents.reloadIgnoringCache();
}


const openDevTool=()=>{
    mainWindow.webContents.openDevTools({detach:true});
}




/**
 * 显示系统通知并在一会后自动关闭
 * @param  {...any} args
 * 1个值：消息内容
 * 2个值：标题、内容
 * 3个值：标题、内容、图标类型（succ、err、info、warn）
 */
const showNotification=(...args)=>{
    if(!args || 0==args.length){
        return;
    }

    let title="信息";
    let body="";
    let icon="info";

    if(1==args.length){
        body=args[0];
    }else if(2==args.length){
        title=args[0];
        body=args[1];
    }else if(3<=args.length){
        title=args[0];
        body=args[1];
        icon=args[2];
        if(!icons[icon]){
            icon="info";
        }
    }
    toastSvc.showNotification({
        title,
        txt: body,
        icon,
    })
    //common.send("notify", {pic:icons[icon], title, body }).then();
};


const openUpdateApp=()=>{
    if(!fs.existsSync(autoUpdaterPath)){
        showNotification('未找到自动更新模块', '请安装该模块后再使用', 'err');
        return;
    }
    execFile(autoUpdaterPath, [`${process.pid}`], {cwd: autoUpdaterDir});
    return null;
};





const ipcHandlers={
    loadAppInfo,
    openGitBash,
    reloadAppPage,
    openDevTool,
    openUpdateApp,
    showNotification,
};


const init=(_mainWindow)=>{
    mainWindow=_mainWindow;
    return new Promise((res, rej)=>{
        common.regSyncAndAsyncIpcHandlers(ipcHandlers);
        console.log("appSvc init");
        res();
    });
};


module.exports={
    init,
    showNotification,
};