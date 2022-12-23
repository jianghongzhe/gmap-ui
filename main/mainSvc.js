const { app, BrowserWindow, Menu, shell,dialog,clipboard,nativeImage,net, ipcMain,Notification   } = require('electron');
const fs = require('fs');
const Url = require('url');
const { exec, spawn, execFile,execFileSync } = require('child_process');
const path = require('path');
const nodeNet = require('net');

const ws=require('./ws');
const common=require('./common');



//常量：工作区目录、主配置文件位置
const userPngImg=true;//默认是否
const appBasePath=path.join(__dirname, '../');;
const externalPath=path.join(__dirname, '../', 'externals');
const fileRunnerPath=path.join(__dirname, '../', 'externals', 'file_runner.exe');
const autoUpdaterDir=path.join(__dirname, '../../../', 'app_update');
const autoUpdaterPath=path.join(__dirname, '../../../', 'app_update', 'app_update.exe');
const htmlTmplDir=path.join(__dirname, '../', 'externals', 'tmpl_html'); 
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

const ASSIST_STARTED_SYMBOL="started";


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
    const factUrl=getFileProtocalUrl(attFullpath);

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
    return getFileProtocalUrl(attFullpath);
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
                        pic=getFileProtocalUrl(path.join(attDir, imgItems[0].name));
                        pic=encodeURI(pic);
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
    //console.log(ret);
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
    if(url.startsWith("cmdp://")){
        return sendCmdToServer("cmdp", {url});
    }
    if(url.startsWith("start://")){
        return sendCmdToServer("start", {url}).then(resp=>{
            if(resp && false===resp.succ){
                showNotification("操作有误", resp.msg, 'err');
            }
            return resp;
        });
    }
    // 命令打开目录
    if(url.startsWith("cmdopen://")){
        return sendCmdToServer("cmdopen", {url}).then(resp=>{
            if(resp && false===resp.succ){
                showNotification("操作有误", resp.msg, 'err');
            }
            return resp;
        });
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
    // 调用系统的打开方式来打开指定文件
    if(url.startsWith("openas://")){
        return sendCmdToServer("openas", {url}).then(resp=>{
            if(resp && false===resp.succ){
                showNotification("操作有误", resp.msg, 'err');
            }
            return resp;
        });
    }
    // 调用指定的打开方式来打开指定文件
    if(url.startsWith("openby://")){
        return sendCmdToServer("openby", {url}).then(resp=>{
            if(resp && false===resp.succ){
                showNotification("操作有误", resp.msg, 'err');
            }
            return resp;
        });
    }
    // 调用指定的打开方式来打开指定目录
    if(url.startsWith("diropenby://")){
        return sendCmdToServer("diropenby", {url}).then(resp=>{
            if(resp && false===resp.succ){
                showNotification("操作有误", resp.msg, 'err');
            }
            return resp;
        });
    }
    // 调用指定的打开方式来打开指定文件
    if(url.startsWith("openin://")){
        return sendCmdToServer("openin", {url}).then(resp=>{
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
    // 复制路径
    if(url.startsWith("cppath://")){
        return sendCmdToServer("cppath", {url}).then(resp=>{
            if(resp && resp.succ){
                showNotification(resp.data.title, resp.data.body, 'succ');
            }
            if(resp && false===resp.succ){
                showNotification("操作有误", resp.msg, 'err');
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
    const json=JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
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
            msg: "写入文件失败，请稍后重试"
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
            showNotification('markdown已导出', `保存在如下路径：\r\n${expZipFilePath}`, 'succ');
            return;
        }
        showNotification('markdown导出有误', rs.msg, 'err');
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
            showNotification('html已导出', `保存在如下路径：\r\n${expZipFilePath}`, 'succ');
            return;
        }
        showNotification('html导出有误', rs.msg, 'err');
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
    let url =getFileProtocalUrl(mapsPath); //转换为file协议的url
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
    // dependencies react antd
    let {name,showname,version,dependencies:{react,antd}}=JSON.parse(fs.readFileSync(packageJsonPath,'utf-8'));
    if(react.startsWith("^")){
        react=react.substring(1);
    }
    if(antd.startsWith("^")){
        antd=antd.substring(1);
    }
    appInfoCache={name,showname,version,react,antd};
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
        common.log(`app started, pid is: ${process.pid}`, true);

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
                    common.connWs(server_info.connectUrl).then(res);
                }
            };
            assistProcess.stdout.on("data", assistListener);
        }
    });
}


const openUpdateApp=()=>{
    if(!existsFullpath(autoUpdaterPath)){
        showNotification('未找到自动更新模块', '请安装该模块后再使用', 'err');
        return;
    }
    execFile(autoUpdaterPath, [`${process.pid}`], {cwd: autoUpdaterDir});
    return null;
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
    // const n=new Notification({ title, body, icon: icons[icon] });
    // n.show();
    // setTimeout(() => {
    //     n.close();
    // }, 6*1000);
    sendCmdToServer("notify", {pic:icons[icon], title, body }).then();
};



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




/**
 * 进程通信暴露的方法
 */
const ipcHandlers={
    loadCtxMenu,
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
    isMaximized,
    getBasePath,
    openUrl,
    existsGraph,
    getFileItem,
    openSaveFileDlg,
    listAllDirs,
    readFile,
    saveFile,
    createMapBundle,
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
    openUpdateApp,
    copyTxtQuiet,
    isDevMode: common.isDevMode,
    searchInFile,
    searchAllTags,
    saveFileFromClipboard,
    getUrlFromClipboard,
};

/**
 * 异步方法的代理
 * @param {*} handler 
 * @param {*} evt 
 * @param  {...any} args 
 * @returns 
 */
const delegateHandler=async (handler, evt, ...args)=>{
    const result = await handler(...args);
    return result;
};

/**
 * 同步方法的代理
 * @param {*} handler 
 * @param {*} evt 
 * @param  {...any} args 
 */
const delegateHandlerSync=(handler, evt, ...args)=>{
    (async()=>{
        const result=await handler(...args);
        evt.returnValue=result;
    })();    
};

/**
 * 接收异步调用并返回promise
 */
for(let key in ipcHandlers){
    ipcMain.handle(key, delegateHandler.bind(this, ipcHandlers[key]));
}

/**
 * 接收同步调用并返回实际结果
 */
for(let key in ipcHandlers){
    ipcMain.on(key+"Sync", delegateHandlerSync.bind(this, ipcHandlers[key]));
}




module.exports={
    //初始化
    init,
};