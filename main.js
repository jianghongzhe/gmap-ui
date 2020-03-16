const { app, BrowserWindow, Menu, shell } = require('electron');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const path = require('path');

let mainWindow = null;



//===============暴露的接口==================================================================
app.getPathItems=(assignedDir = null)=>{
    let mapsDir=getMapsPath();
    let currDir=(assignedDir ? assignedDir : getMapsPath());
    let items=[];

    if(currDir===mapsDir){
        items.push({
            showname:null,
            fullpath:null,
            ishome:true,
            iscurr:true,
        });
        return items;
    }

    items.push({
        showname:null,
        fullpath:null,
        ishome:true,
        iscurr:false,
    });

    let pathitems=currDir.substring(mapsDir.length+1).split("\\");
    let len=pathitems.length;
    let accumulatePath=mapsDir;
    for(let i=0;i<len;++i){
        accumulatePath+="\\"+pathitems[i];
        items.push({
            showname:pathitems[i],
            fullpath:accumulatePath,
            ishome:false,
            iscurr:i===len-1,
        });
    }
    return items;
}


/**
 * 列出所有匹配的文件： .md 并且不是readme.md
 */
app.listFiles = (assignedDir = null) => {    
    let currDir=(assignedDir ? assignedDir : getMapsPath());
    let basepath=getMapsPath();

    return fs.readdirSync(currDir, { withFileTypes: true }).filter(ent => {
        let handledFN = ent.name.toLowerCase().trim();
        return ('readme.md' !== handledFN && ".git" !== handledFN) && ((ent.isFile() && handledFN.endsWith(".md")) || !ent.isFile());
    }).sort((item1,item2)=>{
        let ord1= item1.isFile()?1:0;
        let ord2= item2.isFile()?1:0;
        if(ord1!==ord2){
            return ord1-ord2;
        }
        if(item1.name!==item2.name){
            return item1.name<item2.name ? -1 : 1;
        }
        return 0;
    }).map(ent => {
        let fullpath = (assignedDir?assignedDir+"\\"+ent.name : getMapsPath(ent.name));
        let isfile = ent.isFile();
        return {
            name:       ent.name,
            itemsName:  getRelaPath(fullpath,basepath),
            fullpath:   fullpath,
            isfile:     isfile,
            size:       (isfile ? fs.statSync(fullpath).size : 0)
        };
    });
};

/**
 * 判断指定文件名是否存在，以getMapsPath()表示的目录为基础
 * @param {*} fn 文件名或带相对路径的文件名，eg. aa   xx/yy/bb.md  mm/nn
 * @returns 如果存在，返回true，否则返回[文件名或带相对路径的文件名，全路径]
 */
app.exists = (fn) => {
    //相对路径处理，其中正扛
    fn=fn.trim();
    let handledFN = fn.toLowerCase();
    if (!handledFN.endsWith(".md")) {
        fn+=".md";
    }
    if(fn.startsWith("\\") || fn.startsWith("/")){
        fn=fn.substring(1);
    }
    fn=fn.replace(/\\/g,"/");
    
    //
    let fullpath = getMapsPath(fn.replace(/[/]/g,'\\'));//绝对路径用反扛
    if (fs.existsSync(fullpath)) {
        return true;
    }
    return [fn, fullpath];
}

/**
 * 读取文件内容，以utf-8编码读取
 * @param {*} fullpath 全路径
 * @returns 文件内容
 */
app.readFile = (fullpath) => {
    return fs.readFileSync(fullpath, 'utf-8');
}

/**
 * 写入文件内容，以utf-8编码写入
 * @param {*} fullpath 全路径
 * @param {*} content 内容
 */
app.saveFile = (fullpath, content) => {
    let ind=fullpath.lastIndexOf("\\");
    let dir=fullpath.substring(0,ind);
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir,{recursive:true});
    }
    fs.writeFileSync(fullpath, content, 'utf-8');
}




/**
 * 打开图表目录
 */
app.openMapsDir = () => {
    let mapsPath = getMapsPath();
    let url = "file:///" + mapsPath.replace(/\\/g, "/"); //转换为file协议的url
    shell.openExternal(url, {
        workingDirectory: mapsPath
    })
}

/**
 * 在图表目录打开bash，以方便git提交
 */
app.openGitBash = () => {
    let time = new Date().getTime();
    spawn(
        'cmd.exe',
        ['/c', `start "GMap_${time}" bash`],
        {
            shell: true,           //使用shell运行
            cwd: getMapsPath()   //当前目录为图表文件目录
        }
    );
}


const getRelaPath=(fullpath,basepath)=>{
    return fullpath.substring(basepath.length+1).replace(/\\/g,"/");
}

/**
 * 获取图形文件所在目录或文件全路径
 * __dirname在开发模式下为工程目录，在部署后表示 %electron_home%/resources/app 目录
 * @param {*} fn 如果未提供此参数表示取所在目录，否则表示该文件的全路径
 */
const getMapsPath = (fn = null) => (__dirname + '\\gmaps' + (fn ? "\\" + fn : ""));

/**
 * 通过环境变量判断当前是否为开发模式
 */
const isDevMode = () => (process && process.env && process.env.DEV_SERVER_URL);







//===============生命周期管理==================================================================
function createWindow() {
    //在非开发模式禁用系统菜单；开发模式则显示默认菜单，方面调试
    if (!isDevMode()) {
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
    if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});