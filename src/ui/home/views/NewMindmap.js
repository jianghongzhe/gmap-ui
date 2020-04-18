/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import {Spin,Alert,Row, Col} from 'antd';
import {createSelector} from 'reselect';
import newMindmapSvc from '../newMindmapSvc';

class NewMindmap extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            //样式相关状态
            ndStyles:{},
            lineStyles:{},
            expBtnStyles:{},
            wrapperStyle:{},

            spinning:false,
        };
        this.ndsMap={};
    }

    componentDidMount(){
        if(this.props.ds && this.props.ds.tree && this.props.ds.list && this.props.ds.map){
            this.setState({
                spinning:true,
            });
            setTimeout(this.arrangeNdPositions, 50);
        }
    }

    componentDidUpdate(prevProps, prevState){
        //节点有变化才重新计算连线
        if(this.props.ds !==prevProps.ds && this.props.ds.tree && this.props.ds.list && this.props.ds.map){
            console.log("开始计算");
            this.setState({
                spinning:true,
            });
            setTimeout(this.arrangeNdPositions, 50);
        }
    }

    arrangeNdPositions=()=>{
        if(!this.props.ds){return;}
        newMindmapSvc.loadStyles(this.props.ds, this.props.containerSize);
        this.setState({
            ndStyles:       this.props.ds.ndStyles,
            lineStyles:     this.props.ds.lineStyles,
            expBtnStyles:   this.props.ds.expBtnStyles,
            wrapperStyle:   this.props.ds.wrapperStyle,//{width:800,height:600,},
            spinning:       false,
        });
    }

    defaultContentRenderer=(nd)=>{
        return ""+nd.str;
    }
    defaultExpBtnRenderer=(nd)=>{
        return nd.expand? "-":"+";
    }

    

    render() {
        if(!this.props.ds){
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

        if(false===this.props.ds.succ){
            return (<Row>
                <Col span={8} offset={8}>
                    <Alert
                        css={{marginTop:50}}
                        message={this.props.ds.msg}
                        description={this.props.ds.desc}
                        type="error"/>
                </Col>
            </Row>);
        }


        if(!this.props.ds.list){
            return null;
        }



        //如果提供了节点渲染器，则使用，否则使用默认的
        let actNdRenderer=this.defaultContentRenderer;
        if(this.props.ndContentRenderer){
            actNdRenderer=this.props.ndContentRenderer;
        }

        //
        let actExpBtnRenderer=this.defaultExpBtnRenderer;
        if(this.props.ndExpBtnRenderer){
            actExpBtnRenderer=this.props.ndExpBtnRenderer;
        }

        // let spinSize=32;
        // let spinLeft=(this.props.containerSize.w-spinSize)/2;//css={{marginTop:100,marginLeft:spinLeft,}}

        return (
            // <Spin spinning={this.state.spinning} size='large' >
            // <div  css={{width:this.props.containerSize.w,height:this.props.containerSize.h,border:'1px solid blue',overflow:'auto'}}>
               
            //borderBottom:'1px solid lightgray',//保留一个像素默认边框，动态计算位置后会覆盖该样式

                <div css={{...wrapperStyle, ...this.state.wrapperStyle}} id='graphwrapper'>
                    {
                        this.props.ds.list.map((nd,ind)=>(<React.Fragment key={'nd-'+ind}>
                            {/* 节点内容 */}
                            <div className='item'  id={nd.id}
                                    css={nd.parid?{borderBottom:'1px solid lightgray'}:{}}
                                    style={{ ...(nd.parid?{borderBottom:`1px solid ${nd.color}`}:{})  , ...getNdStyle(this.state,nd)}}>
                                {actNdRenderer(nd)}
                            </div>

                            

                            {/* 节点到父节点的连接线 */}
                            {
                                (nd.parid) && (<>
                                    <div className='linewrapper' id={`line_${nd.id}`} style={
                                        (this.state.lineStyles && this.state.lineStyles[nd.id] && this.state.lineStyles[nd.id].line) ? this.state.lineStyles[nd.id].line : {}
                                    }>
                                        <div className='lineExp' id={`lineExp_${nd.id}`} style={
                                            (this.state.lineStyles && this.state.lineStyles[nd.id] && this.state.lineStyles[nd.id].lineExp) ? this.state.lineStyles[nd.id].lineExp : {}
                                        }></div>
                                        <div className='linefrom' id={`linefrom_${nd.id}`} style={
                                            (this.state.lineStyles && this.state.lineStyles[nd.id] && this.state.lineStyles[nd.id].lineFrom) ? this.state.lineStyles[nd.id].lineFrom : {}
                                        }></div>
                                        <div className='lineto' id={`lineto_${nd.id}`} style={
                                            (this.state.lineStyles && this.state.lineStyles[nd.id] && this.state.lineStyles[nd.id].lineTo) ? this.state.lineStyles[nd.id].lineTo : {}
                                        }></div>
                                    </div>
                                </>)
                            }

                            {/* 节点的展开按钮 */}
                            {
                                (nd.childs && 0<nd.childs.length) && 
                                    <div id={`expbtn_${nd.id}`} className='expBtn' style={
                                        (this.state.expBtnStyles && this.state.expBtnStyles[nd.id]) ? this.state.expBtnStyles[nd.id] : {}
                                    }>
                                        {actExpBtnRenderer(nd)}
                                    </div>
                            }
                        </React.Fragment>))
                    }
                </div>
            // </div>
            // </Spin>
        );
    }
}


const getNdStyle=(state,nd)=>{
    return (nd && state.ndStyles && state.ndStyles[nd.id]) ? state.ndStyles[nd.id]: {};
}

const outOfViewStyle={
    left:'-800px',
    top:'-800px',
};

const baseFloatBlockStyle={
    position: 'absolute',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    boxSizing: 'border-box',
}


const wrapperStyle={
    overflow:'hidden',
    border:'0px solid red',
    position:'relative',    //容器本身使用相对定位，其中内容使用绝对定位相对它来布局
    marginLeft:'auto',
    marginRight:'auto',

    '& .item':{
        whiteSpace:'nowrap',
        position:'absolute',
        display:'inline-block',
        border:'0px solid green',
        paddingBottom:0,
        paddingTop:10,
        // paddingLeft:20,
        // paddingRight:20,
        verticalAlign: 'bottom',
        // backgroundColor: 'lightblue',
        ...outOfViewStyle,
    },

    '& .expBtn':{
        ...baseFloatBlockStyle,
        ...outOfViewStyle,
        zIndex:1,   //折叠按钮显示在连接线的上层
    },

    '& .linewrapper': {
        ...baseFloatBlockStyle,
        ...outOfViewStyle,
    },
  
    '& .linewrapper .lineExp': {
        ...baseFloatBlockStyle,
    },

    '& .linewrapper .linefrom': {
        ...baseFloatBlockStyle,
    },

    '& .linewrapper .lineto': {
        ...baseFloatBlockStyle,
    }
};

export default NewMindmap;