import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import * as sagaEffects from 'redux-saga/effects';
import {Provider,connect as reduxConnect} from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import SagaPromiseMiddleWare from './SagaPromiseMiddleWare';
import gflowUtil from './gflowUtil';


/**
 * 类似dva的方式，简化redux-saga的开发：
 * 1、初始状态、reducer、saga配置在一起
 * 2、支持全局事件订阅
 */
class Gflow{
    constructor(){
        this.runTimes=0;            //计数器：用于判断run方法只能执行一次
        this.initState={};          //初始状态
        this.reducerItems={};       //子reducer
        this.actionDispatcher={};   //action dispatvher
        this.actionCreater={};      //action creater
        this.subscriptionFuns=[];   //初始化事件，当根组件mount后才执行
    }

    /**
     * 合并后的总的reducer
     */
    sumReducer=(state,action)=>{
        //action type没有指定命名空间，不计算
        const reg=/^[^/]+[/][^/]+$/;// eg. user/add
        if(!gflowUtil.isModelActionType(action.type)){
            return state;
        }

        //未找到对应的子reducer，不计算
        let[ns,type]=action.type.split("/");
        if(!this.reducerItems[ns] || !this.reducerItems[ns][type]){
            return state;
        }

        //用子reducer计算并把结果合并入总的state里
        let partialState=this.reducerItems[ns][type](state[ns],action.payload);
        let result={...state};
        result[ns]=partialState;
        return result;
    }

    /**
     * 初始状态合并
     */
    combineState=(initState,model)=>{
        let ns=model.namespace;
        this.initState[ns]={...this.initState[ns], ...model.state};
    }

    /**
     * 合并各子reducer
     */
    combineReducer=(model)=>{
        let ns=model.namespace;
        this.reducerItems[ns]={...this.reducerItems[ns], ...model.reducers};
    }

    /**
     * 合并副作用
     */
    combineEffects=(sagaList,model)=>{
        let sagaItems=[];
        let ns=model.namespace;
        const scope=this;
        const baseEffectParam={
            ...sagaEffects,                 //redux-saga自带的副作用
            gcreater:scope.actionCreater,   //全局creater
            creater:scope.actionCreater[ns],//当前模块的creater
            ns: ns,
            sel:defSelectCurrModelState.bind(this,ns),
        };
        

        
           


        //循环每个副作用函数，并加入列表
        model.effects.forEach(item=>{
            //由于saga可以跨模块监听事件，所以如果key中自带命名空间，则直接使用，否则加入model自身的命名空间
            let targetActionType=ns+"/"+item.k;
            if(gflowUtil.isModelActionType(item.k)){
                targetActionType=item.k;
            }

            //创建watcher，不使用takeEvery而使用take的原因是需要在调用worker时传递第二个参数（指定副作用操作符与promise的reolve、reject等）
            let watcher=function*() {
                while(true) {
                    //侦听action事件
                    const action = yield sagaEffects.take(targetActionType);

                    //封装第二个参数
                    let effectParam=baseEffectParam;
                    if(item.prom){//action需要返回结果，则把resolve、reject加入其中
                        effectParam={
                            ...effectParam, 
                            res:        action.extras.res, 
                            rej:        action.extras.rej,
                            resolve:    action.extras.res, 
                            reject:     action.extras.rej,
                        };
                    }

                    //执行副作用
                    // yield* model.effects[key](action.payload,effectParam);
                    yield sagaEffects.fork(item.v,action.payload,effectParam);
                }
            };
            //运行侦听器并加入列表
            sagaItems.push(watcher());
        });

        //手动监控的函数
        for(let key in model.watchers){
            let effectParam=baseEffectParam;
            sagaItems.push(model.watchers[key](effectParam));
        }

        //把列表中的副作用合并为一个，并加入总体列表中
        sagaList.push(function*() {yield sagaEffects.all(sagaItems);}());
    }

