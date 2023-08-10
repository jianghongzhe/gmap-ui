



/**
 * 窗口加载事件
 */
window.onload=()=>{
    const ipcRenderer = window.require('electron').ipcRenderer;

    document.querySelector("#btnClose").addEventListener("click", ()=>{
        ipcRenderer.send("will-close");
    });

    //
    ipcRenderer.on("init-ele", (evt, {title, txt, icon})=>{
        title=(title??'信息').trim();
        title=(''===title ? '信息' : title);

        if(['err','error','fail','failure'].includes(icon)){
            icon='err';
        }else if(['info','infomation'].includes(icon)){
            icon='info';
        }else if(['succ','success','successful'].includes(icon)){
            icon='succ';
        }else if(['warn', 'warning'].includes(icon)){
            icon='warn';
        }else{
            icon='info';
        }

        txt=(txt??'').trim().replace(/\r/g,'').replace(/\n/g,'<br/>');

        document.querySelector("#title").innerText=title;
        document.querySelector("#txt").innerHTML=txt;
        document.querySelector("#icon").src=`./imgs/${icon}.png`;
    });
};