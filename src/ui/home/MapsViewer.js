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

import {createSelector} from 'reselect';


import Mindmap from './views/Mindmap';
import Welcome from './views/Welcome';
import PathSelect from './views/PathSelect';

import mindmapSvc from './mindmapSvc';
import mindMapValidateSvc from './mindMapValidateSvc';

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
        this.codeMirrorInst=null;

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
        window.addEventListener("resize",this.handleResize);
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

    onNewMapDlgCancel = () => {
        this.setState({
            newMapDlgVisible: false
        });
    }

    onChangeNewMapName = (e) => {
        this.setState({
            newMapName: e.target.value
        });
    }

    onNewMapDlgOK = () => {
        //验证名称为空和文件是否存在
        let name = this.state.newMapName.trim();
        if ('' === name) {
            message.warning('请输入图表名称');
            return;
        }
        let fnAndFullpath = api.exists(name);//如果存在返回true，如果不存在返回 [文件名, 全路径]
        if (true === fnAndFullpath) {
            message.warning('该图表名称已存在，请更换另一名称');
            return;
        }
        let [fn,themeName, fullpath] = fnAndFullpath;

        //保存文件
        let defMapTxt=getDefMapTxt(themeName);
        api.save(fullpath, defMapTxt);

        //计算导图表格信息并加入新tab      
        let cells = mindmapSvc.parseMindMapData(defMapTxt, defaultLineColor, themeStyles, bordType, getBorderStyle);
        let tabdata = this.state.panes;
        tabdata.push({
            title: fn,
            key: fullpath,
            mapTxts: defMapTxt,
            mapCells: cells
        });
        console.log("新的key",fullpath);

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

    onEditMapDlgCancel = () => {
        this.setState({
            editMapDlgVisible: false
        });
    }

    onChangeEditTmpTxt = (editor, data, value) => {
        this.setState({editTmpTxt:value});
    }

    /**
     * 绑定codemirror实例，用于处理插入颜色等功能，以后还会有其他相关功能
     */
    bindCodeMirrorInst=(editor)=>{
        this.codeMirrorInst = editor;
    }

    onAddColor=(color)=>{
        //获取当前光标位置与当前行内容
        let {line,ch}=this.codeMirrorInst.getCursor();
        let lineTxt=this.codeMirrorInst.getLine(line);
        
        //最终加入内容的行内位置和加入的内容
        let pos=-1;    
        let addStr="";

        //该行包含减号
        let ind=lineTxt.indexOf("-");
        let reg=/^\t*[-].*$/;
        if(0<=ind && reg.test(lineTxt)){
            //先假设插入位置是减号后面的位置
            pos=ind+1;
            addStr=" c:"+color+"|";//插入内容包含空格

            //如果减号后面有字符并且是空格，则插入位置往后移一位
            if(ind+1<lineTxt.length && ' '===lineTxt[ind+1]){
                ++pos;
                addStr=addStr.trim();//插入内容不包含空格
            }
        }
        //该行不包含减号
        else{
            //找到第一个非tab的字符作为插入位置
            pos=0;
            addStr="- c:"+color+"|";
            for(let i=0;i<lineTxt.length;++i){
                if('\t'!==lineTxt[i]){
                    break;
                }
                ++pos;
            }
        }

        //插入内容并设置光标位置
        this.codeMirrorInst.setCursor({line,ch:pos});
        this.codeMirrorInst.setSelection({line,ch:pos})
        this.codeMirrorInst.replaceSelection(addStr);
        this.codeMirrorInst.focus();
    }

    onEditMapDlgEscKey=(cm)=>{
        window.event.stopPropagation();
    }

    onEditMapDlgOK = () => {
        //校验
        let txt = this.state.editTmpTxt.trim();
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
        api.save(this.state.activeKey, txt);
        item = item[0]
        let cells = mindmapSvc.parseMindMapData(txt, defaultLineColor, themeStyles, bordType, getBorderStyle);
        item.mapTxts = txt;
        item.mapCells = cells;
        this.setState({
            panes: [...this.state.panes],
            editMapDlgVisible: false
        });
    }




    //------------选择文件功能----------------------------------------------------------------------
    onSelectMapItem = (item) => {
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
        let cells = mindmapSvc.parseMindMapData(origintxts, defaultLineColor, themeStyles, bordType, getBorderStyle);

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

    onSelMapDlgCancel = () => {
        this.setState({
            selMapDlgVisible: false
        });
    }



    //------------导图上切换展开状态----------------------------------------------------------------------
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



    render() {
        return (
            <>
                <Layout css={container}>
                    {
                        (null != this.state.panes && 0 < this.state.panes.length) ?
                            <>
                                <Header css={headerStyle}>
                                    <Button shape='circle' icon={<PlusOutlined />} className='toolbtn' type='primary' size='large' onClick={this.onShowNewMapDlg} title='新建' />
                                    <Button shape='circle' icon={<FolderOpenOutlined />} className='toolbtn' type='primary' size='large' onClick={this.showSelMapDlg} title='打开' />
                                    <Button shape='circle' icon={<EditOutlined />} className='toolbtn' type='primary' size='large' onClick={this.onShowEditMapDlg} title='编辑' />

                                    <Divider type="vertical" />
                                    <Button shape='circle' icon={<FolderOutlined />} className='toolbtn' type='primary' size='large' onClick={api.openMapsDir}  title='打开目录' />                                   
                                    <Button shape='circle' icon={<CodeOutlined />} className='toolbtn' type='primary' size='large' onClick={api.openBash}  title='打开命令行' />
                                </Header>
                                <Tabs
                                    hideAdd={true}
                                    type="editable-card"
                                    activeKey={this.state.activeKey}
                                    style={{ height: (this.state.clientH - 64) + 'px', 'backgroundColor': 'white' }}
                                    onChange={this.onChangeTab}
                                    onEdit={this.onEditTab}>
                                    {
                                        this.state.panes.map(pane => (
                                            <TabPane tab={pane.title} key={pane.key} closable={true}>
                                                <div style={{ height: (this.state.clientH - 64 - 55) + 'px',maxHeight: (this.state.clientH - 64 - 55) + 'px', ...tabContainerStyle }}>
                                                    <Mindmap cells={pane.mapCells} onToggleExpand={this.toggleExpand.bind(this, pane.key)} />
                                                </div>
                                            </TabPane>
                                        ))
                                    }
                                </Tabs>
                            </>

                            :

                            <Content>
                                <Welcome maxH={this.state.clientH} 
                                    dirs={this.state.dirs}
                                    filelist={this.state.filelist} 
                                    onOpenMapsDir={api.openMapsDir}
                                    onOpenBash={api.openBash}
                                    onAddMap={this.onShowNewMapDlg} 
                                    onSelectMapItem={this.onSelectMapItem}
                                    onloadDir={this.loadDir}
                                    onReloadCurrDir={this.loadDir.bind(this,selectCurrDir(this.state))} />
                            </Content>
                    }
                </Layout>

                <Modal
                    title="新建图表"
                    visible={this.state.newMapDlgVisible}
                    onOk={this.onNewMapDlgOK}
                    onCancel={this.onNewMapDlgCancel}>
                    <Input placeholder="请输入图表名称" value={this.state.newMapName} onChange={this.onChangeNewMapName} />
                </Modal>

                <Modal
                    title={"编辑图表 - " + this.state.currMapName}
                    style={{
                        width: (this.state.clientW - 400) + "px",
                        minWidth: (this.state.clientW - 400) + "px"
                    }}
                    maskClosable={false}
                    visible={this.state.editMapDlgVisible}
                    onOk={this.onEditMapDlgOK}
                    onCancel={this.onEditMapDlgCancel}>
                    <div>
                        <div style={{'marginBottom':"10px"}}>
                            {
                                ['#cf1322','#389e0d','#0050b3','#fa8c16','#13c2c2','#ad6800','#1890ff','#722ed1','#c41d7f'].map((eachcolor,colorInd)=>(
                                    <div key={colorInd} style={{...editDlgColorBoxStyle,'backgroundColor':eachcolor}} onClick={this.onAddColor.bind(this,eachcolor)}></div>
                                ))
                            }                                
                        </div>
                        <CodeMirror
                            css={getCodeEditorStyle(this.state.clientH - 400-50)}
                            editorDidMount={this.bindCodeMirrorInst}
                            value={this.state.editTmpTxt}
                            options={{
                                lineNumbers: true,
                                theme: 'default',
                                mode:   'markdown',
                                styleActiveLine: true,
                                indentWithTabs:true,
                                indentUnit:4,
                                keyMap: "sublime",
                                extraKeys:{
                                    "Ctrl-S":   this.onEditMapDlgOK,
                                    "Esc":      this.onEditMapDlgEscKey
                                }
                            }}
                            onBeforeChange={this.onChangeEditTmpTxt}/>
                    </div>
                </Modal>

                <Modal
                    title="打开图表"
                    visible={this.state.selMapDlgVisible}
                    footer={null}
                    onCancel={this.onSelMapDlgCancel}>
                        <PathSelect 
                            maxH={(this.state.clientH - 64-250)}
                            forceMaxH={true}
                            dirs={this.state.dirs} 
                            filelist={this.state.filelist}
                            onloadDir={this.loadDir}
                            onReloadCurrDir={this.loadDir.bind(this,selectCurrDir(this.state))}
                            onSelectMapItem={this.onSelectMapItem}/>
                </Modal>
            </>
        );
    }
}

const selectCurrDir=createSelector(
    state=>state.dirs,
    dirs=>{
        if(null==dirs || 0===dirs.length){
            return null;
        }
        return dirs.filter(dir=>dir.iscurr)[0].fullpath;
    }
);

const getCodeEditorStyle=(height)=>css`
    & .CodeMirror{
        border: 1px solid lightgrey; 
        font-size:16px;
        height:${height}px;
        max-height:${height}px;
        min-height:${height}px;
    }
`;

const editDlgColorBoxStyle={
    'width':'16px',
    'height':'16px',
    'display':'inline-block',
    'cursor':'pointer',
    'marginRight':'10px',
};

const getDefMapTxt=(theleName="中心主题") =>(
`- ${theleName}
\t- 分主题
\t- c:#1890ff|带颜色的分主题
\t- 带说明的分主题|m:balabala`
);


//background-color:#f0f2f5;
//background-color:#EEE;
const headerStyle = css`
    background-color:#f0f2f5;
    padding-left:0px;
    & .toolbtn{
      margin-left:20px;
    }
    & .divider{
      margin:0px;
      padding:0px;
    }
`;




const tabContainerStyle = {
    'overflowY': 'auto',
    'overflowX': 'auto',
    'width':'100%',
    'paddingBottom':'30px',
};

//background-color:white;  
const container = css`
    
`;

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
    if (bordType.l === type) {
        return css`border-left:2px solid ${color};`;
    }
    if (bordType.r === type) {
        return css`border-right:2px solid ${color};`;
    }
    if (bordType.t === type) {
        return css`border-top:2px solid ${color};`;
    }
    if (bordType.b === type) {
        return css`border-bottom:2px solid ${color};`;
    }

    if (bordType.rbRad === type) {

        return css`border-bottom-right-radius:14px;`;
    }
    if (bordType.lbRad === type) {
        return css`border-bottom-left-radius:14px;`;
    }
    if (bordType.rtRad === type) {
        return css`border-top-right-radius:14px !important;`;
    }
    if (bordType.ltRad === type) {
        return css`border-top-left-radius:14px;`;
    }
};


