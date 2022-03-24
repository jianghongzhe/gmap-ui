/** @jsxImportSource @emotion/react */
import React, { useCallback, useMemo } from 'react';
import { Layout,   Button, Divider,Tooltip } from 'antd';
import { PlusOutlined, FolderOpenOutlined, EditOutlined,LinkOutlined, FolderOutlined,CodeOutlined,CompressOutlined,ExpandOutlined,HistoryOutlined,FilePdfOutlined,ControlOutlined,ReloadOutlined,FileImageOutlined,FileMarkdownOutlined,Html5Outlined,CloudSyncOutlined,FileWordOutlined,CameraOutlined } from '@ant-design/icons';
import newMindmapSvc from '../../../service/newMindmapSvc';
import {dispatcher} from '../../../common/gflow';
import { useSelector } from 'react-redux';


const { Header } = Layout;

/**
 * 工具栏
 * @param {*} props 
 */
const Toolbar=(props)=>{
    const {activeKey,panes}=useSelector((state)=>({
        activeKey:  state.tabs.activeKey,
        panes:      state.tabs.panes,
    }));

    const ifHasValidTab =useCallback(() => {
        //不存选项卡或不存在活动选项卡，认为不显示按钮
        if (null == panes || 0 === panes.length) {
            return false;
        }
        let currPane = panes.filter(pane => pane.key === activeKey);
        if (null == currPane || 0 === currPane.length) {
            return false;
        }
        currPane = currPane[0];
    
        //当前选项卡内容解析失败
        if (currPane.ds && false === currPane.ds.succ) {
            return false;
        }
        return currPane;
    },[activeKey,panes]);


    let showExpandAll=useMemo(()=>{
        let currPane = ifHasValidTab();
        if (false === currPane) {
            return false;
        }
        //计算当前选项卡是否全部展开，若不是则显示【展开全部】按钮
        let allExpand = newMindmapSvc.isAllNodeExpand(currPane.ds);
        return !allExpand;
    },[ifHasValidTab]);


    let showRestore=useMemo(()=>{
        let currPane = ifHasValidTab();
        if (false === currPane) {
            return false;
        }
        //计算当前选项卡是否有展开状态变化的节点
        let anyChanged = newMindmapSvc.isAnyNdExpStChanged(currPane.ds);
        return anyChanged;
    },[ifHasValidTab]);


    
    return (
        <Header css={headerStyle}>
            <ToolbarItem title='新建' icon={<PlusOutlined />} className='toolbtnFirst' onClick={props.onShowNewMapDlg}/>
            <ToolbarItem title='打开' icon={<FolderOpenOutlined />} onClick={props.onShowSelMapDlg}/>           

            <Divider type="vertical" className='divider'/>
            <ToolbarItem title='打开目录' icon={<FolderOutlined />} onClick={props.onShowDir}/>
            <ToolbarItem title='打开控制台' icon={<CodeOutlined />} onClick={props.onShowCmd}/>
            <ToolbarItem title='开发者工具' icon={<ControlOutlined />} onClick={props.onShowDevTool}/>
            <ToolbarItem title='重新载入应用' icon={<ReloadOutlined />} onClick={props.onReloadApp}/>
            <ToolbarItem title='版本发布说明' icon={<HistoryOutlined />} onClick={props.openReleaseNote}/>
            <ToolbarItem title='检查更新' icon={<CloudSyncOutlined />} onClick={props.onCheckUpdate}/>
            
            <Divider type="vertical" className='divider'/>
            <ToolbarItem title='编辑' icon={<EditOutlined />} onClick={props.onShowEditMapDlg}/>
            <ToolbarItem title='复制导图链接' icon={<LinkOutlined />} onClick={props.onCopyMapLink}/>
            <ToolbarItem title='恢复节点默认状态' disabled={!showRestore} icon={<CompressOutlined />} onClick={dispatcher.tabs.restoreAll}/>
            <ToolbarItem title='展开全部节点' disabled={!showExpandAll} icon={<ExpandOutlined />} onClick={dispatcher.tabs.expandAll}/>
                      
            <Divider type="vertical" className='divider'/>
            <ToolbarItem title='滚动截屏' icon={<CameraOutlined />} onClick={props.onScreenShot}/>
            <ToolbarItem title='导出图片' icon={<FileImageOutlined />} onClick={props.onExpImage}/>
            <ToolbarItem title='导出pdf' icon={<FilePdfOutlined />} onClick={props.onExpPdf}/>
            <ToolbarItem title='导出word' icon={<FileWordOutlined />} onClick={props.onExpWord}/>
            <ToolbarItem title='导出markdown' icon={<FileMarkdownOutlined />} onClick={props.onExpMarkdown}/>
            <ToolbarItem title='导出html' icon={<Html5Outlined />} onClick={props.onExpHtml}/>
        </Header>
    );
    
}

const ToolbarItem=({title, icon, disabled=false, className='toolbtn', onClick})=>{
    return <Tooltip color='cyan' placement="bottomLeft" title={title}>
        <Button shape='circle' icon={icon} className={className} disabled={disabled} type='default' size='large' onClick={onClick} />
    </Tooltip>;
};




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