const { app, BrowserWindow, Menu} = require('electron');
const path = require('path');
const fs = require('fs');

const mainSvc = require('./mainSvc');
const findInPageSvc= require('./findInPageSvc');
const common=require('./common');

/**
 * 主窗口
 */
let mainWindow = null;


app.commandLine.appendSwitch("--disable-http-cache");

/**
 * 主体功能主页的地址
 */
const mainPageIndexPath=path.join(__dirname, "../", "build", "index.html");;


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

    mainWindow.maximize();
    mainWindow.show();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

/**
 * 加载首页：当为开发模式时加载开发服务器地址，否则加载本地文件地址
 */
const loadFirstPage=()=>{
    if (common.isDevMode()) {
        mainWindow.loadURL(common.getDevServerUrl());
    } else {
        mainWindow.loadFile(mainPageIndexPath);
    }
}


/**
 * 程序初始化：
 * 1、启动主窗口（不加载首页）
 * 2、初始化主服务和查找窗口服务
 * 3、加载首页
 */
app.on('ready', () => {    
    createWindow();
    mainSvc.init(mainWindow);
    findInPageSvc.init(mainWindow);
    loadFirstPage();
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

