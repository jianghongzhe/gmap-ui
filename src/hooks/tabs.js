import { message } from "antd";
import { useCallback } from "react";
import {useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import api from "../service/api";
import {tabActiveKey as tabActiveKeyState, tabPanes as tabPanesState, tabCurrPane, tabCurrInd, tabCurrTitle, tabActiveKey} from '../store/tabs';
import mindmapSvc from '../service/mindmapSvc';
import newMindmapSvc from '../service/newMindmapSvc';
import mindMapValidateSvc from "../service/mindMapValidateSvc";

export const useSelectFileListItem=()=>{
    const setTabActiveKey= useSetRecoilState(tabActiveKeyState);
    const [tabPanes, setTabPanes]= useRecoilState(tabPanesState);

    return useCallback((item)=>{
        console.log("item item", item);

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
            console.log("old", tabPanes);
            let newPanes=[
                ...tabPanes,
                {
                    title: item.itemsName,// item.showname,
                    key: mdFullpath,
                    mapTxts: origintxts,
                    //mapCells: cells,
                    ds: ndsSet,
                }
            ];
            console.log("new", newPanes);

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

const useCurrPaneState=()=>{
    const currPane= useRecoilValue(tabCurrPane);
    const currInd=useRecoilValue(tabCurrInd);
    const [tabPanes, setTabPanes]= useRecoilState(tabPanesState);

    const set= useCallback((newCurrPane)=>{
        if(null===currPane || null===currInd){
            return;
        }
        const newPanes=[...tabPanes];
        newPanes[currInd]=newCurrPane;
        setTabPanes(newPanes);
    },[currPane, currInd, tabPanes, setTabPanes]);

    return [currPane, set];
};


export const useToggleExpand=()=>{
    const[currPane, setCurrPane]= useCurrPaneState();

    return useCallback((nd)=>{
        setCurrPane({
            ...currPane,
            ds: {
                ...currPane.ds,
                expands:{
                    ...currPane.ds.expands,
                    [nd.id]: !currPane.ds.expands[nd.id]
                }
            }
        });
    },[currPane, setCurrPane]);
};

export const useExpandAll=()=>{
    const[currPane, setCurrPane]= useCurrPaneState();

    return useCallback(()=>{
        let expands={...currPane.ds.expands};
        newMindmapSvc.expandAll(currPane.ds).forEach(ndId=>{
            expands[ndId]=true;
        });
        setCurrPane({
            ...currPane,
            ds: {
                ...currPane.ds,
                expands
            }
        });
    },[currPane, setCurrPane]);
};

export const useRestoreDefaultExpandState=()=>{
    const[currPane, setCurrPane]= useCurrPaneState();

    return useCallback(()=>{
        setCurrPane({
            ...currPane,
            ds: {
                ...currPane.ds,
                expands: {
                    ...currPane.ds.expands,
                    ...newMindmapSvc.restore(currPane.ds)
                }
            }
        });
    },[currPane, setCurrPane]);
};


export const useSetAssignedTabKey=()=>{
    const setTabActiveKey= useSetRecoilState(tabActiveKeyState);
    return useCallback((key)=>{
        setTabActiveKey(key);
    }, [setTabActiveKey]);
};


export const useTogglePreTab=()=>{
    const setTabActiveKey= useSetRecoilState(tabActiveKeyState);
    const currInd=useRecoilValue(tabCurrInd);
    const tabPanes= useRecoilValue(tabPanesState);

    return useCallback(()=>{
        if(null===currInd){
            return;
        }
        if(1===tabPanes.length){
            return;
        }
        if(currInd>0){
            setTabActiveKey(tabPanes[currInd-1].key);
            return;
        }
        setTabActiveKey(tabPanes[tabPanes.length-1].key);
    },[currInd, tabPanes, setTabActiveKey]);
};


export const useToggleNextTab=()=>{
    const setTabActiveKey= useSetRecoilState(tabActiveKeyState);
    const currInd=useRecoilValue(tabCurrInd);
    const tabPanes= useRecoilValue(tabPanesState);

    return useCallback(()=>{
        if(null===currInd){
            return;
        }
        if(1===tabPanes.length){
            return;
        }
        if(currInd<tabPanes.length-1){
            setTabActiveKey(tabPanes[currInd+1].key);
            return;
        }
        setTabActiveKey(tabPanes[0].key);
    },[currInd, tabPanes, setTabActiveKey]);
};


const useGetTabIndByKey=()=>{
    const tabPanes= useRecoilValue(tabPanesState);

    return useCallback((targetKey)=>{
        let ind=null;
        tabPanes.forEach((pane, i) => {
            if (pane.key === targetKey) {
                ind = i;
            }
        });
        return ind;
    },[tabPanes]);
};

export const useRemoveTab=()=>{
    const [activeKey, setActiveKey]= useRecoilState(tabActiveKeyState);
    const [tabPanes, setTabPanes]= useRecoilState(tabPanesState);
    const getTabIndByKey= useGetTabIndByKey();

    return useCallback((targetKey)=>{
        // 空判断
        if (0 === tabPanes.length) {
            return;
        }
        //要删除的是唯一一个选项卡
        if (1 === tabPanes.length) {
            setTabPanes([]);
            setActiveKey(null);
            return;
        }

        //要删除以外的选项卡集合
        const panes = tabPanes.filter(pane => pane.key !== targetKey);
        //要删除的是当前活动的选项卡
        if (activeKey === targetKey) {
            let lastIndex = getTabIndByKey(targetKey)-1;
            const newKey = panes[lastIndex >= 0 ? lastIndex : 0].key;
            setTabPanes(panes);
            setActiveKey(newKey);
            return;
        }
        //要删除的不是当前活动的选项卡，则不影响activeKey（即不需要改变）
        setTabPanes(panes);
    },[activeKey, tabPanes, setActiveKey, setTabPanes, getTabIndByKey]);
};


export const useRemoveOtherTabs=()=>{
    const currPane= useRecoilValue(tabCurrPane);
    const [tabPanes, setTabPanes]= useRecoilState(tabPanesState);
    
    return useCallback(()=>{
        // 没有选项卡或只有一个，则不删除
        if (0 === tabPanes.length || 1 === tabPanes.length) {
            return;
        }
        setTabPanes([currPane]);
    },[currPane, tabPanes, setTabPanes]);
};

export const useRemoveRightTabs=()=>{
    const [tabPanes, setTabPanes]= useRecoilState(tabPanesState);
    const currInd=useRecoilValue(tabCurrInd);
    
    return useCallback(()=>{
        if(null==currInd){
            return;
        }
        if(currInd<tabPanes.length-1){
            setTabPanes([...tabPanes].splice(0, currInd+1));
        }
    },[tabPanes, currInd, setTabPanes]);
};

export const useRemoveLeftTabs=()=>{
    const [tabPanes, setTabPanes]= useRecoilState(tabPanesState);
    const currInd=useRecoilValue(tabCurrInd);
    
    return useCallback(()=>{
        if(null==currInd){
            return;
        }
        if(currInd>0){
            setTabPanes([...tabPanes].splice(currInd));
        }
    },[tabPanes, currInd, setTabPanes]);
};


export const useRemoveAllTabs=()=>{
    const setActiveKey= useSetRecoilState(tabActiveKeyState);
    const setTabPanes= useSetRecoilState(tabPanesState);

    return useCallback(()=>{
        setTabPanes([]);
        setActiveKey(null);
    },[setActiveKey, setTabPanes]);
};



export const useMovePreTab=()=>{
    const [tabPanes, setTabPanes]= useRecoilState(tabPanesState);
    const currInd=useRecoilValue(tabCurrInd);

    return useCallback(()=>{
        if (null==currInd || 0 === tabPanes.length || 1 === tabPanes.length) {
            return;
        }
        const targetInd=(currInd>0 ? currInd-1 : tabPanes.length-1);
        let newPanes=[...tabPanes];
        const t=newPanes[currInd];
        newPanes[currInd]=newPanes[targetInd];
        newPanes[targetInd]=t;
        setTabPanes(newPanes);
    },[currInd, tabPanes, setTabPanes]);
};

export const useMoveNextTab=()=>{
    const [tabPanes, setTabPanes]= useRecoilState(tabPanesState);
    const currInd=useRecoilValue(tabCurrInd);

    return useCallback(()=>{
        if (null==currInd || 0 === tabPanes.length || 1 === tabPanes.length) {
            return;
        }
        const targetInd=(currInd<tabPanes.length-1 ? currInd+1 : 0);
        let newPanes=[...tabPanes];
        const t=newPanes[currInd];
        newPanes[currInd]=newPanes[targetInd];
        newPanes[targetInd]=t;
        setTabPanes(newPanes);
    },[currInd, tabPanes, setTabPanes]);
};


export const useCopyCurrMapLink=()=>{
    const currMapTitle= useRecoilValue(tabCurrTitle);

    return useCallback(()=>{
        if(!currMapTitle){return;}
        let cmd=`cp://[跳转到导图 - ${currMapTitle}](gmap://${currMapTitle})`;
        api.openUrl(cmd);
    },[currMapTitle]);
};


export const useCreateNewMapPromise=()=>{
    const setTabActiveKey= useSetRecoilState(tabActiveKeyState);
    const setTabPanes= useSetRecoilState(tabPanesState);

    return useCallback(({dir,name})=>{
        return new Promise((res, rej)=>{
            //验证名称为空和文件是否存在
            if (!name || '' === name) {
                message.warning('请输入图表名称');
                rej();
                return;
            }
            let reg = /^[^ 　\\/\t\b\r\n]+([/][^ 　\\/\t\b\r\n]+)*$/;
            if (!reg.test(name)) {
                message.warning('图表名称格式有误，请更换另一名称');
                rej();
                return;
            }

            (async()=>{
                let joinName=(dir? dir+"/"+name : name);
                let fnAndFullpath =await api.existsGraph(joinName);//如果存在返回true，如果不存在返回 [文件名, 全路径]
                if (true === fnAndFullpath) {
                    message.warning('该图表名称已存在，请更换另一名称');
                    rej();
                    return;
                }
                let [fn, themeName, fullpath, mdFullpath] = fnAndFullpath;

                //保存文件
                let defMapTxt = getDefMapTxt(themeName);
                let ret = await api.createMapBundle(fullpath, defMapTxt);
                if (ret && false === ret.succ) {
                    message.error(ret.msg);
                    rej();
                    return;
                }

                //计算导图表格信息并加入新tab      
                // let cells = mindmapSvc.parseMindMapData(defMapTxt, defaultLineColor, themeStyles, bordType, getBorderStyle, defaultDateColor);
                let rootNd=mindmapSvc.parseRootNode(defMapTxt, defaultLineColor, themeStyles, bordType, getBorderStyle, defaultDateColor);
                let ndsSet=newMindmapSvc.loadNdsSet(rootNd);

                setTabPanes((originPanes)=>([
                    ...originPanes, 
                    {
                        title: fn,
                        key: mdFullpath,
                        mapTxts: defMapTxt,
                        ds: ndsSet,
                    }
                ]));
                setTabActiveKey(mdFullpath);
                res();
            })();
        });
    },[setTabActiveKey, setTabPanes]);
}




export const useSaveMapPromise=()=>{
    const [currPane, setCurrPane]= useCurrPaneState();
    const activeKey= useRecoilValue(tabActiveKey);

    return useCallback((txt)=>{
        return new Promise((res, rej)=>{
            if(!activeKey || !currPane){
                rej();
                return;
            }
            //校验
            let valiResult = mindMapValidateSvc.validate(txt);
            if (true !== valiResult) {
                message.warning(valiResult);
                rej();
                return;
            }

            (async()=>{
                //保存并修改状态
                let ret = await api.save(activeKey, txt);
                if (ret && false === ret.succ) {
                    message.error(ret.msg);
                    rej();
                    return;
                }

                let rootNd=mindmapSvc.parseRootNode(txt, defaultLineColor, themeStyles, bordType, getBorderStyle, defaultDateColor, false);
                let ndsSet=newMindmapSvc.loadNdsSet(rootNd);

                setCurrPane({
                    ...currPane,
                    mapTxts: txt,
                    ds:ndsSet,
                });
                res();
            })();
        });
    },[currPane, setCurrPane, activeKey]);
};


const getDefMapTxt = (theleName = "中心主题") => (
    `- ${theleName}
\t- 分主题
\t- c:#1890ff|带颜色的分主题
\t- 带说明的分主题|m:balabala
\t- 带链接的分主题|[百度](https://baidu.com)
\t- 带引用的分主题|ref:长段文字

***
# ref:长段文字
这里可以放长段内容，支持markdown格式
`
);


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