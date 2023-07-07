import editorSvcEx from "./editorSvcEx";

const { ipcRenderer } = window.require('electron');


/**
 * 与主线程交互的接口层：
 * 1、其中尽量采用异步的方式通信，即invoke/handle；
 * 2、但有些三方组件的接口（marked）是使用同步方式调用，因此，增加了一部分同步的调用方式，即sendSync/on，方法名以Sync结尾以区分
 */
class Api{

    /**
     * 初始化查找对话框，需要在页面加载完之后调用
     */
    initFindInPageDlg=()=>{
        ipcRenderer.invoke('initFindInPage', 300);
    }

    /**
     * 显示查找对话框
     */
    showFindInPageDlg=()=>{
        ipcRenderer.invoke('showFindInPage', 300,140);
    }

    /**
     * 关闭查找对话框
     */
    closeFindInPageDlg=()=>{
        ipcRenderer.invoke('hideFindInPage');
    }

    /**
     * 获取查询对话框是否已显示
     * @returns 
     */
    getFindInPageDlgVisible=()=>{
        return ipcRenderer.invoke('getFindInPageVisible');
    };

    /**
     * 重新触发页面中查找
     */
    refindInPage=()=>{
        (async ()=>{
            const findInPageDlgVisible =await this.getFindInPageDlgVisible();
            if(findInPageDlgVisible){
                await ipcRenderer.invoke("refindInPage");
            }
        })();
    };

    /***
     * 打开版本历史
     */
    openReleaseNote=()=>{
        this.openUrl("https://gitee.com/gigi198436/gmap-ui/releases");
    };

    /**
     * 打开自动更新程序
     */
    openUpdateApp=()=>{
        ipcRenderer.invoke('openUpdateApp');
    };


    /**
     * 文件中查找
     * @param exp
     * @returns Promise {
     *     "reqId": 18,
     *     "succ": true,
     *     "msg": "",
     *     "data": [
     *         {
     *             "titleParts": [
     *                 "新建文件夹 / ", {"keyword": true, "txt": "新建3"}
     *             ],
     *             "contParts": [
     *                 {"keyword": true, "txt": "新建3"}, "blabla"
     *             ],
     *             "tags": ["标签3"],
     *             "fullTitle": "新建文件夹/新建3"
     *         }
     *     ]
     * }
     */
    searchInFile=(exp)=>{
        return ipcRenderer.invoke('searchInFile', {exp});
    };

    searchAllTags=()=>{
        return ipcRenderer.invoke('searchAllTags');
    };

    loadCtxMenu=(url)=>{
        return  ipcRenderer.invoke('loadCtxMenu', url);
    };


    /**
     * 静默复制文本
     * @param {*} txt 
     * @returns 
     */
    copyTxtQuiet=(txt)=>{
        return ipcRenderer.invoke('copyTxtQuiet', txt);
    };

    /**
     * 获取url对应的图标
     * @param {*} url 
     * @returns 
     */
    loadIcon=(url)=>{
        return ipcRenderer.invoke('loadIcon', url);
    };

    expMarkdown=(mdFullpath,assignedTitle=null, assignedMdTxt=null)=>{
        return ipcRenderer.invoke('expMarkdown', mdFullpath,assignedTitle, assignedMdTxt);
    };

    expHtml=(mdFullpath,assignedTitle=null, assignedMdTxt=null)=>{
        return ipcRenderer.invoke('expHtml', mdFullpath,assignedTitle, assignedMdTxt);
    };

    /**
     * 获取内部组件的版本号
     * @returns 
     */
    getInnerModuleVersions=()=>{
        return ipcRenderer.invoke('getInnerModuleVersions');
    }

    /**
     * 获取应用信息对象
     * @returns 
     */
    loadAppInfo=()=>{
        return ipcRenderer.invoke("loadAppInfo");
    }

    /**
     * 获取应用名称与版本的字符串
     * @returns 
     */
    loadAppNameAndVersionTxt=()=>{
        return this.loadAppInfo().then(({showname,version})=>showname+"　V"+version);
    }

