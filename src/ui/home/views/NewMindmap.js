import React, {useCallback, useEffect, useMemo} from 'react';
import {Alert, Col, Row} from 'antd';
import mindLayoutSvcFacade from '../../../service/mindLayoutSvcFacade';
import {useRafState} from 'ahooks';
import globalStyleConfig from '../../../common/globalStyleConfig';


/**
 * 导图组件
 * @param {*} props 
 */
const NewMindmap=({ds, ndContentRenderer, ndExpBtnRenderer, ind: tabInd})=>{

    const [{ndStyles, lineStyles, expBtnStyles, wrapperStyle, relaLineStyles},setAllStyles]=useRafState({
        ndStyles:{}, 
        lineStyles:{}, 
        expBtnStyles:{}, 
        wrapperStyle:{},
        relaLineStyles: {},
    });


    /**
     * 在节点数据变化后，计算节点和连接线的css样式，再设置样式值触发新一次渲染
     */
    useEffect(()=>{
        if(ds && ds.tree && ds.list && ds.map){
            setTimeout(()=>{
                const styles= mindLayoutSvcFacade.loadStyles(ds);
                const relaLineStyles=getRelaLineStyles(styles.ndStyles);
                setAllStyles({
                    ndStyles:       styles.ndStyles, 
                    lineStyles:     styles.lineStyles, 
                    expBtnStyles:   styles.expBtnStyles,
                    wrapperStyle:   styles.wrapperStyle,
                    relaLineStyles,
                });
            }, 5);
        }
    },[ds, setAllStyles]);


    const getExpBtnStyle=useCallback((nd)=>(
        (nd && expBtnStyles && expBtnStyles[nd.id]) ? expBtnStyles[nd.id] : {}   
    ),[expBtnStyles]);


    const getNdStyle=useCallback((nd)=>{
        let borderStyle=getNdBorderStyle(nd, ds.tree);
        const hasNdStyle=(nd && ndStyles && ndStyles[nd.id]);
        let positionStyle=(hasNdStyle ? ndStyles[nd.id]: {});
        let result={...borderStyle, ...positionStyle};

        // 如果节点样式中不包含位置信息，说明是不显示的节点，则增加visibility:hidden样式，以防止被网页内查找搜索到
        const hasPos=(result.left && result.left>0 && result.top && result.top>0);
        if(!hasPos){
            result={
                ...result,
                visibility:"hidden",
            };
        }
        return result;
    },[ndStyles, ds]);


    const getLineStyle=useCallback((nd,type)=>{
        return (nd && lineStyles && lineStyles[nd.id] && lineStyles[nd.id][type]) ? 
            lineStyles[nd.id][type] 
                : 
            {};
    },[lineStyles]);


    const getRelaLineWrapperStyle=useCallback((fromId, toId)=>{
        if(!relaLineStyles[`${fromId}_${toId}`] || !relaLineStyles[`${fromId}_${toId}`].svgStyle){
            return {
                left:"-9999px",
                top: "-9999px",
            };
        }
        return relaLineStyles[`${fromId}_${toId}`].svgStyle;
    },[relaLineStyles]);

    const getRelaLinePos=useCallback((fromId, toId)=>{
        if(!relaLineStyles[`${fromId}_${toId}`] || !relaLineStyles[`${fromId}_${toId}`].linePos){
            return {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0,
            };
        }
        return relaLineStyles[`${fromId}_${toId}`].linePos;
    },[relaLineStyles]);


    //如果提供了节点渲染器或扩展按钮渲染器，则使用，否则使用默认的
    const actNdRenderer=useMemo(()=>{
        if(ndContentRenderer){
            return ndContentRenderer;
        }
        return (nd)=>(nd ? ""+nd.str : "");
    },[ndContentRenderer]); 
    

    const actExpBtnRenderer=useMemo(()=>{
        if(ndExpBtnRenderer){
            return ndExpBtnRenderer;
        }
        return (nd)=>(nd ? (nd.expand? "-":"+") : "");
    },[ndExpBtnRenderer])  
    



    
    // 非正常状态时的渲染
    if(!ds){
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
    if(false===ds.succ){
        return (<Row>
            <Col span={8} offset={8}>
                <Alert
                    css={{marginTop:50}}
                    message={ds.msg}
                    description={ds.desc}
                    type="error"/>
            </Col>
        </Row>);
    }
    if(!ds.list){
        return null;
    }

    // 正常渲染
    return (
        <div css={{...defaultWrapperStyle, ...wrapperStyle}}  id={`graphwrapper_${tabInd}`}>
            {
                ds.list.map((nd,ind)=>(<React.Fragment key={'nd-'+ind}>
                    {/* 节点内容  css={nd.parid?{borderBottom:'1px solid lightgray'}:{}}*/}
                    <div className='item'  id={nd.id} style={getNdStyle(nd)}>
                        {actNdRenderer(nd, ds.tree)}
                    </div>

                    {/* 节点到父节点的连接线 */}
                    {
                        (nd.parid) && (<>
                            <div className='linewrapper' id={`line_${nd.id}`} style={getLineStyle(nd,'line')}>
                                <div className='lineExp' id={`lineExp_${nd.id}`} style={getLineStyle(nd,'lineExp')}></div>
                                <div className='linefrom' id={`linefrom_${nd.id}`} style={getLineStyle(nd, 'lineFrom')}></div>
                                <div className='lineto' id={`lineto_${nd.id}`} style={getLineStyle(nd, 'lineTo')}></div>
                            </div>
                        </>)
                    }

                    {/* 节点的展开按钮 */}
                    {
                        (nd.childs && 0<nd.childs.length) && 
                            <div id={`expbtn_${nd.id}`} className='expBtn' style={getExpBtnStyle(nd)}>
                                {actExpBtnRenderer(nd, ds.expands)}
                            </div>
                    }

                    {/* 关联线 */}
                    {
                        nd.isRelaLineFrom && nd.toids.map((toid, ind)=>(
                            <svg key={`toid_${toid}`} className="relaLine" fromid={nd.id} toid={toid} xmlns="http://www.w3.org/2000/svg" version="1.1" style={getRelaLineWrapperStyle(nd.id, toid)}>
                                <defs>
                                    <marker id={`${nd.id}_${toid}_arrow`} markerUnits="strokeWidth" markerWidth="12" markerHeight="12" viewBox="0 0 12 12" refX="6" refY="6" orient="auto">
                                        <path d="M2,2 L10,6 L2,10 L2,2" style={{fill:nd.relaLineColors[ind]}} />
                                    </marker>
                                </defs>
                                <line {...getRelaLinePos(nd.id, toid)} style={{stroke:nd.relaLineColors[ind], strokeWidth:1, strokeDasharray:"5px"}} markerEnd={`url(#${nd.id}_${toid}_arrow)`}/>
                            </svg>
                        ))
                    }
                </React.Fragment>))
            }
        </div>
    );
}





const getNdBorderStyle=(nd, rootNd)=>{
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
    // 其他节点
    // 若为上下结构，使用四面边框，否则使用下边框
    if(true===rootNd.down || true===rootNd.up){
        return {
            borderRadius: 2,
            border:`1px solid ${nd.color}`
        };
    }
    return {borderBottom:`1px solid ${nd.color}`};
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
        zIndex: globalStyleConfig.nodeZIndex,
    },

    '& .expBtn':{
        ...baseFloatBlockStyle,
        ...outOfViewStyle,
        zIndex: globalStyleConfig.expBtnZIndex,   //折叠按钮显示在连接线的上层
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
    },

    '& .relaLine':{
        position:"absolute",
        zIndex: globalStyleConfig.relaLineZIndex,
        backgroundColor: "#EEEEEE00"
    },
};