    /**
     * 提取actionCreater与actionDispatcher
     */
    extractActionCreatersAndActionDispatchers=(model)=>{
        let ns=model.namespace;
        // let reducersAndEffects={...model.reducers, ...model.effects};
        for(let key in model.reducers){
            let[targetNS,targetKey]= gflowUtil.addModelPrefix(key,ns).split("/");//如果key中自带命名空间，则直接使用，否则加入model自身的命名空间
            this.actionCreater[targetNS][targetKey]=defActionCreater.bind(this,targetNS,targetKey,false);
            this.actionDispatcher[targetNS][targetKey]=defActionDispatcher.bind(this,this.store,targetNS,targetKey,false);
        }
        model.effects.forEach(item=>{
            console.log(item,item.k);
            let[targetNS,targetKey]= gflowUtil.addModelPrefix(item.k,ns).split("/");//如果key中自带命名空间，则直接使用，否则加入model自身的命名空间
            console.log("----",targetNS,targetKey);
            this.actionCreater[targetNS][targetKey]=defActionCreater.bind(this,targetNS,targetKey,item.prom);
            this.actionDispatcher[targetNS][targetKey]=defActionDispatcher.bind(this,this.store,targetNS,targetKey,item.prom);
        });
    }

    /**
     * 记录事件，待根组件mount后执行
     */
    regSubscriptionEvents=(model)=>{
        let ns=model.namespace;
        for(let key in model.subscriptions){
            this.subscriptionFuns.push(
                model.subscriptions[key].bind(
                    this,
                    {
                        gdispatcher:this.actionDispatcher, 
                        dispatcher: this.actionDispatcher[ns],
                    }
                )
            );
        }
    }


    /**
     * 整理effects的格式，把模块配置中不同的方式整理成同一格式，同时标记是否为promise类型
     */
    handleRegularEffects=(model)=>{
        let effectList=[];
        for(let key in model.effects){
            //是生成器
            console.log(key+" is generator ? "+gflowUtil.isGen(model.effects[key]));

            if(gflowUtil.isGen(model.effects[key])){
                effectList.push({
                    k: key,
                    v: model.effects[key],
                    prom: gflowUtil.isPromiseActionType(key)
                });
                continue;
            }

            //是promise组
            if(true===model.effects[key].promise){
                for(let subKey in model.effects[key]){
                    if(subKey==='promise'){continue;}
                    if(gflowUtil.isGen(model.effects[key][subKey])){
                        effectList.push({
                            k: subKey,
                            v: model.effects[key][subKey],
                            prom: true
                        });
                    }
                }
                continue;
            }

            //是非promise组
            if(false===model.effects[key].promise){
                for(let subKey in model.effects[key]){
                    if(subKey==='promise'){continue;}
                    if(gflowUtil.isGen(model.effects[key][subKey])){
                        effectList.push({
                            k: subKey,
                            v: model.effects[key][subKey],
                            prom: false
                        });
                    }
                }
                continue;
            }
        }
        model.effects=effectList;
    }

    /**
     * 非空处理
     */
    makeNotEmpty=(models, extraMidlewares)=>{
        if(!extraMidlewares){
            extraMidlewares=[];
        }
        if(!models){
            models=[];
        }      
        models.forEach(model => {
            if(!model.namespace){
                model.namespace=DEFAULT_NAMESPACE;//默认命名空间
            }
            if(!model.state){
                model.state={};
            }
            if(!model.reducers){
                model.reducers={};
            }
            if(!model.effects){
                model.effects={};
            }
            if(!model.watchers){
                model.watchers={};
            }
            if(!model.subscriptions){
                model.subscriptions={};
            }
            if(!this.reducerItems[model.namespace]){
                this.reducerItems[model.namespace]={};
            }
            if(!this.actionDispatcher[model.namespace]){
                this.actionDispatcher[model.namespace]={};
            }
            if(!this.actionCreater[model.namespace]){
                this.actionCreater[model.namespace]={};
            }
            if(!this.initState[model.namespace]){
                this.initState[model.namespace]={};
            }
            this.handleRegularEffects(model);
        });
        return [models,extraMidlewares];
    }

