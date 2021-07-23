import dateUtil from '../common/dateUtil';

class GanttSvc{
    /**
     * 解析甘特图的一行记录，如果失败返回false，成功返回解析后的对象
     */
    parseGantItem=(str="")=>{
        /*
        配置
        使用两个逗号分隔的四部分：id, 起始日期/上个任务id, 结束日期/天数, 进度（0~100）
        g:task1,20.3.5,20.4.5,40   //id  起始日期 结束日期 进度
        g:taskx,20.3.5,12,0         //id  起始日期 天数 进度
        g:taskm,task1,3,20          //id 从20.4.6开始（引用的任务的结果日期的后一天） 到20.4.8为结束日期，完成 20%
        */

        let ret=/^g[:]([^,]{1,50})[,]([^,]{1,50})[,]([-/.0-9]{1,8})[,]([0-9]{1,3})$/;
        let mathResult=str.match(ret);
        if(!mathResult){
            return false;
        }
        let id=mathResult[1];
        let startOrLastId=mathResult[2];
        let endOrDays=mathResult[3];
        let prog=parseInt(mathResult[4]);

        //开始日期或引用id
        let dateReg=/^[0-9]{2}[-/.][0-9]{1,2}[-/.][0-9]{1,2}$/;
        if(dateReg.test(startOrLastId)){
            startOrLastId={
                isDate:true,
                ymd:startOrLastId.replace(/[-/.]/g, '|').split('|').map((eachPart,ind) => parseInt(eachPart)+(0===ind?2000:0)),
            };
        }else{
            startOrLastId={
                isRef:true,
                refId:startOrLastId,
                ymd:null,
            };
        }

        //结束日期或天数
        if(dateReg.test(endOrDays)){
            endOrDays={
                isDate:true,
                ymd:endOrDays.replace(/[-/.]/g, '|').split('|').map((eachPart,ind) => parseInt(eachPart)+(0===ind?2000:0)),
            };
        }else if(/^[0-9]{1,5}$/.test(endOrDays)){
            endOrDays={
                isDays:true,
                days:parseInt(endOrDays),
                ymd:null,
            };
        }else{
            return false;
        }


        return {id,startObj:startOrLastId,endObj:endOrDays,prog};
    }


