const { app, BrowserWindow, Menu, shell,dialog,clipboard,nativeImage,net, ipcMain,Notification   } = require('electron');
const fs = require('fs');
const os = require('os');
const Url = require('url');
const { exec, spawn, execFile,execFileSync } = require('child_process');
const path = require('path');
const nodeNet = require('net');

const common=require('./common');
const settingSvc=require('./settingSvc');
const appSvc =require("./appSvc");
const ipcClient=require("./ipc_client");

const {
    userPngImg,
    appBasePath,
    externalPath,
    fileRunnerPath,
    htmlTmplDir,
    mapsPath,
    imgsPath,
    attsPath,
    workPath,
    cachePath,
    DEFAULT_SEARCH_URL,
    ASSIST_STARTED_SYMBOL,
    SLASH,
    BACK_SLASH
}=require("./consts");
const {createTimeoutDetector} = require("./timeout_detect");




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
const saveImgAndGetRelaPath=(im,showName,mdFullpath)=>{
    const currGraphBundleFullpath=path.dirname(mdFullpath);
    const targetPath= path.join(currGraphBundleFullpath, 'assets', showName);

    //写文件
    //let toPicFullPath=getImgsPath(showName);   //指定图片保存到本地的绝对路径
    fs.writeFileSync(targetPath, getDefFormatImgBuff(im));

    // //计算从导图所在目录到图片的相对路径
    // let graphDir=path.dirname(currGraphFullpath);//导图所在目录
    // let relapath=toSlash(path.relative(graphDir,toPicFullPath).trim());
    // if(!(relapath.startsWith('./') || relapath.startsWith('../'))){
    //     relapath="./"+relapath;
    // }
    // return relapath;

    return "assets/"+showName;
}

