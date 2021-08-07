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


    openUrl=(url)=>{
        if(url.startsWith("gmap://")){
            (async ()=>{
                let fn=url.substring("gmap://".length);
                let flag=await ipcRenderer.invoke('existsGraph', fn);
                if(true!==flag){
                    message.warning("链接已经失效，请修改后重试");
                    return;
                }

                let item=await ipcRenderer.invoke('getFileItem', fn);
                dispatcher.tabs.onSelItemPromise(item).then();
                // console.log("笔记链接跳转：",url,item);
            })();
            return;
        }
        return ipcRenderer.invoke('openUrl', url);
    }

    openSaveFileDlg=(ext)=>{
        return ipcRenderer.invoke('openSaveFileDlg', ext);
    }

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


    existsFullpath=(fullpath)=>{
        return app.existsFullpath(fullpath);
    }

    existsPic=(picName)=>{
        return app.existsPic(picName);
    }

    existsAtt=(picName)=>{
        return app.existsAtt(picName);
    }

    openPicByName=(name)=>{
        return app.openPicByName(name);
    }

    openAttByName=(name)=>{
        return app.openAttByName(name);
    }

    


    
    

    

    isUrlFormat=(txt)=>{
        return app.isUrlFormat(txt);
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

    

    


    getPathItems=(dir=null)=>{
        return app.getPathItems(dir);
    }

    

    /**
     * 列出所有文件
     */
    list=(basedir=null)=>{
        return app.listFiles(basedir).map(item=>({
            showname: item.name,
            itemsName:item.itemsName,
            fullpath: item.fullpath,
            isfile:   item.isfile,
            size:     item.isfile ? getSizeStr(item.size) :(item.emptyDir?"<空目录>":"<目录>"),
            pic:      item.pic,
        }));

        
        
        
        
        
        
                
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