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
 * 基本查找函数：
 * 当内容为空时，清除页面查找痕迹，并隐藏比值；否则调用对应查找函数
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
 * 由于第一次查找时收不到当前查找位置的事件，因此再分别执行一次查找下一个与查找上一个
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
 * 关闭窗口：调用ipcMain来总体控制，因为需要操作主窗口相关内容
 */
const closeWin=()=>{
    app.hideFindInPage();
}


/**
 * 初始化ipc事件：
 * 1、清空事件：清空输入框和匹配位置
 * 2、获得焦点事件：每次打开对话框时使输入框获得焦点
 */
const initIpcEvent=()=>{
    ipcRenderer.on("clear-find",(e, result)=>{
        eleIpt.value='';
        setRate(0,0);
    });
    ipcRenderer.on("focus-input",(e, result)=>{
        eleIpt.focus();
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
            });
        },
        findNext: (...args)=>{
            ipcRenderer.invoke('findNext', ...args).then(result=>{
                setRate(result.activeMatchOrdinal, result.matches);
            });
        },
        findPre: (...args)=>{
            ipcRenderer.invoke('findPre', ...args).then(result=>{
                setRate(result.activeMatchOrdinal, result.matches);
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

    // 获得焦点
    eleIpt.focus();
};