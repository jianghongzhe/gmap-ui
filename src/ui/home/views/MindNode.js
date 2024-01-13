import React, { useMemo } from 'react';
import { Button,Tooltip, Progress  } from 'antd';
import { FormOutlined,ReadOutlined,ClockCircleOutlined,CloseOutlined,CheckOutlined } from '@ant-design/icons';
import {marked} from 'marked';
import NodeLinkIcon from './NodeLinkIcon';
import './markdown-node.css';
import {useMemoizedFn, useRafState} from "ahooks";
import strTmpl from "../../../common/strTmpl";
import api from "../../../service/api";
import styles from './MindNode.module.scss';
import {filterGroupLinks, filterSingleLink} from "../../../service/linkFilter";
import classnames from "classnames";
import {useSelectFileListItem} from "../../../hooks/tabs";
import {tabCurrPane} from "../../../store/tabs";
import {useRecoilValue} from "recoil";




/**
 * 导图的节点
 * @param {*} props 
 */
const MindNode=({nd,  onShowTimeline, onShowProgs, onOpenRef, onOpenLink, onNodeOp, zoomRate,})=>{

    //根主题的样式，根据是否有文本之外的内容显示不同样式
    //有额外内容：显示一个边框
    //无额外内容，背景设为蓝色，文字设为白色
    const centerThemeCls =useMemo(() =>  {
        if(!nd || 0!==nd.lev){
            return '';
        }
        const hasExtraItems=(
            nd.dateItem || 
            nd.prog ||
            nd.gant ||
            (nd.memo && 0<nd.memo.length) ||
            (nd.refs && 0<nd.refs.length) ||
            (nd.links && 0<nd.links.length)
        );
        return hasExtraItems ? styles.centerThemeStyle_extra : styles.centerThemeStyle_noExtra;
    },[nd]);



    const themeCls=useMemo(()=>{
        if(!nd){
            return '';
        }

        const allLevelStyles=[centerThemeCls, styles.secendThemeStyle, styles.otherThemeStyle];
        return allLevelStyles[nd.lev>2 ? 2 : nd.lev];
    },[nd, centerThemeCls]);


    const [generalLinks,grouplinks]=useMemo(()=>{
        if(!nd){
            return [[],[]];
        }
        return [
            nd.links.filter(link=>!link.addr.startsWith("grp://")),
            nd.links.filter(link=>link.addr.startsWith("grp://")),
        ];
    },[nd])

    
    if(!nd){return null;}

    return (<span className={classnames(themeCls, styles.root)} style={{'--zoomRate':`${zoomRate}`,}}>
        {/* 日期部分 */}
        {
            (nd && nd.dateItem) && (
                <Tooltip color='cyan' mouseEnterDelay={0.4} title={<div >{nd.dateItem.fullDate}，{nd.dateItem.msg}</div>}>
                    <div className='dateStyle node_part' onClick={onShowTimeline.bind(this,nd.dateItem.timeline)}>
                        <ClockCircleOutlined className='themeicon' style={{'--color': nd.dateItem.color}}/>
                        <span className='themedatetxt' style={{'--color':nd.dateItem.color}}>{nd.dateItem.abbrDate}</span>
                    </div>
                </Tooltip>
            )
        }


        {/* 主题文本 markdown-body*/}
        <Tooltip color='cyan' mouseEnterDelay={0.4} title={
            <div className={styles.themeTxtTooltip}>
                <div>节点操作</div>
                <div className='btnContainer'>
                    <TooltipBtn value="编辑节点" onClick={onNodeOp.bind(this,nd,'edit')}/>
                    <TooltipBtn value="添加子节点" onClick={onNodeOp.bind(this,nd,'appendChild')}/>
                    {
                        nd.par && (<React.Fragment>
                            <TooltipBtn value="添加兄弟节点（之前）" onClick={onNodeOp.bind(this,nd,'addSiblingBefore')}/>
                            <TooltipBtn value="添加兄弟节点（之后）" onClick={onNodeOp.bind(this,nd,'addSiblingAfter')}/>
                        </React.Fragment>)
                    }
                    {
                        nd.kws.length>0 && <React.Fragment>{
                            nd.kws.map((kw,kwInd)=>(
                                <TooltipBtn key={`node_txt_btn_${kwInd}`} value={`搜索: ${kw}`} onClick={api.searchKeyword.bind(this, kw)}/>
                            ))
                        }</React.Fragment>
                    }
                </div>
            </div>
        }>
            <span className='themename markdown-body-node node_part' >
                {
                    "string"===typeof(nd.str) ?
                        <span dangerouslySetInnerHTML={{__html:handleSingleLine(nd.str)}}></span>
                            :
                        <>{nd.str.map((line,ind)=><React.Fragment key={'ndtxts-'+ind}>
                            {0<ind && <br key={'ndbr-'+ind}/>}
                            <span key={'ndtxt-'+ind} dangerouslySetInnerHTML={{__html:handleSingleLine(line)}}></span>
                        </React.Fragment>)}</>
                }
            </span>
        </Tooltip>

        {/* 进度 trailColor='#CCC' status="normal" format={percent => percent + '%'} */}
        {(nd && nd.prog) && (
            <Tooltip color='cyan' mouseEnterDelay={0.4} title={nd.prog.msg}>
                <Progress type="circle" 
                    trailColor={progStyle.trailColor}
                    format={progressFormater.bind(this,nd.prog.st)}
                    className='progStyle node_part'
                    percent={nd.prog.err ? 100 : nd.prog.num} 
                    width={progStyle.size} 
                    status={nd.prog.st}
                    onClick={onShowProgs.bind(this,nd.prog.allProgs)}
                />
            </Tooltip>
        )}  

        

        {/* 短备注，多个用div叠起来 */}
        {
            (nd && nd.memo && 0<nd.memo.length) && (
                <Tooltip color='cyan' mouseEnterDelay={0.4} title={
                    <div>
                        {
                            nd.memo.map((eachmemo,memoInd)=><div key={memoInd}>{eachmemo}</div>)
                        }
                    </div>
                }>
                    <FormOutlined className='memoStyle node_part'/>
                </Tooltip>
            )
        }

        {/* 长引用按钮 */}
        {
            (nd && nd.refs && 0<nd.refs.length) && (
                nd.refs.map((refItem,refInd)=>(                
                    <Tooltip key={refInd} color='cyan' placement="top" title={
                        <div className={styles.themeTxtTooltip}>
                            <div>{true===refItem.combined ? '查看全部引用' : `引用 - ${refItem.showname}`}</div>
                            {
                                true!==refItem?.combined && (
                                    <div className='btnContainer'>
                                        <TooltipBtn value="查看引用" onClick={onOpenRef.bind(this,refItem)}/>
                                        <TooltipBtn value="编辑引用" onClick={onNodeOp.bind(this,nd,{type:'editRef', cont:refItem,})}/>
                                    </div>
                                )
                            }
                        </div>
                    } mouseEnterDelay={0.4}>
                        <span className={classnames('node_part', styles.themeBtnWrapper)}>
                            <Button 
                                type="link" 
                                size='small' 
                                className='themebtn'
                                icon={<ReadOutlined className='themebtnicon' style={{'--color': refItem.combined ? colors.combinedRef.color : colors.ref.color}}/>}
                                onClick={onOpenRef.bind(this,refItem)}/>
                        </span>
                    </Tooltip>
                ))
            )
        }

        {/* 链接按钮：普通链接和组链接 */}
        {
            generalLinks.map((link,linkInd)=>
                <LinkComplexItem key={`link_complex_${linkInd}`} link={link} linkInd={linkInd} onOpenLink={onOpenLink}/>
            )
        }
        {
            grouplinks.length>0 && <GroupLinkItem links={grouplinks} openLinkFunc={onOpenLink}/>
        }
    </span>);
}

