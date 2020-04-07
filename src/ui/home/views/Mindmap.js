/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Button,Tooltip,Alert,Row, Col,Progress,Avatar  } from 'antd';
import { PlusCircleOutlined,MinusCircleOutlined,FormOutlined,LinkOutlined,ReadOutlined,ClockCircleOutlined,CloseOutlined,CheckOutlined } from '@ant-design/icons';
import gantPic from '../../../assets/gantt.png';

class Mindmap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {   
        };   
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

    onShowProgList=(progs)=>{
        console.log(progs);
    }


    render() {
        if(!this.props.cells){
            return (<Row>
                <Col span={8} offset={8}>
                    <Alert
                        css={{marginTop:50}}
                        message='状态异常'
                        description='读取图表文件时出现错误'
                        type="error"/>
                </Col>
            </Row>);
        }

        

        return (
            

            <>
            {
                false===this.props.cells.succ ?
                <Row>
                    <Col span={8} offset={8}>
                        <Alert
                            css={{marginTop:50}}
                            message={this.props.cells.msg}
                            description={this.props.cells.desc}
                            type="error"/>
                    </Col>
                </Row>
                
                :
                
                <table border='0' cellSpacing='0' cellPadding='0'  align='center' css={mindTabStyle}>
                    <tbody>
                    {
                        this.props.cells.map((line,rowInd)=>
                            <tr key={rowInd}>
                                {/* 左边空白格 */}
                                <td className='paddingcell'></td>


                                {/* 中间的部分 */}
                                {
                                    line.map((item,colInd)=>
                                        <td key={colInd} css={item.cls}>
                                            
                                            {/* 包括除折叠按钮以外的部分 */}
                                            <span className='themetxt'>
                                                {/* 日期部分 */}
                                                {
                                                    (item.nd && item.nd.dateItem) && (
                                                        <Tooltip title={<div >{item.nd.dateItem.fullDate}，{item.nd.dateItem.msg}</div>}>
                                                            <div className='themedateWrapper' onClick={this.props.onShowTimeline.bind(this,item.nd.dateItem.timeline)}>
                                                                <ClockCircleOutlined className='themeicon' css={{color:item.nd.dateItem.color}}/>
                                                                <span className='themedatetxt' css={{color:item.nd.dateItem.color}}>{item.nd.dateItem.abbrDate}</span>
                                                            </div>
                                                        </Tooltip>
                                                    )
                                                }
                                            
                                                {/* 主题文本 */}
                                                <span className='themename'>
                                                    {
                                                        "string"===typeof(item.txt) ?
                                                            <>{item.txt}</>
                                                                :
                                                            <>{item.txt.map((line,ind)=><span key={ind}>{0<ind && <br/>}{line}</span>)}</>
                                                    } 
                                                </span>
                                                

                                                {/* 进度 trailColor='#CCC' status="normal" format={percent => percent + '%'} */}
                                                {(item.nd && item.nd.prog) && (
                                                    <Tooltip title={item.nd.prog.msg}>
                                                        <Progress type="circle" 
                                                            trailColor={progStyle.trailColor}
                                                            format={this.progressFormater.bind(this,item.nd.prog.st)}
                                                            className='prog'
                                                            percent={item.nd.prog.err ? 100 : item.nd.prog.num} 
                                                            width={progStyle.size} 
                                                            status={item.nd.prog.st}
                                                            onClick={this.props.onShowProgs.bind(this,item.nd.prog.allProgs)}
                                                        />
                                                    </Tooltip>
                                                )}  

                                                {/* 甘特图  */}
                                                {(item.nd && item.nd.gant) && (
                                                    <Avatar size={18} src={gantPic} className='gant' title='查看甘特图' onClick={this.props.onShowGant.bind(this,item.nd.gant)}/>
                                                )}

                                                
                                                {/* 短备注图片，多个用div叠起来 */}
                                                {
                                                    (item.nd && item.nd.memo && 0<item.nd.memo.length) && (
                                                        <Tooltip title={
                                                            <div>
                                                                {
                                                                    item.nd.memo.map((eachmemo,memoInd)=><div key={memoInd}>{eachmemo}</div>)
                                                                }
                                                            </div>
                                                        }>
                                                            <FormOutlined className='themeicon' css={colors.memo}/>
                                                        </Tooltip>
                                                    )
                                                }

                                                {/* 长引用按钮 */}
                                                {
                                                    (item.nd && item.nd.ref) && (
                                                        <Button 
                                                            type="link" 
                                                            size='small' 
                                                            title={'查看引用 - '+item.nd.ref.showname} 
                                                            className='themebtn' 
                                                            icon={<ReadOutlined className='themebtnicon' css={colors.ref}/>}  
                                                            onClick={this.props.onOpenRef.bind(this,item.nd.ref)}/>
                                                    )
                                                }

                                                {/* 链接按钮 */}
                                                {
                                                    (item.nd && item.nd.links && 0<item.nd.links.length) && <>{
                                                        item.nd.links.map((link,linkInd)=>(
                                                            <Button 
                                                                key={linkInd} 
                                                                type="link" 
                                                                size='small' 
                                                                title={link.name?link.name+"  "+link.addr:link.addr} 
                                                                className='themebtn' 
                                                                icon={<LinkOutlined className='themebtnicon' css={colors.link}/>}  
                                                                onClick={this.props.onOpenLink.bind(this,link.addr)}/>
                                                        ))
                                                    }</>
                                                }
                                            </span>


                                            {/* 折叠按钮*/}
                                            {
                                                (item.nd && false===item.nd.leaf ) && (
                                                    <Button 
                                                        type="link" 
                                                        size='small' 
                                                        title={item.nd.expand?"折叠":"展开"} 
                                                        className='expbtn' 
                                                        icon={
                                                            item.nd.expand ?
                                                                <MinusCircleOutlined className='expbtnicon' css={colors.toggle}/>
                                                                    :
                                                                <PlusCircleOutlined className='expbtnicon' css={colors.toggle2}/>
                                                        }  
                                                        onClick={this.props.onToggleExpand.bind(this,item,this.props.cells)}/>
                                                )
                                            }
                                        </td>    
                                    )
                                }


                                {/* 右边空白格 */}
                                <td className='paddingcell'></td>
                            </tr>
                        )
                    }
                    </tbody>
                </table>
            }
            </>
        );
    }

    

    
}


