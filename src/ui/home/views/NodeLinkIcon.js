/** @jsxImportSource @emotion/react */
import React, { useEffect, useState } from 'react';
import { Button,Tooltip, Progress,Avatar  } from 'antd';
import { FormOutlined,LinkOutlined,ReadOutlined,ClockCircleOutlined,CodeOutlined,FolderOpenOutlined,CloseOutlined,CopyOutlined,CheckOutlined } from '@ant-design/icons';

const NodeLinkIcon=(props)=>{
    const [localIcon, setLocalIcon]=useState(null);

    useEffect(()=>{
        if(["file:///", "http://", "https://"].some(pref=>props.lindAddr.startsWith(pref))){
            console.log("获取icon", props.lindAddr);
            setTimeout(() => {
                setLocalIcon('http://localhost:3000/favicon.ico');
            }, 2000);
        }

        
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