    /**
     * 把甘特图数据解析成最终表格需要的数据
     */
    parseGantData=(gantItems=[])=>{
        // let samples=[
        //     "g:task1,20.3.5,20.3.10,40",
        //     "g:taskx,20.3.9,4,50",
        //     "g:taskm,task1,10,100",
        //     "g:task4,20.4/6,3,30",
        //     "g:task4,20.4/6,3,30",
        //     "g:task4,20.4/6,3,30",
        //     "g:task4,20.4/6,3,30",
        //     "g:task4,20.4/6,3,30",
        //     "g:task4,20.4/6,3,30",
        //     "g:task4,20.4/6,3,30",
        //     "g:task4,20.4/6,10,30",
        // ];

        if(!gantItems || 0===gantItems.length){
            return {data:[],colKeys:[],relas:[]};
        }

        // let gantItems=[];
        let minDay=[2055,12,31];
        let maxDay=[2000,1,1];
        let daysSpan=0;
        

        //迭代每个对象，计算准确的开始结束日期，任务天数等
        gantItems.forEach((gant,ind)=>{
            //计算起始日期
            //起始日期是引用类型
            if(gant.startObj.isRef){
                let refItem=null;
                let refInd=-1;

                
                //按引用id查找引用的任务
                for(let i=0;i<ind;++i){
                    let ref=gantItems[i];
                    if(ref.id===gant.startObj.refId){
                        refInd=i;
                        refItem=ref;
                        break;
                    }
                }

                //如果没找到，并且格式为 refid+5、refid-3 的形式，
                let daysAdjust=0;
                let splitReg=/^(.+)([+-])([0-9]{1,3})$/;
                let matchItems=gant.startObj.refId.match(splitReg);
                if(null===refItem && matchItems){
                    let rid=matchItems[1];
                    let op=matchItems[2];
                    let days=parseInt(matchItems[3]);

                    for(let i=0;i<ind;++i){
                        let ref=gantItems[i];
                        if(ref.id===rid){
                            refInd=i;
                            refItem=ref;
                            break;
                        }
                    }

                    if(refItem){
                        daysAdjust=('+'===op?days:0-days);
                    }
                }


                

                // gantItems.forEach((ref,ind)=>{
                //     if(ref.id===gant.startObj.refId){
                //         refInd=ind;
                //         refItem=ref;
                //         return;
                //     }
                // });

                if(!refItem){
                    throw new Error(`甘特图中未找到依赖的任务项，请确保被依赖项必须出现在依赖项之前。任务名称：${gant.task}`);
                }
                if(!refItem.end){
                    throw new Error(`甘特图的被依赖项的时间无法计算得到。任务名称：${gant.task}`);
                }
                let tmpDate=dateUtil.addDays(refItem.end,1+daysAdjust);               
                gant.start=tmpDate;
                gant.hasDep=true;
                gant.depInd=refInd;
                console.log("gant.depInd",gant.depInd);
                //引用关系
            }
            //起始日期是固定的日期
            else{
                gant.start=gant.startObj.ymd;
            }

            //计算结束日期
            //结束日期是天数
            if(gant.endObj.isDays){
                if(!gant.start){
                    throw new Error("甘特图的起始时间无法计算得到");
                }
                
                let tmpDate=dateUtil.addDays(gant.start,gant.endObj.days-1);                
                gant.end=tmpDate;
                gant.days=gant.endObj.days;
            }
            //结束日期是固定的日期
            else{
                gant.end=gant.endObj.ymd;
                gant.days=dateUtil.distDays(gant.end,gant.start)+1;
            }


            if(dateUtil.dateLargeThan(gant.start,gant.end)){
                throw new Error(`甘特图的初始日期不能在结束日期之后。任务名称：${gant.task}`);
            }



            if(dateUtil.dateSmallThan(gant.start,minDay)){
                minDay=gant.start;
            }
            if(dateUtil.dateLargeThan(gant.end,maxDay)){
                maxDay=gant.end;
            }

            gant.overlim=false;
            if(dateUtil.dateSmallThan(gant.end,dateUtil.currDayYMD()) && gant.prog<100){
                gant.overlim=true;
            }

            // console.log("计算后",gant);
        });


        
        
        //日期范围边界至少比实际日期范围多 3 天
        minDay=dateUtil.addDays(minDay,-3);
        maxDay=dateUtil.addDays(maxDay,3);

        //保证日期间隔不小于30天
        daysSpan=dateUtil.distDays(minDay,maxDay);
        if(daysSpan<30){
            let supply=parseInt((30-daysSpan+1)/2);
            minDay=dateUtil.addDays(minDay,0-supply);
            maxDay=dateUtil.addDays(maxDay,supply);
            daysSpan=dateUtil.distDays(minDay,maxDay);
        }

        
        //  minDay[2]=1;
        
        
        // let eachMonthDays=[-1,31,28,31,30,31,30,31,31,30,31,30,31];
        // if(dateUtil.isLeapYear(maxDay[0])){
        //     eachMonthDays[2]=29;
        // }
        // maxDay[2]=eachMonthDays[maxDay[1]];
        // daysSpan=dateUtil.distDays(minDay,maxDay);

        // console.log(minDay.join("-")+" ~ "+maxDay.join("-"));


        // 所有的天生成数组，后面迭代用
        let alldays=[];
        for(let eachDay=minDay; dateUtil.dateSmallThan(eachDay,maxDay,true); eachDay=dateUtil.addDays(eachDay,1)){
            alldays.push(eachDay);
        }


        //列名称
        const colKeys=[]; // [ [colid,colname], [colid,colname,ymd], [colid,colname,ymd] ...  ]  从第2项起每项有ymd
        const yearColKeys=[];
        colKeys.push(['task','任务']);
        yearColKeys.push(['task','任务']);
        alldays.forEach((day,ind)=>{
            let prefix="";
            if([1,11,21].includes(day[2])){//遇到每月1、11、21号，则显示月份
                prefix=day[1]+".";
            }
            let title=[prefix+day[2],dateUtil.getWeekday(day)];//第一行日期，第二行星期
            colKeys.push(["d"+ind,title,day]);
        });

        
        
        let data=[];
        const relas=[];
        const currYMD=dateUtil.currDayYMD();

        //循环每行记录
        gantItems.forEach((gantLine,lineInd)=>{
            let item={};
            item.task=gantLine.task;
            item.key="gantline-"+lineInd;
            
            //循环每个日期作为列
            alldays.forEach((day,colind)=>{
                

                //背景颜色的覆盖关系：当前天 > 月首日 > 休息日
                let obj={
                    isCurrDay: dateUtil.isDayEq(day),
                    isHoliday: dateUtil.isHoliday(day),
                    isFirstDay:1===day[2],

                    headerShouldShowSetHolidayBg:false,
                    headerShouldShowSetFirstDayBg:false,
                    headerShouldShowSetCurrdayBg:false,
                };

                //标题列的样式，从优先级低到最高依次覆盖
                if(obj.isHoliday){
                    obj.headerShouldShowSetHolidayBg=true;
                    obj.headerShouldShowSetFirstDayBg=false;
                    obj.headerShouldShowSetCurrdayBg=false;
                }
                if(obj.isFirstDay){
                    obj.headerShouldShowSetFirstDayBg=true;
                    obj.headerShouldShowSetHolidayBg=false;
                    obj.headerShouldShowSetCurrdayBg=false;
                }
                if(obj.isCurrDay){
                    obj.headerShouldShowSetCurrdayBg=true;
                    obj.headerShouldShowSetHolidayBg=false;
                    obj.headerShouldShowSetFirstDayBg=false;
                    
                }

                //是初始日期
                if(dateUtil.isDayEq(day,gantLine.start)){
                    obj.span=gantLine.days;
                    obj.hasProg=true;
                    obj.prog=gantLine.prog;
                    obj.overlim=gantLine.overlim;
                    obj.progSt=(100===gantLine.prog?"success":(obj.overlim?"exception":"active"));
                    item.progInd=colind;

                    //有依赖项则记录对应关系，以便后面画箭头用
                    if(gantLine.hasDep){
                        relas.push({
                            from:[gantLine.depInd,  data[gantLine.depInd].progInd+1,],
                            to:[lineInd,  colind+1,]
                        });
                    }

                    //今天在任务初始结束日期之间，并且跨度大于1天。由于单元格跨列，需使用渐变的样式配合百分比的背景定位来显示背景
                    // if(1<gantLine.days && dateUtil.dateSmallThan(gantLine.start,currYMD,true) && dateUtil.dateSmallThan(currYMD,gantLine.end,true)){
                    //     let startPercent=100*dateUtil.distDays(gantLine.start,currYMD)/(gantLine.days-1);//位置是除去背景大小后剩余部分的百分比
                    //     let widPercent=100/gantLine.days;
                    //     obj.percentBg=[startPercent,widPercent];
                    //     obj.shouldSetCurrDayBg=true;
                    // }

                    //如果是跨多列的情况，则按每列计算
                    if(1<gantLine.days){
                        let percentBg=[];
                        for(let eachDay=gantLine.start,eachDist=0; dateUtil.dateSmallThan(eachDay,gantLine.end,true); eachDay=dateUtil.addDays(eachDay,1),++eachDist){
                            let dayProps={
                                isCurrDay: dateUtil.isDayEq(eachDay),
                                isHoliday: dateUtil.isHoliday(eachDay),
                                isFirstDay:1===eachDay[2],
                            }
                            let startPercent=100*eachDist/(gantLine.days-1);//位置是除去背景大小后剩余部分的百分比
                            let widPercent=100/gantLine.days;
                            let isSpecialDay=false;
                            let dayConfig=null;
                            if(dayProps.isHoliday){
                                isSpecialDay=true;
                                dayConfig={
                                    st:startPercent,
                                    wid:widPercent,
                                    isHoliday:true,
                                };
                            }
                            if(dayProps.isFirstDay){
                                isSpecialDay=true;
                                dayConfig={
                                    st:startPercent,
                                    wid:widPercent,
                                    isFirstDay:true,
                                };
                            }
                            if(dayProps.isCurrDay){
                                isSpecialDay=true;
                                dayConfig={
                                    st:startPercent,
                                    wid:widPercent,
                                    isCurrDay:true,
                                };
                            }
                            if(isSpecialDay){
                                percentBg.push(dayConfig);
                            }
                        }
                        if(percentBg && 0<percentBg.length){
                            obj.percentBg=percentBg;
                            obj.shouldShowPercentBg=true;
                        }
                        
                    }


                    //浮动消息，两种格式：
                    //1、字符串
                    //2、数组 [  {txt:'aa', strong:true/false}, ... ]
                    let leftDays=dateUtil.distDays(gantLine.end,currYMD);
                    let leftStartDays=dateUtil.distDays(gantLine.start,currYMD);
                    //已完成
                    if(100===obj.prog){
                        obj.msg="任务已经完成";
                    }
                    //未完成
                    else{
                        //过期
                        if(obj.overlim){
                            obj.msg=[
                                {txt: "任务已经过期",},
                                {txt: ""+leftDays, strong:true},
                                {txt:"天"},
                            ];
                        }
                        //还未开始
                        else if(dateUtil.dateSmallThan(currYMD,gantLine.start)){
                            obj.msg=[
                                {txt:"距离任务开始还有"},
                                {txt:''+leftStartDays, strong:true},
                                {txt:"天"}
                            ];
                            if(leftStartDays<4){
                                let tmp=['今天','明天','后天','大后天'][leftStartDays];
                                obj.msg="任务将于【"+tmp+"】开始";
                            }
                        }
                        //已开始
                        else {
                            let daysUsed=dateUtil.distDays(currYMD,gantLine.start)+1;
                            obj.msg=[
                                {txt:"任务已开始"},
                                {txt:''+daysUsed, strong:true},
                                {txt: '天，'},
                            ];
                            if(leftDays<4){
                                let tmp=['今天','明天','后天','大后天'][leftDays];
                                obj.msg.push({txt:"预计【"+tmp+"】完成"});
                            }else{
                                obj.msg.push({txt:'离完成还剩'});
                                obj.msg.push({txt:''+leftDays, strong:true});
                                obj.msg.push({txt:'天'});
                            }
                        }
                    }
                }
                //起始与结束日期之间，不包括初始，包括结束
                else if(dateUtil.dateLargeThan(day,gantLine.start) &&  dateUtil.dateSmallThan(day,gantLine.end,true)){
                    obj.span=0;
                    obj.hasProg=false;
                    obj.prog=0;
                }
                //其他日期
                else{
                    obj.span=1;
                    obj.hasProg=false;
                    obj.prog=0;
                }

                //特殊日期的背景色标识
                if(1===obj.span && obj.isHoliday){
                    obj.shouldSetHolidayBg=true;
                }
                if(1===obj.span && obj.isCurrDay){
                    obj.shouldSetCurrDayBg=true;
                }
                if(1===obj.span && obj.isFirstDay){
                    // console.log("222");
                    obj.shouldSetFirstDayBg=true;
                }

                //跨列的背景样式 > 当前天 > 月首日 > 休息日
                //解决不同日期类型背景的优先级问题
                if(obj.shouldShowPercentBg){
                    obj.shouldSetCurrDayBg=false;
                    obj.shouldSetFirstDayBg=false;
                    obj.shouldSetHolidayBg=false;
                }
                else if(obj.shouldSetCurrDayBg){
                    obj.shouldSetFirstDayBg=false;
                    obj.shouldSetHolidayBg=false;
                }else if(obj.shouldSetFirstDayBg){
                    obj.shouldSetHolidayBg=false;
                }

                item["d"+colind]=obj;
            });

            data.push(item);
        });



        return {data,colKeys,relas};
    }

    

}

const inst=new GanttSvc();

// loadGanttData: inst.loadGanttData,
const expObj={
    parseGantData : inst.parseGantData,    
    parseGantItem:inst.parseGantItem,
};

export default expObj;