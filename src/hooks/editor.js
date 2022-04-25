import {useState} from "react";
import {useDebounceFn, useMemoizedFn} from "ahooks";
import editorSvcEx from '../service/editorSvcEx';


/**
 * 编辑器组件常用操作
 * @returns 
 */
export const useEditorOperation=()=>{
    const copyLineDown=useMemoizedFn((cm=null)=>{
        window.event.preventDefault();
        editorSvcEx.copyLine(cm, true);
    });
    const copyLineUp=useMemoizedFn((cm=null)=>{
        window.event.preventDefault();
        editorSvcEx.copyLine(cm, false);
    });

    const setTitle0=useMemoizedFn((cm=null)=>editorSvcEx.setTitle(cm, 0));
    const setTitle1=useMemoizedFn((cm=null)=>editorSvcEx.setTitle(cm, 1));
    const setTitle2=useMemoizedFn((cm=null)=>editorSvcEx.setTitle(cm, 2));
    const setTitle3=useMemoizedFn((cm=null)=>editorSvcEx.setTitle(cm, 3));
    const setTitle4=useMemoizedFn((cm=null)=>editorSvcEx.setTitle(cm, 4));
    const setTitle5=useMemoizedFn((cm=null)=>editorSvcEx.setTitle(cm, 5));
    const setTitle6=useMemoizedFn((cm=null)=>editorSvcEx.setTitle(cm, 6));

    /**
     * 防止默认事件触发的处理
     */
     const onPreventKey =useMemoizedFn(() => {
        if(window.event){
            window.event.stopPropagation();
            window.event.preventDefault();
        }
    });

    const clearSelection=useMemoizedFn((cm=null)=>{
        onPreventKey();
        editorSvcEx.clearSelection(cm);
    });

    return {
        copyLineDown,copyLineUp,
        setTitle0,setTitle1,setTitle2,setTitle3,setTitle4,setTitle5,setTitle6,
        onPreventKey, clearSelection,
    };
};



/**
 * 标尺样式相关的操作
 * @returns 
 */
export const useRulerStyle=(rulerLineCnt)=>{
    const [rulerVisible, setRulerVisible]=useState({'.CodeMirror .rulerItem': {height:0, maxHeight:0, minHeight:0},});
    

    /**
     * 根据光标位置计算标尺线的样式
     */
    const {run: calcRulerStyle} = useDebounceFn((cm)=>{
        let tmp={};
        editorSvcEx.getRulerState(cm, rulerLineCnt).forEach((sty,ind)=>{
            if(!sty.show){
                tmp={...tmp, [`.CodeMirror .rulerItem.ruler${ind}`]: {height:0, maxHeight:0, minHeight:0},};
                return;
            }
            if(sty.highlight){
                tmp={...tmp, [`.CodeMirror .rulerItem.ruler${ind}`]: {borderColor:'grey!important',},};
                return;
            }
        });
        setRulerVisible(tmp);
    },{wait: 600});

    return [rulerVisible, calcRulerStyle];
};