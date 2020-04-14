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
            setTimeout(this.arrangeNdPositions, 200);
        }
    }

    componentDidUpdate(prevProps, prevState){



        //节点有变化才重新计算连线
        if(this.props.ds !==prevProps.ds && this.props.ds.tree && this.props.ds.list && this.props.ds.map){
            console.log("开始计算");
            this.setState({
                spinning:true,
            });
            setTimeout(this.arrangeNdPositions, 200);
        }
    }

    arrangeNdPositions=()=>{
        if(!this.props.ds){return;}
        newMindmapSvc.loadStyles(this.props.ds, this.props.containerSize);
        console.log("get line style",this.props.ds.lineStyles);
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
               

                <div css={{...wrapperStyle, ...this.state.wrapperStyle}} id='graphwrapper'>
                    {
                        this.props.ds.list.map((nd,ind)=>(<React.Fragment key={'nd-'+ind}>
                            {/* 节点内容 */}
                            <div className='item' id={nd.id} style={{borderBottom:`1px solid ${nd.color}`,verticalAlign: 'bottom',}} css={
                                (this.state.ndStyles && this.state.ndStyles[nd.id]) ? this.state.ndStyles[nd.id]: {}
                            }>
                                {actNdRenderer(nd)}
                            </div>

                            

                            {/* 节点到父节点的连接线 */}
                            {
                                (nd.parid) && (<>
                                    <div className='linewrapper' id={`line_${nd.id}`} css={
                                        (this.state.lineStyles && this.state.lineStyles[nd.id] && this.state.lineStyles[nd.id].line) ? this.state.lineStyles[nd.id].line : {}
                                    }>
                                        <div className='linefrom' id={`linefrom_${nd.id}`} css={
                                            (this.state.lineStyles && this.state.lineStyles[nd.id] && this.state.lineStyles[nd.id].lineFrom) ? this.state.lineStyles[nd.id].lineFrom : {}
                                        }></div>
                                        <div className='lineto' id={`lineto_${nd.id}`} css={
                                            (this.state.lineStyles && this.state.lineStyles[nd.id] && this.state.lineStyles[nd.id].lineTo) ? this.state.lineStyles[nd.id].lineTo : {}
                                        }></div>
                                    </div>
                                </>)
                            }

                            {/* 节点的展开按钮 */}
                            {
                                (nd.childs && 0<nd.childs.length) && 
                                    <div id={`expbtn_${nd.id}`} className='expBtn' css={
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









const wrapperStyle={
    overflow:'hidden',
    border:'0px solid red',
    position:'relative',
    marginLeft:'auto',
    marginRight:'auto',

    '& .item':{
        whiteSpace:'nowrap',
        position:'absolute',
        display:'inline-block',
        border:'0px solid green',
        borderBottom:'1px solid lightgray',
        // borderBottomLeftRadius:'5px',
        paddingBottom:0,
        paddingTop:10,
        paddingLeft:10,
        paddingRight:10,
        // backgroundColor:'lightblue',
    },

    '& .expBtn':{
        position: 'absolute',
        backgroundColor: 'transparent',
        overflow: 'hidden',
        boxSizing: 'border-box',
        zIndex:1,
    },

    '& .linewrapper': {
        position: 'absolute',
        backgroundColor: 'transparent',
        overflow: 'hidden',
        boxSizing: 'border-box',
    },
  
    '& .linewrapper .linefrom': {
        position: 'absolute',
        backgroundColor: 'transparent',
        boxSizing: 'border-box',
        // borderBottom: '1px solid red',
        // borderRight: '1px solid red',
    },

    '& .linewrapper .lineto': {
        position: 'absolute',
        backgroundColor: 'transparent',
        boxSizing: 'border-box',
        // borderTop: '1px solid red',
        // borderLeft: '1px solid red',
    }
};

export default NewMindmap;