const saveAttAndGetRelaPath=(fromFullpath,showName,mdFullpath)=>{
    const currGraphBundleFullpath=path.dirname(mdFullpath);
    const targetPath= path.join(currGraphBundleFullpath, 'assets', showName);
    fs.copyFileSync(fromFullpath, targetPath);
    return "assets/"+showName;
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

/**
 * 是否是图片扩展名
 */
const isImgExt=(path)=> [
    '.jpg',
    '.gif',
    '.png',
    '.bmp',
    '.svg',
].some(eachExt=>path.trim().toLowerCase().endsWith(eachExt));


const getTmpImgSavePath=()=>(path.join(workPath,"tmp_"+new Date().getTime()+getDefFormatImgExt()));

const getTmpAttSavePath=()=>(path.join(workPath,"tmp_"+new Date().getTime()+".dat"));



/**
 * 计算图片实际的本地url路径
 * 计算指定导图文件按某相对路径解析后的绝对路径，返回file协议的字符串
 * @param {*} mdFullpath 导图markdown文件的全路径
 * @param {*} picRelaPath 图片的相对路径
 * @returns [0]显示用的url [1]打开用的url
 */
const calcPicUrl=(mdFullpath,picRelaPath)=>{
    if(!picRelaPath.startsWith("assets/")){
        return [picRelaPath, picRelaPath];
    }

    const faviconUrl=common.getDevServerFaviconUrl();
    const attFullpath=path.join(path.dirname(mdFullpath), picRelaPath);
    const factUrl=common.wrapFileProtocol(attFullpath);

    if(common.isDevMode()){
        return [faviconUrl, factUrl];
    }
    return [factUrl, factUrl];
}

/**
 * 计算附件实际的本地路径
 * @param {*} mdFullpath  导图markdown文件的全路径
 * @param {*} picRelaPath  附件的相对路径
 * @returns 
 */
const calcAttUrl=(mdFullpath,picRelaPath)=>{
    if(!picRelaPath.startsWith("assets/")){
        return picRelaPath;
    }

    const attFullpath=path.join(path.dirname(mdFullpath), picRelaPath);
    return common.wrapFileProtocol(attFullpath);
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

/**
 * 递归列出所有层次的目录（不包含导图的包）
 * @returns 
 */
const listAllDirs=()=>{
    const basepath=getMapsPath();

    const listDir=(assignedDir, parNode)=>{
        const currDir=(assignedDir ? assignedDir : getMapsPath());
        fs.readdirSync(currDir, { withFileTypes: true }).filter(ent => {
            return (!ent.isFile() && ent.name!=='.git' && !ent.name.endsWith(".textbundle"))
        })
        .map(ent => {
            let fullpath =path.resolve(currDir,ent.name);
            return {
                name:       ent.name,
                itemsName:  toSlash(path.relative(basepath,fullpath)),//显示在选项卡上的名称：eg. front/css3.md
                fullpath:   fullpath,
                isfile:     false,
            };
        })
        //.filter(each=>each.fullpath!==imgsDir && each.fullpath!==attsDir)  //不包括图片目录
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
    const currDir=(assignedDir ? assignedDir : getMapsPath());
    const basepath=getMapsPath();
    let ret=[];

    const mapExt=".textbundle";
    const mapExtLen=mapExt.length;
    


    try{
        ret= fs.readdirSync(currDir, { withFileTypes: true }).filter(ent => {
            // 只保留名字不为'.git'的目录
            return !ent.isFile() && ent.name!=='.git';
        }).sort((item1,item2)=>{
            // 排序：目录在文件之前，如果同为目录或文件，则按文件名排序
            let ord1=item1.name.endsWith(".textbundle") ? 1 : 0;
            let ord2=item2.name.endsWith(".textbundle") ? 1 : 0;
            if(ord1!==ord2){
                return ord1-ord2;
            }
            if(item1.name!==item2.name){
                return item1.name.toLowerCase().trim()<item2.name.toLowerCase().trim() ? -1 : 1;
            }
            return 0;
        }).map(ent => {
            // 是否为文件：如果以.textbundle结尾，则认为是导图的包，看作是一个文件；否则认为是普通目录
            let isfile =ent.name.endsWith(mapExt);// ent.isFile();

            // 全路径、列表显示的名称、tab头显示的名称
            let fullpath =path.resolve(currDir,ent.name);
            const showName= (isfile ? ent.name.substring(0, ent.name.length-mapExtLen) : ent.name);
            let itemsName=toSlash(path.relative(basepath,fullpath));
            itemsName=(isfile ? itemsName.substring(0, itemsName.length-mapExtLen) : itemsName);

            // 文件类型的特殊属性：包内导图的全路径、包内附件的目录路径（只对文件类型有效）、附件中第一个图片的全路径
            let mdFullpath=null;
            let attDir=null;
            let pic=null;
            let tags=[];
            if(isfile){
                mdFullpath=path.join(fullpath,'text.md');
                tags= getTagsByMdFullPath(mdFullpath);
                attDir=path.join(fullpath,'assets');
                const imgItems=fs.readdirSync(attDir, { withFileTypes: true }).filter(ent=>{
                    const tmpFn=ent.name.toLowerCase().trim();
                    return ['.png','.jpg','.jpeg','.gif','.bmp'].some(eachExt=>tmpFn.endsWith(eachExt));
                });
                if(0<imgItems.length){
                    if(common.isDevMode()){
                        pic= common.getDevServerFaviconUrl();
                    }else{
                        pic=common.wrapFileProtocol(path.join(attDir, imgItems[0].name), true);
                    }
                }
            }
            
            // 目录类型的特殊属性：是否为空目录（其中有子目录则非空）
            let isEmptyDir=false;
            if(!isfile){
                isEmptyDir=(0===fs.readdirSync(fullpath, { withFileTypes: true }).filter(ent => !ent.isFile()).length);//如果是目录则看是否为空目录
            }

            return {
                name:       showName,
                itemsName:  itemsName,//显示在选项卡上的名称：eg. front/css3.md
                fullpath:   fullpath,
                mdFullpath,
                attDir,
                isfile:     isfile,
                emptyDir:   isEmptyDir,
                size:       (isfile ? fs.statSync(mdFullpath).size : 0),
                pic:        pic,
                tags,
            };
        });//.filter(each=>each.fullpath!==imgsDir && each.fullpath!==attsDir);//不包括图片目录
    }catch(e){
        console.error(e);
    }
    return ret;
};







const trimEndOnce=(str, suffix)=>{
    if(str.endsWith(suffix)){
        return str.substring(0, str.length-suffix.length).trim();
    }
    return str.trim();
};

const getFileItem=(fn)=>{
    if(!fn.endsWith(".textbundle")){
        fn+=".textbundle";
    }
    const bundleFullpath=toBackSlash(path.join(mapsPath,fn));
    const mdFullpath=path.join(bundleFullpath,'text.md');
    const attDir=path.join(bundleFullpath,'assets');
    const showName=trimEndOnce(toSlash(path.relative(mapsPath,bundleFullpath)), ".textbundle");
    const name=path.basename(bundleFullpath, ".textbundle");
    const tags= getTagsByMdFullPath(mdFullpath);

    console.log({
        name,
        itemsName:  showName,//显示在选项卡上的名称：eg. front/css3.md
        fullpath:   bundleFullpath,
        mdFullpath,
        attDir,
        isfile:     true,
        emptyDir:   false,
        size:       0,
        pic:        null,
        tags,
    });
    return {
        name,
        itemsName:  showName,//显示在选项卡上的名称：eg. front/css3.md
        fullpath:   bundleFullpath,
        mdFullpath,
        attDir,
        isfile:     true,
        emptyDir:   false,
        size:       0,
        pic:        null,
        tags,
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
 * @returns 如果存在，返回true，否则返回[文件名或带相对路径的文件名，主题名称，包的全路径, 导图的全路径]
 */
const existsGraph = (fn) => {
    //保证扩展名为.textbundle
    fn=fn.trim();   
    if (".textbundle"!==path.extname(fn).trim().toLowerCase()) {
        fn+=".textbundle";
    }
    
    //
    let themeName=path.basename(fn,path.extname(fn));//提取主题名称
    let fullpath = getMapsPath(fn);//绝对路径用反扛
    if (fs.existsSync(fullpath)) {
        return true;
    }
    let tabName=toSlash(fn);
    tabName=tabName.substring(0, tabName.length-".textbundle".length );
    return [tabName, themeName, fullpath, path.join(fullpath, 'text.md')];
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
    console.log("loadicon for: "+url);
    if(common.isDevMode()){
        return new Promise((res,rej)=>{
           res({
                succ: true,
                msg: "",
                data: common.getDevServerFaviconUrl(),
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
            appSvc.showNotification(resp.data.title, resp.data.body, 'succ');
        }
        return resp;
    });
};


/**
 * 搜索指定关键词：
 * 如果未指定搜索引擎，则使用默认的；
 * 如果指定，若其中不包含指定字符，则还使用默认引擎，若包含，则使用指定值
 * @param kw
 */
const searchKeyword=(kw)=>{
    let searchUrl = settingSvc.getSettingValue("search_engine");
    if('default'===searchUrl){
        searchUrl=DEFAULT_SEARCH_URL;
    }else{
        if(!searchUrl.includes("##kw##")){
            searchUrl=DEFAULT_SEARCH_URL;
        }
    }
    const url=searchUrl.replace("##kw##", kw);
    openUrl(url);
};



/**
 * 打开指定url
 * 对于 http://、https:// 协议及 file:/// 协议的图片文件，如果设置中指定了对应的打开方式，则使用之，否则再使用系统默认打开方式打开
 * @param {*} url 
 */
const openUrl=(url)=>{
    // 执行命令
    if(url.startsWith("cmd://")){
        return ipcClient.sendReq({
            Action: 'cmd_run',
            Cmd: trimPrefs(url, ["cmd:///", "cmd://"]),
            Pause: false,
            ExitTimeout: 1,
        });
    }
    if(url.startsWith("cmdp://")){
        return ipcClient.sendReq({
            Action: 'cmd_run',
            Cmd: trimPrefs(url, ["cmdp:///", "cmdp://"]),
            Pause: true,
            ExitTimeout: 0,
        });
    }
    if(url.startsWith("start://")){
        return ipcClient.sendReq({
            Action: 'cmd_start',
            Cmd: trimPrefs(url, ["start:///", "start://"]),
        });
    }
    // 命令打开目录
    if(url.startsWith("cmdopen://")){
        return ipcClient.sendReq({
            Action: 'cmd_open',
            Txt: trimPrefs(url, ["cmdopen:///", "cmdopen://"]),
        }).catch(resp=>{
            appSvc.showNotification("操作有误", resp.Msg, 'err');
        });
    }
    // 执行文件或打开目录
    // 如果是图片文件且设置中指定了默认值以外的图片打开方式，则以该打开方式打开；否则默认方式打开
    if(url.startsWith("file://")){
        const handledUrl = trimPrefs(url, ["file:///", "file://"]);
        if(isImgExt(url)){
            const imgOpener=settingSvc.getSettingValue("img_opener");
            if('default'!==imgOpener){
                return ipcClient.sendReq({
                    Action:"file_url_txt_openby",
                    Path: handledUrl,
                    Opener: imgOpener,
                    Option: "",
                }).catch(resp=>{
                    appSvc.showNotification("操作有误", resp.Msg, 'err');
                });
            }
        }
        return ipcClient.sendReq({
            Action:"file_dir_run",
            Path: handledUrl,
            CtxDir: "",
        }).catch(resp=>{
            appSvc.showNotification("操作有误", resp.Msg, 'err');
        });
    }
    // 调用系统的打开方式来打开指定文件
    if(url.startsWith("openas://")){
        return ipcClient.sendReq({
            Action:"file_url_openas",
            Path: trimPrefs(url, ["openas:///", "openas://"]),
            CtxDir: "",
        }).catch(resp=>{
            appSvc.showNotification("操作有误", resp.Msg, 'err');
        });
    }
    // 调用指定的打开方式来打开指定文件
    if(url.startsWith("openby://")){
        const items = splitUrlParts(trimPrefs(url, ["openby:///", "openby://"]));
        if(items.length<2 || ''===items[0] || ''===items[1]){
            // throw new Exception("地址格式有误，无法打开：\r\n" + req.url);
            appSvc.showNotification("url格式有误", "应为如下格式：\r\nopenby://a.txt@@b.exe", 'err');
            return;
        }
        return ipcClient.sendReq({
            Action:"file_url_txt_openby",
            Path: items[0],
            Opener: items[1],
            Option: (items.length>=3 && ''!==items[2] ? items[2] : ""),
        }).catch(resp=>{
            appSvc.showNotification("操作有误", resp.Msg, 'err');
        });
    }
    // 调用指定的打开方式来打开指定目录
    if(url.startsWith("diropenby://")){
        const items = splitUrlParts(trimPrefs(url, ["diropenby:///", "diropenby://"]));
        if(items.length<2 || ''===items[0] || ''===items[1]){
            // throw new Exception("地址格式有误，无法打开：\r\n" + req.url);
            appSvc.showNotification("url格式有误", "应为如下格式：\r\ndiropenby://f:/a@@b.exe", 'err');
            return;
        }
        return ipcClient.sendReq({
            Action:"file_url_txt_openby",
            Path: items[0],
            Opener: items[1],
            Option: (items.length>=3 && ''!==items[2] ? items[2] : ""),
            UseDir: true,
        }).catch(resp=>{
            appSvc.showNotification("操作有误", resp.Msg, 'err');
        });
    }
    // 调用指定的打开方式来打开指定文件
    if(url.startsWith("openin://")){
        const items = splitUrlParts(trimPrefs(url, ["openin:///", "openin://"]));
        if(items.length<2 || ''===items[0] || ''===items[1]){
            // throw new Exception("地址格式有误，无法打开：\r\n" + req.url);
            appSvc.showNotification("url格式有误", "应为如下格式：\r\nopenin://a.exe@@d:/m/n", 'err');
            return;
        }
        return ipcClient.sendReq({
            Action:"file_openin",
            Path: items[0],
            CtxDir: items[1],
        }).catch(resp=>{
            appSvc.showNotification("操作有误", resp.Msg, 'err');
        });
    }
    // 打开目录并选择文件
    if(url.startsWith("dir://")){
        return ipcClient.sendReq({
            Action:"file_dir_select",
            Path: trimPrefs(url, ["dir:///", "dir://"]),
            CtxDir: "",
        }).catch(resp=>{
            appSvc.showNotification("操作有误", resp.Msg, 'err');
        });
    }
    // 复制内容
    if(url.startsWith("cp://")){
        const handledTxt=trimPrefs(url, ["cp:///", "cp://"])
            .replace(/ [\\]/g,'\n')
            .replace(/\r/g,'')
            .replace(/\n/g,'\r\n');
        clipboard.writeText(handledTxt);
        appSvc.showNotification('内容已复制', handledTxt, 'succ');
        return;
    }
    // 复制路径
    if(url.startsWith("cppath://")){
        return ipcClient.sendReq({
            Action:"path_recognize",
            Txt: trimPrefs(url, ["cppath:///","cppath://"]),
        }).then(resp=>{
            clipboard.writeText(resp.Path);
            appSvc.showNotification(`${resp.IsFile ? "文件" : "目录"}路径已复制`, resp.Path, 'succ');
        }).catch(resp=>{
            appSvc.showNotification("操作有误", resp.Msg, 'err');
        });
    }
    // 保存base64内容到图片文件，如果能成功保存，即为成功，不验证是否是有效图片
    // data:image/png;base64,iVBORw0KG...
    if(url.startsWith("data:image/")){
        const reg=/^data[:]image[/](.+?);base64,(.+?)$/;
        const matches=url.trim().match(reg);
        const flag=(matches && matches[1] && matches[2]);
        if(!flag){
            appSvc.showNotification("图片格式有误", "不是有效的base64 url", 'err');
            return;
        }
        const imgType=matches[1];
        const imgCont=matches[2];

        const filters=[
            { name: 'png', extensions: ['png'] },
            { name: 'jpg', extensions: ['jpg'] },
            { name: 'jpeg', extensions: ['jpeg'] },
            { name: 'bmp', extensions: ['bmp'] },
            { name: 'gif', extensions: ['gif'] },
            { name: 'svg', extensions: ['svg'] },
            { name: 'webp', extensions: ['webp'] },
        ].filter(item=> item.name.toLowerCase().trim()!==imgType.toLowerCase().trim());


        const savePath=dialog.showSaveDialogSync(mainWindow, { 
            properties: ['showHiddenFiles'],
            filters: [
                { name: imgType, extensions: [imgType] },
                ...filters,
                { name: '所有', extensions: ['*'] }
            ]
        });
        // 用户已取消
        if(!savePath){
            return;
        }
        try {
            const buffer = Buffer.from(imgCont, 'base64');
            fs.writeFileSync(savePath, buffer);
            appSvc.showNotification("操作成功", "图片已保存到\r\n"+savePath, 'succ');
        }catch (e){
            appSvc.showNotification("操作有误", "未能成功保存图片", 'err');
        }
        return;
    }

    // 打开网址：如果未指定打开方式，则使用系统默认的，否则使用指定打开方式打开，借助openby协议
    if(url.startsWith("http://") || url.startsWith("https://")){
        const urlOpener=settingSvc.getSettingValue("url_opener");
        if('default'===urlOpener){
            shell.openExternal(url);
            return;
        }
        return ipcClient.sendReq({
            Action:"file_url_txt_openby",
            Path: url,
            Opener: urlOpener,
            Option: "",
        }).catch(resp=>{
            appSvc.showNotification("操作有误", resp.Msg, 'err');
        });
    }
    // 其他情况，直接用shell执行
    shell.openExternal(url);
}


const searchInFile=({exp})=>{
    return sendCmdToServer("search", {exp});
};

const searchAllTags=()=>{
    return sendCmdToServer("search", {onlyTags:true});
};


/**
 * 
 * @param {*} param0 {
 *  img:            true/false
 *  saveDir:        "d:/a/b"
 *  saveToPicHost:  true/false
 * }
 * @returns 
 */
const saveFileFromClipboard=({img, saveDir, saveToPicHost})=>{
    return sendCmdToServer("saveFileFromClipboard", {img, saveDir, saveToPicHost});
};



const getUrlFromClipboard=(paramsObj)=>{
    return sendCmdToServer("getUrlFromClipboard", paramsObj);
};

const getImgUrlFromClipboard=(paramsObj)=>{
    return sendCmdToServer("getImgUrlFromClipboard", paramsObj);
};

const getClipboardHasContent=()=>{
    return sendCmdToServer("clipboardHasContent", {});
};


const openPicByName=(picName)=>{
    let url=common.wrapFileProtocol(getImgsPath(picName));
    openUrl(url);
}

const openAttByName=(attName)=>{
    let url=common.wrapFileProtocol(getAttsPath(attName));
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
 * @param {*} fullpath text.md文件全路径
 * @param {*} content 文本内容
 * @param {*} tags 标签信息列表
 */
const saveFile = (fullpath, content, tags=[]) => {
    try{
        // 保存text.md
        let dir=path.dirname(fullpath);
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir,{recursive:true});
        }
        fs.writeFileSync(fullpath, content, 'utf-8');

        // 保存标签信息到info.json文件中
        const jsonFilePath= path.join(path.dirname(fullpath), "info.json");
        const json=JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
        json.tags=(tags || []);
        fs.writeFileSync(jsonFilePath, JSON.stringify(json), 'utf-8')
        return true;
    }catch(e){
        return {
            succ: false,
            msg: "写入文件失败，请稍后重试"
        };
    }
}

const getTagsByMdFullPath=(mdFullpath)=>{
    const jsonFilePath= path.join(path.dirname(mdFullpath), "info.json");
    const json=common.readJsonFromFile(jsonFilePath);
    return json.tags || [];
};

/**
 * 创建导图的包
 */
const createMapBundle=(bundleFullpath, content)=>{
    try{
        const attDir=path.join(bundleFullpath, 'assets');
        const mdFullpath=path.join(bundleFullpath, 'text.md');
        const jsonFullpath=path.join(bundleFullpath, 'info.json');
        const placeHolderFilePath=path.join(bundleFullpath, 'assets', '.keep');

        if(!fs.existsSync(attDir)){
            fs.mkdirSync(attDir,{recursive:true});
        }
        fs.closeSync(fs.openSync(placeHolderFilePath, 'w'));
        fs.writeFileSync(jsonFullpath, "{}", 'utf-8');
        fs.writeFileSync(mdFullpath, content, 'utf-8');
        return true;
    }catch(e){
        return {
            succ: false,
            msg: "创建导图文件失败，请稍后重试"
        };
    }
};


/**
 * 从指定导图克隆
 * @param bundleFullpath 目标路径
 * @param fromBundleFullpath 来源路径
 * @return {txt, tags}
 */
const copyMapBundle=(bundleFullpath, fromBundleFullpath)=>{
    try{
        const fromMdPath=path.join(fromBundleFullpath, 'text.md');
        const fromJsonPath=path.join(fromBundleFullpath, 'info.json');
        const fromAttDir=path.join(fromBundleFullpath, 'assets');

        const attDir=path.join(bundleFullpath, 'assets');
        const mdFullpath=path.join(bundleFullpath, 'text.md');
        const jsonFullpath=path.join(bundleFullpath, 'info.json');
        const placeHolderFilePath=path.join(bundleFullpath, 'assets', '.keep');

        // 创建附件目录、复制导图文件和设置文件
        if(!fs.existsSync(attDir)){
            fs.mkdirSync(attDir,{recursive:true});
        }
        fs.copyFileSync(fromMdPath, mdFullpath);
        fs.copyFileSync(fromJsonPath, jsonFullpath);

        // 附件目录中的内容复制一份
        fs.readdirSync(fromAttDir, { withFileTypes: true }).filter(ent => ent.isFile()).forEach(ent => {
            const fromAttItem=path.join(fromAttDir, ent.name);
            const toAttItem=path.join(attDir, ent.name);
            fs.copyFileSync(fromAttItem, toAttItem);
        });
        if(!fs.existsSync(placeHolderFilePath)){
            fs.closeSync(fs.openSync(placeHolderFilePath, 'w'));
        }
        return {
            txt: fs.readFileSync(mdFullpath, 'utf-8'),
            tags: JSON.parse(fs.readFileSync(jsonFullpath, 'utf-8')).tags??[],
        };
    }catch(e){
        return {
            succ: false,
            msg: "创建导图文件失败，请稍后重试"
        };
    }
};

const loadMapBundle=(bundleFullpath)=>{
    try{
        const mdFullpath=path.join(bundleFullpath, 'text.md');
        const jsonFullpath=path.join(bundleFullpath, 'info.json');
        return {
            txt: fs.readFileSync(mdFullpath, 'utf-8'),
            tags: JSON.parse(fs.readFileSync(jsonFullpath, 'utf-8')).tags??[],
        };
    }catch(e){
        return {
            succ: false,
            msg: "创建导图文件失败，请稍后重试"
        };
    }
};


const selPicFile = () => {
    return dialog.showOpenDialogSync(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: '图片', extensions: 'bmp,jpg,jpeg,png,gif,svg,webp'.split(',') },
            { name: '所有', extensions: ['*'] }
        ]
    });
}

/**
 * 导出markdown：
 * 默认文件名会根据导图的包名或指定的名称生成，以指定的名称优先。
 * 最终导出的压缩包中的包名会根据实际的文件名生成。
 * @param {*} mdFullpath 
 * @returns 
 */
const expMarkdown=(mdFullpath,assignedTitle=null, assignedMdTxt=null)=>{
    // 选择导出路径：
    // 如果指定了名称，则以该名称为默认文件名
    // 否则以导图的包名去掉.textbundle后缀作为默认文件名
    const bundleDir=path.dirname(mdFullpath); 
    let bundleName=path.basename(bundleDir, ".textbundle");
    if(assignedTitle){
        bundleName=assignedTitle;
    }
    let expZipFilePath=dialog.showSaveDialogSync(mainWindow, {
        defaultPath: bundleName+".zip",
        properties: ['showHiddenFiles'],
            filters: [
                { name: 'zip', extensions: ['zip'] },
            ]
    });
    if(!expZipFilePath){
        return;
    }
    if(fs.existsSync(expZipFilePath)){
        fs.rmSync(expZipFilePath, {
            force: true,
            recursive: true,
        });
    }

    // 根据导出文件名计算出带.textbundle后缀的名称作为包名
    // 并在工作目录中的一个临时目录中创建此包
    // 然后把来源目录中的内容复制到此包中
    // 如果指定了内容，则覆盖包中text.md文件内容
    let destBundleName=path.basename(expZipFilePath, ".zip");
    destBundleName=(destBundleName.endsWith(".textbundle") ? destBundleName : destBundleName+".textbundle");
    const tmpDir=path.join(workPath, ""+new Date().getTime(), destBundleName);
    fs.mkdirSync(tmpDir, {recursive:true});
    common.dirCopy(bundleDir, tmpDir);
    if(assignedMdTxt){
        fs.writeFileSync(path.join(tmpDir,'text.md'), assignedMdTxt, 'utf-8');
    }
    
    // 包目录打包生成结果文件
    sendCmdToServer("zip", {srcDir: tmpDir , destZipFullpath:expZipFilePath, containsRootDir:true,}).then(rs=>{
        if(rs.succ){
            appSvc.showNotification('markdown已导出', `保存在如下路径：\r\n${expZipFilePath}`, 'succ');
            return;
        }
        appSvc.showNotification('markdown导出有误', rs.msg, 'err');
    });
};



/**
 * 导出html
 * @param {*} mdFullpath 
 * @param {*} assignedTitle 
 * @param {*} assignedMdTxt 
 */
const expHtml=(mdFullpath,assignedTitle=null, assignedMdTxt=null)=>{
    // 选择导出路径：
    // 如果指定了名称，则以该名称为默认文件名
    // 否则以导图的包名去掉.textbundle后缀作为默认文件名
    const bundleDir=path.dirname(mdFullpath); 
    let bundleName=path.basename(bundleDir, ".textbundle");
    if(assignedTitle){
        bundleName=assignedTitle;
    }
    let expZipFilePath=dialog.showSaveDialogSync(mainWindow, {
        defaultPath: bundleName+".zip",
        properties: ['showHiddenFiles'],
            filters: [
                { name: 'zip', extensions: ['zip'] },
            ]
    });
    if(!expZipFilePath){
        return;
    }
    


    // 根据导出文件名计算出不带.textbundle后缀的名称作为标题名
    // 并在工作目录中的创建一个临时目录
    // 然后把来源目录中的内容与html模板目录中的内容复制到此临时目录中
    // 如果指定了内容，则使用该内容替换模板html文件中的指定部分，否则使用text.md文件内容替换
    let titleName=path.basename(expZipFilePath, ".zip");
    if(titleName.endsWith(".textbundle")){
        titleName=titleName.substring(0, titleName.length-".textbundle".length);
    }
    const tmpDir=path.join(workPath, ""+new Date().getTime());
    const tmpHtmlPath=path.join(tmpDir, 'index.html');
    const tmpMdPath=path.join(tmpDir, 'text.md');
    const tmpJsonPath=path.join(tmpDir, 'info.json');

    fs.mkdirSync(tmpDir, {recursive:true});
    common.dirCopy(bundleDir, tmpDir);
    common.dirCopy(htmlTmplDir, tmpDir);
    
    let htmlContent=fs.readFileSync(tmpHtmlPath, "utf-8");
    htmlContent=htmlContent.replace("#title#", titleName);
    if(assignedMdTxt){
        htmlContent=htmlContent.replace("#cont#", assignedMdTxt);
    }else{
        const fullMdTxt=fs.readFileSync(tmpMdPath, 'utf-8');
        htmlContent=htmlContent.replace("#cont#", fullMdTxt);
    }
    fs.writeFileSync(tmpHtmlPath, htmlContent, 'utf-8');
    fs.rmSync(tmpMdPath, {force: true,recursive: true,});
    fs.rmSync(tmpJsonPath, {force: true,recursive: true,});

    // 包目录打包生成结果文件，如果存在先删除之前的
    if(fs.existsSync(expZipFilePath)){
        fs.rmSync(expZipFilePath, {
            force: true,
            recursive: true,
        });
    }
    sendCmdToServer("zip", {srcDir: tmpDir , destZipFullpath:expZipFilePath, containsRootDir:false,}).then(rs=>{
        if(rs.succ){
            appSvc.showNotification('html已导出', `保存在如下路径：\r\n${expZipFilePath}`, 'succ');
            return;
        }
        appSvc.showNotification('html导出有误', rs.msg, 'err');
    })
};


/**
 * 静默复制文本，不提示
 * @param {*} txt 
 */
const copyTxtQuiet=(txt)=>{
    clipboard.writeText("string"===typeof(txt) ? txt : ""+txt);
};



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
            { name: '所有', extensions: ['*'] },
        ];
        if('pdf'===ext){
            filters= [
                { name: 'pdf', extensions: ['pdf'] },
            ];
        }
        if('word'===ext){
            filters= [
                { name: 'doc', extensions: ['doc'] },
                { name: 'docx', extensions: ['docx'] },
            ];
        }
        if('md'===ext){
            filters= [
                { name: 'markdown', extensions: ['md'] },
                { name: '所有', extensions: ['*'] },
            ];
        }
        if('html'===ext){
            filters= [
                { name: 'html文件', extensions: ['html'] },
                { name: '所有', extensions: ['*'] },
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


const expPdf=()=>{
    return new Promise((res, rej)=>{
        (async()=>{
            try{
                const path="C:\\Users\\Administrator\\Desktop\\333.pdf"; //await openSaveFileDlg('pdf');
                const data=await mainWindow.webContents.printToPDF({printSelectionOnly: true,});
                fs.writeFileSync(path, data);
                res();
            }catch(e){
                common.log(e);
                rej(e);
            }
        })();
    });
};



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
    let url =common.wrapFileProtocol(mapsPath); //转换为file协议的url
    openUrl(url);
}

/**
 * 打开当前导图目录
 * @param {*} mdFullpath 导图markdown文件路径
 */
const openCurrMapDir=(mdFullpath)=>{
    const bundleDir= path.dirname(mdFullpath);
    openUrl(`file:///${bundleDir}`);
};










//===========工具方法  ================================================
/**
 * 把url拆分成多个部分
 * abc.txt@@notepad.exe -> ['abc.txt', 'notepad.exe']
 * @param url
 * @return {string[]}
 */
const splitUrlParts=(url)=>{
    return url = `${url ?? ''}`.trim().split("@@").map(item => item.trim());
};

/**
 * 去掉指定前缀
 * @param txt
 * @param prefs
 * @return {string}
 */
const trimPrefs=(txt="", prefs=[])=>{
    return prefs.reduce((accu, pref)=>{
        accu=accu.trim();
        if(accu.startsWith(pref)){
            accu=accu.substring(pref.length).trim();
        }
        return accu;
    },txt.trim());
};

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






const hasDevToolExtension=()=>(process && process.env && process.env.DEV_TOOL_EXTENSION_URL ? true : false);

const isMaximized=()=>(mainWindow.isMaximized());

const getInnerModuleVersions=()=>(process.versions);




/**
 * 向助手程序发送内容并得到结果
 * @param {*} action 
 * @param {*} data 
 * @returns 
 */
const sendCmdToServer=(action, data)=>{
    return common.send(action, data);
};


const loadCtxMenu=(url)=>{
    return sendCmdToServer("loadCtxMenu",{url});
};

const encryptTxt=(txt='')=>{
    return sendCmdToServer("enc",{
        enc: true,
        txt,
    });
};
const decryptTxt=(txt='')=>{
    return sendCmdToServer("enc",{
        enc: false,
        txt,
    });
};

const decryptTxtBatch=(txts=[])=>{
    return sendCmdToServer("enc",{
        enc: false,
        txts,
    });
};


/**
 * 进程通信暴露的方法
 */
const ipcHandlers={
    loadCtxMenu,
    takeScreenShot,
    screenShotCombine,
    loadIcon,
    getInnerModuleVersions,

    openMapsDir,

    isMaximized,
    getBasePath,
    openUrl,
    searchKeyword,
    existsGraph,
    getFileItem,
    openSaveFileDlg,
    listAllDirs,
    readFile,
    saveFile,
    createMapBundle,
    copyMapBundle,
    loadMapBundle,
    listFiles,
    existsFullpath,
    isUrlFormat,
    existsPic, 
    existsAtt,
    openPicByName,
    openAttByName,
    getPathItems,
    selPicFile,
    selAttFile,
    copyPicToImgsDir,
    copyClipboardPicToImgsDir,
    copyAttToAttsDir,
    calcPicUrl,
    calcAttUrl,
    openCurrMapDir,
    expPdf,
    expMarkdown,
    expHtml,
    copyTxtQuiet,
    isDevMode: common.isDevMode,
    searchInFile,
    searchAllTags,
    saveFileFromClipboard,
    getUrlFromClipboard,
    getImgUrlFromClipboard,
    getClipboardHasContent,

    encryptTxt,
    decryptTxt,
    decryptTxtBatch,
};



/**
 * 初始化工作：
 * 1、持有主窗口对象
 * 2、创建初始目录：导图目录、工作目录、缓存目录等
 * 3、启动后台监听服务，并监听其控制台输出，在得到启动完成标志后连接后台服务websocket，同时不再监听
 * @returns {*} promise 准备完成后调用promise的resolve
 */
const init=(_mainWindow)=>{
    return new Promise((res, rej)=>{
        mainWindow=_mainWindow;
        [mapsPath, workPath, cachePath].forEach(eachWorkdir=>{
            if(!fs.existsSync(eachWorkdir)){
                fs.mkdirSync(eachWorkdir,{recursive:true});
            }
        });

        common.regSyncAndAsyncIpcHandlers(ipcHandlers);

        // 连接超时检测配置
        const PONG_TIMEOUT_MS=3*60_000;
        const CHECK_PONG_TIMEOUT_INTERVAL_MS=60_000;
        const timeoutDetector=createTimeoutDetector(PONG_TIMEOUT_MS, CHECK_PONG_TIMEOUT_INTERVAL_MS, (distMs)=>{
            common.log(`ws server connection exception, not receive pong over ${parseInt(distMs/1000)}sec`, true);
            //appSvc.showNotification("错误", "后台服务连接失败", "err");
        });
        const option={
            onPong: ()=> timeoutDetector.signal(),
        };

        const assistProcess= spawn(fileRunnerPath, [`${process.pid}`], {cwd: externalPath});
        if(assistProcess && assistProcess.stdout){
            const assistListener=(data)=>{
                if(!(data instanceof Buffer)){
                    return;
                }
                if(ASSIST_STARTED_SYMBOL===data.toString("utf-8").trim()){
                    assistProcess.stdout.removeListener("data", assistListener);
                    server_info=JSON.parse(fs.readFileSync(path.join(workPath,'server_info'),'utf-8'));
                    common.log(`listener started, pid is ${server_info.pid}, url is ${server_info.connectUrl}`, true);
                    common.connWs(server_info.connectUrl, option).then(res);
                }
            };
            assistProcess.stdout.on("data", assistListener);
        }
    });
}

module.exports={
    //初始化
    init,
};