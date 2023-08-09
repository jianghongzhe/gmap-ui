const { app, BrowserWindow, Menu} = require('electron');
const path = require('path');
const fs = require('fs');

const mainSvc = require('./mainSvc');
const settingSvc = require('./settingSvc');
const oplogSvc = require('./oplogSvc');
const appSvc= require('./appSvc');
const rpcSvc= require('./rpcSvc');
const findInPageSvc= require('./findInPageSvc');
const toastSvc= require('./toastSvc');
const common=require('./common');


/**
 * 启动窗口
 */
let splashWindow=null;

/**
 * 主窗口
 */
let mainWindow = null;


app.commandLine.appendSwitch("--disable-http-cache");

/**
 * 主体功能主页的地址
 */
const mainPageIndexPath=path.join(__dirname, "../", "build", "index.html");

/**
 * 启动页的地址
 */
const splashPageIndexPath=path.join(__dirname, "../", "splash", "index.html");


// /**
//  * 创建启动页窗口并加载内容
//  */
// const createSplashWindow=()=>{
//     splashWindow = new BrowserWindow({
//         width: 800,
//         height: 600,
//         frame: false,
//         center: true,
//         movable: false,
//         resizable: false,
//         show: true,
//         skipTaskbar: true,
//         webPreferences: {
//             nodeIntegration: true,
//             enableRemoteModule: true,
//             contextIsolation: false,
//         }
//     });
//     splashWindow.loadFile(splashPageIndexPath);
// };

/**
 * 创建主窗口但不加载首页
 */
const createWindow=()=>{
    //在非开发模式禁用系统菜单；开发模式则显示默认菜单，方面调试
    if (!common.isDevMode()) {
        Menu.setApplicationMenu(null);
    }

    //创建主窗口
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900 - 100,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
        }
    });

    
    // 由于toast窗口不是主窗口的子窗口，因此主窗口关闭不会自动触发toast窗口关闭，需要手动关闭所有toast窗口，进而触发 window-all-closed，以使应用退出
    // 而findinpage窗口是主窗口的子窗口，会随主窗口关闭而自动关闭，不需要手动处理
    mainWindow.on('closed', function () {
        mainWindow = null;
        toastSvc.closeAllNotifyWins();
    });
}

/**
 * 加载首页：当为开发模式时加载开发服务器地址，否则加载本地文件地址
 */
const loadFirstPage=()=>{
    mainWindow.maximize();
    mainWindow.show();

    if (common.isDevMode()) {
        mainWindow.loadURL(common.getDevServerUrl());
    } else {
        mainWindow.loadFile(mainPageIndexPath);
    }
}


/**
 * 程序初始化：
 * 1、创建启动页窗口
 * 2、创建主窗口（不加载首页）
 * 3、初始化主服务和查找窗口服务
 * 4、加载首页
 * 5、关闭启动页窗口
 */
app.on('ready', () => {   
    (async()=>{
        //createSplashWindow();
        if(app.setAppUserModelId){
            app.setAppUserModelId("GMap");
        }
        createWindow();

        const allSvcs=[
            settingSvc,
            oplogSvc,
            appSvc,
            rpcSvc,
            mainSvc,
            findInPageSvc,
            toastSvc,
        ];
        for (const eachSvc of allSvcs) {
            await eachSvc.init(mainWindow);
        }
        for (const eachSvc of allSvcs) {
            if(eachSvc.postInit){
                await eachSvc.postInit();
            }
        }
        loadFirstPage();
    })();
});


app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});


app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

process.on('uncaughtException', (err, origin) => {
    const msg=`Caught exception: ${err}\nException origin: ${origin}`;
    common.log(msg);
});

