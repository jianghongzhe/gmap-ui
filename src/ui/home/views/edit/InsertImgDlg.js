/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout, Input, Tabs, Modal, Form, message, Button, Divider, Popover } from 'antd';
import { PictureOutlined, FolderOpenOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import {withEnh} from '../../../common/specialDlg';

import * as uiUtil from '../../../../common/uiUtil';

const EnhDlg=withEnh(Modal);

class InsertImgDlg extends React.Component {
    constructor(props) {
        super(props);
        this.elePicPath=null;
        this.elePicName=null;
        this.state = { 

        };
    }

    componentDidUpdate(prevProps, prevState){
        //从隐藏到显示，使第一个输入框（路径）获得焦点
        if(!prevProps.visible && this.props.visible){
            uiUtil.doFocus(this,'elePicPath','insertPicPath'); 
            return;
        }

        //如果明刚选择了文件，需要使第二个输入框（名称）获得焦点
        if(prevProps.hasSelFileSymbo!==this.props.hasSelFileSymbo){
            uiUtil.doFocus(this,'elePicName','insertPicName'); 
            return;
        }
    }

    onPicPathEnter=(e)=>{
        e.preventDefault();
        e.stopPropagation();
        uiUtil.doFocus(this,'elePicName','insertPicName');
    }

    onPicNameEnter=(e)=>{
        e.preventDefault();
        e.stopPropagation();
        this.props.onOk();
    }

    render() {
        return (
            <EnhDlg
                    title={this.props.isImg?"插入图片":"插入附件"}
                    closable={true}
                    size={{w: this.props.dlgW,}}
                    visible={this.props.visible}
                    onCancel={this.props.onCancel}
                    onOk={this.props.onOk}>
                        
                <div css={insertImgFormStyle}>
                    <div className='row'>
                        <div className='cell lab'>{this.props.isImg?'图片位置：':'附件位置：'}</div>
                        <div className='cell'>
                            <Input 
                                value={this.props.insertPicPath}
                                onPressEnter={this.onPicPathEnter}
                                ref={uiUtil.bindInputEle.bind(this,this,'elePicPath')}
                                onChange={this.props.onPicPathChange} 
                                addonAfter={<FolderOpenOutlined onClick={this.props.onSelPicFile} css={{ cursor: 'pointer' }} />} 
                                placeholder={this.props.isImg?'请输入图片路径、url、留空（以从剪切版读取）':'请输入附件路径或url'} />
                        </div>
                    </div>
                    <div className='row'>
                        <div className='cell lab'>显示名称：</div>
                        <div className='cell'>
                            <Input 
                                value={this.props.insertPicName} 
                                onPressEnter={this.onPicNameEnter}
                                ref={uiUtil.bindInputEle.bind(this,this,'elePicName')}
                                onChange={this.props.onPicNameChange} 
                                placeholder={this.props.isImg?'请输入图片显示名称':'请输入附件显示名称'} />
                        </div>
                    </div>
                </div>
            </EnhDlg>
        );
    }
}

const insertImgFormStyle = {
    width: '100%',
    display: 'table',
    '& .row': {
        display: 'table-row'
    },
    '& .cell': {
        display: 'table-cell',
        verticalAlign: 'center',
        paddingTop: 5,
        paddingBottom: 5,
    },
    '& .cell.lab': {
        width: 80,
    },
};

export default InsertImgDlg;