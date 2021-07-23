/** @jsxImportSource @emotion/react */
import React, {  useCallback, useEffect, useRef, useState } from 'react';
import { Progress, Table,Popover } from 'antd';
import { RightOutlined } from '@ant-design/icons';

import {createSelector} from 'reselect';

/**
 * 甘特图组件
 * @param {*} props 
 */
const GantChart=(props)=>{
    const [arrows, setArrows]=useState([]);
    const [gantEleId]=useState(()=>'ganttTable-'+new Date().getTime());
    const lastScrollTimeRef=useRef(0);
    const scrollTimerRef=useRef(null);
  


    


    /**
     * 摆放箭头位置
     */
    const putArrows=useCallback(()=>{
        let arrows=[];

        //边界范围定义
        let eleFirstCell=document.querySelector(`#${gantEleId} table tr:nth-child(1) th:nth-child(1)`);
        let eleLastCell=document.querySelector(`#${gantEleId} .ant-table-body`);
        if(!eleFirstCell || !eleLastCell){
            return;
        }
        
        let firstRect=eleFirstCell.getBoundingClientRect();
        let lastRect=eleLastCell.getBoundingClientRect();
        
        let arrowBounds={
            l: firstRect.right,
            t: firstRect.bottom,
            r: lastRect.right,
            b: lastRect.bottom,
        }


        //根据连接关系计算每组连接线的位置（css样式）
        props.arrows.forEach((rela)=>{
            //起始单元格与结束单元格位置
            let shouldHidden=false;//用于判断当连接线超出边界范围时不显示
            let eleFrom=document.querySelector(`#${gantEleId} table tr:nth-child(${rela.from[0]+2}) td:nth-child(${rela.from[1]+1})`);
            let eleTo=document.querySelector(`#${gantEleId} table tr:nth-child(${rela.to[0]+2}) td:nth-child(${rela.to[1]+1})`);
            if(!eleFrom || !eleTo){
                return;
            }

            let tdFrom=eleFrom.getBoundingClientRect();
            let tdTo=eleTo.getBoundingClientRect();
            

            
            //连接线起点端：从起始单元格右侧开始
            let from={
                left:tdFrom.right,
                top:tdFrom.top+parseInt(tdFrom.height/2),
                width:20,
                height:parseInt(tdFrom.height/2),
                borderRight:`1px solid ${colors.joinLine}`,
                borderTop:`1px solid ${colors.joinLine}`,
                // borderTopRightRadius:'6px',
            };
            
            //连接线结束点端：到结束单元格左侧结束
            let to={
                left:tdTo.left-20-1,
                top:tdTo.top,
                width:20,
                height:parseInt(tdTo.height/2),
                borderLeft:`1px solid ${colors.joinLine}`,
                borderBottom:`1px solid ${colors.joinLine}`,
            };

            //结束点处的箭头
            let posArrow={
                left:to.left+to.width-8,
                top:to.top+to.height-7,
                color:`${colors.joinLine}`,
            };

            //之间的连接线
            let fromx=from.left+from.width;
            let fromy=from.top+from.height;
            let tox=to.left;
            let toy=to.top;

            let join1={
                left:parseInt(Math.min(fromx,tox)),
                top:from.top+from.height,
                width:1,
                height:parseInt(Math.abs(fromy-toy)),
                backgroundColor:colors.joinLine,
            }

            let join2={
                height:1,
                width:parseInt(Math.abs(fromx-tox)),
                left: parseInt(Math.min(fromx,tox)),
                backgroundColor:colors.joinLine,
            }

            // let coner1={};
            // let coner2={};

            //连接线位置校准
            if(fromx<=tox){
                join2.top=join1.top+join1.height;
                --join1.left;
                --join2.left;
                join2.width+=2;

                join1.height+=to.height;
                join2.top+=to.height-1;
                to.borderLeft='0px';
            }else{
                join2.top=from.top+from.height;
                // to.borderBottomLeftRadius='6px';

                // coner2={
                //     left:parseInt(Math.min(fromx,tox)),
                //     top:join2.top,
                //     borderTopLeftRadius:'6px',
                //     borderLeft:`1px solid ${colors.joinLine}`,
                //     borderTop:`1px solid ${colors.joinLine}`,
                //     width:'6px',
                //     height:'6px',
                // };
                // join1.top+=6;
                // //join1.height-=6;
                // join2.left+=6;
                // join2.width-=6;

                // to.top+=6;
                // to.height-=6;

                // from.borderBottomRightRadius='6px';
                // from.borderBottom=`1px solid ${colors.joinLine}`;
                // from.height+=1;
                // join2.width-=6;
                
            }

            
                       
            //上下左右四个边框超出则不显示连接线
            if(tdFrom.right<arrowBounds.l || tdTo.left<arrowBounds.l){
                shouldHidden=true;
            }
            if(from.top<arrowBounds.t){
                shouldHidden=true;
            }
            if(Math.max(from.left+from.width, to.left+to.width)>arrowBounds.r){
                shouldHidden=true;
            }
            if(Math.max(from.top+from.height, to.top+to.height)>arrowBounds.b){
                shouldHidden=true;
            }
            if(shouldHidden){
                from.display="none";
                to.display="none";
                join1.display="none";
                join2.display="none";
                posArrow.display="none";
                // coner1.display="none";
                // coner2.display="none";
            }

            arrows.push({
                st:from,
                end:to,
                join1:join1,
                join2:join2,
                head:posArrow,
                // coner1:coner1,
                // coner2:coner2,
            });
        });

        setArrows(arrows);
    },[props.arrows, setArrows, gantEleId]);


    /**
     * 延时执行设置箭头位置
     * @param {*} delayMore 如果指定为true，则延迟更长的时间（3s）再执行操作，否则按默认的时间间隔
     */
    const debouncePutArrows=useCallback((delayMore=undefined)=>{
        //与上次计算时间间隔太小，取消上次的任务
        let time=new Date().getTime();
        if(time-lastScrollTimeRef.current<debounceInterval){
            if(null!==scrollTimerRef.current){
                clearTimeout(scrollTimerRef.current);
            }
        }

        //延时执行
        lastScrollTimeRef.current=time;
        scrollTimerRef.current=setTimeout(putArrows,true===delayMore?3000: debounceInterval);
    },[putArrows]);



    useEffect(()=>{
        //注册有滚动事件以计算箭头位置，并且现在触发一次计算
        setTimeout(() => {
            let ele=document.querySelector(`#${gantEleId} .ant-table-body`);
            if(ele){
                ele.addEventListener("scroll",debouncePutArrows);
            }
            debouncePutArrows();
        }, 200);

        return ()=>{
            let ele=document.querySelector(`#${gantEleId} .ant-table-body`);
            if(ele){
                ele.removeEventListener("scroll",debouncePutArrows);
            }
        }
    },[debouncePutArrows, gantEleId]);

    useEffect(()=>{
        debouncePutArrows();
    },[props.layoutArrows, debouncePutArrows]);


    
        

    if(!props.ds || !props.ds[0] || !props.colKeys || !props.colKeys[0] || !props.arrows){
        return null;
    }

    //动态计算列配置信息
    let colsConfig=getDynaCols({data:props.ds, colKeys:props.colKeys, winW:props.winW});
    
    //滚动高度：该配置如果省略，即表格不纵向滚动，则表格布局会发生变化，一些dom元素取不到，不能完成箭头定位
    let graphH={y:400};
    if(props.maxh){
        graphH={y:props.maxh};
    }
    
    // console.log("ds",props.ds);

    return (<React.Fragment key='gantconatiner'>
        {/* 表格部分 */}
        <Table id={gantEleId} tableLayout='fixed' size="small" bordered={true} pagination={false} 
                scroll={{x:'max-content', ...graphH}} 
                dataSource={props.ds} 
                columns={colsConfig} />

        {/* 连接线部分 */}
        {
            arrows.map((each,ind)=>(
                <React.Fragment key={'arrow-'+ind}>
                    <div key={'arrow-st-'+ind} css={{...joinLineStyle, ...each.st}}></div>
                    <div key={'arrow-end-'+ind} css={{...joinLineStyle, ...each.end}}></div>
                    <div key={'arrow-join1-'+ind} css={{...joinLineStyle, ...each.join1}}></div>
                    <div key={'arrow-join2-'+ind} css={{...joinLineStyle, ...each.join2}}></div>
                    {/* <div key={'arrow-coner1-'+ind} css={{...joinLineStyle, ...each.coner1}}></div>
                    <div key={'arrow-coner2-'+ind} css={{...joinLineStyle, ...each.coner2}}></div> */}
                    <RightOutlined key={'arrow-head-'+ind} css={{...joinArrowStyle, ...each.head}}/>
                </React.Fragment>
            ))
        } 
    </React.Fragment>);
    
}


