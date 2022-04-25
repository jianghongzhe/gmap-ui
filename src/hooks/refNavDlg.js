import {useState} from "react";
import editorSvcEx from "../service/editorSvcEx";
import {message} from "antd";
import {useBoolean, useMemoizedFn} from "ahooks";

export const useRefNavDlg=(codeMirrorInstRef)=>{
    const [refNavDlgVisible, {setTrue:showRefNavDlg, setFalse:hideRefNavDlg}]=useBoolean(false);
    const [refNavDlgTitle, setRefNavDlgTitle]=useState("");
    const [refNavDlgItems, setRefNavDlgItems]=useState([]);


    const showRefs=useMemoizedFn(()=>{
        if(!codeMirrorInstRef.current){
            return;
        }
        const items=editorSvcEx.loadAllRefNames(codeMirrorInstRef.current);
        if(null==items || 0===items.length){
            message.info("当前文档不存在引用");
            return;
        }
        setRefNavDlgItems(items);
        setRefNavDlgTitle("引用");
        showRefNavDlg();
    });


    const showTrefs=useMemoizedFn(()=>{
        if(!codeMirrorInstRef.current){
            return;
        }
        const items=editorSvcEx.loadAllTrefNames(codeMirrorInstRef.current);
        if(null==items || 0===items.length){
            message.info("当前文档不存在文本引用");
            return;
        }
        setRefNavDlgItems(items);
        setRefNavDlgTitle("文本引用");
        showRefNavDlg();
    });

    return [refNavDlgVisible,refNavDlgTitle,refNavDlgItems, showRefs, showTrefs, hideRefNavDlg];
};