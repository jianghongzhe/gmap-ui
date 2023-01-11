import {useCallback, useState} from "react";
import {useMemoizedFn} from "ahooks";
import strTmpl from "../common/strTmpl";

/**
 * 链接插值参数相关hook
 * @param openUrlFunc (url)=>{}
 */
export const useOpenLinkWithParam=(openUrlFunc)=>{
    const [dlgVisible, setDlgVisible]=useState(false);
    const [currLinkUrl, setCurrLinkUrl]=useState(null);
    const [paramReplItems, setParamReplItems]=useState([]);

    /**
     * 导图上链接点击事件：当其中不包含占位符时直接执行链接，否则打开对话框并设置占位符
     * @param {*} url
     * @returns
     */
    const onClickLink=useMemoizedFn((url)=>{
        const replaceItems= strTmpl.parse(url);
        if(null===replaceItems){
            openUrlFunc(url);
            return;
        }
        setCurrLinkUrl(url);
        setParamReplItems(replaceItems);
        setDlgVisible(true);
    });

    const onDlgCancel=useMemoizedFn(()=>{
        setDlgVisible(false);
    });

    /**
     * 参数占位符替换后的回调
     * @param {*} url
     */
    const onDlgOk=useMemoizedFn((url)=>{
        onDlgCancel();
        openUrlFunc(url);
    });


    return {
        dlgVisible,
        currLinkUrl,
        paramReplItems,
        onClickLink,
        onDlgCancel,
        onDlgOk,
    };

};