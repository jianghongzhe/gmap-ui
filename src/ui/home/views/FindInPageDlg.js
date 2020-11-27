/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Layout, Input, Tabs, Modal, Form, message, Button, Divider, Popover } from 'antd';
import { PictureOutlined, FolderOpenOutlined, QuestionCircleOutlined,UpOutlined,DownOutlined } from '@ant-design/icons';
import {withEnh} from '../../common/specialDlg';
import api from '../../../service/api';
import * as uiUtil from '../../../common/uiUtil';


const EnhDlg=withEnh(Modal);

const FindInPageDlg=(props)=>{
    const [txt, setTxt]=useState('');
    // const txtRef= useRef('');
    // const eleTxt=useRef();
    // txtRef.current=txt;


    const changeTxt=useCallback((e)=>{
        let val=e.target.value;
        setTxt(val);
        // if(''!==val.trim()){
        //     api.findInPage(val.trim());
        //     setTimeout(() => {
        //         eleTxt.current.focus();    
        //     }, 300);
            
        // }
    },[setTxt]);


    // useEffect(()=>{
    //     if(props.visible){
    //         if(''!==txtRef.current.trim()){
    //             api.findInPage(txtRef.current.trim());
    //             eleTxt.current.focus();
    //         }
    //         return;
    //     }
    //     if(!props.visible){
    //         api.stopFindInPage();
    //         return;
    //     }
    // },[props.visible]);

    const onEnter=(e)=>{
        if(!props.visible){
            return;
        }

        e.stopPropagation();
        e.preventDefault();

        if(''===txt.trim()){
            props.onCancel();
            api.stopFindInPage();
            return;
        }

        props.onCancel();
        api.findInPage(txt.trim());
    }


    return <EnhDlg visible={props.visible} noTitle={true} noFooter={true} onCancel={props.onCancel} closable={false}>
        <Input suffix={<span>
            <Button shape="circle" icon={<UpOutlined/>} css={{marginRight: '5px'}}></Button>
            <Button shape="circle" icon={<DownOutlined />}></Button>
        </span>} value={txt} onChange={changeTxt}
        onPressEnter={onEnter}/>
    </EnhDlg>
};

export default FindInPageDlg;