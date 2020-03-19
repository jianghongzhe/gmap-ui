/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import {  Modal, Input } from 'antd';
import * as uiUtil from '../../../common/uiUtil';

class NewGraphDlg extends React.Component {
    constructor(props) {
        super(props);
        this.iptGraphName=null;
        this.state = {  };
    }

    componentDidUpdate(prevProps, prevState){
        //对话框从不可见变为可见时，让输入框获得焦点
        if(!prevProps.visible && this.props.visible){
            uiUtil.doFocus(this,"iptGraphName","newMapName");
            return;
        }
    }

    onOkMaskEnter=(e)=>{
        e.preventDefault();
        e.stopPropagation();
        this.props.onOk();   
    }

    render() {
        return (
            <Modal
                title="新建图表"
                visible={this.props.visible}
                onOk={this.props.onOk}
                onCancel={this.props.onCancel}>
                <Input placeholder="请输入图表名称"
                    ref={uiUtil.bindInputEle.bind(this,this,'iptGraphName')}
                    value={this.props.newMapName} 
                    onChange={this.props.onChangeNewMapName} 
                    onPressEnter={this.onOkMaskEnter}/>
            </Modal>
        );
    }
}

export default NewGraphDlg;