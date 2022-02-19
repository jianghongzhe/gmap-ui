/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect,  useState } from 'react';
import { Modal, Input, Space, Typography} from 'antd';
import api from '../../../service/api';
import {useChange, useBindInputRef} from '../../../common/commonHooks';
import {focusRef} from '../../../common/uiUtil';
import {useDebounceEffect} from 'ahooks';

const { Title,Paragraph } = Typography;


/**
 * 在文件中查找的对话框
 * @param {*} param0 
 * @returns 
 */
const FindInFileDlg=({visible, onCancel})=>{
    const [title, {change: onTitleChange}]= useChange('');
    const [cont, {change: onContChange}]= useChange('');
    const [both, {change: onBothChange}]= useChange('');
    const [searchResults, setSearchResults]= useState([]);

    const [titleRef, bindTitleRef]= useBindInputRef();
    const [contRef, bindContRef]= useBindInputRef();
    const [bothRef, bindBothRef]= useBindInputRef();


    // 当显示时使第一个输入框获得焦点
    useEffect(()=>{
        if(visible){
            focusRef(titleRef, true);
        }
    },[visible, titleRef]);


    // 当输入框值有改变时进行查询，同时进行防抖处理
    useDebounceEffect(()=>{
        if(!visible){
            return;
        }
        if((null==title || ""===title.trim()) && (null==cont || ""===cont.trim()) && (null==both || ""===both.trim())){
            setSearchResults([]);
            return;
        }
        (async () => {
            console.log("文件中查找");
            const result=await api.searchInFile({title, cont, both});
            if(result && true===result.succ){
                setSearchResults(result.data);
            }
        })();
    },[title, cont, both, setSearchResults, visible],{wait: 500,});

    
    /**
     * 打开导图
     * @param {*} fullTitle 标题的全路径 a/b/c
     */
    const openMap=useCallback((fullTitle)=>{
        api.openUrl(`gmap://${fullTitle}`);
        onCancel();
    },[onCancel]);



    return <Modal 
            visible={visible}
            title="文件内查找"
            footer={null}
            width={"86vw"}
            onCancel={onCancel}>
        <div>
            <Space direction='vertical' css={inputContainerStyle}>
                <div>
                    <label>标题：</label>
                    <Input className='ipt' size="large"  allowClear={true} value={title} onChange={onTitleChange} ref={bindTitleRef} onPressEnter={focusRef.bind(this, contRef, false)}/>
                </div>
                <div>
                    <label>内容：</label>
                    <Input className='ipt' size="large" allowClear={true} value={cont} onChange={onContChange} ref={bindContRef} onPressEnter={focusRef.bind(this, bothRef, false)}/>
                </div>
                <div>
                    <label>标题和内容：</label>
                    <Input className='ipt' size="large"  allowClear={true} value={both} onChange={onBothChange} ref={bindBothRef} onPressEnter={focusRef.bind(this, titleRef, false)}/>
                </div>
            </Space>
            <div css={{marginTop:'40px', maxHeight: 'calc(100vh - 350px)',height: 'calc(100vh - 450px)', overflowY:'auto'}}>
                {
                    searchResults.map((searchItem, ind)=><div css={{cursor:'pointer', marginBottom:'30px'}} onClick={openMap.bind(this, searchItem.fullTitle)}>
                        <Title level={5}>
                            { searchItem.titleParts.map((item,ind)=><ResultItem key={"title-"+ind} data={item}/>) }  
                        </Title>
                        <Paragraph >
                            { searchItem.contParts.map((item,ind)=><ResultItem key={"cont-"+ind} data={item} bold={true}/>) }   
                        </Paragraph>
                    </div>)
                }
            </div>
        </div>
    </Modal>;
};


const ResultItem=({data, bold})=>{
    let highlightStyle={color:'#f73131'};
    if(bold){
        highlightStyle={...highlightStyle, fontWeight:'bold'}
    }

    return <React.Fragment>
        {
            true===data.keyword ? 
                <span css={highlightStyle}>{data.txt}</span>
                    :
                <span>{data}</span>
        }
    </React.Fragment>;
};


const inputContainerStyle={
    width:"100%",
    '& div label':{
        display:'inline-block',
        width:'90px', 
        textAlign:'right',
        marginRight:'10px',
    },
    '& div .ipt':{
        width:'60%',
    }
};



export default React.memo(FindInFileDlg);