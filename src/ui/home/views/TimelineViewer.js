/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import {  Modal, Timeline } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import {withEnh} from '../../common/specialDlg';
import {connect} from '../../../common/gflow';

const EnhDlg=withEnh(Modal);

class TimelineViewer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }
    render() {
        let dlgW= (this.props.winW<820?this.props.winW-20:800);

        return (
            <EnhDlg noFooter
                    title="查看时间线"
                    size={{w:dlgW, h:this.props.winH-300}}
                    visible={this.props.visible}
                    maskClosable={true}              
                    onCancel={this.props.onCancel}>
                        
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
            </EnhDlg>
        );
    }
}

export default connect((state)=>({
    winW:state.common.winW,
    winH:state.common.winH,
}))(TimelineViewer);