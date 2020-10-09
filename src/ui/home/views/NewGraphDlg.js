/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import {  Modal, Input,AutoComplete,Button } from 'antd';
import * as uiUtil from '../../../common/uiUtil';
import { FileMarkdownOutlined,ReloadOutlined,HomeOutlined,FolderOutlined } from '@ant-design/icons';
import api from '../../../service/api';
import {connect} from '../../../common/gflow';

/**
 * 新建图表对话框
 */
class NewGraphDlg extends React.Component {
    constructor() {
        super(...arguments);
        this.iptGraphName=null;
        this.state = { 
            autoCompleteItems:[],
        };
        this.iptEle=null;
    }

    /**
     * 对话框从不可见变为可见时，让输入框获得焦点
     * @param {*} prevProps 
     * @param {*} prevState 
     */
    componentDidUpdate(prevProps, prevState){
        if(!prevProps.visible && this.props.visible){
            if(this.iptEle){
                this.iptEle.focus();
            }else{
                setTimeout(() => {
                    if(this.iptEle){
                        this.iptEle.focus();
                    }
                }, 500);
            }
            return;
        }
    }

    

    onTxtChange=(val)=>{
        this.props.onChangeNewMapName({target:{value: val,}});
    }

    bindInputEle=(ele)=>{
        this.iptEle=ele;
    }

    filterOptionFun=(inputValue, option) =>option.value.startsWith(inputValue);

    reloadAllDirs=()=>{
        this.props.dispatcher.common.reloadAllDirs();
    }

    render() {
        return (
            <Modal  title={
                        <div>
                            <span>新建图表</span>
                            <Button css={{marginLeft:'15px'}} 
                                    title='刷新目录列表' 
                                    size='small' 
                                    type="default" 
                                    shape="circle" 
                                    icon={<ReloadOutlined />} 
                                    onClick={this.reloadAllDirs} />
                        </div>
                    }
                    visible={this.props.visible}
                    onOk={this.props.onOk}
                    onCancel={this.props.onCancel}>

                <AutoComplete
                    css={{width:'100%'}}
                    placeholder="请输入图表名称"
                    backfill={false}
                    ref={this.bindInputEle}
                    value={this.props.newMapName} 
                    options={this.props.allDirs}
                    filterOption={this.filterOptionFun}
                    onChange={this.onTxtChange} 
                />
            </Modal>
        );
    }
}

const mapState=(state)=>({
    allDirs: state.common.allDirs,
});

export default connect(mapState)(NewGraphDlg);