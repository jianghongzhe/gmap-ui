


const bindInputEle=(comp,iptName,ele)=>{
    if(ele && ele.input){
        comp[iptName]=ele.input;
    }
}



const doFocus=(comp,iptName,propName)=>{
    if(comp[iptName]){
        doFocusBaseInner(comp,iptName,propName);
        return;
    }
    setTimeout(()=>{
        if(comp[iptName]){
            doFocusBaseInner(comp,iptName,propName);
            return;
        }    
    },300);
}

const doFocusBaseInner=(comp,iptName,propName)=>{
    let len=comp.props[propName].length;
    comp[iptName].focus();
    comp[iptName].setSelectionRange(len,len);
}



const bindChangeEventToState=(comp,stateName,e)=>{
    let newState={};
    newState[stateName]=e.target.value;
    comp.setState(newState);
}

export {bindInputEle,doFocus,bindChangeEventToState};