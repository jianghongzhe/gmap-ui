/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout, message } from 'antd';

import Welcome from './views/Welcome';
import OpenGraphDlg from './views/OpenGraphDlg';
import NewGraphDlg from './views/NewGraphDlg';
import EditGraphDlg from './views/EditGraphDlg';
import RelaChartDlg from './views/RelaChartDlg';
import Toolbar from './views/Toolbar';
import GraphTabs from './views/GraphTabs';
import RefViewer from './views/RefViewer';
import TimelineViewer from './views/TimelineViewer';
import ProgsViewer from './views/ProgsViewer';
import GantDlg from './views/gantt/GantDlg';
import StrParamReplaceDlg from './views/StrParamReplaceDlg';


import {dispatcher} from '../../common/gflow';
import api from '../../service/api';
import screenShot from '../../service/screenShot';
import { useSelector } from 'react-redux';
import keyDetector from '../../common/keyDetector';
import strTmpl from '../../common/strTmpl';

const { Content } = Layout;


/**
 * panes格式：
 * [
 *      {
 *          title: name,
 *          key: fullpath,
 *          mapTxts: defMapTxt,
 *          mapCells: cells
 *      }
 * ]
 * 
 * filelist格式：
 * [
 *      {
 *          showname:'数据结构',
 *          fullpath:'d:/a/b/c/数据结构.md',
 *          size:'108K'
 *      }
 * ]
 */
