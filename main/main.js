const { app, BrowserWindow, Menu} = require('electron');
const mainSvc = require('./mainSvc');
const findInPageSvc= require('./findInPageSvc');
const path = require('path');
const fs = require('fs');

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
 * 工作目录
 */
const mainWorkDir=path.join(__dirname, "../", "work");

/**
 * 创建主窗口但不加载首页
 */
const createWindow=()=>{
    //在非开发模式禁用系统菜单；开发模式则显示默认菜单，方面调试
    if (!mainSvc.isDevMode()) {
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
 * 加载首页
 */
const loadFirstPage=()=>{
    if (app.isDevMode()) {
        mainWindow.loadURL(app.getDevServerUrl());
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

    //创建主窗口
    createWindow();

    //初始化：即创建必须的目录、启动助手监听程序等
    mainSvc.init(mainWindow);

    // 把业务类暴露的接口附加到app对象上，让渲染进程调用
    for (let key in mainSvc) {
        if('init'===key){
            continue;//初始化方法不向外界暴露，只在这里（主进程）执行一次
        }
        app[key] = mainSvc[key];
    }
    
    

    //依赖主窗口的服务进行初始化
    app.selPicFile = app.selPicFile.bind(app,mainWindow);
    app.openDevTool=app.openDevTool.bind(app,mainWindow);
    app.reloadAppPage=app.reloadAppPage.bind(app,mainWindow);
    app.openSaveFileDlg=app.openSaveFileDlg.bind(app,mainWindow);
    app.isMaximized=app.isMaximized.bind(app,mainWindow);


    findInPageSvc.init(mainWindow, mainSvc.isDevMode());

    
    
    


    
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
    const now=new Date();
    const m=now.getMonth()+1;
    const d=now.getDate();
    const ymd=`${now.getFullYear()}-${m<10 ? "0"+m : m}-${d<10 ? "0"+d : d}`;

    const localpath=path.join(mainWorkDir, `main_${ymd}.log`);
    fs.appendFileSync(
        localpath,
        `Caught exception: ${err}\nException origin: ${origin}\n\n`,
        'utf-8'
    );
});

