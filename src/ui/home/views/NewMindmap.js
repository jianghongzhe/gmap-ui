/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useState } from 'react';
import {Alert,Row, Col} from 'antd';
import {createSelector} from 'reselect';
import newMindmapSvc from '../../../service/newMindmapSvc';

/**
 * 导图组件
 * @param {*} props 
 */
const NewMindmap=(props)=>{

    const [{ndStyles, lineStyles, expBtnStyles, wrapperStyle},setAllStyles]=useState({
        ndStyles:{}, 
        lineStyles:{}, 
        expBtnStyles:{}, 
        wrapperStyle:{}
    });

    const arrangeNdPositions=useCallback(()=>{
        if(!props.ds){return;}
        newMindmapSvc.loadStyles(props.ds);
        setAllStyles({
            ndStyles:       props.ds.ndStyles, 
            lineStyles:     props.ds.lineStyles, 
            expBtnStyles:   props.ds.expBtnStyles,
            wrapperStyle:   props.ds.wrapperStyle,
        });
    },[props.ds]);

    const defaultContentRenderer=useCallback((nd)=>{
        return ""+nd.str;
    },[]);

    const defaultExpBtnRenderer=useCallback((nd)=>{
        return nd.expand? "-":"+";
    },[]);


    useEffect(()=>{
        if(props.ds && props.ds.tree && props.ds.list && props.ds.map){
            // setTimeout(arrangeNdPositions, 5000);
            arrangeNdPositions();
        }
    },[props.ds, arrangeNdPositions]);


    
    //校验
    if(!props.ds){
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
    if(false===props.ds.succ){
        return (<Row>
            <Col span={8} offset={8}>
                <Alert
                    css={{marginTop:50}}
                    message={props.ds.msg}
                    description={props.ds.desc}
                    type="error"/>
            </Col>
        </Row>);
    }
    if(!props.ds.list){
        return null;
    }


    //如果提供了节点渲染器或扩展按钮渲染器，则使用，否则使用默认的
    let actNdRenderer=defaultContentRenderer;
    let actExpBtnRenderer=defaultExpBtnRenderer;
    if(props.ndContentRenderer){
        actNdRenderer=props.ndContentRenderer;
    }
    if(props.ndExpBtnRenderer){
        actExpBtnRenderer=props.ndExpBtnRenderer;
    }


    



    const result= (
        <div css={{...defaultWrapperStyle, ...wrapperStyle}}  id={`graphwrapper_${props.ind}`}>
            {
                props.ds.list.map((nd,ind)=>(<React.Fragment key={'nd-'+ind}>
                    {/* 节点内容  css={nd.parid?{borderBottom:'1px solid lightgray'}:{}}*/}
                    <div className='item'  id={nd.id} style={getNdStyle({ndStyles, nd})}>
                        {actNdRenderer(nd)}
                    </div>

                    {/* 节点到父节点的连接线 */}
                    {
                        (nd.parid) && (<>
                            <div className='linewrapper' id={`line_${nd.id}`} style={getLineStyle({lineStyles, nd, type:'line'})}>
                                <div className='lineExp' id={`lineExp_${nd.id}`} style={getLineStyle({lineStyles, nd, type:'lineExp'})}></div>
                                <div className='linefrom' id={`linefrom_${nd.id}`} style={getLineStyle({lineStyles, nd, type:'lineFrom'})}></div>
                                <div className='lineto' id={`lineto_${nd.id}`} style={getLineStyle({lineStyles, nd, type:'lineTo'})}></div>
                            </div>
                        </>)
                    }

                    {/* 节点的展开按钮 */}
                    {
                        (nd.childs && 0<nd.childs.length) && 
                            <div id={`expbtn_${nd.id}`} className='expBtn' style={getExpBtnStyle({expBtnStyles, nd})}>
                                {actExpBtnRenderer(nd)}
                            </div>
                    }
                </React.Fragment>))
            }
        </div>
    );


    return result;
    
}

const getExpBtnStyle=createSelector(
    json=>json.expBtnStyles,
    json=>json.nd,
    (expBtnStyles,nd)=>(
        (nd && expBtnStyles && expBtnStyles[nd.id]) ? expBtnStyles[nd.id] : {}
    )
);

const getLineStyle=createSelector(
    json=>json.lineStyles,
    json=>json.nd,
    json=>json.type,
    (lineStyles,nd,type)=>(
        (nd && lineStyles && lineStyles[nd.id] && lineStyles[nd.id][type]) ? 
            lineStyles[nd.id][type] 
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
    json=>json.ndStyles,
    json=>json.nd,
    (ndStyles,nd)=>{
        let borderStyle=getNdBorderStyle(nd);
        let positionStyle=((nd && ndStyles && ndStyles[nd.id]) ? ndStyles[nd.id]: {});
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


const defaultWrapperStyle={
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

export default React.memo(NewMindmap);