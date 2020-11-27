const { app, BrowserWindow, Menu, shell,dialog,clipboard,nativeImage,net   } = require('electron');
const fs = require('fs');
const Url = require('url');
const { exec, spawn, execFile,execFileSync } = require('child_process');
const path = require('path');


//常量：工作区目录、主配置文件位置
const userPngImg=true;//默认是否
const fileRunnerPath=path.join(__dirname,'file_runner.exe');
const mapsPath=path.join(__dirname,'gmaps');
const imgsPath=path.join(__dirname,'gmaps','imgs');
const attsPath=path.join(__dirname,'gmaps','atts');
const workPath=path.join(__dirname,'work');
const packageJsonPath=path.join(__dirname,'package.json');
const SLASH='/';
const BACK_SLASH='\\';





let appInfoCache=null;


//===========暴露的接口================================================

/**
 * 获取基路径
 */
const getBasePath=()=>{
    return __dirname;
}



/**
 * 计算图片在导图文件文本中的路径
 * 设法从剪切版中找到图片放到图片目录，并返回相对于当前图导文件的相对路径
 * 寻找方法：
 *      剪切板有图片对象
 *      剪切板有字符串
 *          字符串是文件路径，尝试从路径加载图片对象
 *          把字符串当作url，尝试下载该文件，并尝试加载下载后的文件为图片对象
 * @param {*} showName 
 * @param {*} currGraphFullpath 
 */
const copyClipboardPicToImgsDir=(showName,currGraphFullpath)=>{
    return getImgFromClipboard().then(im=>{
        return saveImgAndGetRelaPath(im,showName,currGraphFullpath);
    }).catch(e=>{
        throw {
            succ:false,
            msg:""+e
        };
    });
}


// setTimeout(() => {
//     downFile("https://www.runoob.com/wp-content/uploads/2014/07/gradient_linear.png","F:\\workspace2\\front\\gmap-ui\\work\\1.jpg");
// }, 5000);

// let mm=nativeImage.createFromPath("F:\\workspace2\\front\\gmap-ui\\work\\tmp_1585425075597.png");
// console.log(mm.isEmpty());


/**
 * 计算图片在导图文件文本中的路径
 * 复制指定的图片文件到图片目录，并返回相对于当前图导文件的相对路径
 * @param {*} picFullpath  文件路径或url
 * @param {*} showName 
 * @param {*} currGraphFullpath
 * @returns 
 */
const copyPicToImgsDir=(fromPicFullpath,showName,currGraphFullpath)=>{
    return new Promise((res,rej)=>{
        //是文件格式
        if(existsFullpath(fromPicFullpath)){
            let im=nativeImage.createFromPath(fromPicFullpath);
            if(!im || im.isEmpty()){
                rej({
                    succ:false,
                    msg:"该路径不是有效的图片"
                });
                return;
            }
            res(saveImgAndGetRelaPath(im,showName,currGraphFullpath));
            return;
        }


        //是url
        if(isUrlFormat(fromPicFullpath)){
            let tmpFileFullpath=getTmpImgSavePath();//下载临时文件
            downFile(fromPicFullpath,tmpFileFullpath).then(()=>{
                let im=nativeImage.createFromPath(tmpFileFullpath);
                if(!im || im.isEmpty()){
                    rej({
                        succ:false,
                        msg:"下载的图片格式有误"
                    });
                    return;
                }
                res(saveImgAndGetRelaPath(im,showName,currGraphFullpath));
            }).catch(e=>{
                if(404===e){
                    rej({
                        succ:false,
                        msg:"指定的图片url不存在"
                    });
                    return;
                }
                rej({
                    succ:false,
                    msg:"图片下载过程中出现错误"
                });
            });
            return;
        }

        //都不是
        rej({
            succ:false,
            msg:"图片路径或url格式有误"
        });
    });
}

/**
 * 计算图片在导图文件文本中的路径
 * 复制指定的图片文件到图片目录，并返回相对于当前图导文件的相对路径
 * @param {*} picFullpath  文件路径或url
 * @param {*} showName 
 * @param {*} currGraphFullpath
 * @returns 
 */
const copyAttToAttsDir=(fromPicFullpath,showName,currGraphFullpath)=>{
    return new Promise((res,rej)=>{
        //是文件格式
        if(existsFullpath(fromPicFullpath)){
            res(saveAttAndGetRelaPath(fromPicFullpath,showName,currGraphFullpath));
            return;
        }


        //是url
        if(isUrlFormat(fromPicFullpath)){
            let tmpFileFullpath=getTmpAttSavePath();//下载临时文件
            downFile(fromPicFullpath,tmpFileFullpath).then(()=>{
                res(saveAttAndGetRelaPath(tmpFileFullpath,showName,currGraphFullpath));
            }).catch(e=>{
                if(404===e){
                    rej({
                        succ:false,
                        msg:"指定的附件url不存在"
                    });
                    return;
                }
                rej({
                    succ:false,
                    msg:"附件下载过程中出现错误"
                });
            });
            return;
        }

        //都不是
        rej({
            succ:false,
            msg:"附件路径或url格式有误"
        });
    });
}


