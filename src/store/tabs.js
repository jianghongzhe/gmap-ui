import {atom, selector} from 'recoil';
import newMindmapSvc from '../service/newMindmapSvc';

export const tabPanes=atom({
    key: 'tabPanes',
    default: [],
    //dangerouslyAllowMutability: true,
});

export const tabActiveKey=atom({
    key: 'tabActiveKey',
    default: null,
});

export const tabHasPane=selector({
    key:'tabHasPane',
    get: ({get})=>{
        const panes=get(tabPanes);
        return (panes && panes.length>0 ? true : false);
    },
});

export const tabCurrPane=selector({
    key: 'tabCurrPane',
    get: ({get})=>{
        const panes=get(tabPanes);
        const activeKey=get(tabActiveKey);
        if(!activeKey){
            return null;
        }
        let currPanes = panes.filter(eachPane => activeKey === eachPane.key);
        if (currPanes && 0 < currPanes.length) {
            return currPanes[0];
        }
        return null;
    },
});

export const tabCurrPaneContentValid=selector({
    key: 'tabCurrPaneContentValid',
    get: ({get})=>{
        const currPane=get(tabCurrPane);
        if(!currPane){
            return false;
        }
        //当前选项卡内容解析失败
        if (currPane.ds && false === currPane.ds.succ) {
            return false;
        }
        return true;
    },
});

export const tabCurrPaneAllNodesExpand=selector({
    key: 'tabCurrPaneAllNodesExpand',
    get: ({get})=>{
        if(!get(tabCurrPaneContentValid)){
            return false;
        }
        const currPane=get(tabCurrPane);
        if(!currPane){
            return false;
        }
        return newMindmapSvc.isAllNodeExpand(currPane.ds);
    },
});


export const tabCurrPaneExpandStateChanged=selector({
    key: 'tabCurrPaneExpandStateChanged',
    get: ({get})=>{
        if(!get(tabCurrPaneContentValid)){
            return false;
        }
        const currPane=get(tabCurrPane);
        if(!currPane){
            return false;
        }
        return newMindmapSvc.isAnyNdExpStChanged(currPane.ds);
    },
});


export const tabCurrTitle=selector({
    key: 'tabCurrTitle',
    get: ({get})=>{
        const currPane=get(tabCurrPane);
        if(!currPane){
            return null;
        }
        let title=currPane.title;
        if(title.endsWith(".md")){
            title=title.substring(0,title.length-".md".length);
        }
        return title;
    },
});

export const tabCurrInd=selector({
    key: 'tabCurrInd',
    get: ({get})=>{
        const panes=get(tabPanes);
        const activeKey=get(tabActiveKey);
        if(!panes || !activeKey){
            return null;
        }
        let activeInd=-1;
        panes.forEach((pane,ind)=>{
            if(pane.key===activeKey){
                activeInd=ind;
            }
        });
        if(-1===activeInd){
            return null;
        }
        return activeInd;
    },
});


export const tabActivePaneAssetsDir=selector({
    key: 'tabActivePaneAssetsDir',
    get: ({get})=>{
        const activeKey=get(tabActiveKey);
        if(!activeKey){
            return null;
        }
        const to=parseInt(Math.max(activeKey.lastIndexOf("/"), activeKey.lastIndexOf("\\")))+1;
        const result= activeKey.substring(0, to)+"assets";
        return result;
        
    },
});



