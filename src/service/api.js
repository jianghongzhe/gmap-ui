import { FindInPage } from 'electron-find';


const {app,getCurrentWebContents} = window.require('electron').remote;


class Api{


    /**
     * 初始化查找对话框，需要在页面加载完之后调用
     */
    initFindInPageDlg=()=>{
        app.initFindInPage(300);
    }

    showFindInPageDlg=()=>{
        app.showFindInPage(300,140);
    }

    closeFindInPageDlg=()=>{
        app.hideFindInPage();
    }

    getInnerModuleVersions=()=>{
        return app.getInnerModuleVersions();
    }

    openBash=()=>{
        app.openGitBash();
    }

    openMapsDir=()=>{
        app.openMapsDir();
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

    


    
    loadAppInfo=()=>{
        return app.loadAppInfo();
    }

    reloadAppPage=()=>{
        app.reloadAppPage();
    }

    isUrlFormat=(txt)=>{
        return app.isUrlFormat(txt);
    }

    loadAppNameAndVersionTxt=()=>{
        let {showname,version}=this.loadAppInfo();
        return showname+"　V"+version;
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

    isDevMode=()=>{
        return app.isDevMode();
    }


    hasDevToolExtension=()=>{
        return app.hasDevToolExtension();
    }

    getDevToolExtensionUrl=()=>{
        return app.getDevToolExtensionUrl();
    }

    isMaximized=()=>{
        return app.isMaximized();
    }

    openSaveFileDlg=()=>{
        return app.openSaveFileDlg();
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

    openUrl=(url)=>{
        app.openUrl(url);
    }


    getPathItems=(dir=null)=>{
        return app.getPathItems(dir);
    }

    showDevTool=()=>{
        app.openDevTool();
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

    /**
     * 保存文件
     */
    save=(fullpath,content)=>{
        app.saveFile(fullpath,content.replace(/\r/g,'').trim());//\r\n全部换为\n
    }

    /**
     * 读取文件内容
     */
    load=(fullpath)=>{
        let ret=app.readFile(fullpath);
        if('string'===typeof(ret)){
            return ret.replace(/\r/g,'').trim();//\r\n全部换为\n
        }
        return ret;
    }

    getBasePath=()=>{
        return app.getBasePath();
    }

    listAllDirs=()=>{
        return app.listAllDirs();
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