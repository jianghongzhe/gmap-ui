


const bindInputEle=(comp,iptName,ele)=>{
    // console.log("绑2");
    // console.log("comp",comp);
    // console.log("iptName",iptName);
    // console.log("ele",ele);
    // console.log("ele.input",ele.input);
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

export {bindInputEle,doFocus};