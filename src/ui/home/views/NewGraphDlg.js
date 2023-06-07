import React, { useEffect, useMemo, useRef, useState } from 'react';
import {Modal, Input, Button, TreeSelect, Checkbox} from 'antd';
import {ReloadOutlined } from '@ant-design/icons';
import {useGetAndLoadAllDirs} from '../../../hooks';
import {useBoolean, useMemoizedFn} from "ahooks";
import styles from './NewGraphDlg.module.scss';
import {useRecoilValue} from "recoil";
import {tabHasPane} from "../../../store/tabs";


/**
 * 新建图表对话框
 */
const NewGraphDlg=(props)=>{
    const [allDirs, loadAllDirs]=useGetAndLoadAllDirs();
    const hasTabs=useRecoilValue(tabHasPane);
    

    const [name, setName]=useState('');
    const [dir, setDir]=useState('');
    const [shouldClone,{set: setShouldClone}]=useBoolean(false);
    const nameEle=useRef();

    const onCloneChange=useMemoizedFn((e)=>{
        setShouldClone(e.target.checked);
    });


    //每次显示时把输入框设置焦点
    useEffect(()=>{
        if(props.visible){
            setName('');
            setShouldClone(false);
            setTimeout(() => {
                if(nameEle.current){
                    nameEle.current.focus();
                }
            }, 300);
        }
    },[props.visible, nameEle, setName, setShouldClone]);

    

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
    const onOk=useMemoizedFn((e)=>{
        e.stopPropagation();
        e.preventDefault();
        props.onOk({dir:dir.trim(), name:name.trim(), cloneFromCurr:shouldClone});
    });

    const dlgTitle=useMemo(()=> `新建图表 - ${dir ? dir+"/":""}${name?name:"<空>"}`,[dir, name]);

    
    return (
        <Modal  title={dlgTitle}
                open={props.visible}
                onOk={onOk}
                onCancel={props.onCancel}
                width={700}>
            <div>
            <table className={styles.container}>
                <tbody>
                    <tr>
                        <td className='label'>图表目录：</td>
                        <td >
                            <TreeSelect
                                className={styles.full_width}
                                value={dir}
                                dropdownStyle={{ maxHeight: '400px', overflow: 'auto' }}
                                treeData={allDirs}
                                placeholder="请选择图表目录"
                                treeDefaultExpandAll
                                allowClear
                                onChange={onChange.bind(this,setDir)}
                            />
                        </td>
                        <td className='extra'>
                            <Button className='refreshBtn'
                                title='刷新目录列表' 
                                size='small' 
                                type="default" 
                                shape="circle" 
                                icon={<ReloadOutlined />} 
                                onClick={loadAllDirs} />
                        </td>
                    </tr>
                    <tr>
                        <td>图表名称：</td>
                        <td>
                            <Input
                                className={styles.full_width}
                                placeholder="请输入图表名称"
                                ref={nameEle}
                                value={name} 
                                onChange={onChange.bind(this,setName)} 
                                onPressEnter={onOk}
                            />
                        </td>
                        <td></td>
                    </tr>
                    {
                        hasTabs && (
                            <tr>
                                <td>

                                </td>
                                <td>
                                    <Checkbox className='clone' onChange={onCloneChange} checked={shouldClone}>从当前导图文件克隆</Checkbox>
                                </td>
                                <td></td>
                            </tr>
                        )
                    }
                </tbody>
            </table>

            </div>
            
        </Modal>
    );
    
}






export default React.memo(NewGraphDlg);