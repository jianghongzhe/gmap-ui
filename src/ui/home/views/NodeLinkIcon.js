import React from 'react';
import { Button, Avatar  } from 'antd';
import {useLoadIcon} from "../../../hooks/loadIcon";
import styles from './NodeLinkIcon.module.scss';
import classnames from "classnames";

const NodeLinkIcon=({lindAddr, icon, onClick,})=>{

    const [localIcon]= useLoadIcon({lindAddr, icon});

    if(!localIcon || !localIcon.type || ('icon'!==localIcon.type && 'image'!==localIcon.type && 'cascade'!==localIcon.type)){
        return null;
    }


    /*
        叠加类型:
        小图标外层需要一个包裹层，用来设置一个背景（白色+部分透明），以防止与小图与主图混在一起无法区分
        {
            type: 'cascade',
            items: [
                {
                    type: 'icon',
                    color: {color:'red'},
                    compType: MyComp,
                },
                {
                    type: 'image',
                    url: 'file:///a/b/c.jpg',
                }
            ],
        }
     */
    if('cascade'===localIcon.type){
        return <div className={styles.cascadeContainer} onClick={onClick}>
            {
                'icon'===localIcon.items[0].type ?
                    getIconItem(localIcon.items[0].compType, localIcon.items[0].color.color, true) :
                    getUrlItem(localIcon.items[0].url, true)
            }
            <div className="small_wrapper">
            {
                'icon'===localIcon.items[1].type ?
                    getIconItem(localIcon.items[1].compType, localIcon.items[1].color.color, false) :
                    getUrlItem(localIcon.items[1].url, false)
            }
            </div>
        </div>;
    }

    /*
        图标类型
        {
            type: 'icon',
            color: {color:'red'},
            compType: MyComp,
        }
     */
    if('icon'===localIcon.type){
        return <div className={styles.cascadeContainer} onClick={onClick}>
            {getIconItem(localIcon.compType, localIcon.color.color, true)}
        </div>;
    }

    /*
        图片类型
        {
            type: 'image',
            url: 'file:///a/b/c.jpg',
        }
     */
    if('image'===localIcon.type){
        return <div className={styles.cascadeContainer} onClick={onClick}>
            {getUrlItem(localIcon.url, true)}
        </div>;
    }
};


const getUrlItem=(url, big=true)=>{
    return <Avatar size={big?20:10} src={url} className={[styles.avatarStyle, big?"big":"small"]} />;
};

const getIconItem=(IconCls, color, big=true)=>{
    if(!color || "default"===color){
        return <IconCls className={classnames('themebtnicon',  big?"big":"small")}/>
    }
    return <IconCls className={classnames('themebtnicon', styles.assignedColor, big?"big":"small")} style={{'--color':color}}/>
};


// const getBtn=(IconCls, color, onClick)=>{
//     // return <Button
//     //     type="link"
//     //     size='small'
//     //     className='themebtn'
//     //     icon={icon}
//     //     onClick={onClick}
//     // />;
//     console.log("icon color", color);
//     return <div className={styles.cascadeContainer} onClick={onClick}>
//         <IconCls className={classnames('themebtnicon', styles.assignedColor, "big")} style={{'--color':color}}/>
//         <IconCls className={classnames('themebtnicon', styles.assignedColor, "small")} style={{'--color':color}}/>
//     </div>;
// };


export default React.memo(NodeLinkIcon);