const TooltipBtn=({onClick, value})=>{
    return (
        <Button type='dashed'
                ghost
                size='small'
                shape='round'
                className='btn'
                onClick={onClick}>{value}</Button>
    );
};



/**
 * 渲染链接：
 */
const LinkComplexItem=({link, linkInd, onOpenLink})=>{
    const {
        tooltip,
        url: factUrl,
        shouldConfirm,
        confirmTxt,
        icon,
        ...extraOpts
    }=useMemo(()=>filterSingleLink(link.name, link.addr), [link]);

    return <LinkItem key={'link-'+linkInd}
                     tooltip={tooltip}
                     addr={factUrl}
                     icon={icon}
                     openLinkFunc={onOpenLink.bind(this, factUrl, shouldConfirm, confirmTxt, extraOpts)}/>;
};



const LinkItem=({tooltip, addr, icon, openLinkFunc, needConfirm=false})=> {
    const selectFileListItem= useSelectFileListItem();
    const currPane= useRecoilValue(tabCurrPane);

    /**
     * 右键菜单相关的数据项
     */
    const [ctxMenuItems, setCtxMenuItems] = useRafState([]);

    const onOpenChange=useMemoizedFn((open)=>{
        // 当tooltip关闭时、或地址中包含插值参数时，不设置右键菜单项
        if(!open){
            return;
        }
        if(strTmpl.containsParam(addr)){
            return;
        }

        // 异步查询右键菜单
        (async ()=>{
            const [e,result]= await api.loadCtxMenu({
                Path:addr,
                CtxDir: currPane?.key??'',
            });
            if(e){
                return;
            }
            const items = result.Items.map(({Title,Url})=>({name:Title, url:Url,}));
            setCtxMenuItems(items);
        })();
    });

    return (
        <Tooltip color='cyan' placement="top" mouseEnterDelay={0.4} onOpenChange={onOpenChange} title={
            <div className={styles.linkTooltip}>
                <div>{tooltip}</div>
                {
                    (ctxMenuItems && ctxMenuItems.length>0) && <div className='btnContainer'>
                        {
                            ctxMenuItems.map((ctxMenu,menuInd)=>(
                                <TooltipBtn key={`menu-${menuInd}`}
                                            value={ctxMenu.name}
                                            onClick={api.openUrl.bind(this, ctxMenu.url,
                                                ctxMenu.url.startsWith("gmap://") ? selectFileListItem : currPane?.key??'')}
                                />
                            ))
                        }
                    </div>
                }
            </div>
        } >
            <span className={classnames('node_part', styles.themeBtnWrapper)}>
                <NodeLinkIcon lindAddr={addr} icon={icon} onClick={openLinkFunc}/>
            </span>
        </Tooltip>
    );
};


