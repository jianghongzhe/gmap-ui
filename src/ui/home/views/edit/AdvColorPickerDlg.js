/** @jsxImportSource @emotion/react */
import React, { useCallback, useState } from 'react';
import {  Modal } from 'antd';
import { PhotoshopPicker } from 'react-color';
import {withEnh} from '../../../common/specialDlg';

const EnhDlg=withEnh(Modal);

/**
 * 高级颜色选择对话框
 * @param {*} props 
 */
const AdvColorPickerDlg=(props)=>{
    const [color, setColor]= useState({hex: "#194D33",});

    const onOk=useCallback(()=>{
        props.onOk(color);
    },[props,  color]);

    return <EnhDlg noTitle noFooter closable={false}
            size={{w: dlgW}}
            css={{left: props.offsetX - (props.parW - dlgW) / 2, top: props.t}}
            visible={props.visible}
            onCancel={props.onCancel}
            bodyStyle={{padding:0,}}>
        <PhotoshopPicker css={{height:310,}} header='高级颜色选择' color={color.hex} onChange={setColor} onAccept ={onOk} onCancel={props.onCancel}/>
    </EnhDlg>;
};



const dlgW = 513;

export default React.memo(AdvColorPickerDlg);