/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { Component } from 'react';
import { Layout, Menu, Breadcrumb, Tabs, Modal, Input, message, Button, Divider, Row, Col, List, Avatar } from 'antd';
import { PlusOutlined, FolderOpenOutlined, EditOutlined, MacCommandOutlined, FileMarkdownOutlined } from '@ant-design/icons';



import Mindmap from './Mindmap';
import Welcome from './Welcome';

import mindmapSvc from './mindmapSvc';
import * as tabIndentUtil from './tabIndentUtil';
import api from './api';

const { SubMenu } = Menu;
const { Header, Content, Footer, Sider } = Layout;
const { TextArea } = Input;

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
class MapsViewer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            //样式相关
            clientH: document.documentElement.clientHeight,
            clientW: document.documentElement.clientWidth,

            mapTxtarea: null,
            editTmpTxt: '',
            editMapDlgVisible: false,
            newMapDlgVisible: false,
            selMapDlgVisible: false,
            newMapName: '',
            activeKey: null,// panes[0].key,
            panes: [],
            filelist: [],
            currMapName: '',
        };
    }


    componentDidMount() {
        this.setState({
            filelist: api.list()
        });
        window.onresize = () => {
            this.setState({
                clientH: document.documentElement.clientHeight,
                clientW: document.documentElement.clientWidth
            });
        };
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
        let [fn, fullpath] = fnAndFullpath;

        //保存文件
        api.save(fullpath, defMapTxt);

        //计算导图表格信息并加入新tab      
        let cells = mindmapSvc.parseMindMapData(defMapTxt, defaultLineColor, centerThemeStyle, bordType, getBorderStyle);
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
            filelist: api.list()  //新建后应该重新加载文件列表
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

    onChangeEditTmpTxt = (e) => {
        this.setState({
            editTmpTxt: e.target.value
        });
    }

    setMapTxtareaControl = (control) => {
        this.mapTxtarea = control.resizableTextArea.textArea;//找到实际的html textarea元素，不稳定
    }

    /**
     * 处理编辑框中tab键
     */
    editTmpTxtKeyDown = (e) => {
        let result = tabIndentUtil.onEvent(e, e.target.value, e.target.selectionStart, e.target.selectionEnd);
        if (false === result) {
            return;
        }

        //设置状态并更新光标位置。由于setState为异步执行，设置光标位置时应该延迟一会。否则设置光标会先执行，setState会后执行，执行完光标会移到末尾位置。
        let [newVal, newStart, newEnd] = result;
        this.setState({
            editTmpTxt: newVal
        });
        setTimeout(() => {
            this.mapTxtarea.selectionStart = newStart;
            this.mapTxtarea.selectionEnd = newEnd;
        }, 80);


        // if (9 === e.keyCode) {
        //     e.preventDefault();
        //     e.stopPropagation();

        //     //在当票处加入制表符
        //     let val = e.target.value;
        //     let ind = e.target.selectionStart;
        //     let left = (0 === ind ? "" : val.substring(0, ind));
        //     let right = (ind === val.length - 1 ? "" : val.substring(ind));
        //     let newVal = left + "\t" + right;

        //     //触发状态改变
        //     this.setState({
        //         editTmpTxt: newVal
        //     });

            
        // }
    }

    onEditMapDlgOK = () => {
        let txt = this.state.editTmpTxt.trim();
        if ('' === txt) {
            message.warning('请输入图表内容');
            return;
        }

        let item = this.state.panes.filter(pane => pane.key === this.state.activeKey);
        if (null == item || 0 === item.length) {
            return;
        }

        //保存并修改状态
        api.save(this.state.activeKey, txt);
        item = item[0]
        let cells = mindmapSvc.parseMindMapData(txt, defaultLineColor, centerThemeStyle, bordType, getBorderStyle);
        item.mapTxts = txt;
        item.mapCells = cells;
        this.setState({
            panes: [...this.state.panes],
            editMapDlgVisible: false
        });
    }




    //------------选择文件功能----------------------------------------------------------------------
    onSelectMapItem = (item) => {
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
        let cells = mindmapSvc.parseMindMapData(origintxts, defaultLineColor, centerThemeStyle, bordType, getBorderStyle);

        //增加新选项卡并设置状态
        let tabdata = this.state.panes;
        tabdata.push({
            title: item.showname,
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
                                    {/* <Button shape='circle' icon={<MacCommandOutlined />} className='toolbtn' type='primary' size='large'   title='命令行' /> */}
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
                                                <div style={{ height: (this.state.clientH - 64 - 55) + 'px', ...tabContainerStyle }}>
                                                    <Mindmap cells={pane.mapCells} onToggleExpand={this.toggleExpand.bind(this, pane.key)} />
                                                </div>
                                            </TabPane>
                                        ))
                                    }
                                </Tabs>
                            </>

                            :

                            <Content>
                                <Welcome filelist={this.state.filelist} onAddMap={this.onShowNewMapDlg} onSelectMapItem={this.onSelectMapItem} />
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
                    <TextArea ref={this.setMapTxtareaControl} rows={25} value={this.state.editTmpTxt} onChange={this.onChangeEditTmpTxt} onKeyDown={this.editTmpTxtKeyDown} />
                </Modal>
                <Modal
                    title="打开图表"
                    visible={this.state.selMapDlgVisible}
                    footer={null}
                    onCancel={this.onSelMapDlgCancel}>
                    <List
                        itemLayout="horizontal"
                        dataSource={this.state.filelist}
                        renderItem={item => (
                            <List.Item>
                                <List.Item.Meta onClick={this.onSelectMapItem.bind(this, item)}
                                    avatar={<Avatar icon={<FileMarkdownOutlined />} style={{ backgroundColor: '#40a9ff' }} />}
                                    title={item.showname}
                                    description={item.size} />
                            </List.Item>
                        )}
                    />
                </Modal>
            </>
        );
    }
}

const defMapTxt = "" +
    "- 中心主题\n" +
    "\t- 分主题\n" +
    "\t- 带说明的分主题|m:balabala";


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
    'paddingBottom': '40px',
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
    vertical-align:center !important;
    
    & span.themetxt{
        display:inline-block;
        padding:6px 20px 6px 20px;
        background-color:#108ee9;
        border-radius:5px;
        color:white;
        font-size:18px !important;
    }
`;






export default MapsViewer;