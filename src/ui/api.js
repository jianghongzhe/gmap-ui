const app = window.require('electron').remote.app;

class Api{

    openBash=()=>{
        app.openGitBash();
    }

    openMapsDir=()=>{
        app.openMapsDir();
    }

    exists=(fn)=>{
        return app.exists(fn);
    }

    openLink=(url)=>{
        app.openLink(url);
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
            size:     item.isfile ? getSizeStr(item.size) :(item.emptyDir?"<空目录>":"<目录>")
        }));
    }

    /**
     * 保存文件
     */
    save=(fullpath,content)=>{
        app.saveFile(fullpath,content.replace(/\r/g,''));//\r\n全部换为\n
    }

    /**
     * 读取文件内容
     */
    load=(fullpath)=>{
        let ret=app.readFile(fullpath);
        if('string'===typeof(ret)){
            return ret.replace(/\r/g,'');//\r\n全部换为\n
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