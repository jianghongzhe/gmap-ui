const { app, BrowserWindow, Menu, shell,dialog } = require('electron');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const path = require('path');


//工作区目录
const mapsPath=path.join(__dirname,'gmaps');
const imgsPath=path.join(__dirname,'gmaps','imgs');




//===========暴露的接口================================================

/**
 * 计算图片在导图文件文本中的路径
 * 复制指定的图片文件到图片目录，并返回相对于当前图导文件的相对路径
 * @param {*} picFullpath 
 * @param {*} showName 
 * @param {*} currGraphFullpath
 * @returns 
 */
const copyPicToImgsDir=(fromPicFullpath,showName,currGraphFullpath)=>{
    let toPicFullPath=getImgsPath(showName);   //图片另存到本地的绝对路径
    fs.copyFileSync(fromPicFullpath,toPicFullPath);//图片另存到本地
    let graphDir=path.dirname(currGraphFullpath);//导图所在目录

    //计算从导图所在目录到图片的相对路径
    let relapath=toSlash(path.relative(graphDir,toPicFullPath).trim());
    if(!(relapath.startsWith('./') || relapath.startsWith('../'))){
        relapath="./"+relapath;
    }
    return relapath;
}

/**
 * 计算图片实际的本地url路径
 * 计算指定导图文件按某相对路径解析后的绝对路径，返回file协议的字符串
 * @param {*} graphFileFullpath 
 * @param {*} picRelaPath 
 */
const calcPicUrl=(graphFileFullpath,picRelaPath)=>{
    //开发模式返回favicon图标
    if(isDevMode()){
        return getDevServerUrl().trim()+"/favicon.ico";
    }

    //部署模式计算真实本地url
    let currGraphDir=path.dirname(graphFileFullpath);//当前图表文件的目录
    let picFullpath=path.resolve(currGraphDir,picRelaPath);
    return getFileProtocalUrl(picFullpath);
}



/**
 * 获得当前路径每项的数组，基于图表文件根目录
 * @param {*} assignedDir 
 */
const getPathItems=(assignedDir = null)=>{
    let mapsDir=getMapsPath();
    let currDir=(assignedDir ? assignedDir : mapsDir);
    let items=[];

    //当前就在图表根目录
    if(currDir===mapsDir){
        items.push({
            showname:null,
            fullpath:null,
            ishome:true,
            iscurr:true,
        });
        return items;
    }

    //当前不在图表根目录
    //先加根目录一层
    items.push({
        showname:null,
        fullpath:null,
        ishome:true,
        iscurr:false,
    });

    //再循环添加每一层
    try{
        let pathitems=toSlash(path.relative(mapsDir,currDir).trim()).split("/");
        let len=pathitems.length;
        let accumulatePath=mapsDir;//从图片根目录开始累计
        for(let i=0;i<len;++i){
            accumulatePath=path.join(accumulatePath,pathitems[i]);//当前层累计的路径
            items.push({
                showname:pathitems[i],
                fullpath:accumulatePath,
                ishome:false,
                iscurr:i===len-1,
            });
        }
    }catch(e){
        console.error(e);
    }
    return items;
}


/**
 * 列出所有匹配的文件： .md 并且不是readme.md
 */
const listFiles = (assignedDir = null) => {    
    let currDir=(assignedDir ? assignedDir : getMapsPath());
    let imgsDir=getImgsPath();
    let basepath=getMapsPath();
    let ret=[];

    try{
        ret= fs.readdirSync(currDir, { withFileTypes: true }).filter(ent => {
            let handledFN = ent.name.toLowerCase().trim();
            return ('readme.md' !== handledFN && ".git" !== handledFN) && ((ent.isFile() && handledFN.endsWith(".md")) || !ent.isFile());//不是readme文件，且不是git目录，且是目录或是md文件
        }).sort((item1,item2)=>{
            let ord1= item1.isFile()?1:0;
            let ord2= item2.isFile()?1:0;
            //目录在文件前
            if(ord1!==ord2){
                return ord1-ord2;
            }
            //眼前类型则按文件名比较
            if(item1.name!==item2.name){
                return item1.name.toLowerCase().trim()<item2.name.toLowerCase().trim() ? -1 : 1;
            }
            return 0;
        }).map(ent => {
            let fullpath =path.resolve(currDir,ent.name);
            let isfile = ent.isFile();
            let isEmptyDir=false;
            if(!isfile){
                isEmptyDir=(0===fs.readdirSync(fullpath, { withFileTypes: true }).length);//如果是目录则看是否为空目录
            }
            return {
                name:       ent.name,
                itemsName:  path.relative(basepath,fullpath),
                fullpath:   fullpath,
                isfile:     isfile,
                emptyDir:   isEmptyDir,
                size:       (isfile ? fs.statSync(fullpath).size : 0)
            };
        }).filter(each=>each.fullpath!==imgsDir);//不包括图片目录
    }catch(e){
        console.error(e);
    }
    return ret;
};


/**
 * 全路径是否存在
 * @param {*} fullpath 
 */
const existsFullpath=(fullpath)=>{
    return fs.existsSync(fullpath);
}


/**
 * 图片是否存在
 * @param {*} picName 
 */
const existsPic=(picName)=>{
    let picFullpath=getImgsPath(picName);
    return fs.existsSync(picFullpath);
}


