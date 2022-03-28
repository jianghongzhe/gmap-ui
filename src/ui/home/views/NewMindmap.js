/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useState } from 'react';
import {Alert,Row, Col} from 'antd';
import {createSelector} from 'reselect';
import newMindmapSvc from '../../../service/newMindmapSvc';
import objectCloneUtil from '../../../common/objectCloneUtil';
import { useRafState } from 'ahooks';


/**
 * 导图组件
 * @param {*} props 
 */
const NewMindmap=(props)=>{

    const [{ndStyles, lineStyles, expBtnStyles, wrapperStyle},setAllStyles]=useRafState({
        ndStyles:{}, 
        lineStyles:{}, 
        expBtnStyles:{}, 
        wrapperStyle:{}
    });

    const arrangeNdPositions=useCallback(()=>{
        if(!props.ds){return;}

        console.log("origin ds", props.ds);
        console.log("clone ds", objectCloneUtil.clone(props.ds))

        newMindmapSvc.loadStyles(props.ds);
        setAllStyles({
            ndStyles:       props.ds.ndStyles, 
            lineStyles:     props.ds.lineStyles, 
            expBtnStyles:   props.ds.expBtnStyles,
            wrapperStyle:   props.ds.wrapperStyle,
        });
        putRelaLines(props.ds.ndStyles);
    },[props.ds]);

    const defaultContentRenderer=useCallback((nd)=>{
        return ""+nd.str;
    },[]);

    const defaultExpBtnRenderer=useCallback((nd)=>{
        return nd.expand? "-":"+";
    },[]);


    useEffect(()=>{
        if(props.ds && props.ds.tree && props.ds.list && props.ds.map){
             setTimeout(arrangeNdPositions, 5);
            //arrangeNdPositions();
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


    

    console.log("popds", props.ds);

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

                    {/* 关联线 */}
                    {
                        nd.isRelaLineFrom && (<svg className="relaLine" fromid={nd.id} toid={nd.toid} xmlns="http://www.w3.org/2000/svg" version="1.1" style={{position:"absolute",zIndex:1,width:"200px",height:"200px",left:'-9999px',top:'-9999px',backgroundColor: "#EEEEEE00"}}>
                            <defs>
                                <marker id={`${nd.id}_${nd.toid}_arrow`} markerUnits="strokeWidth" markerWidth="12" markerHeight="12" viewBox="0 0 12 12" refX="6" refY="6" orient="auto">
                                    <path d="M2,2 L10,6 L2,10 L2,2" style={{fill:nd.relaLineColor}} />
                                </marker>
                            </defs>
                            <line x1="0" y1="0" x2="200" y2="200" style={{stroke:nd.relaLineColor, strokeWidth:1, strokeDasharray:"5px"}} markerEnd={`url(#${nd.id}_${nd.toid}_arrow)`}/>
                        </svg>)
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
        zIndex:2,
    },

    '& .expBtn':{
        ...baseFloatBlockStyle,
        ...outOfViewStyle,
        zIndex:2,   //折叠按钮显示在连接线的上层
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


const putRelaLines=(ndStyles)=>{
    
    const func=()=>{    
        document.querySelectorAll(".relaLine").forEach(svgEle=>{
            console.log('into putRelaLines');

            const lineEle=svgEle.querySelector("line");
            const fromId=svgEle.getAttribute("fromid");
            const toId=svgEle.getAttribute("toid");
            const ndFrom=document.querySelector(`#${fromId}`);
            const ndTo=document.querySelector(`#${toId}`);
            

            if(!ndFrom || !ndStyles || !ndStyles[fromId] || !ndStyles[fromId].left){
                svgEle.style.left="-9999px";
                svgEle.style.top="-9999px";
                return;
            }
            if(!ndTo || !ndStyles || !ndStyles[toId] || !ndStyles[toId].left){
                svgEle.style.left="-9999px";
                svgEle.style.top="-9999px";
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
            


            svgEle.style.left=`${pos.l}px`;
            svgEle.style.width=`${pos.w}px`;
            lineEle.setAttribute("x1",pos.x1);
            lineEle.setAttribute("x2",pos.x2);

            svgEle.style.top=`${pos.t}px`;
            svgEle.style.height=`${pos.h}px`;
            lineEle.setAttribute("y1", pos.y1);
            lineEle.setAttribute("y2", pos.y2);
        });
    };

    setTimeout(() => {
        window.requestAnimationFrame(func);
    }, 500);
};


export default React.memo(NewMindmap);