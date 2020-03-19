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


    getPathItems=(basedir=null)=>{
        return app.getPathItems(basedir);
    }

    /**
     * 列出所有文件
     */
    list=(basedir=null)=>{
        

        // const fs = window.require('fs');

        // const root = fs.readdirSync('/');
        // console.log(root);
        // console.log(__dirname);
        
         
        /*
            name:       fn,
            fullpath:   fullpath,
            size
        */
        return app.listFiles(basedir).map(item=>({
            showname: item.name,
            itemsName:item.itemsName,
            fullpath: item.fullpath,
            isfile:   item.isfile,
            size:     item.isfile ? getSizeStr(item.size) :"<目录>"
        }));
        

        

        // let fsapi=require("fs");
        // console.log("api",fsapi);
        // console.log("api",fsapi.readdirSync);
        // console.log("result",fsapi.listdirSync());

        // return [
        //     {
        //         showname:'数据结构',
        //         fullpath:'d:/a/b/c/数据结构.md',
        //         size:'108K'
        //     },
        //     {
        //         showname:'算法',
        //         fullpath:'d:/a/b/c/算法.md',
        //         size:'1.2M'
        //     },
        //     {
        //         showname:'rocketmq',
        //         fullpath:'d:/a/b/c/rocketmq.md',
        //         size:'73K'
        //     },
        //     {
        //         showname:'mysql',
        //         fullpath:'d:/a/b/c/mysql.md',
        //         size:'92K'
        //     }
        // ];
    }

    /**
     * 保存文件
     */
    save=(fullpath,content)=>{
        app.saveFile(fullpath,content);
    }

    /**
     * 读取文件内容
     */
    load=(fullpath)=>{
        return app.readFile(fullpath);

        // console.log("读取了文件",fullpath);
        // let defMapTxt=""+
        //     "- JVM\n"+
        //     "\t- bbb\n"+
        //     "\t- ccc\n"+
        //     "\t- ddd\n"+
        //     "\t- eee\n"+
        //     "\t- fff\n"+
        //     "\t- ggg\n"+
        //     "\t\t- sss|m:说明一下哈哈\n"+
        //     "\t- dfa\n"+
        //     "\t- sdfsd";
        // return defMapTxt;
    }
}


const getSizeStr=(size=0)=>{
    if(0===size){
        return "0K";
    }
    if(size<1024){
        return "1K";
    }
    return parseInt(size/1000)+"K";
};

export default new Api();