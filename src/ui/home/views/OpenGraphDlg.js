/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider } from 'antd';
import PathSelect from './PathSelect';
import {withEnh} from '../../common/specialDlg';
import {connect} from '../../../common/gflow';
import ConnectedPathSelect from './ConnectedPathSelect';
import {createSelector} from 'reselect';

const EnhDlg=withEnh(Modal);

/**
 * 打开图表对话框
 * @param {*} props 
 */
const OpenGraphDlg=(props)=>{
    let {dlgW, backtopLoc, contentMaxH}=calcSizeProps(props);

    return (
        <EnhDlg noFooter
                title="打开图表"
                size={{w:dlgW}}
                visible={props.visible}
                onCancel={props.onCancel}>
            <ConnectedPathSelect 
                maxH={contentMaxH}
                forceMaxH={true}
                backtopLoc={backtopLoc}
                onSelectMapItem={props.onSelectMapItem}/>
        </EnhDlg>
    );
    
}

/**
 * 计算对话框相关大小和位置等信息
 */
const calcSizeProps=createSelector(
    props=>props.winW,
    props=>props.winH,
    (winW, winH)=>{
        //对话框宽度计算
        let dlgW=900;
        if(winW<=dlgW){
            dlgW=winW-50;
        }

        //backtop按钮的位置计算：右、上
        let backtopLoc=[
            (winW-dlgW)/2+100,
            150
        ];

        //对话框内容区的最大高度
        let contentMaxH=winH- 64 - 250;

        return {
            dlgW,
            backtopLoc,
            contentMaxH
        };
    }
);

export default connect((state)=>({
    winW:state.common.winW,
    winH:state.common.winH,
}))(OpenGraphDlg);