/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Input, Space, Typography} from 'antd';
import { Controlled } from 'react-codemirror2';
import api from '../../../service/api';


const { Title,Paragraph } = Typography;

const FindInFileDlg=(props)=>{
    const [title, setTitle, onTitleChange]= useChange('');
    const [cont, setCont, onContChange]= useChange('');
    const [both, setBoth, onBothChange]= useChange('');

    const [searchResults, setSearchResults]= useState([]);

    const titleRef= useRef();
    const contRef= useRef();
    const bothRef= useRef();

    // 当显示时使第一个输入框获得焦点
    useEffect(()=>{
        if(props.visible){
            focusRef(titleRef, true);
        }
    },[props.visible]);


    //
    const doSearch=useCallback(()=>{
        if(!props.visible){
            return;
        }
        (async () => {
            const result=await api.searchInFile({title, cont, both});
            if(result && true===result.succ){
                setSearchResults(result.data);
            }
        })();
    },[title, cont, both, setSearchResults, props.visible]);

    useEffectDebounce(doSearch);

    // // 当输入框值有改变时，自动触发查询，同时做防抖处理
    // const debouceConf=useRef({timer:null, lastTime:0});
    // useEffect(()=>{
    //     if(!props.visible){
    //         return;
    //     }
    //     const currTime=new Date().getTime();        
    //     if(currTime-debouceConf.current.lastTime<400){
    //         if(debouceConf.current.timer){
    //             clearTimeout(debouceConf.current.timer);
    //         }
    //     }
    //     debouceConf.current.lastTime=currTime;
    //     debouceConf.current.timer=setTimeout(async () => {
    //         const result=await api.searchInFile({title, cont, both});
    //         if(true===result.succ){
    //             setSearchResults(result.data);
    //         }
    //     }, 400);
    // },[title, cont, both, props.visible, setSearchResults]);

    
    const openMap=useCallback((fullTitle)=>{
        api.openUrl(`gmap://${fullTitle}`);
        props.onCancel();
    },[props.onCancel]);



    return <Modal 
            visible={props.visible}
            title="文件内查找"
            footer={null}
            width={"calc(80vw)"}
            onCancel={props.onCancel}>
        <div>
            <Space direction='vertical' css={{width:"80%"}}>
                <Input addonBefore="标题：　　　" size="large" allowClear={true} value={title} onChange={onTitleChange} ref={bindInputRef.bind(this, titleRef)} onPressEnter={focusRef.bind(this, contRef, false)}/>
                <Input addonBefore="内容：　　　" size="large" allowClear={true} value={cont} onChange={onContChange} ref={bindInputRef.bind(this, contRef)} onPressEnter={focusRef.bind(this, bothRef, false)}/>
                <Input addonBefore="标题和内容：" size="large" allowClear={true} value={both} onChange={onBothChange} ref={bindInputRef.bind(this, bothRef)} onPressEnter={focusRef.bind(this, titleRef, false)}/>
            </Space>
            <div css={{marginTop:'40px', maxHeight: 'calc(100vh - 350px)',height: 'calc(100vh - 450px)', overflowY:'auto'}}>
                {
                    searchResults.map((searchItem, ind)=><div css={{cursor:'pointer', marginBottom:'30px'}} onClick={openMap.bind(this, searchItem.fullTitle)}>
                        <Title level={4}>
                            {
                                searchItem.titleParts.map((item,ind)=><React.Fragment key={"txt-"+ind}>
                                    {
                                        true===item.keyword ? 
                                            <span css={{color:'#f73131'}}>{item.txt}</span>
                                                :
                                            <span>{item}</span>
                                    }
                                </React.Fragment>)
                            }  
                        </Title>
                        <Paragraph >
                            {
                                searchItem.contParts.map((item,ind)=><React.Fragment key={"txt-"+ind}>
                                    {
                                        true===item.keyword ? 
                                            <span css={{color:'#f73131',fontWeight:'bold'}}>{item.txt}</span>
                                                :
                                            <span>{item}</span>
                                    }
                                </React.Fragment>)
                            }                           
                        </Paragraph>
                    </div>)
                }
            </div>
        </div>
    </Modal>;
};



const useEffectDebounce=(fun)=>{
    const debouceConf=useRef({timer:null, lastTime:0});
    
    const currTime=new Date().getTime();        
    if(currTime-debouceConf.current.lastTime<400){
        if(debouceConf.current.timer){
            clearTimeout(debouceConf.current.timer);
        }
    }
    debouceConf.current.lastTime=currTime;
    debouceConf.current.timer=setTimeout(fun, 400);
};

const bindInputRef=(refObj, e)=>{
    if(e && e.input){
        refObj.current=e.input;
    }
};

const focusRef=(refObj, delay=true)=>{
    const func=()=>{
        if(refObj && refObj.current){
            refObj.current.focus();
        }
    };
    if(!delay){
        func();
        return;
    }
    setTimeout(func, 400);
};

const useChange=(initVal='')=>{
    const [txt, setTxt]= useState(initVal);
    const onChange=useCallback((e)=>{
        setTxt(e.target.value);
    },[setTxt]);
    return [txt, setTxt, onChange];
};

export default React.memo(FindInFileDlg);