/**
 * 根据数据和列名，动态生成columns对象
 */
const getDynaCols=createSelector(
    info=>info.data,
    info=>info.colKeys,
    info=>info.winW,
    (data,colKeys,winW)=>{
        const columns = [];
        let firstCol=null;
        let currMonth=null;

        colKeys.forEach((colKey,ind)=>{
            //第一列任务名称
            if(0===ind){
                columns.push({
                    title: colKey[1],
                    dataIndex: colKey[0],
                    key: colKey[0],
                    align:'center',
                    fixed:'left',
                    width: (winW<=1920? 300 : 400), //400
                    render: (text, row, index) => {
                        // if(1<2){return '1';}
                        const obj = {
                            children:<>{text.map((line,ind)=>(<React.Fragment key={'f0-'+ind}>{(0<ind) && <br key={'br'+ind}/>}<span key={'task-'+ind}>{line}</span></React.Fragment>))}</>,
                            props: {style:{textAlign:'left',}},
                        };
                        return obj;
                    }
                });
                return;
            }

            //是否是今天、是否是休息日、是否是月首日
            let dataCell=data[0][colKey[0]];
            // let isCurrday=dataCell.isCurrDay;
            // let isHoliday= dataCell.isHoliday;
            // let isFirstDay= dataCell.isFirstDay;

            
            //添加各日期列的数据
            let secondCol={
                title:<>{colKey[1].map((line,titleind)=>(<React.Fragment key={'f-'+ind+'-'+titleind}>{(0<titleind) && <br key={'br'+ind}/>}<span key={'head-day-'+titleind}>{line}</span></React.Fragment>))}</>,
                dataIndex: colKey[0],
                key: colKey[0],
                width:40,
                align:'center',
                onHeaderCell:()=>{
                    const ret={style:{padding:'0px',}};
                    if(dataCell.headerShouldShowSetCurrdayBg){
                        ret.style.backgroundColor=colors.currday;
                    }
                    if(dataCell.headerShouldShowSetFirstDayBg){
                        ret.style.backgroundColor=colors.firstDay;
                    }
                    if(dataCell.headerShouldShowSetHolidayBg){
                        ret.style.backgroundColor=colors.holiday;
                    }
                    return ret;
                },
                render: (text, row, index) => {
                    // if(1<2){return '1';}

                    const ret={
                        children:null,
                        props:{
                            colSpan:text.span,
                            style:{padding:'0px',}
                        }
                    };
                    

                    //不同日期类型对应不同背景色
                    if(text.shouldSetCurrDayBg){
                        // if(text.percentBg){
                        //     ret.props.style.backgroundImage=`linear-gradient(${colors.currday},${colors.currday})`;
                        //     ret.props.style.backgroundPosition=`${text.percentBg[0]}% 0px`;
                        //     ret.props.style.backgroundSize=`${text.percentBg[1]}% 100%`;
                        //     ret.props.style.backgroundRepeat="no-repeat";
                        // }else{
                            ret.props.style.backgroundColor=colors.currday;
                        // }
                    }

                    if(text.shouldSetHolidayBg){
                        ret.props.style.backgroundColor=colors.holiday;
                    }

                    if(text.shouldSetFirstDayBg){
                        ret.props.style.backgroundColor=colors.firstDay;
                    }
                    if(text.shouldShowPercentBg){
                        let allBgStyle={
                            im:[],
                            pos:[],
                            size:[],
                            repeat:[],
                        };
                        text.percentBg.forEach(eachbg=>{
                            let color=(eachbg.isHoliday?colors.holiday:(eachbg.isFirstDay?colors.firstDay:colors.currday));
                            allBgStyle.im.push(`linear-gradient(${color},${color})`);
                            allBgStyle.pos.push(`${eachbg.st}% 0px`);
                            allBgStyle.size.push(`${eachbg.wid}% 100%`);
                            allBgStyle.repeat.push("no-repeat");
                        });

                        ret.props.style.backgroundImage=allBgStyle.im.join(", ");
                        ret.props.style.backgroundPosition=allBgStyle.pos.join(", ");
                        ret.props.style.backgroundSize=allBgStyle.size.join(", ");
                        ret.props.style.backgroundRepeat=allBgStyle.repeat.join(", ");
                    }

               
                    //进度图
                    if(text.hasProg){
                        ret.children=(
                            <Popover title={<>
                                {"success"===text.progSt && <div css={popoverStyle[text.progSt]}>已完成</div>}
                                {"exception"===text.progSt && <div css={popoverStyle[text.progSt]}>已超期，完成 {text.prog}%</div>}
                                {"active"===text.progSt && <div css={popoverStyle[text.progSt]}>进行中，完成 {text.prog}%</div>}
                            </>} content={<>
                                {!Array.isArray(text.msg) &&　<div>{text.msg}</div>}
                                {Array.isArray(text.msg) &&　text.msg.map((msgitem,ind)=>(
                                    <span key={'progmsgs-'+ind} css={msgitem.strong ? popoverStyle.highlightTxt : {}}>{msgitem.txt}</span>
                                ))}                               
                            </>}  trigger="hover">
                                <Progress disabled percent={text.prog}  trailColor={colors.progTrail} showInfo={false} status={text.progSt}  />
                            </Popover>
                        );
                    }
                    
                    return ret;
                }
            }


            //第一行标题的处理
            //与上条记录同月就追加
            const month=colKey[2][0]+"-"+colKey[2][1];
            if(currMonth===month){
                firstCol.children.push(secondCol);
                return;
            }
            //否则说新建
            currMonth=month;
            firstCol={
                title:month,
                align:'center',
                children:[
                    secondCol
                ]
            };
            columns.push(firstCol);
        });


        return columns;
    }
);

const popoverStyle={
    success: {color:'green',textAlign:'center'},
    exception:{color:'red',textAlign:'center'},
    active:{color:'#1890ff',textAlign:'center'},

    highlightTxt: {fontWeight:'bolder',display:'inline-block',marginLeft:5, marginRight:5,},
}

const joinLineStyle={
    position:'fixed',
    width:'0px',
    height:'0px',
    backgroundColor:'transparent', 
    border:'0px solid gray',
    zIndex:1
};

const joinArrowStyle={
    position:'fixed',
    backgroundColor:'transparent',
    zIndex:1, 
    fontSize:'12px'
};

//各种颜色：今天的背景色、休息日的背景色、连接线的颜色等
const colors={
    progTrail:'#DDD',
    firstDay:'#fcffe6',//'green',
    currday:'#ffe7ba',  //'#ffe7ba';
    holiday:'#f9f9f9',
    joinLine:'#fa8c16',//'#fa8c16',//'orange',//'#FCA236',//'grey',//'gray',//"red",
};


const debounceInterval=500;

export default GantChart;