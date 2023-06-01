import linePartHandlers from './linePartHandlers';

class PartLoader{

    /**
     * 预处理：
     * 在结果对象中创建指定属性的初始值
     * @param result
     * @param tmp
     */
    preHandle(result, tmp){
        if(!result){
            throw new Error("you should supply the result object");
        }
        if(!tmp){
            throw new Error("you should supply the tmp object");
        }
    }

    /**
     * 判断是否为指定类型的头部
     * @param line
     * @param trimLine
     * @param tmp
     * @return {boolean}
     */
    isPartTitle(line, trimLine, tmp){
        return false;
    }

    /**
     * 处理当前行
     * @param line
     * @param trimLine
     * @param result
     * @param tmp
     * @param lineCounter
     */
    handleLine(line, trimLine, result, tmp, lineCounter){}


    /**
     * 后置处理：
     * 在所有行处理完成后进行归纳、合并、替换等操作
     * @param result
     */
    postHandle(result){}
}


/**
 * 别名加载器
 */
class AliasLoader extends PartLoader{
    preHandle=(result, tmp)=>{
        super.preHandle(result, tmp);
        if('undefined'===typeof(result.alias)){
            result.alias={};
        }
    }

    isPartTitle=(line, trimLine, tmp)=> ("# alias"===trimLine)


    handleLine=(line, trimLine, result, tmp, lineCounter)=>{
        // [xxx]:
        let matchResult= trimLine.match(/^\[([^[\]]+)\][:]$/);
        if(matchResult){
            tmp.currAliasName=matchResult[1].trim();
            return;
        }
        // [xxx]: yyy
        matchResult= trimLine.match(/^\[([^[\]]+)\][:] (.+)$/);
        if(matchResult){
            tmp.currAliasName=matchResult[1].trim();
            const firstLine=matchResult[2].trim();
            if(!this.isCommentLine(firstLine)){
                result.alias[tmp.currAliasName]=[firstLine];
            }
            return;
        }
        if(''!==trimLine && !this.isCommentLine(trimLine) && tmp.currAliasName){
            if("undefined"!== typeof(result.alias[tmp.currAliasName])){
                result.alias[tmp.currAliasName].push(trimLine);
                return;
            }
            result.alias[tmp.currAliasName]=[trimLine];
            return;
        }
    }


