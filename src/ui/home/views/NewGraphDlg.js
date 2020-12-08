/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {  Modal, Input,AutoComplete,Button,TreeSelect } from 'antd';
import * as uiUtil from '../../../common/uiUtil';
import { FileMarkdownOutlined,ReloadOutlined,HomeOutlined,FolderOutlined } from '@ant-design/icons';
import api from '../../../service/api';
import {connect,dispatcher} from '../../../common/gflow';
import {createSelector} from 'reselect';
import { useSelector } from 'react-redux';

/**
 * 新建图表对话框
 */
const NewGraphDlg=(props)=>{
    const {allDirs}=useSelector((state)=>({
        allDirs: state.common.allDirs,
    }));

    const [name, setName]=useState('');
    const [dir, setDir]=useState('');
    const nameEle=useRef();

    //每次显示时把输入框设置焦点
    useEffect(()=>{
        if(props.visible){
            setName('');
            setTimeout(() => {
                if(nameEle.current){
                    nameEle.current.focus();
                }
            }, 300);
        }
    },[props.visible]);

    //加载所有目录层次
    const reloadAllDirs=useCallback(()=>{
        dispatcher.common.reloadAllDirs();
    },[dispatcher]);

    /**
     * 修改事件
     * @param {*} fun 
     * @param {*} e 
     */
    const onChange=useCallback((fun,e)=>{
        let val=(e && e.target ? e.target.value : e);
        val=('undefined'===typeof(val) ? '' : val);
        fun(val);
    },[]);

    /**
     * 确定事件
     * @param {*} e 
     */
    const onOk=(e)=>{
        e.stopPropagation();
        e.preventDefault();
        props.onOk({dir:dir.trim(), name:name.trim()});
    }

    
    return (
        <Modal  title={getDlgTitle({dir, name})}
                visible={props.visible}
                onOk={onOk}
                onCancel={props.onCancel}
                width={700}>
            
            <table css={{width:'100%'}}>
                <tbody>
                    <tr>
                        <td css={{paddingTop:'10px',width:'80px'}}>图表目录：</td>
                        <td css={{paddingTop:'10px',}}>
                            <TreeSelect
                                style={{ width: '100%' }}
                                value={dir}
                                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                treeData={allDirs}
                                placeholder="请选择图表目录"
                                treeDefaultExpandAll
                                allowClear
                                onChange={onChange.bind(this,setDir)}
                            />
                        </td>
                        <td css={{paddingTop:'10px',width:'50px'}}>
                            <Button css={{marginLeft:'15px'}} 
                                title='刷新目录列表' 
                                size='small' 
                                type="default" 
                                shape="circle" 
                                icon={<ReloadOutlined />} 
                                onClick={reloadAllDirs} />
                        </td>
                    </tr>
                    <tr>
                        <td css={{paddingTop:'10px',}}>图表名称：</td>
                        <td css={{paddingTop:'10px',}}>
                            <Input
                                css={{width:'100%'}}
                                placeholder="请输入图表名称"
                                ref={nameEle}
                                value={name} 
                                onChange={onChange.bind(this,setName)} 
                                onPressEnter={onOk}
                            />
                        </td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
            
            
        </Modal>
    );
    
}

const getDlgTitle=createSelector(
    props=>props.dir.trim(),
    props=>props.name.trim(),
    (dir,name)=>("新建图表 - "+(dir ? dir+"/"+(name?name:"<空>") : (name?name:"<空>")))
);




export default React.memo(NewGraphDlg);