/**
 * 保存图片对象到相应目录，并计算相对于导图文件的相对路径
 * @param {*} im 
 * @param {*} showName 
 * @param {*} currGraphFullpath 
 */
const saveImgAndGetRelaPath=(im,showName,currGraphFullpath)=>{
    //写文件
    let toPicFullPath=getImgsPath(showName);   //指定图片保存到本地的绝对路径
    fs.writeFileSync(toPicFullPath,getDefFormatImgBuff(im));

    // //计算从导图所在目录到图片的相对路径
    // let graphDir=path.dirname(currGraphFullpath);//导图所在目录
    // let relapath=toSlash(path.relative(graphDir,toPicFullPath).trim());
    // if(!(relapath.startsWith('./') || relapath.startsWith('../'))){
    //     relapath="./"+relapath;
    // }
    // return relapath;

    return "./"+showName;
}

const saveAttAndGetRelaPath=(fromFullpath,showName,currGraphFullpath)=>{
    fs.copyFileSync(fromFullpath,getAttsPath(showName));
    return "./"+showName;
}




/**
 * 设法从剪切板取得图片
 * 1、图片对象
 * 2、文本是文件路径，尝试读取图片
 * 3、文本是url，尝试下载
 * @returns promise  im/null
 */
const getImgFromClipboard=()=>{
    return new Promise((res,rej)=>{  
        //图片对象
        let im=clipboard.readImage();
        if(im && !im.isEmpty()){
            res(im);
            return;
        }

        //是文件
        let txt=(""+clipboard.readText()).trim();
        if(fs.existsSync(txt)){
            im=nativeImage.createFromPath(txt);
            if(im && !im.isEmpty()){
                res(im);
                return;
            }
        }

        //是url
        if(isUrlFormat(txt)){
            let tmpFileFullpath=getTmpImgSavePath();//下载临时路径
            downFile(txt,tmpFileFullpath).then(()=>{
                im=nativeImage.createFromPath(tmpFileFullpath);
                if(im && !im.isEmpty()){
                    res(im);
                    return;
                }
                rej("下载的图片文件格式有误");
            }).catch(e=>{
                if(404===e){
                    rej("指定的图片url不存在");
                    return;
                }
                rej("图片下载过程中出现错误");
            });
            return;
        }

        //都不是
        rej("未从剪切板中找到可用的图片信息");
    });
}



const getDefFormatImgBuff=(im)=>{
    return userPngImg?im.toPNG():im.toJPEG(100)
};

const getDefFormatImgExt=()=>{
    return userPngImg?".png":".jpg";
}

const getTmpImgSavePath=()=>(path.join(workPath,"tmp_"+new Date().getTime()+getDefFormatImgExt()));

const getTmpAttSavePath=()=>(path.join(workPath,"tmp_"+new Date().getTime()+".dat"));



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

    if(!picRelaPath.startsWith("./")){
        return picRelaPath;
    }

    return getFileProtocalUrl(getImgsPath(picRelaPath.substring(2)));



    // //部署模式计算真实本地url
    // let currGraphDir=path.dirname(graphFileFullpath);//当前图表文件的目录
    // let picFullpath=path.resolve(currGraphDir,picRelaPath);
    // return getFileProtocalUrl(picFullpath);
}

