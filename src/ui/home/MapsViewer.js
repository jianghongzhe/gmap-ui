import React, { useEffect, useMemo, useState } from 'react';
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
import {useBoolean, useMemoizedFn, useMount} from 'ahooks';

import api from '../../service/api';

import keyDetector from 'key-detector';
import FindInFileDlg from './views/FindInFileDlg';
import expSvc from '../../service/expSvc';
import {tabActiveKey, tabHasPane,  tabCurrPane, tabCurrInd} from '../../store/tabs';
import {useRecoilValue} from 'recoil';

import {useInitFindInPageDlg, useLoadAllDirs, useSetPathValidState, useSetWindowTitle, useLoadFileList} from '../../hooks';
import { useCopyCurrMapLink, useCreateNewMapPromise, useSaveMapPromise, useSelectFileListItem } from '../../hooks/tabs';
import HelpDlg from './views/edit/HelpDlg';
import {useEditTags} from "../../hooks/tags";
import {useNodeOp} from "../../hooks/nodeOp";
import {useOpenLinkWithParam} from "../../hooks/openLinkWithParam";
import {dispatch} from 'use-bus';
import {editorEvents} from "../../common/events";
import {useEditorDlg} from "../../hooks/editorDlg";
import {takeScrshot, CombineShotResultMem, CombineShotResultImg, CombineShotResultPdf, CombineShotResultDoc} from "../../service/screenShot";

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



    const {calcNewTxtAndCursor}= useNodeOp(currPane?.mapTxts);

    const [findInFileDlgVisible,{setTrue:showFindInFileDlg, setFalse:hideFindInFileDlg}]=useBoolean(false);

    const [relaChartDlgVisible, setRelaChartDlgVisible]=useState(false); 

    
    


    const {
        currMapName,
        editTmpTxt,
        editMapDlgVisible,
        closeDlg: closeEditorDlg,
        showDlg: showEditorDlg,
        changeTxt: changeEditorTxt,
    }= useEditorDlg();
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

    const openLinkWrapper= useMemoizedFn((url)=>{
        if(url.startsWith("gmap://")){
            api.openUrl(url, selectFileListItem);
        }else{
            api.openUrl(url, currPane?.key??'');
        }
    });


    // 链接插值参数
    const {
        dlgVisible: strParamReplaceDlgVisible,
        currLinkUrl,
        paramReplItems,
        onClickLink: onBeforeOpenLink,
        onDlgCancel: closeParamDlg,
        onDlgOk: onStrParamReplaceDlgOk,
    }= useOpenLinkWithParam(openLinkWrapper);

    

    useMount(()=>{
        initFindInPageDlg();
        setWindowTitle();
        loadAllDirs();
        loadFileList();
        setPathValidState();
    });
    

    const closeAllDlg =useMemoizedFn(() => {
        setNewMapDlgVisible(false);
        setSelMapDlgVisible(false);
        closeEditorDlg();
        setRefViewerDlgState(state=>({...state, refViewerDlgVisible:false}));
        setTimelineDlgState(state=>({...state, timelineDlgVisible:false}));
        setProgsDlgState(state=>({...state, progsDlgVisible:false}));
        setRelaChartDlgVisible(false);
        closeParamDlg();
    });



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
    const onShowNewMapDlg =useMemoizedFn(() => {
        api.closeFindInPageDlg();
        setNewMapDlgVisible(true);
    });


    const onNewMapDlgOK =useMemoizedFn(({dir, name, cloneFromCurr}) => {
        (async()=>{
            try {
                await createNewMapPromise({dir, name, cloneFromCurr});
                setNewMapDlgVisible(false);
                reloadFileList();
            } catch (error) {
            }
        })();
    });


    //------------修改导图----------------------------------------------------------------------


    const onChangeEditTmpTxt =useMemoizedFn((editor, data, value) => {
        changeEditorTxt(value);
    });

    const onEditMapDlgOK =useMemoizedFn(async (closeDlg = true) => {
        try {
            let txt = editTmpTxt;
            await saveMapPromise(txt, tags);
            if(closeDlg){
                closeEditorDlg();
            }
            if (!closeDlg) {
                message.success("图表内容已保存");
            }
        } catch (error) {
        }
    });



    //------------选择文件功能----------------------------------------------------------------------
    const onSelectMapItem =useMemoizedFn(async (item) => {
        try{
            selectFileListItem(item);
            setSelMapDlgVisible(false);
        }catch(e){
        }
    });


    const showSelMapDlg =useMemoizedFn(() => {
        setSelMapDlgVisible(true);
    });



    //------------导图的操作----------------------------------------------------------------------

    const onShowTimeline =useMemoizedFn((timelineObj) => {
        setTimelineDlgState({
            timelineDlgVisible: true,
            timelineObj: timelineObj,
        });
    });

    const onShowProgs =useMemoizedFn((progs) => {
        setProgsDlgState({
            progsObj: progs,
            progsDlgVisible: true,
        });
    });

    

    

    const openRef =useMemoizedFn((refObj) => {
        setRefViewerDlgState({
            currRefObj: refObj,
            refViewerDlgVisible: true,
        });
    });



    const onExpHtml=useMemoizedFn(()=>{
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
    });

    
    const onExpMarkdown=useMemoizedFn(()=>{
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
    });


    /**
     * 导出图片或pdf  
     * @param {*} expImg  true-导出图片  false-导出pdf
     */
    const onExpImage=useMemoizedFn((type=CombineShotResultMem)=>{
        (async()=>{
            // 校验，只有最大化时才能截图；以及指定的容器元素必须存在
            if(null===currTabInd){
                return;
            }
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
            // 取当前div的父元素作为其容器，并计算容器的位置等信息作为截图的依据
            const ele=document.querySelector(`#graphwrapper_${currTabInd}`);
            if(!ele){
                api.showNotification('错误','图表状态异常，无法导出','err');
                return;
            }
            const containerEle=ele.parentNode;

            // 根据离边缘最近的元素决定去除的空白大小，进而得到最终要保留的图片的大小
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

            // 除了保存到剪切板外，其它都需要打开文件对话框
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

            // 开始截屏
            takeScrshot({
                eleContainer: containerEle,
                eleContent: ele,
                preHandle: ()=>{
                    containerEle.className+=" no_scrollbar_container";
                },
                postHandle: ()=>{
                    containerEle.className=containerEle.className.replace("no_scrollbar_container", "");
                },
                finalSize: [maxW, maxH],
                resultType: type,
                resultPath: resultPath,
            });
        })();
    });


    /**
     * 打开当前导图文件的目录
     */
    const onShowCurrMapDir=useMemoizedFn(()=>{
        api.openCurrMapDir(activeKey);
    });
    





    /**
     * 节点编辑：
     * 两个参数都不传递相当于默认的编辑功能
     * @param nd 节点对象
     * @param action 节点的操作 edit/appendChild/addSiblingBefore/addSiblingAfter
     *
     */
    const onNodeOp=useMemoizedFn((nd, action)=>{
        const[newMapTxts, newCursor]= calcNewTxtAndCursor(nd, action);
        api.closeFindInPageDlg();

        // 如果是编辑引用功能，且是从引用窗口调用，则先关闭引用窗口
        if('editRef'===action?.type && true===action?.extra?.byRef){
            setRefViewerDlgState(state=>({...state, refViewerDlgVisible:false}));
        }
        showEditorDlg(currPane.title, newMapTxts);
        setTags(currPane.tags);
        setTagVal("");

        // 延迟光标定位
        // 向编辑器组件发送事件，由于中间跨组件，所以不再一层一层传递
        setTimeout(()=>{
            dispatch({
                type: editorEvents.putCursor,
                payload: newCursor,
            });
        },500);
    });


    const onShowEditMapDlg =useMemoizedFn(() => {
        onNodeOp(null, null);
    });


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
        relaChartDlgVisible ||
        strParamReplaceDlgVisible
    ),[
        newMapDlgVisible,
        editMapDlgVisible,
        selMapDlgVisible,
        refViewerDlgVisible,
        timelineDlgVisible,
        progsDlgVisible,
        relaChartDlgVisible,
        strParamReplaceDlgVisible
    ]);
    
    return (
        <React.Fragment>
            <Layout>
                {
                    hasPane ?
                        <React.Fragment>
                            <Toolbar
                                onShowNewMapDlg={onShowNewMapDlg}
                                onShowSelMapDlg={showSelMapDlg}
                                onShowEditMapDlg={onShowEditMapDlg}
                                onShowDir={onShowCurrMapDir}
                                onShowCmd={api.openBash}
                                onShowDevTool={api.showDevTool}
                                onReloadApp={api.reloadAppPage}
                                onScreenShot={onExpImage.bind(this, CombineShotResultMem)}
                                onExpImage={onExpImage.bind(this, CombineShotResultImg)}
                                onExpPdf={onExpImage.bind(this, CombineShotResultPdf)}
                                onExpWord={onExpImage.bind(this, CombineShotResultDoc)}
                                onExpMarkdown={onExpMarkdown}
                                onExpHtml={onExpHtml}
                                onCheckUpdate={api.openUpdateApp}
                                onCopyMapLink={copyCurrMapLink}
                                onOpenHelpDlg={showHelpDlg}
                                onOpenLink={onBeforeOpenLink}
                            />
                            <GraphTabs
                                hasOpenDlg={hasOpenDlg}
                                onOpenLink={onBeforeOpenLink}
                                onOpenRef={openRef}
                                onShowTimeline={onShowTimeline}
                                onShowProgs={onShowProgs}
                                onNodeOp={onNodeOp}
                            />
                        </React.Fragment>

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
                onCancel={closeParamDlg}
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
                onNodeOp={onNodeOp}
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

