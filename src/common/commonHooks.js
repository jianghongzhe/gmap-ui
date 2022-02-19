import { useCallback, useRef, useState } from 'react';

const useChange=(initVal='')=>{
    const [txt, set]= useState(initVal);
    const change=useCallback((e)=>{
        if('undefined'!==typeof(e) && 'undefined'!==typeof(e.target) && 'undefined'!==typeof(e.target.value)){
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


export {
    useChange,
    useBindInputRef,
};