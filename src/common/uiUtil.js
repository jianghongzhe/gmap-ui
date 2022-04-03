
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




export { focusRef, bindRef};