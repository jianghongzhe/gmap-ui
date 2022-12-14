import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout, message } from 'antd';

import Welcome from './views/Welcome';
import OpenGraphDlg from './views/OpenGraphDlg';
import NewGraphDlg from './views/NewGraphDlg';
import EditGraphDlg from './views/EditGraphDlg';
import Toolbar from './views/Toolbar';
import GraphTabs from './views/GraphTabs';
import RefViewer from './views/RefViewer';
import TimelineViewer from './views/TimelineViewer';
import ProgsViewer from './views/ProgsViewer';
import StrParamReplaceDlg from './views/StrParamReplaceDlg';
import {useBoolean, useMount} from 'ahooks';

import api from '../../service/api';
import screenShot from '../../service/screenShot';
import keyDetector from 'key-detector/src';
import strTmpl from '../../common/strTmpl';
import FindInFileDlg from './views/FindInFileDlg';
import expSvc from '../../service/expSvc';
import {tabActiveKey, tabHasPane,  tabCurrPane, tabCurrInd} from '../../store/tabs';
import {useRecoilValue} from 'recoil';

import {useInitFindInPageDlg, useLoadAllDirs, useSetPathValidState, useSetWindowTitle, useLoadFileList} from '../../hooks';
import { useCopyCurrMapLink, useCreateNewMapPromise, useSaveMapPromise, useSelectFileListItem } from '../../hooks/tabs';
import HelpDlg from './views/edit/HelpDlg';
import {useEditTags} from "../../hooks/tags";

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
    const activeKey=useRecoilValue(tabActiveKey);
    const hasPane=useRecoilValue(tabHasPane);
    const currPane= useRecoilValue(tabCurrPane);

    const currTabInd =useRecoilValue(tabCurrInd);
   
    const saveMapPromise= useSaveMapPromise();
    const createNewMapPromise=useCreateNewMapPromise();
    const copyCurrMapLink= useCopyCurrMapLink();

    const selectFileListItem= useSelectFileListItem();


    const loadAllDirs=useLoadAllDirs();
    const initFindInPageDlg= useInitFindInPageDlg();
    const setWindowTitle=useSetWindowTitle();
    const setPathValidState=useSetPathValidState();
    const [loadFileList, reloadFileList]=useLoadFileList();

    const [helpDlgVisible, {setTrue:showHelpDlg, setFalse:hideHelpDlg}]=useBoolean(false);
    const [newMapDlgVisible, setNewMapDlgVisible]=useState(false);
    const [selMapDlgVisible, setSelMapDlgVisible]=useState(false);



    const [strParamReplaceDlgVisible, setStrParamReplaceDlgVisible]=useState(false);
    const [currLinkUrl, setCurrLinkUrl]=useState(null);
    const [paramReplItems, setParamReplItems]=useState([]);


    
    const [findInFileDlgVisible,{setTrue:showFindInFileDlg, setFalse:hideFindInFileDlg}]=useBoolean(false);

    const [relaChartDlgVisible, setRelaChartDlgVisible]=useState(false); 

    
    

    const [{currMapName,editTmpTxt,editMapDlgVisible}, setEditDlgState]= useState({
        currMapName: '',
        editTmpTxt: '',
        editMapDlgVisible: false,
    });

    const [tags, tagVal, {setTags, removeTagByInd, addTag, setTagVal, changeTagVal}]= useEditTags();

    

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

    

    useMount(()=>{
        initFindInPageDlg();
        setWindowTitle();
        loadAllDirs();
        loadFileList();
        setPathValidState();
    });

    

    


    
    

    const closeAllDlg =useCallback(() => {
        setNewMapDlgVisible(false);
        setSelMapDlgVisible(false);
        setEditDlgState((state)=>({...state, editMapDlgVisible:false}));
        setRefViewerDlgState((state)=>({...state, refViewerDlgVisible:false}));
        setTimelineDlgState((state)=>({...state, timelineDlgVisible:false}));
        setProgsDlgState((state)=>({...state, progsDlgVisible:false}));
        setRelaChartDlgVisible(false);
        setStrParamReplaceDlgVisible(false);
    },[
        setNewMapDlgVisible,
        setSelMapDlgVisible,
        setEditDlgState,
        setRefViewerDlgState,
        setTimelineDlgState,
        setProgsDlgState,
        setRelaChartDlgVisible,
        setStrParamReplaceDlgVisible,
    ]);



    /**
     * 初始化查找快捷键，并在组件销毁时移除
     */
    useEffect(()=>{
        const keyHandle=(e)=>{
            //当编辑窗口或新建窗口打开时，不支持查找功能
            const isExcludeForFindInFile=[editMapDlgVisible, newMapDlgVisible, refViewerDlgVisible, selMapDlgVisible, timelineDlgVisible, progsDlgVisible, helpDlgVisible].some(each=>true===each);
            const isExcludeForFindInPage= [editMapDlgVisible, newMapDlgVisible, findInFileDlgVisible].some(each=>true===each);
            const isExcludeForEsc= [editMapDlgVisible, newMapDlgVisible, findInFileDlgVisible, helpDlgVisible].some(each=>true===each);
            const isExcludeForHelpDlg=[editMapDlgVisible, newMapDlgVisible, refViewerDlgVisible, selMapDlgVisible, timelineDlgVisible, progsDlgVisible, helpDlgVisible].some(each=>true===each);

            keyDetector.on(e,{
                //ctrl+f 网页内查找
                'ctrl+f':(e)=>{
                    if(isExcludeForFindInPage){return;}
                    api.showFindInPageDlg();
                },


                //ctrl+h 显示帮助对话框
                'ctrl+h':(e)=>{
                    if(isExcludeForHelpDlg){return;}
                    showHelpDlg();
                },

                // ctrl+shift+f 在文件中查询
                'ctrl+shift+f':(e)=>{
                    (async()=>{
                        if(isExcludeForFindInFile || await api.getFindInPageDlgVisible()){return;}
                        showFindInFileDlg();
                    })();
                },


                //esc 关闭网页内查找
                'esc':(e)=>{
                    if(isExcludeForEsc){return;}
                    api.closeFindInPageDlg();
                },
            });
        }

        document.addEventListener('keydown', keyHandle);
        return ()=>document.removeEventListener('keydown',keyHandle);
    },[editMapDlgVisible, newMapDlgVisible,helpDlgVisible, findInFileDlgVisible, showFindInFileDlg, refViewerDlgVisible, selMapDlgVisible, timelineDlgVisible, progsDlgVisible, showHelpDlg]);




    /**
     * 当前选项卡有变化时进行处理：
     * 1、当没有当前选项卡时：表示回到首页，关闭查找框
     * 2、当当前选项卡有变化时，表示有选项卡切换操作或节点展开/折叠操作，进行重新查找
     */
    useEffect(()=>{
        if(null===currPane){
            api.closeFindInPageDlg();
            return;
        }
        setTimeout(api.refindInPage, 600);
    },[currPane]);



    //------------新建图表操作----------------------------------------------------------------------
    const onShowNewMapDlg =useCallback(() => {
        api.closeFindInPageDlg();
        setNewMapDlgVisible(true);
    },[setNewMapDlgVisible]);


    const onNewMapDlgOK =useCallback(({dir,name}) => {
        (async()=>{
            try {
                await createNewMapPromise({dir,name});
                setNewMapDlgVisible(false);
                reloadFileList();
            } catch (error) {
            }
        })();
    },[ setNewMapDlgVisible, createNewMapPromise, reloadFileList]);


    //------------修改导图----------------------------------------------------------------------
    const onShowEditMapDlg =useCallback(() => {
        (async()=>{
            try {
                api.closeFindInPageDlg();
                setEditDlgState({
                    editMapDlgVisible: true,
                    editTmpTxt: currPane.mapTxts,
                    currMapName: currPane.title
                });
                setTags(currPane.tags);
                setTagVal("");
            } catch (error) {
            }
        })();
    },[ currPane]);

    const onChangeEditTmpTxt =useCallback((editor, data, value) => {
        setEditDlgState((state)=>({...state, editTmpTxt: value}));
    },[setEditDlgState]);

    const onEditMapDlgOK =useCallback(async (closeDlg = true) => {
        try {
            let txt = editTmpTxt;
            await saveMapPromise(txt, tags);
            setEditDlgState(state=>({...state, editMapDlgVisible: !closeDlg}));
            if (!closeDlg) {
                message.success("图表内容已保存");
            }
        } catch (error) {
        }
    },[ setEditDlgState, editTmpTxt, saveMapPromise, tags]);



    //------------选择文件功能----------------------------------------------------------------------
    const onSelectMapItem =useCallback(async (item) => {
        try{
            selectFileListItem(item);
            setSelMapDlgVisible(false);
        }catch(e){
        }
    },[selectFileListItem, setSelMapDlgVisible]);


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

    

    

    const openRef =useCallback((refObj) => {
        setRefViewerDlgState({
            currRefObj: refObj,
            refViewerDlgVisible: true,
        });
    },[setRefViewerDlgState]);



    const onExpHtml=useCallback(()=>{
        (async ()=>{
            const exists=await api.existsFullpath(activeKey);
            if(!exists){
                api.showNotification("无法导出html",`路径不存在：\n${activeKey}`,"err");
                return;
            }
            const content=await api.load(activeKey);
            const handledContent=expSvc.preHandleMDBeforeExport(content);
            console.log(activeKey);
            api.expHtml(activeKey,null,handledContent);
        })();
    },[activeKey]);

    
    const onExpMarkdown=useCallback(()=>{
        (async ()=>{
            const exists=await api.existsFullpath(activeKey);
            if(!exists){
                api.showNotification("无法导出Markdown",`路径不存在：\n${activeKey}`,"err");
                return;
            }
            const content=await api.load(activeKey);
            const handledContent=expSvc.preHandleMDBeforeExport(content);
            console.log(activeKey);
            api.expMarkdown(activeKey,null,handledContent);
        })();
    },[activeKey/*, panes*/]);


    /**
     * 导出图片或pdf  
     * @param {*} expImg  true-导出图片  false-导出pdf
     */
    const onExpImage=useCallback((type='img')=>{
        (async()=>{
            if(null===currTabInd){
                return;
            }

            const typeNames={
                shot: '滚动截屏',
                img: '导出图片',
                pdf: '导出PDF',
                word: '导出word文档',
            };
            const typeFuncs={
                shot: ()=>new Promise((res, rej)=>res("memory")),
                img: api.openSaveFileDlg,
                pdf: api.openSaveFileDlg.bind(this, 'pdf'),
                word: api.openSaveFileDlg.bind(this, 'word'),
            };            
            
            // 取当前div的父元素作为其容器，并计算容器的位置等信息作为截图的依据
            let ele=document.querySelector(`#graphwrapper_${currTabInd}`);
            if(!ele){
                api.showNotification('错误','图表状态异常，无法导出','err');
                return;
            }
            let {width:maxW, height:maxH}= ele.getBoundingClientRect();
            maxW=parseInt(maxW);
            maxH=parseInt(maxH);
            let minL=99999;
            let maxB=0;
            document.querySelectorAll(`#graphwrapper_${currTabInd} .item`).forEach(ele=>{
                const ndRect=ele.getBoundingClientRect();
                const ndLeft=parseInt(ele.style.left.substring(0, ele.style.left.length-2));
                if(ndLeft<minL){
                    minL=ndLeft;
                }
                const ndBottom=parseInt(ndRect.height)+ parseInt(ele.style.top.substring(0, ele.style.top.length-2));
                if(ndBottom>maxB){
                    maxB=ndBottom;
                }
            });
            if(maxW-2*minL+60<maxW){
                maxW=maxW-2*minL+60;
            }
            if(maxB+30<maxH){
                maxH=maxB+30;
            }

            let containerEle=ele.parentNode;
            let {x,y}=containerEle.getBoundingClientRect();
            const maximized=await api.isMaximized();
            if(!maximized){
                api.showNotification("警告",`窗口只有在最大化时才能${typeNames[type]}`,"warn");
                return;
            }
            const devMode=await api.isDevMode();
            screenShot(
                typeFuncs[type],    //保存文件对话框函数
                api.takeScreenShot,     //openUrl,            //执行截屏的函数
                api.screenShotCombine,  //openUrl,
                containerEle,           //容器元素
                ele,                    //内容元素
                Math.floor(x),          //开始截取的位置相对于浏览器主体内容区域左边的距离
                Math.floor(y),          //开始截取的位置相对于浏览器主体内容区域上边的距离
                devMode,                //是否考虑菜单栏的高度：开始模式显示菜单栏，运行模式不显示
                null,                   // 排除id为空
                [maxW, maxH]            // 有效部分最大的宽和高
            );
        })();
    },[currTabInd]);


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
            api.openUrl(url, selectFileListItem);
            return;
        }
        setCurrLinkUrl(url);
        setParamReplItems(replaceItems);
        setStrParamReplaceDlgVisible(true);
    },[setCurrLinkUrl, setParamReplItems, setStrParamReplaceDlgVisible, selectFileListItem]);

    /**
     * 参数占位符替换后的回调
     * @param {*} url 
     */
    const onStrParamReplaceDlgOk=useCallback((url)=>{
        setStrParamReplaceDlgVisible(false);
        api.openUrl(url, selectFileListItem);
    },[setStrParamReplaceDlgVisible, selectFileListItem]);


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
        relaChartDlgVisible
    ),[
        newMapDlgVisible,
        editMapDlgVisible,
        selMapDlgVisible,
        refViewerDlgVisible,
        timelineDlgVisible,
        progsDlgVisible,
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
                                onScreenShot={onExpImage.bind(this, 'shot')}
                                onExpImage={onExpImage.bind(this, 'img')}
                                onExpPdf={onExpImage.bind(this, 'pdf')}
                                onExpWord={onExpImage.bind(this, 'word')}
                                onExpMarkdown={onExpMarkdown}
                                onExpHtml={onExpHtml}
                                onCheckUpdate={api.openUpdateApp}
                                onCopyMapLink={copyCurrMapLink}
                                onOpenHelpDlg={showHelpDlg}
                            />
                            <GraphTabs
                                hasOpenDlg={hasOpenDlg}
                                onOpenLink={onBeforeOpenLink}
                                onOpenRef={openRef}
                                onShowTimeline={onShowTimeline}
                                onShowProgs={onShowProgs}
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
                                onSelectMapItem={onSelectMapItem}
                                onOpenUpdateApp={api.openUpdateApp}/>
                        </Content>
                }
            </Layout>

            <FindInFileDlg visible={findInFileDlgVisible}
                onCancel={hideFindInFileDlg}
            />

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
                tags={tags}
                tagVal={tagVal}
                onChangeTagVal={changeTagVal}
                onAddTag={addTag}
                onRemoveTagByInd={removeTagByInd}
                onOnlySave={onEditMapDlgOK.bind(this, false)}
                onOk={onEditMapDlgOK.bind(this, true)}
                onCancel={closeAllDlg}
                onChangeEditTmpTxt={onChangeEditTmpTxt}
                onOpenHelpDlg={showHelpDlg}
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

            {/* 帮助对话框 */}
            <HelpDlg
                visible={helpDlgVisible}
                onCancel={hideHelpDlg}/>
        </React.Fragment>
    );
    
}



export default React.memo(MapsViewer);

