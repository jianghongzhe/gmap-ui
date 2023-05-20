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




/**
 * 导图的节点
 * @param {*} props 
 */
const MindNode=({nd,  onShowTimeline, onShowProgs, onOpenRef, onOpenLink, onNodeOp,})=>{

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
    return (<span className={classnames(themeCls, styles.root)}>
        {/* 日期部分 */}
        {
            (nd && nd.dateItem) && (
                <Tooltip color='cyan' mouseEnterDelay={0.4} title={<div >{nd.dateItem.fullDate}，{nd.dateItem.msg}</div>}>
                    <div className='dateStyle' onClick={onShowTimeline.bind(this,nd.dateItem.timeline)}>
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
                    <Button type='dashed' ghost size='small' shape='round'
                            className='btn'
                            onClick={onNodeOp.bind(this,nd,'edit')}>编辑节点</Button>
                    <Button type='dashed' ghost size='small' shape='round'
                            className='btn'
                            onClick={onNodeOp.bind(this,nd,'appendChild')}>添加子节点</Button>
                    {
                        nd.par && (<React.Fragment>
                            <Button type='dashed' ghost size='small' shape='round'
                                    className='btn'
                                    onClick={onNodeOp.bind(this,nd,'addSiblingBefore')}>添加兄弟节点（之前）</Button>
                            <Button type='dashed' ghost size='small' shape='round'
                                    className='btn'
                                    onClick={onNodeOp.bind(this,nd,'addSiblingAfter')}>添加兄弟节点（之后）</Button>
                        </React.Fragment>)
                    }
                </div>
            </div>
        }>
            <span className='themename markdown-body-node' >
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
                    className='progStyle'
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
                    <FormOutlined className='memoStyle'/>
                </Tooltip>
            )
        }

        {/* 长引用按钮 */}
        {
            (nd && nd.refs && 0<nd.refs.length) && (
                nd.refs.map((refItem,refInd)=>(                
                    <Tooltip key={refInd} color='cyan' placement="top" title={'查看引用 - '+refItem.showname} mouseEnterDelay={0.4}>
                        <span className={styles.themeBtnWrapper}>
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



/**
 * 渲染链接：
 */
const LinkComplexItem=({link, linkInd, onOpenLink})=>{
    const {
        tooltip,
        url: factUrl,
        shouldConfirm,
    }=useMemo(()=>filterSingleLink(link.name, link.addr), [link]);

    return <LinkItem key={'link-'+linkInd}
                     tooltip={tooltip}
                     addr={factUrl}
                     openLinkFunc={onOpenLink.bind(this, factUrl, shouldConfirm)}/>;
};



const LinkItem=({tooltip, addr, openLinkFunc, needConfirm=false})=> {
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
            const result= await api.loadCtxMenu(addr);
            if(result && true===result.succ){
                setCtxMenuItems(result.data);
            }
            // console.log('ctx menu result', result);
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
                                <Button key={`menu-${menuInd}`}
                                        type='dashed'
                                        ghost
                                        size='small'
                                        shape='round'
                                        className='btn'
                                        onClick={api.openUrl.bind(this, ctxMenu.url)}>{ctxMenu.name}</Button>
                            ))
                        }
                    </div>
                }
            </div>
        } >
            <span className={styles.themeBtnWrapper}>
                <NodeLinkIcon lindAddr={addr} onClick={openLinkFunc}/>
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
    if(!Array.isArray(val.url)){
        return <LinkItem tooltip={val.tooltip} addr={val.url} openLinkFunc={openLinkFunc.bind(this, val.url, val.shouldConfirm)}/>;
    }
    return <Tooltip  color='cyan' placement="top" title={val.tooltip}>
        <span className={styles.themeBtnWrapper}>
            <NodeLinkIcon lindAddr="group_links" onClick={openLinkFunc.bind(this, val.url, val.shouldConfirm)}/>
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
