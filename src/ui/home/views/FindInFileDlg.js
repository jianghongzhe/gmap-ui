import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {Empty, Input, Modal, Space, Typography, Tag} from 'antd';
import {SearchOutlined, TagOutlined} from '@ant-design/icons';
import api from '../../../service/api';
import {useBindInputRef, useChange} from '../../../common/commonHooks';
import {focusRef} from '../../../common/uiUtil';
import {useDebounceEffect, useMemoizedFn, useRafState, useSize} from 'ahooks';
import {useSelectFileListItem} from '../../../hooks/tabs';

const { Title,Paragraph } = Typography;


/**
 * 在文件中查找的对话框
 * @param {*} param0 
 * @returns 
 */
const FindInFileDlg=({visible, onCancel})=>{  

    const selectFileListItem= useSelectFileListItem();
    const [exp, {change: onExpChange, set: setExp}]= useChange('');
    const [searchResults, setSearchResults]= useRafState([]);
    const [expRef, bindExpRef]= useBindInputRef();
    const [allTags, setAllTags]=useRafState([]);

    const refcondPart = useRef(null);
    const condPartSize = useSize(refcondPart);
    const searchResultHeight= useMemo(()=>`calc(100vh - 360px - ${condPartSize ? condPartSize.height: 0}px)`,[condPartSize]);


    // 当显示时使第一个输入框获得焦点，同时加载所有标签
    useEffect(()=>{
        if(visible){
            focusRef(expRef, true);
            (async () => {
                const result=await api.searchAllTags()
                if(result && true===result.succ){
                    setAllTags(result.data);
                    console.log("all tags: ", result.data);
                }
            })();
        }
    },[visible, expRef, setAllTags]);


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

    /**
     * 向添加或移除标签，根据表达式中是否存在判断
     * @type {(function(*): void)|*}
     */
    const appendOrRemoveTag= useMemoizedFn((tag)=>{
        setExp(oldExp=>{
            var resultExp=` ${oldExp} `
            const tagExp=` tag:${tag} `;

            if(resultExp.includes(tagExp)){
                while(resultExp.includes(tagExp)){
                    resultExp=resultExp.replace(tagExp, " ");
                }
                resultExp= resultExp.trim();
                return (null===resultExp || ''===resultExp ? "" : resultExp+" ");
            }
            resultExp= `${resultExp.trim()} ${tagExp.trim()}`.trim()
            return (null===resultExp || ''===resultExp ? "" : resultExp+" ");
        });
        focusRef(expRef, false);
    });

    const isTagInExp= useMemoizedFn((tag)=> (` ${exp} `).includes(` tag:${tag} `));


    return <Modal 
            open={visible}
            title="文件内查找"
            footer={null}
            width={"86vw"}
            onCancel={onCancel}>
        <div>
            <Space direction='vertical' css={inputContainerStyle}>
                <div ref={refcondPart}>
                    {/* <label>标题和内容：</label> */}
                    <Input className='ipt' prefix={<SearchOutlined />} 
                        placeholder="搜索关键词：  t:标题 、 c:正文 、 f:全文 、 tag:标签 、 全文 、 !不匹配 、 并列条件1 并列条件2"
                        size="large"  allowClear={true} value={exp} onChange={onExpChange} ref={bindExpRef} onPressEnter={setExp.bind(this,'')}/>
                    {
                        (searchResults && searchResults.length>0) &&
                            <span className='matchCntTxt'>共 <span className='num'>{searchResults.length}</span> 个匹配项</span>
                    }
                </div>
                <div>
                    {
                        allTags.map((tag,ind)=>
                            <TagItem key={`tag-${ind}`}
                                     tag={tag}
                                     inExp={isTagInExp(tag)}
                                     onClick={appendOrRemoveTag.bind(this,tag)}
                            />
                        )
                    }
                </div>
            </Space>
            <div css={{marginTop:'40px', maxHeight: searchResultHeight,height: searchResultHeight, overflowY:'auto'}}>
                {
                    searchResults.map((searchItem, ind)=><div css={{marginBottom:'30px'}} >
                        <div style={{cursor:'pointer', }} onClick={openMap.bind(this, searchItem.fullTitle)}>
                            <Title level={5} >
                                { searchItem.titleParts.map((item,ind)=><ResultItem key={"title-"+ind} data={item}/>) }
                            </Title>
                            <Paragraph >
                                <div style={{cursor:'pointer', }} onClick={openMap.bind(this, searchItem.fullTitle)}>
                                { searchItem.contParts.map((item,ind)=><ResultItem key={"cont-"+ind} data={item} bold={true}/>) }
                                </div>
                            </Paragraph>
                        </div>
                        {
                            null!=searchItem.tags && searchItem.tags.length>0 &&
                            <div style={{marginTop:'6px'}}>
                                {
                                    searchItem.tags.map((tag,ind)=>
                                        <TagItem key={`tag-${ind}`}
                                                 tag={tag}
                                                 inExp={isTagInExp(tag)}
                                                 onClick={appendOrRemoveTag.bind(this,tag)}
                                        />
                                    )
                                }
                            </div>
                        }
                    </div>)
                }
                {
                    (null==searchResults || 0===searchResults.length) && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                }
            </div>
        </div>
    </Modal>;
};

const TagItem=({tag, inExp, onClick})=>{
    const extraAttr= inExp ? {color:'success'} : {};
    return (
        <Tag    {...extraAttr}
                icon={<TagOutlined />}
                style={{borderRadius:'10px',cursor:'pointer', }}
                onClick={onClick} >
            <span style={{fontWeight:'400'}}>{tag}</span>
        </Tag>
    );
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