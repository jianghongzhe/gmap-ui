/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { DatePicker, Calendar } from 'antd';
import { Layout, Input, Tabs, Modal, Form, message, Button, Divider, Popover } from 'antd';
import moment  from 'moment';

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


        // //format YYYYMMDD

        // console.log("日期。。。");
        // console.log(moment().subtract(10, 'days'), moment().subtract(10, 'days').calendar()); // 2020/03/29                 // 今天21:47
        //moment().add(1, 'days')
    }

    //onSelCommonDays=

    render() {
        const dlgScale={
            w:340,
            h:390,
        };

        return (<>
            {/* 日期弹出层去掉阴影并加边框 */}
            <style>{`
                .${this.datePickPopoverClassname} .ant-picker-panel-container{
                    box-shadow:0px 0px 0px gray;
                    border:1px solid #DDD;
                }
            `}</style>
            <Modal  title="选择日期"
                    closable={true}
                    maskClosable={true}
                    visible={this.props.visible}
                    onCancel={this.props.onCancel}
                    onOk={this.props.onOk}
                    css={{width: dlgScale.w,minWidth: dlgScale.w,maxWidth: dlgScale.w,}}
                    bodyStyle={{paddingTop:5}}>

                <div css={{height:dlgScale.h}}>
                    <DatePicker  
                        bordered={false} 
                        allowClear={false} value={this.props.value} onChange={this.props.onChange} 
                        inputReadOnly={true}
                        size='large '
                        dropdownClassName={this.datePickPopoverClassname}
                        open={this.props.visible} 
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
                </div>
            </Modal>
        </>);
    }
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