/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useState } from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider,Popover,BackTop,Avatar } from 'antd';
import { PlusOutlined, FolderOpenOutlined, EditOutlined,LinkOutlined, FolderOutlined,ExportOutlined,CodeOutlined,CompressOutlined,ExpandOutlined,ControlOutlined,ReloadOutlined,FileImageOutlined,FileMarkdownOutlined,FilePdfOutlined,FileWordOutlined,Html5Outlined } from '@ant-design/icons';
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
import expSvc from '../../../service/expSvc';
import mermaid from 'mermaid';
import flowchart from 'flowchart.js';

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
                markedHighlightUtil.mermaidInit();                
                document.querySelectorAll(".mermaid").forEach((ele)=>{
                    ele.parentNode.style.display=null;
                });
                mermaid.contentLoaded();

                console.log("flowchart", flowchart);
                

                document.querySelectorAll(".flowchart").forEach((ele)=>{
                    let nd=null;
                    try{
                        let txt=ele.innerText;//此处不能使用innerHTML，因为会把符号转义，eg. > 变为 &gt;
                        nd=ele.parentNode;
                        let eleId=nd.id;
                        nd.innerHTML="";
                        flowchart.parse(txt).drawSVG(eleId);
                    }catch(e){
                        if(nd){
                            nd.innerHTML=`<div style='color:red; border:1px solid red; padding:15px;width:400px;margin-top:20x;margin-bottom:20px;'>流程图格式有误 !!!</div>`;
                        }
                    }
                });
                
            }, 500);
        }
    },[props.visible]);
    

    

    const getScrollTarget=useCallback(()=>document.getElementById(wrapperId),[wrapperId]);
    let result=dataSelector(props);
    let {refname, refCont, txt}=(result || {refname:'', refCont:'', txt:''});

    
    const onExpHtml=useCallback(()=>{
        expSvc.expHtml(refname, marked(txt));
    },[refname, txt]);

    
    const onExpMarkdown=useCallback(()=>{
        expSvc.expMarkdown(txt);
    },[txt]);
    
    
    
    if(null===result){
        return null;
    }
    
    

    return (
        <EnhDlg noFooter
                title={
                    <div>
                        {"查看引用 - " + refname}
                        <Button shape='circle' icon={<FileMarkdownOutlined />} css={{marginLeft:'20px'}} type='default' size='default' onClick={onExpMarkdown} title='导出markdown' />
                        <Button shape='circle' icon={<Html5Outlined />} css={{marginLeft:'6px'}} type='default' size='default' onClick={onExpHtml} title='导出html' />
                    </div>
                }
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
            <div id='demo111'></div>
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
        return {refname,refCont, txt:refObj.txt};
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