const MapsViewer=(props)=>{
    const {hasPane,installPathValid,activeKey,panes}= useSelector((state)=>({
        hasPane:            state.tabs && state.tabs.panes && 0 < state.tabs.panes.length,
        installPathValid:   state.common.installPathValid,
        activeKey:          state.tabs.activeKey,
        panes:              state.tabs.panes,
    }));


    const [newMapDlgVisible, setNewMapDlgVisible]=useState(false);
    const [selMapDlgVisible, setSelMapDlgVisible]=useState(false);

    const [strParamReplaceDlgVisible, setStrParamReplaceDlgVisible]=useState(false);
    const [currLinkUrl, setCurrLinkUrl]=useState(null);
    const [paramReplItems, setParamReplItems]=useState([]);

    const [relaChartDlgVisible, setRelaChartDlgVisible]=useState(false);

    const [graphObj, setGraphObj]=useState([]);
    

    const [{currMapName,editTmpTxt,editMapDlgVisible}, setEditDlgState]= useState({
        currMapName: '',
        editTmpTxt: '',
        editMapDlgVisible: false,
    });

    const [{gantdlgVisible, gantObj}, setGantdlgState]=useState({
        gantdlgVisible: false,
        gantObj:null,
    });

    const [{refViewerDlgVisible, currRefObj}, setRefViewerDlgState]=useState({
        refViewerDlgVisible: false,
        currRefObj:{},
    });

    const [{timelineDlgVisible, timelineObj}, setTimelineDlgState]=useState({
        timelineDlgVisible: false,
        timelineObj: [],
    });

    const [{progsDlgVisible, progsObj}, setProgsDlgState]=useState({
        progsDlgVisible: false,
            progsObj: [],
    });

    useEffect(()=>{
        if(!installPathValid){
            api.showNotification('警告', '请不要安装到中文路径或带空格的路径下，否则可能造成某些功能异常', 'warn');
            return;
        }
    },[installPathValid]);


    
    

    const closeAllDlg =useCallback(() => {
        setNewMapDlgVisible(false);
        setSelMapDlgVisible(false);
        setEditDlgState((state)=>({...state, editMapDlgVisible:false}));
        setRefViewerDlgState((state)=>({...state, refViewerDlgVisible:false}));
        setTimelineDlgState((state)=>({...state, timelineDlgVisible:false}));
        setProgsDlgState((state)=>({...state, progsDlgVisible:false}));
        setGantdlgState((state)=>({...state, gantdlgVisible:false}));
        setRelaChartDlgVisible(false);
        setStrParamReplaceDlgVisible(false);
    },[
        setNewMapDlgVisible,
        setSelMapDlgVisible,
        setEditDlgState,
        setRefViewerDlgState,
        setTimelineDlgState,
        setProgsDlgState,
        setGantdlgState,
        setRelaChartDlgVisible,
        setStrParamReplaceDlgVisible,
    ]);



    /**
     * 初始化查找快捷键，并在组件销毁时移除
     */
    useEffect(()=>{
        const keyHandle=(e)=>{
            //当编辑窗口或新建窗口打开时，不支持查找功能
            const excludeStates=[editMapDlgVisible, newMapDlgVisible];
            const isExclude=excludeStates.some(each=>true===each);

            keyDetector.on(e,{
                //ctrl+f 网页内查找
                'ctrl+f':(e)=>{
                    if(isExclude){return;}
                    api.showFindInPageDlg();
                },

                //esc 关闭网页内查找
                'esc':(e)=>{
                    if(isExclude){return;}
                    api.closeFindInPageDlg();
                },
            });
        }

        document.addEventListener('keydown', keyHandle);
        return ()=>document.removeEventListener('keydown',keyHandle);
    },[editMapDlgVisible, newMapDlgVisible]);

    useEffect(()=>{
        api.closeFindInPageDlg();
    },[hasPane]);



    //------------新建图表操作----------------------------------------------------------------------
    const onShowNewMapDlg =useCallback(() => {
        api.closeFindInPageDlg();
        setNewMapDlgVisible(true);
    },[setNewMapDlgVisible]);


    const onNewMapDlgOK =useCallback(async ({dir,name}) => {
        try {
            await dispatcher.tabs.onNewMapPromise({dir,name});
            setNewMapDlgVisible(false);
        } catch (error) {
        }
    },[ setNewMapDlgVisible]);


    //------------修改导图----------------------------------------------------------------------
    const onShowEditMapDlg =useCallback(async () => {
        try {
            api.closeFindInPageDlg();
            let currPane=await dispatcher.tabs.selectCurrPanePromise();
            setEditDlgState({
                editMapDlgVisible: true,
                editTmpTxt: currPane.mapTxts,
                currMapName: currPane.title
            });
        } catch (error) {
        }
    },[ setEditDlgState]);

    const onChangeEditTmpTxt =useCallback((editor, data, value) => {
        setEditDlgState((state)=>({...state, editTmpTxt: value}));
    },[setEditDlgState]);

    const onEditMapDlgOK =useCallback(async (closeDlg = true) => {
        try {
            let txt = editTmpTxt;
            await dispatcher.tabs.onSaveMapPromise(txt);
            setEditDlgState(state=>({...state, editMapDlgVisible: !closeDlg}));
            if (!closeDlg) {
                message.success("图表内容已保存");
            }
        } catch (error) {
        }
    },[ setEditDlgState, editTmpTxt]);



    //------------选择文件功能----------------------------------------------------------------------
    const onSelectMapItem =useCallback(async (item) => {
        try{
            await dispatcher.tabs.onSelItemPromise(item);
            setSelMapDlgVisible(false);
        }catch(e){
        }
    },[ setSelMapDlgVisible]);


    const showSelMapDlg =useCallback(() => {
        setSelMapDlgVisible(true);
    },[setSelMapDlgVisible]);



    //------------导图的操作----------------------------------------------------------------------

    const onShowTimeline =useCallback((timelineObj) => {
        setTimelineDlgState({
            timelineDlgVisible: true,
            timelineObj: timelineObj,
        });
    },[setTimelineDlgState]);

    const onShowProgs =useCallback((progs) => {
        setProgsDlgState({
            progsObj: progs,
            progsDlgVisible: true,
        });
    },[setProgsDlgState]);

    const onShowGant =useCallback((gantObj) => {
        setGantdlgState({
            gantdlgVisible: true,
            gantObj,
        });
    },[setGantdlgState]);

    const onShowGraph=(graph)=>{
        console.log("显示关系图",graph);
        setGraphObj(graph);
        setRelaChartDlgVisible(true);

        
    };

    const openRef =useCallback((refObj) => {
        setRefViewerDlgState({
            currRefObj: refObj,
            refViewerDlgVisible: true,
        });
    },[setRefViewerDlgState]);



    const onExpHtml=useCallback(()=>{
        // panes.filter(item=>activeKey===item.key).forEach((item,ind)=>{
        //     const fromInd=item.key.lastIndexOf("\\")+1;
        //     const name=item.key.substring(fromInd,item.key.length-3);
        //     console.log(name);
        //     expSvc.expHtml(name,marked(item.mapTxts));
        // });
        api.expHtml(activeKey);

    },[activeKey/*, panes*/]);

    
    const onExpMarkdown=useCallback(()=>{
        api.expMarkdown(activeKey);

        // panes.filter(item=>activeKey===item.key).forEach((item,ind)=>{
        //     expSvc.expMarkdown(item.mapTxts);
        // });
    },[activeKey/*, panes*/]);


    /**
     * 导出图片或pdf  
     * @param {*} expImg  true-导出图片  false-导出pdf
     */
    const onExpImage=useCallback((expImg=true)=>{
        (async()=>{
            // 查找当前tab的索引（与导图div元素的id对应）
            let currInd=-1;
            panes.forEach((item,ind)=>{
                if(activeKey===item.key){
                    currInd=ind;
                    return false;
                }
            });
            if(-1===currInd){
                return;
            }

            // 取当前div的父元素作为其容器，并计算容器的位置等信息作为截图的依据
            let ele=document.querySelector(`#graphwrapper_${currInd}`);
            if(!ele){
                api.showNotification('错误','图表状态异常，无法导出','err');
                return;
            }
            let containerEle=ele.parentNode;
            let {x,y}=containerEle.getBoundingClientRect();
            const maximized=await api.isMaximized();
            if(!maximized){
                api.showNotification("警告",`窗口只有在最大化时才能导出${expImg ? "图片" : "PDF"}`,"warn");
                return;
            }
            const devMode=await api.isDevMode();
            screenShot(
                expImg ? api.openSaveFileDlg : api.openSaveFileDlg.bind(this, 'pdf'),    //保存文件对话框函数
                api.takeScreenShot,     //openUrl,            //执行截屏的函数
                api.screenShotCombine,  //openUrl,
                containerEle,           //容器元素
                ele,                    //内容元素
                Math.floor(x),          //开始截取的位置相对于浏览器主体内容区域左边的距离
                Math.floor(y),          //开始截取的位置相对于浏览器主体内容区域上边的距离
                devMode                 //是否考虑菜单栏的高度：开始模式显示菜单栏，运行模式不显示
            );
        })();
    },[activeKey, panes]);


    /**
     * 打开当前导图文件的目录
     */
    const onShowCurrMapDir=useCallback(()=>{
        api.openCurrMapDir(activeKey);
    },[activeKey]);
    


    

    /**
     * 导图上链接点击事件：当其中不包含占位符时直接执行链接，否则打开对话框当设置占位符
     * @param {*} url 
     * @returns 
     */
    const onBeforeOpenLink=useCallback((url)=>{
        const replaceItems= strTmpl.parse(url);
        if(null===replaceItems){
            api.openUrl(url);
            return;
        }
        setCurrLinkUrl(url);
        setParamReplItems(replaceItems);
        setStrParamReplaceDlgVisible(true);
    },[setCurrLinkUrl, setParamReplItems, setStrParamReplaceDlgVisible]);

    /**
     * 参数占位符替换后的回调
     * @param {*} url 
     */
    const onStrParamReplaceDlgOk=useCallback((url)=>{
        setStrParamReplaceDlgVisible(false);
        api.openUrl(url);
    },[setStrParamReplaceDlgVisible]);


    /***
     * 是否有已打开的对话框
     */
    const hasOpenDlg=useMemo(()=>(
        newMapDlgVisible ||
        editMapDlgVisible ||
        selMapDlgVisible ||
        refViewerDlgVisible ||
        timelineDlgVisible ||
        progsDlgVisible ||
        gantdlgVisible ||
        relaChartDlgVisible
    ),[
        newMapDlgVisible,
        editMapDlgVisible,
        selMapDlgVisible,
        refViewerDlgVisible,
        timelineDlgVisible,
        progsDlgVisible,
        gantdlgVisible,
        relaChartDlgVisible
    ]);
    
    return (
        <React.Fragment>
            <Layout>
                {
                    hasPane ?
                        <>
                            <Toolbar
                                onShowNewMapDlg={onShowNewMapDlg}
                                onShowSelMapDlg={showSelMapDlg}
                                onShowEditMapDlg={onShowEditMapDlg}
                                onShowDir={onShowCurrMapDir}
                                onShowCmd={api.openBash}
                                onShowDevTool={api.showDevTool}
                                onReloadApp={api.reloadAppPage}
                                onExpImage={onExpImage}
                                onExpPdf={onExpImage.bind(this, false)}
                                onExpMarkdown={onExpMarkdown}
                                onExpHtml={onExpHtml}
                                onCopyMapLink={dispatcher.tabs.copyCurrMapLink}
                            />
                            <GraphTabs
                                hasOpenDlg={hasOpenDlg}
                                onOpenLink={onBeforeOpenLink}
                                onOpenRef={openRef}
                                onShowTimeline={onShowTimeline}
                                onShowProgs={onShowProgs}
                                onShowGant={onShowGant}
                                onShowGraph={onShowGraph}
                            />
                        </>

                        :

                        <Content>
                            <Welcome 
                                onOpenMapsDir={api.openMapsDir}
                                onOpenBash={api.openBash}
                                onShowDevTool={api.showDevTool}
                                onReloadApp={api.reloadAppPage}
                                onAddMap={onShowNewMapDlg}
                                onSelectMapItem={onSelectMapItem}/>
                        </Content>
                }
            </Layout>

            <StrParamReplaceDlg
                visible={strParamReplaceDlgVisible}
                replItems={paramReplItems}
                currLinkUrl={currLinkUrl}
                onOk={onStrParamReplaceDlgOk}
                onCancel={setStrParamReplaceDlgVisible.bind(this, false)}
            />

            <NewGraphDlg
                visible={newMapDlgVisible}
                onOk={onNewMapDlgOK}
                onCancel={closeAllDlg}
            />

            <EditGraphDlg
                visible={editMapDlgVisible}
                currMapName={currMapName}
                editTmpTxt={editTmpTxt}
                onOnlySave={onEditMapDlgOK.bind(this, false)}
                onOk={onEditMapDlgOK.bind(this, true)}
                onCancel={closeAllDlg}
                onChangeEditTmpTxt={onChangeEditTmpTxt}
            />

            <OpenGraphDlg
                visible={selMapDlgVisible}
                onCancel={closeAllDlg}
                onSelectMapItem={onSelectMapItem}
            />

            <RefViewer
                onOpenLink={onBeforeOpenLink}
                currRefObj={currRefObj}
                visible={refViewerDlgVisible}
                onCancel={closeAllDlg}
            />

            <TimelineViewer
                visible={timelineDlgVisible}
                timelineObj={timelineObj}
                onCancel={closeAllDlg}
            />

            <ProgsViewer
                visible={progsDlgVisible}
                progsObj={progsObj}
                onCancel={closeAllDlg}
            />

            <GantDlg
                visible={gantdlgVisible}
                gantObj={gantObj}
                onCancel={closeAllDlg}
            />

            <RelaChartDlg
                visible={relaChartDlgVisible}
                onCancel={closeAllDlg}
                name={graphObj.showname}
                opts={graphObj.items}
            />
        </React.Fragment>
    );
    
}



export default React.memo(MapsViewer);

