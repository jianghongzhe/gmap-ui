/** @jsxImportSource @emotion/react */
import React from 'react';
import { Layout,   Button, Divider,Tooltip } from 'antd';
import { PlusOutlined, FolderOpenOutlined, EditOutlined,LinkOutlined, FolderOutlined,CodeOutlined,CompressOutlined,ExpandOutlined,HistoryOutlined,FilePdfOutlined,ControlOutlined,ReloadOutlined,FileImageOutlined,FileMarkdownOutlined,Html5Outlined,CloudSyncOutlined,FileWordOutlined,CameraOutlined } from '@ant-design/icons';
import { tabCurrPaneAllNodesExpand, tabCurrPaneExpandStateChanged} from '../../../store/tabs';
import {useRecoilValue} from 'recoil';
import { useExpandAll, useRestoreDefaultExpandState } from '../../../hooks/tabs';

const { Header } = Layout;

/**
 * 工具栏
 * @param {*} props 
 */
const Toolbar=(props)=>{
    const allNodesExpand= useRecoilValue(tabCurrPaneAllNodesExpand);
    const expStateChanged=useRecoilValue(tabCurrPaneExpandStateChanged);
    const expandAll= useExpandAll();
    const restoreDefaultExpandState= useRestoreDefaultExpandState();
    


    
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
            <ToolbarItem title='恢复节点默认状态' disabled={!expStateChanged} icon={<CompressOutlined />} onClick={restoreDefaultExpandState}/>
            <ToolbarItem title='展开全部节点' disabled={allNodesExpand} icon={<ExpandOutlined />} onClick={expandAll}/>
                      
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