/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Button,Tooltip,Alert,Row, Col,  } from 'antd';
import { PlusCircleOutlined,MinusCircleOutlined,FormOutlined,LinkOutlined,ReadOutlined,ClockCircleOutlined } from '@ant-design/icons';

class Mindmap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {   
        };   
    }

    onShowTimeline=(obj)=>{
        console.log("时间线对象",obj);
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

        if(false===this.props.cells.succ){
            console.log("未通过...");
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
                                                <span className='themename'>{item.txt}</span>
                                                
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
                                                                <PlusCircleOutlined className='expbtnicon' css={colors.toggle}/>
                                                        }  
                                                        onClick={this.props.onToggleExpand.bind(this,item)}/>
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
};

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