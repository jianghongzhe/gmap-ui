/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import {  Modal, Input,AutoComplete,Button,TreeSelect } from 'antd';
import * as uiUtil from '../../../common/uiUtil';
import { FileMarkdownOutlined,ReloadOutlined,HomeOutlined,FolderOutlined } from '@ant-design/icons';
import api from '../../../service/api';
import {connect} from '../../../common/gflow';
import {createSelector} from 'reselect';

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


    bindInputEle=(ele)=>{
        this.iptEle=ele;
    }

    filterOptionFun=(inputValue, option) =>option.value.startsWith(inputValue);

    reloadAllDirs=()=>{
        this.props.dispatcher.common.reloadAllDirs();
    }

    

    render() {
        return (
            <Modal  title={getDlgTitle(this.props)}
                    visible={this.props.visible}
                    onOk={this.props.onOk}
                    onCancel={this.props.onCancel}
                    width={700}>
                
                <table css={{width:'100%'}}>
                    <tbody>
                        <tr>
                            <td css={{paddingTop:'10px',width:'80px'}}>图表目录：</td>
                            <td css={{paddingTop:'10px',}}>
                                <TreeSelect
                                    style={{ width: '100%' }}
                                    value={this.props.newMapDir}
                                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                    treeData={this.props.allDirs}
                                    placeholder="请选择图表目录"
                                    treeDefaultExpandAll
                                    allowClear
                                    onChange={this.props.onChangeNewMapDir}
                                />
                            </td>
                            <td css={{paddingTop:'10px',width:'50px'}}>
                                <Button css={{marginLeft:'15px'}} 
                                    title='刷新目录列表' 
                                    size='small' 
                                    type="default" 
                                    shape="circle" 
                                    icon={<ReloadOutlined />} 
                                    onClick={this.reloadAllDirs} />
                            </td>
                        </tr>
                        <tr>
                            <td css={{paddingTop:'10px',}}>图表名称：</td>
                            <td css={{paddingTop:'10px',}}>
                                <Input
                                    css={{width:'100%'}}
                                    placeholder="请输入图表名称"
                                    // backfill={false}
                                    ref={this.bindInputEle}
                                    value={this.props.newMapName} 
                                    // options={this.props.allDirs}
                                    // filterOption={this.filterOptionFun}
                                    onChange={this.props.onChangeNewMapName} 
                                    onPressEnter={this.props.onOk}
                                />
                            </td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
                
                
            </Modal>
        );
    }
}

const getDlgTitle=createSelector(
    props=>props.newMapDir,
    props=>props.newMapName,
    (dir,name)=>("新建图表 - "+(dir ? dir+"/"+(name?name:"<空>") : (name?name:"<空>")))
);


const mapState=(state)=>({
    allDirs: state.common.allDirs,
});

export default connect(mapState)(NewGraphDlg);