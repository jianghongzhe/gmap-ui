import React,{useState} from "react";
import {useBoolean, useMemoizedFn} from "ahooks";
import {Modal} from "antd";
import strTmpl from "../common/strTmpl";
import {parseValidJson} from "../common/jsonUtil";


const {confirm} = Modal;




/**
 * 链接插值参数相关hook
 * 插值表达式和提示框是两个维度，可同时存在；
 * 有两个或以上链接时，只保留不带插值表达式的项，即打开多个链接时不会出现插值表达式对话框
 * @param openUrlFunc (url)=>{}
 */
export const useOpenLinkWithParam=(openUrlFunc)=>{
    const [linkOpts, setLinkOpts]=useState({});
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
    const confirmOrNot=useMemoizedFn((addr, needConfirm=false, confirmTxt=null, extraOpts)=>{
        const openLink=()=>{
            if(Array.isArray(addr)){
                addr.forEach((eachAddr,ind)=>openUrlFunc(eachAddr, extraOpts[ind]));
                return;
            }
            openUrlFunc(addr, extraOpts);
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
    const onClickLink=useMemoizedFn((url, needConfirm=false, confirmTxt=null, extraOpts={})=>{
        if('boolean'!==typeof(needConfirm)){
            needConfirm=false;
        }
        if('string'!==typeof(confirmTxt)){
            confirmTxt=null;
        }
        extraOpts=parseValidJson(extraOpts);

        /**
         * 打开一个链接：
         * 若含有插值表达式，则打开表达式设置对话框，对话框确认时根据情况判断是否要显示确认框；
         * 不含插值表达式，直接根据情况判断是否要显示确认框
         * @param addr
         * @param needConfirm
         * @param confirmTxt
         * @param extraOpts
         */
        const openOneLink=(addr, needConfirm, confirmTxt, extraOpts)=>{
            const replaceItems= strTmpl.parse(addr);
            if(null===replaceItems){
                confirmOrNot(addr, needConfirm, confirmTxt, extraOpts);
                return;
            }
            setCurrLinkUrl(addr);
            setConfirmMsg(confirmTxt);
            setShouldConfirm(!!needConfirm);
            setParamReplItems(replaceItems);
            setLinkOpts(extraOpts);
            showDlg();
        };

        /**
         * 打开多个链接，不会含有插值表达式
         *
         * @param addrs
         * @param needConfirm
         * @param confirmTxt
         * @param filteredExtraOpts
         */
        const openMultiLink=(addrs, needConfirm, confirmTxt, filteredExtraOpts)=>{
            confirmOrNot(addrs, needConfirm, confirmTxt, filteredExtraOpts);
        };


        if(Array.isArray(url)){
            const validUrls=[];
            const filteredExtraOpts=[];
            url.forEach((eachUrl,ind)=>{
                validUrls.push(eachUrl);
                filteredExtraOpts.push(getExtraOptByIndex(extraOpts, ind));
            });
            openMultiLink(validUrls, needConfirm, confirmTxt, filteredExtraOpts);
            return;
        }
        openOneLink(url, needConfirm, confirmTxt, extraOpts);
    });



    /**
     * 参数占位符替换后的回调：
     * 如果需要确认，则对话框不关闭，直到确认框完成时再关闭
     * @param {*} url
     */
    const onDlgOk=useMemoizedFn((url)=>{
        if(shouldConfirm){
            confirmOrNot(url, true, confirmMsg, linkOpts);
            return;
        }
        onDlgCancel();
        confirmOrNot(url, false, confirmMsg, linkOpts);
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



/**
 * 按索引获取json对象中的值
 * eg. ind=1
 * 原值
 * {
 *     a: [1,2,3],
 *     b: ["aa","bb","cc"],
 * }
 * 结果
 * {
 *     a: 2,
 *     b: "bb",
 * }
 * @param extraOpts
 * @param ind
 * @return {{}}
 */
const getExtraOptByIndex=(extraOpts, ind)=>{
    const result={};
    for (const key in extraOpts) {
        if(Array.isArray(extraOpts[key]) && ind<extraOpts[key].length){
            result[key]=extraOpts[key][ind];
        }
    }
    return result;
};