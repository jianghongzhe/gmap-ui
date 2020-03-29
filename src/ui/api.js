const {app} = window.require('electron').remote;

class Api{

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

    openPicByName=(name)=>{
        return app.openPicByName(name);
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

    calcPicUrl=(graphFileFullpath,picRelaPath)=>{
        return app.calcPicUrl(graphFileFullpath,picRelaPath);
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
            size:     item.isfile ? getSizeStr(item.size) :(item.emptyDir?"<空目录>":"<目录>")
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