/**
 * 组合链接：
 * 同一节点上的多个组合链接显示为一个整体的组合链接，
 * 组合链接中不支持占位符，如果出现则跳过该项
 * @param links
 * @param openLinkFunc
 * @returns {JSX.Element|null}
 */
const GroupLinkItem=({links, openLinkFunc})=>{

    const val= useMemo(()=>filterGroupLinks(links),[links])

    if(null===val){
        return null;
    }

    const {
        tooltip,
        url,
        shouldConfirm,
        confirmTxt,
        icon,
        ...extraOpts
    }=val;

    if(!Array.isArray(val.url)){
        return <LinkItem tooltip={tooltip} addr={url} icon={icon} openLinkFunc={openLinkFunc.bind(this, url, shouldConfirm, confirmTxt, extraOpts)}/>;
    }
    return <Tooltip  color='cyan' placement="top" title={tooltip}>
        <span className={classnames('node_part', styles.themeBtnWrapper)}>
            <NodeLinkIcon lindAddr="group_links" onClick={openLinkFunc.bind(this, url, shouldConfirm, confirmTxt, extraOpts)}/>
        </span>
    </Tooltip>
};




const progressFormater=(st,percent)=>{
    if('exception'===st){
        return <CloseOutlined />;
    }
    if(100===percent){
        return <CheckOutlined />;
    }
    return <span className='progTxtStyle'>{`${percent}`}</span>;
}



const handleSingleLine=(str)=>{
    let tmp=marked(str).trim();
    let reg=/^[<]p[>](.+)[<][/]p[>]$/;
    tmp=tmp.replace(reg,"$1");
    return tmp;
}


const colors={
    combinedRef: {color:'#1890ff'},
    ref: {color:'#faad14'},
    memo: {color:'#faad14'},
    link: {color:'#1890ff'},
    dir: {color:'orange'},
    cmd: {color:'gray'},
    copy: {color:'#1890ff'},
    linkDark: {color:'#faad14'},
};


const progStyle={
    trailColor: '#CCC',
    size:24,
};









export default React.memo(MindNode);
