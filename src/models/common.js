const model={
    namespace:'common',
    state:{
        winW:800,
        winH:600,
        resizeSymbol: Symbol(),
    },
    reducers:{
        setSize:(state,{winW,winH})=>{
            return {...state, winW, winH};
        },
        setResizeSymbol:(state,resizeSymbol)=>{
            return {...state, resizeSymbol};
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
        resize:({dispatcher})=>{
            window.addEventListener("resize",()=>{
                dispatcher.loadWinSize(null);
                dispatcher.refreshResizeSymbol(null);
            });
        },
        init:({dispatcher})=>{
            dispatcher.loadWinSize(null);
        },
    },
};

export default model;