const { app, BrowserWindow, Menu, shell,dialog } = require('electron');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const path = require('path');



//===========暴露的接口================================================

/**
 * 复制选择的图片文件到图片目录，并返回相对于当前图表文件的相对路径
 * @param {*} picFullpath 
 * @param {*} showName 
 * @param {*} currGraphFullpath
 * @returns 
 */
const copyPicToImgsDir=(picFullpath,showName,currGraphFullpath)=>{
    let destPath=getMapsPath("imgs\\"+showName);
    let basePath=getMapsPath();
    fs.copyFileSync(picFullpath,destPath);

    let ind=currGraphFullpath.lastIndexOf("\\");
    let tmpDir=currGraphFullpath.substring(0,ind);
    let toBaseRelaPath="";
    while(true){
        if(tmpDir===basePath){
            break;
        }
        toBaseRelaPath+="../";
        ind=tmpDir.lastIndexOf("\\");
        tmpDir=currGraphFullpath.substring(0,ind);
    }
    if(""===toBaseRelaPath){
        toBaseRelaPath="./";
    }
    return toBaseRelaPath+"/imgs/"+showName;
}


const calcPicUrl=(graphFileFullpath,picRelaPath)=>{
    //开发模式返回favicon图标
    if(isDevMode()){
        return getDevServerUrl().trim()+"/favicon.ico";
    }

    //部署模式计算真实本地url
    let ind1=graphFileFullpath.lastIndexOf("/");
    let ind2=graphFileFullpath.lastIndexOf("\\");
    let ind=(ind1>=0?ind1:ind2);
    let currGraphDir=graphFileFullpath.substring(0,ind);//当前图表文件的目录
    let picFullpath=path.resolve(currGraphDir,picRelaPath);
    return "file:///"+picFullpath.replace(/\\/g,'/');
}

/**
 * 获得当前路径每项的数组，基于图表文件根目录
 * @param {*} assignedDir 
 */
const getPathItems=(assignedDir = null)=>{
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
const listFiles = (assignedDir = null) => {    
    

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
        let isEmptyDir=false;
        if(!isfile){
            isEmptyDir=(0===fs.readdirSync(fullpath, { withFileTypes: true }).length);//如果是目录则看是否为空目录
        }
        return {
            name:       ent.name,
            itemsName:  getRelaPath(fullpath,basepath),
            fullpath:   fullpath,
            isfile:     isfile,
            emptyDir:   isEmptyDir,
            size:       (isfile ? fs.statSync(fullpath).size : 0)
        };
    });
};

/**
 * 判断指定文件名是否存在，以getMapsPath()表示的目录为基础
 * @param {*} fn 文件名或带相对路径的文件名，eg. aa   xx/yy/bb.md  mm/nn
 * @returns 如果存在，返回true，否则返回[文件名或带相对路径的文件名，全路径]
 */
const exists = (fn) => {
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
    
    //提取主题名称
    let themeName=fn.substring(0,fn.length-3);//去掉.md
    if(themeName.includes("/")){
        themeName=themeName.substring(themeName.lastIndexOf("/")+1);
    }
    if(themeName.includes("\\")){
        themeName=themeName.substring(themeName.lastIndexOf("\\")+1);
    }

    //
    let fullpath = getMapsPath(fn.replace(/[/]/g,'\\'));//绝对路径用反扛
    if (fs.existsSync(fullpath)) {
        return true;
    }
    return [fn,themeName, fullpath];
}

const openLink=(url)=>{
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
        let ind=fullpath.lastIndexOf("\\");
        let dir=fullpath.substring(0,ind);
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




/**
 * 打开图表目录
 */
const openMapsDir = () => {
    let mapsPath = getMapsPath();
    let url = "file:///" + mapsPath.replace(/\\/g, "/"); //转换为file协议的url
    shell.openExternal(url, {
        workingDirectory: mapsPath
    })
}

/**
 * 在图表目录打开bash，以方便git提交
 */
const openGitBash = () => {
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


//===========工具方法  ================================================
/**
 * 获得相对路径
 * @param {*} fullpath 全路径
 * @param {*} basepath 基路径
 */
const getRelaPath=(fullpath,basepath)=>(fullpath.substring(basepath.length+1).replace(/\\/g,"/"));


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

const getDevServerUrl=()=>{
    if(isDevMode()){
        return process.env.DEV_SERVER_URL;
    }
    return '';
}


module.exports={getPathItems, listFiles, exists, readFile, saveFile, openMapsDir, openGitBash, openLink, calcPicUrl,isDevMode,getDevServerUrl,copyPicToImgsDir};