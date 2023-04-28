import mindMapValidateSvc from './mindMapValidateSvc';
import api from './api';
import globalStyleConfig from '../common/globalStyleConfig';



/**
 * 根据指定文本格式，解析为table方式显示的思维导数的数据格式
 * 
 * 层级式节点的格式 nd
 *  {
        id:     uuid,
        forceRight: true/false  //是否强制所有子树都在右侧，只对根节点有效
        lev:    lev,        //层级
        str:    txt,        //文本
        left:   false,      //方向，true-根节点左侧 false-根节点右侧
        par:    null,       //父节点，如果是根节点则为null
        color:  lineColor,  //节点颜色
        memo:   memo,       //备注信息
        links:  [
            {
                name:'',    //null或文字
                addr:''     //非空，url
            }
        ]
        childs: []          //子节点数组
        leaf:false,         //是否为叶节点
        expand:true,        //是否展开，在为叶节点时，此值无用
        defExp: true/false, //默认是否展开，在为叶节点时，此值无用
        ref: {
            txt:'',
            parsedTxt:''
        },
        visual:false,
        dateItem: dateItem,
        prog: prog,
    }
 * 
 * 
 * 树节点的格式 cell
 * {
 *      txt: "　",          //文本
        cls:0,              //样式符号（前期），样式对象（最后）
        llineColor:null,    //左右上下边框的颜色
        rlineColor:null,
        tlineColor:null,
        blineColor:null,
        nd: nd              //关联层级式节点
 * }
 * 
 */
class MindmapSvc {

    /**
     * 外部调用的主方法：解析为最终显示的数据格式
     * @param {txts} 待解析的文本
     * @param {defLineColor} 连接线的默认颜色
     * @param {mainThemeStyle} 中心主题的样式
     * @param {bordTypesMap} 边框类型的枚举
     * @param {getBorderStyleCallback} 根据边框类型解析为边框样式的回调
     * @return 解析失败时返回：
     * {
     *      succ: false,
     *      msg: '内容解析失败',
     *      desc: '图表内容不能为空 ~~~'
     * }
     * 解析成功时返回根节点对象
     *
     */
    parseRootNode = (txts, defLineColor, theThemeStyles, bordTypesMap, getBorderStyleCallback,defDateColor, shouldValidate = true) => {
        //校验
        if (shouldValidate) {
            if ('' === txts) {
                return {
                    succ: false,
                    msg: '内容解析失败',
                    desc: '图表内容不能为空 ~~~'
                }
            }
            let valiResult = mindMapValidateSvc.validate(txts);

            if (true !== valiResult) {
                return {
                    succ: false,
                    msg: '内容解析失败',
                    desc: valiResult + " ~~~"
                }
            }
        }

        try {
            //表格行列相关计算
            let nd = this.load(txts);//根节点
            this.setNodeLineColor(nd, defLineColor);
            return nd;
        } catch (e) {
            console.error(e);
            return {
                succ: false,
                msg: '内容解析失败',
                desc: ('string'===typeof(e)? ""+e : "图表内容解析过程中发生错误 ~~~")
            }
        }
    }


    //----------------如下为非暴露的方法-------------------------------------------------
    restoreNode=(nd, expands)=>{
        let result={};
        if (nd.leaf) {
            return {};
        }

        if(expands[nd.id]!==nd.defExp){
            result={
                ...result,
                [nd.id]: nd.defExp,
            };
        }
        nd.childs.forEach(child => {
            result={
                ...result,
                ...this.restoreNode(child, expands),
            };
        });
        return result;
    }

    expandNode = (nd, expands) => {
        const ndIds=[];
        if (nd.leaf) {
            return ndIds;
        }

        if(!expands[nd.id]){
            ndIds.push(nd.id);
        }
        nd.childs.forEach(child => {
            this.expandNode(child, expands).forEach(ndId=>{
                ndIds.push(ndId);
            });
        });
        return ndIds;
    }



