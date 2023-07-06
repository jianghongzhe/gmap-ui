import React from 'react';
import {TagOutlined} from "@ant-design/icons";
import {Tag} from "antd";

const TagItem=({tag, colored=false, onClick=null, onClose=null, icon=null})=>{
    let styleProps={
        borderRadius:'10px',
    };
    let otherProps={
    };

    if(colored){
        otherProps={...otherProps, color: true===colored ? 'success' : `${colored}`};
    }
    if(onClick){
        styleProps={...styleProps, cursor:'pointer',};
        otherProps={...otherProps, onClick};
    }
    if(onClose){
        otherProps={
            ...otherProps,
            closable: true,
            onClose,
        };
    }
    return (
        <Tag icon={icon ? icon : <TagOutlined />} {...otherProps} style={styleProps}>
            <span style={{fontWeight:'400'}}>{tag}</span>
        </Tag>
    );
};

export default React.memo(TagItem);