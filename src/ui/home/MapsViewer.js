/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
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
import GantDlg from './views/gantt/GantDlg';


import * as uiUtil from '../../common/uiUtil';
import {connect} from '../../common/gflow';
import api from '../../service/api';


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
class MapsViewer extends React.Component {
    constructor() {
        super(...arguments);

        this.state = {
            //编辑图表相关
            currMapName: '',
            editTmpTxt: '',
            editMapDlgVisible: false,
            
            //新建图表相关
            newMapDlgVisible: false,
            newMapName: '',

            //文件选择相关
            selMapDlgVisible: false,
            
            //图表上小组件的对话框：引用、时间线、进度图、甘特图
            gantdlgVisible: false,
            refViewerDlgVisible: false,
            timelineDlgVisible: false,
            progsDlgVisible: false,
            currRefObj: {},
            timelineObj: [],
            progsObj: [],
            gantObj:null,
        };
    }
    

    closeAllDlg = () => {
        this.setState({
            editMapDlgVisible: false,
            refViewerDlgVisible: false,
            newMapDlgVisible: false,
            selMapDlgVisible: false,
            timelineDlgVisible: false,
            progsDlgVisible: false,
            gantdlgVisible: false,
        });
    }



    //------------新建图表操作----------------------------------------------------------------------
    onShowNewMapDlg = () => {
        this.setState({
            newMapDlgVisible: true,
            newMapName: ''
        });
    }


    onNewMapDlgOK = async () => {
        try {
            let name = this.state.newMapName.trim();
            await this.props.dispatcher.tabs.onNewMapPromise(name);
            this.setState({newMapDlgVisible: false,});
        } catch (error) {
        }
    }


    //------------修改导图----------------------------------------------------------------------
    onShowEditMapDlg =async () => {
        try {
            let currPane=await this.props.dispatcher.tabs.selectCurrPanePromise();
            this.setState({
                editMapDlgVisible: true,
                editTmpTxt: currPane.mapTxts,
                currMapName: currPane.title
            });
        } catch (error) {
        }
    }

    onChangeEditTmpTxt = (editor, data, value) => {
        this.setState({ editTmpTxt: value });
    }

    onEditMapDlgOK =async (closeDlg = true) => {
        try {
            let txt = this.state.editTmpTxt;
            await this.props.dispatcher.tabs.onSaveMapPromise(txt);
            this.setState({editMapDlgVisible: !closeDlg});
            if (!closeDlg) {
                message.success("图表内容已保存");
            }
        } catch (error) {
        }
    }



    //------------选择文件功能----------------------------------------------------------------------
    onSelectMapItem =async (item) => {
        try{
            await this.props.dispatcher.tabs.onSelItemPromise(item);
            this.setState({selMapDlgVisible: false});
        }catch(e){
        }
    }

    showSelMapDlg = () => {
        this.setState({
            selMapDlgVisible: true
        });
    }



    //------------导图的操作----------------------------------------------------------------------
    openLink = (url) => {
        api.openUrl(url);
    }


    onShowTimeline = (timelineObj) => {
        this.setState({
            timelineDlgVisible: true,
            timelineObj: timelineObj,
        });
    }

    onShowProgs = (progs) => {
        this.setState({
            progsObj: progs,
            progsDlgVisible: true,
        });
    }

    onShowGant = (gantObj) => {
        this.setState({
            gantdlgVisible: true,
            gantObj,
        });
    }

    openRef = (refObj) => {
        this.setState({
            currRefObj: refObj,
            refViewerDlgVisible: true,
        });
    }



    render() {
        return (
            <>
                <Layout>
                    {
                        this.props.hasPane ?
                            <>
                                <Toolbar
                                    onShowNewMapDlg={this.onShowNewMapDlg}
                                    onShowSelMapDlg={this.showSelMapDlg}
                                    onShowEditMapDlg={this.onShowEditMapDlg}
                                    onShowDir={api.openMapsDir}
                                    onShowCmd={api.openBash}
                                    onShowDevTool={api.showDevTool}
                                    onReloadApp={api.reloadAppPage}
                                />
                                <GraphTabs
                                    onOpenLink={this.openLink}
                                    onOpenRef={this.openRef}
                                    onShowTimeline={this.onShowTimeline}
                                    onShowProgs={this.onShowProgs}
                                    onShowGant={this.onShowGant}
                                />
                            </>

                            :

                            <Content>
                                <Welcome 
                                    onOpenMapsDir={api.openMapsDir}
                                    onOpenBash={api.openBash}
                                    onShowDevTool={api.showDevTool}
                                    onReloadApp={api.reloadAppPage}
                                    onAddMap={this.onShowNewMapDlg}
                                    onSelectMapItem={this.onSelectMapItem}/>
                            </Content>
                    }
                </Layout>

                <NewGraphDlg
                    visible={this.state.newMapDlgVisible}
                    newMapName={this.state.newMapName}
                    onOk={this.onNewMapDlgOK}
                    onCancel={this.closeAllDlg}
                    onChangeNewMapName={uiUtil.bindChangeEventToState.bind(this, this, 'newMapName')}
                />

                <EditGraphDlg
                    visible={this.state.editMapDlgVisible}
                    currMapName={this.state.currMapName}
                    editTmpTxt={this.state.editTmpTxt}
                    onOnlySave={this.onEditMapDlgOK.bind(this, false)}
                    onOk={this.onEditMapDlgOK.bind(this, true)}
                    onCancel={this.closeAllDlg}
                    onChangeEditTmpTxt={this.onChangeEditTmpTxt}
                />

                <OpenGraphDlg
                    visible={this.state.selMapDlgVisible}
                    onCancel={this.closeAllDlg}
                    onSelectMapItem={this.onSelectMapItem}
                />

                <RefViewer
                    currRefObj={this.state.currRefObj}
                    visible={this.state.refViewerDlgVisible}
                    onCancel={this.closeAllDlg}
                />

                <TimelineViewer
                    visible={this.state.timelineDlgVisible}
                    timelineObj={this.state.timelineObj}
                    onCancel={this.closeAllDlg}
                />

                <ProgsViewer
                    visible={this.state.progsDlgVisible}
                    progsObj={this.state.progsObj}
                    onCancel={this.closeAllDlg}
                />

                <GantDlg
                    visible={this.state.gantdlgVisible}
                    gantObj={this.state.gantObj}
                    onCancel={this.closeAllDlg}
                />
            </>
        );
    }
}


const mapState=(state)=>({
    hasPane:  state.tabs && state.tabs.panes && 0 < state.tabs.panes.length
});


export default connect(mapState)(MapsViewer);

