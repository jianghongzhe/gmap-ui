/** @jsxImportSource @emotion/react */
import {Global } from '@emotion/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout, Input, Tabs, Modal, Form, message, Button, Divider, Popover,DatePicker, Calendar  } from 'antd';
import { DoubleLeftOutlined,LeftOutlined,RightOutlined,DoubleRightOutlined } from '@ant-design/icons';
import moment  from 'moment';
import {withEnh} from '../../../common/specialDlg';


const EnhDlg=withEnh(Modal);

/**
 * 日期选择对话框
 * @param {*} props 
 */
const DateDlg=(props)=>{
    const [datePickPopoverClassname]=useState(()=>'edigdlg-datepopup-container-'+new Date().getTime());
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
    },[props.onOk, date]);



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
            <Button className="btn" size='small' type='text' title="前一年" icon={<DoubleLeftOutlined className='icon'/>} onClick={changeYear.bind(this,-1)}></Button>
            <Button className="btn" size='small' type='text' title="上月" icon={<LeftOutlined className='icon'/>} onClick={changeMonth.bind(this,-1)}></Button>
            <span className='currYM'>{date.format("YYYY-MM-DD")}</span>
            <Button className="btn" size='small' type='text' title="下月" icon={<RightOutlined className='icon'/>} onClick={changeMonth.bind(this,1)}></Button>
            <Button className="btn" size='small' type='text' title="后一年" icon={<DoubleRightOutlined className='icon'/>} onClick={changeYear.bind(this,1)}></Button>

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

            {/* <Global styles={getDatePickerPopoverStyle(datePickPopoverClassname)}/>
            <DatePicker  
                bordered={false} 
                allowClear={false} 
                value={date} 
                inputReadOnly={true}
                size='large '
                open={props.visible} 
                dropdownClassName={datePickPopoverClassname}
                onChange={setDate}                
                renderExtraFooter={(mode)=>{
                    return <div css={commonDaysStyle}>
                        
                            <Button type='link' className='day' onClick={onSelCommonDays.bind(this,1)}>明天</Button>
                            <Button type='link' className='day' onClick={onSelCommonDays.bind(this,2)}>后天</Button>
                            <Button type='link' className='day' onClick={onSelCommonDays.bind(this,3)}>大后天</Button>
                        
                            <Button type='link' className='day' onClick={onSelCommonDays.bind(this,-1)}>昨天</Button>
                            <Button type='link' className='day' onClick={onSelCommonDays.bind(this,-2)}>前天</Button>
                            <Button type='link' className='day' onClick={onSelCommonDays.bind(this,-3)}>大前天</Button>
                        
                    </div>;
                }}
            /> */}

            <Calendar
                fullscreen={false}
                value={date}
                onChange={setDate}
                headerRender={headerRender}/>
            <Divider css={{margin:0,padding:0,paddingBottom:5,}}/>
            <div css={commonDaysStyle}>
                <Button type='link' className='day' onClick={onSelCommonDays.bind(this,1)}><span css={getSpecialDateStyle(date,1)}>明天</span></Button>
                <Button type='link' className='day' onClick={onSelCommonDays.bind(this,2)}><span css={getSpecialDateStyle(date,2)}>后天</span></Button>
                <Button type='link' className='day' onClick={onSelCommonDays.bind(this,3)}><span css={getSpecialDateStyle(date,3)}>大后天</span></Button>
            
                <Button type='link' className='day' onClick={onSelCommonDays.bind(this,-1)}><span css={getSpecialDateStyle(date,-1)}>昨天</span></Button>
                <Button type='link' className='day' onClick={onSelCommonDays.bind(this,-2)}><span css={getSpecialDateStyle(date,-2)}>前天</span></Button>
                <Button type='link' className='day' onClick={onSelCommonDays.bind(this,-3)}><span css={getSpecialDateStyle(date,-3)}>大前天</span></Button>
            </div>
            <div css={commonDaysStyle}>    
                <Button type='link' className='day' onClick={onSelCommonDays.bind(this,0)}><span css={getSpecialDateStyle(date,0)}>今天</span></Button>
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
    marginBottom:10,
    marginTop:10, 
    '& .icon':{
        color:'#BBB',
    },
    '& .iconWrapper':{
        width:'25px',
        display:'inline-block',
        cursor:'pointer',
    },
    '& .btn':{
        padding:0,
    },
    '& .currYM':{
        display:'inline-block',
        width:'calc(100% - 120px)',
    }
};

const dlgScale={
    w:330,
    h:390,
};

const getDatePickerPopoverStyle=(parCls)=>{
    let result={};
    let key=`.${parCls} .ant-picker-panel-container`;
    result[key]={
        boxShadow:'0px 0px 0px gray',
        border:'1px solid #DDD',//#DDD
    }
    return result;
}

const commonDaysStyle={
    marginTop:0,
    marginBottom:0,
    textAlign:'center',
    border:'0px solid blue',
    '& .day':{
        padding:2,
        // paddingLeft:20,
        // paddingRight:20,
        // margin:0,
        // border:'0px solid blue'
    },
    '& .day:nth-child(n+2)':{
        marginLeft:5,
    }
};

export default React.memo(DateDlg);