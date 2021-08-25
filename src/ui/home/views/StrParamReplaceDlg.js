/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, Modal} from 'antd';
import {withEnh} from '../../common/specialDlg';
import strTmpl from '../../../common/strTmpl';

const EnhDlg=withEnh(Modal);

/**
 * 参数替换设置的对话框
 * @param {*} props {
 *  replItems,
    currLinkUrl
 * }
 * @returns 
 */
const StrParamReplaceDlg=(props)=>{
    const [items, setItems]=useState([]);

    useEffect(()=>{
        setItems(props.replItems);
    },[props.replItems, setItems]);

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
                        <div css={{marginTop:'15px'}}>
                            <div><span css={{fontWeight:'bold'}}>参数{ind+1} - {item.name}：</span></div>
                            <div css={{marginTop:'5px'}}>
                                <Input css={{width:'96%'}} value={item.value} onChange={onChange.bind(this, ind)} placeholder="请输入参数值"/>
                            </div>
                        </div>
                    ))
                }
            </div>
        </EnhDlg>
    );
};

export default React.memo(StrParamReplaceDlg);

