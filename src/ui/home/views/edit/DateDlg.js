/** @jsx jsx */
import { css, jsx,Global } from '@emotion/core';
import React from 'react';
import { DatePicker, Calendar } from 'antd';
import { Layout, Input, Tabs, Modal, Form, message, Button, Divider, Popover } from 'antd';
import moment  from 'moment';
import {withEnh} from '../../../common/specialDlg';

const EnhDlg=withEnh(Modal);

class DateDlg extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {  };
        this.datePickPopoverClassname='edigdlg-datepopup-container-'+new Date().getTime();
    }

    

    onSelCommonDays=(offset)=>{
        let time=moment();
        if(offset>0){
            time=time.add(offset, 'days');
        }
        if(offset<0){
            time=time.subtract(0-offset, 'days');
        }
        let fmt=time.format("YYYY-MM-DD");
        this.props.onChange(time,fmt);
    }

    

    render() {
        const dlgScale={
            w:340,
            h:390,
        };

        return (<>
            <EnhDlg  title="选择日期"
                    closable={true}
                    maskClosable={true}
                    visible={this.props.visible}
                    onCancel={this.props.onCancel}
                    onOk={this.props.onOk}
                    size={{w:dlgScale.w, h:dlgScale.h, fixh:true}}
                    bodyStyle={{paddingTop:5}}>

                <Global styles={getDatePickerPopoverStyle(this.datePickPopoverClassname)}/>
                <DatePicker  
                    bordered={false} 
                    allowClear={false} 
                    value={this.props.value} 
                    inputReadOnly={true}
                    size='large '
                    open={this.props.visible} 
                    dropdownClassName={this.datePickPopoverClassname}
                    onChange={this.props.onChange} 
                    renderExtraFooter={(mode)=>{
                        return <div css={commonDaysStyle}>
                            <Button type='link' className='day' onClick={this.onSelCommonDays.bind(this,1)}>明天</Button>
                            <Button type='link' className='day' onClick={this.onSelCommonDays.bind(this,2)}>后天</Button>
                            <Button type='link' className='day' onClick={this.onSelCommonDays.bind(this,3)}>大后天</Button>
                            <Button type='link' className='day' onClick={this.onSelCommonDays.bind(this,-1)}>昨天</Button>
                            <Button type='link' className='day' onClick={this.onSelCommonDays.bind(this,-2)}>前天</Button>
                            <Button type='link' className='day' onClick={this.onSelCommonDays.bind(this,-3)}>大前天</Button>
                        </div>;
                    }}
                />
            </EnhDlg>
        </>);
    }
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
    '& .day':{
        padding:0,
    },
    '& .day:nth-child(n+2)':{
        marginLeft:10,
    }
};

export default DateDlg;