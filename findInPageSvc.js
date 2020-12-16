const {BrowserWindow} = require('electron');
const fs = require('fs');

/**
 * 初始化
 * @param {*} _app 
 * @param {*} _mainWindow 
 */
const init=(_app, _mainWindow)=>{
    const app=_app;
    const mainWindow=_mainWindow;
    let findWin=null; //网页内查找窗口

    
    
    /**
     * 初始化查找窗口，但不显示
     * @param {*} winW 
     */
    const initWin=(winW)=>{
        if(null!==findWin){
            return;
        }

        //创建查找窗口
        findWin = new BrowserWindow({
            width:          winW,
            height:         55,
            show:           false,      //默认
            parent:         mainWindow,
            x:              -9999,
            y:              -9999,
            resizable:      false,
            frame:          false,
            backgroundColor:'#FFFFFF',
            webPreferences:     {
                nodeIntegration:    true,
                enableRemoteModule: true,
            }
        });

        //加载文件
        findWin.loadFile(__dirname + '\\findinpage\\index.html');

        //如果是开发模式，打开控制台
        if(app.isDevMode()){
            findWin.webContents.toggleDevTools();
        }

        // 主窗口渲染进程收到查找事件后，转发到查找窗口渲染进程
        mainWindow.webContents.on("found-in-page",(e, result)=>{
            if(findWin && findWin.webContents){
                findWin.webContents.send("findinpage-places",result);
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
        const y=(winTop+(app.isDevMode()?20:0))+mainWinY; //垂直位置：开发模式有菜单栏，运行模式没有，两者相差20px
        return {x,y};
    };

    /**
     * 隐藏查找窗口
     */
    const hideFindInPage=()=>{
        if(null!=findWin){
            findWin.webContents.send("clear-find",{});
            findWin.setBounds({ x:-9999, y:-9999});
            findWin.hide();
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
    };

    /**
     * 查找：如果未查到结果，则触发空事件
     * @param {*} txt 
     * @param {*} opts 
     */
    const baseFind=(txt, opts)=>{
        let result=mainWindow.webContents.findInPage(txt,opts);
        if(!result){
            findWin.webContents.send("findinpage-places",{
                activeMatchOrdinal: 0,
                matches:            0,
            });
        }
    };

    const find=(txt)=>{
        baseFind(txt,{
            forward:true,
            findNext:false,
        });
    }
    
    const findNext=(txt)=>{
        baseFind(txt,{
            forward:true,
            findNext:true,
        });
    }
    
    const findPre=(txt)=>{
        baseFind(txt,{
            forward:false,
            findNext:true,
        });
    }
    
    const stopFind=()=>{
        mainWindow.webContents.stopFindInPage("clearSelection");
    }


    /**
     * 方法绑定到app
     */
    app.showFindInPage=showFindInPage;
    app.hideFindInPage=hideFindInPage;
    app.find=find;
    app.findNext=findNext;
    app.findPre=findPre;
    app.stopFind=stopFind;
}

module.exports={
    init, //初始化
};