/**
 * 判断指定导图文件名是否存在，以getMapsPath()表示的目录为基础
 * @param {*} fn 文件名或带相对路径的文件名，eg. aa   xx/yy/bb.md  mm/nn
 * @returns 如果存在，返回true，否则返回[文件名或带相对路径的文件名，主题名称，全路径]
 */
const existsGraph = (fn) => {
    //保证扩展名为.md
    fn=fn.trim();   
    if (".md"!==path.extname(fn).trim().toLowerCase()) {
        fn+=".md";
    }
    
    //
    let themeName=path.basename(fn,path.extname(fn));//提取主题名称
    let fullpath = getMapsPath(fn);//绝对路径用反扛
    if (fs.existsSync(fullpath)) {
        return true;
    }
    return [toSlash(fn),themeName, fullpath];
}

/**
 * 打开指定地址，可能是网址或是本地file://协议的资源
 * @param {*} url 
 */
const openUrl=(url)=>{
    shell.openExternal(url);
}

const openPicByName=(picName)=>{
    let url=getFileProtocalUrl(getImgsPath(picName));
    shell.openExternal(url);
}

/**
 * 读取文件内容，以utf-8编码读取
 * @param {*} fullpath 全路径
 * @returns 文件内容
 */
const readFile = (fullpath) => {
    try{
        if(!fs.existsSync(fullpath)){
            return {
                succ: false,
                msg: "文件不存在，无法打开"
            };
        }
        return fs.readFileSync(fullpath, 'utf-8');
    }catch(e){
        return {
            succ: false,
            msg: "读取文件失败，请确认文件存在"
        };
    }
}

/**
 * 写入文件内容，以utf-8编码写入
 * @param {*} fullpath 全路径
 * @param {*} content 内容
 */
const saveFile = (fullpath, content) => {
    try{
        let dir=path.dirname(fullpath);
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir,{recursive:true});
        }
        fs.writeFileSync(fullpath, content, 'utf-8');
        return true;
    }catch(e){
        return {
            succ: false,
            msg: "写入文件失败，请稍后重试"
        };
    }
}


const selPicFile = (mainWindow) => {
    return dialog.showOpenDialogSync(mainWindow, { 
        properties: ['openFile'],
        filters: [
            { name: '图片', extensions: 'bmp,jpg,jpeg,png,gif,svg,webp'.split(',') },
            { name: '所有', extensions: ['*'] }
        ]
    });
}


/**
 * 打开图表目录
 */
const openMapsDir = () => {
    let mapsPath = getMapsPath();
    let url =getFileProtocalUrl(mapsPath); //转换为file协议的url
    shell.openExternal(url, {
        workingDirectory: mapsPath
    })
}

/**
 * 在图表目录打开bash，以方便git提交
 */
const openGitBash = () => {
    let time = ""+new Date().getTime();
    spawn(
        'cmd.exe',
        ['/c', `start "GMap_${time}" bash`],
        {
            shell: true,           //使用shell运行
            cwd: getMapsPath()   //当前目录为图表文件目录
        }
    );
}

const openDevTool=(mainWindow)=>{
    mainWindow.webContents.openDevTools({detach:true});
}


/**
 * 初始化工作：
 * 创建工作目录与图片目录
 */
const init=()=>{
    [imgsPath].forEach(eachWorkdir=>{
        if(!fs.existsSync(eachWorkdir)){
            fs.mkdirSync(eachWorkdir,{recursive:true});
        }
    });
}





//===========工具方法  ================================================
/**
 * 把路径中的所有斜扛全部换为正斜扛 /
 * @param {*} path 
 */
const toSlash=(path)=>(path.trim().replace(/\\/g,'/'));

/**
 * 把路径中的所有斜扛全部换为反斜扛 \
 * @param {*} path 
 */
const toBackSlash=(path)=>(path.trim().replace(/[/]/g,'\\'));

/**
 * 把本地全路径转换成file协议的url
 * @param {*} fullpath 全路径
 */
const getFileProtocalUrl=(fullpath)=>("file:///"+toSlash(fullpath.trim()));

/**
 * 获取图形文件所在目录或文件全路径
 * @param {*} fn 如果未提供此参数表示取所在目录，否则表示该文件的全路径
 */
const getMapsPath = (fn = null) => toBackSlash((fn ? path.join(mapsPath,fn) : mapsPath).trim());

/**
 * 获取图片文件所在目录或文件全路径
 * @param {*} fn 如果未提供此参数表示取所在目录，否则表示该文件的全路径
 */
const getImgsPath = (fn = null) => toBackSlash((fn ? path.join(imgsPath,fn) : imgsPath).trim());



/**
 * 通过环境变量判断当前是否为开发模式
 */
const isDevMode = () => (process && process.env && process.env.DEV_SERVER_URL);

/**
 * 获得开发模式的主页访问地址
 */
const getDevServerUrl=()=>{
    if(isDevMode()){
        return process.env.DEV_SERVER_URL;
    }
    return '';
}


module.exports={
    //初始化
    init,

    //文件操作：读写、判断存在性、列表等
    existsPic, 
    existsGraph, 
    existsFullpath,
    readFile,
    saveFile, 
    getPathItems, 
    listFiles,

    //图片相关操作
    copyPicToImgsDir,
    calcPicUrl,
    selPicFile,//使用操作系统对话框

    //打开外部资源：导图目录、bash控制台、网页链接或本地file协议资源、图片等
    openMapsDir, 
    openGitBash, 
    openUrl, 
    openPicByName,

    //杂项
    openDevTool,
    isDevMode,
    getDevServerUrl,

    
    
    
};