import {useChange} from "../common/commonHooks";
import {useMemoizedFn} from "ahooks";
import {useState} from "react";


export const useEditTags=()=>{
    const [tags, setTags]= useState([]);
    const [tagVal,{set:setTagVal, change:changeTagVal}]= useChange('');

    const removeTagByInd= useMemoizedFn((ind, e)=>{
        e.preventDefault();
        setTags(oldTags=>oldTags.filter((_nouse,eachInd)=>eachInd!==ind));
    });

    const addTag= useMemoizedFn((tag)=>{
        if(null!==tag && ''!==tag.trim()){
            tag=tag.trim();
            if(!tags.includes(tag)){
                setTags(oldTags=>[...oldTags, tag]);
            }
        }
        setTagVal('');
    });

    return [tags, tagVal, {setTags, removeTagByInd, addTag, setTagVal, changeTagVal}];
};


