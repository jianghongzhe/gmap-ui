/** @jsxImportSource @emotion/react */
import React, { useEffect, useState } from 'react';
import { Button, Avatar  } from 'antd';
import { LinkOutlined,CodeOutlined,FolderOpenOutlined,CopyOutlined } from '@ant-design/icons';
import api from '../../../service/api';

const NodeLinkIcon=(props)=>{
    const [localIcon, setLocalIcon]=useState(null);

    /**
     * 异步加载url对应的图标，如果状态为已取消，则停止操作
     */
    useEffect(()=>{
        let canceled=false;
        if(["file://", "http://", "https://"].some(pref=>props.lindAddr.startsWith(pref))){
            const fun=async ()=>{
                try{
                    const resp= await api.loadIcon(props.lindAddr);
                    if(resp.succ && resp.data){
                        if(!canceled){
                            try{
                                setLocalIcon(resp.data);
                            }catch(e){
                            }
                        }
                    }
                }catch(e){
                }
            };
            fun();
        }
        return ()=>{
            canceled=true;
        };
    },[props.lindAddr, setLocalIcon]);

    if(!localIcon){
        return <Button 
            type="link" 
            size='small' 
            className='themebtn'
            icon={getLinkIcon(props.lindAddr)}  
            onClick={props.onClick}/>;
    }
    return <Avatar size={18} src={localIcon} css={avatarStyle} onClick={props.onClick}/>;
};



const getLinkIcon=(addr)=>{
    if(addr.startsWith("cp://")){
        return <CopyOutlined className='themebtnicon' css={colors.copy}/>;
    }
    if(addr.startsWith("dir://")){
        return <FolderOpenOutlined className='themebtnicon' css={colors.dir}/>;
    }
    if(addr.startsWith("cmd://")){
        return <CodeOutlined className='themebtnicon' css={colors.cmd}/>;
    }
    return <LinkOutlined className='themebtnicon' css={colors.link}/>;
}

const avatarStyle={
    marginLeft:3,
    verticalAlign:'bottom',
    marginBottom:1,
    cursor:'pointer',
    borderRadius:0,
    // color: '#f56a00', 
    // backgroundColor: '#fde3cf',
};

const colors={
    ref: {color:'#faad14'},
    memo: {color:'#faad14'},
    link: {color:'#1890ff'},
    dir: {color:'orange'},
    cmd: {color:'gray'},
    copy: {color:'#1890ff'},
    linkDark: {color:'#faad14'},
};

export default NodeLinkIcon;