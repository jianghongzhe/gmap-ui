/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider,Popover } from 'antd';

class RefViewer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
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
                <div  css={{
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
            </Modal>
        );
    }
}

export default RefViewer;