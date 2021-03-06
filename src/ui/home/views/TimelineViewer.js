import React from 'react';
import {  Modal, Timeline } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import {withEnh} from '../../common/specialDlg';

const EnhDlg=withEnh(Modal);
const dlgW= 900;

/**
 * 时间线对话框
 */
const TimelineViewer=(props)=>{
    return (
        <EnhDlg noFooter
                title="查看时间线"
                size={{w:dlgW, h:'calc(100vh - 300px)'}}
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