import React, {useMemo} from 'react';
import {Avatar, Button, Divider, Layout, Tooltip, Typography, Modal} from 'antd';
import {
    CameraOutlined,
    CloudSyncOutlined,
    CodeOutlined,
    CompressOutlined,
    ControlOutlined,
    EditOutlined,
    ExpandOutlined,
    FileImageOutlined,
    FileMarkdownOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FolderOpenOutlined,
    FolderOutlined,
    HistoryOutlined,
    Html5Outlined,
    LinkOutlined,
    PlusOutlined,
    QuestionOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import {tabCurrPane, tabCurrPaneAllNodesExpand, tabCurrPaneExpandStateChanged} from '../../../store/tabs';
import {useRecoilValue} from 'recoil';
import {useExpandAll, useRestoreDefaultExpandState} from '../../../hooks/tabs';
import api from '../../../service/api';
import {useLoadIcon} from "../../../hooks/loadIcon";
import {filterShortCuts} from "../../../service/linkFilter";


const { Header } = Layout;
const {  Text } = Typography;


/**
 * 工具栏
 * @param {*} props 
 */
const Toolbar=({
        onShowNewMapDlg, 
        onShowSelMapDlg, 
        onShowDir, 
        onShowCmd, 
        onShowDevTool, 
        onReloadApp, 
        onShowEditMapDlg, 
        onCopyMapLink, 
        onScreenShot,
        onExpImage,
        onExpPdf,
        onExpWord,
        onExpMarkdown,
        onExpHtml,
        onCheckUpdate,
        onOpenHelpDlg,
        onOpenLink})=>{

    const allNodesExpand= useRecoilValue(tabCurrPaneAllNodesExpand);
    const expStateChanged=useRecoilValue(tabCurrPaneExpandStateChanged);
    const expandAll= useExpandAll();
    const restoreDefaultExpandState= useRestoreDefaultExpandState();
    const currPane= useRecoilValue(tabCurrPane);

    /**
     * 有效的快捷方式：
     * 是单个链接，则直接保留
     * 是一组链接，去掉其中带有插值表达式的项，如果还有其余的项，则把这些项保留
     * @type {unknown}
     */
    const validShortCuts=useMemo(()=>filterShortCuts(currPane?.ds?.tree?.shortcuts),[currPane]);


    return (
        <Header css={headerStyle}>
            <ToolbarItem title='新建' icon={<PlusOutlined />} className='toolbtnFirst' onClick={onShowNewMapDlg}/>
            <ToolbarItem title='打开' icon={<FolderOpenOutlined />} onClick={onShowSelMapDlg}/>           

            <Divider type="vertical" className='divider'/>
            <ToolbarItem title='打开目录' icon={<FolderOutlined />} onClick={onShowDir}/>
            <ToolbarItem title='打开控制台' icon={<CodeOutlined />} onClick={onShowCmd}/>
            <ToolbarItem title='开发者工具' icon={<ControlOutlined />} onClick={onShowDevTool}/>
            <ToolbarItem title='重新载入应用' icon={<ReloadOutlined />} onClick={onReloadApp}/>
            
            
            <Divider type="vertical" className='divider'/>
            <ToolbarItem title='编辑' icon={<EditOutlined />} onClick={onShowEditMapDlg}/>
            <ToolbarItem title='复制导图链接' icon={<LinkOutlined />} onClick={onCopyMapLink}/>
            <ToolbarItem title='恢复节点默认状态' disabled={!expStateChanged} type="primary" icon={<CompressOutlined />} onClick={restoreDefaultExpandState}/>
            <ToolbarItem title='展开全部节点' disabled={allNodesExpand} type="primary" icon={<ExpandOutlined />} onClick={expandAll}/>
                      


            <Divider type="vertical" className='divider'/>
            <ToolbarItem title='滚动截屏' icon={<CameraOutlined />} onClick={onScreenShot}/>
            <ToolbarItem title='导出图片' icon={<FileImageOutlined />} onClick={onExpImage}/>
            <ToolbarItem title='导出pdf' icon={<FilePdfOutlined />} onClick={onExpPdf}/>
            <ToolbarItem title='导出word' icon={<FileWordOutlined />} onClick={onExpWord}/>
            <ToolbarItem title='导出markdown' icon={<FileMarkdownOutlined />} onClick={onExpMarkdown}/>
            <ToolbarItem title='导出html' icon={<Html5Outlined />} onClick={onExpHtml}/>

            <Divider type="vertical" className='divider'/>
            <ToolbarItem title='版本发布说明' icon={<HistoryOutlined />} onClick={api.openReleaseNote}/>
            <ToolbarItem title='检查更新' icon={<CloudSyncOutlined />} onClick={onCheckUpdate}/>
            <ToolbarItem title='帮助' icon={<QuestionOutlined />} onClick={onOpenHelpDlg}/>

            {/* 快捷方式：随当前导图而变化 */}
            {
                (validShortCuts.length>0) && <React.Fragment>
                    <Divider type="vertical" className='divider'/>
                    <Text style={{marginLeft:'14px',fontSize:'16px',lineHeight:'20px',}}>快捷入口：</Text>
                    {
                        validShortCuts.map((shortItem, shortInd)=>(
                            <ShortcutItem key={`shortcutbtn-${shortInd}`} tooltip={shortItem.tooltip} url={shortItem.url} shouldConfirm={shortItem.shouldConfirm} onClick={onOpenLink}/>
                        ))
                    }
                </React.Fragment>
            }
        </Header>
    );
}



const ShortcutItem=({tooltip, url, shouldConfirm, onClick})=>{

    const [localIcon] = useLoadIcon({lindAddr: Array.isArray(url) ? "group_links" : url});


    if(!localIcon || !localIcon.type || ('icon'!==localIcon.type && 'image'!==localIcon.type)){
        return null;
    }

    /*
        图标类型
        {
            type: 'icon',
            color: 'red',
            compType: MyComp,
        }
     */
    if('icon'===localIcon.type){
        const IconComp=localIcon.compType;
        return (
            <Tooltip color='cyan' placement="bottomLeft" mouseEnterDelay={0.4} title={tooltip}>
                <Button shape='circle' icon={<IconComp css={localIcon.color} />} className='toolbtn'  size='large' onClick={onClick.bind(this, url, shouldConfirm)}/>
            </Tooltip>
        );
    }

    /*
        图片类型
        {
            type: 'image',
            url: 'file:///a/b/c.jpg',
        }
     */
    if('image'===localIcon.type){
        return (
            <Tooltip color='cyan' placement="bottomLeft" mouseEnterDelay={0.4} title={tooltip}>
                <Button shape='circle' className='toolbtn'  size='large' onClick={onClick.bind(this, url, shouldConfirm)}>
                    <Avatar src={localIcon.url} size='small'/>
                </Button>
            </Tooltip>
        );
    }
};



const ToolbarItem=({title, icon, disabled=false, className='toolbtn',type='default', onClick})=>{
    return <Tooltip color='cyan' placement="bottomLeft" mouseEnterDelay={0.4} title={title}>
        <Button shape='circle' icon={icon} className={className} disabled={disabled} type={type} size='large' onClick={onClick} />
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