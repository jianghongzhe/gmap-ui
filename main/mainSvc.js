const { app, BrowserWindow, Menu, shell,dialog,clipboard,nativeImage,net, ipcMain,Notification   } = require('electron');
const fs = require('fs');
const Url = require('url');
const { exec, spawn, execFile,execFileSync } = require('child_process');
const path = require('path');
const nodeNet = require('net');

const ws=require('./ws');

//常量：工作区目录、主配置文件位置
const userPngImg=true;//默认是否
const appBasePath=path.join(__dirname, '../');;
const externalPath=path.join(__dirname, '../', 'externals');
const fileRunnerPath=path.join(__dirname, '../', 'externals', 'file_runner.exe');
const mapsPath=path.join(__dirname, '../', 'gmaps');
const imgsPath=path.join(__dirname, '../', 'gmaps','imgs');
const attsPath=path.join(__dirname, '../', 'gmaps','atts');
const workPath=path.join(__dirname, '../', 'work');
const cachePath=path.join(__dirname, '../', 'cache');
const packageJsonPath=path.join(__dirname, '../', 'package.json');

const iconSuccPath=path.join(__dirname, 'imgs', 'succ.png');
const iconFailPath=path.join(__dirname, 'imgs', 'fail.png');
const iconWarnPath=path.join(__dirname, 'imgs', 'warn.png');
const iconInfoPath=path.join(__dirname, 'imgs', 'info.png');
const icons={
    succ: iconSuccPath,
    fail: iconFailPath,
    err: iconFailPath,
    info: iconInfoPath,
    warn: iconWarnPath,
};


const SLASH='/';
const BACK_SLASH='\\';

const url_localicon_map={};

let mainWindow=null;

/**
 * 辅助程序相关信息
 * {
 *  "pid":19896,
 *  "fullUrl":"http://localhost:56789/",
 *  "method":"POST",
 *  "protocol":"http:",
 *  "hostname":"localhost",
 *  "port":56789,
 *  "basePath":"/"
 * }
 */
let server_info=null;

/**
 * 
 */
let nodeTcpClient=null;

/**
 * 请求id与回调的对应关系
 */
let reqCallbackMap={};



let appInfoCache=null;


//===========暴露的接口================================================

/**
 * 获取基路径
 */
