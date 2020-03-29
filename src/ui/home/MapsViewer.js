/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider } from 'antd';
import { PlusOutlined, FolderOpenOutlined, EditOutlined, FolderOutlined,CodeOutlined } from '@ant-design/icons';
import {Controlled as CodeMirror} from 'react-codemirror2'

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/addon/selection/active-line';  
import 'codemirror/keymap/sublime';


import marked from 'marked';
import hljs from 'highlight.js';
// import 'highlight.js/styles/default.css';
import 'highlight.js/styles/atom-one-dark-reasonable.css';
import 'github-markdown-css/github-markdown.css';


import {createSelector} from 'reselect';


import Mindmap from './views/Mindmap';
import Welcome from './views/Welcome';
import PathSelect from './views/PathSelect';
import OpenGraphDlg from './views/OpenGraphDlg';
import NewGraphDlg from './views/NewGraphDlg';
import EditGraphDlg from './views/EditGraphDlg';
import Toolbar from './views/Toolbar';
import GraphTabs from './views/GraphTabs';
import RefViewer from './views/RefViewer';
import TimelineViewer from './views/TimelineViewer';
import ProgsViewer from './views/ProgsViewer';

import mindmapSvc from './mindmapSvc';
import mindMapValidateSvc from './mindMapValidateSvc';
import * as uiUtil from '../../common/uiUtil';

import api from '../api';


