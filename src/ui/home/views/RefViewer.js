/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider,Popover,BackTop,Avatar } from 'antd';
import { VerticalAlignTopOutlined, BulbFilled } from '@ant-design/icons';
import {withEnh} from '../../common/specialDlg';
import {connect} from '../../../common/gflow';

const EnhDlg=withEnh(Modal);

class RefViewer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
        this.wrapperId="refviewercontainer"+new Date().getTime();
    }

    getScrollTarget=()=>{
        return document.getElementById(this.wrapperId);
    }

    render() {
        return (
            <EnhDlg noFooter
                    title={"查看引用 - " + this.props.refname}
                    size={{w:this.props.winW-200, h:this.props.winH-300, fixh:true, wrapperId:this.wrapperId}}                
                    visible={this.props.visible}
                    maskClosable={true}               
                    onCancel={this.props.onCancel}>
                <div className='markdown-body' css={{
                    margin:'0px auto',
                    width:'98%',
                    overflowX:'hidden'}}
                    dangerouslySetInnerHTML={{__html:this.props.refCont}}>
                </div>
                {
                    (this.props.backtopLoc && 2===this.props.backtopLoc.length) && (   
                        <BackTop  target={this.getScrollTarget} css={{
                            right:200,
                            bottom:170,
                            ...backtopColorStyle
                        }}/>
                    )
                }
            </EnhDlg>
        );
    }
}

//24  144 255    #1890ff
//16  136 233    #1088e9
const backtopColorStyle={
    '& .ant-back-top-content':{
        backgroundColor:'rgba(24,144,255, .80)',
    },
    '&:hover .ant-back-top-content':{
        backgroundColor:'rgba(24,144,255, 1.0)', 
    },
}

export default connect((state)=>({
    winW:state.common.winW,
    winH:state.common.winH,
}))(RefViewer);