import React from 'react';
import { Button, Avatar  } from 'antd';
import {useLoadIcon} from "../../../hooks/loadIcon";
import styles from './NodeLinkIcon.module.scss';
import classnames from "classnames";

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
        return getBtn(<IconComp className={classnames('themebtnicon', styles.assignedColor)}
                                style={{'--color':localIcon.color.color}}/>, onClick);
    }

    /*
        图片类型
        {
            type: 'image',
            url: 'file:///a/b/c.jpg',
        }
     */
    if('image'===localIcon.type){
        return <Avatar size={18} src={localIcon.url} className={styles.avatarStyle} onClick={onClick}/>;
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


export default React.memo(NodeLinkIcon);