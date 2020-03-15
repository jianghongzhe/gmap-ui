const { app, BrowserWindow,Menu } = require('electron');
const fs=require('fs');
const path = require('path');

let mainWindow = null;



//===============暴露的接口==================================================================
/**
 * 列出所有匹配的文件： .md 并且不是readme.md
 */
app.listFiles=()=>{
    return fs.readdirSync(getMapsPath()).filter(fn=>{
        let handledFN=fn.toLowerCase().trim();
        return handledFN!=='readme.md' && handledFN.endsWith(".md");
    }).map(fn=>{
        let fullpath=getMapsPath(fn);
        return {
            name:       fn,
            fullpath:   fullpath,
            size:       fs.statSync(fullpath).size
        };
    });
};

/**
 * 判断指定文件名是否存在，以getMapsPath()表示的目录为基础
 * @param {*} fn 文件名
 * @returns 如果存在，返回true，否则返回[文件名，全路径]
 */
app.exists=(fn)=>{
    let handledFN=fn.toLowerCase().trim();
    if(!handledFN.endsWith(".md")){
        fn+=".md";
    }
    let fullpath=getMapsPath(fn);
    if(fs.existsSync(fullpath)){
        return true;
    }
    return [fn,fullpath];
}

/**
 * 读取文件内容，以utf-8编码读取
 * @param {*} fullpath 全路径
 * @returns 文件内容
 */
app.readFile=(fullpath)=>{
    return fs.readFileSync(fullpath,'utf-8');
}

/**
 * 写入文件内容，以utf-8编码写入
 * @param {*} fullpath 全路径
 * @param {*} content 内容
 */
app.saveFile=(fullpath,content)=>{
    fs.writeFileSync(fullpath,content,'utf-8');
}

// app.openGitBash=()=>{
//     let basedir="";
//     if(process.env.DEV_SERVER_URL){
//         basedir=__dirname;
//     }else{
//         basedir=__dirname;
//     }
//     let cmdPath=basedir+"\\opengitbash_"+new Date().getTime()+".cmd";
//     fs.writeFileSync(cmdPath,'cd /d "'+getMapsPath()+'" && bash','utf-8');
//     //childproc.execFile(cmdPath);
// }


/**
 * 获取图形文件所在目录或文件全路径
 * __dirname在开发模式下为工程目录，在部署后表示 %electron_home%/resources/app 目录
 * 在开发模式下为
 * @param {*} fn 如果未提供此参数表示取所在目录，否则表示该文件的全路径
 */
const getMapsPath=(fn=null)=>(__dirname+'\\gmaps'+(fn ? "\\"+fn : ""));

/**
 * 通过环境变量判断当前是否为开发模式
 */
const isDevMode=()=>(process && process.env && process.env.DEV_SERVER_URL);


//===============生命周期管理==================================================================
function createWindow() {
    //在非开发模式禁用系统菜单；开发模式则显示默认菜单，方面调试
    if(!isDevMode()){
        Menu.setApplicationMenu(null);
    }

    //创建主窗口
    mainWindow = new BrowserWindow({
        //width: 1920,
        //height: 1080,
        show: false,
        webPreferences: {
            //preload: path.join(__dirname, 'preload.js')
            nodeIntegration: true
        }
    });
    mainWindow.maximize();
    mainWindow.show();

    //在开发模式显示环境变量表示的开发服务器的地址，部署模式加载实际的静态资源位置
    if(isDevMode()){
        mainWindow.loadURL(process.env.DEV_SERVER_URL);
    }else{
        mainWindow.loadFile(__dirname+'\\build\\index.html');
    }
    
    mainWindow.on('closed', function () {
        mainWindow = null;
    })
}




app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});