const getBasePath=()=>{
    return appBasePath;
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

const getFileItem=(fn)=>{
    if(!fn.endsWith(".md")){
        fn+=".md";
    }
    let fullpath=toBackSlash(path.join(mapsPath,fn));
    let showName=toSlash(path.relative(mapsPath,fullpath));
    return {
        isfile: true,
        emptyDir: false,
        fullpath,
        itemsName: showName,
    };
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
 * 加载指定Url的图标：
 * 1、如果是开发模式，直接返回开发服务器url+/favicon.ico
 * 2、如果缓存中有，直接返回
 * 3、如果缓存没有，向后台查询。
 *      如果查询成功，则放入缓冲以备下次访问，同时返回结果；
 *      如果查找失败，直接返回结果
 * @param {*} url 
 * @returns 
 */
const loadIcon=(url)=>{
    if(isDevMode()){
        return new Promise((res,rej)=>{
           res({
                succ: true,
                msg: "",
                data: getDevServerUrl().trim()+"/favicon.ico"
           }); 
        });
    }
    if(url_localicon_map[url]){
        return new Promise((res,rej)=>{
            res(url_localicon_map[url]); 
        });
    }
    return sendCmdToServer("loadIcon",{url}).then(resp=>{
        if(resp.succ){
            url_localicon_map[url]=resp;
        }
        return resp;
    });
};



/**
 * 进行屏幕截图
 * @param {*} opt  {left,top,width,height,fileName}
 */
 const takeScreenShot=(opt)=>{
    return sendCmdToServer("shot", opt);
};

/**
 * 屏幕截图的合并
 * @param {*} opt {
 *  itemWidth: 1000,
    itemHeight: 1000,
    resultFullPath: 'd:/aaa.jpg',
    lines: [
        [
            {
                picName:    '01.jpg',
                cutLeft:    20,
                cutTop:     30
            }
        ]
    ]
 * }
 */
const screenShotCombine=(opt)=>{
    return sendCmdToServer("shotCombine", opt).then(resp=>{
        if(resp && resp.succ){
            showNotification(resp.data.title, resp.data.body, 'succ');
        }
        return resp;
    });
};




/**
 * 打开指定url，如果是本地file://协议的资源，则使用fileRunner执行，否则使用默认的方式执行
 * @param {*} url 
 */
const openUrl=(url)=>{
    // 执行命令
    if(url.startsWith("cmd://")){
        return sendCmdToServer("cmd", {url});
    }
    // 执行文件或打开目录
    if(url.startsWith("file://")){
        return sendCmdToServer("file", {url}).then(resp=>{
            if(resp && false===resp.succ){
                showNotification("操作有误", resp.msg, 'err');
            }
            return resp;
        });
    }
    // 打开目录并选择文件
    if(url.startsWith("dir://")){
        return sendCmdToServer("dir", {url}).then(resp=>{
            if(resp && false===resp.succ){
                showNotification("操作有误", resp.msg, 'err');
            }
            return resp;
        });
    }
    // 复制内容
    if(url.startsWith("cp://")){
        return sendCmdToServer("cp", {url}).then(resp=>{
            if(resp && resp.succ){
                showNotification(resp.data.title, resp.data.body, 'succ');
            }
            return resp;
        });
    }
    // 保存base64内容到图片文件
    if(url.startsWith("data:image/")){
        const savePath=dialog.showSaveDialogSync(mainWindow, { 
            properties: ['showHiddenFiles'],
            filters: [
                { name: 'png', extensions: ['png'] },
                { name: 'jpg', extensions: ['jpg'] },
                { name: 'jpeg', extensions: ['jpeg'] },
                { name: 'bmp', extensions: ['bmp'] },
                { name: 'gif', extensions: ['gif'] },
                { name: 'svg', extensions: ['svg'] },
                { name: 'webp', extensions: ['webp'] },
                { name: '所有', extensions: ['*'] }
            ]
        });
        if(!savePath){
            return new Promise((res, rej)=>rej(new Error("用户已取消")));
        }
        return sendCmdToServer("saveImgBase64", {url, savePath}).then(resp=>{
            if(resp && resp.succ){
                showNotification(resp.data.title, resp.data.body, 'succ');
            }
            return resp;
        });
    }
    // 其他情况，直接用shell执行
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


const openSaveFileDlg = (ext) => {
    return new Promise((res, rej)=>{
        let filters= [
            { name: 'JPG图片', extensions: ['jpg'] },
            { name: 'PNG图片', extensions: ['png'] },
            { name: 'GIF图片', extensions: ['gif'] },
            { name: 'BMP图片', extensions: ['bmp'] },
            { name: 'JPEG图片', extensions: ['jpeg'] },
            { name: 'SVG图片', extensions: ['svg'] },
            { name: 'WEBP图片', extensions: ['webp'] },
            { name: '所有', extensions: ['*'] }
        ];
        if('md'===ext){
            filters= [
                { name: 'markdown', extensions: ['md'] },
                { name: '所有', extensions: ['*'] }
            ];
        }
        if('html'===ext){
            filters= [
                { name: 'html文件', extensions: ['html'] },
                { name: '所有', extensions: ['*'] }
            ];
        }
        const result=dialog.showSaveDialogSync(mainWindow, { 
            properties: [/*'saveFile'*/],
            filters
        });
        if(result){
            res(result);
            return;
        }
        rej("用户已取消");
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
    const now=new Date();
    const m=now.getMonth()+1;
    const d=now.getDate();
    const ymd=`${now.getFullYear()}-${m<10 ? "0"+m : m}-${d<10 ? "0"+d : d}`;

    spawn(
        'cmd.exe',
        ['/c', `start "GMap_${ymd}" cmd`],
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

const reloadAppPage=()=>{
    mainWindow.webContents.reloadIgnoringCache();
}


const openDevTool=()=>{
    mainWindow.webContents.openDevTools({detach:true});
}


/**
 * 初始化工作：
 * 1、持有主窗口对象
 * 2、创建初始目录：图片目录、附件目录、工作目录、缓存目录等
 * 3、启动后台监听服务并在过一会后获得服务器信息（访问地址url前缀、进程id等）
 */
const init=(_mainWindow)=>{
    mainWindow=_mainWindow;


    [imgsPath,attsPath,workPath, cachePath].forEach(eachWorkdir=>{
        if(!fs.existsSync(eachWorkdir)){
            fs.mkdirSync(eachWorkdir,{recursive:true});
        }
    });


    console.log('------ init --------');
    console.log(ws) ;
    console.log(ws.Sender) ;

    const w = new ws('ws://localhost:56789/');
                      
    w.on('open', function open() {
        w.send(JSON.stringify({
            reqId: 1,
            action: 'file',
            data: JSON.stringify({
                url:'file:///d:\\a.txt'
            })
        }));
        // w.send("ping");
    });

    w.on('message', function incoming(message) {
        console.log("- msg -----------------");
        console.log(`received: ${message instanceof Buffer}`);
        console.log(`received: ${message.toString('utf-8')}`);
        console.log(`received: ${typeof(message)}`);
    });







    spawn(fileRunnerPath, [], {cwd: externalPath});
    setTimeout(() => {
        server_info=JSON.parse(fs.readFileSync(path.join(workPath,'server_info'),'utf-8'));
        console.log(`listener started, pid is ${server_info.pid}, url is ${server_info.url}`);
    }, 2000);
    console.log(`app started, pid is: ${process.pid}`);
}



const log=(info)=>{
    const now=new Date();
    const m=now.getMonth()+1;
    const d=now.getDate();
    const ymd=`${now.getFullYear()}-${m<10 ? "0"+m : m}-${d<10 ? "0"+d : d}`;
    const localpath=path.join(workPath, `main_${ymd}.log`);

    fs.appendFileSync(
        localpath,
        `${info}\r\n`,
        'utf-8'
    );
};




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
 * 显示系统通知并在一会后自动关闭
 * @param  {...any} args 
 * 1个值：消息内容
 * 2个值：标题、内容
 * 3个值：标题、内容、图标类型（succ、err、info、warn）
 */
const showNotification=(...args)=>{
    if(!args || 0==args.length){
        return;
    }

    let title="信息";
    let body="";
    let icon="info";
    
    if(1==args.length){
        body=args[0];
    }else if(2==args.length){
        title=args[0];
        body=args[1];
    }else if(3<=args.length){
        title=args[0];
        body=args[1];
        icon=args[2];
        if(!icons[icon]){
            icon="info";
        }
    }
    const n=new Notification({ title, body, icon: icons[icon] });
    n.show();
    setTimeout(() => {
        n.close();
    }, 6*1000);
};

/**
 * 通过环境变量判断当前是否为开发模式
 */
const isDevMode = () => (process && process.env && process.env.DEV_SERVER_URL ? true : false);

const hasDevToolExtension=()=>(process && process.env && process.env.DEV_TOOL_EXTENSION_URL ? true : false);

const isMaximized=()=>(mainWindow.isMaximized());

const getInnerModuleVersions=()=>(process.versions);


/**
 * 获得开发模式的主页访问地址
 */
const getDevServerUrl=()=>{
    if(isDevMode()){
        return process.env.DEV_SERVER_URL;
    }
    return '';
}

const getDevToolExtensionUrl=()=>{
    if(hasDevToolExtension()){
        return process && process.env && process.env.DEV_TOOL_EXTENSION_URL;
    }
    return '';
}

/**
 * 向助手程序发送内容并得到结果
 * @param {*} action 
 * @param {*} data 
 * @returns 
 */
const sendCmdToServer=(action, data)=>{
    return new Promise((res, rej)=>{
        let sumBuffer=null;
        const request = net.request({
            method:     server_info.method,
            protocol:   server_info.protocol,
            hostname:   server_info.hostname,
            port:       server_info.port,
            path:       `${server_info.basePath}${action}`
        });
        request.on('response', (response) => {
            response.on('end', ()=>{
                res(JSON.parse(sumBuffer.toString("utf-8")));
            });
            response.on('data', (chunk) => {
                if(null===sumBuffer){
                    sumBuffer=chunk;
                    return;
                }
                sumBuffer=Buffer.concat([sumBuffer, chunk]);
            });
            response.on('error',(errObj)=>{
                rej(errObj);
            });
        });
        request.on('error',(errObj)=>{
            rej(errObj);
        });
        request.write("string"===typeof(data) ? data : JSON.stringify(data), 'utf-8');
        request.end();
    });
};








const ipcHandlers={
    takeScreenShot,
    screenShotCombine,
    loadIcon,
    showNotification,
    getInnerModuleVersions,
    loadAppInfo,
    openGitBash,
    openMapsDir,
    reloadAppPage,
    openDevTool,
    isDevMode,
    isMaximized,
    getBasePath,
    openUrl,
    existsGraph,
    getFileItem,
    openSaveFileDlg,
    listAllDirs,
    readFile,
    saveFile,
};

const delegateHandler=async (handler, evt, ...arg)=>{
    const result = await handler(...arg);
    return result;
};

for(key in ipcHandlers){
    ipcMain.handle(key, delegateHandler.bind(this, ipcHandlers[key]));
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
    hasDevToolExtension,
    getDevToolExtensionUrl,
    loadAppInfo,
    reloadAppPage,
    isUrlFormat,
    getInnerModuleVersions,
    getFileItem,
    
    
    
};