const calcAttUrl=(graphFileFullpath,picRelaPath)=>{
    //开发模式返回favicon图标
    if(isDevMode()){
        return getDevServerUrl().trim()+"/favicon.ico";
    }

    if(!picRelaPath.startsWith("./")){
        return picRelaPath;
    }

    return getFileProtocalUrl(getAttsPath(picRelaPath.substring(2)));



    // //部署模式计算真实本地url
    // let currGraphDir=path.dirname(graphFileFullpath);//当前图表文件的目录
    // let picFullpath=path.resolve(currGraphDir,picRelaPath);
    // return getFileProtocalUrl(picFullpath);
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
        let pathitems=toSlash(path.relative(mapsDir,currDir).trim()).split(SLASH);
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

const listAllDirs=()=>{
    const listDir=(assignedDir, parNode)=>{
        let currDir=(assignedDir ? assignedDir : getMapsPath());
        let imgsDir=getImgsPath();
        let attsDir=getAttsPath();
        let basepath=getMapsPath();

        fs.readdirSync(currDir, { withFileTypes: true }).filter(ent => {
            let handledFN = ent.name.toLowerCase().trim();
            return (
                'readme.md' !== handledFN && 
                ".git" !== handledFN
            ) && (
                (ent.isFile() && handledFN.endsWith(".md")) || 
                !ent.isFile()
            );//不是readme文件，且不是git目录，且是目录或是md文件
        })
        .filter(ent=>{
            return !ent.isFile();
        })
        .map(ent => {
            let fullpath =path.resolve(currDir,ent.name);
            let isfile = ent.isFile();
            
            return {
                name:       ent.name,
                itemsName:  toSlash(path.relative(basepath,fullpath)),//显示在选项卡上的名称：eg. front/css3.md
                fullpath:   fullpath,
                isfile:     isfile,
            };
        })
        .filter(each=>each.fullpath!==imgsDir && each.fullpath!==attsDir)  //不包括图片目录
        .map(each=>({
            title: each.name, 
            value: each.itemsName, 
            fullpath: each.fullpath,
            children:[],
        }))
        .forEach(item=>{
            listDir(item.fullpath, item);
            parNode.children.push(item);
        });
    }

    let dirs={children:[]};
    listDir(null, dirs);
    return dirs.children;
}


/**
 * 列出所有匹配的文件： .md 并且不是readme.md
 */
const listFiles = (assignedDir = null) => {    
    let currDir=(assignedDir ? assignedDir : getMapsPath());
    let imgsDir=getImgsPath();
    let attsDir=getAttsPath();
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
            let pic=null;
            if(!isfile){
                isEmptyDir=(0===fs.readdirSync(fullpath, { withFileTypes: true }).length);//如果是目录则看是否为空目录
            }
            if(isfile){
                pic=extractPic(fullpath);
            }
            return {
                name:       ent.name,
                itemsName:  toSlash(path.relative(basepath,fullpath)),//显示在选项卡上的名称：eg. front/css3.md
                fullpath:   fullpath,
                isfile:     isfile,
                emptyDir:   isEmptyDir,
                size:       (isfile ? fs.statSync(fullpath).size : 0),
                pic:        pic,
            };
        }).filter(each=>each.fullpath!==imgsDir && each.fullpath!==attsDir);//不包括图片目录
    }catch(e){
        console.error(e);
    }
    return ret;
};


const extractPic=(fullpath)=>{
    let cont=readFile(fullpath);
    let reg=/.*[!]\[.*?\]\((.*?)\).*/;
    let matches=reg.exec(cont);
    
    if(!(matches && matches[1])){;
        return null;
    }
    
    let relapath=matches[1];
    let url=calcPicUrl(fullpath,relapath);
    return url;
}

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
 * 图片是否存在
 * @param {*} attName 
 */
