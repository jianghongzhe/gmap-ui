/** @jsxImportSource @emotion/react */
import React from 'react';
import { Modal } from 'antd';
import { CirclePicker } from 'react-color';
import {withEnh} from '../../../common/specialDlg';

const EnhDlg=withEnh(Modal);


/**
 * 颜色选择器对话框
 * @param {*} props 
 */
const ColorPickerDlg=(props)=>{
    return <EnhDlg noTitle noFooter closable={false}
            size={{w: dlgW}}
            css={{left: props.offsetX - (props.parW - dlgW) / 2, top: props.t}}
            visible={props.visible}
            onCancel={props.onCancel}>

        <CirclePicker
            width ='504px'
            colors={colors}
            onChange={props.onOk} />
    </EnhDlg>;
};

const dlgW =540;// 290;
const colors=[
    '#4D4D4D', '#999999', '#EEEEEE',/*'#FFFFFF',*/ '#F44E3B', '#FE9200', '#FCDC00', '#DBDF00', '#A4DD00', '#68CCCA', '#73D8FF', '#AEA1FF', '#FDA1FF', 
    '#333333', '#808080', '#cccccc', '#D33115', '#E27300', '#FCC400', '#B0BC00', '#68BC00', '#16A5A5', '#009CE0', '#7B64FF', '#FA28FF', 
    '#000000', '#666666', '#B3B3B3', '#9F0500', '#C45100', '#FB9E00', '#808900', '#194D33', '#0C797D', '#0062B1', '#653294', '#AB149E'
];

export default React.memo(ColorPickerDlg);