const { Header, Content } = Layout;
const { TabPane } = Tabs;


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
    constructor(props) {
        super(props);

        this.state = {
            //样式相关
            clientH: document.documentElement.clientHeight,
            clientW: document.documentElement.clientWidth,

            //选项卡
            activeKey: null,// panes[0].key,
            panes: [],

            //编辑图表相关
            currMapName: '',
            editTmpTxt: '',
            editMapDlgVisible: false,
            refViewerDlgVisible:false,
            timelineDlgVisible:false,
            progsDlgVisible:false,
            currRefObj:{},
            timelineObj:[],
            progsObj:[],

            //新建图表相关
            newMapDlgVisible: false,
            newMapName: '',

            //文件选项相关
            selMapDlgVisible: false,
            filelist: [],
            dirs:[],            
        };

        
    }

    


    componentDidMount() {
        document.querySelector("head > title").innerHTML=api.loadAppNameAndVersionTxt();
        window.addEventListener("resize",this.handleResize);

        //初始化markdown解析功能
        marked.setOptions({
            renderer: new marked.Renderer(),
            highlight: function(code, language) {
                let tmp=hljs.getLanguage(language);
                const validLanguage = tmp ? language : 'plaintext';
                return hljs.highlight(validLanguage, code).value;
            },
            pedantic: false,
            gfm: true,
            breaks: false,
            sanitize: false,
            smartLists: true,
            smartypants: false,
            xhtml: false
        });




        this.setState({
            filelist: api.list(),
            dirs:   api.getPathItems(),
        });
    }



    componentWillUnmount(){
        window.removeEventListener("resize",this.handleResize)
    }

    handleResize=()=>{
        this.setState({
            clientH: document.documentElement.clientHeight,
            clientW: document.documentElement.clientWidth
        });
    }

    componentDidUpdate(){
        setTimeout(this.bindLinkEvent, 100);//迟延一会等视图已加载完再处理（否则第一次显示看不到效果）
    }

    closeAllDlg=()=>{
        this.setState({
            editMapDlgVisible: false,
            refViewerDlgVisible:false,
            newMapDlgVisible: false,
            selMapDlgVisible: false,
            timelineDlgVisible:false,
            progsDlgVisible:false,
        });
    }

    

    



    //------------选项卡操作----------------------------------------------------------------------
    onChangeTab = (activeKey) => {
        this.setState({ activeKey });
    };

    onEditTab = (targetKey, action) => {
        if ("remove" === action) {
            this.removeTab(targetKey);
        }
    };

    removeTab = (targetKey) => {
        let { activeKey } = this.state;

        //计算要删除的选项卡前一位置
        let lastIndex = -1;
        this.state.panes.forEach((pane, i) => {
            if (pane.key === targetKey) {
                lastIndex = i - 1;
            }
        });

        //要删除以外的选项卡集合
        const panes = this.state.panes.filter(pane => pane.key !== targetKey);

        //要删除的是唯一一个选项卡
        if (0 === panes.length) {
            activeKey = null;
        }
        //要删除的项之外还有别的选项卡，并且要删除的是当前活动的选项卡
        else if (activeKey === targetKey) {
            activeKey = panes[lastIndex >= 0 ? lastIndex : 0].key;
        }
        //要删除的项之外还有别的选项卡，并且要删除的不是当前活动的选项卡，则不影响activeKey（即不需要改变）
        else {
            //activeKey不变
        }

        this.setState({ panes, activeKey });
    };



    //------------新建图表操作----------------------------------------------------------------------
    onShowNewMapDlg = () => {
        this.setState({
            newMapDlgVisible: true,
            newMapName: ''
        });
    }
    

    onNewMapDlgOK = () => {
        //验证名称为空和文件是否存在
        let name = this.state.newMapName.trim();
        if ('' === name) {
            message.warning('请输入图表名称');
            return;
        }
        let reg=/^[^ 　\\/\t\b\r\n]+([/][^ 　\\/\t\b\r\n]+)*$/;
        if(!reg.test(name)){
            message.warning('图表名称格式有误，请更换另一名称');
            return;
        }
        let fnAndFullpath = api.existsGraph(name);//如果存在返回true，如果不存在返回 [文件名, 全路径]
        if (true === fnAndFullpath) {
            message.warning('该图表名称已存在，请更换另一名称');
            return;
        }
        let [fn,themeName, fullpath] = fnAndFullpath;

        //保存文件
        let defMapTxt=getDefMapTxt(themeName);
        let ret=api.save(fullpath, defMapTxt);
        if(ret && false===ret.succ){
            message.error(ret.msg);
            return;
        }

        //计算导图表格信息并加入新tab      
        let cells = mindmapSvc.parseMindMapData(defMapTxt, defaultLineColor, themeStyles, bordType, getBorderStyle,defaultDateColor);
        let tabdata = this.state.panes;
        tabdata.push({
            title: fn,
            key: fullpath,
            mapTxts: defMapTxt,
            mapCells: cells
        });

        //保存状态
        this.setState({
            panes: [...tabdata],
            activeKey: fullpath,
            newMapDlgVisible: false,
            filelist: api.list(selectCurrDir(this.state))  //新建后应该重新加载文件列表
        });
    }


    //------------修改导图----------------------------------------------------------------------
    onShowEditMapDlg = () => {
        let item = this.state.panes.filter(pane => pane.key === this.state.activeKey);
        if (null == item || 0 === item.length) {
            return;
        }
        this.setState({
            editMapDlgVisible: true,
            editTmpTxt: item[0].mapTxts,
            currMapName: item[0].title
        });
    }

    

    onChangeEditTmpTxt = (editor, data, value) => {
        this.setState({editTmpTxt:value});
    }


    onEditMapDlgOK = () => {
        //校验
        let txt = this.state.editTmpTxt;
        let valiResult=mindMapValidateSvc.validate(txt);
        if(true!==valiResult){
            message.warning(valiResult);
            return;
        }

        //
        let item = this.state.panes.filter(pane => pane.key === this.state.activeKey);
        if (null == item || 0 === item.length) {
            return;
        }

        //保存并修改状态
        let ret=api.save(this.state.activeKey, txt);
        if(ret && false===ret.succ){
            message.error(ret.msg);
            return;
        }

        item = item[0]
        let cells = mindmapSvc.parseMindMapData(txt, defaultLineColor, themeStyles, bordType, getBorderStyle,defaultDateColor,false);
        item.mapTxts = txt;
        item.mapCells = cells;
        this.setState({
            panes: [...this.state.panes],
            editMapDlgVisible: false
        });
    }




    //------------选择文件功能----------------------------------------------------------------------
    onSelectMapItem = (item) => {
        //如果点击了目录，则显示目录下的内容
        if(!item.isfile){
            this.setState({
                filelist: api.list(item.fullpath),
                dirs:   api.getPathItems(item.fullpath),
            });
            return;
        }

        //如果选项卡中已经有该项，则激活该tab
        if (this.state.panes.some(pane => pane.key === item.fullpath)) {
            this.setState({
                activeKey: item.fullpath,
                selMapDlgVisible: false
            });
            return;
        }

        //加载文件内容并计算导图表格的数据
        let origintxts = api.load(item.fullpath);
        if(origintxts && false===origintxts.succ){
            message.error(origintxts.msg);
            return;
        }

        let cells = mindmapSvc.parseMindMapData(origintxts, defaultLineColor, themeStyles, bordType, getBorderStyle,defaultDateColor);

        //增加新选项卡并设置状态
        let tabdata = this.state.panes;
        tabdata.push({
            title: item.itemsName,// item.showname,
            key: item.fullpath,
            mapTxts: origintxts,
            mapCells: cells
        });
        this.setState({
            panes: [...tabdata],
            activeKey: item.fullpath,
            selMapDlgVisible: false
        });
    }

    loadDir=(dir)=>{
        this.setState({
            filelist: api.list(dir),
            dirs:   api.getPathItems(dir),
        });
    }

    showSelMapDlg = () => {
        this.setState({
            selMapDlgVisible: true
        });
    }

    



    //------------导图的操作----------------------------------------------------------------------
    /**
     * 导图上切换展开状态
     * @param {key}  当前激活的选项卡的key，也即为文件全路径
     * @param {cell} 切换展开状态的当前格数据
     */
    toggleExpand = (key, cell) => {
        this.state.panes.filter(eachPane => key === eachPane.key).forEach(eachPane => {
            eachPane.mapCells = mindmapSvc.toggleExpandNode(cell);
        });
        this.setState({
            panes: [...this.state.panes]
        });
    }

    openLink=(url)=>{
        api.openUrl(url);
    }

    expandAll=()=>{
        this.state.panes.filter(eachPane => this.state.activeKey === eachPane.key).forEach(eachPane => {
            eachPane.mapCells = mindmapSvc.expandAllNds(eachPane.mapCells);
        });
        this.setState({
            panes: [...this.state.panes]
        });
    }

    onShowTimeline=(timelineObj)=>{
        console.log("时间线",timelineObj);
        this.setState({
            timelineDlgVisible:true,
            timelineObj:timelineObj,
        });
    }

    onShowProgs=(progs)=>{
        this.setState({
            progsObj: progs,
            progsDlgVisible:true,
        });
    }

    openRef=(refObj)=>{
        //迟延到第一次查看时才解析
        if(null==refObj.parsedTxt){
            refObj.parsedTxt=marked(refObj.txt);
        }

        this.setState({
            currRefObj:{...refObj},
            refViewerDlgVisible:true,
        });
    }

    /**
     * markdown中的a标签和img标签的事件绑定
     */
    bindLinkEvent=()=>{
        //a标签禁用默认事件，改为点击后用默认浏览器打开
        document.querySelectorAll(".markdown-body a").forEach(ele=>{
            let addr=ele.getAttribute('href');
            if(addr.startsWith("javascript:")){return;}//跳过处理过的
            if(!mindmapSvc.hasUrlPrefix(addr)){addr="http://"+addr.trim();}//不带协议的加http前缀
            ele.href="javascript:void(0);";//禁用默认点击效果
            ele.addEventListener("click",()=>{this.openLink(addr);});//增加点击事件，点击时使用外部浏览器打开
        });

        //图片把原始地址修改为本地绝对路径url，并且增加点击事件，点击后用本地默认程序打开
        document.querySelectorAll(".markdown-body img").forEach(ele=>{
            let addr=ele.getAttribute('src');
            if(!(addr.startsWith("./") || addr.startsWith("../"))){return;}//跳过不是相对路径的
            let picurl=api.calcPicUrl(this.state.activeKey,addr);//使用图片的相对路径计算绝对路径，并生成file://协议的url
            // let randomPicurl=picurl+ "?gmaprand="+(new Date().getTime());//增加随机参数
            ele.src=picurl;//显示时使用带随机参数的路径，以防止浏览器的缓存不重新加载新图片
            ele.style.cursor='pointer';
            ele.style.display='block';
            ele.addEventListener("click",()=>{this.openLink(picurl);});//本地打开时使用不带随机参数的url
        });

        //代码段，样式兼容问题处理：
        //marked与highlight的兼容问题：
        //      marked不会在pre > code中加入hljs类（而highlight需要），需手动加上
        //github-markdown-css与highlight的兼容问题：
        //      github-markdown-css会设置背景，而hljs中的背景无法覆盖它，所以手动使用style设置（优先级最高），该值要与hljs的样式文件对应（更换样式文件时这里的值也要改）
        document.querySelectorAll(".markdown-body pre > code").forEach(ele=>{
            if(!ele.className.includes("hljs")){
                ele.className+=" hljs";
                ele.parentNode.style.backgroundColor=codeBg;//
            }
        });
    }

    



    render() {
        return (
            <>
                <Layout>
                    {
                        (null != this.state.panes && 0 < this.state.panes.length) ?
                            <>
                                <Toolbar
                                    showExpandAll={ifShowExpandAll(this.state)}
                                    onShowNewMapDlg={this.onShowNewMapDlg}
                                    onShowSelMapDlg={this.showSelMapDlg}
                                    onShowEditMapDlg={this.onShowEditMapDlg}
                                    onShowDir={api.openMapsDir}
                                    onShowCmd={api.openBash}
                                    onExpandAll={this.expandAll}
                                    onShowDevTool={api.showDevTool}
                                    onReloadApp={api.reloadAppPage}
                                />
                                <GraphTabs
                                    activeKey={this.state.activeKey}
                                    containerH={this.state.clientH - 64}
                                    contentH={this.state.clientH - 64 - 55}
                                    panes={this.state.panes}
                                    onChangeTab={this.onChangeTab}
                                    onEditTab={this.onEditTab}
                                    onToggleExpand={this.toggleExpand}
                                    onOpenLink={this.openLink}
                                    onOpenRef={this.openRef}
                                    onShowTimeline={this.onShowTimeline}
                                    onShowProgs={this.onShowProgs}
                                />
                            </>

                            :

                            <Content>
                                <Welcome maxH={this.state.clientH-160} 
                                    dirs={this.state.dirs}
                                    filelist={this.state.filelist} 
                                    onOpenMapsDir={api.openMapsDir}
                                    onOpenBash={api.openBash}
                                    onShowDevTool={api.showDevTool}
                                    onReloadApp={api.reloadAppPage}
                                    onAddMap={this.onShowNewMapDlg} 
                                    onSelectMapItem={this.onSelectMapItem}
                                    onloadDir={this.loadDir}
                                    onReloadCurrDir={this.loadDir.bind(this,selectCurrDir(this.state))} />
                            </Content>
                    }
                </Layout>

                <NewGraphDlg
                    visible={this.state.newMapDlgVisible}
                    newMapName={this.state.newMapName}
                    onOk={this.onNewMapDlgOK}
                    onCancel={this.closeAllDlg}
                    onChangeNewMapName={uiUtil.bindChangeEventToState.bind(this,this,'newMapName')}
                />
 
                <EditGraphDlg
                    visible={this.state.editMapDlgVisible}
                    currMapName={this.state.currMapName}
                    activeKey={this.state.activeKey}
                    dlgW={this.state.clientW - 200}
                    winW={this.state.clientW}
                    editorH={this.state.clientH - 350-50}
                    editTmpTxt={this.state.editTmpTxt}
                    onOk={this.onEditMapDlgOK}
                    onCancel={this.closeAllDlg}
                    onChangeEditTmpTxt={this.onChangeEditTmpTxt}
                />

                <OpenGraphDlg
                    visible={this.state.selMapDlgVisible}
                    itemsH={(this.state.clientH - 64-250)}
                    winW={this.state.clientW}
                    dirs={this.state.dirs} 
                    filelist={this.state.filelist}
                    onCancel={this.closeAllDlg}
                    onloadDir={this.loadDir}
                    onReloadCurrDir={this.loadDir.bind(this,selectCurrDir(this.state))}
                    onSelectMapItem={this.onSelectMapItem}
                />

                <RefViewer
                    refname={this.state.currRefObj.showname}
                    refCont={this.state.currRefObj.parsedTxt}
                    dlgW={this.state.clientW - 200}
                    bodyH={this.state.clientH - 300}
                    visible={this.state.refViewerDlgVisible}
                    onCancel={this.closeAllDlg}
                />

                <TimelineViewer
                    visible={this.state.timelineDlgVisible}
                    timelineObj={this.state.timelineObj}
                    bodyH={this.state.clientH - 300}
                    winW={this.state.clientW}
                    onCancel={this.closeAllDlg}
                /> 

                <ProgsViewer
                    visible={this.state.progsDlgVisible}
                    progsObj={this.state.progsObj}
                    bodyH={this.state.clientH - 300}
                    winW={this.state.clientW}
                    onCancel={this.closeAllDlg}
                />
            </>
        );
    }
}


