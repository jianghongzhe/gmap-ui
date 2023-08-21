import React,{useState} from "react";
import {useBoolean, useMemoizedFn} from "ahooks";
import {Modal} from "antd";
import strTmpl from "../common/strTmpl";


const {confirm} = Modal;

/**
 * 链接插值参数相关hook
 * @param openUrlFunc (url)=>{}
 */
export const useOpenLinkWithParam=(openUrlFunc)=>{
    const [dlgVisible, {setTrue: showDlg, setFalse:onDlgCancel}]=useBoolean(false);
    const [currLinkUrl, setCurrLinkUrl]=useState(null);
    const [paramReplItems, setParamReplItems]=useState([]);
    const [shouldConfirm, setShouldConfirm]= useState(false);
    const [confirmMsg, setConfirmMsg]= useState(null);



    /**
     * 打开指定链接，打开前根据情况选择是否显示确认框
     * @param addr
     * @param needConfirm
     * @param confirmTxt
     */
    const confirmOrNot=useMemoizedFn((addr, needConfirm=false, confirmTxt=null)=>{
        const openLink=()=>{
            if(Array.isArray(addr)){
                addr.forEach(eachAddr=>openUrlFunc(eachAddr));
                return;
            }
            openUrlFunc(addr);
        };

        if(needConfirm){
            confirm({
                title: confirmTxt??'确定要打开如下链接吗？',
                content: Array.isArray(addr) ? <div>{addr.map(eachUrl=><div>{eachUrl}</div>)}</div> : addr,
                onOk: ()=>{
                    onDlgCancel();
                    openLink();
                },
                maskClosable: true,
            });
            return;
        }
        openLink();
    });

    /**
     * 导图上链接点击事件：当其中不包含占位符时直接执行链接，否则打开对话框并设置占位符
     * @param {*} url
     * @returns
     */
    const onClickLink=useMemoizedFn((url, needConfirm=false, confirmTxt=null)=>{
        if('boolean'!==typeof(needConfirm)){
            needConfirm=false;
        }
        if('string'!==typeof(confirmTxt)){
            confirmTxt=null;
        }

        /**
         * 打开一个链接：
         * 若含有插值表达式，则打开表达式设置对话框，对话框确认时根据情况判断是否要显示确认框；
         * 不含插值表达式，直接根据情况判断是否要显示确认框
         * @param addr
         * @param needConfirm
         * @param confirmTxt
         */
        const openOneLink=(addr, needConfirm, confirmTxt)=>{
            const replaceItems= strTmpl.parse(addr);
            if(null===replaceItems){
                confirmOrNot(addr, needConfirm, confirmTxt);
                return;
            }
            setCurrLinkUrl(addr);
            setConfirmMsg(confirmTxt);
            setShouldConfirm(!!needConfirm);
            setParamReplItems(replaceItems);
            showDlg();
        };

        /**
         * 打开多个链接，不会含有插值表达式
         *
         * @param addrs
         * @param needConfirm
         * @param confirmTxt
         */
        const openMultiLink=(addrs, needConfirm, confirmTxt)=>{
            confirmOrNot(addrs, needConfirm, confirmTxt);
        };


        if(Array.isArray(url)){
            if(0===url.length){
                return;
            }
            else if(1===url.length){
                openOneLink(url[0], needConfirm, confirmTxt);
                return;
            }
            else{
                const validUrls= url.filter(eachUrl=>!strTmpl.containsParam(eachUrl));
                if(0===validUrls){
                    return;
                }else if(1===validUrls){
                    openOneLink(validUrls[0], needConfirm, confirmTxt);
                    return;
                }else{
                    openMultiLink(validUrls, needConfirm, confirmTxt);
                    return;
                }
            }
        }
        openOneLink(url, needConfirm, confirmTxt);
    });



    /**
     * 参数占位符替换后的回调：
     * 如果需要确认，则对话框不关闭，直到确认框完成时再关闭
     * @param {*} url
     */
    const onDlgOk=useMemoizedFn((url)=>{
        if(shouldConfirm){
            confirmOrNot(url, true, confirmMsg);
            return;
        }
        onDlgCancel();
        confirmOrNot(url, false, confirmMsg);
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