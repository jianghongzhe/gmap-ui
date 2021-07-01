import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

const RelaChart=(props)=>{
    const containerRef=useRef();
    const chartRef=useRef();

    
    console.log("chart",props);
    

    const setContainerRef=(e)=>{
        if(e){
            containerRef.current=e;
        }
        if(containerRef.current && !chartRef.current){
            chartRef.current = echarts.init(containerRef.current);
        }
    };

    


    useEffect(()=>{
        if(chartRef.current){
            chartRef.current.resize();
            console.log("更新大小");
        }
    },[props.w, props.h, chartRef]);


    useEffect(()=>{
        if(props.opts && chartRef.current){
            chartRef.current.setOption(getOption(props.opts), true);    
            console.log("更新选项");
        }
    },[props.opts, chartRef]);

    // useEffect(()=>{
    //     if(chartRef.current){
    //         chartRef.current.resize();
    //         console.log("更新大小11");
    //     }
    //     if(props.opts && chartRef.current){
    //         chartRef.current.setOption(getOption(props.opts), true);    
    //         console.log("更新选项11");
    //     }
    // },[props.forceRender]);


    

    return <div ref={setContainerRef} style={{
        width:`${props.w || 600}px`,
        height:`${props.h || 400}px`,
    }}></div>
};

/**
 * 生成echart选项对象
 * @param {*} sumOpts [
 *      ["人物1", "人物2", "关系"],
 *      ["人物3", "人物4", "关系"],
 *      ...
 * ]
 */
const getOption=(sumOpts)=>{
    let names=[];
    sumOpts.forEach(line=>{
        names.push(line[0]);
        names.push(line[1]);
    });
    names=Array.from(new Set(names));
    
    const data=names.map(item=>({name:item}));
    const links=sumOpts.map(line=>({
        source: line[0],
        target: line[1],
        //symbolSize: [4, 10],
        label: {
            show: true,
            formatter:line[2] ? line[2] : "",
        },
        tooltip:{
            show:line[2] ? true : false,
            formatter:line[2] ? line[2] : "",
        },
    }));

    return {
        ...baseOption,
        series:[
            {
                ...baseOption.series[0],
                data,
                links,
            }
        ]
    };
};

/**
 * echart的选项对象的模板
 */
const baseOption= {
    title: {
        text: ''
    },
    tooltip: {
        show:true,
        trigger:'item',
    },
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    color:['#5470c6','#91cc75','#fac858','#ee6666','#73c0de','#3ba272', '#fc8452','#9a60b4','#ea7ccc',],
    textStyle:{
        width:60,
        overflow:'truncate',
        ellipsis:'...',
    },
    series: [
        {
            type: 'graph',
            layout: 'force',
            force: {
                repulsion: 4000
            },
            symbolSize: 60,
            roam: true,
            draggable:true,
            emphasis:{
                focus: 'adjacency',
            },
            label: {
                show: true,
                formatter:"{b}",
            },
            edgeSymbol: ['none', 'arrow',/*'none', 'none'*/],
            edgeSymbolSize: [0,10,/*10*/],
            edgeLabel: {
                fontSize: 12
            },
            tooltip:{
                show:true,
                formatter:"{b}",
            },
            lineStyle: {
                opacity: 0.9,
                width: 1,
                curveness: 0
            },

            data: [
                /*
                此部分为动态生成
                {name: '节点111'}, 
                */
            ],
            
            links: [
                /*
                此部分为动态生成
                {
                    source: 0,
                    target: 1,
                    symbolSize: [5, 20],
                    label: {
                        show: true,
                        formatter:"父子11"
                    },
                    tooltip:{
                        show:true,
                        formatter:"父子11"
                    },
                }
                */
            ],
            
        }
    ]
};

export default RelaChart;