import {createSelector} from 'reselect';
import api from '../service/api';

const model={
    namespace:'filesel',
    state:{
        filelist: [],
        dirs: [],
    },
    reducers:{
        setFilelistAndDirs:(state,{filelist,dirs})=>{
            return {...state, filelist, dirs};
        }
    },
    effects:{
        *load(dir,{put,creater}){
            yield put(creater.setFilelistAndDirs({
                filelist:   dir ? api.list(dir) : api.list(),
                dirs:       dir ? api.getPathItems(dir): api.getPathItems(),
            }));
        },

        *loadCurrDir(payload,{sel,put,creater}){
            let localState=yield sel();
            let currDir=selectCurrDir(localState);
            yield put(creater.load(currDir));
        }
    }
};

const selectCurrDir = createSelector(
    json => json.dirs,
    dirs => {
        if (null == dirs || 0 === dirs.length) {
            return null;
        }
        let list=dirs.filter(dir => dir.iscurr);
        if(null==list || 0===list.length){
            return null;
        }
        return list[0].fullpath;
    }
);

export default model;