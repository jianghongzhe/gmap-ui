import React, { useCallback, useMemo } from 'react';
import { Button,Tooltip, Progress  } from 'antd';
import { FormOutlined,ReadOutlined,ClockCircleOutlined,CloseOutlined,CheckOutlined } from '@ant-design/icons';
import {marked} from 'marked';
import NodeLinkIcon from './NodeLinkIcon';
import './markdown-node.css';

/**
 * 导图的节点
 * @param {*} props 
 */
const MindNode=({nd, onShowTimeline, onShowProgs, onOpenRef, onOpenLink})=>{

    //根主题的样式，根据是否有文本之外的内容显示不同样式
    //有额外内容：显示一个边框
    //无额外内容，背景设为蓝色，文字设为白色
    const centerThemeStyle =useMemo(() =>  {
        if(!nd || 0!==nd.lev){
            return {};
        }
        const hasExtraItems=(
            nd.dateItem || 
            nd.prog ||
            nd.gant ||
            (nd.memo && 0<nd.memo.length) ||
            (nd.refs && 0<nd.refs.length) ||
            (nd.links && 0<nd.links.length)
        );
        return getCenterThemeStyle(hasExtraItems);
    },[nd]);



    const themeStyle=useMemo(()=>{
        if(!nd){
            return {};
        }
        const allLevelStyles=[centerThemeStyle, secendThemeStyle, otherThemeStyle];
        return allLevelStyles[nd.lev>2 ? 2 : nd.lev];
    },[nd, centerThemeStyle]);


    
    if(!nd){return null;}
    return (<span css={themeStyle}>
        {/* 日期部分 */}
        {
            (nd && nd.dateItem) && (
                <Tooltip color='cyan' title={<div >{nd.dateItem.fullDate}，{nd.dateItem.msg}</div>}>
                    <div css={dateStyle} onClick={onShowTimeline.bind(this,nd.dateItem.timeline)}>
                        <ClockCircleOutlined className='themeicon' css={{color:nd.dateItem.color}}/>
                        <span className='themedatetxt' css={{color:nd.dateItem.color}}>{nd.dateItem.abbrDate}</span>
                    </div>
                </Tooltip>
            )
        }


        {/* 主题文本 markdown-body*/}
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

        {/* 进度 trailColor='#CCC' status="normal" format={percent => percent + '%'} */}
        {(nd && nd.prog) && (
            <Tooltip color='cyan' title={nd.prog.msg}>
                <Progress type="circle" 
                    trailColor={progStyle.trailColor}
                    format={progressFormater.bind(this,nd.prog.st)}
                    css={progStyle.style}
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
                <Tooltip color='cyan' title={
                    <div>
                        {
                            nd.memo.map((eachmemo,memoInd)=><div key={memoInd}>{eachmemo}</div>)
                        }
                    </div>
                }>
                    <FormOutlined  css={{...themeIconStyle, ...colors.memo}}/>
                </Tooltip>
            )
        }

        {/* 长引用按钮 */}
        {
            (nd && nd.refs && 0<nd.refs.length) && (
                nd.refs.map((refItem,refInd)=>(                
                    <Tooltip key={refInd} color='cyan' placement="top" title={'查看引用 - '+refItem.showname}>
                        <span css={themeBtnWrapperStyle}>
                            <Button 
                                type="link" 
                                size='small' 
                                className='themebtn'
                                icon={<ReadOutlined className='themebtnicon' css={refItem.combined ? colors.combinedRef : colors.ref}/>}  
                                onClick={onOpenRef.bind(this,refItem)}/>
                        </span>
                    </Tooltip>
                ))
            )
        }

        {/* 链接按钮 */}
        {
            (nd && nd.links && 0<nd.links.length) && <React.Fragment>{
                nd.links.map((link,linkInd)=> 
                    <LinkComplexItem key={`link_complex_${linkInd}`} link={link} linkInd={linkInd} onOpenLink={onOpenLink}/>
                )
            }</React.Fragment>
        }
    </span>);
}



/**
 * 渲染链接：
 * 1、如果是fileext或filex协议，则拆分为file、openas、dir、cp几个链接
 * 2、如果是dirext或dirx协议，则拆分为file、dir、cp几个链接
 * 3、如果是urlx协议，则拆分为普通链接、cp几个链接
 * 4、否则，生成一个链接
 */
