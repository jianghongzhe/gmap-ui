/**
 * 全局对象
 */
let app=null;
let ipcRenderer=null;
let eleIpt=null;
let elePercent=null;
let eleBtnPre=null;
let eleBtnNext=null;
let eleBtnClose=null;




/**
 * 基本查找函数：当内容为空时，停止查找，并隐藏比值
 * @param {*} fun 具体的查找函数
 */
const baseFind=(fun)=>{
    const val=eleIpt.value.trim();
    if(''===val){
        app.stopFind();
        setRate(0,0);
        return;
    }
    fun(val);
};

/**
 * 查找：
 * 由于第一次查找时收不到当前查找位置的事件，因此再分别执行查找下一个与查找上一个
 */
const find=()=>{
    baseFind(app.find);
    findNext();
    findPre();
};

/**
 * 查找下一个
 */
const findNext=()=>{
    baseFind(app.findNext);
};

/**
 * 查找上一个
 */
const findPre=()=>{
    baseFind(app.findPre);
};

/**
 * 关闭窗口：使用隐藏的方式，不真正关闭
 */
const closeWin=()=>{
    eleIpt.value='';
    setRate(0,0);
    app.stopFind();
    app.hideFindInPage();
}


/**
 * 初始化ipc交互事件：
 * 1、查找位置变更事件：如果没有匹配则隐藏分数部分
 * 2、清空事件：清空输入框和匹配位置，停止查找
 */
const initIpcEvent=()=>{
    // ipcRenderer.on("findinpage-places",(e, result)=>{
    //     console.log("查找结果",result);
    //     setRate(result.activeMatchOrdinal, result.matches);
    // });
    ipcRenderer.on("clear-find",(e, result)=>{
        eleIpt.value='';
        setRate(0,0);
        app.stopFind();
    });
};

/**
 * 设置查找位置的值，如果没有匹配项，则隐藏
 * @param {*} curr 
 * @param {*} sum 
 */
const setRate=(curr=0,sum=0)=>{
    elePercent.innerHTML=`${curr}/${sum}`;
    elePercent.style.visibility=(0===sum ? 'hidden' : null);
};

/**
 * 初始化按键事件
 */
const initKeyEvent=()=>{
    document.onkeydown=(e)=>{
        // esc 关闭
        if('Escape'===e.key && !e.ctrlKey && !e.shiftKey && !e.altKey){
            closeWin();
            return;
        }

        // enter 下一个
        if('Enter'===e.key && !e.ctrlKey && !e.shiftKey && !e.altKey){
            findNext();
            return;
        }

        // shift + enter 上一个
        if('Enter'===e.key && true===e.shiftKey && !e.ctrlKey && !e.altKey){
            findPre();
            return;
        }
    };
}

/**
 * 初始化元素事件
 */
const bindElesEvents=()=>{
    eleBtnPre.addEventListener("click",findPre);
    eleBtnNext.addEventListener("click",findNext);
    eleBtnClose.addEventListener("click",closeWin);
    eleIpt.addEventListener("input",find);
};

/**
 * 窗口加载事件
 */
window.onload=()=>{
    // 变量初始化
    //app =window.require('electron').remote.app; //window.require('@electron/remote').app;  //window.require('electron').remote.app;


    ipcRenderer = window.require('electron').ipcRenderer;


    app={
        stopFind: (...args)=>{
            ipcRenderer.invoke('stopFind', ...args);
        },
        hideFindInPage: (...args)=>{
            ipcRenderer.invoke('hideFindInPage', ...args);
        },
        find: (...args)=>{
            ipcRenderer.invoke('find', ...args).then(result=>{
                setRate(result.activeMatchOrdinal, result.matches);
                console.log(result);
            });
        },
        findNext: (...args)=>{
            ipcRenderer.invoke('findNext', ...args).then(result=>{
                setRate(result.activeMatchOrdinal, result.matches);
                console.log(result);
            });
        },
        findPre: (...args)=>{
            ipcRenderer.invoke('findPre', ...args).then(result=>{
                setRate(result.activeMatchOrdinal, result.matches);
                console.log(result);
            });
        },
    };

    eleIpt=document.querySelector("#ipt");
    elePercent=document.querySelector("#percent");
    eleBtnPre=document.querySelector("#btnPre");
    eleBtnNext=document.querySelector("#btnNext");
    eleBtnClose=document.querySelector("#btnClose");

    // 初始化事件
    initIpcEvent();
    initKeyEvent();
    bindElesEvents();

    // 初始化
    eleIpt.focus();
};