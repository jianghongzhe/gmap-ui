/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Button,Tooltip, Progress,Avatar  } from 'antd';
import { FormOutlined,LinkOutlined,ReadOutlined,ClockCircleOutlined,CloseOutlined,CheckOutlined } from '@ant-design/icons';
import gantPic from '../../../assets/gantt.png';

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

        //按主题的不同层级设置不同样式
        let themeStyle=themeStyles[nd.lev>2 ? 2 : nd.lev];


        //对中心主题，需要根据内容行数做居中处理
        let centerThemeExtraStyle={};
        if(0===nd.lev){
            let lines="string"===typeof(nd.str) ? 1 : nd.str.length;
            centerThemeExtraStyle={
                marginBottom:-10*lines,
            };
        }
        

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
            <span className='themename' css={centerThemeExtraStyle}>
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

//#2db7f5
const centerThemeStyle = {
    ...baseThemeStyle,
    fontSize: 18,

    '& .themename': {
        ...baseThemeNameStyle,

        color: 'white',
        backgroundColor: '#108ee9',
        borderRadius: 5,
        fontSize: 18,
        lineHeight: '20px',
        padding: '8px 16px',
        
        marginLeft: 3,
        marginRight: 3,
        verticalAlign: 'bottom',
    }, 
};

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

const themeStyles=[centerThemeStyle, secendThemeStyle, otherThemeStyle];


export default MindNode;