import api from "../service/api";
import {useEffect, useState, } from "react";
import {
    AppstoreOutlined,
    CheckSquareOutlined, CodeOutlined, CopyOutlined,
    DeploymentUnitOutlined,
    FileUnknownOutlined, FolderOutlined, LinkOutlined, TeamOutlined
} from "@ant-design/icons";

import {parseMetadata} from '../common/metadataLoader';
import cmdopen_url from '../assets/node_icon_cmdopen.png';
import browser_url from '../assets/node_icon_browser.png';

export const useLoadIcon=({lindAddr, icon})=>{
    console.log("lindAddr", lindAddr);
    console.log("icon", icon);

    lindAddr=(lindAddr??'').trim();
    icon=(icon??'').trim();

    /**
     * 第一种：icon组件类型
     * {
     *     type: 'icon',
     *     color: 'red',
     *     compType: MyComp,
     * }
     *
     * 第二种：图片url类型
     * {
     *     type: 'image',
     *     url: 'file:///a/b/c.jpg',
     * }
     */
    const [localIcon, setLocalIcon]=useState(null);

    /**
     * 异步加载指定协议url（file、http、https、dir）对应的图标，如果状态为已取消，则停止操作
     */
    useEffect(()=>{
        if(!lindAddr && !icon){
            return;
        }
        if(!setLocalIcon){
            return;
        }
        let canceled=false;
        if(canceled){
            return;
        }

        // 优先使用指定的图标地址，如果没有，再使用链接地址
        const factAddr=(null!==icon && ""!==icon.trim() ? icon : lindAddr);
        setLocalIcon(getDefIcon(factAddr));
        if(canceled){
            return;
        }
        if([
            "file://",
            "http://",
            "https://",
            "dir://",
            "openas://",
            "openby://",
            "diropenby://",
            "openin://",
            "gmap://",
            "cppath://",
            "cmdopen://"
        ].some(pref=>factAddr.startsWith(pref))){
            (async ()=>{
                try{
                    if(canceled){
                        return;
                    }
                    const resp= await api.loadIcon(factAddr);
                    if(canceled){
                        return;
                    }
                    if(resp && resp.succ && resp.data){
                        try{
                            const assignedIcon = getAssignedIcon(resp.data);
                            setLocalIcon(assignedIcon);
                        }catch(e){
                        }
                    }
                }catch(e){
                }
            })();
        }
        return ()=>{
            canceled=true;
        };
    },[lindAddr, icon, setLocalIcon]);
    return [localIcon];
};


/**
 * 获得指定url的处理过的图标类型
 * @param addr
 * @return
 */
const getAssignedIcon=(addr)=>{
    // 找到匹配的图标
    // 特殊名称：folder
    if("folder"===addr){
        return {
            type: 'icon',
            color: colors.dir,
            compType: FolderOutlined,
        };
    }
    // 特殊名称：dir
    if("dir"===addr){
        return {
            type: 'icon',
            color: colors.link,
            compType: CheckSquareOutlined,
        };
    }
    // 特殊名称：openas
    if("openas"===addr){
        return {
            type: 'icon',
            color: colors.link,
            compType: AppstoreOutlined,
        };
    }
    // 特殊名称：openby
    if("openby"===addr){
        return {
            type: 'icon',
            color: colors.link,
            compType: FileUnknownOutlined,
        };
    }
    // 特殊名称：openin
    if("openin"===addr){
        return {
            type: 'icon',
            color: colors.link,
            compType: FileUnknownOutlined,
        };
    }
    // 特殊名称：gmap
    if("gmap"===addr){
        return {
            type: 'icon',
            color: colors.link,
            compType: DeploymentUnitOutlined,
        };
    }
    // 特殊名称：cppath
    if("cppath"===addr){
        return {
            type: 'icon',
            color: colors.link,
            compType: CopyOutlined,
        };
    }
    if("cmdopen"===addr){
        return {
            type: 'image',
            url: cmdopen_url,
        };
    }

    // 直接使用本地图片文件
    return {
        type: 'image',
        url: addr,
    };
};


/**
 * 获得指定url的默认图标类型
 * @param addr
 * @return
 */
const getDefIcon=(addr)=>{
    // 如果为网址，则使用浏览器图片
    if(addr.startsWith("http://") || addr.startsWith("https://")){
        return {
            type: 'image',
            url: browser_url,
        };
    }

    // 需要验证的类型，默认为灰色，验证后为蓝色或正常色
    // 打开方式：默认为灰色，如果路径有效则为蓝色
    if(addr.startsWith("openas://")){
        return {
            type: 'icon',
            color: colors.disable,
            compType: AppstoreOutlined,
        };
    }
    if(addr.startsWith("openby://")){
        return {
            type: 'icon',
            color: colors.disable,
            compType: FileUnknownOutlined,
        };
    }
    if(addr.startsWith("diropenby://")){
        return {
            type: 'icon',
            color: colors.disable,
            compType: FileUnknownOutlined,
        };
    }
    if(addr.startsWith("openin://")){
        return {
            type: 'icon',
            color: colors.disable,
            compType: FileUnknownOutlined,
        };
    }
    // 打开并选中：默认为灰色，如果路径有效则为蓝色
    if(addr.startsWith("dir://")){
        return {
            type: 'icon',
            color: colors.disable,
            compType: CheckSquareOutlined,
        };
    }
    // 导图链接图标：默认为灰色，如果路径有效则为蓝色
    if(addr.startsWith("gmap://")){
        return {
            type: 'icon',
            color: colors.disable,
            compType: DeploymentUnitOutlined,
        };
    }
    // 文件
    if(addr.startsWith("file://")){
        return {
            type: 'icon',
            color: colors.disable,
            compType: LinkOutlined,
        };
    }
    // 复制路径
    if(addr.startsWith("cppath://")){
        return {
            type: 'icon',
            color: colors.disable,
            compType: CopyOutlined,
        };
    }

    // 不需要验证的类型
    // 复制文本
    if(addr.startsWith("cp://")){
        return {
            type: 'icon',
            color: colors.copy,
            compType: CopyOutlined,
        };
    }

    // 命令图标
    if(addr.startsWith("cmd://")){
        return {
            type: 'icon',
            color: colors.cmd,
            compType: CodeOutlined,
        };
    }
    if(addr.startsWith("cmdp://")){
        return {
            type: 'icon',
            color: colors.cmd,
            compType: CodeOutlined,
        };
    }
    if(addr.startsWith("start://")){
        return {
            type: 'icon',
            color: colors.cmd,
            compType: CodeOutlined,
        };
    }
    // 命令行打开目录图标
    if(addr.startsWith("cmdopen://")){
        return {
            type: 'icon',
            color: colors.cmd,
            compType: CodeOutlined,
        };
    }
    if("group_links"===addr){
        return {
            type: 'icon',
            color: colors.link,
            compType: TeamOutlined,
        };
    }
    // 其他情况认为是默认的类型，使用链接图标
    return {
        type: 'icon',
        color: colors.link,
        compType: LinkOutlined,
    };
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