const LinkComplexItem=({link, linkInd, onOpenLink})=>{
    const isFileExtProtocol=useCallback((addr)=>{
        return (addr.startsWith("fileext://") || addr.startsWith("filex://"));
    },[]);

    const isDirExtProtocol=useCallback((addr)=>{
        return (addr.startsWith("dirext://") || addr.startsWith("dirx://"));
    },[]);

    const isUrlxProtocol=useCallback((addr)=>{
        return addr.startsWith("urlx://");
    },[]);

    const splitUrlxProtocol=useCallback((addr, name)=>{
        let len=0;
        if(addr.startsWith("urlx://")){
            len=(addr.startsWith("urlx:///") ? "urlx:///".length : "urlx://".length);
        }else{
            return [];
        }
        const originUrl=addr.substring(len);
        const cpUrl=`cp://${originUrl}`;

        return [
            {
                addr: originUrl,
                tooltip:  (name ? name+"  "+originUrl:originUrl),
            },
            {
                addr: cpUrl,
                tooltip:  (name ? name+"  "+cpUrl:cpUrl),
            },
        ];
    },[]);

    /**
     * 把fileext协议的url分解为三个具体的协议：file、openas、dir
     */
    const splitFileExtProtocol=useCallback((addr, name)=>{

        let len=0;
        if(addr.startsWith("fileext://")){
            len=(addr.startsWith("fileext:///") ? "fileext:///".length : "fileext://".length);
        }else if(addr.startsWith("filex://")){
            len=(addr.startsWith("filex:///") ? "filex:///".length : "filex://".length);
        }else{
            return [];
        }
        
        const after=addr.substring(len);
        const fileUrl="file:///"+after;
        const openasUrl="openas://"+after;
        const dirUrl="dir://"+after;
        const cpUrl="cppath://"+after;
        return [
            {
                addr: fileUrl,
                tooltip:  (name ? name+"  "+fileUrl:fileUrl),
            },
            {
                addr: openasUrl,
                tooltip: "打开方式  "+openasUrl,
            },
            {
                addr: dirUrl,
                tooltip: "打开目录并选择  "+dirUrl,
            },
            {
                addr: cpUrl,
                tooltip: "复制  "+cpUrl,
            },
        ];
    },[]);

    /**
     * 把fileext协议的url分解为三个具体的协议：file、openas、dir
     */
    const splitDirExtProtocol=useCallback((addr, name)=>{
        let len=0;
        if(addr.startsWith("dirext://")){
            len=(addr.startsWith("dirext:///") ? "dirext:///".length : "dirext://".length);
        }else if(addr.startsWith("dirx://")){
            len=(addr.startsWith("dirx:///") ? "dirx:///".length : "dirx://".length);
        }else{
            return [];
        }
        
        const after=addr.substring(len);
        const fileUrl="file:///"+after;
        const dirUrl="dir://"+after;
        const cpUrl="cppath://"+after;
        return [
            {
                addr: fileUrl,
                tooltip:  (name ? name+"  "+fileUrl:fileUrl),
            },
            {       
                addr: dirUrl,
                tooltip: "打开目录并选择  "+dirUrl,
            },
            {
                addr: cpUrl,
                tooltip: "复制  "+cpUrl,
            },
        ];
    },[]);


    if(isFileExtProtocol(link.addr)){
        return <React.Fragment key={'link-'+linkInd}>
            {
                splitFileExtProtocol(link.addr, link.name).map((subitem, subind)=>(
                    <LinkItem key={'sublink-'+linkInd+'_'+subind} tooltip={subitem.tooltip} addr={subitem.addr} openLinkFunc={onOpenLink.bind(this,subitem.addr)}/>
                ))
            }
        </React.Fragment>
    }
    if(isDirExtProtocol(link.addr)){
        return <React.Fragment key={'link-'+linkInd}>
            {
                splitDirExtProtocol(link.addr, link.name).map((subitem, subind)=>(
                    <LinkItem key={'sublink-'+linkInd+'_'+subind} tooltip={subitem.tooltip} addr={subitem.addr} openLinkFunc={onOpenLink.bind(this,subitem.addr)}/>
                ))
            }
        </React.Fragment>
    }
    if(isUrlxProtocol(link.addr)){
        return <React.Fragment key={'link-'+linkInd}>
            {
                splitUrlxProtocol(link.addr, link.name).map((subitem, subind)=>(
                    <LinkItem key={'sublink-'+linkInd+'_'+subind} tooltip={subitem.tooltip} addr={subitem.addr} openLinkFunc={onOpenLink.bind(this,subitem.addr)}/>
                ))
            }
        </React.Fragment>
    }
    return <LinkItem key={'link-'+linkInd} tooltip={link.name ? link.name+"  "+link.addr:link.addr} addr={link.addr} openLinkFunc={onOpenLink.bind(this,link.addr)}/>;
};



