
const { app, BrowserWindow, Menu, shell } = require('electron');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const path = require('path');
const mainSvc= require('./mainSvc');

let mainWindow = null;


/**
 * 把业务类暴露的接口附加到app对象上，让渲染进程调用
 */
for(let key in mainSvc){
    app[key]=mainSvc[key];
}


function createWindow() {
    //在非开发模式禁用系统菜单；开发模式则显示默认菜单，方面调试
    if (!isDevMode()) {
        Menu.setApplicationMenu(null);
    }

    //创建主窗口
    mainWindow = new BrowserWindow({
        width: 1440 ,
        height: 900-100,
        show: false,
        webPreferences: {
            //preload: path.join(__dirname, 'preload.js')
            nodeIntegration: true
        }
    });
    mainWindow.maximize();
    mainWindow.show();

    //在开发模式显示环境变量表示的开发服务器的地址，部署模式加载实际的静态资源位置
    if (isDevMode()) {
        mainWindow.loadURL(process.env.DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(__dirname + '\\build\\index.html');
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    })
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});



/**
 * 通过环境变量判断当前是否为开发模式
 */
const isDevMode = () => (process && process.env && process.env.DEV_SERVER_URL);