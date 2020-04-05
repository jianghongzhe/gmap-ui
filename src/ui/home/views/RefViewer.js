/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider,Popover,BackTop,Avatar } from 'antd';
import { VerticalAlignTopOutlined, BulbFilled } from '@ant-design/icons';

class RefViewer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }

    getScrollTarget=()=>{
        return document.getElementById("refviewercontainer");
    }

    render() {
        return (
            <Modal
                title={"查看引用 - " + this.props.refname}
                css={{
                    width: (this.props.dlgW) ,
                    minWidth: (this.props.dlgW),
                    maxWidth: (this.props.dlgW)
                }}
                visible={this.props.visible}
                maskClosable={true}
                footer={null}
                onCancel={this.props.onCancel}>
                <div id='refviewercontainer' css={{
                    height:this.props.bodyH,
                    maxHeight:this.props.bodyH,
                    minHeight:this.props.bodyH,
                    overflowY:'auto',
                    overflowX:'hidden'}}>
                    <div className='markdown-body' css={{
                        margin:'0px auto',
                        width:'98%',
                        overflowX:'hidden'}}
                        dangerouslySetInnerHTML={{__html:this.props.refCont}}>
                    </div>
                </div>
                {
                    (this.props.backtopLoc && 2===this.props.backtopLoc.length) && (   
                        <BackTop  target={this.getScrollTarget} css={{
                            right:this.props.backtopLoc[0],
                            bottom:this.props.backtopLoc[1],
                            ...backtopColorStyle
                        }}/>
                    )
                }
            </Modal>
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

export default RefViewer;