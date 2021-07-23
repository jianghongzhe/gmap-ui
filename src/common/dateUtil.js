const addDays=(ymd,days)=>{
    let tmpDate=new Date(ymd[0],ymd[1]-1,ymd[2]);
    tmpDate.setDate(tmpDate.getDate()+days);
    return [
        tmpDate.getFullYear(),
        tmpDate.getMonth()+1,
        tmpDate.getDate(),
    ];
}

const distDays=(ymd1,ymd2)=>{
    let d1=new Date(ymd1[0],ymd1[1]-1,ymd1[2]);
    let d2=new Date(ymd2[0],ymd2[1]-1,ymd2[2]);
    return parseInt(Math.abs(d1.getTime()-d2.getTime())/85400000);
}

const dateSmallThan=(ymd1,ymd2,containsEq=false)=>{
    let d1=new Date(ymd1[0],ymd1[1]-1,ymd1[2]);
    let d2=new Date(ymd2[0],ymd2[1]-1,ymd2[2]);
    return containsEq ? d1.getTime()<=d2.getTime() : d1.getTime()<d2.getTime();
}

const dateLargeThan=(ymd1,ymd2,containsEq=false)=>{
    let d1=new Date(ymd1[0],ymd1[1]-1,ymd1[2]);
    let d2=new Date(ymd2[0],ymd2[1]-1,ymd2[2]);
    return containsEq ? d1.getTime()>=d2.getTime() : d1.getTime()>d2.getTime();
}

const currDayYMD=()=>{
    let now=new Date();
    now.setHours(0);
    now.setMinutes(0)
    now.setSeconds(0);
    now.setMilliseconds(0);
    return [now.getFullYear(),now.getMonth()+1,now.getDate()];
}

const isLeapYear=(year)=>{
    return (0===year%400 || (0===year%4 && 0!==year%100));
}

const isDayEq=(ymd,ymd2=null)=>{
    if(null===ymd2){
        ymd2=currDayYMD();
    }
    
    return (ymd[0]===ymd2[0] && ymd[1]===ymd2[1] && ymd[2]===ymd2[2]);
}

const isHoliday=(ymd)=>{
    return ['六','日'].includes(getWeekday(ymd));
}

const getWeekday=(ymd)=>{
    let date=new Date(ymd[0],ymd[1]-1,ymd[2]);    
    return ["日","一","二","三","四","五","六"][date.getDay()];
}

const expObj={addDays,distDays,dateSmallThan,dateLargeThan,isDayEq,getWeekday,isHoliday,currDayYMD,isLeapYear};

export default expObj;