/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import React from 'react';
import {  Modal, Timeline } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import {withEnh} from '../../common/specialDlg';
import {connect} from '../../../common/gflow';
import { useSelector } from 'react-redux';

const EnhDlg=withEnh(Modal);

/**
 * 时间线对话框
 */
const TimelineViewer=(props)=>{
    const {winW,winH}=useSelector((state)=>({
        winW:state.common.winW,
        winH:state.common.winH,
    }));

    let dlgW= (winW<820?winW-20:800);

    return (
        <EnhDlg noFooter
                title="查看时间线"
                size={{w:dlgW, h:winH-300}}
                visible={props.visible}
                maskClosable={true}              
                onCancel={props.onCancel}>
                    
            <Timeline mode='left' css={{marginTop:20}}>
                {
                    props.timelineObj.map((item,ind)=>
                        <Timeline.Item key={ind}  
                                {...(item.near?{dot:<ClockCircleOutlined css={{ fontSize: '16px',color:item.color,marginBottom:4 }} />}:{})}   
                                label={"（"+item.msg+"）"+item.fullDate} color={item.color}>
                            <>{item.txt.map((line,ind)=><>{0<ind && <br/>}{line}</>)}</>
                        </Timeline.Item>
                    )
                }
            </Timeline>
        </EnhDlg>
    );
    
}

export default React.memo(TimelineViewer);