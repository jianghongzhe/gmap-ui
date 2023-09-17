const path = require('path');


//常量：工作区目录、主配置文件位置
const userPngImg=true;//默认是否
const appBasePath=path.join(__dirname, '../');
const externalPath=path.join(__dirname, '../', 'externals');
const fileRunnerPath=path.join(__dirname, '../', 'externals', 'file_runner.exe');
const backendExePath=path.join(__dirname, '../', 'externals', 'gmap-backend.exe');
const autoUpdaterDir=path.join(__dirname, '../../../', 'app_update');
const autoUpdaterPath=path.join(__dirname, '../../../', 'app_update', 'app_update.exe');
const htmlTmplDir=path.join(__dirname, '../', 'externals', 'tmpl_html');
const mapsPath=path.join(__dirname, '../', 'gmaps');
const settingFilePath=path.join(__dirname, '../', 'gmaps','setting.json');
const opLogFilePath=path.join(__dirname, '../', 'gmaps','oplog.json');
const imgsPath=path.join(__dirname, '../', 'gmaps','imgs');
const attsPath=path.join(__dirname, '../', 'gmaps','atts');
const workPath=path.join(__dirname, '../', 'work');
const cachePath=path.join(__dirname, '../', 'cache');
const packageJsonPath=path.join(__dirname, '../', 'package.json');

const protoPath=path.join(__dirname, 'proto');


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

/**
 * 默认搜索引擎url字符串，其中关键词部分需要以 ##kw## 包裹
 * @type {string}
 */
const DEFAULT_SEARCH_URL="https://www.baidu.com/s?wd=##kw##";

const ASSIST_STARTED_SYMBOL="started";


const SLASH='/';
const BACK_SLASH='\\';

const IMG_EXTS=[
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.bmp',
    '.webp',
    '.svg',
];


module.exports = {
    userPngImg,
    appBasePath,
    externalPath,
    fileRunnerPath,
    backendExePath,
    autoUpdaterDir,
    autoUpdaterPath,
    htmlTmplDir,
    mapsPath,
    settingFilePath,
    opLogFilePath,
    imgsPath,
    attsPath,
    workPath,
    cachePath,
    packageJsonPath,
    protoPath,
    iconSuccPath,
    iconFailPath,
    iconWarnPath,
    iconInfoPath,
    icons,
    DEFAULT_SEARCH_URL,
    ASSIST_STARTED_SYMBOL,
    SLASH,
    BACK_SLASH,
    IMG_EXTS,
};