    loadDepsVersion=()=>{
        return this.loadAppInfo().then(({react,antd})=>({react,antd}));
    };

    /**
     * 打开命令行窗口
     * @returns 
     */
    openBash=()=>{
        return ipcRenderer.invoke('openGitBash');
    }

    /**
     * 打开导图文件目录
     * @returns 
     */
    openMapsDir=()=>{
        return ipcRenderer.invoke('openMapsDir');
    }

    /**
     * 
     * @param {*} mdFullpath 
     * @returns 
     */
    openCurrMapDir=(mdFullpath)=>{
        return ipcRenderer.invoke('openCurrMapDir', mdFullpath);
    };

    /**
     * 重新加载应用页
     * @returns 
     */
    reloadAppPage=()=>{
        return ipcRenderer.invoke('reloadAppPage');
    }

    /**
     * 显示chrome控制台
     * @returns 
     */
    showDevTool=()=>{
        return ipcRenderer.invoke('openDevTool');
    }

    /**
     * 判断当前是否为开发模式（有些功能在开发模式和生产模式行为不同）
     * @returns 
     */
    isDevMode=()=>{
        return ipcRenderer.invoke('isDevMode');
    }

    /**
     * 进行屏幕截图 
     * @param {*} opt  {left,top,width,height,fileName}
     * @returns 
     */
    takeScreenShot=(opt)=>{
        return ipcRenderer.invoke('takeScreenShot', opt);
    };

    /**
     * 图片合并
     * @param {*} opt 
     * @returns 
     */
    screenShotCombine=(opt)=>{
        return ipcRenderer.invoke('screenShotCombine', opt);
    };

    /**
     * 获取主窗口是否为最大化
     * @returns 
     */
    isMaximized=()=>{
        return ipcRenderer.invoke('isMaximized');
    }

    /**
     * 显示系统通知
     * @param  {...any} args 
     * 1个值：消息内容
     * 2个值：标题、内容
     * 3个值：标题、内容、图标类型（succ、err、info、warn）
     * @returns 
     */
    showNotification=(...args)=>{
        return ipcRenderer.invoke('showNotification', ...args);
    }

    /**
     * 获取应用的根目录，即package.json所在目录
     * @returns 
     */
    getBasePath=()=>{
        return ipcRenderer.invoke('getBasePath');
    }

    searchKeyword=(kw)=>{
        return ipcRenderer.invoke('searchKeyword', kw);
    };

    /**
     * 打开指定url
     * @param {*} url 
     * @returns 
     */
    openUrl=(url, gpamOpener)=>{
        if(url.startsWith("gmap://")){
            (async ()=>{
                let fn=url.substring("gmap://".length);
                let flag=await ipcRenderer.invoke('existsGraph', fn);
                if(true!==flag){
                    this.showNotification('操作有误','链接已经失效，请修改后重试','err');
                    return;
                }

                let item=await ipcRenderer.invoke('getFileItem', fn);
                item={
                    showname:       item.name,
                    itemsName:      item.itemsName,
                    fullpath:       item.fullpath,
                    isfile:         item.isfile,
                    size:           '',
                    pic:            item.pic,
                    mdFullpath:     item.mdFullpath,
                    attDir:         item.attDir,
                    tags:           item.tags,
                };
                gpamOpener(item);
            })();
            return;
        }

        return ipcRenderer.invoke('openUrl', url);
    }

    /**
     * 打开保存文件对话框
     * @param {*} ext 
     * @returns 
     */
    openSaveFileDlg=(ext)=>{
        return ipcRenderer.invoke('openSaveFileDlg', ext);
    }

    /**
     * 列出所有层次的目录（不包含文件）
     * @returns 
     */
    listAllDirs=()=>{
        return ipcRenderer.invoke('listAllDirs');
    }

    /**
     * 读取文件内容
     */
    load=(fullpath)=>{
        return ipcRenderer.invoke('readFile', fullpath).then(ret=>{
            if('string'===typeof(ret)){
                return ret.replace(/\r/g,'').trim();//\r\n全部换为\n
            }
            return ret;
        });
    }

