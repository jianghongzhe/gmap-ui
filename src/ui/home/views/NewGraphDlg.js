import React, { useEffect, useMemo, useRef, useState } from 'react';
import {Modal, Input,Button,TreeSelect } from 'antd';
import {ReloadOutlined } from '@ant-design/icons';
import {useGetAndLoadAllDirs} from '../../../hooks';
import {useMemoizedFn} from "ahooks";

/**
 * 新建图表对话框
 */
const NewGraphDlg=(props)=>{
    const [allDirs, loadAllDirs]=useGetAndLoadAllDirs();

    

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

    

    /**
     * 修改事件
     * @param {*} fun 
     * @param {*} e 
     */
    const onChange=useMemoizedFn((fun,e)=>{
        let val=(e && e.target ? e.target.value : e);
        val=('undefined'===typeof(val) ? '' : val);
        fun(val);
    });

    /**
     * 确定事件
     * @param {*} e 
     */
    const onOk=(e)=>{
        e.stopPropagation();
        e.preventDefault();
        props.onOk({dir:dir.trim(), name:name.trim()});
    }

    const dlgTitle=useMemo(()=>(
        `新建图表 - ${dir ? dir+"/":""}${name?name:"<空>"}`
    ),[dir, name]);

    
    return (
        <Modal  title={dlgTitle}
                open={props.visible}
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
                                onClick={loadAllDirs} />
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






export default React.memo(NewGraphDlg);