import React, { useEffect, useState } from 'react';
import { Button, Avatar  } from 'antd';
import {useLoadIcon} from "../../../hooks/loadIcon";

const NodeLinkIcon=({lindAddr,onClick,})=>{

    const [localIcon]= useLoadIcon({lindAddr});

    if(!localIcon || !localIcon.type || ('icon'!==localIcon.type && 'image'!==localIcon.type)){
        return null;
    }

    /*
        图标类型
        {
            type: 'icon',
            color: 'red',
            compType: MyComp,
        }
     */
    if('icon'===localIcon.type){
        const IconComp=localIcon.compType;
        return getBtn(<IconComp className='themebtnicon' css={localIcon.color}/>, onClick);
    }

    /*
        图片类型
        {
            type: 'image',
            url: 'file:///a/b/c.jpg',
        }
     */
    if('image'===localIcon.type){
        return <Avatar size={18} src={localIcon.url} css={avatarStyle} onClick={onClick}/>;
    }
};



const getBtn=(icon, onClick)=>{
    return <Button
        type="link" 
        size='small' 
        className='themebtn'
        icon={icon}  
        onClick={onClick}
    />;
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


export default React.memo(NodeLinkIcon);