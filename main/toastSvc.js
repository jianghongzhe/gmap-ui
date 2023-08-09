const {BrowserWindow, ipcMain, screen } = require('electron');
const path = require("path");
const crypto= require("crypto");
const common=require("./common");



const noteWinFullPath= path.join(__dirname, "../" , "toast", "index.html");

/**
 * 提示窗口的大小
 */
const [noteWinW,noteWinH]=[366,112];

/**
 * 显示多个提示窗口时，之间的间距
 * @type {number}
 */
const noteWinMargin=8;

/**
 * 窗口在滑走前停留时间
 */
const remainMsBeforeSlideout=6_000;

/**
 * 窗口的公用属性：
 * 如果设置parent为主窗体，则主窗体最小化时也会跟着最小化，因此设置为null
 */
const commonWinAttrs={
    parent:         null,
    width:          noteWinW,
    height:         noteWinH,
    show:           false,
    resizable:      false,
    transparent :   true,
    frame:          false,
    titleBarStyle:  'hidden',
    skipTaskbar:    true,
    alwaysOnTop:    true,
    backgroundColor:'#003C3C3C',
    hasShadow:      false,
    webPreferences:     {
        nodeIntegration:    true,
        enableRemoteModule: true,
        contextIsolation: false,
    }
};


let mainWin=null;
let workArea=null; //  { Left: 0, Right: 2560, Top: 0, Bottom: 1400 }






/**
 *
 * @type {{}}
 */
const noteWins={};


/**
 * 加载工作区的位置，以便后面计算窗体位置时用
 * @return {Promise<null>}
 */
const postInit=()=>{
    return (async ()=>{
        const resp=await common.directCall.SysinfoService_GetSysinfo({});
        workArea=resp.workArea;
        return null;
    })();
};


/**
 * 计算将要显示的窗口的位置：
 * x为工作区右端留出空隙
 * y为当前已显示的最上面的窗口的上面，并留出空隙
 * @return {{x: number, y: number}}
 */
const calcNewWinPos=()=>{
    const minY= Object.values(noteWins)
            .map(v=>v.win)
            .reduce((accu, cur)=> Math.min(cur.getPosition()[1],accu), workArea.Bottom);
    return {
        x: workArea.Right-noteWinMargin-noteWinW,
        y: minY-noteWinMargin-noteWinH,
    };
};


/**
 *
 * @param winId
 */
const beginSlideOutWin=(winId)=>{
    if(!noteWins[winId]){
        return;
    }
    const [x,y]=noteWins[winId].win.getPosition();
    noteWins[winId].win.setPosition(x+100, y, false);
};




/**
 * 显示通知
 */
const showNotification=({title, txt, icon})=>{
    const {x,y}=calcNewWinPos();
    const winId= crypto.randomUUID().replace(/[-]/g,'');
    let findWin = new BrowserWindow({
        ...commonWinAttrs,
        x,
        y,
    });

    // 加载窗口html
    // 通过事件发送要显示的内容并显示窗口
    // 记录窗口id和窗口对象以及计算器的对应关系，以便窗口滑动动画和应用关闭时使用
    findWin.loadFile(noteWinFullPath).then(()=>{
        findWin.webContents.send("init-ele",{winId, title, txt, icon,});
        findWin.show();
        noteWins[findWin.id]={
            win: findWin,
            timer: setTimeout(beginSlideOutWin.bind(this, findWin.id), remainMsBeforeSlideout),
        };
    });
};


/**
 * 处理窗口关闭事件：
 * 移除定时器
 * 关闭窗口
 * 移除窗口id与窗口对象等的对应关系
 * @param winId
 */
const handleCloseWin=(winId)=>{
    if(!noteWins[winId]){
        return;
    }
    if(noteWins[winId].timer){
        clearTimeout(noteWins[winId].timer);
        noteWins[winId].timer=null;
    }
    noteWins[winId].win.close();
    delete noteWins[winId];
};


/**
 * 关闭全部窗口，被主窗口的关闭事件处理函数调用
 */
const closeAllNotifyWins=()=>{
    Object.keys(noteWins).forEach(winId=>handleCloseWin(winId));
};




const init=(_mainWindow)=>{
    mainWin=_mainWindow;


    ipcMain.on("will-close", (evt, args)=>{
        handleCloseWin(evt.sender.id);
    });

    const ipcHandlers={
        showNot: showNotification,
    };
    common.regSyncAndAsyncIpcHandlers(ipcHandlers);
}





module.exports={
    init,
    postInit,
    closeAllNotifyWins,
};




// test
 setTimeout(()=>{
     showNotification({
         txt: "fffffffsddddd"
     });
 }, 5_000);
setTimeout(()=>{
    showNotification({
        txt: "gogogo"
    });
}, 7_000);
setTimeout(()=>{
    showNotification({
        txt: "gogogo"
    });
}, 9_000);