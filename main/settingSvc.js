const path = require('path');
const fs = require('fs');
const os = require('os');
const common=require('./common');

const {settingFilePath}=require("./consts");




/**
 * 获得本机相关信息，用于识别不同机器，以使不同机器有不同设置
 * @return {{os: string, macs: Set<unknown>}}
 */
const getOsAndMacs=()=>{
    const isZeroMac=(mac)=>(''===mac.replace(/(00)|([:])/g,''));
    let nets=os.networkInterfaces();
    let macs=new Set();
    for(let key in nets){
        nets[key].filter(item=>true!==item.internal)
            .filter(item=>!isZeroMac(item.mac))
            .filter(item=>'ipv4'===item.family.toLowerCase())
            .map(item=>item.mac)
            .forEach(mac=>macs.add(mac));	;
    }
    macs=[...macs];
    return {
        os: os.version()+" "+os.arch(),
        macs
    };
};


/**
 * 填充系统设置项：
 * {
 *      settings: {
 *          editor_theme: 'default',
 *          theme: 'default',
 *          url_opener: 'default',
 *      }
 * }
 * @param item
 */
const baseFillSettingItems=(item)=>{
    if('undefined'===typeof(item.settings)){
        item.settings={};
    }

    // 单个值的项
    if('undefined'===typeof(item.settings.editor_theme)){
        item.settings.editor_theme='default';
    }
    if('undefined'===typeof(item.settings.theme)){
        item.settings.theme='default';
    }
    if('undefined'===typeof(item.settings.url_opener)){
        item.settings.url_opener='default';
    }
    if('undefined'===typeof(item.settings.img_opener)){
        item.settings.img_opener='default';
    }
    if('undefined'===typeof(item.settings.search_engine)){
        item.settings.search_engine='default';
    }

    // 多个值的项
    // 访问历史记录的设置
    if('undefined'===typeof(item.settings.access_history)){
        item.settings.access_history={
            show_cnt: 5,
            threshold_days: 365,
        };
    }else{
        if('undefined'===typeof(item.settings.access_history.show_cnt)){
            item.settings.access_history.show_cnt=5;
        }
        if('undefined'===typeof(item.settings.access_history.threshold_days)){
            item.settings.access_history.threshold_days=365;
        }
    }
}





/**
 * 获得新的系统设置对象，其中值都为默认值
 * @return {{theme: string}}
 */
const getDefaultSettings=()=>{
    const item=getOsAndMacs();
    baseFillSettingItems(item);
    return [item];
};



const isMatchSettingItem=(osAndMacs, settingItem)=>(settingItem.os===osAndMacs.os && settingItem.macs.some(item=>osAndMacs.macs.includes(item)));

/**
 * 把给定的系统设置对象转换为新的格式，即补充新出现的设置项等
 * 判断本机的依据：操作系统名称相同且mac地址之间有交集
 * 如果为本机，则以当前获取到的mac地址与之前记录过的mac地址的交集为新的mac地址
 * 补充没有的设置项
 * @param oldJson
 */
const fillNewSettingItems=(oldJson)=>{
    const osAndMacs=getOsAndMacs();
    let foundCurrMarchine=false;
    oldJson.forEach(each=>{
        const isCurrMachine=isMatchSettingItem(osAndMacs, each);
        if(isCurrMachine){
            foundCurrMarchine=true;
            each.macs=each.macs.filter(item=>osAndMacs.macs.includes(item)); // [...new Set([...each.macs, ...osAndMacs.macs])];
        }
        baseFillSettingItems(each);
    });
    if(!foundCurrMarchine){
        oldJson.push(getDefaultSettings()[0]);
    }
};

const getSettingValue=(itemName)=>{
    const osAndMacs=getOsAndMacs();
    const oldSettings=common.readJsonFromFile(settingFilePath);
    const val = oldSettings.filter(each=>isMatchSettingItem(osAndMacs, each))[0].settings[itemName];
    return val;
};

const saveSettingValue=(itemName, itemValue)=>{
    const osAndMacs=getOsAndMacs();
    const oldSettings=JSON.parse(fs.readFileSync(settingFilePath,'utf-8'));
    const oldJsonStr=JSON.stringify(oldSettings, null, 4);
    oldSettings.filter(each=>isMatchSettingItem(osAndMacs, each))[0].settings[itemName]=itemValue;
    const newJsonStr = JSON.stringify(oldSettings, null, 4);
    if(oldJsonStr!==newJsonStr){
        fs.writeFileSync(settingFilePath, newJsonStr, 'utf-8');
    }
};

const ipcHandlers={
    getSettingValue,
    saveSettingValue,
}


const init=(_mainWindow)=>{
    return new Promise((res, rej)=>{
        // 配置文件初始化：如果不存在，则创建并设置默认值；如果存在，则把新设置项加入（版本升级造成出现新设置项等）后重新保存
        if(!fs.existsSync(settingFilePath)){
            common.saveJsonToFile(getDefaultSettings(), settingFilePath);
        }else{
            const oldSettings=common.readJsonFromFile(settingFilePath);
            const oldJsonStr=JSON.stringify(oldSettings, null, 4);
            fillNewSettingItems(oldSettings);
            const newJsonStr = JSON.stringify(oldSettings, null, 4);
            if(oldJsonStr!==newJsonStr){
                fs.writeFileSync(settingFilePath, newJsonStr, 'utf-8');
            }
        }
        common.regIpcHandlers(ipcHandlers);
        common.regIpcHandlersSync(ipcHandlers);
        console.log("settingSvc init");
        res();
    });
};


module.exports={
    init,
    getSettingValue,
    saveSettingValue,
};