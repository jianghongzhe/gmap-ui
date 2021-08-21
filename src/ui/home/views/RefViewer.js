/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {  Modal,Button,BackTop,Tooltip } from 'antd';
import { FileMarkdownOutlined,FileImageOutlined,FilePdfOutlined,Html5Outlined } from '@ant-design/icons';
import {withEnh} from '../../common/specialDlg';
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
import screenShot from '../../../service/screenShot';

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
    const stateHolderRef=useRef({
        winW,
        winH,
        visible: props.visible,
    });

    useEffect(()=>{
        stateHolderRef.current={
            winW,
            winH,
            visible: props.visible,
        };
    },[winW,winH,props.visible]);


    const [wrapperId]=useState(()=>"refviewercontainer"+new Date().getTime());
    const [bodyId]=useState(()=>"refviewerbody"+new Date().getTime());

    useEffect(()=>{
        markedHighlightUtil.init(marked, hljs, {
            codeConfig: {
                bg: codeBg
            },
            linkConfig: {
                

                /**
                 * 转换url：
                 * 如果不是附件路径（即不是以 assets/ 开头），则原样返回；
                 * 是附件路径，则根据当前导图文件路径计算出绝对路径
                 * @param {*} oldurl 
                 * @returns 转换后的路径
                 */
                convertUrl: (oldurl) => {
                    if(!oldurl.startsWith("assets/")){
                        return oldurl;
                    }
                    let a=new Date().getTime();
                    console.log("link url before ", oldurl);
                    const ret=api.calcAttUrlSync(activeKey, oldurl);
                    console.log("link url after"+(new Date().getTime()-a), ret);
                    return ret;                    
                }
            },
            imgConfig: {
                /**
                 * 转换url：
                 * 如果不是附件路径（即不是以 assets/ 开头），则原样返回；
                 * 是附件路径，则根据当前导图文件路径计算出绝对路径，并进行urlencode
                 * @param {*} oldurl 
                 * @returns [0]转换后的明文路径 [1]转换后的urlencode路径
                 */
                convertUrl: (oldurl) => {
                    if (!oldurl.startsWith("assets/")) { return [oldurl, oldurl]; }//跳过不是本地相对路径的
                    let a=new Date().getTime();
                    //console.log("img url before ", oldurl);
                    const [urlShow, urlOpen]=api.calcPicUrlSync(activeKey, oldurl);
                    const encodeRet=encodeURI(urlShow);
                    //console.log("img url after"+(new Date().getTime()-a), ret);
                    return [urlOpen, encodeRet];
                }
            }
        });
    },[activeKey]);


    /**
     * 调整echart图的大小，使其对容器自适应
     */
     const resizeEchartGraphs=useCallback(()=>{
        document.querySelectorAll(".echart-graph[handled='true']").forEach((ele)=>{
            let eleId=ele.getAttribute('targetid');
            let nd=document.querySelector(`#${eleId}`);
            let w=ele.getAttribute("w");
            let h=ele.getAttribute("h");
            const isRelaW=w.endsWith("%");
            const isRelaH=h.endsWith("%");

            //如果宽高都是绝对像素值，则不随窗口大小改变而改变，不需要重绘
            if(!isRelaW && !isRelaH){
                return;
            }

            if(isRelaH){
                const percent=h.substring(0,h.length-1).trim();
                h=parseInt((stateHolderRef.current.winH-300)*parseFloat(percent)/100)+"px";
            }
            nd.style.height=h;
            nd.style.width=w;
            echarts.getInstanceByDom(nd).resize({
                width:'auto',
                height:'auto',
                silent:true,
            });
        });
    },[stateHolderRef]);

    /**
     * 当窗口显示时初始化以下组件：
     * 1、链接点击事件
     * 2、图片点击事件
     * 3、对未初始化的mermaid图初始化
     * 4、对未初始化的flowchart图初始化
     * 5、对未初始化的sequence图初始化
     * 6、对未初始化的echart图初始化
     * 7、对所有echart图设置自适应：以防止改变窗口大小后再次打开引用窗口后无法检测到窗口大小已改变
     */
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
                        nd.style.width=conf.w;
                        if(conf.h.endsWith("%")){
                            const percent=conf.h.substring(0,conf.h.length-1).trim();
                            nd.style.height=parseInt((stateHolderRef.current.winH-300)*parseFloat(percent)/100)+"px";
                        }else{
                            nd.style.height=conf.h;
                        }
                        echarts.init(nd).setOption(conf.opt);
                        
                        // console.log(echarts.getInstanceByDom(nd));
                        ele.setAttribute("w",conf.w);
                        ele.setAttribute("h",conf.h);
                        ele.setAttribute("handled",'true');//置标识，表示已处理过，下次渲染不再重复绘制
                    }catch(e){
                        console.log(e);
                        let msg='Echart图表格式有误 !!!';
                        if("string"===typeof(e)){
                            msg=`Echart图表格式有误：${e}`;
                        }else if("object"===typeof(e) && e instanceof Error){
                            msg=`Echart图表格式有误：${e.message}`;
                        }
                        if(nd){
                            nd.innerHTML=`<div style='color:red; border:1px solid red; padding:15px;width:400px;margin-top:20x;margin-bottom:20px;'>${msg}</div>`;
                        }
                    }
                });
                resizeEchartGraphs();
            }, 500);
        }
    },[props.visible, stateHolderRef, resizeEchartGraphs]);
    

    


    /**
     * 当窗口大小改变时，使echart图自适应，仅当引用窗口显示时有效
     */
    useEffect(()=>{
        if(!stateHolderRef.current.visible){
            return;
        }
        setTimeout(() => {
            resizeEchartGraphs();
        }, 500);
    },[winW,winH,stateHolderRef,resizeEchartGraphs]);
    

    const getScrollTarget=useCallback(()=>document.getElementById(wrapperId),[wrapperId]);
    let result=dataSelector(props);
    let {refname, refCont, txt}=(result || {refname:'', refCont:'', txt:''});

    
    const onExpHtml=useCallback(()=>{
        //expSvc.expHtml(refname, marked(txt));
        api.expHtml(activeKey, refname, txt);
    },[activeKey, refname, txt]);

    
    const onExpMarkdown=useCallback(()=>{
        api.expMarkdown(activeKey,refname, txt);
        //expSvc.expMarkdown(txt);
    },[activeKey, refname, txt]);
    

    

    /**
     * 导出图片或pdf
     * @param {*} expImg  true-导出图片  false-导出pdf
     */
    const onExpImage=useCallback((expImg=true)=>{
        (async()=>{
            try{
                const maximized=await api.isMaximized();
                if(!maximized){
                    api.showNotification("警告",`窗口只有在最大化时才能导出${expImg ? "图片" : "PDF"}`,"warn");
                    return;
                }
                const devMode=await api.isDevMode();
                const containerEle=document.querySelector(`#${wrapperId}`);
                const bodyEle=document.querySelector(`#${bodyId}`);
                let {x,y}=containerEle.getBoundingClientRect();
                screenShot(
                    expImg ? api.openSaveFileDlg : api.openSaveFileDlg.bind(this, 'pdf'),    //保存文件对话框函数
                    api.takeScreenShot,     //openUrl,            //执行截屏的函数
                    api.screenShotCombine,  //openUrl,
                    containerEle,           //容器元素
                    bodyEle,                //内容元素
                    Math.floor(x),          //开始截取的位置相对于浏览器主体内容区域左边的距离
                    Math.floor(y),          //开始截取的位置相对于浏览器主体内容区域上边的距离
                    devMode                 //是否考虑菜单栏的高度：开始模式显示菜单栏，运行模式不显示
                );
            }catch(e){

            }
        })();
    },[wrapperId, bodyId]);





    
    
    if(null===result){
        return null;
    }
    
    

    return (<React.Fragment>
        <EnhDlg noFooter
                title={
                    <div>
                        {"查看引用 - " + refname}
                        <Tooltip color='cyan' placement="bottomLeft" title='导出图片'>
                            <Button shape='circle' icon={<FileImageOutlined />} css={{marginLeft:'20px'}} type='default' size='default' onClick={onExpImage}/>
                        </Tooltip>
                        <Tooltip color='cyan' placement="bottomLeft" title='导出pdf'>
                            <Button shape='circle' icon={<FilePdfOutlined />} css={{marginLeft:'8px'}} type='default' size='default' onClick={onExpImage.bind(this, false)}/>
                        </Tooltip>
                        <Tooltip color='cyan' placement="bottomLeft" title='导出markdown'>
                            <Button shape='circle' icon={<FileMarkdownOutlined />} css={{marginLeft:'8px'}} type='default' size='default' onClick={onExpMarkdown}/>
                        </Tooltip>
                        <Tooltip color='cyan' placement="bottomLeft" title='导出html'>
                            <Button shape='circle' icon={<Html5Outlined />} css={{marginLeft:'8px'}} type='default' size='default' onClick={onExpHtml} />
                        </Tooltip>
                    </div>
                }
                size={{w:winW-200, h:winH-300, fixh:true, wrapperId:wrapperId}}                
                visible={props.visible}
                maskClosable={true}               
                onCancel={props.onCancel}>
            <div id={bodyId} className='markdown-body' css={{
                margin:'0px auto',
                width:'98%',
                overflowX:'hidden'}}
                dangerouslySetInnerHTML={{__html:refCont}}>
            </div>
            {/* <div id='demo111' css={{width:'500px',height:'500px'}}></div> */}
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
    </React.Fragment>);
    
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