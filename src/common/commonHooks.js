import { useCallback, useRef, useState } from 'react';

const useChange=(initVal='')=>{
    const [txt, set]= useState(initVal);
    const change=useCallback((e)=>{
        if('undefined'!==typeof(e?.target?.value)){
            set(e.target.value);
        }
    },[set]);
    return [txt, {set, change}];
};


const useBindInputRef=()=>{
    const ref=useRef(null);
    const bindInputRef=useCallback(e=>{
        if(e && e.input){
            ref.current=e.input;
        }
    },[ref]);
    return [ref, bindInputRef];
};

const useBindRef=()=>{
    const ref=useRef(null);
    const bindRef=useCallback(e=>{
        if(ref){
            ref.current=e;
        }
    },[ref]);
    return [ref, bindRef];
};


const useBindAndGetRef=()=>{
    const ref=useRef(null);

    const bindRef=useCallback(e=>{
        if(ref){
            ref.current=e;
        }
    },[ref]);

    const getRef=useCallback(()=>{
        return ref.current;
    },[ref]);
    
    return [ref, bindRef, getRef];
};


const useBindAndGetRefs=()=>{
    const ref=useRef({});

    const bindRef=useCallback((key,e)=>{
        if(ref){
            if(!ref.current){
                ref.current={ [''+key]: e, };
                return;
            }
            ref.current[''+key]=e;
        }
    },[ref]);

    const getRef=useCallback((key)=>{
        if(ref && ref.current && ref.current[''+key]){
            return ref.current[''+key];
        }
        return null;
    },[ref]);
    
    return [ref, bindRef, getRef];
};


export {
    useChange,
    useBindInputRef,
    useBindRef,
    useBindAndGetRef,
    useBindAndGetRefs,
};