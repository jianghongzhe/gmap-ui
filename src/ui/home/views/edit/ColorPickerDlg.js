import React from 'react';
import { Modal } from 'antd';
import { CirclePicker } from 'react-color';
import {withEnh} from '../../../common/specialDlg';
import styles from './ColorPickerDlg.module.scss';

const EnhDlg=withEnh(Modal);

// const arrowStyle= generalSvc.getDlgTopArrowStyle({left:18 ,top:-6, len:6 ,color:'white'});


/**
 * 颜色选择器对话框
 * @param {*} props 
 */
const ColorPickerDlg=({visible, onCancel, onOk})=>{
    return <React.Fragment>
        <EnhDlg noTitle noFooter closable={false} 
                size={{w: `${dlgW}px`}}
                className={styles.leftTop}
                style={{'--left': left, '--top': top,}}
                visible={visible}
                onCancel={onCancel}>
            <div className={styles.arrow} style={{
                '--left':'18px',
                '--top':'-6px',
                '--len':'6px' ,
                '--color':'white',
            }}></div>
            <CirclePicker id='colorPickerxxx'
                width ='504px'
                colors={colors}
                onChange={onOk} />
        </EnhDlg>
    </React.Fragment> ;
};

const dlgW =540;
const offsetX=242;// 258;
const top='208px';//'204px';

//left = offsetX - (100vw - 200px - dlgW) / 2
const left=`calc(${parseInt(offsetX+100+dlgW/2)}px - 50vw)`;


const colors=[
    '#4D4D4D', '#999999', '#EEEEEE',/*'#FFFFFF',*/ '#F44E3B', '#FE9200', '#FCDC00', '#DBDF00', '#A4DD00', '#68CCCA', '#73D8FF', '#AEA1FF', '#FDA1FF', 
    '#333333', '#808080', '#cccccc', '#D33115', '#E27300', '#FCC400', '#B0BC00', '#68BC00', '#16A5A5', '#009CE0', '#7B64FF', '#FA28FF', 
    '#000000', '#666666', '#B3B3B3', '#9F0500', '#C45100', '#FB9E00', '#808900', '#194D33', '#0C797D', '#0062B1', '#653294', '#AB149E'
];

export default React.memo(ColorPickerDlg);