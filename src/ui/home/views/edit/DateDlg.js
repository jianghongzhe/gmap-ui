import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Button, Divider, Calendar  } from 'antd';
import { DoubleLeftOutlined,LeftOutlined,RightOutlined,DoubleRightOutlined } from '@ant-design/icons';
import moment  from 'moment';
import {withEnh} from '../../../common/specialDlg';


const EnhDlg=withEnh(Modal);

/**
 * 日期选择对话框
 * @param {*} props 
 */
const DateDlg=(props)=>{
    const [date, setDate]=useState(moment());

    //每次显示都重置为当前日期
    useEffect(()=>{
        if(props.visible){
            setDate(moment());
        }
    },[props.visible]);

    //设置特殊日期
    const onSelCommonDays=useCallback((offset)=>{
        let time=moment();
        if(offset>0){
            time=time.add(offset, 'days');
        }
        if(offset<0){
            time=time.subtract(0-offset, 'days');
        }
        setDate(time);
    },[setDate]);

    //确定按钮事件
    const onOk=useCallback(()=>{
        props.onOk(date.format("YYYY-MM-DD"));
    },[props, date]);



    const headerRender=useCallback(({ value, type, onChange, onTypeChange }) => {
        const changeYear=(delta)=>{
            const y=parseInt(date.format("YYYY"),10)+delta;
            const result = value.clone().year(y);
            onChange(result);
        };
        const changeMonth=(delta)=>{
            const m=parseInt(date.format("MM"),10)-1;//月份值以0开始
            const y=parseInt(date.format("YYYY"),10);

            if(11===m && delta>0){
                const result = value.clone().year(y+1).month(0);
                onChange(result);
                return;
            }
            if(0===m && delta<0){
                const result = value.clone().year(y-1).month(11);
                onChange(result);
                return;
            }
            const result = value.clone().month(m+delta);
            onChange(result);
        };
        
        return <div css={calendarHeaderStyle}>
            <Button size='small' type='text' title="前一年" icon={<DoubleLeftOutlined className='icon'/>} onClick={changeYear.bind(this,-1)}></Button>
            <Button size='small' type='text' title="上月" icon={<LeftOutlined className='icon'/>} onClick={changeMonth.bind(this,-1)}></Button>
            <span>{date.format("YYYY-MM-DD")}</span>
            <Button size='small' type='text' title="下月" icon={<RightOutlined className='icon'/>} onClick={changeMonth.bind(this,1)}></Button>
            <Button size='small' type='text' title="后一年" icon={<DoubleRightOutlined className='icon'/>} onClick={changeYear.bind(this,1)}></Button>
        </div>
    },[date]);

    return (
        <EnhDlg  title="选择日期"
                closable={true}
                maskClosable={true}
                visible={props.visible}
                onCancel={props.onCancel}
                onOk={onOk}
                size={{...dlgScale, fixh:true}}
                bodyStyle={{paddingTop:5}}>
            <Calendar
                fullscreen={false}
                value={date}
                onChange={setDate}
                headerRender={headerRender}/>
            <Divider css={{margin:0,padding:0,paddingBottom:5,}}/>
            <div css={commonDaysStyle}>
                <Button type='link' className='day' onClick={onSelCommonDays.bind(this,-3)}><span css={getSpecialDateStyle(date,-3)}>大前天</span></Button>
                <Button type='link' className='day' onClick={onSelCommonDays.bind(this,-2)}><span css={getSpecialDateStyle(date,-2)}>前天</span></Button>
                <Button type='link' className='day' onClick={onSelCommonDays.bind(this,-1)}><span css={getSpecialDateStyle(date,-1)}>昨天</span></Button>
                <Button type='link' className='day' onClick={onSelCommonDays.bind(this,0)}><span css={getSpecialDateStyle(date,0)}>今天</span></Button>
                <Button type='link' className='day' onClick={onSelCommonDays.bind(this,1)}><span css={getSpecialDateStyle(date,1)}>明天</span></Button>
                <Button type='link' className='day' onClick={onSelCommonDays.bind(this,2)}><span css={getSpecialDateStyle(date,2)}>后天</span></Button>
                <Button type='link' className='day' onClick={onSelCommonDays.bind(this,3)}><span css={getSpecialDateStyle(date,3)}>大后天</span></Button>
            </div>
        </EnhDlg>
    );
    
}


const getSpecialDateStyle=(date, deltaDays)=>{
    const d1=date.format("YYYY-MM-DD");
    const d2=moment().add(deltaDays, 'days').format("YYYY-MM-DD");
    if(d1===d2){
        return {
            textDecoration:'underline',
            color:'green',
        };
    }
    return {};
};


const calendarHeaderStyle={
    textAlign:"center",
    marginTop:10,
    marginBottom:10,
    marginLeft:'auto',
    marginRight:'auto',
    width:'96%',
    display:'grid',
    gridTemplateColumns: '25px 25px auto 25px 25px',

    '& .icon':{
        color:'#BBB',
    },
};

const dlgScale={
    w:360,
    h:360,
};


const commonDaysStyle={
    marginTop:0,
    marginBottom:0,
    display:'flex',

    '& .day':{
        flex:1,
        padding:0,
    },
};

export default React.memo(DateDlg);