    loadMapBundle=(bundlePath)=>{
        return ipcRenderer.invoke('loadMapBundle', bundlePath);
    };

    /**
     * 保存文件
     */
    save=(fullpath,content, tags)=>{
        return ipcRenderer.invoke('saveFile', fullpath, content.replace(/\r/g,'').trim(), tags);
    }

    /**
     * 创建导图的包，包含其中的文件结构
     * @param {*} fullpath 
     * @param {*} content 
     * @returns 
     */
    createMapBundle=(fullpath,content)=>{
        return ipcRenderer.invoke('createMapBundle', fullpath, content.replace(/\r/g,'').trim());
    }

    copyMapBundle=(fullpath,sourceFullPath)=>{
        return ipcRenderer.invoke('copyMapBundle', fullpath, sourceFullPath);
    }





    /**
     * 列出所有文件
     */
    list=(basedir=null)=>{
        return ipcRenderer.invoke('listFiles', basedir).then(list=>{
            return list.map(item=>({
                showname:       item.name,
                itemsName:      item.itemsName,
                fullpath:       item.fullpath,
                isfile:         item.isfile,
                size:           item.isfile ? getSizeStr(item.size) :(item.emptyDir?"<空目录>":"<目录>"),
                pic:            item.pic,
                mdFullpath:     item.mdFullpath,
                attDir:         item.attDir,
                tags:           item.tags,
            }));
        });
    }

    /**
     * 路径是否存在
     * @param {*} fullpath 
     * @returns 
     */
    existsFullpath=(fullpath)=>{
        return ipcRenderer.invoke('existsFullpath', fullpath);
    }

    /**
     * 是否是url格式
     * @param {*} txt 
     * @returns 
     */
    isUrlFormat=(txt)=>{
        return ipcRenderer.invoke('isUrlFormat', txt);
    }

    /**
     * 指定名称的图片是否存在
     * @param {*} picName 
     * @returns 
     */
    existsPic=(picName)=>{
        return ipcRenderer.invoke('existsPic', picName);
    }

    /**
     * 指定名称的附件是否存在
     * @param {*} picName 
     * @returns 
     */
    existsAtt=(picName)=>{
        return ipcRenderer.invoke('existsAtt', picName);
    }

    /**
     * 打开指定名称的图片
     * @param {*} name 
     * @returns 
     */
    openPicByName=(name)=>{
        return ipcRenderer.invoke('openPicByName', name);
    }

    /**
     * 打开指定名称的附件
     * @param {*} name 
     * @returns 
     */
    openAttByName=(name)=>{
        return ipcRenderer.invoke('openAttByName', name);
    }

    /**
     * 导出pdf
     * @returns 
     */
    expPdf=()=>{
        return ipcRenderer.invoke('expPdf');
    };

    /**
     * 获得路径的每个部分
     * @param {*} dir 
     * @returns 
     */
    getPathItems=(dir=null)=>{
        return ipcRenderer.invoke('getPathItems', dir);
    }

    /**
     * 判断导图是否存在
     * @param {*} fn 相对于导图文件根路径的相对路径
     * @returns 
     */
    existsGraph=(fn)=>{
        return ipcRenderer.invoke('existsGraph', fn);
    }

    /**
     * 选择图片文件
     * @returns 图片全路径
     */
    selPicFile=()=>{
        return ipcRenderer.invoke('selPicFile');
    }

    /**
     * 选择附件文件
     * @returns 附件全路径
     */
    selAttFile=()=>{
        return ipcRenderer.invoke('selAttFile');
    }


    /**
     * 
     * @param {*} param0 {
     *  img:            true/false
     *  saveDir:        "d:/a/b"
     *  saveToPicHost:  true/false
     * }
     * @returns 
     */
    saveFileFromClipboard=({img, saveDir, saveToPicHost})=>{
        return ipcRenderer.invoke('saveFileFromClipboard', {img, saveDir, saveToPicHost});
    };

    getUrlFromClipboard=()=>{
        return ipcRenderer.invoke('getUrlFromClipboard', {});
    };

    getClipboardHasContent=()=>{
        return ipcRenderer.invoke('getClipboardHasContent', {});
    }