//#2db7f5
const centerThemeStyle = css`
    padding-top:0px;
    padding-bottom:0px;
    vertical-align:bottom;
    
    & span.themetxt{
        white-space:nowrap;
        display:inline-block;
        padding:4px 16px 4px 16px;
        background-color:#108ee9;
        border-radius:5px;
        color:white;
        font-size:18px;
        line-height:30px;
    }

    
`;

const secendThemeStyle = css`
    padding-top:12px;
    padding-bottom:0px;
    vertical-align:bottom;
    
    & span.themetxt{
        white-space:nowrap;
        display:inline-block;
        margin-bottom:0px;
        padding-bottom:0px;
        font-size:16px;
        line-height:20px;
        vertical-align:bottom;

        
    }

    & .btn{
        width:18px;
        height:18px;
        font-size:14px;
        line-height:16px;
        margin:0px;       
        margin-left:5px;
        margin-right:5px;
        padding:0px;
        vertical-align:bottom;
        margin-bottom:1px;
    }

    & .btn .icon{
        font-size:14px;
        line-height:18px;
        margin:0px;
        padding:0px;
    }
`;

const otherThemeStyle = css`
    padding-top:12px;
    padding-bottom:0px;
    vertical-align:bottom;
    
    & span.themetxt{
        white-space:nowrap;
        display:inline-block;
        margin-bottom:0px;
        padding-bottom:0px;
        
        
        
        font-size:14px;
        line-height:18px;
        vertical-align:bottom;
    }

    & .btn{
        width:18px;
        height:18px;
        font-size:14px;
        line-height:16px;
        margin:0px;
        
        margin-left:5px;
        margin-right:5px;
        padding:0px;
        vertical-align:bottom;
    }

    & .btn .icon{
        font-size:14px;
        line-height:18px;
        margin:0px;
        padding:0px;
    }
`;

const themeStyles=[centerThemeStyle, secendThemeStyle, otherThemeStyle];






export default MapsViewer;