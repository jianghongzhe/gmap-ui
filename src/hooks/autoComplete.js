import api from "../service/api";
import {useMemoizedFn} from "ahooks";
import {actionTypes} from "../common/hintMenuConfig";
import editorSvcEx from "../service/editorSvcEx";



export const useAutoComplateFuncs=()=>{


    const doEncodeTxtAction=useMemoizedFn((opt, cm, currAssetsDir)=>{
        const txt=cm.doc.getRange(opt.extra.pos, opt.extra.pos2).trim();
        (async ()=>{
            try{
                const encodedTxt=await api.encryptTxt(txt);
                const txtEnc=`$gmap_enc{${encodedTxt}}$`;
                insertTxtAndMoveCursor(
                    cm,
                    txtEnc,
                    txtEnc.length,
                    opt.extra.pos,
                    opt.extra.pos2,
                    ''
                );
            }catch (e){
                api.showNotification("错误","无法加密指定文本","err");
            }
        })();
    });

    /**
     *
     * @param opt  opt.extra.pos - opt.extra.pos2 为大括号包裹的内容的位置，不是整个标记的位置
     */
    const doDecodeTxtAction=useMemoizedFn((opt, cm)=>{
        const txtEnc=cm.doc.getRange(opt.extra.pos, opt.extra.pos2).trim();
        const wrapStart={...opt.extra.pos, ch: opt.extra.pos.ch-'$gmap_enc{'.length};
        const wrapEnd={...opt.extra.pos2, ch: opt.extra.pos2.ch+2};

        (async ()=>{
            try {
                const txtOrigin = await api.decryptTxt(txtEnc);
                insertTxtAndMoveCursor(
                    cm,
                    txtOrigin,
                    txtOrigin.length,
                    wrapStart,
                    wrapEnd,
                    ''
                );
            }catch (e){
                api.showNotification("错误", "无法解密指定文本", "err");
            }
        })();
    });


    /**
     * 恢复链接
     * $gmap_nolink{abc@163.com}$ -> abc@163.com
     * @param opt  opt.extra.pos - opt.extra.pos2 为大括号包裹的内容的位置，不是整个标记的位置
     */
    const doRestoreLinkAction=useMemoizedFn((opt, cm)=>{
        const txtNoLink=cm.doc.getRange(opt.extra.pos, opt.extra.pos2).trim();
        const wrapStart={...opt.extra.pos, ch: opt.extra.pos.ch-'$gmap_nolink{'.length};
        const wrapEnd={...opt.extra.pos2, ch: opt.extra.pos2.ch+2};
        insertTxtAndMoveCursor(
            cm,
            txtNoLink,
            txtNoLink.length,
            wrapStart,
            wrapEnd,
            ''
        );
    });


    /**
     * 剪切板操作
     * @type {(function(*, *, *): void)|*}
     */
    const doClipboardAction=useMemoizedFn((opt, cm, currAssetsDir)=>{
        const {subActionType}=opt;
        console.log("subActionType", subActionType);

        const actionHandlerMap={
            [actionTypes.getUrlFromClipboard]: ()=>{
                respHandler(
                    api.getUrlFromClipboard,
                    resp=>{
                        const txt=`[${resp.data.title}](${resp.data.url})`;
                        insertTxtAndMoveCursor(
                            cm,
                            txt,
                            txt.length,
                            opt?.extra?.pos??null,
                            opt?.extra?.pos2??null,
                            opt?.extra?.fill??''
                        );

                    }
                ).then();
            },
            [actionTypes.getImgUrlFromClipboard]: ()=>{
                respHandler(
                    api.getImgUrlFromClipboard,
                    resp=>{
                        const txt=`![${resp.data.title}](${resp.data.url})`;
                        insertTxtAndMoveCursor(
                            cm,
                            txt,
                            txt.length,
                            opt?.extra?.pos??null,
                            opt?.extra?.pos2??null,
                            opt?.extra?.fill??''
                        );
                    }
                ).then();
            },
            [actionTypes.clipboardImgToLocal]: ()=>{
                respHandler(
                    api.saveFileFromClipboard.bind(this, {img:true, saveDir:currAssetsDir, saveToPicHost:false}),
                    resp=>{
                        const txt=`![](assets/${resp.data.filename})`;
                        insertTxtAndMoveCursor(
                            cm,
                            txt,
                            txt.length,
                            opt?.extra?.pos??null,
                            opt?.extra?.pos2??null,
                            opt?.extra?.fill??''
                        );
                    }
                ).then();
            },
            [actionTypes.clipboardFileToLocal]: ()=>{
                respHandler(
                    api.saveFileFromClipboard.bind(this,{img:false, saveDir:currAssetsDir, saveToPicHost:false}),
                    resp=>{
                        const txt=`[${resp.data.title}](assets/${resp.data.filename})`;
                        insertTxtAndMoveCursor(
                            cm,
                            txt,
                            txt.length,
                            opt?.extra?.pos??null,
                            opt?.extra?.pos2??null,
                            opt?.extra?.fill??''
                        );
                    }
                ).then();
            },
            [actionTypes.clipboardImgToPicHost]: ()=>{
                respHandler(
                    api.saveFileFromClipboard.bind(this,{img:true, saveDir:currAssetsDir, saveToPicHost:true}),
                    resp=>{
                        const txt=`![](${resp.data.url})`;
                        insertTxtAndMoveCursor(cm,
                            txt,
                            txt.length,
                            opt?.extra?.pos??null,
                            opt?.extra?.pos2??null,
                            opt?.extra?.fill??''
                        );
                    }
                ).then();
            },
            [actionTypes.clipboardFileToPicHost]: ()=>{
                respHandler(
                    api.saveFileFromClipboard.bind(this,{img:false, saveDir:currAssetsDir, saveToPicHost:true}),
                    resp=>{
                        const txt=`[${resp.data.title}](${resp.data.url})`;
                        insertTxtAndMoveCursor(
                            txt,
                            txt.length,
                            opt?.extra?.pos??null,
                            opt?.extra?.pos2??null,
                            opt?.extra?.fill??''
                        );
                    }
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
            const beginMark=subActionType.txt2 ? subActionType.txt2[0] : subActionType.txt[0];
            const endMark=subActionType.txt2 ? subActionType.txt2[1] :subActionType.txt[1];
            const offset='undefined'!==typeof(subActionType.cursorOffset2) ? subActionType.cursorOffset2 : subActionType.cursorOffset;
            editorSvcEx.setWrapperMark(cm, beginMark, endMark, offset);
            return;
        }

        console.log("here")
        insertTxtAndMoveCursor(
            cm,
            subActionType.txt,
            subActionType.cursorOffset,
            subActionType?.extra?.pos??null,
            subActionType?.extra?.pos2??null,
            (subActionType?.extra?.fill??'')
        );
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
    const doDateTimeAction=useMemoizedFn((opt, cm)=>{
        let {date,time,dateOffset}=opt;
        const now = new Date();
        if(time && !date){
            const txt=editorSvcEx.toTimeFmt(now);
            insertTxtAndMoveCursor(
                cm,
                txt,
                txt.length,
                opt?.extra?.pos??null,
                opt?.extra?.pos2??null,
                opt?.extra?.fill??''
            );
            return;
        }
        if(date && time){
            const txt=editorSvcEx.toDateFmt(now)+" "+editorSvcEx.toTimeFmt(now);
            insertTxtAndMoveCursor(
                cm,
                txt,
                txt.length,
                opt?.extra?.pos??null,
                opt?.extra?.pos2??null,
                opt?.extra?.fill??''
            );
            return;
        }
        if(date && !time){
            dateOffset=(dateOffset??0);
            const assignedDate=new Date(new Date().getTime()+86400000*dateOffset);
            const txt=editorSvcEx.toDateFmt(assignedDate);
            insertTxtAndMoveCursor(
                cm,
                txt,
                txt.length,
                opt?.extra?.pos??null,
                opt?.extra?.pos2??null,
                opt?.extra?.fill??''
            );
           return;
        }
        api.showNotification("操作有误","该操作目前还不支持","err");
    });


    /**
     * 添加引用符号：
     * 添加位置为节点的最后一个为空字符之后，若最后一个为空字符不是'|'，则自动生成一个用为分隔
     * @type {(function({ref: *, tref: *}, *): void)|*}
     */
    const doRefAction=useMemoizedFn((option, cm)=>{
        const cursor= option.extra.pos;

        // 多行节点内容拼接到一起
        let lineTxt=cm.doc.getLine(cursor.line);
        let firstLine=cursor.line;
        let lastLine=cursor.line;
        if(!lineTxt.trim().startsWith("-")){
            for(let i=cursor.line-1;i>=0;--i){
                firstLine=i;
                if(cm.doc.getLine(i).trim().startsWith("-")){
                    break;
                }
            }
        }
        const len=cm.doc.lineCount();
        console.log("len", len);
        for(let i=firstLine+1; i<len; ++i){
            const nextLine=cm.doc.getLine(i);
            if('***'===nextLine.trim() || nextLine.trim().startsWith("-")){
                break;
            }
            lastLine=i;
        }
        lineTxt=cm.doc.getRange({line: firstLine, ch: 0,}, {line: lastLine, ch: cm.doc.getLine(lastLine).length}).replace(/\r/g,'').replace(/\n/g,'|');


        let refName=editorSvcEx.getFirstGeneralTxt(lineTxt);
        if(!refName){
            refName=(option.ref? "引用名称" : "文本引用名称");
        }
        const replTxt=`${option.ref ? "ref" : "tref"}:${refName.trim()}`;
        insertTxtAndMoveCursor(
            cm,
            replTxt,
            refName.length,
            option?.extra?.pos??null,
            option?.extra?.pos2??null,
            option?.extra?.fill??''
        );

        // if(!editorSvcEx.isCursorInNodePart(cm) || null===lineTxt || ""===lineTxt.trim()){
        //     api.showNotification("警告",`当前位置不允许生成${typeName}`,"warn");
        //     return;
        // }
        //
        //
        // if(false===refName || ""===refName.trim()){
        //     api.showNotification("操作有误",`当前位置无法生成${typeName}`,"err");
        //     return;
        // }

        // let handledLine=lineTxt.trimEnd();
        // const replTxt=`${handledLine.endsWith("|")?"":"|"}${ref ? "ref" : "tref"}:${refName.trim()}`;
        // const insertPos={line:cursor.line, ch:handledLine.length};
        // const insertPos2={line:cursor.line, ch:lineTxt.length};
        // const newPos={line:cursor.line, ch:handledLine.length+replTxt.length};
        // insertTxtToAssignedPos(cm, replTxt, [insertPos,insertPos2] , newPos);
        // return;
    });




    return {
        doClipboardAction,
        doLiteralAction,
        doDateTimeAction,
        doRefAction,
        doEncodeTxtAction,
        doDecodeTxtAction,
        doRestoreLinkAction,
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
const insertTxtAndMoveCursor=(cm, txt, cursorOffset=null, pos=null, pos2=null, fill='')=>{
    if(!pos){
        pos=cm.doc.getCursor();// { ch: 3  line: 0}
    }


    const replTxt=fill+txt;
    cm.doc.replaceRange(replTxt, pos, (pos2 ? pos2 : pos));

    let line=pos.line;
    let ch=pos.ch+txt.length;

    if('number'===typeof(cursorOffset)){
        ch=pos.ch+(cursorOffset>=0 ? cursorOffset+fill.length : replTxt.length+cursorOffset);
    }else if(Array.isArray(cursorOffset) && 2===cursorOffset.length && 'number'===typeof(cursorOffset[0]) && 'number'===typeof(cursorOffset[1])){
        line=pos.line+cursorOffset[0];
        ch=pos.ch+cursorOffset[1];
    }
    cm.focus();
    cm.doc.setCursor({line, ch});
};