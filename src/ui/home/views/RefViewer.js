import React, {  useEffect, useRef, useState } from 'react';
import {  Modal,Button,BackTop,Tooltip,Anchor  } from 'antd';
import {
    FileMarkdownOutlined,
    FileImageOutlined,
    FilePdfOutlined,
    Html5Outlined,
    FileWordOutlined,
    CameraOutlined,
    MenuUnfoldOutlined, MenuFoldOutlined, EditOutlined
} from '@ant-design/icons';
import {withEnh} from '../../common/specialDlg';
import MarkedHighlightUtil from '../../../common/markedHighlightUtil';
import api from '../../../service/api';

import {marked} from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark-reasonable.css';
import 'github-markdown-css/github-markdown.css';
import mermaid from 'mermaid';
import flowchart from 'flowchart.js';
import * as echarts from 'echarts';
import echartParser from '../../../common/echartParser';
import {takeScrshot, CombineShotResultMem, CombineShotResultImg, CombineShotResultPdf, CombineShotResultDoc} from '../../../service/screenShot';



// import lodash from 'lodash';
//import snap from 'imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg.js'
// import seqdiagram from 'js-sequence-diagram';

//import lod from 'lodash';
// import snap from 'snapsvg';
import webfontloader from 'webfontloader';
import {useBoolean, useEventListener, useMemoizedFn} from 'ahooks';
import { useMemo } from 'react';
import { tabActiveKey } from '../../../store/tabs';
import { useRecoilValue } from 'recoil';
import { useBindAndGetRef } from '../../../common/commonHooks';
import styles from './RefViewer.module.scss';
import classnames from "classnames";
import {createId, unbindEvent} from '../../../common/uiUtil';
import {transform} from "lodash";
// import seqDiagram from '../../../common/sequence-diagram';
//import seqDiagram from 'js-sequence-diagram';


// console.log("wf",window.WebFont);
//window._=lod;
window.WebFont=webfontloader;
//window.Diagram=seqDiagram;
//window.Snap=snap;
// console.log("wf",window.WebFont);


// const Snap = require(`imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg.js`);

const { Link } = Anchor;

const EnhDlg=withEnh(Modal);
const codeBg = 'rgba(40,44,52,1)'; //40 44 52  #282c34
const markedHighlightUtil = new MarkedHighlightUtil();


// 此组件在应用内只有一个实例，因此一些不变的值定义在组件外面
const wrapperId=createId("refviewercontainer_");
const bodyId=createId("refviewerbody_");
const backtopId=createId("backtop_");

const getScrollContainer= ()=>document.querySelector(`#${wrapperId}`);

/**
 * 引用查看器
 * @param {*} props
 */
