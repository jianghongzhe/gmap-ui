/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { useCallback, useEffect, useState } from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider,Popover,BackTop,Avatar } from 'antd';
import {withEnh} from '../../common/specialDlg';
import {connect} from '../../../common/gflow';
import MarkedHighlightUtil from '../../../common/markedHighlightUtil';
import mindmapSvc from '../../../service/mindmapSvc';
import api from '../../../service/api';
import {createSelector} from 'reselect';

import marked from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark-reasonable.css';
import 'github-markdown-css/github-markdown.css';
import { useSelector } from 'react-redux';

const EnhDlg=withEnh(Modal);
const codeBg = 'rgba(40,44,52,1)'; //40 44 52  #282c34
const markedHighlightUtil = new MarkedHighlightUtil();

/**
 * 引用查看器
 * @param {*} props 
 */
const RefViewer=(props)=>{
    const {winW,winH,activeKey}=useSelector((state)=>({
        winW:       state.common.winW,
        winH:       state.common.winH,
        activeKey:  state.tabs.activeKey,
    }));

    const [wrapperId]=useState(()=>"refviewercontainer"+new Date().getTime());

    useEffect(()=>{
        markedHighlightUtil.init(marked, hljs, {
            codeConfig: {
                bg: codeBg
            },
            linkConfig: {
                disableDefault: true,
                convertUrl: (oldurl) => {
                    let addr = oldurl;
                    if (mindmapSvc.hasUrlPrefix(addr)){
                        return addr;
                    }
                    if(addr.startsWith("./")){
                        return api.calcAttUrl(activeKey, oldurl);
                    }
                    return addr;
                }
            },
            imgConfig: {
                convertUrl: (oldurl) => {
                    if (!(oldurl.startsWith("./") || oldurl.startsWith("../"))) { return oldurl; }//跳过不是本地相对路径的
                    return api.calcPicUrl(activeKey, oldurl);
                }
            }
        });
    },[activeKey]);

    
    useEffect(()=>{
        if(props.visible){
            setTimeout(() => {
                markedHighlightUtil.bindLinkClickEvent(api.openUrl);
                markedHighlightUtil.bindImgClickEvent(api.openUrl);
            }, 100);//迟
        }
    },[props.visible]);
    

    

    const getScrollTarget=useCallback(()=>document.getElementById(wrapperId),[wrapperId]);
    let result=dataSelector(props);
    if(null===result){
        return null;
    }
    let {refname,refCont}=result;
    

    return (
        <EnhDlg noFooter
                title={"查看引用 - " + refname}
                size={{w:winW-200, h:winH-300, fixh:true, wrapperId:wrapperId}}                
                visible={props.visible}
                maskClosable={true}               
                onCancel={props.onCancel}>
            <div className='markdown-body' css={{
                margin:'0px auto',
                width:'98%',
                overflowX:'hidden'}}
                dangerouslySetInnerHTML={{__html:refCont}}>
            </div>
            {
                (props.backtopLoc && 2===props.backtopLoc.length) && (   
                    <BackTop  target={getScrollTarget} css={{
                        right:200,
                        bottom:170,
                        ...backtopColorStyle
                    }}/>
                )
            }
        </EnhDlg>
    );
    
}

const dataSelector=createSelector(
    props=>props.currRefObj,
    refObj=>{
        if(!refObj || !refObj.txt || !refObj.showname){
            return null;
        }
        if (null == refObj.parsedTxt) {
            refObj.parsedTxt = marked(refObj.txt);
        }
        let refname=refObj.showname;
        let refCont=refObj.parsedTxt;
        return {refname,refCont};
    }
);

//24  144 255    #1890ff
//16  136 233    #1088e9
const backtopColorStyle={
    '& .ant-back-top-content':{
        backgroundColor:'rgba(24,144,255, .80)',
    },
    '&:hover .ant-back-top-content':{
        backgroundColor:'rgba(24,144,255, 1.0)', 
    },
}

export default React.memo(RefViewer);