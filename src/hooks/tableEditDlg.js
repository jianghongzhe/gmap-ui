import {useBoolean, useMemoizedFn} from "ahooks";
import {useState} from "react";
import editorSvcEx from "../service/editorSvcEx";
import api from "../service/api";


export const useTableEditDlg=(codeMirrorInstRef)=>{
    const [tableEditDlgVisible, {setTrue: showTableEditDlg, setFalse:hideTableEditDlg}]= useBoolean(false);
    const [tableEditData,setTableEditData]=useState({});

    /**
     * 解析编辑器中的表格内容并打开编辑表格对话框
     * @type {(function(): void)|*}
     */
    const onEditTable=useMemoizedFn(()=>{
        if(!codeMirrorInstRef.current){
            return;
        }
        const data=editorSvcEx.parseTable(codeMirrorInstRef.current);
        if(false===data || editorSvcEx.isCursorInNodePart(codeMirrorInstRef.current)){
            api.showNotification("警告", "光标所在位置不能解析为表格", "warn");
            return;
        }

        setTableEditData(data);
        showTableEditDlg();
    });

    /**
     * 表格编辑窗口确定事件，将markdown内容写回编辑器组件
     * @type {(function(*): void)|*}
     */
    const onSetTableMarkdown=useMemoizedFn((md)=>{
        if(codeMirrorInstRef.current){
            codeMirrorInstRef.current.doc.replaceRange(md, tableEditData.fromPos, tableEditData.toPos);
        }
    });

    return [tableEditData, tableEditDlgVisible, onEditTable, onSetTableMarkdown, hideTableEditDlg];
};