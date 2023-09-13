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
            let cmds=[];
            let codePages=[];
            newArray.forEach(({name})=>{
                const {shouldConfirm:flag, confirmTxt:txt, icon,cmd, codePage}=loadMeta(name??'');
                iconPath=icon;
                cmds.push(cmd);
                codePages.push(codePage);
                if(flag){
                    shouldConfirm=true;
                    if(txt){
                        confirmTxt.push(txt);
                    }
                }
            });

            let url=newArray.map(({url})=>url);
            let cmd=cmds;
            let codePage=codePages;
            if(1===url.length){
                url=url[0];
                cmd=cmd[0];
                codePage=codePage[0];
            }

            const tooltip=shortcut.name+"  "+ (Array.isArray(url) ? url.join(" + ") : url);

            // 当只有一个链接时，confirmTxt才有效，否则为null
            return {
                tooltip,
                url,
                shouldConfirm,
                confirmTxt: (1===newArray.length && confirmTxt.length>0 ? confirmTxt[0] : null),
                icon: (1===newArray.length ? iconPath : null),
                cmd,
                codePage,
            };
        }

        // 是单个链接
        // 元数据从name中取
        const hasSubName=(shortcut.subNames && shortcut.subNames.length>0);
        const {handledName:newName, shouldConfirm:flag, confirmTxt:txt, icon,cmd, codePage}= loadMeta(hasSubName ? shortcut.subNames[0] : shortcut.name);
        const tooltip=(hasSubName ? shortcut.name : newName)+"  "+shortcut.url;
        return {
            tooltip,
            url: shortcut.url,
            shouldConfirm: flag,
            confirmTxt: txt,
            icon: icon,
            cmd,
            codePage,
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
        const {handledName, shouldConfirm:flag, confirmTxt:txt, icon,cmd, codePage}= loadMeta(name);
        iconPath=icon;
        if(flag){
            shouldConfirm=true;
            if(txt){
                confirmTxt.push(txt);
            }
        }
        return {name:handledName, addr, cmd, codePage,};
    });

    let tooltip='';
    if(1===grouplinks.length){
        tooltip=(grouplinks[0].name ? grouplinks[0].name+"  "+grouplinks[0].addr : grouplinks[0].addr);
    }else{
        tooltip=grouplinks.map(({name,addr})=>(name && '打开'!==name ? name : addr)).join(" + ");
    }

    // 只有一个链接，则把数组转为单个类型
    let url=grouplinks.map(({addr})=>addr);
    let cmd=grouplinks.map(({cmd})=>cmd);
    let codePage=grouplinks.map(({codePage})=>codePage);
    if(1===url.length){
        url=url[0];
        cmd=cmd[0];
        codePage=codePage[0];
    }
    return {
        tooltip,
        url,
        shouldConfirm,
        confirmTxt: (1===grouplinks.length && confirmTxt.length>0 ? confirmTxt[0] : null),
        icon: (1===grouplinks.length ? iconPath : null),
        cmd,
        codePage,
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
    const {handledName:handledLinkName, shouldConfirm:flag, confirmTxt:txt, icon,cmd, codePage}=loadMeta(name);
    const tooltip=(handledLinkName ? handledLinkName+"  "+addr : addr);
    return {
        tooltip,
        url: addr,
        shouldConfirm: flag,
        confirmTxt: txt,
        icon,
        cmd,
        codePage,
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
    let cmd=false;
    let codePage=65001;

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
        if('cmd'===type){
            cmd=true;
            (opts??[]).map(item=>item.trim()).forEach(item=>{
               if(item.startsWith("cp") && item.length>2){
                   codePage=parseInt(item.substring(2).trim());
               }
            });
        }
    });
    return {handledName, shouldConfirm, confirmTxt, icon, cmd, codePage};
};



export {
    filterShortCuts,
    filterGroupLinks,
    filterSingleLink,
};