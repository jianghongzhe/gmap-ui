/** @jsxImportSource @emotion/react */
import React, {  useState } from 'react';
import {  Modal } from 'antd';
import { PhotoshopPicker } from 'react-color';
import {withEnh} from '../../../common/specialDlg';
import generalSvc from '../../../../service/generalSvc';

const EnhDlg=withEnh(Modal);
const arrowStyle= generalSvc.getDlgTopArrowStyle({left:18 ,top:-6, len:6 ,color:'rgb(240,240,240)'});

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
        <div id='globalArrow' css={arrowStyle}></div>
        <PhotoshopPicker css={{height:310}} header='高级颜色选择' color={color.hex} onChange={setColor} onAccept ={onOk.bind(this, color)} onCancel={onCancel}/>
    </EnhDlg>;
};



const dlgW = 513;
const offsetX=268;
const top='208px';

//left = offsetX - (winW - 200px - dlgW) / 2
const left= `calc(${parseInt(offsetX+100+dlgW/2)}px - 50vw)`; 


export default React.memo(AdvColorPickerDlg);