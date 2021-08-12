/** @jsxImportSource @emotion/react */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Input, Modal, message, Button } from 'antd';
import { FolderOpenOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import {withEnh} from '../../../common/specialDlg';
import api from '../../../../service/api';
import {useSelector} from 'react-redux';

const EnhDlg=withEnh(Modal);

/**
 * 插入图片或文件对话框
 * @param {*} props 
 */
const InsertImgDlg=(props)=>{
    const {winW}= useSelector((state)=>({
        winW:       state.common.winW,
    }));

    const insertPicDlgW = (winW < 820 ? winW - 20 : 800);

    const [picPath, setPicPath]=useState('');
    const [picName, setPicName]=useState('');

    let elePicPath=useRef();
    let elePicName=useRef();

    
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
     * 使组件获得焦点
     * @param {*} nextRef 
     * @param {*} e 
     */
    const onFocusEle=useCallback((nextRef,e)=>{
        if(e){
            e.preventDefault();
            e.stopPropagation();
        }
        if(nextRef && nextRef.current){
            nextRef.current.focus();
        }
    },[]);

    //显示时清空输入框并选中第一个输入框 
    useEffect(()=>{
        if(props.visible) {
             setPicPath('');
             setPicName('');
             setTimeout(() => {
                 onFocusEle(elePicPath);
             }, 300);
        }
     },[props.visible, onFocusEle]);
 

    /**
     * 选择图片或附件文件，选择后更新输入框，并使第二个输入框获得焦点
     */
    const onSelPicFile = () => {
        (async()=>{
            let selFilePaths = (props.isImg ?await api.selPicFile() :await api.selAttFile());
            if (selFilePaths && selFilePaths[0]) {
                let fullpath = selFilePaths[0];
                let fn = fullpath.substring(Math.max(fullpath.lastIndexOf("\\"), fullpath.lastIndexOf("/")) + 1);
                
                setPicPath(fullpath);
                setPicName((oldName)=>(''===oldName.trim() ? fn : oldName.trim()));
                onFocusEle(elePicName);
            }
        })();   
    }

    /**
     * 确定按钮点击事件
     * @param {*} e 
     */
    const onOk=(e)=>{
        if(e){
            e.preventDefault();
            e.stopPropagation();
        }
        const fun=(props.isImg ? onValidateAddPic : onValidateAddAtt);
        fun({
            insertPicPath: picPath, 
            insertPicName: picName
        });
    }

    /**
     * 插入图片时的校验
     * @param {*} param0 
     */
    const onValidateAddPic = ({insertPicPath, insertPicName}) => {
        const pathAndName={insertPicPath, insertPicName};
        (async()=>{
            try{
                if (null != insertPicPath && 
                        "" !== insertPicPath.trim() && 
                        !await api.existsFullpath(insertPicPath) &&
                        !await api.isUrlFormat(insertPicPath)) {
                    api.showNotification("警告", "图片路径或url格式有误", "warn");
                    return;
                }
                if (null == insertPicName || "" ===insertPicName.trim()) {
                    api.showNotification("警告", "图片显示名称不能为空", "warn");
                    return;
                }
                if (insertPicName.includes("/") || insertPicName.includes("\\")) {
                    api.showNotification("警告", '图片显示名称格式有误，不能包含 "/" 或 "\\" ', "warn");
                    return;
                }
                if (true ===await api.existsPic(insertPicName)) {
                    Modal.confirm({
                        title: '是否覆盖',
                        content: <>
                            <div css={{ marginBottom: 10 }}>图片显示名称已存在，是否要覆盖 ？</div>
                            <Button type="link" title='查看已有同名图片' css={{ margin: 0, padding: 0 }} onClick={api.openPicByName.bind(this,insertPicName)}>查看已有同名图片</Button>
                        </>,
                        icon: <QuestionCircleOutlined />,
                        onOk: copyPicAndAddTxt.bind(this,pathAndName),
                        okText:'确定',
                        cancelText:'取消',
                    });
                    return;
                }

                copyPicAndAddTxt(pathAndName);




            }catch(e){
                console.log(e);
            }
        })();
    }

    /**
     * 插入附件时的校验
     * @param {*} param0 
     */
    const onValidateAddAtt = ({insertPicPath, insertPicName}) => {
        const pathAndName={insertPicPath, insertPicName};
        (async()=>{
            try{
                if (null == insertPicPath && 
                        "" === insertPicPath.trim()) {
                    api.showNotification("警告", "附件路径或url不能为空", "warn");
                    return;
                }
                if (null != insertPicPath && 
                        "" !== insertPicPath.trim() && 
                        !await api.existsFullpath(insertPicPath) &&
                        !await api.isUrlFormat(insertPicPath)) {
                    api.showNotification("警告", "附件路径或url格式有误", "warn");
                    return;
                }
                if (null == insertPicName || "" === insertPicName.trim()) {
                    api.showNotification("警告", "附件显示名称不能为空", "warn");
                    return;
                }
                if (insertPicName.includes("/") || insertPicName.includes("\\")) {
                    api.showNotification("警告", '附件显示名称格式有误，不能包含 "/" 或 "\\" ', "warn");
                    return;
                }
                if (true ===await api.existsAtt(insertPicName)) {
                    Modal.confirm({
                        title: '是否覆盖',
                        content: <>
                            <div css={{ marginBottom: 10 }}>附件显示名称已存在，是否要覆盖 ？</div>
                            <Button type="link" title='查看已有同名附件' css={{ margin: 0, padding: 0 }} onClick={api.openAttByName.bind(this,insertPicName)}>查看已有同名附件</Button>
                        </>,
                        icon: <QuestionCircleOutlined />,
                        onOk: copyAttAndAddTxt.bind(this,pathAndName),
                        okText:'确定',
                        cancelText:'取消',
                    });
                    return;
                }
                copyAttAndAddTxt(pathAndName);
                return;
            }catch(e){
                console.log(e);
            }
        })();
    }

    /**
     * 插入图片的校验
     * @param {*} param0 
     */
    const copyPicAndAddTxt = ({insertPicPath, insertPicName}) => {
        //如果路径为空，则从剪切板找图片；否则从指定路径加载图片
        let prom =null;
        if(''===insertPicPath.trim()){//路径为空，从剪切板取图片
            prom=api.copyClipboardPicToImgsDir(insertPicName, props.activeKey);
        }else{//路径不为空，从文件取图片
            prom=api.copyPicToImgsDir(insertPicPath,insertPicName, props.activeKey);
        }
        prom.then(rs=>{
            props.onCancel();
            props.onAddPic(rs,insertPicName);
        }).catch(e=>{
            message.warn(e.msg);
        });
        return;
    }

    /**
     * 插入附件的校验
     * @param {*} param0 
     */
    const copyAttAndAddTxt = ({insertPicPath, insertPicName}) => {
        //从指定路径加载附件
        let prom = api.copyAttToAttsDir(insertPicPath,insertPicName, props.activeKey);          
        prom.then(rs=>{
            props.onCancel();
            props.onAddAtt(rs,insertPicName);
        }).catch(e=>{
            message.warn(e.msg);
        });
        return;
    }


    
    return (
        <EnhDlg
                title={props.isImg?"插入图片":"插入附件"}
                closable={true}
                size={{w: insertPicDlgW}}
                visible={props.visible}
                onCancel={props.onCancel}
                onOk={onOk}>
                    
            <div css={insertImgFormStyle}>
                <div className='row'>
                    <div className='cell lab'>{props.isImg?'图片位置：':'附件位置：'}</div>
                    <div className='cell'>
                        <Input 
                            value={picPath}
                            onPressEnter={onFocusEle.bind(this,elePicName)}
                            ref={elePicPath}
                            onChange={onChange.bind(this,setPicPath)} 
                            addonAfter={<FolderOpenOutlined onClick={onSelPicFile} css={{ cursor: 'pointer' }} />} 
                            placeholder={props.isImg?'请输入图片路径、url、留空（以从剪切版读取）':'请输入附件路径或url'} />
                    </div>
                </div>
                <div className='row'>
                    <div className='cell lab'>显示名称：</div>
                    <div className='cell'>
                        <Input 
                            value={picName} 
                            onPressEnter={onOk}
                            ref={elePicName}
                            onChange={onChange.bind(this,setPicName)} 
                            placeholder={props.isImg?'请输入图片显示名称':'请输入附件显示名称'} />
                    </div>
                </div>
            </div>
        </EnhDlg>
    );
    
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

export default React.memo(InsertImgDlg);