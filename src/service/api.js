import {message} from 'antd';
import {dispatcher} from '../common/gflow';

const {app} = window.require('electron').remote; //window.require('@electron/remote');// window.require('electron').remote;
const { ipcRenderer } = window.require('electron');

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
     * 获取url对应的图标
     * @param {*} url 
     * @returns 
     */
    loadIcon=(url)=>{
        return ipcRenderer.invoke('loadIcon', url);
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

    /**
     * 打开指定url
     * @param {*} url 
     * @returns 
     */
    openUrl=(url)=>{
        if(url.startsWith("gmap://")){
            (async ()=>{
                let fn=url.substring("gmap://".length);
                let flag=await ipcRenderer.invoke('existsGraph', fn);
                if(true!==flag){
                    this.showNotification('操作有误','链接已经失效，请修改后重试','err');
                    return;
                }

                let item=await ipcRenderer.invoke('getFileItem', fn);
                dispatcher.tabs.onSelItemPromise(item).then();
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

    /**
     * 保存文件
     */
    save=(fullpath,content)=>{
        return ipcRenderer.invoke('saveFile', fullpath, content.replace(/\r/g,'').trim());
    }


    /**
     * 列出所有文件
     */
    list=(basedir=null)=>{
        return ipcRenderer.invoke('listFiles', basedir).then(list=>{
            return list.map(item=>({
                showname: item.name,
                itemsName:item.itemsName,
                fullpath: item.fullpath,
                isfile:   item.isfile,
                size:     item.isfile ? getSizeStr(item.size) :(item.emptyDir?"<空目录>":"<目录>"),
                pic:      item.pic,
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
     * 获得路径的每个部分
     * @param {*} dir 
     * @returns 
     */
    getPathItems=(dir=null)=>{
        return ipcRenderer.invoke('getPathItems', dir);
    }

    


    
    

    

    

    

    existsGraph=(fn)=>{
        return app.existsGraph(fn);
    }

    copyClipboardPicToImgsDir=(showName,currGraphFullpath)=>{
        return app.copyClipboardPicToImgsDir(showName,currGraphFullpath);
    }

    copyPicToImgsDir=(picFullpath,showName,currGraphFullpath)=>{
        return app.copyPicToImgsDir(picFullpath,showName,currGraphFullpath);
    }
    copyAttToAttsDir=(picFullpath,showName,currGraphFullpath)=>{
        return app.copyAttToAttsDir(picFullpath,showName,currGraphFullpath);
    }

    selPicFile=()=>{
        let rs=app.selPicFile();
        // // console.log("选择目录结果",rs);
        return rs;

        // dialog.showOpenDialog({properties: ['openFile']}, (files)=>{
        //     if (files){
        //         console.log("选",files);
        //         return;
        //     }
        //     console.log("未选");
        // });
    }

    


    

    

    

    selAttFile=()=>{
        let rs=app.selAttFile();
        return rs;
    }

    calcPicUrl=(graphFileFullpath,picRelaPath)=>{
        return app.calcPicUrl(graphFileFullpath,picRelaPath);
    }
    calcAttUrl=(graphFileFullpath,picRelaPath)=>{
        return app.calcAttUrl(graphFileFullpath,picRelaPath);
    }

    

    


    

    

    

    

    

    

    
}




const getSizeStr=(size=0)=>{
    if(0===size){
        return "<空>";
    }
    if(size<1024){
        return "1K";
    }
    return parseInt(size/1000)+"K";
};

export default new Api();