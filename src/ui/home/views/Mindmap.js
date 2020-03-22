/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Button,Tooltip,Alert,Row, Col,  } from 'antd';
import { PlusCircleOutlined,MinusCircleOutlined,FormOutlined,LinkOutlined,ReadOutlined } from '@ant-design/icons';

class Mindmap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {   
        };   
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
                            <td className='paddingcell'></td>
                            {
                                line.map((item,colInd)=>
                                    <td key={colInd} css={item.cls}>
                                        <span className='themetxt'>
                                            {item.txt}
                                            {
                                                (item.nd && item.nd.memo && 0<item.nd.memo.length) && 
                                                <Tooltip title={
                                                    <div>{item.nd.memo.map((eachmemo,memoInd)=><div key={memoInd}>{eachmemo}</div>)}</div>
                                                }><FormOutlined className='memoicon'/></Tooltip>
                                            }
                                            {
                                                (item.nd && item.nd.ref) && <Button type="link" size='small' 
                                                    title={'查看引用 - '+item.nd.ref.showname} className='linkbtn' 
                                                    icon={<ReadOutlined className='reficon'/>}  
                                                    onClick={this.props.onOpenRef.bind(this,item.nd.ref)}/>
                                            }
                                            {
                                                (item.nd && item.nd.links && 0<item.nd.links.length) &&
                                                    <>{
                                                        item.nd.links.map((link,linkInd)=>(
                                                            // <LinkOutlined className='linkicon'
                                                            //     title={link.name?link.name+" "+link.addr:link.addr}
                                                            //     onClick={this.props.onOpenLink.bind(this,link.addr)}/>

                                                            <Button key={linkInd} type="link" size='small' 
                                                                title={link.name?link.name+"  "+link.addr:link.addr} className='linkbtn' 
                                                                icon={<LinkOutlined className='linkicon'/>}  
                                                                onClick={this.props.onOpenLink.bind(this,link.addr)}/>
                                                        ))
                                                    }</>
                                            }
                                            
                                        </span>
                                        {
                                            (item.nd && false===item.nd.leaf ) && 
                                            <Button type="link" size='small' title={item.nd.expand?"折叠":"展开"} className='btn' 
                                                icon={item.nd.expand ?<MinusCircleOutlined className='icon' />:<PlusCircleOutlined className='icon' />}  
                                                onClick={this.props.onToggleExpand.bind(this,item)}/>
                                        }
                                    </td>    
                                )
                            }
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

    '& td .memoicon':{
        fontSize:16,
        lineHeight:'16px',
        marginLeft:5,
        color:'#fa8c16'
    },

    '& td .linkbtn':{
        width:16,
        height:16,
        lineHeight:'16px',
        fontSize:16,
        padding:0,
        marginLeft:3,
        // backgroundColor:'lightblue',
    },

    '& td .reficon':{
        fontSize:16,
        lineHeight:'16px',
        marginLeft:0,
        color:'#fa8c16',
        cursor:'pointer'
    },

    '& td .linkicon':{
        fontSize:16,
        lineHeight:'16px',
        marginLeft:0,
        color:'#009688',
        cursor:'pointer'
    }
}; 






export default Mindmap;