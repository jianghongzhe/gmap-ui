import React, { useCallback, useEffect,  useState } from 'react';
import { Modal, Input, Space, Typography, Empty} from 'antd';
import {SearchOutlined} from '@ant-design/icons'
import api from '../../../service/api';
import {useChange, useBindInputRef} from '../../../common/commonHooks';
import {focusRef} from '../../../common/uiUtil';
import {useDebounceEffect} from 'ahooks';
import { useSelectFileListItem } from '../../../hooks/tabs';

const { Title,Paragraph } = Typography;


/**
 * 在文件中查找的对话框
 * @param {*} param0 
 * @returns 
 */
const FindInFileDlg=({visible, onCancel})=>{  

    const selectFileListItem= useSelectFileListItem();
    const [exp, {change: onExpChange, set: setExp}]= useChange('');
    const [searchResults, setSearchResults]= useState([]);
    const [expRef, bindExpRef]= useBindInputRef();


    // 当显示时使第一个输入框获得焦点
    useEffect(()=>{
        if(visible){
            focusRef(expRef, true);
        }
    },[visible, expRef]);


    // 当输入框值有改变时进行查询，同时进行防抖处理
    useDebounceEffect(()=>{
        if(!visible){
            return;
        }
        if(null==exp || ""===exp.trim()){
            setSearchResults([]);
            return;
        }
        (async () => {
            console.log("文件中查找");
            const result=await api.searchInFile(exp);
            if(result && true===result.succ){
                setSearchResults(result.data);
            }
        })();
    },[exp, setSearchResults, visible],{wait: 500,});

    
    /**
     * 打开导图
     * @param {*} fullTitle 标题的全路径 a/b/c
     */
    const openMap=useCallback((fullTitle)=>{
        api.openUrl(`gmap://${fullTitle}`, selectFileListItem);
        onCancel();
    },[onCancel, selectFileListItem]);



    return <Modal 
            visible={visible}
            title="文件内查找"
            footer={null}
            width={"86vw"}
            onCancel={onCancel}>
        <div>
            <Space direction='vertical' css={inputContainerStyle}>
                <div>
                    {/* <label>标题和内容：</label> */}
                    <Input className='ipt' prefix={<SearchOutlined />} 
                        placeholder="请输入搜索关键词：  t:标题 、 c:正文 、 f:全文 、 全文 、 !不匹配 、 并列条件1 并列条件2"
                        size="large"  allowClear={true} value={exp} onChange={onExpChange} ref={bindExpRef} onPressEnter={setExp.bind(this,'')}/>
                    {
                        (searchResults && searchResults.length>0) && <span className='matchCntTxt'>共 <span className='num'>{searchResults.length}</span> 个匹配项</span>
                    }
                </div>
            </Space>
            <div css={{marginTop:'40px', maxHeight: 'calc(100vh - 400px)',height: 'calc(100vh - 400px)', overflowY:'auto'}}>
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
                {
                    (null==searchResults || 0===searchResults.length) && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
        width:'80%',
    },
    '& div .matchCntTxt':{
        marginLeft:'30px',
        fontSize:'16px',
    },
    '& div .matchCntTxt > .num':{
        fontWeight:'bold',
        fontSize:'20px',
        color:'red',
    },

    
    
};



export default React.memo(FindInFileDlg);