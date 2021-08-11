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
        *load(dir,{put,creater, call}){
            let filelist=null;
            if(dir){
                filelist=yield call(api.list, dir);
            }else{
                filelist=yield call(api.list);
            }

            let dirs=null;
            if(dir){
                dirs=yield call(api.getPathItems, dir);
            }else{
                dirs=yield call(api.getPathItems);
            }

            yield put(creater.setFilelistAndDirs({
                filelist,
                dirs,
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