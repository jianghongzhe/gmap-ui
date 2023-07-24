import loadMetadata,{parseMetadata} from '../common/metadataLoader';
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
 *      confirmTxt,
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
                newArray=newArray.filter(({url})=>!strTmpl.containsParam(url));
            }
            if(0===newArray.length){
                return null;
            }
            let shouldConfirm=false;
            let confirmTxt=[];
            let iconPath=null;
            newArray.forEach(({name})=>{
                const [, flag, txt, icon]=loadMeta(name??'');
                iconPath=icon;
                // console.log("filterShortCuts", flag);
                // console.log("filterShortCuts", txt);
                if(flag){
                    shouldConfirm=true;
                    if(txt){
                        confirmTxt.push(txt);
                    }
                }
            });

            let url=newArray.map(({url})=>url);
            url=(1===url.length ? url[0] : url);
            const tooltip=shortcut.name+"  "+ (Array.isArray(url) ? url.join(" + ") : url);

            // 当只有一个链接时，confirmTxt才有效，否则为null
            return {
                tooltip,
                url,
                shouldConfirm,
                confirmTxt: (1===newArray.length && confirmTxt.length>0 ? confirmTxt[0] : null),
                icon: (1===newArray.length ? iconPath : null),
            };
        }

        // 是单个链接
        // 元数据从name中取
        const hasSubName=(shortcut.subNames && shortcut.subNames.length>0);
        const [newName, flag, txt, icon]= loadMeta(hasSubName ? shortcut.subNames[0] : shortcut.name);
        const tooltip=(hasSubName ? shortcut.name : newName)+"  "+shortcut.url;
        return {
            tooltip,
            url: shortcut.url,
            shouldConfirm: flag,
            confirmTxt: txt,
            icon: icon,
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
 *     confirmTxt,
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
    // 如果有两个以上链接，则只保留不带插值参数的
    if(1<grouplinks.length){
        grouplinks=grouplinks.filter(({addr})=>!strTmpl.containsParam(addr))
    }
    if(0===grouplinks.length){
        return null;
    }

    let shouldConfirm=false;
    let confirmTxt=[];
    let iconPath=null;
    grouplinks=grouplinks.map(({name,addr})=>{
        const [handledName, flag, txt, icon]= loadMeta(name);
        iconPath=icon;
        if(flag){
            shouldConfirm=true;
            if(txt){
                confirmTxt.push(txt);
            }
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
        confirmTxt: (1===grouplinks.length && confirmTxt.length>0 ? confirmTxt[0] : null),
        icon: (1===grouplinks.length ? iconPath : null),
    };
};


/**
 *
 * @param name
 * @param addr
 * @return
 * {
 *     tooltip,
 *     url,
 *     shouldConfirm,
 *     confirmTxt,
 *     icon
 * }
 */
const filterSingleLink=(name, addr)=>{
    const [handledLinkName, flag, txt, icon]=loadMeta(name);
    const tooltip=(handledLinkName ? handledLinkName+"  "+addr : addr);
    return {
        tooltip,
        url: addr,
        shouldConfirm: flag,
        confirmTxt: txt,
        icon,
    };
};


/**
 *
 * @param name
 * @return
 * [
 *  'handled name',
 *  true/false,
 *  null/'是否要打开链接',
 *  '指定要显示的图片地址',
 * ]
 */
const loadMeta=(name)=>{
    const [handledName, metas]=loadMetadata(name??'');
    let shouldConfirm=false;
    let confirmTxt=null;
    let icon=null;

    metas.forEach(meta=>{
        const {type, opts} =parseMetadata(meta);
        if('confirm'===type){
            shouldConfirm=true;

            let optTxt= opts.find(opt=> (opt.startsWith("txt ") && opt.length>"txt ".length));
            if(optTxt){
                confirmTxt=optTxt.substring("txt ".length).trim();
            }
        }
        if('icon'===type){
            if(opts.length>0 && ''!==opts[0].trim()){
                icon=opts[0].trim();
            }
        }
    });
    return [handledName, shouldConfirm, confirmTxt, icon];
};



export {
    filterShortCuts,
    filterGroupLinks,
    filterSingleLink,
};