const codeBg='rgba(40,44,52,1)'; //40 44 52  #282c34

const getDefMapTxt=(theleName="中心主题") =>(
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

const ifShowExpandAll=createSelector(
    state=>state.activeKey,
    state=>state.panes,
    (key,panes)=>{
        //不存选项卡或不存在活动选项卡，认为不显示【展开全部】按钮
        if(null==panes || 0===panes.length){
            return false;
        }
        let currPane=panes.filter(pane=>pane.key===key);
        if(null==currPane || 0===currPane.length){
            return false;
        }
        currPane=currPane[0];

        if(currPane.mapCells && false===currPane.mapCells.succ){
            return false;
        }

        //计算当前选项卡是否全部展开，若不是则显示【展开全部】按钮
        let allExpand=mindmapSvc.isAllNodeExpand(currPane.mapCells);
        return !allExpand;
    }
);

const selectCurrDir=createSelector(
    state=>state.dirs,
    dirs=>{
        if(null==dirs || 0===dirs.length){
            return null;
        }
        return dirs.filter(dir=>dir.iscurr)[0].fullpath;
    }
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
    let radius=14;

    //边框样式
    if (bordType.l === type) {return {borderLeft:`2px solid ${color}`};}
    if (bordType.r === type) {return {borderRight:`2px solid ${color}`};}
    if (bordType.t === type) {return {borderTop:`2px solid ${color}`};}
    if (bordType.b === type) {return {borderBottom:`2px solid ${color}`};}

    //圆角样式
    if (bordType.rbRad === type) {return {borderBottomRightRadius:radius};}
    if (bordType.lbRad === type) {return {borderBottomLeftRadius:radius};}
    if (bordType.rtRad === type) {return {borderTopRightRadius:radius};}
    if (bordType.ltRad === type) {return {borderTopLeftRadius:radius};}
};

const defaultDateColor = {
    expired:'#f5222d',//red', //过期
    near:'#fa8c16',//'orange',    //近几天
    future:'#389e0d',//'#73d13d',//'green'   //以后
};

//#2db7f5
const centerThemeStyle = {
    paddingTop:0,
    paddingBottom:0,
    verticalAlign:'bottom',
    
    '& span.themetxt':{
        whiteSpace:'nowrap',
        display:'inline-block',
        padding:'0px 0px  0px 0px',
        verticalAlign:'bottom',
        fontSize:16,
    },

    '& span.themetxt .themename':{
        color:'white',
        backgroundColor:'#108ee9',
        borderRadius:5,
        fontSize:18,
        lineHeight:'20px',
        padding:'8px 16px',
        whiteSpace:'nowrap',
        display:'inline-block',
        marginLeft:3,
        marginRight:3,
    },
};

const secendThemeStyle = {
    paddingTop:12,
    paddingBottom:0,
    verticalAlign:'bottom',

    '& span.themetxt':{
        // paddingRight:5,
        whiteSpace:'nowrap',
        display:'inline-block',
        marginBottom:0,
        paddingBottom:0,
        fontSize:16,
        lineHeight:'20px',
        verticalAlign:'bottom',
    },

    '& span.themetxt .themename':{
        whiteSpace:'nowrap',
        display:'inline-block',
    },
};

const otherThemeStyle = {
    paddingTop:12,
    paddingBottom:0,
    verticalAlign:'bottom',
    
    '& span.themetxt':{
        whiteSpace:'nowrap',
        display:'inline-block',
        marginBottom:0,
        paddingBottom:0,
        fontSize:14,
        lineHeight:'18px',
        verticalAlign:'bottom',
    },

    '& span.themetxt .themename':{
        whiteSpace:'nowrap',
        display:'inline-block',
        
    },
};

const themeStyles=[centerThemeStyle, secendThemeStyle, otherThemeStyle];



export default MapsViewer;