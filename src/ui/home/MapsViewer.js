/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout, message } from 'antd';

import marked from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark-reasonable.css';
import 'github-markdown-css/github-markdown.css';


import { createSelector } from 'reselect';


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

import mindmapSvc from './mindmapSvc';
import newMindmapSvc from './newMindmapSvc';
import mindMapValidateSvc from './mindMapValidateSvc';
import * as uiUtil from '../../common/uiUtil';
import MarkedHighlightUtil from '../../common/MarkedHighlightUtil';
import {connect} from '../../common/gflow';

import api from '../api';


const { Content } = Layout;
const markedHighlightUtil = new MarkedHighlightUtil();

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

            //选项卡
            loading: false,

            //编辑图表相关
            currMapName: '',
            editTmpTxt: '',
            editMapDlgVisible: false,
            refViewerDlgVisible: false,
            timelineDlgVisible: false,
            progsDlgVisible: false,
            currRefObj: {},
            timelineObj: [],
            progsObj: [],

            //新建图表相关
            newMapDlgVisible: false,
            newMapName: '',

            //文件选项相关
            selMapDlgVisible: false,
            

            //
            gantdlgVisible: false,
            gantObj:null,
        };

        

    }




    componentDidMount() {
        document.querySelector("head > title").innerHTML = api.loadAppNameAndVersionTxt();

        //初始化marked与hljs
        markedHighlightUtil.init(marked, hljs, {
            codeConfig: {
                bg: codeBg
            },
            linkConfig: {
                disableDefault: true,
                convertUrl: (oldurl) => {
                    let addr = oldurl;
                    if (!mindmapSvc.hasUrlPrefix(addr)) { addr = "http://" + addr.trim(); }//不带协议的加http前缀
                    return addr;
                }
            },
            imgConfig: {
                convertUrl: (oldurl) => {
                    if (!(oldurl.startsWith("./") || oldurl.startsWith("../"))) { return oldurl; }//跳过不是本地相对路径的
                    return api.calcPicUrl(this.props.activeKey, oldurl);
                }
            }
        });

        
        this.props.dispatcher.filesel.load();
    }



    

    

    componentDidUpdate(prevProps, prevState) {
        setTimeout(() => {
            markedHighlightUtil.bindLinkClickEvent(this.openLink);
            markedHighlightUtil.bindImgClickEvent(this.openLink);
        }, 100);//迟延一会等视图已加载完再处理（否则第一次显示看不到效果）
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
        console.log("show gant",gantObj);

        this.setState({
            gantdlgVisible: true,
            gantObj,
        });
    }

    openRef = (refObj) => {
        //迟延到第一次查看时才解析
        if (null == refObj.parsedTxt) {
            refObj.parsedTxt = marked(refObj.txt);
        }

        this.setState({
            currRefObj: { ...refObj },
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
                                    loading={this.state.loading}
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
                    refname={this.state.currRefObj.showname}
                    refCont={this.state.currRefObj.parsedTxt}
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


const codeBg = 'rgba(40,44,52,1)'; //40 44 52  #282c34

const getDefMapTxt = (theleName = "中心主题") => (
    `- ${theleName}
\t- 分主题
\t- c:#1890ff|带颜色的分主题
\t- 带说明的分主题|m:balabala
\t- 带链接的分主题|www.sina.com
\t- 带链接的另一分主题|[新浪网](www.sina.com)
\t- 带引用的分主题|ref:长段文字

***
# ref:长段文字
这里可以放长段内容，支持markdown格式
`
);








const defaultLineColor = 'lightgrey';

//边框类型枚举
const bordType = {
    l: 1,
    r: 2,
    t: 4,
    b: 8,
    rbRad: 16,
    lbRad: 32,
    rtRad: 64,
    ltRad: 128,
};

//根据边框类型动态生成对应的样式
const getBorderStyle = (type, color = 'lightgrey') => {
    let radius = 14;

    //边框样式
    if (bordType.l === type) { return { borderLeft: `2px solid ${color}` }; }
    if (bordType.r === type) { return { borderRight: `2px solid ${color}` }; }
    if (bordType.t === type) { return { borderTop: `2px solid ${color}` }; }
    if (bordType.b === type) { return { borderBottom: `2px solid ${color}` }; }

    //圆角样式
    if (bordType.rbRad === type) { return { borderBottomRightRadius: radius }; }
    if (bordType.lbRad === type) { return { borderBottomLeftRadius: radius }; }
    if (bordType.rtRad === type) { return { borderTopRightRadius: radius }; }
    if (bordType.ltRad === type) { return { borderTopLeftRadius: radius }; }
};

const defaultDateColor = {
    expired: '#f5222d',//red', //过期
    near: '#fa8c16',//'orange',    //近几天
    future: '#389e0d',//'#73d13d',//'green'   //以后
};

//#2db7f5
const centerThemeStyle = {
    paddingTop: 0,
    paddingBottom: 0,
    verticalAlign: 'bottom',

    '& span.themetxt': {
        whiteSpace: 'nowrap',
        display: 'inline-block',
        padding: '0px 0px  0px 0px',
        verticalAlign: 'bottom',
        fontSize: 16,
    },

    '& span.themetxt .themename': {
        color: 'white',
        backgroundColor: '#108ee9',
        borderRadius: 5,
        fontSize: 18,
        lineHeight: '20px',
        padding: '8px 16px',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        marginLeft: 3,
        marginRight: 3,
    },
};

const secendThemeStyle = {
    paddingTop: 12,
    paddingBottom: 0,
    verticalAlign: 'bottom',

    '& span.themetxt': {
        // paddingRight:5,
        whiteSpace: 'nowrap',
        display: 'inline-block',
        marginBottom: 0,
        paddingBottom: 0,
        fontSize: 16,
        lineHeight: '20px',
        verticalAlign: 'bottom',
    },

    '& span.themetxt .themename': {
        whiteSpace: 'nowrap',
        display: 'inline-block',
    },
};

const otherThemeStyle = {
    paddingTop: 12,
    paddingBottom: 0,
    verticalAlign: 'bottom',

    '& span.themetxt': {
        whiteSpace: 'nowrap',
        display: 'inline-block',
        marginBottom: 0,
        paddingBottom: 0,
        fontSize: 14,
        lineHeight: '18px',
        verticalAlign: 'bottom',
    },

    '& span.themetxt .themename': {
        whiteSpace: 'nowrap',
        display: 'inline-block',

    },
};

const themeStyles = [centerThemeStyle, secendThemeStyle, otherThemeStyle];

const mapState=(state)=>({
    hasPane:  state.tabs && state.tabs.panes && 0 < state.tabs.panes.length
});


export default connect(mapState)(MapsViewer);

