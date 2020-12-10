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



const baseFind=(fun)=>{
    const val=eleIpt.value.trim();
    if(''===val){
        app.stopFind();
        elePercent.innerHTML='0/0';
        elePercent.style.visibility='hidden';
        return;
    }
    fun(val);
};

/**
 * 查找
 */
const find=()=>{
    baseFind(app.find);
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
 * 关闭窗口
 */
const closeWin=()=>{
    window.close();
}





/**
 * 初始化ipc交互事件：
 * 1、查找位置变更事件：如果没有匹配则隐藏分数部分
 */
const initIpcEvent=()=>{
    ipcRenderer.on("findinpage-places",(e, result)=>{
        elePercent.innerHTML=`${result.activeMatchOrdinal}/${result.matches}`;
        elePercent.style.visibility=(0===result.matches ? 'hidden' : null);
    });
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
    app = window.require('electron').remote.app;
    ipcRenderer = window.require('electron').ipcRenderer;
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