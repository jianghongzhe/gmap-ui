/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from 'antd';
import {  } from '@ant-design/icons';
import GantChart from './GantChart';
import {withEnh} from '../../../common/specialDlg';
import {connect} from '../../../../common/gflow';
import { createSelector } from 'reselect';

const EnhDlg=withEnh(Modal);

/**
 * 甘特图对话框
 * @param {*} props 
 */
const GantDlg=(props)=>{
    const [layoutArrows, setLayoutArrows]=useState(null);
    const showCntRef=useRef(0);
    
    /**
     * 延迟重绘箭头位置
     */
    const delayRelayoutArrows=useCallback(()=>{
        setTimeout(()=>{
            setLayoutArrows(Symbol());
        }, 100);
    },[setLayoutArrows]);
    
    /**
     * 第2次以上渲染，引发重绘
     */
    useEffect(()=>{
        if(props.visible){
            showCntRef.current=showCntRef.current+1;         
            if(1<showCntRef.current){
                console.log("gant - 第2次以上渲染，引发重绘");
                delayRelayoutArrows();
            }
        }
    },[props.visible]);

    /**
     * 窗口大小调整，引发重绘
     */
    useEffect(()=>{
        console.log("gant - 窗口大小调整，引发重绘");
        delayRelayoutArrows();
    },[props.resizeSymbol]);


    let {ds, colKeys, relas}=getParts(props);

    return (
        <EnhDlg noFooter
                title="甘特图"
                visible={props.visible}
                size={{w:props.winW-200}}
                onCancel={props.onCancel}>

            <GantChart 
                key='gant-comp'
                ds={ds}
                colKeys={colKeys} 
                arrows={relas}
                winW={props.winW} 
                maxh={props.winH-250-100}  
                layoutArrows={layoutArrows}/>    
        </EnhDlg>
    );
    
}

const getParts=createSelector(
    props=>props.gantObj,
    gantObj=>{
        if(!gantObj){
            return {
                ds:         [],
                colKeys:    [],
                relas:      [],
            };
        }
        return {
            ds:         gantObj.data? gantObj.data: [],
            colKeys:    gantObj.colKeys? gantObj.colKeys: [],
            relas:      gantObj.relas? gantObj.relas:[],
        };
    }
);

const mapState=(state)=>({
    winW:           state.common.winW,
    winH:           state.common.winH,
    resizeSymbol:   state.common.resizeSymbol
});

export default connect(mapState)(GantDlg);