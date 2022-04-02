import {atom, selector} from 'recoil';

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