import api from './api';

/**
 * 获得节点行中的特殊部分的处理器
 * @returns [
 *      (item, ...)=>[boolean, boolean, value]
 *      //参数：该行文本、其他依赖的对象等
 *      //返回：[0]是否已处理、[1]是否有有效的结果值、[2]结果值内容
 * ]
 *
 */
const linePartHandlers={
    handleId: (item)=>{
        if(!item.startsWith("id:") || item.length<="id:".length){
            return [false,false,null]
        }
        return [true,true,item.substring("id:".length).trim()];
    },

    handleToId:(item)=>{
        if(!item.startsWith("toid:") || item.length<="toid:".length){
            return [false,false,null]
        }
        let result={};
        item.split(",").filter(each=>null!=each && ""!==each.trim()).map(each=>each.trim()).forEach((each,ind)=>{
            if(each.startsWith("toid:") && each.length>"toid:".length){
                result={...result, id:each.substring("toid:".length).trim()};
                return;
            }
            if(each.startsWith("c:") && each.length>"c:".length){
                result={...result, color:each.substring("c:".length).trim() };
                return;
            }
        });
        return [true,true,result];
    },

    handleForceRight: (item)=>{
        if ('right:' !== item) {
            return [false,false,null];
        }

        return [true,true,true];
    },

    handleDownLayout: (item)=>{
        if ('down:' !== item) {
            return [false,false,null];
        }

        return [true,true,true];
    },

    handleUpLayout: (item)=>{
        if ('up:' !== item) {
            return [false,false,null];
        }

        return [true,true,true];
    },



    /**
     * 节点默认是折叠状态
     * @param {*} item
     * @returns
     */
    handleZip: (item)=>{
        if ('zip:' !== item) {
            return [false,false,null];
        }

        return [true,true,false];
    },


    handleRef: (item, refs)=>{
        let refPrefixLen = 'ref:'.length;
        if (!item.startsWith("ref:") || item.length <= refPrefixLen) {
            return [false,false,null];
        }

        if ('undefined' !== typeof (refs[item])) {
            let ref = {
                name: item,
                showname: item.substring(refPrefixLen).trim(),
                txt: refs[item],
                parsedTxt: null,
            };
            return [true,true,ref];
        }
        return [true,false,null];
    },

    // openers中设置的值替换链接中的部分
    handleOpener: (item, alias)=>{
        const singlePartHandler=(matchResult)=>{
            const linkName=matchResult[1].trim()
            const protocol=matchResult[2].trim()
            const path=matchResult[3].trim();

            return [true, true, {
                name: linkName,
                addr: protocol + (alias[path] ? alias[path] : path),
            }];
        };

        const doublePartHandler=(matchResult)=>{
            const linkName=matchResult[1].trim()
            const protocol=matchResult[2].trim()
            const frontPart=matchResult[3].trim();
            const endPart=matchResult[4].trim();

            return [true, true, {
                name: linkName,
                addr: protocol +
                    (alias[frontPart] ? alias[frontPart] : frontPart) +
                    "@@" +
                    (alias[endPart] ? alias[endPart] : endPart),
            }];
        };

        // 链接地址本身就是别名的处理，如果发生别名替换则直接返回，否则继续向下匹配
        let matchResult= item.match(/^\[([^[\]]*)\]\((.+)\)$/);
        if(matchResult){
            const linkName=matchResult[1].trim()
            const path=matchResult[2].trim();

            if(alias[path]){
                return [true, true, {
                    name: linkName,
                    addr: alias[path],
                }];
            }
        }

        // http(s)协议：[xxx](http(s):///yy)
        matchResult= item.match(/^\[([^[\]]*)\]\((https?[:][/][/])(.+)\)$/);
        if(matchResult){
            return singlePartHandler(matchResult);
        }

        // file协议：[xxx](file:///yy)
        matchResult= item.match(/^\[([^[\]]*)\]\((file[:][/][/][/]?)(.+)\)$/);
        if(matchResult){
            return singlePartHandler(matchResult);
        }

        // openas协议：：[xxx](openas:///yy)
        matchResult= item.match(/^\[([^[\]]*)\]\((openas[:][/][/][/]?)(.+)\)$/);
        if(matchResult){
            return singlePartHandler(matchResult);
        }

        // cmdopen
        matchResult= item.match(/^\[([^[\]]*)\]\((cmdopen[:][/][/][/]?)(.+)\)$/);
        if(matchResult){
            return singlePartHandler(matchResult);
        }

        // cmd
        matchResult= item.match(/^\[([^[\]]*)\]\((cmd[:][/][/][/]?)(.+)\)$/);
        if(matchResult){
            return singlePartHandler(matchResult);
        }

        // cmdp
        matchResult= item.match(/^\[([^[\]]*)\]\((cmdp[:][/][/][/]?)(.+)\)$/);
        if(matchResult){
            return singlePartHandler(matchResult);
        }

        // openby
        matchResult=item.match(/^\[([^[\]]*)\]\((openby[:][/][/][/]?)(.+)[@][@](.+)\)$/);
        if(matchResult){
            return doublePartHandler(matchResult);
        }

        // diropenby
        matchResult=item.match(/^\[([^[\]]*)\]\((diropenby[:][/][/][/]?)(.+)[@][@](.+)\)$/);
        if(matchResult){
            return doublePartHandler(matchResult);
        }

        //openin
        matchResult=item.match(/^\[([^[\]]*)\]\((openin[:][/][/][/]?)(.+)[@][@](.+)\)$/);
        if(matchResult){
            return doublePartHandler(matchResult);
        }

        return [false,false,null];
    },



    handleLineColor:(item)=>{
        if (!item.startsWith("c:")) {
            return [false,false,null];
        }

        if(item.length > 20){
            return [true,false,null];
        }
        let lineColor = item.substring("c:".length).trim();//如果出现多次，则以最后一次为准
        return [true,true,lineColor];
    },

    handleMemo:(item)=>{
        if (!item.startsWith("m:")) {
            return [false,false,null];
        }
        let memo=item.substring("m:".length).trim();//备注可以出现多个，最终加入数组中
        if(null==memo || ''===memo.trim()){
            return [true,false,null];
        }
        return [true,true,memo];
    },

    handleCommonLink:(item, isUrlPattern)=>{
        let urlPattern = isUrlPattern(item);
        if (false === urlPattern) {
            return [false,false,null];
        }

        let link={
            name: null,
            addr: urlPattern
        };
        return [true,true,link];
    },

    handleMarkdownLink:(item, hasUrlPrefix)=>{
        //是markdown链接 [文字](地址)
        if (!(/^\[.*?\]\(.+?\)$/.test(item))) {
            return [false,false,null];
        }

        let txt = item.substring(1, item.lastIndexOf("]")).trim();
        let url = item.substring(item.indexOf("(") + 1, item.length - 1).trim();
        if(null===txt || ''===txt || ""===txt.trim()){
            if(url.startsWith("cmd://")){
                txt='执行命令';
            }else if(url.startsWith("cp://")){
                txt='复制';
            }else if(url.startsWith("dir://")){
                txt='打开目录并选择';
            }else if(url.startsWith("openas://")){
                txt='打开方式';
            }else{
                txt='打开';
            }
        }

        if (hasUrlPrefix(url)) {
            url=url+"";
        }else if(url.startsWith("./")){
            url=api.calcAttUrlSync("",url);
        }/*else{
                url = "http://" + url;
            }*/

        let link={
            name: txt,
            addr: url
        };
        return [true,true,link];
    },



    handleProg:(item, progs)=>{
        let progMatchItems=/^p[:]([-]?)([0-9]{1,3})$/.exec(item);
        if(!(item.startsWith("p:") && progMatchItems)){
            return [false,false,null];
        }

        let isErr=(progMatchItems[1]?true:false);
        let num=parseInt(progMatchItems[2]);
        num=(num>100?100:num);
        let msg=(isErr?"完成到 "+num+"% 时出现错误":(100===num?"已完成":"已完成 "+num+"%"));

        let prog={
            num: num,
            txt: null,//稍后加入
            st: isErr?'exception':(100===num?'success':'normal'),
            allProgs: progs,
            msg: msg,
            err : isErr,
            done: !isErr && 100===num,
            doing: !isErr && 100>num,
        };
        return [true,true,prog];
    },

    handleDate:(item, timeline, parseDateInfo)=>{
        //匹配规则：[0]整串  [1]日期部分  [2],purple  [3]purple
        let dateMatchItems = /^d[:]([0-9]{2}[-/.][0-9]{1,2}[-/.][0-9]{1,2})(,(.{0,25}))?$/.exec(item);
        if (!(item.startsWith("d:") && dateMatchItems && dateMatchItems[1])) {
            return [false,false,null];
        }

        let dateItem = {
            fullDate: '', //2020-05-23 五
            msg: '', //昨天、前天、大前天，过期x天，今天、明天、后天、大后天，还差x天
            abbrDate: '', //是当年： 5/23   不是当年 22/3/20,
            timeline: timeline, //时间线对象
            color: null,
            txt: null,//稍后加入
            expired:false,
            near:false,
            future:false,
        };
        dateItem=parseDateInfo(dateItem,dateMatchItems[1],dateMatchItems[3]);
        return [true,true,dateItem];
    },
};

export default linePartHandlers;