/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import {  Modal, Timeline } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';


class TimelineViewer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }
    render() {
        let dlgW= (this.props.winW<820?this.props.winW-20:800);

        return (
            <Modal
                title="查看时间线"
                css={{
                    width: dlgW,
                    minWidth: dlgW,
                    maxWidth: dlgW
                }}
                visible={this.props.visible}
                maskClosable={true}
                footer={null}
                onCancel={this.props.onCancel}>
                <div css={{maxHeight:this.props.bodyH,overflowY:'auto',overflowX:'hidden'}}>
                    <Timeline mode='left' css={{marginTop:20}}>
                        {
                            this.props.timelineObj.map((item,ind)=>
                                <Timeline.Item key={ind}  
                                        {...(item.near?{dot:<ClockCircleOutlined css={{ fontSize: '16px',color:item.color,marginBottom:4 }} />}:{})}   
                                        label={"（"+item.msg+"）"+item.fullDate} color={item.color}>
                                    <>{item.txt.map((line,ind)=><>{0<ind && <br/>}{line}</>)}</>
                                </Timeline.Item>
                            )
                        }
                    </Timeline>
                </div>
            </Modal>
        );
    }
}

export default TimelineViewer;