    getImgUrlFromClipboard=()=>{
        return ipcRenderer.invoke('getImgUrlFromClipboard', {});
    };



    /**
     * 复制剪切版中的图片到图片目录
     * @param {*} showName 
     * @param {*} currGraphFullpath 
     * @returns 
     */
    copyClipboardPicToImgsDir=(showName,currGraphFullpath)=>{
        return ipcRenderer.invoke('copyClipboardPicToImgsDir', showName,currGraphFullpath);
    }

    /**
     * 复制指定路径的图片到图片目录
     * @param {*} picFullpath 
     * @param {*} showName 
     * @param {*} currGraphFullpath 
     * @returns 
     */
    copyPicToImgsDir=(picFullpath,showName,currGraphFullpath)=>{
        return ipcRenderer.invoke('copyPicToImgsDir', picFullpath,showName,currGraphFullpath);
    }

    /**
     * 复制附件文件到附件目录
     * @param {*} picFullpath 
     * @param {*} showName 
     * @param {*} currGraphFullpath 
     * @returns 
     */
    copyAttToAttsDir=(picFullpath,showName,currGraphFullpath)=>{
        return ipcRenderer.invoke('copyAttToAttsDir', picFullpath, showName, currGraphFullpath);
    }
    
    /**
     * （同步）获取图片的真实url地址
     * @param {*} graphFileFullpath 
     * @param {*} picRelaPath 相对于图片目录的相对路径  ./aaa.jpg
     * @returns 
     */
    calcPicUrlSync=(graphFileFullpath,picRelaPath)=>{
        return ipcRenderer.sendSync('calcPicUrlSync', graphFileFullpath, picRelaPath);
    }

    /**
     * （同步）获取附件的真实url地址
     * @param {*} graphFileFullpath 
     * @param {*} picRelaPath 相对于附件目录的相对路径  ./bbb.txt
     * @returns 
     */
    calcAttUrlSync=(graphFileFullpath,picRelaPath)=>{
        return ipcRenderer.sendSync('calcAttUrlSync', graphFileFullpath, picRelaPath);
    }



    getSettingValue=(itemName)=>{
        return ipcRenderer.invoke('getSettingValue', itemName);
    }

    saveSettingValue=(itemName, itemVal)=>{
        return ipcRenderer.invoke('saveSettingValue', itemName, itemVal);
    }

    getEditorTheme=()=>{
        return this.getSettingValue(settingConst.editor_theme);
    };

    saveEditorTheme=(theme)=>{
        this.saveSettingValue(settingConst.editor_theme, theme);
    };






    saveAndGetAccHis=(bundlePath, accessTime, accessTimeStr)=>{
        return ipcRenderer.invoke('saveAndGetAccHis', bundlePath, accessTime, accessTimeStr).then(list=>{
            return list.map(item=>({
                showname:       item.name,
                itemsName:      item.itemsName,
                fullpath:       item.fullpath,
                isfile:         item.isfile,
                size:           getSizeStr(item.size),
                pic:            item.pic,
                mdFullpath:     item.mdFullpath,
                attDir:         item.attDir,
                tags:           item.tags,
                accTime:        item.accTime,
            }));
        });
    };

    listRecentOpenFiles=()=>{
        return ipcRenderer.invoke('listRecentOpenFiles').then(list=>{
            return list.map(item=>({
                showname:       item.name,
                itemsName:      item.itemsName,
                fullpath:       item.fullpath,
                isfile:         item.isfile,
                size:           item.isfile ? getSizeStr(item.size) :(item.emptyDir?"<空目录>":"<目录>"),
                pic:            item.pic,
                mdFullpath:     item.mdFullpath,
                attDir:         item.attDir,
                tags:           item.tags,
                accTime:        item.accTime,
            }));
        });
    };



}

const settingConst={
    editor_theme: "editor_theme",
    access_history: "access_history",
};




const getSizeStr=(size=0)=>{
    if(0===size){
        return "<空>";
    }
    if(size<1024){
        return "1K";
    }
    return parseInt(size/1000)+"K";
};

const inst=new Api();
export default inst;