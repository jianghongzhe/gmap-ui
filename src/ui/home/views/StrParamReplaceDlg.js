import React, { useEffect, useMemo, useState } from 'react';
import { Input, Modal} from 'antd';
import {withEnh} from '../../common/specialDlg';
import strTmpl from '../../../common/strTmpl';
import { useBindAndGetRefs } from '../../../common/commonHooks';
import {useMemoizedFn} from "ahooks";
import styles from './StrParamReplaceDlg.module.scss';

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
    
    const setFocusByKey=useMemoizedFn((key, delay=0)=>{
        setFocus(getIptByKey.bind(this, key), delay);
    });

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
    const onChange=useMemoizedFn((ind, e)=>{
        const newItems=[...items];
        newItems[ind].value=e.target.value;
        setItems(newItems);
    });

    



    return (
        <EnhDlg 
                title="请设置参数"
                size={{w: 800}}
                visible={props.visible}
                onCancel={props.onCancel}
                onOk={props.onOk.bind(this, previewUrl)}>
            <div className={styles.root}>
                <div className='item'>
                    <span className='label'>原地址：　</span>{props.currLinkUrl}
                </div>
                <div className='item'>
                    <span className='label'>结果预览：</span>{previewUrl}
                </div>
                {
                    items.map((item, ind)=>(
                        <div key={`paramItem-${ind}`} className='item'>
                            <div><span className='label'>参数{ind+1} - {item.name}：</span></div>
                            <div className='ipt_container'>
                                <Input  ref={bindIptByKey.bind(this,`paramdlg-${ind}`)}
                                        onPressEnter={ind<items.length-1 ? setFocusByKey.bind(this, `paramdlg-${ind+1}`, false) : props.onOk.bind(this, previewUrl)} 
                                        className='ipt'
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

