/** @jsx jsx */
import { css, jsx,Global } from '@emotion/core';
import React, { useCallback, useEffect, useState } from 'react';
import { DatePicker, Calendar } from 'antd';
import { Layout, Input, Tabs, Modal, Form, message, Button, Divider, Popover } from 'antd';
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
    const onOk=()=>{
        props.onOk(date.format("YYYY-MM-DD"));
    }

    const dlgScale={
        w:340,
        h:390,
    };

    return (
        <EnhDlg  title="选择日期"
                closable={true}
                maskClosable={true}
                visible={props.visible}
                onCancel={props.onCancel}
                onOk={onOk}
                size={{...dlgScale, fixh:true}}
                bodyStyle={{paddingTop:5}}>

            <Global styles={getDatePickerPopoverStyle(datePickPopoverClassname)}/>
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
                        {/* <div css={commonDaysStyle}> */}
                            <Button type='link' className='day' onClick={onSelCommonDays.bind(this,1)}>明天</Button>
                            <Button type='link' className='day' onClick={onSelCommonDays.bind(this,2)}>后天</Button>
                            <Button type='link' className='day' onClick={onSelCommonDays.bind(this,3)}>大后天</Button>
                        {/* </div>
                        <div css={commonDaysStyle}> */}
                            <Button type='link' className='day' onClick={onSelCommonDays.bind(this,-1)}>昨天</Button>
                            <Button type='link' className='day' onClick={onSelCommonDays.bind(this,-2)}>前天</Button>
                            <Button type='link' className='day' onClick={onSelCommonDays.bind(this,-3)}>大前天</Button>
                        {/* </div> */}
                    </div>;
                }}
            />
        </EnhDlg>
    );
    
}

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
        padding:0,
        // paddingLeft:20,
        // paddingRight:20,
        // margin:0,
        // border:'0px solid blue'
    },
    '& .day:nth-child(n+2)':{
        marginLeft:5,
    }
};

export default DateDlg;