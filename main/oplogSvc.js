const path = require('path');
const fs = require('fs');
const common=require('./common');
const settingSvc=require("./settingSvc");

const {mapsPath, opLogFilePath}=require("./consts");






const baseFillOpLog=(item)=>{
    if('undefined'===typeof(item.access_history) || !Array.isArray(item.access_history)){
        item.access_history=[];
    }
};




/**
 * // {
 *                 //     bundle_path: "/dev/java",
 *                 //     access_time: 1688494282618,
 *                 //     access_time_str: "23.07.05 三 02:10:55",
 *                 // },
 * @return {{access_history: *[]}}
 */
const getDefaultOpLog=()=>{
    const item={};
    baseFillOpLog(item);
    return item;
};





const listRecentOpenFiles=(assignedAccHis)=>{

    const {show_cnt, threshold_days}=settingSvc.getSettingValue("access_history");
    const mapExt=".textbundle";
    const list=[];
    const now=new Date().getTime();

    const accHis=(Array.isArray(assignedAccHis) ? assignedAccHis : getAccHis());
    accHis.forEach(({bundle_path, access_time, access_time_str})=>{
        if(list.length>=show_cnt){
            return;
        }

        // 以下假设导图目录为 d:\gmap\gmaps
        // bundle_path- a/b/haha
        // fullpath   - d:\gmap\gmaps\a\b\haha.textbundle
        // mdFullpath - d:\gmap\gmaps\a\b\haha.textbundle\text.md
        // attDir     - d:\gmap\gmaps\a\b\haha.textbundle\assets
        // itemsName  - a/b/haha
        // showName   - haha
        const fullpath =path.join(mapsPath, `${bundle_path.replace(/[/]/g,'\\')}${mapExt}`);
        const mdFullpath=path.join(fullpath, 'text.md');
        const jsonFilePath=path.join(fullpath, 'info.json');
        if(!fs.existsSync(mdFullpath) || !fs.existsSync(jsonFilePath)){
            return;
        }
        const attDir=path.join(fullpath,'assets');
        const showName= bundle_path.substring(Math.max(bundle_path.lastIndexOf("/"), bundle_path.lastIndexOf("\\"))+1);
        const itemsName=bundle_path;
        const tags= common.readJsonFromFile(jsonFilePath).tags??[];

        // 图片路径
        let pic=null;
        const imgItems=fs.readdirSync(attDir, { withFileTypes: true }).filter(ent=>{
            const tmpFn=ent.name.toLowerCase().trim();
            return ['.png','.jpg','.jpeg','.gif','.bmp'].some(eachExt=>tmpFn.endsWith(eachExt));
        });
        if(0<imgItems.length){
            if(common.isDevMode()){
                pic= common.getDevServerFaviconUrl();
            }else{
                pic=common.wrapFileProtocol(path.join(attDir, imgItems[0].name));
            }
        }

        let lastAcc=null;
        const msDist=Math.abs(now-access_time);
        const distDays=Math.floor(msDist/86400_000);
        if(distDays>threshold_days){
            lastAcc=`${access_time_str}`;
        }else{
            if(distDays>=365){
                lastAcc=`${parseInt(distDays/365)} 年前`;
            }else if(distDays>=30){
                lastAcc=`${parseInt(distDays/30)} 个月前`;
            }else if(distDays>=1){
                lastAcc=`${parseInt(distDays)} 天前`;
            }else if(msDist>=3600_000){
                lastAcc=`${parseInt(msDist/3600_000)} 小时前`;
            }else if(msDist>=60_000){
                lastAcc=`${parseInt(msDist/60_000)} 分钟前`;
            }else{
                lastAcc=`刚刚`;
            }
        }


        list.push({
            name:       showName,
            itemsName:  itemsName,//显示在选项卡上的名称：eg. front/css3
            fullpath,
            mdFullpath,
            attDir,
            isfile:     true,
            emptyDir:   false,
            size:       fs.statSync(mdFullpath).size,
            pic:        pic,
            tags,
            accTime:    lastAcc,
        });
    });
    return list;
};



const getAccHis=()=>{
    const opLog=common.readJsonFromFile(opLogFilePath);
    return opLog.access_history;
};


const saveAndGetAccHis=( bundlePath, accessTime, accessTimeStr)=>{
    const opLog=common.readJsonFromFile(opLogFilePath);
    const filteredItems=opLog.access_history.filter(item=> item.bundle_path!==bundlePath);
    opLog.access_history=[
        {
            bundle_path: bundlePath,
            access_time: accessTime,
            access_time_str: accessTimeStr,
        },
        ...filteredItems,
    ];
    common.saveJsonToFile(opLog, opLogFilePath);
    return listRecentOpenFiles(opLog.access_history);
};


const ipcHandlers={
    saveAndGetAccHis,
    getAccHis,
    listRecentOpenFiles,
};


const init=(_mainWindow)=>{
    return new Promise((res, rej)=>{
        if(!fs.existsSync(opLogFilePath)){
            common.saveJsonToFile(getDefaultOpLog(), opLogFilePath);
        }else{
            const oldOpLog=JSON.parse(fs.readFileSync(opLogFilePath,'utf-8'));
            const oldJsonStr=JSON.stringify(oldOpLog, null, 4);
            baseFillOpLog(oldOpLog);
            const newJsonStr = JSON.stringify(oldOpLog, null, 4);
            if(oldJsonStr!==newJsonStr){
                fs.writeFileSync(opLogFilePath, newJsonStr, 'utf-8');
            }
        }
        common.regSyncAndAsyncIpcHandlers(ipcHandlers);
        console.log("oplogSvc init");
        res();
    });
};

module.exports={
    init,
    saveAndGetAccHis,
    listRecentOpenFiles,
};