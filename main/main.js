const { app, BrowserWindow, Menu} = require('electron');
const path = require('path');
const fs = require('fs');

const mainSvc = require('./mainSvc');
const settingSvc = require('./settingSvc');
const oplogSvc = require('./oplogSvc');
const appSvc= require('./appSvc');
const findInPageSvc= require('./findInPageSvc');
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

    

    mainWindow.on('closed', function () {
        mainWindow = null;
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
        await settingSvc.init(mainWindow);
        await oplogSvc.init(mainWindow);
        await appSvc.init(mainWindow);
        await mainSvc.init(mainWindow);
        findInPageSvc.init(mainWindow);
        loadFirstPage();    
        //splashWindow.close();
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

