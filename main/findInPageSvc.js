const {BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const common=require('./common');

/*
 * 总体说明：
 * 原来使用send/on的方式，发送事件和订阅事件的代码逻辑很分散，无法顺序写逻辑；
 * 现改为invoke/handle的调用方式，让前端程序代码可以使用then或async/await的方式来顺序写
 */

/**
 * 网页内查找功能主页地址
 */
const findInPageIndexPath= path.join(__dirname, "../" , "findinpage", "index.html");

/**
 * 初始化
 * @param {*} _mainWindow  主窗口
 */
const init=(_mainWindow)=>{
    const mainWindow=_mainWindow;
    let findWin=null; //网页内查找窗口

    /**
     * 网页查找的requestId与promise中resolve对应关系。
     * 由于findInPage不能直接返回结果，需要另外订阅一个found-in-page事件来获取，因此用此映射关系来关联
     */
    let findCallbackMap={};

    
    /**
     * 初始化查找窗口，但不显示
     * @param {*} winW 
     */
    const initWin=(winW)=>{
        if(null!==findWin){
            console.log("find dlg has been init, no need to reinit");
            return;
        }

        console.log("will init find dlg");
        //创建查找窗口
        findWin = new BrowserWindow({
            width:          winW,
            height:         55,
            show:           false,      //默认
            parent:         mainWindow,
            x:              -9999,
            y:              -9999,
            resizable:      false,
            transparent :   true,
            frame:          true,
            titleBarStyle: 'hidden',
            backgroundColor:'#00FFFFFF',
            hasShadow:      false,
            webPreferences:     {
                nodeIntegration:    true,
                enableRemoteModule: true,
                contextIsolation: false,
            }
        });

        //加载文件
        findWin.loadFile(findInPageIndexPath);

        //如果是开发模式，打开控制台
        if(common.isDevMode()){
            findWin.webContents.toggleDevTools();
        }

        // 主窗口渲染进程收到查找事件后，转发到查找窗口渲染进程
        mainWindow.webContents.on("found-in-page",(e, result)=>{
            if(findWin && findWin.webContents){
                if(findCallbackMap[result.requestId]){
                    findCallbackMap[result.requestId](result);
                }
                //findWin.webContents.send("findinpage-places",result);
            }
        });
    };

    /**
     * 计算查找窗口的显示位置（根据主窗口的大小和位置）
     * @param {*} winW      窗口宽度
     * @param {*} winTop    窗口纵坐标(不包括菜单栏)
     */
    const calcWinLocation=(winW,winTop)=>{
        const [w,h]=mainWindow.getSize();
        let {x:mainWinX, y:mainWinY}=mainWindow.getBounds();      
        if(mainWindow.isMaximized()){
            mainWinX=0;
            mainWinY=0;
        }
        const x=(w-winW-30)+mainWinX; //水平位置：居右
        const y=(winTop+(common.isDevMode()?20:0))+mainWinY; //垂直位置：开发模式有菜单栏，运行模式没有，两者相差20px
        return {x,y};
    };

    /**
     * 隐藏查找窗口：
     * 1、清除主窗口上的查找痕迹
     * 2、向查找窗口发事件，让其清空输入内容和状态
     * 3、隐藏查找窗口
     * 4、主窗口重新获得焦点
     * 5、清空requestId与promise中resolve对应关系
     */
    const hideFindInPage=()=>{
        if(null!=findWin && findWin.isVisible()){
            stopFind();
            findWin.webContents.send("clear-find",{});
            findWin.setBounds({ x:-9999, y:-9999});
            findWin.hide();
            mainWindow.focus();
            findCallbackMap={};
        }
    };

    /**
     * 打开查找窗口，默认位置在父窗口右上角
     * 使用延迟加载的方式，第一次调用时初始化窗口和事件，之后的调用只控制窗口的显示/隐藏
     * @param {*} winW   窗口宽度
     * @param {*} winTop 窗口纵坐标(不包括菜单栏)
     */
    const showFindInPage=(winW=300,winTop=160)=>{
        initWin(winW);//初始化窗口
        const {x,y}=calcWinLocation(winW, winTop);//计算窗口位置

        if(!findWin.isVisible()){
            findWin.show();
        }
        findWin.setBounds({x,y});
        findWin.focus();
        findWin.webContents.send("focus-input", {});
    };

    const getFindInPageVisible=()=>{
        if(!findWin){
            return false;
        }
        return findWin.isVisible();
    };

    /**
     * 网页查找：
     * 如果未查到结果，则返回一个默认的promise对象，其中值为默认值0。
     * 如果查找到，则返回一个promise，把其中的resolve函数注册到requestId-callback映射关系中，
     * 待收到found-in-page事件时，从映射关系找到requestId对应的回调函数并执行
     * @param {*} txt 
     * @param {*} opts 
     */
    const baseFind=(txt, opts)=>{
        let requestId=mainWindow.webContents.findInPage(txt,opts);
        if(!requestId){
            return new Promise((res, rej)=>{
                res({
                    activeMatchOrdinal: 0,
                    matches:            0,
                });
            });
        }
        return new Promise((res, rej)=>{
            findCallbackMap[requestId]=res;
        });
    };

    /**
     * 开始查找
     * @param {*} txt 
     * @returns 
     */
    const find=(txt)=>{
        return baseFind(txt,{
            forward:true,
            findNext:false,
        });
    }
    
    /**
     * 查找下一个
     * @param {*} txt 
     * @returns 
     */
    const findNext=(txt)=>{
        return baseFind(txt,{
            forward:true,
            findNext:true,
        });
    }
    
    /**
     * 查找上一个
     * @param {*} txt 
     * @returns 
     */
    const findPre=(txt)=>{
        return baseFind(txt,{
            forward:false,
            findNext:true,
        });
    }
    
    /**
     * 清除主页上的查找痕迹
     */
    const stopFind=()=>{
        mainWindow.webContents.stopFindInPage("clearSelection");
    }



    /**
     * 注册ipc事件
     */
    const handlersMap={
        initFindInPage: initWin,
        showFindInPage: showFindInPage,
        stopFind,
        hideFindInPage,
        find,
        findNext,
        findPre,
        getFindInPageVisible,
    };

    const baseHandler=async (handler, evt, ...args)=>{
        const result=await handler(...args);
        return result;
    };

    for(let key in handlersMap){
        ipcMain.handle(key, baseHandler.bind(this, handlersMap[key]));
    }
}

module.exports={
    //初始化
    init, 
};










