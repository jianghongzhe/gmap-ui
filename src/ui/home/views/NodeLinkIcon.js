/** @jsxImportSource @emotion/react */
import React, { useEffect, useState } from 'react';
import { Button, Avatar  } from 'antd';
import { LinkOutlined,CodeOutlined,FolderOpenOutlined,CopyOutlined } from '@ant-design/icons';
import api from '../../../service/api';
import relaPic from '../../../assets/relachart.png';

const NodeLinkIcon=(props)=>{
    const [localIcon, setLocalIcon]=useState(null);

    /**
     * 异步加载指定协议url（file、http、https、dir）对应的图标，如果状态为已取消，则停止操作
     */
    useEffect(()=>{
        let canceled=false;
        if(["file://", "http://", "https://", "dir://", "openas://"].some(pref=>props.lindAddr.startsWith(pref))){
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
        return getLinkIcon(props.lindAddr, props.onClick);
    }
    return <Avatar size={18} src={localIcon} css={avatarStyle} onClick={props.onClick}/>;
};



const getLinkIcon=(addr ,onClick)=>{
    if(addr.startsWith("gmap://")){
        return <Avatar size={18} src={relaPic} css={avatarStyle} onClick={onClick}/>;
    }
    if(addr.startsWith("cp://")){
        return getBtn(<CopyOutlined className='themebtnicon' css={colors.copy}/>, onClick);
    }
    if(addr.startsWith("dir://")){
        return getBtn(<FolderOpenOutlined className='themebtnicon' css={colors.dir}/>, onClick);
    }
    if(addr.startsWith("cmd://")){
        return getBtn(<CodeOutlined className='themebtnicon' css={colors.cmd}/>, onClick);
    }
    return getBtn(<LinkOutlined className='themebtnicon' css={colors.link}/>, onClick);
}

const getBtn=(icon, onClick)=>{
    return <Button 
        type="link" 
        size='small' 
        className='themebtn'
        icon={icon}  
        onClick={onClick}/>;
};

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