    /**
     * 初始化
     * @param {*} models [
     *      {
     *          namespace: 'def',  //命名空间，可省略，省略后认为是def
     *          state:{}    //初始状态
     *          reducers:{//子reducer
     *              add: (state, payload)=>newState
     *          },
     *          effects:{//副作用，名称以promise（忽略大小写）开头或结尾表示需要返回值（promise）
     *              *add: (payload, {})=>void
     *          },
     *          subscriptions:{//订阅源
     *              setup:({gdispatcher, dispatcher})=>{...}
     *          }
     *      }
     * ]
     * @param {*} extraMidlewares [mw1, mw2, ...] 额外的中间什
     */
    init=(models, extraMidlewares)=>{
        //非空处理
        let modelsAndMds=this.makeNotEmpty(models,extraMidlewares);
        models=modelsAndMds[0];
        extraMidlewares=modelsAndMds[1];

        //合并state、reducer
        models.forEach(model => {
            this.combineState(this.initState,model);//合并初始state
            this.combineReducer(model);//合并reducer
        });
        
        //初始化中间件并生成store
        const sagaMiddleware = createSagaMiddleware();
        let middlewares=[SagaPromiseMiddleWare, sagaMiddleware, ...extraMidlewares];
        this.store=createStore(
            this.sumReducer,
            this.initState,
            applyMiddleware(...middlewares)
        );

        //根据model中reducer与effect的名字，提取成对应的action creater与action dispatcher
        models.forEach(model => {
            this.extractActionCreatersAndActionDispatchers(model);
        });
        this.actionDispatcher.dispatch=this.store.dispatch;//在封装的action dispatcher里加入原始的dispatch函数，以备特殊用途

        //合并副作用处理函数并启动saga
        let sagaList=[];
        models.forEach(model => {
            this.combineEffects(sagaList,model);//合并副作用
        });        
        let rootSaga=function*() {
            yield sagaEffects.all(sagaList)
        };
        sagaMiddleware.run(rootSaga);

        //记录事件源，待包装组件mount后执行
        models.forEach(model => {
            this.regSubscriptionEvents(model);
        });
    }


    /**
     * 开启程序：
     * 1、创建store并设置初始状态
     * 2、设置reducer
     * 3、设置saga
     * @param options {
     *      rootEle:            ReactElement    //根react元素
     *      domSelector:        "#root",        //可选：渲染位置的dom选择器，默认为 #root
     *      models:             [m1, m2],       //可靠：所有model的数组
     *      extraMiddlewares:    [mw1, mw2, ...] //可选：其他中间传的数组
     * }
     */
    run=({rootEle, domSelector, models, extraMiddlewares=[],strict=false})=>{
        //校验
        ++this.runTimes;
        if(1<this.runTimes){
            throw new Error("只能执行一次run方法");
        }
        if(!rootEle){
            throw new Error("未提供根组件");
        }

        //初始化
        this.init(models, extraMiddlewares);

        //渲染初始页面
        ReactDOM.render( 
            <Provider store={this.store}>
                <EventWrapperComponent subscriptionEvents={this.subscriptionFuns}>
                    {
                        true===strict ? <React.StrictMode>{rootEle}</React.StrictMode> : <>{rootEle}</>
                    }
                </EventWrapperComponent>
            </Provider>, 
            document.querySelector(domSelector?domSelector:"#root")
        );
    }

    /**
     * 对mapState进行包装，注入dispatcher，让容器组件可调用this.props.dispatcher...
     */
    wrapMapState=(mapState)=>{
        return (state,ownProps)=>{
            let result=mapState(state,ownProps);
            return {...result, dispatcher:this.actionDispatcher};
        };
    }

    /**
     * 对redux的connect进行包装，把dispatcher传递到组件的props里
     */
    connect=(mapState,mapDispatch=null)=>{
        if(!mapState){
            mapState=()=>({});
        }
        if(!mapDispatch){
            mapDispatch=()=>({});
        }
        let wrapper=this.wrapMapState(mapState);
        return reduxConnect(wrapper,mapDispatch);
    }
}


/**
 * 事件包装器，所有订阅事件在组件的componentDidMount里执行，以防止执行事件时根组件还未初始化
 */
class EventWrapperComponent extends React.Component{
    componentDidMount(){
        if(this.props.subscriptionEvents){
            this.props.subscriptionEvents.forEach(event=>{
                event();
            });
        }
    }

    render(){
        return this.props.children;
    }
}



const defActionCreater=(ns,key,isPromise,payload)=>({
    type:       ns+"/"+key,
    payload:    payload,
    extras:     {promise:isPromise}
});
const defActionDispatcher=(store,ns,key,isPromise,payload)=>(store.dispatch(defActionCreater(ns,key,isPromise,payload)));
const defSelectCurrModelState=(ns)=>sagaEffects.select(state=>state[ns]);

const DEFAULT_NAMESPACE="def";


const inst=new Gflow();
export default {run: inst.run};//程序入口
export const dispatcher=inst.actionDispatcher;//action dispatcher，一般在容器组件里用
export const creater=inst.actionCreater;//action creater，一般在saga里用
export const connect=inst.connect;//对react-redux的connect方法的包装
export const join=gflowUtil.joinModNameAndActionType;