import {  useRef, useState } from 'react';
import {useMemoizedFn} from "ahooks";

const useChange=(initVal='')=>{
    const [txt, set]= useState(initVal);
    const change=useMemoizedFn((e)=>{
        if('undefined'!==typeof(e?.target?.value)){
            set(e.target.value);
        }
    });
    return [txt, {set, change}];
};


const useBindInputRef=()=>{
    const ref=useRef(null);
    const bindInputRef=useMemoizedFn(e=>{
        if(e && e.input){
            ref.current=e.input;
        }
    });
    return [ref, bindInputRef];
};

const useBindRef=()=>{
    const ref=useRef(null);
    const bindRef=useMemoizedFn(e=>{
        if(ref){
            ref.current=e;
        }
    });
    return [ref, bindRef];
};


const useBindAndGetRef=()=>{
    const ref=useRef(null);

    const bindRef=useMemoizedFn(e=>{
        if(ref){
            ref.current=e;
        }
    });

    const getRef=useMemoizedFn(()=>{
        return ref.current;
    });
    
    return [ref, bindRef, getRef];
};


const useBindAndGetRefs=()=>{
    const ref=useRef({});

    const bindRef=useMemoizedFn((key,e)=>{
        if(ref){
            if(!ref.current){
                ref.current={ [''+key]: e, };
                return;
            }
            ref.current[''+key]=e;
        }
    });

    const getRef=useMemoizedFn((key)=>{
        if(ref && ref.current && ref.current[''+key]){
            return ref.current[''+key];
        }
        return null;
    });
    
    return [ref, bindRef, getRef];
};


export {
    useChange,
    useBindInputRef,
    useBindRef,
    useBindAndGetRef,
    useBindAndGetRefs,
};