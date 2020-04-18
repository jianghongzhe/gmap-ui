/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Button,Tooltip, Progress,Avatar  } from 'antd';
import { FormOutlined,LinkOutlined,ReadOutlined,ClockCircleOutlined,CloseOutlined,CheckOutlined } from '@ant-design/icons';
import gantPic from '../../../assets/gantt.png';
import {createSelector} from 'reselect';

class MindNode extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }

    progressFormater=(st,percent)=>{
        if('exception'===st){
            return <CloseOutlined />;
        }
        if(100===percent){
            return <CheckOutlined />;
        }
        return <span css={progStyle.font}>{`${percent}`}</span>;
    }

    render() {
        let nd=this.props.nd;
        if(!nd){return null;}

        let hasExtraItems=(
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
                        <div css={dateStyle} onClick={this.props.onShowTimeline.bind(this,nd.dateItem.timeline)}>
                            <ClockCircleOutlined className='themeicon' css={{color:nd.dateItem.color}}/>
                            <span className='themedatetxt' css={{color:nd.dateItem.color}}>{nd.dateItem.abbrDate}</span>
                        </div>
                    </Tooltip>
                )
            }


            {/* 主题文本 */}
            <span className='themename' >
                {
                    "string"===typeof(nd.str) ?
                        <>{nd.str}</>
                            :
                        <>{nd.str.map((line,ind)=><span key={'ndtxt-'+ind}>{0<ind && <br/>}{line}</span>)}</>
                } 
            </span>

            {/* 进度 trailColor='#CCC' status="normal" format={percent => percent + '%'} */}
            {(nd && nd.prog) && (
                <Tooltip title={nd.prog.msg}>
                    <Progress type="circle" 
                        trailColor={progStyle.trailColor}
                        format={this.progressFormater.bind(this,nd.prog.st)}
                        css={progStyle.style}
                        percent={nd.prog.err ? 100 : nd.prog.num} 
                        width={progStyle.size} 
                        status={nd.prog.st}
                        onClick={this.props.onShowProgs.bind(this,nd.prog.allProgs)}
                    />
                </Tooltip>
            )}  

            {/* 甘特图  */}
            {(nd && nd.gant) && (
                <Avatar size={18} src={gantPic} css={gantStyle} title='查看甘特图' onClick={this.props.onShowGant.bind(this,nd.gant)}/>
            )}

            {/* 短备注，多个用div叠起来 */}
            {
                (nd && nd.memo && 0<nd.memo.length) && (
                    <Tooltip title={
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
                    <span css={themeBtnWrapperStyle}>
                        <Button 
                            type="link" 
                            size='small' 
                            title={'查看引用 - '+nd.ref.showname} 
                            className='themebtn'
                            icon={<ReadOutlined className='themebtnicon' css={colors.ref}/>}  
                            onClick={this.props.onOpenRef.bind(this,nd.ref)}/>
                    </span>
                )
            }

            {/* 链接按钮 */}
            {
                (nd && nd.links && 0<nd.links.length) && <>{
                    nd.links.map((link,linkInd)=>(
                        <span css={themeBtnWrapperStyle} key={'link-'+linkInd}>
                            <Button 
                                key={linkInd} 
                                type="link" 
                                size='small' 
                                title={link.name ? link.name+"  "+link.addr:link.addr} 
                                className='themebtn'
                                icon={<LinkOutlined className='themebtnicon' css={colors.link}/>}  
                                onClick={this.props.onOpenLink.bind(this,link.addr)}/>
                        </span>
                    ))
                }</>
            }
        </span>);
    }
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
            fontSize: 18,
            borderRadius: 5,
            paddingLeft:6,
            paddingRight:6,
            paddingBottom:10,
            paddingTop:10,
            lineHeight: '20px',
        
        
            '& .themename': {
                ...baseThemeNameStyle,
                fontSize: 18,
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
    fontSize: 16,
    lineHeight: '20px',
    
    '& .themename': {
        ...baseThemeNameStyle,
    },
};

const otherThemeStyle = {
    ...baseThemeStyle,
    fontSize: 14,
    lineHeight: '18px',
    
    '& .themename': {
        ...baseThemeNameStyle,
    },
};

const themeStyles=[centerThemeStyle, ()=>secendThemeStyle, ()=>otherThemeStyle];


export default MindNode;