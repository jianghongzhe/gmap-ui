/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { useCallback, useEffect, useState } from 'react';
import { Layout, message,Modal } from 'antd';

import Welcome from './views/Welcome';
import OpenGraphDlg from './views/OpenGraphDlg';
import NewGraphDlg from './views/NewGraphDlg';
import EditGraphDlg from './views/EditGraphDlg';
import Toolbar from './views/Toolbar';
import GraphTabs from './views/GraphTabs';
import RefViewer from './views/RefViewer';
import TimelineViewer from './views/TimelineViewer';
import ProgsViewer from './views/ProgsViewer';
import GantDlg from './views/gantt/GantDlg';


import * as uiUtil from '../../common/uiUtil';
import {connect} from '../../common/gflow';
import api from '../../service/api';
// import html2canvas from 'html2canvas';
import screenShot from '../../service/screenShot';


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
    const [newMapDlgVisible, setNewMapDlgVisible]=useState(false);
    const [selMapDlgVisible, setSelMapDlgVisible]=useState(false);

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
        if(!props.installPathValid){
            Modal.warning({
                title: '警告',
                content: '请不要安装到中文路径或带空格的路径下，否则可能造成某些功能异常',
            });
            return;
        }
    },[props.installPathValid]);


    
    

    const closeAllDlg =useCallback(() => {
        setNewMapDlgVisible(false);
        setSelMapDlgVisible(false);
        setEditDlgState((state)=>({...state, editMapDlgVisible:false}));
        setRefViewerDlgState((state)=>({...state, refViewerDlgVisible:false}));
        setTimelineDlgState((state)=>({...state, timelineDlgVisible:false}));
        setProgsDlgState((state)=>({...state, progsDlgVisible:false}));
        setGantdlgState((state)=>({...state, gantdlgVisible:false}));
    },[
        setNewMapDlgVisible,
        setSelMapDlgVisible,
        setEditDlgState,
        setRefViewerDlgState,
        setTimelineDlgState,
        setProgsDlgState,
        setGantdlgState
    ]);



    //------------新建图表操作----------------------------------------------------------------------
    const onShowNewMapDlg =useCallback(() => {
        setNewMapDlgVisible(true);
    },[setNewMapDlgVisible]);


    const onNewMapDlgOK =useCallback(async ({dir,name}) => {
        try {
            await props.dispatcher.tabs.onNewMapPromise({dir,name});
            setNewMapDlgVisible(false);
        } catch (error) {
        }
    },[props.dispatcher, setNewMapDlgVisible]);


    //------------修改导图----------------------------------------------------------------------
    const onShowEditMapDlg =useCallback(async () => {
        try {
            let currPane=await props.dispatcher.tabs.selectCurrPanePromise();
            setEditDlgState({
                editMapDlgVisible: true,
                editTmpTxt: currPane.mapTxts,
                currMapName: currPane.title
            });
        } catch (error) {
        }
    },[props.dispatcher, setEditDlgState]);

    const onChangeEditTmpTxt =useCallback((editor, data, value) => {
        setEditDlgState((state)=>({...state, editTmpTxt: value}));
    },[setEditDlgState]);

    const onEditMapDlgOK =useCallback(async (closeDlg = true) => {
        try {
            let txt = editTmpTxt;
            await props.dispatcher.tabs.onSaveMapPromise(txt);
            setEditDlgState(state=>({...state, editMapDlgVisible: !closeDlg}));
            if (!closeDlg) {
                message.success("图表内容已保存");
            }
        } catch (error) {
        }
    },[props.dispatcher, setEditDlgState, editTmpTxt]);



    //------------选择文件功能----------------------------------------------------------------------
    const onSelectMapItem =useCallback(async (item) => {
        try{
            await props.dispatcher.tabs.onSelItemPromise(item);
            setSelMapDlgVisible(false);
        }catch(e){
        }
    },[props.dispatcher, setSelMapDlgVisible]);


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

    const openRef =useCallback((refObj) => {
        setRefViewerDlgState({
            currRefObj: refObj,
            refViewerDlgVisible: true,
        });
    },[setRefViewerDlgState]);

    const onExpImage=useCallback(()=>{
        props.panes.forEach((item,ind)=>{
            if(props.activeKey!==item.key){
                return;
            }
            let ele=document.querySelector(`#graphwrapper_${ind}`);
            if(!ele){
                message.warn("图表状态异常，无法导出");
                return;
            }
            let containerEle=ele.parentNode;
            let {x,y}=containerEle.getBoundingClientRect();


            if(!api.isMaximized()){
                message.warn("请先点击最大化按钮后再导出图片");
                return;
            }


            
            screenShot(
                api.openSaveFileDlg,    //保存文件对话框函数
                api.openUrl,            //执行截屏的函数
                containerEle,           //容器元素
                ele,                    //内容元素
                Math.floor(x),          //开始截取的位置相对于浏览器主体内容区域左边的距离
                Math.floor(y),          //开始截取的位置相对于浏览器主体内容区域上边的距离
                api.isDevMode()         //是否考虑菜单栏的高度：开始模式显示菜单栏，运行模式不显示
            );


            // html2canvas(ele).then((canvas)=>{
            //     let base64Url=canvas.toDataURL('png');
            //     api.openUrl(base64Url);
            // });
        });
    },[props.activeKey, props.panes]);

    
    return (
        <React.Fragment>
            <Layout>
                {
                    props.hasPane ?
                        <>
                            <Toolbar
                                onShowNewMapDlg={onShowNewMapDlg}
                                onShowSelMapDlg={showSelMapDlg}
                                onShowEditMapDlg={onShowEditMapDlg}
                                onShowDir={api.openMapsDir}
                                onShowCmd={api.openBash}
                                onShowDevTool={api.showDevTool}
                                onReloadApp={api.reloadAppPage}
                                onExpImage={onExpImage}
                            />
                            <GraphTabs
                                editing={editMapDlgVisible}
                                onOpenLink={api.openUrl}
                                onOpenRef={openRef}
                                onShowTimeline={onShowTimeline}
                                onShowProgs={onShowProgs}
                                onShowGant={onShowGant}
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
        </React.Fragment>
    );
    
}


const mapState=(state)=>({
    hasPane:            state.tabs && state.tabs.panes && 0 < state.tabs.panes.length,
    installPathValid:   state.common.installPathValid,
    activeKey:          state.tabs.activeKey,
    panes:              state.tabs.panes,
});


export default connect(mapState)(MapsViewer);

