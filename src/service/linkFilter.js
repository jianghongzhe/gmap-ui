import loadMetadata from '../common/metadataLoader';
import strTmpl from '../common/strTmpl';



/**
 *
 *
 * 多个链接不支持包含插值参数
 * @param shortcuts
 * [
 *  name:'',
 *  url:''/[],
 *  subNames:null/[]
 * ]
 * @return [
 *  {
 *      tooltip,
 *      url,
 *      shouldConfirm,
 *  }
 * ]
 */
const filterShortCuts=(shortcuts)=>{
    return (shortcuts??[]).map(shortcut=>{
        // 是一组链接
        // 元数据从每个链接的subNames中取
        // 如果有两个或以上链接，则过滤掉带有插值参数的项
        // 结果中url数据如果只有一项，则改为字符串
        if(Array.isArray(shortcut.url)){
            if(0===shortcut.url.length){
                return null;
            }
            let newArray=shortcut.url.map((eachUrl,ind)=>({url:eachUrl, name:shortcut.subNames[ind]}));
            if(1<shortcut.url.length){
                newArray=newArray.filter(({url})=>!strTmpl.containsParam(url))
            }
            if(0===newArray.length){
                return null;
            }
            const shouldConfirm=newArray.some(({name})=>loadMetadata(name??'')[1].includes("confirm"));
            let url=newArray.map(({url})=>url);
            url=(1===url.length ? url[0] : url);
            const tooltip=shortcut.name+"  "+ (Array.isArray(url) ? url.join(" + ") : url);

            return {
                tooltip,
                url,
                shouldConfirm,
            };
        }

        // 是单个链接
        // 元数据从name中取
        const [newName, metas]=loadMetadata(shortcut.name??'');
        const shouldConfirm=metas.includes("confirm");
        const tooltip=newName+"  "+shortcut.url;
        return {
            tooltip,
            url: shortcut.url,
            shouldConfirm,
        };
    }).filter(eachItem=>null!==eachItem);
};

/**
 *
 * @param grouplinks
 * [
 *  {name, addr}
 * ]
 * @return
 * {
 *     tooltip,
 *     url,
 *     shouldConfirm,
 * }
 */
const filterGroupLinks=(grouplinks)=>{
    const trimPrefix=(url)=>{
        url=url??'';
        url=url.startsWith("grp:///") ? url.substring("grp:///".length) : url;
        url=url.startsWith("grp://") ? url.substring("grp://".length) : url;
        return url.trim();
    };
    grouplinks=(grouplinks??[]).map(({name,addr})=>({name,addr:trimPrefix(addr)}));
    if(1<grouplinks.length){
        grouplinks=grouplinks.filter(({addr})=>!strTmpl.containsParam(addr))
    }
    if(0===grouplinks.length){
        return null;
    }

    let shouldConfirm=false;
    grouplinks=grouplinks.map(({name,addr})=>{
        const [handledName, metas]= loadMetadata(name);
        if(metas.includes("confirm")){
            shouldConfirm=true;
        }
        return {name:handledName, addr};
    });

    let tooltip='';
    if(1===grouplinks.length){
        tooltip=(grouplinks[0].name ? grouplinks[0].name+"  "+grouplinks[0].addr : grouplinks[0].addr);
    }else{
        tooltip=grouplinks.map(({name,addr})=>(name && '打开'!==name ? name : addr)).join(" + ");
    }

    let url=grouplinks.map(({addr})=>addr);
    url=(1===url.length ? url[0] : url);
    return {
        tooltip,
        url,
        shouldConfirm,
    };
};


const filterSingleLink=(name, addr)=>{
    const [handledLinkName, metas]=loadMetadata(name);
    const shouldConfirm= metas.includes("confirm")
    const tooltip=(handledLinkName ? handledLinkName+"  "+addr : addr);
    return {
        tooltip,
        url: addr,
        shouldConfirm,
    };

};


export {
    filterShortCuts,
    filterGroupLinks,
    filterSingleLink,
};