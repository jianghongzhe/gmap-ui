import {useState} from "react";
import {useMemoizedFn} from "ahooks";
import {Modal} from "antd";
import strTmpl from "../common/strTmpl";
import React from "_@types_react@17.0.53@@types/react";

const {confirm} = Modal;

/**
 * 链接插值参数相关hook
 * @param openUrlFunc (url)=>{}
 */
export const useOpenLinkWithParam=(openUrlFunc)=>{
    const [dlgVisible, setDlgVisible]=useState(false);
    const [currLinkUrl, setCurrLinkUrl]=useState(null);
    const [paramReplItems, setParamReplItems]=useState([]);
    const [shouldConfirm, setShouldConfirm]= useState(false);

    /**
     * 打开指定链接，打开前根据情况选择是否显示确认框
     * @param addr
     * @param needConfirm
     */
    const confirmOrNot=(addr, needConfirm=false)=>{
        const openLink=()=>{
            if(Array.isArray(addr)){
                addr.forEach(eachAddr=>openUrlFunc(eachAddr));
                return;
            }
            openUrlFunc(addr);
        };

        if(needConfirm){
            confirm({
                title: '确定要打开如下链接吗？',
                content: Array.isArray(addr) ? <div>{addr.map(eachUrl=><div>{eachUrl}</div>)}</div> : addr,
                onOk: () => openLink,
                maskClosable: true,
            });
            return;
        }
        openLink();
    };

    /**
     * 导图上链接点击事件：当其中不包含占位符时直接执行链接，否则打开对话框并设置占位符
     * @param {*} url
     * @returns
     */
    const onClickLink=useMemoizedFn((url, needConfirm=false)=>{

        /**
         * 打开一个链接：
         * 若含有插值表达式，则打开表达式设置对话框，对话框确认时根据情况判断是否要显示确认框；
         * 不含插值表达式，直接根据情况判断是否要显示确认框
         * @param addr
         * @param needConfirm
         */
        const openOneLink=(addr, needConfirm)=>{
            const replaceItems= strTmpl.parse(addr);
            if(null===replaceItems){
                confirmOrNot(addr, needConfirm);
                return;
            }
            setCurrLinkUrl(addr);
            setShouldConfirm(!!needConfirm);
            setParamReplItems(replaceItems);
            setDlgVisible(true);
        };

        /**
         * 打开多个链接，不会含有插值表达式
         *
         * @param addrs
         * @param needConfirm
         */
        const openMultiLink=(addrs, needConfirm)=>{
            confirmOrNot(addrs, needConfirm);
        };


        if(Array.isArray(url)){
            if(0===url.length){
                return;
            }
            else if(1===url.length){
                openOneLink(url[0], needConfirm);
                return;
            }
            else{
                const validUrls= url.filter(eachUrl=>!strTmpl.containsParam(eachUrl));
                if(0===validUrls){
                    return;
                }else if(1===validUrls){
                    openOneLink(validUrls[0], needConfirm);
                    return;
                }else{
                    openMultiLink(validUrls, needConfirm);
                    return;
                }
            }
            return;
        }
        openOneLink(url, needConfirm);
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
        confirmOrNot(url, shouldConfirm);
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