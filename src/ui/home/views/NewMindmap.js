/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import {Spin,Alert,Row, Col} from 'antd';
import {createSelector} from 'reselect';
import newMindmapSvc from '../../../service/newMindmapSvc';

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
            this.setState({
                spinning:true,
            });
            setTimeout(this.arrangeNdPositions, 50);
        }
    }

    arrangeNdPositions=()=>{
        if(!this.props.ds){return;}
        newMindmapSvc.loadStyles(this.props.ds);
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
        //校验
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


        //如果提供了节点渲染器或扩展按钮渲染器，则使用，否则使用默认的
        let actNdRenderer=this.defaultContentRenderer;
        let actExpBtnRenderer=this.defaultExpBtnRenderer;
        if(this.props.ndContentRenderer){
            actNdRenderer=this.props.ndContentRenderer;
        }
        if(this.props.ndExpBtnRenderer){
            actExpBtnRenderer=this.props.ndExpBtnRenderer;
        }

        return (
            <div css={{...wrapperStyle, ...this.state.wrapperStyle}}  id={`graphwrapper_${this.props.ind}`}>
                {
                    this.props.ds.list.map((nd,ind)=>(<React.Fragment key={'nd-'+ind}>
                        {/* 节点内容  css={nd.parid?{borderBottom:'1px solid lightgray'}:{}}*/}
                        <div className='item'  id={nd.id} style={getNdStyle({state:this.state, nd})}>
                            {actNdRenderer(nd)}
                        </div>

                        {/* 节点到父节点的连接线 */}
                        {
                            (nd.parid) && (<>
                                <div className='linewrapper' id={`line_${nd.id}`} style={getLineStyle({state:this.state, nd, type:'line'})}>
                                    <div className='lineExp' id={`lineExp_${nd.id}`} style={getLineStyle({state:this.state, nd, type:'lineExp'})}></div>
                                    <div className='linefrom' id={`linefrom_${nd.id}`} style={getLineStyle({state:this.state, nd, type:'lineFrom'})}></div>
                                    <div className='lineto' id={`lineto_${nd.id}`} style={getLineStyle({state:this.state, nd, type:'lineTo'})}></div>
                                </div>
                            </>)
                        }

                        {/* 节点的展开按钮 */}
                        {
                            (nd.childs && 0<nd.childs.length) && 
                                <div id={`expbtn_${nd.id}`} className='expBtn' style={getExpBtnStyle({state:this.state, nd})}>
                                    {actExpBtnRenderer(nd)}
                                </div>
                        }
                    </React.Fragment>))
                }
            </div>
        );
    }
}

const getExpBtnStyle=createSelector(
    json=>json.state,
    json=>json.nd,
    (state,nd)=>(
        (nd && state.expBtnStyles && state.expBtnStyles[nd.id]) ? state.expBtnStyles[nd.id] : {}
    )
);

const getLineStyle=createSelector(
    json=>json.state,
    json=>json.nd,
    json=>json.type,
    (state,nd,type)=>(
        (nd && state.lineStyles && state.lineStyles[nd.id] && state.lineStyles[nd.id][type]) ? 
            state.lineStyles[nd.id][type] 
                : 
            {}
    )
);

const getNdBorderStyle=(nd)=>{
    if(!nd){
        return {};
    }

    //根节点不设置边框，其样式由render props自己设置
    if(0===nd.lev){
        return {};
    }
    //二级节点使用四周的边框
    if(1===nd.lev){
        return {
            borderRadius: 5,
            border:`1px solid ${nd.color}`
        };
    }
    //其他节点使用下边框
    return {borderBottom:`1px solid ${nd.color}`};
}

const getNdStyle=createSelector(
    json=>json.state,
    json=>json.nd,
    (state,nd)=>{
        let borderStyle=getNdBorderStyle(nd);
        let positionStyle=((nd && state.ndStyles && state.ndStyles[nd.id]) ? state.ndStyles[nd.id]: {});
        return {...borderStyle, ...positionStyle};
    }
);



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
        // paddingTop:10,
        paddingTop:0,
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