const RefViewer=({visible, onOpenLink, onNodeOp, currRefObj, onCancel})=>{
    const activeKey= useRecoilValue(tabActiveKey);
    const [,bindScrollTarget, getScrollTarget]= useBindAndGetRef();
    const lastRefCondRef=useRef('');
    const [navOpen, {setFalse:closeNav, toggle: toggleNav}] = useBoolean(false);
    const [navItems, setNavItems]=useState([]);


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
                    const ret=api.calcAttUrlSync(activeKey, oldurl);
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
                    //跳过不是本地相对路径的
                    if (!oldurl.startsWith("assets/")) { return [oldurl, oldurl]; }
                    const [urlShow, urlOpen]=api.calcPicUrlSync(activeKey, oldurl);
                    const encodeRet=encodeURI(urlShow);
                    return [urlOpen, encodeRet];
                }
            }
        });
    },[activeKey]);

    useEffect(()=>{
        if(visible){
            setTimeout(resizeEchartGraphs, 500);
        }
    },[visible, navOpen])

    /**
     * 当窗口大小改变时，使echart图自适应，仅当引用窗口显示时有效
     */
    useEventListener("resize", ()=>{
        if(visible){
            setTimeout(resizeEchartGraphs, 500);
        }
    }, {target:window});

    

    const cleanupFuncs= useRef([]);

    let {result, refname, refCont, txt}=useMemo(()=>{
        if(!currRefObj || !currRefObj.txt || !currRefObj.showname){
            return {result:false, refname:'', refCont:'', txt:''};
        }
        // if (null == currRefObj.parsedTxt) {
        //     currRefObj.parsedTxt = marked(currRefObj.txt);
        // }
        const parsedTxt = marked(currRefObj.txt);
        let refname=currRefObj.showname;
        let refCont=parsedTxt;
        return {result:true, refname, refCont, txt:currRefObj.txt};
    },[currRefObj]);




    /**
     * 当窗口显示时的操作：
     * 1、若html有变动，则清理之前绑定的事件，创建的图片对象等
     * 2、初始化以下组件：
     * (1)、链接点击事件
     * (2)、图片点击事件
     * (3)、对未初始化的mermaid图初始化
     * (4)、对未初始化的flowchart图初始化
     * (5)、对未初始化的sequence图初始化
     * (6)、对未初始化的echart图初始化
     * (7)、对所有echart图设置自适应：以防止改变窗口大小后再次打开引用窗口后无法检测到窗口大小已改变
     */
    useEffect(()=>{
        if(visible){

            // 当html内容有变化时移除之前绑定的事件，避免内存泄漏
            if(lastRefCondRef.current!==refCont){
                if(cleanupFuncs.current && cleanupFuncs.current.length>0){
                    cleanupFuncs.current.forEach(unbindFunc=>unbindFunc());
                }
                cleanupFuncs.current=[];
            }
            lastRefCondRef.current=refCont;

            // 延时一会再绑定事件
            setTimeout(() => {
                markedHighlightUtil.bindLinkClickEvent(onOpenLink, null, cleanupFuncs.current);
                markedHighlightUtil.bindImgClickEvent(onOpenLink, null, cleanupFuncs.current);

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
                            const percent=parseInt(conf.h.substring(0,conf.h.length-1).trim());
                            // (100vh-300px)*percent/100 = percent vh - 3*percent px
                            nd.style.height=`calc(${percent}vh - ${3*percent}px)`;
                        }else{
                            nd.style.height=conf.h;
                        }
                        const chartObj=echarts.init(nd);
                        chartObj.setOption(conf.opt);
                        
                        // console.log(echarts.getInstanceByDom(nd));
                        ele.setAttribute("w",conf.w);
                        ele.setAttribute("h",conf.h);
                        ele.setAttribute("handled",'true');//置标识，表示已处理过，下次渲染不再重复绘制

                        cleanupFuncs.current.push(()=>{
                            chartObj?.dispose?.();
                        });
                    }catch(e){
                        console.log(e);
                        let msg='Echart图表格式有误 !!!';
                        if("string"===typeof(e)){
                            msg=`Echart图表格式有误：${e}`;
                        }else if("object"===typeof(e) && e instanceof Error){
                            msg=`Echart图表格式有误：${e.message}`;
                        }
                        if(nd){
                            nd.innerHTML=`<div style='color:red; border:1px solid red; padding:15px;width:400px;margin-top:20px;margin-bottom:20px;'>${msg}</div>`;
                        }
                    }
                });
                resizeEchartGraphs();

                // 对代码片段的复制代码按钮、运行按钮、运行并暂停按钮绑定处理函数
                // 要考虑其中没有复制按钮的情况，比如latex公式
                document.querySelectorAll(".markdown-body code.hljs[handled='false']").forEach(ele=>{
                    const codeWrappeEle=ele.parentNode.parentNode;
                    const codeTxt= (ele.innerText??'');
                    const codeTxtNoWrap=codeTxt.trim().replace(/\r/g,'').replace(/\n/g,' \\');

                    const btn=codeWrappeEle.querySelector(".copy_btn");
                    if(btn){
                        const ctxMenuHandler=copyTxt.bind(this, codeTxt);
                        btn.addEventListener("click", ctxMenuHandler);
                        // console.log("bind click event", btn);
                        cleanupFuncs.current.push(unbindEvent.bind(this, btn, "click", ctxMenuHandler));
                    }

                    const cmdBtn= codeWrappeEle.querySelector(".cmd_btn");
                    if(cmdBtn){
                        const handler=api.openUrl.bind(this, `cmd://${codeTxtNoWrap}`);
                        cmdBtn.addEventListener("click", handler);
                        cleanupFuncs.current.push(unbindEvent.bind(this, cmdBtn, "click", handler));
                    }

                    const cmdpBtn=codeWrappeEle.querySelector(".cmdp_btn");
                    if(cmdpBtn){
                        const handler=api.openUrl.bind(this,`cmdp://${codeTxtNoWrap}`);
                        cmdpBtn.addEventListener("click", handler);
                        cleanupFuncs.current.push(unbindEvent.bind(this, cmdpBtn, "click", handler));
                    }
                    ele.setAttribute("handled",'true');
                });

                // 关键词点击以搜索
                document.querySelectorAll(".search_keyword[handled='false']").forEach(ele=>{
                    const clickHandler=api.searchKeyword.bind(this, ele.innerText);
                    ele.addEventListener("click", clickHandler);
                    // console.log("bind click event", ele);
                    cleanupFuncs.current.push(unbindEvent.bind(this, ele, "click", clickHandler));
                    ele.setAttribute("handled",'true');
                });

                // 加载标题以生成导航栏内容
                const tmpNavItems=[];
                let lastItem=null;
                document.querySelectorAll(`#${wrapperId} .markdown-body .markdown_head`).forEach(titleEle=>{
                    const item={
                        id: titleEle.getAttribute("id").trim(),
                        txt: titleEle.innerText.trim(),
                        lev: parseInt(titleEle.tagName.toLowerCase().substring(1)),
                        par: null,
                        childs: [],
                    };
                    while(null!==lastItem && item.lev<=lastItem.lev){
                        lastItem=lastItem.par;
                    }
                    if(null===lastItem){
                        tmpNavItems.push(item);
                        lastItem=item;
                        return;
                    }
                    lastItem.childs.push(item);
                    item.par=lastItem;
                    lastItem=item;
                });
                setNavItems(tmpNavItems);
                if(0===tmpNavItems.length){
                    closeNav();
                }
            }, 500);
        }
        return ()=>{
            // if(cleanupFuncs.current && cleanupFuncs.current.length>0){
            //     cleanupFuncs.current.forEach(unbindFunc=>unbindFunc());
            // }
        };
    },[visible, onOpenLink, cleanupFuncs, refCont, setNavItems, closeNav]);
    
    

    
    const onExpHtml=useMemoizedFn(()=>{
        //expSvc.expHtml(refname, marked(txt));
        api.expHtml(activeKey, refname, txt);
    });

    
    const onExpMarkdown=useMemoizedFn(()=>{
        api.expMarkdown(activeKey,refname, txt);
        //expSvc.expMarkdown(txt);
    });
    

    

    /**
     * 导出图片或pdf
     * @param {*} expImg  true-导出图片  false-导出pdf
     */
    const onExpImage=useMemoizedFn((type=CombineShotResultMem)=>{
        (async()=>{
            try{
                const typeNames={
                    [CombineShotResultMem]: '滚动截屏',
                    [CombineShotResultImg]: '导出图片',
                    [CombineShotResultPdf]: '导出PDF',
                    [CombineShotResultDoc]: '导出word文档',
                };
                const maximized=await api.isMaximized();
                if(!maximized){
                    api.showNotification("警告",`窗口只有在最大化时才能${typeNames[type]}`,"warn");
                    return;
                }
                if(navOpen && navItems?.length>0){
                    api.showNotification("警告",`在右侧导航栏展开时不允许${typeNames[type]}`,"warn");
                    return;
                }





                // const devMode=await api.isDevMode();
                const containerEle=document.querySelector(`#${wrapperId}`);
                const bodyEle=document.querySelector(`#${bodyId}`);
                // let {x,y}=containerEle.getBoundingClientRect();
                // screenShot(
                //     typeFuncs[type],    //保存文件对话框函数
                //     api.takeScreenShot,     //openUrl,            //执行截屏的函数
                //     api.screenShotCombine,  //openUrl,
                //     containerEle,           //容器元素
                //     bodyEle,                //内容元素
                //     Math.floor(x),          //开始截取的位置相对于浏览器主体内容区域左边的距离
                //     Math.floor(y),          //开始截取的位置相对于浏览器主体内容区域上边的距离
                //     devMode,                 //是否考虑菜单栏的高度：开始模式显示菜单栏，运行模式不显示
                //     backtopId
                // );

                const typeFuncs={
                    [CombineShotResultImg]: api.openSaveFileDlg,
                    [CombineShotResultPdf]: api.openSaveFileDlg.bind(this, 'pdf'),
                    [CombineShotResultDoc]: api.openSaveFileDlg.bind(this, 'word'),
                };
                let resultPath="";
                if(CombineShotResultMem!==type){
                    try {
                        resultPath = await typeFuncs[type]();
                    }catch (e){
                        // 用户取消
                        return;
                    }
                }

                let originStyle=null;
                takeScrshot({
                    eleContainer: containerEle,
                    eleContent: bodyEle,
                    preHandle: ()=>{
                        containerEle.className+=" no_scrollbar_container";
                        // this.excludePrevState=ele.style.display;
                        originStyle=document.querySelector(`#${backtopId}`).style.display;
                        document.querySelector(`#${backtopId}`).style.display="none";
                    },
                    postHandle: ()=>{
                        containerEle.className=containerEle.className.replace("no_scrollbar_container", "");
                        document.querySelector(`#${backtopId}`).style.display=originStyle;
                    },
                    resultType: type,
                    resultPath: resultPath,
                    resultMultiPage: true,
                });
            }catch(e){
            }
        })();
    });


    const onEditRef=useMemoizedFn(()=>{
        onNodeOp(null, {
            type:'editRef',
            cont:currRefObj,
            extra:{
                byRef:true
            },
        })
    });


    
    
    if(false===result){
        return null;
    }
    

    return (<React.Fragment>
        <EnhDlg noFooter
                title={
                    <div className={styles.toolbar_container}>
                        {"查看引用 - " + refname}
                        {
                            navItems?.length>0 &&
                            <ToolbarItem title={navOpen?'关闭导航栏':'开启导航栏'}
                                         icon={navOpen ?
                                            <MenuFoldOutlined className='reverse_icon'/> :
                                            <MenuUnfoldOutlined className='reverse_icon'/>
                                         }
                                         onClick={toggleNav}
                            />
                        }
                        {
                            true!==currRefObj?.combined &&
                            <ToolbarItem title='编辑引用' icon={<EditOutlined />} onClick={onEditRef}/>
                        }
                        <ToolbarItem title='滚动截屏' icon={<CameraOutlined />} onClick={onExpImage.bind(this, CombineShotResultMem)}/>
                        <ToolbarItem title='导出图片' icon={<FileImageOutlined />} onClick={onExpImage.bind(this, CombineShotResultImg)}/>
                        <ToolbarItem title='导出pdf' icon={<FilePdfOutlined />} onClick={onExpImage.bind(this, CombineShotResultPdf)}/>
                        <ToolbarItem title='导出word' icon={<FileWordOutlined />} onClick={onExpImage.bind(this, CombineShotResultDoc)}/>
                        <ToolbarItem title='导出markdown' icon={<FileMarkdownOutlined />} onClick={onExpMarkdown}/>
                        <ToolbarItem title='导出html' icon={<Html5Outlined />} onClick={onExpHtml}/>
                    </div>
                }
                size={{w:'calc(100vw - 200px)', h:'calc(100vh - 300px)', fixh:true, wrapperId, wrapperRef:bindScrollTarget}}
                visible={visible}
                maskClosable={true}               
                onCancel={onCancel}>
            <div id={bodyId}
                 className={classnames('markdown-body', navOpen ? styles.markdown_body_with_nav: styles.markdown_body)}
                 dangerouslySetInnerHTML={{__html:refCont}}>
            </div>
            {
                (navOpen && navItems?.length>0) && (
                    <Anchor affix={false} showInkInFixed={true} className={styles.navbar} getContainer={getScrollContainer}>
                        {
                            navItems.map(item=><NavLink key={`navitem_${item.id}`} item={item}/>)
                        }
                    </Anchor>
                )
            }
            <BackTop id={backtopId} target={getScrollTarget} className={styles.backtop}/>
        </EnhDlg>
    </React.Fragment>);
    
}

const NavLink=({item})=>{
    return (<Link href={`#${item.id}`} title={item.txt} >
        {
            0<item?.childs?.length && (
                item.childs.map(subItem=>(<NavLink key={`navitem_${subItem.id}`} item={subItem}/>))
            )
        }
    </Link>);
};



const copyTxt=(txt)=>{
    api.copyTxtQuiet(txt);
    api.showNotification("内容已复制","代码已复制到剪切板","succ");
};


const ToolbarItem=({title, icon, onClick})=>(
    <Tooltip color='cyan' placement="top" title={title}>
        <Button shape='circle'
                icon={icon}
                className='toolbar'
                type='default'
                size='default'
                onClick={onClick}/>
    </Tooltip>
);



/**
 * 调整echart图的大小，使其对容器自适应
 */
 const resizeEchartGraphs=()=>{
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
            const percent=parseInt(h.substring(0,h.length-1).trim());
            // (100vh-300px)*percent/100 = percent vh - 3*percent px
            h=`calc(${percent}vh - ${3*percent}px)`
        }
        nd.style.height=h;
        nd.style.width=w;
        echarts.getInstanceByDom(nd).resize({
            width:'auto',
            height:'auto',
            silent:true,
        });
    });
};



export default React.memo(RefViewer);