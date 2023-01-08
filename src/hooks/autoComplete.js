import api from "../service/api";
import {useMemoizedFn} from "ahooks";
import {actionTypes} from "../common/hintMenuConfig";
import editorSvcEx from "../service/editorSvcEx";



export const useAutoComplateFuncs=()=>{

    /**
     * 剪切板操作
     * @type {(function(*, *, *): void)|*}
     */
    const doClipboardAction=useMemoizedFn((subActionType, cm, currAssetsDir)=>{
        if(actionTypes.getUrlFromClipboard===subActionType){
            respHandler(
                api.getUrlFromClipboard,
                resp=>insertTxtAndMoveCursor(cm, `[${resp.data.title}](${resp.data.url})`)
            ).then();
            return;
        }
        if(actionTypes.getImgUrlFromClipboard===subActionType){
            respHandler(
                api.getImgUrlFromClipboard,
                resp=>insertTxtAndMoveCursor(cm, `![${resp.data.title}](${resp.data.url})`)
            ).then();
            return;
        }
        if(actionTypes.clipboardImgToLocal===subActionType){
            respHandler(
                api.saveFileFromClipboard.bind(this, {img:true, saveDir:currAssetsDir, saveToPicHost:false}),
                resp=>insertTxtAndMoveCursor(cm, `![](assets/${resp.data.filename})`)
            ).then();
            return;
        }
        if(actionTypes.clipboardFileToLocal===subActionType){
            respHandler(
                api.saveFileFromClipboard.bind(this,{img:false, saveDir:currAssetsDir, saveToPicHost:false}),
                resp=>insertTxtAndMoveCursor(cm, `[${resp.data.title}](assets/${resp.data.filename})`)
            ).then();
            return;

        }
        if(actionTypes.clipboardImgToPicHost===subActionType){
            respHandler(
                api.saveFileFromClipboard.bind(this,{img:true, saveDir:currAssetsDir, saveToPicHost:true}),
                resp=>insertTxtAndMoveCursor(cm, `![](${resp.data.url})`)
            ).then();
            return;
        }
        if(actionTypes.clipboardFileToPicHost===subActionType){
            respHandler(
                api.saveFileFromClipboard.bind(this,{img:false, saveDir:currAssetsDir, saveToPicHost:true}),
                resp=>insertTxtAndMoveCursor(cm, `[${resp.data.title}](${resp.data.url})`)
            ).then();
            return;
        }
        api.showNotification("操作有误","该操作目前还不支持","err");
    });

    const doLiteralAction=useMemoizedFn((subActionType, cm)=>{
        insertTxtAndMoveCursor(cm, subActionType.txt, subActionType.cursorOffset);
    });


    /**
     *
     * @param subActionType
     * {
     *      date:true,
     *      time:false,
     *      dateOffset:-2,
     * }
     */
    const doDateTimeAction=useMemoizedFn(({date,time,dateOffset}, cm)=>{
        const now = new Date();
        if(time && !date){
           insertTxtAndMoveCursor(cm, toTimeFmt(now));
           return;
        }
        if(date && time){
           insertTxtAndMoveCursor(cm, toDateFmt(now)+" "+toTimeFmt(now));
           return;
        }
        if(date && !time){
           dateOffset=(dateOffset??0);
           const assignedDate=new Date(new Date().getTime()+86400000*dateOffset);
           insertTxtAndMoveCursor(cm, toDateFmt(assignedDate));
           return;
        }
        api.showNotification("操作有误","该操作目前还不支持","err");
    });


    /**
     * 添加引用符号：
     * 添加位置为节点的最后一个为空字符之后，若最后一个为空字符不是'|'，则自动生成一个用为分隔
     * @type {(function({ref: *, tref: *}, *): void)|*}
     */
    const doRefAction=useMemoizedFn(({ref, tref}, cm)=>{
        const typeName=(ref? "引用" : "文本引用");
        const cursor= cm.doc.getCursor();
        const lineTxt=cm.doc.getLine(cursor.line);
        const leftCont = lineTxt.substring(0, cursor.ch).trim();
        const rightCont = lineTxt.substring(cursor.ch).trim();
        const useLeftSplitter=(''!== leftCont && !leftCont.endsWith("|"));
        const useRightSplitter=(''!== rightCont && !rightCont.startsWith("|"));

        if(!editorSvcEx.isCursorInNodePart(cm) || null==lineTxt || ""==lineTxt.trim()){
            api.showNotification("警告",`当前位置不允许生成${typeName}`,"warn");
            return;
        }

        const refName=editorSvcEx.getFirstGeneralTxt(lineTxt);
        if(false===refName || ""===refName.trim()){
            api.showNotification("操作有误",`当前位置无法生成${typeName}`,"err");
            return;
        }

        let handledLine=lineTxt.trimEnd();
        const replTxt=`${handledLine.endsWith("|")?"":"|"}${ref ? "ref" : "tref"}:${refName.trim()}`;
        const insertPos={line:cursor.line, ch:handledLine.length};
        const insertPos2={line:cursor.line, ch:lineTxt.length};
        const newPos={line:cursor.line, ch:handledLine.length+replTxt.length};
        insertTxtToAssignedPos(cm, replTxt, [insertPos,insertPos2] , newPos);
        return;
    });




    return {
        doClipboardAction,
        doLiteralAction,
        doDateTimeAction,
        doRefAction
    };
};

