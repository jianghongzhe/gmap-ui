import {atom, selector} from 'recoil';

/**
 * 路径合法性
 */
export const installPathValid=atom({
    key: 'installPathValid',
    default: true,
});

/**
 * 全部目录
 */
export const allDirs=atom({
    key:'allDirs',
    default:[],
});


export const filelist=atom({
    key:'filelist',
    default:[],
});

export const fileListDirLevels=atom({
    key:'fileListDirLevels',
    default:[],
}); 


export const currFileListDir=selector({
    key:'currFileListDir',
    get:({get})=>{
        const dirs=get(fileListDirLevels);
        if (null == dirs || 0 === dirs.length) {
            return null;
        }
        let list=dirs.filter(dir => dir.iscurr);
        if(null==list || 0===list.length){
            return null;
        }
        return list[0].fullpath;
    },
});


export const tabPanes=atom({
    key: 'tabPanes',
    default: [],
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