    isNdExpStChangedRecursively=(nd, expands)=>{
        if(!nd){
            return false;
        }

        //叶节点认为展开状态没有变化
        if (nd.leaf) {
            return false;
        }

        //如果当前节点的展开状态有变化，则直接返回true
        if (expands[nd.id] !==nd.defExp) {
            return true;
        }

        //否则递归判断子节点展开状态有无变化，若有，直接返回true
        for (let i in nd.childs) {
            if (this.isNdExpStChangedRecursively(nd.childs[i], expands)) {
                return true;
            }
        }

        return false;
    }

    isNodeExpandRecursively = (nd, expands) => {
        if(!nd){
            return false;
        }

        //叶节点认为是展开状态
        if (nd.leaf) {
            return true;
        }

        //从自己向子节点递归，遇到未展开，就返回false，直到最后返回true
        if (!expands[nd.id]) {
            return false;
        }
        for (let i in nd.childs) {
            if (!this.isNodeExpandRecursively(nd.childs[i], expands)) {
                return false;
            }
        }
        return true;
    }






    /**
     * 递归设置节点和其子节点颜色
     * @param {nd} 当前节点
     * @param {parColor} 父节点颜色
     */
    setNodeLineColor = (nd, parColor = globalStyleConfig.defaultLineColor) => {
        let currColor = (null == nd.color ? parColor : nd.color);//如果当前节点没有指定颜色，则使用继承的颜色（即父节点的颜色），否则使用自己的颜色
        nd.color = currColor;

        //如果节点上的日期没有颜色，则继承线的颜色
        if(nd.dateItem && (null==nd.dateItem.color || ''===nd.dateItem.color)){
            nd.dateItem.color=currColor;
        }

        nd.childs.forEach(child => {
            this.setNodeLineColor(child, currColor);
        });
    }



    
    /**
     * 获得节点行中的特殊部分的处理器
     * @returns [
     *      (item, ...)=>[boolean, boolean, value]
     *      //参数：该行文本、其他依赖的对象等 
     *      //返回：[0]是否已处理、[1]是否有有效的结果值、[2]结果值内容
     * ]
     * 
     */
    linePartHandlers={
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
        handleOpener: (item, openers, cmds)=>{
            const singlePartHandler=(matchResult, shouldUseCmds=false)=>{
                const linkName=matchResult[1].trim()
                const protocol=matchResult[2].trim()
                const path=matchResult[3].trim();

                if(!shouldUseCmds) {
                    return [true, true, {
                        name: linkName,
                        addr: openers[path] ? protocol + openers[path] : protocol + path,
                    }];
                }
                return [true, true, {
                    name: linkName,
                    addr: protocol +
                        (openers[path] ? openers[path] : (cmds[path] ? cmds[path] : path)),
                }];
            };

            const doublePartHandler=(matchResult, shouldUseCmds=false)=>{
                const linkName=matchResult[1].trim()
                const protocol=matchResult[2].trim()
                const frontPart=matchResult[3].trim();
                const endPart=matchResult[4].trim();

                if(!shouldUseCmds) {
                    return [true, true, {
                        name: linkName,
                        addr: protocol + (openers[frontPart] ? openers[frontPart] : frontPart) + "@@" + (openers[endPart] ? openers[endPart] : endPart),
                    }];
                }
                return [true, true, {
                    name: linkName,
                    addr: protocol +
                        (openers[frontPart] ? openers[frontPart] : frontPart) +
                        "@@" +
                        (openers[endPart] ? openers[endPart] : (cmds[endPart] ? cmds[endPart] : endPart)),
                }];
            };

            // file协议：[xxx](file:///yy)
            let matchResult= item.match(/^\[([^[\]]*)\]\((file[:][/][/][/]?)(.+)\)$/);
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
                return singlePartHandler(matchResult, true);
            }

            // cmdp
            matchResult= item.match(/^\[([^[\]]*)\]\((cmdp[:][/][/][/]?)(.+)\)$/);
            if(matchResult){
                return singlePartHandler(matchResult, true);
            }

            // openby
            matchResult=item.match(/^\[([^[\]]*)\]\((openby[:][/][/][/]?)(.+)[@][@](.+)\)$/);
            if(matchResult){
                return doublePartHandler(matchResult, true);
            }

            // diropenby
            matchResult=item.match(/^\[([^[\]]*)\]\((diropenby[:][/][/][/]?)(.+)[@][@](.+)\)$/);
            if(matchResult){
                return doublePartHandler(matchResult, true);
            }

            //openin
            matchResult=item.match(/^\[([^[\]]*)\]\((openin[:][/][/][/]?)(.+)[@][@](.+)\)$/);
            if(matchResult){
                return doublePartHandler(matchResult, false);
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


    

    /**
     * 根据指定文本，加载节点信息（树型结构）
     * @param {arrayOrTxt} 文本数组或由包含换行符的字符串
     * @returns {nd} 包含各层节点信息的根节点
     */
    load = (arrayOrTxt) => {
        let lastNd = null;
        let root = null;
        let timeline = [];//时间线对象，后面会往里放
        let progs=[];
        let nodeIdCounter=0;
        let nodeIdPrefix="nd_"+new Date().getTime()+"_";
        const relaLineNds=[];
        let refNames=[];
        let down=false;
        let up=false;

        let { ndLines, refs, openers, shortcuts, cmds} = this.loadParts(arrayOrTxt);
        const defaultRelaLineColor='gray';// 关联线颜色默认为灰，与连线颜色不同，连线默认为lightgrey

        ndLines.forEach(({str,lineInd,lineInd2}) => {
            //=============数据行开始======================
            let lev = str.indexOf("-");//减号之前有几个字符即为缩进几层，层数从0开始计
            let txt = str.substring(lev + 1).trim();
            let txts=[txt];
            let lineColor = null;
            let memo = [];
            let links = [];
            let expand = true;
            let ref = [];
            let dateItem = null;
            let prog=null;
            let forceRight=false;
            let logicId=null;
            let logicToIds=[];
            let relaLineColors=[];

            //内容是简单类型，把转换的竖线再恢复回来
            let replTxt=escapeVLine(txt);
            if (0 > replTxt.indexOf("|")) {
                txt=unescapeVLine(replTxt);
                txts=[txt];
            }

            //内容是复合类型，则分别计算每一部分
            if (0 <= replTxt.indexOf("|")) {
                txts=[];
                replTxt.split('|').map(txt=>unescapeVLine(txt)).filter(txt=>null!=txt && ""!==txt.trim()).map(txt=>txt.trim()).forEach(tmp => {
                    //=============指定行的项开始======================
                    
                    let item = tmp.trim();
                    if (null == item || "" === item) { return; }

                    //forceRight
                    let [handled,hasVal,val]=this.linePartHandlers.handleForceRight(item);
                    if(handled){
                        if(hasVal){
                            forceRight = val;
                        }
                        return;
                    }

                    // down layout
                    [handled,hasVal,val]=this.linePartHandlers.handleDownLayout(item);
                    if(handled){
                        if(hasVal){
                            down=val;
                        }
                        return;
                    }
                    // up layout
                    [handled,hasVal,val]=this.linePartHandlers.handleUpLayout(item);
                    if(handled){
                        if(hasVal){
                            up=val;
                        }
                        return;
                    }





                    // id
                    [handled,hasVal,val]=this.linePartHandlers.handleId(item);
                    if(handled){
                        if(hasVal){
                            logicId=val;
                        }
                        return;
                    }

                    // toid
                    [handled,hasVal,val]=this.linePartHandlers.handleToId(item);
                    if(handled){
                        if(hasVal){
                            logicToIds.push(val.id);
                            relaLineColors.push(val.color ? val.color : defaultRelaLineColor);
                        }
                        return;
                    }

                    //节点默认是折叠状态
                    [handled,hasVal,val]=this.linePartHandlers.handleZip(item);
                    if(handled){
                        if(hasVal){
                            expand = val;
                        }
                        return;
                    }

                    //是引用
                    [handled,hasVal,val]=this.linePartHandlers.handleRef(item, refs);
                    if(handled){
                        if(hasVal){
                            if(!refNames.includes(val.name)){
                                refNames.push(val.name);
                            }
                            ref.push(val);
                        }
                        return;
                    }

                    //是打开为
                    [handled,hasVal,val]=this.linePartHandlers.handleOpener(item, openers, cmds);
                    if(handled){
                        if(hasVal){
                            links.push(val);
                        }
                        return;
                    }

                    //是颜色标记  c:red  c:#fcfcfc 
                    [handled,hasVal,val]=this.linePartHandlers.handleLineColor(item);
                    if(handled){
                        if(hasVal){
                            lineColor=val;
                        }
                        return;
                    }

                    //是备注标记  m:说明
                    [handled,hasVal,val]=this.linePartHandlers.handleMemo(item);
                    if(handled){
                        if(hasVal){
                            memo.push(val);
                        }
                        return;
                    }

                    //是普通链接  http://www.xxx.com
                    [handled,hasVal,val]=this.linePartHandlers.handleCommonLink(item, this.isUrlPattern);
                    if(handled){
                        if(hasVal){
                            links.push(val);
                        }
                        return;
                    }

                    //进度   p:10   p:-20   
                    [handled,hasVal,val]=this.linePartHandlers.handleProg(item, progs);
                    if(handled){
                        if(hasVal){
                            if(!prog){
                                prog=val;
                                progs.push(prog);//保持加入的顺序不变，后面不用排序
                                return;
                            }
                            prog=val;
                            progs[progs.length-1]=prog;
                        }
                        return;
                    }

                    //日期类型 d:20.1.8、d:20.1.8,purple
                    [handled,hasVal,val]=this.linePartHandlers.handleDate(item,timeline,this.parseDateInfo);
                    if(handled){
                        if(hasVal){
                            dateItem=val;
                            timeline.push(dateItem);//保持加入的顺序不变，后面不用排序
                        }
                        return;
                    }

                    //是markdown链接 [文字](地址)
                    [handled,hasVal,val]=this.linePartHandlers.handleMarkdownLink(item,this.hasUrlPrefix);
                    if(handled){
                        if(hasVal){
                            links.push(val);
                        }
                        return;
                    }

                    //都不是，即为文本内容
                    txts.push(item);//如出现多次，只保留最后一次

                    //-------------指定行的项结束----------------------
                });
            }

            //整行加载完之后，设置日期项对应的文本
            if (dateItem) {
                dateItem.txt = txts;
            }
            if(prog){
                prog.txt=txts;
            }

            let nd = {
                id: nodeIdPrefix+(++nodeIdCounter),
                lineInd,
                lineInd2,
                lev: lev,
                str: txts,
                left: false,
                par: null,
                parid:null,
                color: lineColor,
                memo: memo,
                links: links,
                childs: [],
                leaf: false,         //是否为叶节点
                expand: expand,      //展开状态
                defExp: expand,      //默认展开状态
                refs: ref,
                dateItem: dateItem,
                prog: prog,
                forceRight: (0===lev?forceRight:false), //只有根节点才有可能设置forceRight，其他节点一律为false
                up: (0===lev?up:null),
                down: (0===lev?down:null),
                logicId,
                logicToIds,
                relaLineColors,
                isRelaLineFrom: false,
                isRelaLineTo: false,
            };


            //还没有第一个节点，以第一个节点为根节点
            if (null == root) {
                root = nd;
                lastNd = nd;
                if(null!=logicId || 0<logicToIds.length){
                    relaLineNds.push(nd);
                }
                return;
            }

            //当前节点的父节点为从上一个节点向父层找第一个匹配 lev=当前节点lev-1 的节点
            let targetLev = nd.lev - 1;
            let tmpNd = lastNd;
            while (tmpNd.lev > targetLev) {
                tmpNd = tmpNd.par;
            }
            nd.par = tmpNd;
            nd.parid=tmpNd.id;
            tmpNd.childs.push(nd);

            //每次处理完一次记录上个节点
            lastNd = nd;
            if(null!=logicId || 0<logicToIds.length){
                relaLineNds.push(nd);
            }
            //-------------数据行结束----------------------
        });

        
        //从顶部开始递归设置叶节点标志
        this.setLeaf(root);

        //所有节点所加载完宾，对时间线排序
        timeline.sort((t1, t2) => {
            if (t1.fullDate === t2.fullDate) {
                return 0;
            }
            return t1.fullDate < t2.fullDate ? -1 : 1;
        });

        // 关联id与toid
        relaLineNds.filter(ndFrom=>0<ndFrom.logicToIds.length).forEach(ndFrom=>{
            relaLineNds.filter(ndTo=>ndFrom.logicToIds.includes(ndTo.logicId)).forEach(ndTo=>{
                if(!ndFrom.toids){
                    ndFrom.toids=[ndTo.id];
                }else{
                    ndFrom.toids.push(ndTo.id);
                }
                ndFrom.isRelaLineFrom=true;
                ndTo.isRelaLineTo=true;
            });
        });

        // 把所有引用的内容合并在一起，如果超过两个引用，则放到根节点中，否则不处理
        let refCnt=0;
        let allRefs="";
        refNames.forEach(refName=>{
            if('undefined'!== typeof(refs[refName])){
                ++refCnt;
                allRefs+=refName.replace("ref:","# ")+"\n"+refs[refName]+"\n\n";
            }
        });
        if(refCnt>=2){
            const sumRef={
                name: "ref:全部引用",
                showname: "全部引用",
                txt: allRefs,
                parsedTxt: null,
                combined:true,
            };
            root.refs.push(sumRef);
        }
        root.shortcuts=shortcuts;
        return root;
    }






    parseDateInfo=(dateItem,datePart,colorPart)=>{
        //指定的日期
        let ymd = datePart.replace(/[-/.]/g, '|').split('|').map(eachPart => parseInt(eachPart));
        let assignedDate = new Date(2000 + ymd[0], ymd[1] - 1, ymd[2]);//月份从0开始

        //当前日期
        let now = new Date();
        now.setHours(0);
        now.setMinutes(0);
        now.setSeconds(0);
        now.setMilliseconds(0);

        //日期全称
        dateItem.fullDate=""+(2000 + ymd[0])+"-"+(ymd[1]<10?"0":"")+ymd[1]+"-"+(ymd[2]<10?"0":"")+ymd[2]+" ";
        let dayOfWeek=['日','一','二','三','四','五','六'][assignedDate.getDay()];
        dateItem.fullDate+=dayOfWeek;

        //日期简称
        dateItem.abbrDate='';
        if(assignedDate.getFullYear()!==now.getFullYear()){
            dateItem.abbrDate+=ymd[0]+"/"
        }
        dateItem.abbrDate+=ymd[1]+"/"
        dateItem.abbrDate+=ymd[2];

        //指定日期与当前日期相差的天数
        let dist=Math.abs((now - assignedDate)/86400000);

        //指定日期小于当前日期，过期，显示为红色
        if (assignedDate < now) {
            dateItem.color = globalStyleConfig.defaultDateColor.expired;
            dateItem.expired=true;
            let dayNames = [undefined, "昨天", "前天", "大前天"];
            dateItem.msg =(dist in dayNames ? dayNames[dist] : "过期 " + dist + " 天");
        }
        //7天之内为近期任务
        else if (now <= assignedDate && dist <= 7) {
            dateItem.color = globalStyleConfig.defaultDateColor.near;
            dateItem.near=true;
            let dayNames = ["今天", "明天", "后天", "大后天"];

            dateItem.msg =(dist in dayNames ? dayNames[dist]: "还剩 " + dist + " 天");
        }
        //以后
        else {
            dateItem.color = globalStyleConfig.defaultDateColor.future;
            dateItem.future=true;
            dateItem.msg = dist+" 天以后";
        }

        //手动指定了颜色，则覆盖掉前面的颜色设置。可能是 "" 或 "red" 的格式，如果是空，则在计算节点颜色时会设置上
        if ('undefined'!==typeof(colorPart)) {
            dateItem.color = colorPart;
        }
        return dateItem;
    }



    /**
     * 把内容拆分为
     */
    loadParts = (alltxts) => {
        let openers={};
        let shortcuts=[];
        let refs = {};
        let trefs = {};
        let cmds={};
        let graphs = {};
        let ndLines = [];
        let currRefName = null;
        let alreadyHandleRefs = false;
        let lineCounter=-1;

        alltxts.trim().replace(/\r/g, '').split("\n").forEach(line => {
            ++lineCounter;

            if ("***" === line.trim() && !alreadyHandleRefs) {
                alreadyHandleRefs = true;
            }

            //还没到引用部分
            if (!alreadyHandleRefs) {
                if ('' === line.trim()) {
                    return;
                }
                ndLines.push({str:line, lineInd:lineCounter,});//此处不要trim，因为节点有层级关系，前面有制表符
                return;
            }

            //已经到引用部分
            //是引用标识符
            let trimLine = line.trim();
            if (    
                    (trimLine.startsWith("# ref:") && trimLine.length > "# ref:".length) ||
                    (trimLine.startsWith("# tref:") && trimLine.length > "# tref:".length) ||
                    (trimLine.startsWith("# graph:") && trimLine.length > "# graph:".length) ||
                    (trimLine.startsWith("# cmd:") && trimLine.length > "# cmd:".length)
            ){
                currRefName = trimLine.substring("# ".length);
                return;
            }
            if("# openers"===trimLine){
                currRefName="openers";
            }
            if("# shortcuts"===trimLine){
                currRefName="shortcuts";
            }

            //还没有当前标识符
            if (null == currRefName) {
                return;
            }

            //已有当前标识符
            if("shortcuts"===currRefName){
                // - [链接名称](链接地址)
                const matchResult=trimLine.match(/^[-] \[(.+)\]\((.+)\)$/);
                if(matchResult && matchResult[1] && matchResult[2]){
                    const name=matchResult[1].trim();
                    const url=matchResult[2].trim();
                    shortcuts.push({name,url});
                }
            }
            else if("openers"===currRefName){
                // - [haha]: d:\\a\\b.exe
                const matchResult=trimLine.match(/^[-] \[([^[\]]+)\][:](.+)$/);
                if(matchResult && matchResult[1] && matchResult[2]){
                    const openerId=matchResult[1].trim();
                    const openerContent=matchResult[2].trim();
                    openers[openerId]=openerContent;
                }
            }else if(currRefName.startsWith("ref:")){
                //是已记录过的引用
                if ("undefined" !== typeof (refs[currRefName])) {
                    refs[currRefName] += '\n' + line;
                    return;
                }
                //是新引用
                refs[currRefName] = line;
                return;
            }else if(currRefName.startsWith("tref:")){
                if(""===trimLine){
                    return;
                }

                //是已记录过的引用
                if ("undefined" !== typeof (trefs[currRefName])) {
                    trefs[currRefName] += trimLine;
                    return;
                }
                //是新引用
                trefs[currRefName] = trimLine;
                return;
            } else if(currRefName.startsWith("cmd:")){
                const cmdAlias=currRefName.substring("cmd:".length).trim();
                //是已记录过的引用
                if ("undefined" !== typeof (cmds[cmdAlias])) {
                    cmds[cmdAlias].push(trimLine);
                    return;
                }
                //是新引用
                cmds[cmdAlias] = [trimLine];
                return;
            }
        });



        // 命令处理，只保留三引号之间的部分作为命令主体
        for(let key in cmds){
            let startSymbolFound=false;
            let endSymbolFound=false;
            const preservedCmdLines=[];
            cmds[key].forEach(line=>{
                if(line.startsWith("```") && line.length>"```".length){
                    startSymbolFound=true;
                    return;
                }
                if("```"===line && true===startSymbolFound){
                    endSymbolFound=true;
                    return;
                }
                if(startSymbolFound && !endSymbolFound && ''!==line){
                    preservedCmdLines.push(line);
                }
            });
            cmds[key]=preservedCmdLines.join(" \\");
        }




        // 文字引用直接替换到原文中
        ndLines=ndLines.map(({str, lineInd})=>{
            let splitPos=str.indexOf("- ")+2;
            let front=str.substring(0,splitPos);
            let end="|"+escapeVLine(str.substring(splitPos).trim())+"|";

            for(let key in trefs){
                end=end.replace("|"+key+"|","|"+trefs[key]+"|");
            }
            while(end.startsWith("|")){
                end=end.substring(1);
            }
            while(end.endsWith("|")){
                end=end.substring(0,end.length-1);
            }
            return {
                str: front+unescapeVLineRestore(end.trim()),
                lineInd
            };
        });

        // 把拆分为多行的节点合并到一起
        // 合并前
        // 1    - a
        // 2      ax
        // 3      ay
        // 合并后
        // 1-3  - a|ax|ay
        const tmp=[];
        ndLines.forEach(({str, lineInd})=>{
            if(0===tmp.length || str.trim().startsWith("- ")){
                tmp.push({
                    str,
                    lineInd,
                    lineInd2: lineInd,
                });
                return;
            }
            let target=tmp[tmp.length-1];
            target.str=target.str+"|"+str;
            target.lineInd2=lineInd;
        });
        ndLines=tmp;

        // 快捷方式别名替换，需要在openers与cmds处理完后执行
        shortcuts.forEach(item=>{
             let [handled, hasVal, val]=this.linePartHandlers.handleOpener(`[${item.name}](${item.url})`, openers, cmds);
             if(true===handled && true===hasVal){
                item.url=val.addr;
             }
        });

        return { ndLines, refs, graphs, openers, shortcuts, cmds};
    }

    setLeaf = (nd) => {
        nd.leaf = (0 === nd.childs.length);
        nd.childs.forEach(child => {
            this.setLeaf(child);
        });
    }

    hasUrlPrefix = (url) => {
        return ["http://","https://","ftp://","ftps://","file://","dir://","cp://","cmd://","gmap://","//"].some(prefix=>url.startsWith(prefix));
    }

    /**
     * 判断是否为url类型
     * @param {*} url 
     * @returns 如果是url类型，返回处理过的地址，否则抬false
     */
    isUrlPattern = (url) => {
        if (this.hasUrlPrefix(url)) {
            return url.trim();
        }
        if (url.startsWith("www.") && url.length > "www.".length) {
            return "http://" + url.trim();
        }
        return false;
    }
}


//竖线转义相差工具方法
const vlineEscapeTxt='___vline___';
const escapeVLineReg=/[\\][|]/g;
const unescapeVLineReg=new RegExp(vlineEscapeTxt,"g");

const escapeVLine=(str)=>str.replace(escapeVLineReg,vlineEscapeTxt);
const unescapeVLine=(str)=>str.replace(unescapeVLineReg,'|');
const unescapeVLineRestore=(str)=>str.replace(unescapeVLineReg,'\\|');







const inst=new MindmapSvc();

const expObj={
    /**
     * 解析文本内容为节点对象
     */
    parseRootNode:      inst.parseRootNode,

    /**
     * 节点和子节点是否已全部展开
     */
    isNodeExpandRecursively:inst.isNodeExpandRecursively,

    /**
     * 节点或子节点的展开状态与默认状态比是否有变化
     */
    isNdExpStChangedRecursively:inst.isNdExpStChangedRecursively,

    /**
     * 展开指定节点和其所有子节点
     */
    expandNode:inst.expandNode,

    /**
     * 状态节点和子节点的默认状态
     */
    restoreNode:inst.restoreNode,
};

export default expObj;