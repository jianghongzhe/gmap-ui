import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, Modal} from 'antd';
import {withEnh} from '../../common/specialDlg';
import strTmpl from '../../../common/strTmpl';
import { useBindAndGetRefs } from '../../../common/commonHooks';

const EnhDlg=withEnh(Modal);

/**
 * 参数替换设置的对话框
 * @param {*} props {
 *  replItems:[
 *      {
 *          name: "1" 
 *          def: ""
 *          value: "" 
 *          matchPart: "{{1}}"
 *      } 
 *  ],
 *  currLinkUrl: "cmd://ping {{1}}.{{2}}.{{3}}.{{4}}"
 * }
 * @returns 
 */
const StrParamReplaceDlg=(props)=>{
    const [items, setItems]=useState([]);
    const [,bindIptByKey, getIptByKey]= useBindAndGetRefs();
    
    const setFocusByKey=useCallback((key, delay=0)=>{
        setFocus(getIptByKey.bind(this, key), delay);
    },[getIptByKey]);

    /**
     * props中给出的初始值转化为state值
     */
    useEffect(()=>{
        setItems(props.replItems);
    },[props.replItems, setItems]);

    /**
     * 显示时给第一个输入框获得焦点
     */
    useEffect(()=>{
        if(props.visible){
            setFocusByKey("paramdlg-0", 500);
        }
    },[props.visible, setFocusByKey]);
    

    /**
     * 计算预览结果地址
     */
    const previewUrl=useMemo(()=>{
        return strTmpl.replace(props.currLinkUrl, items);
    },[items, props.currLinkUrl]);

    
    /**
     * 占位符值更改事件
     * @param {*} ind 
     * @param {*} e 
     */
    const onChange=useCallback((ind, e)=>{
        const newItems=[...items];
        newItems[ind].value=e.target.value;
        setItems(newItems);
    },[items, setItems]);

    



    return (
        <EnhDlg 
                title="请设置参数"
                size={{w: 800}}
                visible={props.visible}
                onCancel={props.onCancel}
                onOk={props.onOk.bind(this, previewUrl)}>
            <div css={{maxHeight: 'calc(100vh - 350px)', overflowY:'auto'}}>
                <div>
                    <span css={{fontWeight:'bold'}}>原地址：　</span>{props.currLinkUrl}
                </div>
                <div css={{marginTop:'15px',}}>
                    <span css={{fontWeight:'bold'}}>结果预览：</span>{previewUrl}
                </div>
                {
                    items.map((item, ind)=>(
                        <div key={ind} css={{marginTop:'15px'}}>
                            <div><span css={{fontWeight:'bold'}}>参数{ind+1} - {item.name}：</span></div>
                            <div css={{marginTop:'5px'}}>
                                <Input  ref={bindIptByKey.bind(this,`paramdlg-${ind}`)}
                                        onPressEnter={ind<items.length-1 ? setFocusByKey.bind(this, `paramdlg-${ind+1}`, false) : props.onOk.bind(this, previewUrl)} 
                                        css={{width:'96%'}} 
                                        value={item.value} 
                                        onChange={onChange.bind(this, ind)} placeholder="请输入参数值"/>
                            </div>
                        </div>
                    ))
                }
            </div>
        </EnhDlg>
    );
};

/**
 * 使指定id的元素获得焦点。如果指定了延迟时间，则延迟一段时间后再获取；否则直接获取
 */
const setFocus=(getEleFunc, delay=0)=>{
    const doFocus=()=>{
        if(getEleFunc){
            const ele=getEleFunc();
            if(ele){
                ele.focus();
                return true;
            }
        }
        return false;
    };
    if(delay){
        setTimeout(doFocus, delay);
        return;
    }
    doFocus();
};

export default React.memo(StrParamReplaceDlg);

