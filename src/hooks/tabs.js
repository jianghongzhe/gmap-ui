import { message } from "antd";
import { useCallback } from "react";
import {useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import api from "../service/api";
import {tabActiveKey as tabActiveKeyState, tabPanes as tabPanesState} from '../store';
import mindmapSvc from '../service/mindmapSvc';
import newMindmapSvc from '../service/newMindmapSvc';

export const useSelectFileListItem=()=>{
    const setTabActiveKey= useSetRecoilState(tabActiveKeyState);
    const [tabPanes, setTabPanes]= useRecoilState(tabPanesState);

    return useCallback((item)=>{
        if (!item || !item.isfile) {
            return;
        }

        const mdFullpath=item.mdFullpath;

        //如果选项卡中已经有该项，则激活该tab
        if (tabPanes.some(pane => pane.key === mdFullpath)) {
            setTabActiveKey(mdFullpath);
            return;
        }

        //加载文件内容并计算导图表格的数据
        (async()=>{
            let origintxts =await api.load(mdFullpath);
            if (origintxts && false === origintxts.succ) {
                message.error(origintxts.msg);
                return;
            }
    
            //let cells = mindmapSvc.parseMindMapData(origintxts, defaultLineColor, themeStyles, bordType, getBorderStyle, defaultDateColor);
            let rootNd=mindmapSvc.parseRootNode(origintxts, defaultLineColor, themeStyles, bordType, getBorderStyle, defaultDateColor);
            let ndsSet=newMindmapSvc.loadNdsSet(rootNd);
            console.log("节点数量", ndsSet.list.length);

            //增加新选项卡并设置状态
            console.log("ppp", {
                title: item.itemsName,// item.showname,
                key: mdFullpath,
                mapTxts: origintxts,
                //mapCells: cells,
                ds: ndsSet,
            });
            setTabPanes([
                ...tabPanes,
                {
                    title: item.itemsName,// item.showname,
                    key: mdFullpath,
                    mapTxts: origintxts,
                    //mapCells: cells,
                    ds: ndsSet,
                }
            ]);
            setTabActiveKey(mdFullpath);
        })();
    },[tabPanes, setTabActiveKey, setTabPanes]);
};


export const useToggleExpand=()=>{
    const tabActiveKey= useRecoilValue(tabActiveKeyState);
    const [tabPanes, setTabPanes]= useRecoilState(tabPanesState);

    return useCallback((nd)=>{
        const newPanes=[];
        tabPanes.forEach(pane=>{
            if(tabActiveKey!==pane.key){
                newPanes.push(pane);
                return;
            }
            let ds={
                ...pane.ds,
                expands:{
                    ...pane.ds.expands,
                    [nd.id]: !pane.ds.expands[nd.id]
                }
            };
            newPanes.push({
                ...pane,
                ds
            });
        });
        setTabPanes(newPanes);

    },[tabActiveKey, tabPanes, setTabPanes]);
};


const defaultLineColor = 'lightgrey';

const defaultDateColor = {
    expired: '#f5222d',//red', //过期
    near: '#fa8c16',//'orange',    //近几天
    future: '#389e0d',//'#73d13d',//'green'   //以后
};

//根据边框类型动态生成对应的样式
const getBorderStyle = (type, color = 'lightgrey') => {
    let radius = 14;

    //边框样式
    if (bordType.l === type) { return { borderLeft: `2px solid ${color}` }; }
    if (bordType.r === type) { return { borderRight: `2px solid ${color}` }; }
    if (bordType.t === type) { return { borderTop: `2px solid ${color}` }; }
    if (bordType.b === type) { return { borderBottom: `2px solid ${color}` }; }

    //圆角样式
    if (bordType.rbRad === type) { return { borderBottomRightRadius: radius }; }
    if (bordType.lbRad === type) { return { borderBottomLeftRadius: radius }; }
    if (bordType.rtRad === type) { return { borderTopRightRadius: radius }; }
    if (bordType.ltRad === type) { return { borderTopLeftRadius: radius }; }
};

//边框类型枚举
const bordType = {
    l: 1,
    r: 2,
    t: 4,
    b: 8,
    rbRad: 16,
    lbRad: 32,
    rtRad: 64,
    ltRad: 128,
};

//#2db7f5
const centerThemeStyle = {
    paddingTop: 0,
    paddingBottom: 0,
    verticalAlign: 'bottom',

    '& span.themetxt': {
        whiteSpace: 'nowrap',
        display: 'inline-block',
        padding: '0px 0px  0px 0px',
        verticalAlign: 'bottom',
        fontSize: 16,
    },

    '& span.themetxt .themename': {
        color: 'white',
        backgroundColor: '#108ee9',
        borderRadius: 5,
        fontSize: 18,
        lineHeight: '20px',
        padding: '8px 16px',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        marginLeft: 3,
        marginRight: 3,
    },
};

const secendThemeStyle = {
    paddingTop: 12,
    paddingBottom: 0,
    verticalAlign: 'bottom',

    '& span.themetxt': {
        // paddingRight:5,
        whiteSpace: 'nowrap',
        display: 'inline-block',
        marginBottom: 0,
        paddingBottom: 0,
        fontSize: 16,
        lineHeight: '20px',
        verticalAlign: 'bottom',
    },

    '& span.themetxt .themename': {
        whiteSpace: 'nowrap',
        display: 'inline-block',
    },
};

const otherThemeStyle = {
    paddingTop: 12,
    paddingBottom: 0,
    verticalAlign: 'bottom',

    '& span.themetxt': {
        whiteSpace: 'nowrap',
        display: 'inline-block',
        marginBottom: 0,
        paddingBottom: 0,
        fontSize: 14,
        lineHeight: '18px',
        verticalAlign: 'bottom',
    },

    '& span.themetxt .themename': {
        whiteSpace: 'nowrap',
        display: 'inline-block',

    },
};

const themeStyles = [centerThemeStyle, secendThemeStyle, otherThemeStyle];