const toDateFmt=(date)=>{
    const m=date.getMonth()+1;
    const d=date.getDate();
    const weekday=['日','一','二','三','四','五','六'][date.getDay()];
    const resultDate=""+(new Date().getFullYear()-2000)+"."+(m<10?"0":"")+m+"."+(d<10?"0":"")+d+" "+weekday;
    return resultDate;
};

const toTimeFmt=(date)=>{
    const [h,m,s]=[date.getHours(), date.getMinutes(), date.getSeconds()];
    return `${h<10?"0"+h:""+h}:${m<10?"0"+m:""+m}:${s<10?"0"+s:""+s}`;
}



const respHandler=async (getRespFunc, respHandleFunc)=>{
    let resp=await getRespFunc();
    if(resp){
        if(true===resp.succ){
            respHandleFunc(resp);
        }else{
            api.showNotification("操作有误",resp.msg,"err");
        }
    }else{
        api.showNotification("操作有误", "未知的操作结果","err");
    }
};


/**
 * 向指定位置插入内容
 * @param cm
 * @param txt
 * @param insertPos 插入点 {line,ch}   或   [{line1, ch1}, {line2, ch2}]
 * @param afterPos 插入完成后光标位置
 */
const insertTxtToAssignedPos=(cm, txt, insertPos, afterPos)=>{
    let insPos1=insertPos;
    let insPos2=insertPos;
    if(Array.isArray(insertPos)){
        insPos1=insertPos[0];
        insPos2=insertPos[1];
    }

    cm.doc.replaceRange(txt, insPos1, insPos2);
    cm.doc.setCursor(afterPos);
};


/**
 * 向光标开始处插入内容并把光标后移
 * @param cm
 * @param txt
 * @param cursorOffset 可选
 * 情况1：number   在当前行中的列的偏移量
 * 情况2：[number, number]  行的偏移量和列的偏移量
 * */
const insertTxtAndMoveCursor=(cm, txt, cursorOffset=null)=>{
    const pos=cm.doc.getCursor();// { ch: 3  line: 0}
    cm.doc.replaceRange(txt, pos, pos);

    let line=pos.line;
    let ch=pos.ch+txt.length;

    if('number'===typeof(cursorOffset)){
        ch=pos.ch+cursorOffset;
    }else if(Array.isArray(cursorOffset) && 2===cursorOffset.length && 'number'===typeof(cursorOffset[0]) && 'number'===typeof(cursorOffset[1])){
        line=pos.line+cursorOffset[0];
        ch=pos.ch+cursorOffset[1];
    }
    cm.doc.setCursor({line, ch});
};