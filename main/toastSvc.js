const {BrowserWindow,webContents , ipcMain, screen } = require('electron');
const { exec, spawn, execFile,execFileSync } = require('child_process');
const path = require("path");
const fs = require("fs");
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


const animConfig= {
    fps: 60,
    duration: 250,
    fromPos: 0, // 待填充
    toPos: 0, // 待填充,
    ranges: [
        [50, 1.2],
        [70, 1.5],
    ],
};

const animFrames={
    interval: 0,
    poses: [],
};


let mainWin=null;
let workArea=null; //  { Left: 0, Right: 2560, Top: 0, Bottom: 1400 }
let screenW=null;






/**
 *
 * @type {{}}
 */
const noteWins={};





/**
 * 计算将要显示的窗口的位置：
 * x为工作区右端留出空隙
 * y为当前已显示的最上面的窗口的上面，并留出空隙
 * @return {{x: number, y: number}}
 */
const calcNewWinPos=()=>{
    const minY= Object.values(noteWins)
            .map(v=>v.win)
            .reduce((accu, cur)=> Math.min(cur.getPosition()[1],accu), workArea.bottom);
    return {
        x: workArea.right-noteWinMargin-noteWinW,
        y: minY-noteWinMargin-noteWinH,
    };
};



/**
 *
 * @param fps 每秒动画帧数
 * @param duration 动画总时间
 * @param fromPos 起始位置
 * @param toPos 结束位置
 * @param ranges 不同区间对应的移动速率（倍速）
 * [
 *      [30, 1.2], // [0]位置的百分比 [1]倍速
 *      [70, 1.5],
 * ]
 */
const initSlideAnimFrames=()=>{
    animConfig.fromPos=workArea.right-noteWinMargin-noteWinW;
    animConfig.toPos=screenW+30;
    const {fps, duration, fromPos, toPos, ranges}= animConfig;

    // 平均速度计算
    // 30%*len/v + 40%*len/1.2v + 30%*len/1.5v = duration
    // 30%*len + 40%*len/1.2 + 30%*len/1.5= v*duration
    // v=(30%*len + 40%*len/1.2 + 30%*len/1.5)/duration

    const sumLen=toPos-fromPos;
    const newRanges=[];
    const firstDist=sumLen*(ranges?.length>0 ? ranges[0][0] : 100)/100;
    newRanges.push({
        start: fromPos,
        len: firstDist,
        velocityTimes: 1,
    });
    let v= firstDist;
    let start=fromPos+firstDist;

    if(ranges?.length>0){
        ranges.forEach((rg,rgInd)=>{
            const perc=(rgInd<ranges.length-1 ? ranges[rgInd+1][0]-rg[0] : 100-rg[0]);
            const dist=sumLen*perc/100;
            newRanges.push({
                start,
                len: dist,
                velocityTimes: rg[1],
            });
            v+=dist/rg[1];
            start+=dist;
        });
    }

    // 多长时间播放一帧动画 ms
    const animInterval=(1000/fps);
    // 在1倍速下，播放一帧动画移动的距离
    v=animInterval*v/duration;


    animFrames.interval=animInterval;
    newRanges.forEach(rg=>{
        for(let i=rg.start;i<rg.start+rg.len;i+=v*rg.velocityTimes){
            animFrames.poses.push(parseInt(i));
        }
    });
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
    const animConfig= {
        fps: 30,
        duration: 2000,
        fromPos: x-1000,
        toPos: screenW+30-1000,
        ranges: [
            [30, 1.2],
            [70, 1.5],
        ],
    };
    const {interval, poses} = animFrames;
    let framesCnt=poses.length;
    let currInd=0;
    const startPos=parseInt(workArea.right-noteWinMargin-noteWinW);

    const func=()=>{
        if(startPos!==poses[currInd]) {
            noteWins[winId].win.setPosition(poses[currInd], y, false);
        }
        ++currInd;
        if(currInd>=framesCnt){
            handleCloseWin(winId);
            return;
        }
        noteWins[winId].timer=setTimeout(func, interval);
    };
    func();
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
        const key=findWin.id;
        findWin.webContents.send("init-ele",{title, txt, icon,});
        noteWins[key]={
            win: findWin,
            timer: setTimeout(beginSlideOutWin.bind(this, key), remainMsBeforeSlideout),
        };
        findWin.show();
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
    console.log("will close id, "+(noteWins[winId] ? "exists " : "not exists "), winId);
    if(!noteWins[winId]){
        return;
    }

    if(noteWins[winId].timer){
        try{clearTimeout(noteWins[winId].timer);}catch (e){}
        try{clearInterval(noteWins[winId].timer);}catch(e){}
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

    // 加载屏幕和工作区相关信息，预计算窗口滑动动画相关数据
    const { x, y, width, height }=screen.getPrimaryDisplay().workArea;
    workArea={ left: x, right: x+width, top: y, bottom: y+height };
    screenW=screen.getPrimaryDisplay().size.width;
    initSlideAnimFrames();

    // 接收关闭事件
    // evt.sender.id为webContents的id，并非BrowserWindow的id，需要转换一下
    ipcMain.on("will-close", (evt, args)=>{
        const winId=BrowserWindow.fromWebContents(webContents.fromId(evt.sender.id))?.id;
        if(winId){
            handleCloseWin(winId);
        }
    });
}





module.exports={
    init,
    closeAllNotifyWins,
    showNotification,
};





// setTimeout(()=>{
//     showNotification({
//         title:'sfjg',
//         txt:'xxxxxxxxxxx',
//         icon:'succ',
//     });
// }, 5000);

// setTimeout(()=>{
//     mainWin.webContents.capturePage(/*{x: 0, y: 0, width: 2000, height: 1200,}*/).then((img) => {
//         console.log("img", img);
//
//         mainWin.webContents.size
//
//         fs.writeFile(
//             "C:\\Users\\Administrator\\Desktop\\test\\shot.png",
//             img.toPNG(),
//             {}, //            "base64",
//             function (err) {
//                 console.error("err", err);
//             }
//         );
//         console.log("screen shot has take")
//     });
//
//
// }, 10_000);