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
     * 主窗口渲染进程查找事件：转发到查找窗口渲染进程
     */
    mainWindow.webContents.on("found-in-page",(e, result)=>{
        fs.appendFileSync(__dirname+"\\log.txt","收到查找事件："+JSON.stringify(result)+'\r\n','utf-8');
        if(findWin){
            findWin.webContents.send("findinpage-places",result);
        }
    });

    /**
     * 打开查找窗口
     * @param {*} winW   窗口宽度
     * @param {*} winTop 窗口纵坐标(不包括菜单栏)
     */
    const showFindInPage=(winW=300,winTop=160)=>{
        // 已存在查找窗口，不处理
        if(null!=findWin){
            return;
        }

        //获取主窗口的大小
        const [w,h]=mainWindow.getSize();

        //初始化查找窗口
        findWin = new BrowserWindow({
            width:      winW,
            height:     55,
            show:       false,
            parent:     mainWindow,
            x:          w-winW-30,  //水平位置居右
            y:          winTop+(app.isDevMode()?20:0), //垂直位置：开发模式有菜单栏，运行模式没有，两者相差20px
            resizable:  false,
            frame:      false,
            webPreferences: {
                nodeIntegration:    true,
                enableRemoteModule: true,
            }
        });
        findWin.show();
        findWin.loadFile(__dirname + '\\findinpage\\index.html');

        //窗口关闭事件
        findWin.on('closed', ()=>{
            console.log('close find dlg');
            findWin=null;       //清空窗口引用
            // app.stopFind();     //取消查找
            // mainWindow.focus(); //主窗口激活
            console.log('close find dlg 222');
        });

        //如果是开发模式，打开控制台
        if(app.isDevMode()){
            findWin.webContents.toggleDevTools();
        }
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
    app.find=find;
    app.findNext=findNext;
    app.findPre=findPre;
    app.stopFind=stopFind;
}

module.exports={
    init, //初始化
};










