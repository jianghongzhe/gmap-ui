/** @jsxImportSource @emotion/react */
import React from 'react';
import { Button,Tooltip, Progress,Avatar, Popover  } from 'antd';
import { FormOutlined,LinkOutlined,ReadOutlined,ClockCircleOutlined,CodeOutlined,FolderOpenOutlined,CloseOutlined,CopyOutlined,CheckOutlined } from '@ant-design/icons';
import gantPic from '../../../assets/gantt.png';
import relaPic from '../../../assets/relachart.png';
import {createSelector} from 'reselect';
import marked from 'marked';
import './markdown-node.css';

/**
 * 导图的节点
 * @param {*} props 
 */
const MindNode=(props)=>{
    //如果节点不存在，不需要渲染
    const nd=props.nd;
    if(!nd){return null;}

    //节点是否有额外内容
    const hasExtraItems=(
        nd.dateItem || 
        nd.prog ||
        nd.gant ||
        (nd.memo && 0<nd.memo.length) ||
        nd.ref ||
        (nd.links && 0<nd.links.length)
    );

    //按主题的不同层级设置不同样式，同时根据是否有文本之外的内容而显示不同的样式（只对根节点）
    let themeStyle=themeStyles[nd.lev>2 ? 2 : nd.lev];
    themeStyle=themeStyle(hasExtraItems);


    return (<span css={themeStyle}>
        {/* 日期部分 */}
        {
            (nd && nd.dateItem) && (
                <Tooltip title={<div >{nd.dateItem.fullDate}，{nd.dateItem.msg}</div>}>
                    <div css={dateStyle} onClick={props.onShowTimeline.bind(this,nd.dateItem.timeline)}>
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
            <Tooltip title={nd.prog.msg}>
                <Progress type="circle" 
                    trailColor={progStyle.trailColor}
                    format={progressFormater.bind(this,nd.prog.st)}
                    css={progStyle.style}
                    percent={nd.prog.err ? 100 : nd.prog.num} 
                    width={progStyle.size} 
                    status={nd.prog.st}
                    onClick={props.onShowProgs.bind(this,nd.prog.allProgs)}
                />
            </Tooltip>
        )}  

        {/* deprecated 关系图 */}
        {(nd && nd.graph) && (
            <Avatar size={18} src={relaPic} css={gantStyle} title='查看关系图' onClick={props.onShowGraph.bind(this,nd.graph)}/>
        )}
        


        {/* deprecated 甘特图  */}
        {(nd && nd.gant) && (
            <Avatar size={18} src={gantPic} css={gantStyle} title='查看甘特图' onClick={props.onShowGant.bind(this,nd.gant)}/>
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
            (nd && nd.ref) && (
                <Tooltip color='cyan' placement="bottomLeft" title={'查看引用 - '+nd.ref.showname}>
                    <span css={themeBtnWrapperStyle}>
                        <Button 
                            type="link" 
                            size='small' 
                            className='themebtn'
                            icon={<ReadOutlined className='themebtnicon' css={colors.ref}/>}  
                            onClick={props.onOpenRef.bind(this,nd.ref)}/>
                    </span>
                </Tooltip>
            )
        }

        {/* 链接按钮 */}
        {
            (nd && nd.links && 0<nd.links.length) && <>{
                nd.links.map((link,linkInd)=>(
                    <Tooltip key={'link-'+linkInd} color='cyan' placement="bottomLeft" title={link.name ? link.name+"  "+link.addr:link.addr}>
                        <span css={themeBtnWrapperStyle} >
                            <Button 
                                key={linkInd} 
                                type="link" 
                                size='small' 
                                className='themebtn'
                                icon={getLinkIcon(link.addr)}  
                                onClick={props.onOpenLink.bind(this,link.addr)}/>
                        </span>
                    </Tooltip>
                ))
            }</>
        }
    </span>);
    
}

const progressFormater=(st,percent)=>{
    if('exception'===st){
        return <CloseOutlined />;
    }
    if(100===percent){
        return <CheckOutlined />;
    }
    return <span css={progStyle.font}>{`${percent}`}</span>;
}



/**
 * 根据链接的不同协议显示不同图标
 * @param {*} addr 
 */
const getLinkIcon=(addr)=>{
    if(addr.startsWith("cp://")){
        return <CopyOutlined className='themebtnicon' css={colors.copy}/>;
    }
    if(addr.startsWith("dir://")){
        return <FolderOpenOutlined className='themebtnicon' css={colors.dir}/>;
    }
    if(addr.startsWith("cmd://")){
        return <CodeOutlined className='themebtnicon' css={colors.cmd}/>;
    }
    return <LinkOutlined className='themebtnicon' css={colors.link}/>;
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
    ref: {color:'#faad14'},
    memo: {color:'#faad14'},
    link: {color:'#1890ff'},
    dir: {color:'orange'},
    cmd: {color:'gray'},
    copy: {color:'#1890ff'},
    linkDark: {color:'#faad14'},
};

const gantStyle={
    marginLeft:3,
    verticalAlign:'bottom',
    marginBottom:1,
    cursor:'pointer',
    borderRadius:0,
    // color: '#f56a00', 
    // backgroundColor: '#fde3cf',
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



//根主题的样式，根据是否有文本之外的内容显示不同样式
//有额外内容：显示一个边框
//无额外内容，背景设为蓝色，文字设为白色
const centerThemeStyle =createSelector(
    hasExtraItems => hasExtraItems,
    hasExtraItems =>  {
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
    }
);


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

const themeStyles=[centerThemeStyle, ()=>secendThemeStyle, ()=>otherThemeStyle];


export default React.memo(MindNode);
