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
import * as echarts from 'echarts';
import echartParser from '../../../common/echartParser';
// import lodash from 'lodash';
//import snap from 'imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg.js'
// import seqdiagram from 'js-sequence-diagram';

//import lod from 'lodash';
// import snap from 'snapsvg';
import webfontloader from 'webfontloader';
// import seqDiagram from '../../../common/sequence-diagram';
//import seqDiagram from 'js-sequence-diagram';


// console.log("wf",window.WebFont);
//window._=lod;
window.WebFont=webfontloader;
//window.Diagram=seqDiagram;
//window.Snap=snap;
// console.log("wf",window.WebFont);


// const Snap = require(`imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg.js`);

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

                //绘制mermaid图表
                markedHighlightUtil.mermaidInit();                
                document.querySelectorAll(".mermaid").forEach((ele)=>{
                    ele.parentNode.style.display=null;
                });
                mermaid.contentLoaded();
               
                //绘制flowchart流程图
                document.querySelectorAll(".flowchart[handled='false']").forEach((ele)=>{
                    let nd=null;
                    try{
                        let txt=ele.innerText;//此处不能使用innerHTML，因为会把符号转义，eg. > 变为 &gt;
                        let eleId=ele.getAttribute('targetid');
                        nd=document.querySelector(`#${eleId}`);
                        nd.innerHTML="";
                        flowchart.parse(txt).drawSVG(eleId);
                        ele.setAttribute("handled",'true');//置标识，表示已处理过，下次渲染不再重复绘制
                    }catch(e){
                        if(nd){
                            nd.innerHTML=`<div style='color:red; border:1px solid red; padding:15px;width:400px;margin-top:20x;margin-bottom:20px;'>流程图格式有误 !!!</div>`;
                        }
                    }
                });

                //绘制sequence时序图
                document.querySelectorAll(".sequence[handled='false']").forEach((ele)=>{
                    let nd=null;
                    try{
                        let txt=ele.innerText;//此处不能使用innerHTML，因为会把符号转义，eg. > 变为 &gt;
                        let eleId=ele.getAttribute('targetid');
                        nd=document.querySelector(`#${eleId}`);
                        nd.innerHTML="";
                        window.Diagram.parse(txt).drawSVG(eleId ,{theme: 'simple'});
                        ele.setAttribute("handled",'true');//置标识，表示已处理过，下次渲染不再重复绘制
                    }catch(e){
                        if(nd){
                            nd.innerHTML=`<div style='color:red; border:1px solid red; padding:15px;width:400px;margin-top:20x;margin-bottom:20px;'>时序图格式有误 !!!</div>`;
                        }
                    }
                });

                //echart图
                document.querySelectorAll(".echart-graph[handled='false']").forEach((ele)=>{
                    let nd=null;
                    try{
                        let txt=ele.innerText;//此处不能使用innerHTML，因为会把符号转义，eg. > 变为 &gt;
                        let eleId=ele.getAttribute('targetid');
                        nd=document.querySelector(`#${eleId}`);
                        nd.innerHTML="";

                        const conf=echartParser.parse(txt);
                        console.log(conf);
                        nd.style.width=conf.w;
                        nd.style.height=conf.h;
                        echarts.init(nd).setOption(conf.opt);
                        
                        console.log(echarts.getInstanceByDom(nd));

                        ele.setAttribute("handled",'true');//置标识，表示已处理过，下次渲染不再重复绘制
                    }catch(e){
                        console.log(e);
                        if(nd){
                            nd.innerHTML=`<div style='color:red; border:1px solid red; padding:15px;width:400px;margin-top:20x;margin-bottom:20px;'>Echart图表格式有误 !!!</div>`;
                        }
                    }
                });



                

                // // _echarts_instance_
                // const elee=document.querySelector("#demo111");
                // const instId=elee.getAttribute("_echarts_instance_");

                // console.log(instId ? "有实例" : "无实例");
                
                // const chart=(instId ? echarts.getInstanceById(instId) : echarts.init(elee));
                // console.log("实例", chart);


                // console.log(echarts);
                // // echarts.getInstanceById();
                // chart.setOption({
                //     title: {
                //         text: '某站点用户访问来源',
                //         subtext: '纯属虚构',
                //         left: 'center'
                //     },
                //     tooltip: {
                //         trigger: 'item'
                //     },
                //     legend: {
                //         orient: 'vertical',
                //         left: 'left',
                //     },
                //     series: [
                //         {
                //             name: '访问来源',
                //             type: 'pie',
                //             radius: '50%',
                //             data: [
                //                 {value: 1048, name: '搜索引擎'},
                //                 {value: 735, name: '直接访问'},
                //                 {value: 580, name: '邮件营销'},
                //                 {value: 484, name: '联盟广告'},
                //                 {value: 300, name: '视频广告'}
                //             ],
                //             emphasis: {
                //                 itemStyle: {
                //                     shadowBlur: 10,
                //                     shadowOffsetX: 0,
                //                     shadowColor: 'rgba(0, 0, 0, 0.5)'
                //                 }
                //             }
                //         }
                //     ]
                // });
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
            <div id='demo111' css={{width:'500px',height:'500px'}}></div>
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