const existsAtt=(attName)=>{
    let picFullpath=getAttsPath(attName);
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
 * 打开指定url，如果是本地file://协议的资源，则使用fileRunner执行，否则使用默认的方式执行
 * @param {*} url 
 */
const openUrl=(url)=>{
    if(["file://","dir://","cmd://","cp://","data:image/"].some(item=>url.startsWith(item))){
        let indexPath= path.join(workPath,"tmp.txt");
        fs.writeFileSync(indexPath, url, 'utf-8');
        execFile(fileRunnerPath,["tmp.txt"]);
        return;
    }
    if(["shot://","shotCombine://"].some(item=>url.startsWith(item))){
        let indexPath= path.join(workPath,"tmp.txt");
        fs.writeFileSync(indexPath, url, 'utf-8');
        execFileSync(fileRunnerPath,["tmp.txt"]);
        return;
    }
    shell.openExternal(url);
}

const openPicByName=(picName)=>{
    let url=getFileProtocalUrl(getImgsPath(picName));
    openUrl(url);
}

const openAttByName=(attName)=>{
    let url=getFileProtocalUrl(getAttsPath(attName));
    openUrl(url);
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


const openSaveFileDlg = (mainWindow) => {
    return dialog.showSaveDialogSync(mainWindow, { 
        properties: [/*'saveFile'*/],
        filters: [
            { name: '图片', extensions: 'bmp,jpg,jpeg,png,gif,svg,webp'.split(',') },
            { name: '所有', extensions: ['*'] }
        ]
    });
}



const selAttFile = (mainWindow) => {
    return dialog.showOpenDialogSync(mainWindow, { 
        properties: ['openFile'],
        filters: [
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
    openUrl(url);
}

/**
 * 在图表目录打开bash，以方便git提交
 */
const openGitBash = () => {
    let time = ""+new Date().getTime();
    spawn(
        'cmd.exe',
        ['/c', `start "GMap_${time}" cmd`],
        {
            shell: true,           //使用shell运行
            cwd: getMapsPath()   //当前目录为图表文件目录
        }
    );
}


/**
 * 加载应用名称版本等信息
 */
const loadAppInfo=()=>{
    if(appInfoCache){
        return appInfoCache;
    }
    let {name,showname,version}=JSON.parse(fs.readFileSync(packageJsonPath,'utf-8'));
    appInfoCache={name,showname,version};
    return appInfoCache;
}

const reloadAppPage=(mainWindow)=>{
    //mainWindow.reload();
    mainWindow.webContents.reloadIgnoringCache();
}


const openDevTool=(mainWindow)=>{
    mainWindow.webContents.openDevTools({detach:true});
}


/**
 * 初始化工作：
 * 创建工作目录与图片目录
 */
const init=()=>{
    [imgsPath,attsPath,workPath].forEach(eachWorkdir=>{
        if(!fs.existsSync(eachWorkdir)){
            fs.mkdirSync(eachWorkdir,{recursive:true});
        }
    });
}



//===========工具方法  ================================================

/**
 * 指定文本是否为url格式
 * @param {*} txt 
 */
const isUrlFormat=(txt)=>(["http://","https://","ftp://","ftps://","//","www."].some(prefix=>txt.startsWith(prefix)));

/**
 * 把路径中的所有斜扛全部换为正斜扛 /
 * @param {*} path 
 */
const toSlash=(path)=>(path.trim().replace(/\\/g,SLASH));

/**
 * 把路径中的所有斜扛全部换为反斜扛 \
 * @param {*} path 
 */
const toBackSlash=(path)=>(path.trim().replace(/[/]/g,BACK_SLASH));

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
 * 获取附件文件所在目录或文件全路径
 * @param {*} fn 如果未提供此参数表示取所在目录，否则表示该文件的全路径
 */
const getAttsPath = (fn = null) => toBackSlash((fn ? path.join(attsPath,fn) : attsPath).trim());

/**
 * 下载文件
 * @param {*} url 
 * @param {*} savePath
 * @returns promise 下载成功res 下载失败rej(异常信息/异常状态码/error)
 */
const downFile=(url,savePath)=>{
    return new Promise((res,rej)=>{
        let succReturn=false;//是否成功返回
        try{
            //WriteStream就绪时开始进行下载请求
            let ws=fs.createWriteStream(savePath);
            ws.on("ready",()=>{
                try{
                    const request=net.request(url);
                    request.on("error",(err)=>{
                        ws.end();
                        rej(err);
                    });
                    request.on('response', (response) => {
                        if(200!==response.statusCode){
                            ws.end();
                            rej(response.statusCode);
                            return;
                        }
                        response.on('data', (chunk) => {
                            ws.write(chunk);
                        });
                        response.on('error',(e)=>{
                            ws.end();
                            rej('error');
                        });
                        response.on('end', () => {
                            succReturn=true;//只有下载完成才能瓐返回
                            ws.end();//需要等到finish事件时才能返回结果
                        });
                    })
                    request.end();
                }catch(e){
                    rej(e);
                }
            });

            //WriteStream完成时返回结果（如果在调用end()之后立即返回，则内容还未flush到文件）
            ws.on("finish",()=>{
                if(succReturn){
                    res();
                }
            })
        }catch(e){
            rej(e);
        }
    });
}





/**
 * 通过环境变量判断当前是否为开发模式
 */
const isDevMode = () => (process && process.env && process.env.DEV_SERVER_URL ? true : false);


const isMaximized=(mainWindow)=>(mainWindow.isMaximized());

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
    getBasePath,
    existsPic, 
    existsAtt,
    existsGraph, 
    existsFullpath,
    readFile,
    saveFile, 
    getPathItems, 
    listFiles,
    listAllDirs,

    //图片相关操作
    copyPicToImgsDir,
    copyAttToAttsDir,
    copyClipboardPicToImgsDir,
    calcPicUrl,
    calcAttUrl,
    selPicFile,//使用操作系统对话框
    openSaveFileDlg,
    selAttFile,

    //打开外部资源：导图目录、bash控制台、网页链接或本地file协议资源、图片等
    openMapsDir, 
    openGitBash, 
    openUrl, 
    openPicByName,
    openAttByName,

    //杂项
    openDevTool,
    isDevMode,
    isMaximized,
    getDevServerUrl,
    loadAppInfo,
    reloadAppPage,
    isUrlFormat,
    
    
    
};