import React, {useEffect, useMemo, useRef} from 'react';
import {Empty, Input, Modal, Space, Typography} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import api from '../../../service/api';
import {useBindInputRef, useChange} from '../../../common/commonHooks';
import {focusRef} from '../../../common/uiUtil';
import {useDebounceEffect, useMemoizedFn, useRafState, useSize} from 'ahooks';
import {useSelectFileListItem} from '../../../hooks/tabs';
import TagItem from "../../common/TagItem";
import styles from './FindInFileDlg.module.scss';

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
    const [expTags, setExpTags]= useRafState([]);
    const [hasUnclosedQuot, setHasUnclosedQuot]= useRafState(false);
    const [expRef, bindExpRef]= useBindInputRef();
    const [allTags, setAllTags]=useRafState([]);

    const refcondPart = useRef(null);
    const condPartSize = useSize(refcondPart);
    const searchResultHeight= useMemo(()=>`calc(100vh - 360px - ${condPartSize?.height || 0}px)`,[condPartSize]);


    // 当显示时使第一个输入框获得焦点，同时加载所有标签
    useEffect(()=>{
        if(visible){
            focusRef(expRef, true);
            (async () => {
                const [e,result]=await api.searchAllTags()
                if(!e){
                    setAllTags(result.Txts);
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
            setExpTags([]);
            return;
        }
        (async () => {
            const [e,result]=await api.searchInFile(exp);
            if(!e){
                console.log("search resp", result);
                setSearchResults(result.Items??[]);
                setExpTags(result.Extra?.PreciseTags??[]);
                setHasUnclosedQuot(true===result.Extra?.HasUnclosedQuot);
            }
        })();
    },[exp, setSearchResults, setExpTags, visible],{wait: 500,});

    
    /**
     * 打开导图
     * @param {*} fullTitle 标题的全路径 a/b/c
     */
    const openMap=useMemoizedFn((fullTitle)=>{
        console.log("open map", fullTitle);
        api.openUrl(`gmap://${fullTitle}`, selectFileListItem);
        onCancel();
    });

    /**
     * 向添加或移除标签，根据表达式中是否存在判断
     * @type {(function(*): void)|*}
     */
    const appendOrRemoveTag= useMemoizedFn((tag)=>{
        setExp(oldExp=>{
            // 当前查询表达式包含指定标签，则从中剔除标签部分
            // 标签部分根据引号个数组装成不同表达式：tag:abc、tag:"abc"、tag:"abc
            const matchedItems=isTagInExp(tag)
            if(null!==matchedItems){
                let tmp=oldExp.trim();
                matchedItems.forEach(matchedItem=>{
                    let repl=null;
                    if(1===matchedItem.QuotCnt){
                        repl=`tag:"${matchedItem.Tag}`;
                    }else if(2===matchedItem.QuotCnt){
                        repl=`tag:"${matchedItem.Tag}"`;
                    }else{
                        repl=`tag:${matchedItem.Tag}`;
                    }
                    tmp=tmp.replace(repl, '').trim();
                });
                return (''===tmp ? '' : tmp+" ");
            }

            // 不包含，则把标签表达式附加到当前查询条件最后
            // 标签中如果有空格，则需要双引号包裹
            // 原表达式如果有未关闭的双绰号，则要先补一个再加入后面的表达式
            const tagWrapper=(tag.includes(" ") || tag.includes("　") ? '"' : '');
            return `${oldExp.trim()}${hasUnclosedQuot ? '"' : ''} tag:${tagWrapper}${tag}${tagWrapper}`.trim();
        });
        focusRef(expRef, false);
    });

    /**
     * 判断查找关键词中是否包含指定标签
     * @return
     * 不包含 - null
     * 包含 - [
     *  {
     *      tag: 'abc',
     *      quotCnt: 0/1/2
     *  }
     * ]
     */
    const isTagInExp= useMemoizedFn((tag)=>{
        const matchedItems=expTags.filter(expTag=>tag===expTag.Tag)
            .sort((e1,e2)=>e2.QuotCnt-e1.QuotCnt);
        if(0===matchedItems.length){
            return null;
        }
        return matchedItems;
    });


    return <Modal 
            open={visible}
            title="文件内查找"
            footer={null}
            width={"86vw"}
            onCancel={onCancel}>
        <div className={styles.root}>
            <Space direction='vertical' className='inputContainer'>
                <div ref={refcondPart}>
                    {/* <label>标题和内容：</label> */}
                    <Input className='ipt' prefix={<SearchOutlined />} 
                        placeholder='搜索关键词：  title:标题 、 txt:正文 、 full:全文 、 tag:标签精确、 tag*:标签模糊、 全文 、 !不匹配 、 "带 空 格"、 并列条件1 并列条件2'
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
                                     colored={null!==isTagInExp(tag)}
                                     onClick={appendOrRemoveTag.bind(this,tag)}
                            />
                        )
                    }
                </div>
            </Space>
            <div className='resultContainer' style={{'--h': searchResultHeight}}>
                {
                    searchResults.map((searchItem, ind)=><div key={`resultitem-${ind}`} className='item' >
                        <div className='txtpart' onClick={openMap.bind(this, searchItem.FullTitle)}>
                            <Title level={5} className='title'>
                                { searchItem.TitleParts.map((item,ind)=><ResultItem key={"title-"+ind} data={item}/>) }
                            </Title>
                            <Paragraph className='desc'>
                                <div>
                                { searchItem.ContParts.map((item,ind)=><ResultItem key={"cont-"+ind} data={item} bold={true}/>) }
                                </div>
                            </Paragraph>
                        </div>
                        {
                            null!=searchItem.Tags && searchItem.Tags.length>0 &&
                            <div style={{marginTop:'6px'}}>
                                {
                                    searchItem.Tags.map((tag,ind)=>
                                        <TagItem key={`tag-${ind}`}
                                                 tag={tag}
                                                 colored={null!==isTagInExp(tag)}
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




const ResultItem=({data, bold})=>{
    let highlightStyle={color:'#f73131'};
    if(bold){
        highlightStyle={...highlightStyle, fontWeight:'bold'}
    }

    return <React.Fragment>
        {
            true===data.Keyword ?
                <span style={highlightStyle}>{data.Txt}</span>
                    :
                <span>{data.Txt}</span>
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