/**
 * 计算连接线的样式，根据之前已经计算好的节点位置来记算
 * @param {*} ndStyles 
 * @returns 
 */
const getRelaLineStyles=(ndStyles)=>{
    const styles={};
    
    document.querySelectorAll(".relaLine").forEach(svgEle=>{
        const fromId=svgEle.getAttribute("fromid");
        const toId=svgEle.getAttribute("toid");
        const ndFrom=document.querySelector(`#${fromId}`);
        const ndTo=document.querySelector(`#${toId}`);
        
        // 如果没有取得需要的数据，则生成一个屏幕之外的默认样式
        const noEnoughConditon=(
            (!ndFrom || !ndStyles || !ndStyles[fromId] || !ndStyles[fromId].left) || 
            (!ndTo || !ndStyles || !ndStyles[toId] || !ndStyles[toId].left)
        );
        if(noEnoughConditon){
            styles[`${fromId}_${toId}`]={
                svgStyle: {
                    left:"-9999px",
                    top: "-9999px",
                },
                linePos:{
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 0,
                },
            };
            return;
        }


        let tmp=ndFrom.getBoundingClientRect();
        const rect1= {
            width: tmp.width,
            height: tmp.height,
            left: ndStyles[fromId].left,
            top: ndStyles[fromId].top,
        };

        
        console.log("to", ""+ndTo+"");
        tmp=ndTo.getBoundingClientRect();
        const rect2= {
            width: tmp.width,
            height: tmp.height,
            left: ndStyles[toId].left,
            top: ndStyles[toId].top,
        };

        
        const fromCenter=[parseInt(rect1.left+rect1.width/2), parseInt(rect1.top+rect1.height/2)];
        const toCenter=[parseInt(rect2.left+rect2.width/2), parseInt(rect2.top+rect2.height/2)];
        

        

        // 计算两个元素上下左右关系
        // 如果上下距离比左右大，连接线从左右中间开始
        // 如果左右距离比上下大，连接线从上下中间开始

        const pos={
            l:0,
            t:0,
            w:0,
            h:0,
            x1:0,
            x2:0,
            y1:0,
            y2:0,
        };

        let typeX;
        let typeY;


        const moveX=(num)=>{
            pos.l+=num;
        };
        const moveY=(num)=>{
            pos.t+=num;
        };
        const scaleX=(num)=>{
            pos.w+=num;
            if(pos.x1<pos.x2){
                pos.x2+=num;
            }else{
                pos.x1+=num;
            }
        };
        const scaleY=(num)=>{
            pos.h+=num;
            if(pos.y1<pos.y2){
                pos.y2+=num;
            }else{
                pos.y1+=num;
            }
        };
        const padX=(num)=>{
            pos.w+=num*2;
            pos.l-=num;
            pos.x1+=num;
            pos.x2+=num;
        };
        const padY=(num)=>{
            pos.h+=num*2;
            pos.t-=num;
            pos.y1+=num;
            pos.y2+=num;
        };

        
        


        // 水平方向
        // 左->右，无重叠部分
        if(rect1.left+rect1.width<rect2.left){
            pos.l=rect1.left+rect1.width;
            pos.w=rect2.left-rect1.left-rect1.width;
            pos.x1=0;
            pos.x2=rect2.left-rect1.left-rect1.width;
            scaleX(-4);
            typeX=1;

            console.log("左->右，无重叠部分");
        }
        // 右->左，无重叠部分
        else if(rect2.left+rect2.width<rect1.left){
            pos.l=rect2.left+rect2.width;
            pos.w=rect1.left-rect2.left-rect2.width;
            pos.x1=rect1.left-rect2.left-rect2.width;
            pos.x2=0;
            scaleX(-4);
            moveX(4);
            typeX=2;
        }
        // 有重叠
        else{
            pos.l=Math.min(fromCenter[0], toCenter[0]);
            pos.w=Math.abs(toCenter[0]-fromCenter[0]);
            pos.x1=(fromCenter[0] < toCenter[0] ? 0 : pos.w);
            pos.x2=pos.w-pos.x1;
        }


        // 垂直方向
        // 上->下，无重叠部分
        if(rect1.top+rect1.height<rect2.top){
            pos.t=rect1.top+rect1.height;
            pos.h=rect2.top-rect1.top-rect1.height;
            pos.y1=0;
            pos.y2=rect2.top-rect1.top-rect1.height;
            scaleY(-4);
            typeY=1;

            console.log("上->下，无重叠部分");
        }
        // 下->上，无重叠部分
        else if(rect2.top+rect2.height<rect1.top){
            pos.t=rect2.top+rect2.height;
            pos.h=rect1.top-rect2.top-rect2.height;
            pos.y1=rect1.top-rect2.top-rect2.height;
            pos.y2=0;
            scaleY(-4);
            moveY(4);
            typeY=2;
        }else{
            pos.t=Math.min(fromCenter[1],toCenter[1]);
            pos.h=Math.abs(toCenter[1]-fromCenter[1]);
            pos.y1=(fromCenter[1]<toCenter[1] ? 0 : pos.h);
            pos.y2=pos.h-pos.y1;
        }

        if(1===typeY && (1===typeX || 2===typeX) && pos.w>pos.h){
            pos.t=fromCenter[1];
            pos.h=toCenter[1]-fromCenter[1];
            pos.y1=0;
            pos.y2=toCenter[1]-fromCenter[1];

            console.log("111 "+pos.w+" "+pos.h);
        }
        else if(2===typeY && (1===typeX || 2===typeX) && pos.w>pos.h){
            pos.t=toCenter[1];
            pos.h=fromCenter[1]-toCenter[1];
            pos.y1=fromCenter[1]-toCenter[1];
            pos.y2=0;

            console.log("222");
        }
        else if(1===typeX && (1===typeY || 2===typeY) && pos.w<=pos.h){
            pos.l=fromCenter[0];
            pos.w=toCenter[0]-fromCenter[0];
            pos.x1=0;
            pos.x2=toCenter[0]-fromCenter[0];

            console.log("333 "+pos.w+" "+pos.h);
        }
        else if(2===typeX && (1===typeY || 2===typeY) && pos.w<=pos.h){
            pos.l=toCenter[0];
            pos.w=fromCenter[0]-toCenter[0];
            pos.x1=fromCenter[0]-toCenter[0];
            pos.x2=0;

            console.log("444");
        }



        // 留出一些空间用于
        padX(10);
        padY(10);
        


        // svgEle.style.left=`${pos.l}px`;
        // svgEle.style.width=`${pos.w}px`;
        // lineEle.setAttribute("x1",pos.x1);
        // lineEle.setAttribute("x2",pos.x2);

        // svgEle.style.top=`${pos.t}px`;
        // svgEle.style.height=`${pos.h}px`;
        // lineEle.setAttribute("y1", pos.y1);
        // lineEle.setAttribute("y2", pos.y2);


        styles[`${fromId}_${toId}`]={
            svgStyle: {
                left:`${pos.l}px`,
                top: `${pos.t}px`,
                width: `${pos.w}px`,
                height: `${pos.h}px`,
            },
            linePos:{
                x1: pos.x1,
                y1: pos.y1,
                x2: pos.x2,
                y2: pos.y2,
            },
        };
    });
    return styles;
};


export default React.memo(NewMindmap);