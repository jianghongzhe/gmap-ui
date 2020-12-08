/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Button, Divider } from 'antd';
import { PlusOutlined, FolderOpenOutlined, EditOutlined, FolderOutlined,ExportOutlined,CodeOutlined,CompressOutlined,ExpandOutlined,ControlOutlined,ReloadOutlined } from '@ant-design/icons';
import {createSelector} from 'reselect';
import newMindmapSvc from '../../../service/newMindmapSvc';
import {connect,dispatcher} from '../../../common/gflow';
import { useSelector } from 'react-redux';

const { Header, Content } = Layout;

/**
 * 工具栏
 * @param {*} props 
 */
const Toolbar=(props)=>{
    const {activeKey,panes}=useSelector((state)=>({
        activeKey:  state.tabs.activeKey,
        panes:      state.tabs.panes,
    }));
    const tmp={activeKey,panes};
    let showExpandAll=ifShowExpandAll(tmp);
    let showRestore=isShowRestore(tmp);

    return (
        <Header css={headerStyle}>
            <Button shape='circle' icon={<PlusOutlined />} className='toolbtnFirst' type='default' size='large' onClick={props.onShowNewMapDlg} title='新建' />
            <Button shape='circle' icon={<FolderOpenOutlined />} className='toolbtn' type='default' size='large' onClick={props.onShowSelMapDlg} title='打开' />

            <Divider type="vertical" className='divider'/>
            <Button shape='circle' icon={<FolderOutlined />} className='toolbtn' type='default' size='large' onClick={props.onShowDir}  title='打开目录' />                                   
            <Button shape='circle' icon={<CodeOutlined />} className='toolbtn' type='default' size='large' onClick={props.onShowCmd}  title='打开控制台' />
            <Button shape='circle' icon={<ControlOutlined />} className='toolbtn' type='default' size='large' onClick={props.onShowDevTool}  title='开发者工具' />
            <Button shape='circle' icon={<ReloadOutlined />} className='toolbtn' type='default' size='large' onClick={props.onReloadApp}  title='重新载入应用' />

            <Divider type="vertical" className='divider'/>
            <Button shape='circle' icon={<EditOutlined />} className='toolbtn' type='default' size='large' onClick={props.onShowEditMapDlg} title='编辑' />
            
            {/* {
                props.showRestore &&      
                    <Button shape='circle' icon={<CompressOutlined />} className='toolbtn' type='primary' size='large' onClick={props.onRestore} title='恢复默认节点状态' />
            }
            {
                props.showExpandAll &&      
                    <Button shape='circle' icon={<ExpandOutlined />} className='toolbtn' type='primary' size='large' onClick={props.onExpandAll} title='展开全部节点' />
            } */}
            

                
            <Button shape='circle' icon={<CompressOutlined />} disabled={!showRestore} className='toolbtn' type='primary' size='large' onClick={dispatcher.tabs.restoreAll} title='恢复节点默认状态' />
            <Button shape='circle' icon={<ExpandOutlined />} disabled={!showExpandAll} className='toolbtn' type='primary' size='large' onClick={dispatcher.tabs.expandAll} title='展开全部节点' />
            <Button shape='circle' icon={<ExportOutlined />} className='toolbtn' type='default' size='large' onClick={props.onExpImage} title='导出图片' />
            
            

            
        </Header>
    );
    
}


const ifShowExpandAll = createSelector(
    props => props.activeKey,
    props => props.panes,
    (key, panes) => {
        let currPane = ifHasValidTab(key, panes);
        if (false === currPane) {
            return false;
        }

        //计算当前选项卡是否全部展开，若不是则显示【展开全部】按钮
        let allExpand = newMindmapSvc.isAllNodeExpand(currPane.ds);
        return !allExpand;
    }
);

const isShowRestore = createSelector(
    props => props.activeKey,
    props => props.panes,
    (key, panes) => {
        let currPane = ifHasValidTab(key, panes);
        if (false === currPane) {
            return false;
        }

        //计算当前选项卡是否有展开状态变化的节点
        let anyChanged = newMindmapSvc.isAnyNdExpStChanged(currPane.ds);
        return anyChanged;
    }
);

const ifHasValidTab = (key, panes) => {
    //不存选项卡或不存在活动选项卡，认为不显示按钮
    if (null == panes || 0 === panes.length) {
        return false;
    }
    let currPane = panes.filter(pane => pane.key === key);
    if (null == currPane || 0 === currPane.length) {
        return false;
    }
    currPane = currPane[0];

    //当前选项卡内容解析失败
    if (currPane.ds && false === currPane.ds.succ) {
        return false;
    }
    return currPane;
}

//#f0f2f5
const headerStyle = {
    backgroundColor:    '#f0f2f5',
    paddingLeft:        0,
    '& .toolbtn':       {
        marginLeft:     10
    },
    '& .toolbtnFirst':       {
        marginLeft:     15
    },
    '& .divider':{
        backgroundColor:'#CCC',
        height:'50%',
        width:2, 
        padding:0,
        marginLeft:10,
        marginRight:0
    }
};

export default React.memo(Toolbar);