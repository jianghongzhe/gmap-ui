import React, {useMemo} from 'react';
import {Avatar, Button, Divider, Layout, Tooltip, Typography} from 'antd';
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
import styles from './Toolbar.module.scss';
import classnames from "classnames";
import {useMemoizedFn} from "ahooks";


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

    const getShortcutItemExtras= useMemoizedFn((shortcutItem)=>{
        const {
            tooltip,
            url,
            icon,
            confirmTxt,
            shouldConfirm,
            ...extras
        }=shortcutItem;
        return extras;
    });


    return (
        <Header className={styles.toolbar}>
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
                            <ShortcutItem key={`shortcutbtn-${shortInd}`}
                                          tooltip={shortItem.tooltip}
                                          url={shortItem.url}
                                          icon={shortItem.icon}
                                          confirmTxt={shortItem.confirmTxt}
                                          shouldConfirm={shortItem.shouldConfirm}
                                          onClick={onOpenLink}
                                          extraOpts={getShortcutItemExtras(shortItem)}
                            />
                        ))
                    }
                </React.Fragment>
            }
        </Header>
    );
}



const ShortcutItem=({tooltip, url,icon, shouldConfirm, confirmTxt, onClick, extraOpts})=>{
    const [localIcon] = useLoadIcon({lindAddr: (Array.isArray(url) ? "group_links" : url), icon});

    const clickHandler = useMemoizedFn(()=>{
        onClick(url, shouldConfirm, confirmTxt, extraOpts);
    });

    if(!localIcon || !localIcon.type || ('icon'!==localIcon.type && 'image'!==localIcon.type  && 'cascade'!==localIcon.type)){
        return null;
    }




    if('cascade'===localIcon.type){
        return (
            <Tooltip color='cyan' placement="bottomLeft" mouseEnterDelay={0.4} title={tooltip}>
                <div className="shortcut_wrapper" onClick={clickHandler}>
                    {
                        'icon'===localIcon.items[0].type ?
                            getShortcutIcon(localIcon.items[0].compType, localIcon.items[0].color.color, true) :
                            getShortcutImg(localIcon.items[0].url, true)
                    }
                    <div className="small_wrapper">
                        {
                            'icon'===localIcon.items[1].type ?
                                getShortcutIcon(localIcon.items[1].compType, localIcon.items[1].color.color, false) :
                                getShortcutImg(localIcon.items[1].url, false)
                        }
                    </div>
                </div>
            </Tooltip>
        )
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
                {/*<Button shape='circle'
                        className='toolbtn'
                        size='large' onClick={onClick.bind(this, url, shouldConfirm, confirmTxt)}>*/}

                    <div className="shortcut_wrapper" onClick={clickHandler}>
                        {
                            getShortcutIcon(localIcon.compType, localIcon.color.color, true)
                        }
                    </div>

                {/*</Button>*/}
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
                {/*<Button shape='circle' className='toolbtn'  size='large' onClick={onClick.bind(this, url, shouldConfirm, confirmTxt)}>*/}

                    <div className="shortcut_wrapper" onClick={clickHandler}>
                        {
                            getShortcutImg(localIcon.url, true)
                        }
                    </div>

                {/*</Button>*/}
            </Tooltip>
        );
    }
};

const getShortcutImg=(url, big=true)=>{
    return <Avatar src={url} size={big?28:14} className={classnames("noRadius", big?"big":"small")}/>
};
const getShortcutIcon=(IconComp, color, big=true)=>{
    return <IconComp className={'assignedColor '+(big?"big":"small")}  style={{'--color':color}}/>
};


const ToolbarItem=({title, icon, disabled=false, className='toolbtn',type='default', onClick})=>{
    return <Tooltip color='cyan' placement="bottomLeft" mouseEnterDelay={0.4} title={title}>
        <Button shape='circle' icon={icon} className={className} disabled={disabled} type={type} size='large' onClick={onClick} />
    </Tooltip>;
};




export default React.memo(Toolbar);