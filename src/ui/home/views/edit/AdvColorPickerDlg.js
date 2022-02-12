/** @jsxImportSource @emotion/react */
import React, {  useState } from 'react';
import {  Modal } from 'antd';
import { PhotoshopPicker } from 'react-color';
import {withEnh} from '../../../common/specialDlg';

const EnhDlg=withEnh(Modal);

/**
 * 高级颜色选择对话框
 * @param {*} props 
 */
const AdvColorPickerDlg=({visible, onOk, onCancel})=>{
    const [color, setColor]= useState({hex: "#194D33",});

    return <EnhDlg noTitle noFooter closable={false}
            size={{w: `${dlgW}px`}}
            css={{left, top}}
            visible={visible}
            onCancel={onCancel}
            bodyStyle={{padding:0,}}>
        <PhotoshopPicker css={{height:310,}} header='高级颜色选择' color={color.hex} onChange={setColor} onAccept ={onOk.bind(this, color)} onCancel={onCancel}/>
    </EnhDlg>;
};



const dlgW = 513;
const offsetX=284;
const top='204px';

//left = offsetX - (winW - 200px - dlgW) / 2
const left= `calc(${parseInt(offsetX+100+dlgW/2)}px - 50vw)`; 


export default React.memo(AdvColorPickerDlg);