const LinkItem=({tooltip, addr, openLinkFunc})=>(
    <Tooltip  color='cyan' placement="top" title={tooltip}>
        <span css={themeBtnWrapperStyle} >
            <NodeLinkIcon lindAddr={addr} onClick={openLinkFunc}/>
        </span>
    </Tooltip>
);




const progressFormater=(st,percent)=>{
    if('exception'===st){
        return <CloseOutlined />;
    }
    if(100===percent){
        return <CheckOutlined />;
    }
    return <span css={progStyle.font}>{`${percent}`}</span>;
}



const handleSingleLine=(str)=>{
    let tmp=marked(str).trim();
    let reg=/^[<]p[>](.+)[<][/]p[>]$/;
    tmp=tmp.replace(reg,"$1");
    return tmp;
}


const themeBtnWrapperStyle={
    '& .themebtn':{
        width:16,
        height:16,
        verticalAlign:'bottom',
        padding:0,
        lineHeight:'16px',
        marginBottom:2,
        marginLeft:3,
    },

    '& .themebtn .themebtnicon':{
        fontSize:16,
        lineHeight:'16px',
        margin:0,
        padding:0,
    }
};


const themeIconStyle={
    fontSize:16,
    lineHeight:'16px',
    marginLeft:3,
    verticalAlign:'bottom',
    marginBottom:0,
};

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
    font:{fontSize:12},

    style:{
        marginLeft:3,
        verticalAlign:'bottom',
        marginBottom:1,
        cursor:'pointer',
    },
};

const dateStyle={
    display:'inline-block',
    cursor:'pointer',
    marginRight:5,
    lineHeight:'16px',
    verticalAlign:'bottom',

    '& .themedatetxt':{
        display:'inline-block',
        lineHeight:'16px',
        marginLeft:3,
        marginBottom:2
    },    
};

const baseThemeStyle={
    whiteSpace: 'nowrap',
    display: 'inline-block',
    marginBottom: 0,
    paddingBottom: 0,
    verticalAlign: 'bottom',
};

const baseThemeNameStyle={
    whiteSpace: 'nowrap',
    display: 'inline-block',
};




const getCenterThemeStyle =(hasExtraItems) =>  {
    let baseStyle= {
        ...baseThemeStyle,
        fontSize: '18px !important',
        borderRadius: 10,
        paddingLeft:6,
        paddingRight:6,
        paddingBottom:10,
        paddingTop:10,
        lineHeight: '20px',
          
        '& .themename': {
            ...baseThemeNameStyle,
            fontSize: '18px !important',
            lineHeight: '20px',
            padding: '0px 2px',
            
            marginLeft: 0,
            marginRight: 0,
            verticalAlign: 'bottom',
        }, 
    };

    //除了文本内容，还有别的项
    if(hasExtraItems){
        baseStyle.border='2px solid #108ee9';
        return baseStyle;
    }

    //没有别的项
    baseStyle.backgroundColor= '#108ee9';
    baseStyle['& .themename'].color='white';
    baseStyle['& .themename'].padding= '0px 8px';
    return baseStyle;
};


const secendThemeStyle = {
    ...baseThemeStyle,
    fontSize: '16px !important',
    lineHeight: '20px',
    paddingBottom:5,
    paddingTop:5,
    paddingLeft:5,
    paddingRight:5,
    
    '& .themename': {
        ...baseThemeNameStyle,
    },
};

const otherThemeStyle = {
    ...baseThemeStyle,
    fontSize: '14px !important',
    lineHeight: '18px',
    paddingLeft:2,
    paddingRight:2,
    
    '& .themename': {
        ...baseThemeNameStyle,
    },
};




export default React.memo(MindNode);