/*
各图标颜色：
日期：过期：洋红  最近：桔黄  以后
备注、引用：浅黄
链接：蓝
折叠按钮：绿
*/



const colors={
    ref: {color:'#faad14'},
    memo: {color:'#faad14'},
    link: {color:'#1890ff'},
    toggle: {color:'#7cb305'},
    toggle2: {color:'#eb2f96'},//#eb2f96 #9254de
    
};

const progStyle={
    trailColor: '#CCC',
    size:24,
    font:{fontSize:12},
}

const mindTabStyle={
    borderCollapse: 'separate',
    maxWidth:999999999,
    marginLeft:'auto',
    marginRight:'auto',

    '& td':{
        paddingLeft:14,
        paddingRight:14,
        whiteSpace:'nowrap',
        textAlign:'left'
    },

    '& td.paddingcell':{
        paddingLeft:16,
        paddingRight:16
    },


    '& td .prog':{
        marginLeft:3,
        verticalAlign:'bottom',
        marginBottom:1,
        cursor:'pointer',
    },

    '& td .gant':{
        marginLeft:3,
        verticalAlign:'bottom',
        marginBottom:1,
        cursor:'pointer',
        borderRadius:0,
        // color: '#f56a00', 
        // backgroundColor: '#fde3cf',
    },

    //日期
    '& td .themedateWrapper':{
        display:'inline-block',
        cursor:'pointer',
        marginRight:5,
        lineHeight:'16px',
        verticalAlign:'bottom'
    },
    '& td .themedateWrapper .themedatetxt':{
        display:'inline-block',
        lineHeight:'16px',
        marginLeft:3,
        marginBottom:2
    },


    //图标
    '& td .themeicon':{
        fontSize:16,
        lineHeight:'16px',
        marginLeft:3,
        verticalAlign:'bottom',
        marginBottom:0,
    },
    

    //引用和链接按钮
    '& td .themebtn':{
        width:16,
        height:16,
        verticalAlign:'bottom',
        padding:0,
        lineHeight:'16px',
        marginBottom:2,
        marginLeft:3,
    },
    '& td .themebtn .themebtnicon':{
        fontSize:16,
        lineHeight:'16px',
        margin:0,
        padding:0,
    },


    //折叠按钮
    '& td .expbtn':{
        width:14,
        height:14,
        verticalAlign:'bottom',
        padding:0,
        lineHeight:'14px',
        marginBottom:3,
        marginLeft:10,
    },
    '& td .expbtn .expbtnicon':{
        fontSize:14,
        lineHeight:'14px',
        margin:0,
        padding:0,
    },
}; 






export default Mindmap;