    /**
     * 把数组转换为字符串；
     * 如果出现 ``` 包裹的内容，则只取其中的内容作为有效内容，其它内容忽略
     * @param result
     */
    postHandle=(result)=>{
        for (const key in result.alias) {
            let hasStartSymbol=false;
            let hasEndSymbol=false;
            let cutBeginLine=0;
            let cutEndLine=result.alias[key].length;

            result.alias[key].forEach((line,lineInd)=>{
                if(hasStartSymbol && hasEndSymbol){
                    return;
                }
                // 开始截取位置为 ```bat 行的下一行
                if(!hasStartSymbol && /^```[^`]*$/.test(line.trim())){
                    cutBeginLine=lineInd+1;
                    hasStartSymbol=true;
                    return;
                }
                // 结束截取位置为开始位置之后的 ``` 行
                if(hasStartSymbol && /^```$/.test(line.trim())){
                    cutEndLine=lineInd;
                    hasEndSymbol=true;
                    return;
                }
            });
            result.alias[key]=result.alias[key].splice(cutBeginLine, cutEndLine-cutBeginLine).join(" \\");
        }
    }



    /**
     * 是否是注释行：# rem :: 开头的行都算作注释行
     * @param line
     * @return {boolean|*}
     */
    isCommentLine=(line)=>{
        return (
            '#'===line || line.startsWith("# ") ||
            'rem'===line || line.startsWith("rem ") ||
            '::'===line || line.startsWith("::")
        );
    };

}


/**
 * 快捷方式加载器
 */
class ShortcutLoader extends PartLoader{
    preHandle=(result, tmp)=>{
        super.preHandle(result, tmp);
        if('undefined'===typeof(result.shortcuts)){
            result.shortcuts=[];
        }
    }

    isPartTitle=(line, trimLine, tmp)=> ("# shortcuts"===trimLine)

    handleLine=(line, trimLine, result, tmp, lineCounter)=>{
        // - [链接名称](链接地址)
        let matchResult=line.match(/^[-] \[(.+)\]\((.+)\)[ 　\t]*$/);
        if(matchResult && matchResult[1] && matchResult[2]){
            const name=matchResult[1].trim();
            const url=matchResult[2].trim();
            result.shortcuts.push({name,url,subNames:null});
            return;
        }

        // [tab]- [链接名称](链接地址)
        matchResult=line.match(/^\t[-] \[(.*)\]\((.+)\)[ 　\t]*$/);
        if(matchResult && matchResult[2] && tmp.currShortcutItem){
            tmp.currShortcutItem.url.push(matchResult[2].trim());
            tmp.currShortcutItem.subNames.push(matchResult[1].trim());
            return;
        }

        // - 名称
        matchResult=line.match(/^[-] (.+)[ 　\t]*$/);
        if(matchResult && matchResult[1]){
            tmp.currShortcutItem={name:matchResult[1].trim(), url:[], subNames:[]}
            result.shortcuts.push(tmp.currShortcutItem);
            return;
        }
    }

    /**
     * 快捷方式别名替换，需要在alias加载完后执行：
     * 如果链接是字符串，则直接替换别名
     * 如果链接是数组，且数组只有一个元素，则替换后改为字符串类型，即不会存在只有一个元素的数组
     * 如果链接是数组，且数组有多个元素，则把每个元素替换别名，并保持数组类型
     * @param result
     */
    postHandle=(result)=>{
        //
        let tmpShorts=[];
        result.shortcuts.forEach(item=>{
            if('string'===typeof(item.url)){
                item.url=replaceLinkAlias(item.url, result.alias);
                tmpShorts.push(item);
                return;
            }
            if(Array.isArray(item.url) && 1===item.url.length){
                item.url=replaceLinkAlias(item.url[0], result.alias);
                tmpShorts.push(item);
                return;
            }
            if(Array.isArray(item.url) && 1<item.url.length){
                item.url=item.url.map(eachUrl=>replaceLinkAlias(eachUrl, result.alias));
                tmpShorts.push(item);
                return;
            }
        });
        result.shortcuts=tmpShorts;
    }



}


/**
 * 文字引用加载器
 */
class TRefLoader extends PartLoader{


    preHandle=(result, tmp)=>{
        super.preHandle(result, tmp);
        if('undefined'===typeof(result.trefs)){
            result.trefs = {}
        }
    }

    isPartTitle=(line, trimLine, tmp)=>{
        const flag=(trimLine.startsWith("# tref:") && trimLine.length > "# tref:".length);
        if(flag){
            tmp.currTRefName = trimLine.substring("# ".length);
            return true;
        }
        return false;
    }




    handleLine=(line, trimLine, result, tmp, lineCounter)=>{
        if(""===trimLine){
            return;
        }

        //是已记录过的引用
        if ("undefined" !== typeof (result.trefs[tmp.currTRefName])) {
            result.trefs[tmp.currTRefName] += trimLine;
            return;
        }
        //是新引用
        result.trefs[tmp.currTRefName] = trimLine;
    }


    /**
     * 文字引用直接替换到节点原文中
     * @param result
     */
    postHandle=(result)=>{
        // 文字引用直接替换到原文中
        result.ndLines=result.ndLines.map(({str, lineInd, lineInd2})=>{
            let splitPos=0;
            const ind=str.indexOf("- ");
            if(ind>=0 && ''===str.substring(0, ind).trim()){
                splitPos=ind+2;
            }
            let front=str.substring(0,splitPos);
            let end="|"+(str.substring(splitPos).trim())+"|";

            for(let key in result.trefs){
                end=end.replace("|"+key+"|","|"+result.trefs[key]+"|");
            }
            while(end.startsWith("|")){
                end=end.substring(1);
            }
            while(end.endsWith("|")){
                end=end.substring(0,end.length-1);
            }
            return {
                str: front+(end.trim()),
                lineInd,
                lineInd2,
            };
        });
    }
}


/**
 * 引用加载器
 */
class RefLoader extends PartLoader{
    preHandle=(result, tmp)=>{
        super.preHandle(result, tmp);
        if('undefined'===typeof(result.refs)){
            result.refs = {}
        }
    }

    isPartTitle=(line, trimLine, tmp)=>{
        const flag=(trimLine.startsWith("# ref:") && trimLine.length > "# ref:".length);
        if(flag){
            tmp.currRefName = trimLine.substring("# ".length);
            return true;
        }
        return false;
    }

    handleLine=(line, trimLine, result, tmp, lineCounter)=>{
        //是已记录过的引用
        if ("undefined" !== typeof (result.refs[tmp.currRefName])) {
            result.refs[tmp.currRefName] += '\n' + line;
            return;
        }
        //是新引用
        result.refs[tmp.currRefName] = line;
    }

    /**
     * 引用中出现的链接和图片进行别名替换
     * @param result
     */
    postHandle=(result)=>{
        for (const refName in result.refs) {
            let content=result.refs[refName];
            // [xxx](yyy)
            ((content.match(/\[[^\]]*\][(]([^)]+)[)]/g))??[]).forEach(item=>{
                const originUrl=item.match(/^\[[^\]]*\][(]([^)]+)[)]$/)[1];
                const replacedUrl= replaceLinkAlias(originUrl, result.alias);
                const replacedItem= item.replace(`(${originUrl})`, `(${replacedUrl})`);
                content=content.replace(item, replacedItem);
            });
            result.refs[refName]=content;
        }
    }
}


/**
 * 节点行的加载器
 */
class NdLineLoader extends PartLoader{
    preHandle=(result, tmp)=>{
        super.preHandle(result, tmp);
        if('undefined'===typeof(result.ndLines)){
            result.ndLines = [];
        }
    }

    handleLine=(line, trimLine, result, tmp, lineCounter)=>{
        if ('' === trimLine) {
            return;
        }
        //此处不要trim，因为节点有层级关系，前面制表符要保留
        result.ndLines.push({str:line, lineInd:lineCounter,});
    }

    /**
     * 把拆分为多行的节点合并到一起：
     * 合并前
     *      1    - a
     *      2      ax
     *      3      ay
     * 合并后
     *      1-3  - a|ax|ay
     * @param result
     */
    postHandle=(result)=>{
        result.ndLines=result.ndLines.reduce((accu, {str, lineInd}, ind)=>{
            if(0===ind || str.trim().startsWith("- ")){
                accu.push({
                    str,
                    lineInd,
                    lineInd2: lineInd,
                });
                return accu;
            }
            let lastNode=accu[accu.length-1];
            if(lastNode){
                lastNode.str+="|"+str;
                lastNode.lineInd2=lineInd;
            }
            return accu;
        }, []);
    }
}



const replaceLinkAlias=(url, alias)=>{
    let [handled, hasVal, val]=linePartHandlers.handleOpener(`[link_name](${url})`, alias);
    if(true===handled && true===hasVal){
        return val.addr;
    }
    return url;
}



/**
 * 引用各部分的加载器
 * 其中别名要第一个加载，因为其它部分会用到
 * @type {(AliasLoader|ShortcutLoader|TRefLoader|RefLoader)[]}
 */
const partLoaders=[
    new AliasLoader(),
    new ShortcutLoader(),
    new TRefLoader(),
    new RefLoader(),
];

export default partLoaders;

/**
 * 节点加载器
 * @type {NdLineLoader}
 */
export const ndLineLoader=new NdLineLoader();
