
/**
 * 
 * @param {*} ref 
 * @param {*} ele 
 */
const bindRef=(ref, ele)=>{
    if(ref){
        ref.current=ele;
    }
};


/**
 * 使ref对应的元素获得焦点
 * @param {*} refObj 
 * @param {*} delay true/false/number
 * @returns 
 */
const focusRef=(refObj, delay=false)=>{
    const func=()=>{
        if(refObj && refObj.current){
            try{
                refObj.current.focus();
            }catch(e){}
        }
    };
    if(!delay){
        func();
        return;
    }
    setTimeout(func, ("number"===typeof(delay) ? delay : 400));
};



const unbindEvent=(ele, evt, func)=>{
    console.log("移除事件 "+evt, ele, func);
    try {
        ele.removeEventListener(evt, func);
    }catch (e){}
};

const createId=(prefix='')=>{
    const uuid=crypto.randomUUID().replace(/[-]/g,'');
    if('string'===typeof(prefix)){
        prefix=prefix.trim();
    }else if('number'===typeof(prefix)){
        prefix=`${prefix}`;
    }else if('boolean'===typeof(prefix)){
        prefix=`${prefix}`;
    }else{
        prefix='';
    }
    return `${prefix}${uuid}`;
};



export { focusRef, bindRef, unbindEvent, createId};