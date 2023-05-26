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
        const actionHandlerMap={
            [actionTypes.getUrlFromClipboard]: ()=>{
                respHandler(
                    api.getUrlFromClipboard,
                    resp=>insertTxtAndMoveCursor(cm, `[${resp.data.title}](${resp.data.url})`)
                ).then();
            },
            [actionTypes.getImgUrlFromClipboard]: ()=>{
                respHandler(
                    api.getImgUrlFromClipboard,
                    resp=>insertTxtAndMoveCursor(cm, `![${resp.data.title}](${resp.data.url})`)
                ).then();
            },
            [actionTypes.clipboardImgToLocal]: ()=>{
                respHandler(
                    api.saveFileFromClipboard.bind(this, {img:true, saveDir:currAssetsDir, saveToPicHost:false}),
                    resp=>insertTxtAndMoveCursor(cm, `![](assets/${resp.data.filename})`)
                ).then();
            },
            [actionTypes.clipboardFileToLocal]: ()=>{
                respHandler(
                    api.saveFileFromClipboard.bind(this,{img:false, saveDir:currAssetsDir, saveToPicHost:false}),
                    resp=>insertTxtAndMoveCursor(cm, `[${resp.data.title}](assets/${resp.data.filename})`)
                ).then();
            },
            [actionTypes.clipboardImgToPicHost]: ()=>{
                respHandler(
                    api.saveFileFromClipboard.bind(this,{img:true, saveDir:currAssetsDir, saveToPicHost:true}),
                    resp=>insertTxtAndMoveCursor(cm, `![](${resp.data.url})`)
                ).then();
            },
            [actionTypes.clipboardFileToPicHost]: ()=>{
                respHandler(
                    api.saveFileFromClipboard.bind(this,{img:false, saveDir:currAssetsDir, saveToPicHost:true}),
                    resp=>insertTxtAndMoveCursor(cm, `[${resp.data.title}](${resp.data.url})`)
                ).then();
            },
        };

        if(!actionHandlerMap[subActionType]){
            api.showNotification("操作有误","该操作目前还不支持","err");
            return;
        }
        actionHandlerMap[subActionType]();
    });

    const doLiteralAction=useMemoizedFn((subActionType, cm)=>{
        if(subActionType.appendNodePart){
            insertNodePart(cm, subActionType.txt);
            return;
        }
        if(subActionType.wrap){
            if(!editorSvcEx.isSelMultiLine(cm)){
                editorSvcEx.setWrapperMark(cm, subActionType.txt[0], subActionType.txt[1], subActionType.cursorOffset);
                return;
            }
            editorSvcEx.setWrapperMark(cm, subActionType.txt2[0], subActionType.txt2[1], subActionType.cursorOffset2);
            return;
        }
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
           insertTxtAndMoveCursor(cm, editorSvcEx.toTimeFmt(now));
           return;
        }
        if(date && time){

           insertTxtAndMoveCursor(cm, editorSvcEx.toDateFmt(now)+" "+editorSvcEx.toTimeFmt(now));
           return;
        }
        if(date && !time){
           dateOffset=(dateOffset??0);
           const assignedDate=new Date(new Date().getTime()+86400000*dateOffset);
           insertTxtAndMoveCursor(cm, editorSvcEx.toDateFmt(assignedDate));
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

        if(!editorSvcEx.isCursorInNodePart(cm) || null===lineTxt || ""===lineTxt.trim()){
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
    cm.focus();
    cm.doc.setCursor(afterPos);
};


const insertNodePart=(cm, txt)=>{
    const cursor= cm.doc.getCursor();
    const lineTxt=cm.doc.getLine(cursor.line);
    const handledLine=lineTxt.trimEnd();
    const replTxt=`${handledLine.endsWith("|")?"":"|"}${txt}`;
    const insertPos={line:cursor.line, ch:handledLine.length};
    const insertPos2={line:cursor.line, ch:lineTxt.length};
    const newPos={line:cursor.line, ch:handledLine.length+replTxt.length};
    insertTxtToAssignedPos(cm, replTxt, [insertPos,insertPos2] , newPos);
};


const sortCursor=(pos1, pos2)=>{
    if(pos1.line!==pos2.line){
        return pos1.line<pos2.line ? [pos1, pos2] : [pos2, pos1];
    }
    return pos1.ch<pos2.ch ? [pos1, pos2] : [pos2, pos1];
};


/**
 * 向光标处插入内容并把光标后移
 * @param cm
 * @param txt
 * @param cursorOffset 可选
 * 情况1：number   在当前行中的列的偏移量
 * 情况2：[number, number]  行的偏移量和列的偏移量
 * @param wrap
 * */
const insertTxtAndMoveCursor=(cm, txt, cursorOffset=null, wrap=false)=>{
    let pos=cm.doc.getCursor();// { ch: 3  line: 0}
    cm.doc.replaceRange(txt, pos, pos);

    let line=pos.line;
    let ch=pos.ch+txt.length;

    if('number'===typeof(cursorOffset)){
        ch=pos.ch+cursorOffset;
    }else if(Array.isArray(cursorOffset) && 2===cursorOffset.length && 'number'===typeof(cursorOffset[0]) && 'number'===typeof(cursorOffset[1])){
        line=pos.line+cursorOffset[0];
        ch=pos.ch+cursorOffset[1];
    }
    cm.focus();
    cm.doc.setCursor({line, ch});
};