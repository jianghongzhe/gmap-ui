



/**
 * 窗口加载事件
 */
window.onload=()=>{
    const ipcRenderer = window.require('electron').ipcRenderer;

    document.querySelector("#btnClose").addEventListener("click", ()=>{
        ipcRenderer.send("will-close");
    });


    ipcRenderer.on("init-ele", (evt, {winId, title, txt, icon})=>{
        document.querySelector("#txt").innerText=txt;
    });


};