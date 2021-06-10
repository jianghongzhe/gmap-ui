
const { app, BrowserWindow, Menu} = require('electron');
const mainSvc = require('./mainSvc');
const findInPageSvc= require('./findInPageSvc');
const fs = require('fs');

require('@electron/remote/main').initialize();

let mainWindow = null;

app.commandLine.appendSwitch("--disable-http-cache");




const createWindow=()=>{
    //在非开发模式禁用系统菜单；开发模式则显示默认菜单，方面调试
    if (!app.isDevMode()) {
        Menu.setApplicationMenu(null);
    }

    //创建主窗口
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900 - 100,
        show: false,
        webPreferences: {
            //preload: path.join(__dirname, 'preload.js')
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
        }
    });
    mainWindow.maximize();
    mainWindow.show();

    mainWindow.on('closed', function () {
        mainWindow = null;
    })
}


const loadFirstPage=()=>{
    if (app.isDevMode()) {
        mainWindow.loadURL(app.getDevServerUrl());
    } else {
        mainWindow.loadFile(__dirname + '\\build\\index.html');
    }
}


app.on('ready', () => {    
    //初始化：即创建工作目录等
    mainSvc.init();

    // 把业务类暴露的接口附加到app对象上，让渲染进程调用
    for (let key in mainSvc) {
        if('init'===key){
            continue;//初始化方法不向外界暴露，只在这里（主进程）执行一次
        }
        app[key] = mainSvc[key];
    }
    
    //创建主窗口
    createWindow();

    //依赖主窗口的服务进行初始化
    app.selPicFile = app.selPicFile.bind(app,mainWindow);
    app.openDevTool=app.openDevTool.bind(app,mainWindow);
    app.reloadAppPage=app.reloadAppPage.bind(app,mainWindow);
    app.openSaveFileDlg=app.openSaveFileDlg.bind(app,mainWindow);
    app.isMaximized=app.isMaximized.bind(app,mainWindow);


    findInPageSvc.init(app, mainWindow)

    
    
    


    
    if(app.isDevMode() && app.hasDevToolExtension()){
        const extPath=app.getDevToolExtensionUrl();
        BrowserWindow.addDevToolsExtension(extPath);
    }
    

    //加载初始页
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
    fs.appendFileSync(
        __dirname+"\\log.txt",
        `Caught exception: ${err}\nException origin: ${origin}\n\n`,
        'utf-8'
    );
});

