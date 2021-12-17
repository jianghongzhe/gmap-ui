/** @jsxImportSource @emotion/react */
import React, { useEffect, useState } from 'react';
import { Button, Avatar  } from 'antd';
import { LinkOutlined,CodeOutlined,CopyOutlined,FolderOutlined,DeploymentUnitOutlined,AppstoreOutlined,FileUnknownOutlined,CheckSquareOutlined } from '@ant-design/icons';
import api from '../../../service/api';

const NodeLinkIcon=(props)=>{
    const [localIcon, setLocalIcon]=useState(null);

    /**
     * 异步加载指定协议url（file、http、https、dir）对应的图标，如果状态为已取消，则停止操作
     */
    useEffect(()=>{
        let canceled=false;
        if(["file://", "http://", "https://", "dir://", "openas://","openby://","diropenby://","openin://", "gmap://", "cppath://"].some(pref=>props.lindAddr.startsWith(pref))){
            const fun=async ()=>{
                try{
                    const resp= await api.loadIcon(props.lindAddr);
                    if(resp && resp.succ && resp.data){
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

    // 未找到匹配的图标，使用默认的按钮
    if(!localIcon){
        return getLinkIcon(props.lindAddr, props.onClick);
    }

    // 找到匹配的图标
    // 特殊名称：folder
    if("folder"===localIcon){
        return getBtn(<FolderOutlined className='themebtnicon' css={colors.dir}/>, props.onClick);
    }
    // 特殊名称：dir
    if("dir"===localIcon){
        //<CheckSquareOutlined />
        return getBtn(<CheckSquareOutlined className='themebtnicon' css={colors.link}/>, props.onClick);
    }
    // 特殊名称：openas
    if("openas"===localIcon){
        return getBtn(<AppstoreOutlined className='themebtnicon' css={colors.link}/>, props.onClick);
    }
    // 特殊名称：openby
    if("openby"===localIcon){
        return getBtn(<FileUnknownOutlined className='themebtnicon' css={colors.link}/>, props.onClick);
    }
    // 特殊名称：openin
    if("openin"===localIcon){
        return getBtn(<FileUnknownOutlined className='themebtnicon' css={colors.link}/>, props.onClick);
    }
    // 特殊名称：gmap
    if("gmap"===localIcon){
        return getBtn(<DeploymentUnitOutlined className='themebtnicon' css={colors.link}/>, props.onClick);
    }
    // 特殊名称：cppath
    if("cppath"===localIcon){
        return getBtn(<CopyOutlined className='themebtnicon' css={colors.link}/>, props.onClick);
    }
    


    // 直接使用本地图片文件
    return <Avatar size={18} src={localIcon} css={avatarStyle} onClick={props.onClick}/>;
};


/**
 * 获得链接默认的按钮：根据不同链接类型获得不同按钮
 * @param {*} addr 
 * @param {*} onClick 
 * @returns 
 */
const getLinkIcon=(addr ,onClick)=>{
    // 需要验证的类型，默认为灰色，验证后为蓝色或正常色
    // 打开方式：默认为灰色，如果路径有效则为蓝色
    if(addr.startsWith("openas://")){
        return getBtn(<AppstoreOutlined className='themebtnicon' css={colors.disable}/>, onClick);
    }
    if(addr.startsWith("openby://")){
        return getBtn(<FileUnknownOutlined className='themebtnicon' css={colors.disable}/>, onClick);
    }
    if(addr.startsWith("diropenby://")){
        return getBtn(<FileUnknownOutlined className='themebtnicon' css={colors.disable}/>, onClick);
    }
    if(addr.startsWith("openin://")){
        return getBtn(<FileUnknownOutlined className='themebtnicon' css={colors.disable}/>, onClick);
    }
    // 打开并选中：默认为灰色，如果路径有效则为蓝色
    if(addr.startsWith("dir://")){
        return getBtn(<CheckSquareOutlined className='themebtnicon' css={colors.disable}/>, onClick);
    }
    // 导图链接图标：默认为灰色，如果路径有效则为蓝色
    if(addr.startsWith("gmap://")){
        return getBtn(<DeploymentUnitOutlined className='themebtnicon' css={colors.disable}/>, onClick);
    }
    // 文件
    if(addr.startsWith("file://")){
        return getBtn(<LinkOutlined className='themebtnicon' css={colors.disable}/>, onClick);
    }
    // 复制路径
    if(addr.startsWith("cppath://")){
        return getBtn(<CopyOutlined className='themebtnicon' css={colors.disable}/>, onClick);
    }
    
    // 不需要验证的类型
    // 复制文本
    if(addr.startsWith("cp://")){
        return getBtn(<CopyOutlined className='themebtnicon' css={colors.copy}/>, onClick);
    }
    
    // 命令图标
    if(addr.startsWith("cmd://")){
        return getBtn(<CodeOutlined className='themebtnicon' css={colors.cmd}/>, onClick);
    }
    if(addr.startsWith("cmdp://")){
        return getBtn(<CodeOutlined className='themebtnicon' css={colors.cmd}/>, onClick);
    }
    // 命令行打开目录图标
    if(addr.startsWith("cmdopen://")){
        return getBtn(<CodeOutlined className='themebtnicon' css={colors.cmd}/>, onClick);
    }
    // 其他情况认为是默认的类型，使用链接图标
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
    disable: {color:'grey'},
};

export default React.memo(NodeLinkIcon);