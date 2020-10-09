import api from '../service/api';
import generalSvc from '../service/generalSvc';

const model={
    namespace:'common',
    state:{
        winW:800,
        winH:600,
        resizeSymbol: Symbol(),
        installPathValid: true,
    },
    reducers:{
        setSize:(state,{winW,winH})=>{
            return {...state, winW, winH};
        },
        setResizeSymbol:(state,resizeSymbol)=>{
            return {...state, resizeSymbol};
        },
        setInstallPathValid:(state,payload)=>{
            return {...state, installPathValid:true,};
        },
        setInstallPathInvalid:(state,payload)=>{
            return {...state, installPathValid:false,};
        }
    },
    effects:{
        *loadWinSize(payload,{creater,put}){
            let size={
                winW: document.documentElement.clientWidth,
                winH: document.documentElement.clientHeight,
            };
            yield put(creater.setSize(size));
        },
        *refreshResizeSymbol(payload,{creater,put}){
            yield put(creater.setResizeSymbol(Symbol()));
        },
    },
    subscriptions:{
        initEvent:({dispatcher})=>{
            window.addEventListener("resize",()=>{
                dispatcher.loadWinSize(null);
                dispatcher.refreshResizeSymbol(null);
            });
        },
        init:({dispatcher,gdispatcher})=>{
            document.querySelector("head > title").innerHTML = api.loadAppNameAndVersionTxt();
            dispatcher.loadWinSize(null);
            gdispatcher.filesel.load();

            // 检测安装路径合理性
            let installPath=api.getBasePath();
            if(!generalSvc.isPathValid(installPath)){
                dispatcher.setInstallPathInvalid(null);
            }
        },
    },
};

export default model;