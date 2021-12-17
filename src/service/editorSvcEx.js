const editorSvcExInstWrapper=(function(){
    // ------------------------------- 基础方法：不涉及codemirror对象的操作 ------------------------------------------------------
    /**
     * 判断是否是特殊标题行通用方法
     * @param {*} line          指定行的文本
     * @param {*} startLabel    起始标识符
     * @param {*} startsWith    true - 以起始标识符开始且长度大于起始标识符即为匹配，false - 与起始标识符完全匹配才算匹配
     * @returns 
     */
    const isSpecialHeaderLineBase=(line, startLabel, startsWith=true)=>{
        if(!line){
            return false;
        }
        if(line.trim){
            line=line.trim();
        }else{
            line=(""+line).trim();
        }
        if(startsWith){
            return (line.startsWith(startLabel) && line.length>startLabel.length);
        }
        return (line===startLabel);
    };


    /**
     * 判断一行是否为引用标题行，即：# ref:xx
     * @param {*} line 
     */
    const isRefHeaderLine=(line)=>{
        return isSpecialHeaderLineBase(line, "# ref:", true);
    };


    /**
     * 判断一行是否为文本引用标题行，即：# tref:xx
     * @param {*} line 
     * @returns 
     */
    const isTrefHeaderLine=(line)=>{
        return isSpecialHeaderLineBase(line, "# tref:", true);
    };


    /**
     * 判断一行是否为打开方式标题行，即：# openers
     * @param {*} line 
     * @returns 
     */
    const isOpenersHeaderLine=(line)=>{
        return isSpecialHeaderLineBase(line, "# openers", false);
    };


    /**
     * 判断一行是否为整个引用部分的分隔符行，即：***
     */
    const isRefPartSplitLine=(line)=>{
        return isSpecialHeaderLineBase(line, "***", false);
    };



    /**
     * 判断一行是否为特殊标题行（引用标题行、文本引用标题行、打开方式标题行）
     * @param {*} line 
     * @returns 
     */
    const isSpecialHeaderLine=(line)=>{
        return (
            isRefHeaderLine(line) || isTrefHeaderLine(line) || isOpenersHeaderLine(line)
        );
    };


    /**
     * 判断节点格式是否正确，正确的格式如下：
     * - aaa
     * \t\t- bbb
     * @param {*} txt 
     * @returns 格式正确返回节点层级，格式错误返回false
     */
    const isNodeFmtCorrect=(txt)=>(/^[\t]*[-] [^ ].*$/.test(txt) ? txt.indexOf("- ") : false);


    /**
     * 判断是否是正确的opener格式，正在的格式如下：
     * [xx]: d:\a\b\cc.exe
     * @param {*} txt 
     * @returns 格式正确返回opener名称，错误返回false
     */
    const isOpenerFmtCorrect=(txt)=>{
        const match=/^\[([^\[\]]+)\][:].+$/.exec(txt.trim());
        if(match && match[1]){
            return match[1].trim();
        }
        return false;
    };


    /**
     * 从节点行中抽取所有特殊名称：引用、文本引用、打开方式等
     * @param {*} str 
     * @returns [
     *  {type:'ref',    name:'ref:xx'},
     *  {type:'tref',   name:'tref:yy'},
     *  {type:'opener', name:'abc'},
     * ]
     */
    const getAllSpecialNames=(str)=>{
        str=str.trim();
        if(str.startsWith("- ")){
            str=str.substring(2).trim();
        }
        const openerReg=/^.+openby[:][/][/].+[@][@](.+?)[)]$/;
        const refStartSymbolLen="ref:".length;
        const trefStartSymbolLen="tref:".length;
        return str.split("|").map(each=>each.trim()).map(each=>{
            if(each.startsWith("ref:") && each.length>refStartSymbolLen){
                return {
                    type: 'ref',
                    name: each,
                };
            }
            if(each.startsWith("tref:") && each.length>trefStartSymbolLen){
                return {
                    type: 'tref',
                    name: each,
                };
            }
            const matches=openerReg.exec(each);
            if(matches && matches[1]){
                return {
                    type: 'opener',
                    name: matches[1].trim(),
                };
            }
            return null;
        }).filter(each=>null!==each);
    };


    /**
     * 从字符串中抽取出指定位置所在的引用名称部分（ref:xx）并返回，如果在指定位置未找到引用名称则返回null
     * - aaa|ref:xx|ref:yy|bbb    --> 字符串
     *        ^                   --> 指定位置      
     */
    const getRefName=(str, ind)=>{
        // 如果光标位置在正文之前，则返回null，否则把正文前的标识去掉，并把指定位置相应前移
        if(str.trim().startsWith("- ")){
            const contInd=str.indexOf("- ")+2;
            if(ind<contInd){
                return null;
            }
            str=str.substring(contInd);
            ind-=contInd;
        }

        const len=str.length;
        let from=0;
        let to=len;
        
        for(let i=0; i<len; ++i){
            if('|'===str[i]){
                if(i+1>from && i<ind && i+1<=len){
                    from=i+1;
                }
                if(i<to && i>=ind){
                    to=i;
                }
            }
        }

        const part=str.substring(from, to).trim();
        if(part.startsWith("ref:") && part.length>"ref:".length){
            return part;
        }
        if(part.startsWith("tref:") && part.length>"tref:".length){
            return part;
        }
        return null;
    };


    /**
     * 获取打开方式对应的行的对象类型
     * @param {*} lines 
     * @returns {
     *  header: {
     *      ind: 5,
     *      txt: '# openers',
     *  },
     *  conts: [
     *      {
     *          ind: 6,
     *          txt: '[nt]: notepad',
     *          openerName: 'nt',
     *      }
     *  ]
     * }
     */
    const getOpenerLines=(lines)=>{
        let result=null;
        const len=lines.length;
        for(let i=0;i<len;++i){
            const line=lines[i];
            const lineTrim=line.trim();

            // 第一次发现标题头，初始化结果对象
            if(null===result && isOpenersHeaderLine(line)){
                result={
                    header:{
                        ind: i,
                        txt: lineTrim,
                    },
                    conts: [],
                };
                continue;
            }

            // 已有结果对象
            if(null!=result){
                // 遇到特殊标题头则结束
                if(isSpecialHeaderLine(line)){
                    break;
                }
                // 遇到指定格式的行，保存起来：[nt]: d:\a\b\c.exe
                const match=/^\[([^\[\]]+)\][:].+$/.exec(lineTrim);
                if(match && match[1]){
                    result.conts.push({
                        ind: i,
                        txt: line,
                        openerName: match[1].trim(),
                    });
                }
            }
        }
        return result;
    };


    /**
     * 
     * @param {*} lines 
     * @param {*} lineInds 
     * @returns [
     *  {
     *      ind: 3,
     *      txt: '- aa',
     *  }
     * ]
     */
    const getOtherNodeLines=(lines, lineInds)=>{
        const result=[];
        const len=lines.length;
        for(let i=0;i<len;++i){
            if(!lineInds.includes(i)){
                result.push({
                    ind: i,
                    txt: lines[i],
                });
            }
        }
        return result;
    };


    /**
     * 分析文档的结构（只加载格式有效的数据）
     * @param {*} lines 
     * @returns {
     *      nodes:[
     *          {ind:0, txt:'- txt', lev:0}
     *      ],
     *      splitLineInd: 3,
     *      hasRefPart: true,
     *      openers:{
     *          header: {ind:5, txt:'# openers',},
     *          conts: [
     *              {ind:6, txt:'[nt]: notepad', openerName:'nt',}
     *          ]
     *      }
     *      refs:[
     *          {
     *              header:{ind:10, txt:'# ref:aa', name:'ref:aa'},
     *              conts: [
     *                  {ind:6, txt:'hahaha',}
     *              ]
     *          }
     *      ],
     *      trefs:[
     *          {
     *              header:{ind:10, txt:'# tref:bb', name:'tref:bb'},
     *              conts: [
     *                  {ind:6, txt:'hahaha',}
     *              ]
     *          }
     *      ],
     * }
     */
    const analyzeDoc=(lines)=>{
        const result={
            nodes:          [],
            splitLineInd:   -1,
            hasRefPart:     false,
            openers:        null,
            refs:           [],
            trefs:          [],
        };
        let currSpecialItem={};
        let arriveRefPart=false;
        const len=lines.length;
        let ignoreCont=true;

        for(let i=0;i<len;++i){
            const line=lines[i];
            const lineTrim=line.trim();
            if(false===arriveRefPart && isRefPartSplitLine(line)){
                arriveRefPart=true;
                result.splitLineInd=i;
                result.hasRefPart=true;
            }

            //---------节点部分------------------
            // 只记录格式正确的节点
            if(!arriveRefPart){
                const lev=isNodeFmtCorrect(line);
                if(false!==lev){
                    result.nodes.push({
                        ind: i, 
                        txt: line, 
                        lev
                    });
                }
                continue;
            }

            //---------引用部分------------------
            // 是特殊标题
            if(isSpecialHeaderLine(line)){
                if(!result.openers && isOpenersHeaderLine(line)){
                    result.openers={
                        header: {ind:i, txt:'# openers',},
                        conts:[],
                    };
                    currSpecialItem={
                        type: 'opener',
                    };
                    ignoreCont=false;
                    continue;
                }
                if(result.openers && isOpenersHeaderLine(line)){
                    ignoreCont=true;
                    continue;
                }
                if(isRefHeaderLine(line)){
                    const tmp={
                        header:{ind:i, txt:line, name:lineTrim.substring(2)},
                        conts: []
                    };
                    result.refs.push(tmp);
                    currSpecialItem={
                        type: 'ref',
                        items: tmp.conts,
                    };
                    ignoreCont=false;
                    continue;
                }
                if(isTrefHeaderLine(line)){
                    const tmp={
                        header:{ind:i, txt:line, name:lineTrim.substring(2)},
                        conts: []
                    };
                    result.trefs.push(tmp);
                    currSpecialItem={
                        type: 'tref',
                        items: tmp.conts,
                    };
                    ignoreCont=false;
                    continue;
                }
                continue;
            }
            // 是内容部分
            if(!ignoreCont){
                if('opener'===currSpecialItem.type){
                    const openerName=isOpenerFmtCorrect(lineTrim);
                    if(false!==openerName){
                        result.openers.conts.push({
                            ind: i,
                            txt: line,
                            openerName,
                        });
                    }
                }
                if('ref'===currSpecialItem.type){
                    currSpecialItem.items.push({
                        ind: i, 
                        txt: line,
                    });
                }
                if('tref'===currSpecialItem.type){
                    currSpecialItem.items.push({
                        ind: i, 
                        txt: line,
                    });
                }
            }
        }
        return result;
    };




    // ------------------------------- 其他方法：涉及codemirror对象的操作 ------------------------------------------------------
    const getAllLines=(cm)=>{
        const lines=[];
        const lineCnt=cm.doc.lineCount();
        for(let i=0; i<lineCnt; ++i){
            lines.push(cm.doc.getLine(i));
        }
        return lines;
    };


    /**
     * 自动创建指定名称的引用或文本引用：
     * 如果存在分隔行，则在分隔行下一行创建；
     * 否则在最后一行之后创建分隔行和引用内容
     * @param {*} name ref:xx 或 tref:xx
     * @param {*} cm 
     * @param {*} doc 
     */
    const createRefOrTref=(name, cm, doc)=>{
        let cursor=null;
        // 存在分隔行，在行尾插入
        if(doc.hasRefPart){
            cursor={
                line:   doc.splitLineInd,
                ch:     cm.doc.getLine(doc.splitLineInd).length,
            };
            cm.doc.replaceRange(`\n# ${name}\n\n`, cursor, cursor);    
            gotoLine(cm, doc.splitLineInd+1, doc.splitLineInd+2);
            return;
        }

        // 不存在分隔行，在末行尾插入
        const lastLineInd=cm.doc.lineCount()-1;
        cursor={
            line:   lastLineInd,
            ch:     cm.doc.getLine(lastLineInd).length,
        };
        cm.doc.replaceRange(`\n\n***\n# ${name}\n\n`, cursor, cursor);
        gotoLine(cm, doc.splitLineInd+3, doc.splitLineInd+4);
    };



    /**
     * 是否处于自动完成字符的位置，如下所示两个位置：
     * aaaaa{d}xxx   -->字符
     *        ^^     -->光标
     * @param {*} str 
     * @param {*} lineInd 
     * @param {*} ind 
     * @returns 
     */
    const isDateAutoCompleteSymbol=(str, lineInd, ind)=>{
        if(ind<=0){
            return false;
        }
        const reg=/^.*([{]d(([+-])([0-9]+))?[}])$/;
        let tmp=str.substring(0,ind);
        let match=reg.exec(tmp);
        let endInd=ind;
        if(!match){
            if(ind+1>str.length){
                return false;
            }
            tmp=str.substring(0,ind+1);
            match=reg.exec(tmp);
            console.log(tmp, match);
            if(!match){
                return false;
            }
            endInd=ind+1;
        }
        const placeHolderLen= match[1].length;
        let addDays=0;
        if('+'===match[3]){
            addDays=parseInt(match[4]);
        }else if('-'===match[3]){
            addDays=0-parseInt(match[4]);
        }
        return {
            line: lineInd,
            start: tmp.length-placeHolderLen,
            end: endInd,
            addDays
        };
    };

    const replaceDate=(cm, autoCompletePos)=>{
        const date=new Date(new Date().getTime()+86400000*autoCompletePos.addDays);
        const resultDate=toDateFmt(date);
        //console.log('resultDate',resultDate);
        cm.doc.replaceRange(resultDate, {line: autoCompletePos.line, ch: autoCompletePos.start}, {line: autoCompletePos.line, ch: autoCompletePos.end});
    };

    const toDateFmt=(date)=>{
        const m=date.getMonth()+1;
        const d=date.getDate();
        const weekday=['日','一','二','三','四','五','六'][date.getDay()];
        const resultDate=""+(new Date().getFullYear()-2000)+"."+(m<10?"0":"")+m+"."+(d<10?"0":"")+d+" "+weekday;
        return resultDate;
    };



    /**
     * 跳到当前光标位置对应的ref:xx或tref:xx的定义处，如果没有找到定义，则自动创建。
     * 如果当前光标不在有效的节点处，或当前位置不存在ref:xx或tref:xx，则不做操作。
     * 如果最终完成了位置跳转，则阻止事件冒泡，否则不拦截。
     * @param {*} cm 
     * @param {*} event 
     */
    const gotoDefinition=(cm, event)=>{
        const pos=cm.doc.getCursor();// { ch: 3  line: 0}
        const line=cm.doc.getLine(pos.line);

        // 自动完成的处理
        const autoCompletePos=isDateAutoCompleteSymbol(line, pos.line, pos.ch);
        if(false!==autoCompletePos){
            event.preventDefault();
            replaceDate(cm, autoCompletePos);
            return;
        }

        // 跳转到引用的处理
        const doc=analyzeDoc(getAllLines(cm));
        if(!doc.nodes.some(nd=>pos.line===nd.ind)){
            return null;
        }
        const name=getRefName(line, pos.ch);
        if(null===name){
            return;
        }

        event.preventDefault();
        if(name.startsWith("ref:")){
            let exists=false;
            doc.refs.filter(ref=>ref.header.name===name).filter((_unused, ind)=>0===ind).forEach(ref=>{
                gotoLine(cm, ref.header.ind, 0<ref.conts.length ? ref.conts[0].ind: ref.header.ind);
                exists=true;
            });
            if(!exists){
                createRefOrTref(name, cm, doc);
            }
            return;
        }
        if(name.startsWith("tref:")){
            let exists=false;
            doc.trefs.filter(tref=>tref.header.name===name).filter((_unused, ind)=>0===ind).forEach(tref=>{
                gotoLine(cm, tref.header.ind, 0<tref.conts.length ? tref.conts[0].ind: tref.header.ind);
                exists=true;
            });
            if(!exists){
                createRefOrTref(name, cm, doc);
            }
            return;
        }
    };



    const getSelfAndSubNodes=()=>{

    };


    /**
     * 剪切节点
     * @param {*} cm
     * @param {*} reserveStubNode 是否保留一个占位节点
     */
    const cutNode=(cm, reserveStubNode=false)=>{
        const allLines=getAllLines(cm);
        const doc=analyzeDoc(allLines);
        const pos=cm.doc.getCursor();// {ch: 3  line: 0}
        let selfNd=null;
        const nds=[];
        // doc.nodes.forEach(nd=>{
        //     if(nd.ind===pos.line){
        //         selfNd=nd;
        //         nds.push(nd);
        //         return;
        //     }
        //     if(null!=selfNd){
        //         if(nd.lev>selfNd.lev){

        //         }
        //     }
        // });
    };


    /**
     * 获得特殊部分的文本信息
     * @param {*} names [
     *  {type:'ref',    name:'ref:xx'},
     *  {type:'tref',   name:'tref:yy'},
     *  {type:'opener', name:'abc'},
     * ]
     */
    const getSpecialTxts=(cm, names, nodeLineInds)=>{
        const lineCnt=cm.doc.lineCount();
        const otherNodeLines=getOtherNodeLineTxts(cm, nodeLineInds);
        console.log("otherNodeLines",otherNodeLines);
        const invalidLineInds=[];
        const openerTxts=[];
        const openers=names.filter(name=>'opener'===name.type).map(name=>name.name);
        if(0<openers.length){
            let headerLineInd=-1;
            for(let i=0; i<lineCnt; ++i){
                const line=cm.doc.getLine(i).trim();
                if(isOpenersHeaderLine(line)){
                    headerLineInd=i;
                    break;
                }
            }
            if(-1!==headerLineInd){          
                for(let i=headerLineInd+1; i<lineCnt; ++i){
                    const line=cm.doc.getLine(i).trim();
                    let valid=openers.some(opener=>line.startsWith(`[${opener}]:`));
                    if(valid){
                        openerTxts.push(line);
                        const currOpenerName=line.substring(1, line.indexOf("]"));
                        const otherNodeUsed= otherNodeLines.some(otherLine=>otherLine.includes(`@@${currOpenerName})`));
                        if(!otherNodeUsed){
                            invalidLineInds.push(i);
                        }
                    }
                }
            }
        }

        const refAndTrefTxts=[];
        const refAndTrefNmaes=names.filter(name=>'ref'===name.type || 'tref'===name.type).map(name=>name.name);
        if(0<refAndTrefNmaes.length){
            let valid=false;
            for(let i=0; i<lineCnt; ++i){
                const line=cm.doc.getLine(i);
                const lineTrim=line.trim();
                if(isSpecialHeaderLine(lineTrim)){
                    valid=refAndTrefNmaes.some(name=>"# "+name===lineTrim);
                    if(valid){
                        refAndTrefTxts.push(line);
                    }
                    continue;
                }
                if(valid){
                    refAndTrefTxts.push(line);
                }
            }
        }




        let result="";
        if(0<openerTxts.length){
            result+="# openers\n"+openerTxts.join("\n")+"\n\n";
        }
        result+=refAndTrefTxts.join("\n")+"\n\n";
        

        console.log("invalidLineInds", invalidLineInds);
        return result;
    };


    /**
     * 获得特殊部分所涉及到的行号，用于剪切走这些行，如果其他节点中还有对这些部分的引用，则排除这些行号
     * @param {*} cm 
     * @param {*} names 
     */
    const getSpecialLineInds=(cm, names)=>{

    };


    /**
     * 从指定节点行中抽取所有特殊名称并排重：引用、文本引用、打开方式等
     * @param {*} cm 
     * @param {*} inds 
     * @returns 
     */
    const getSpecialNamesByNodeLineInds=(cm, inds)=>{
        let names=[];
        inds.forEach(ind=>{
            const newNames=getAllSpecialNames(cm.doc.getLine(ind));
            newNames.forEach(item=>{
                const exists=names.some(item2=>(item.type===item2.type && item.name===item2.name));
                if(!exists){
                    names.push(item);
                }
            });
        });
        return names;
    };

    /**
     * 获取指定行号之外的节点的文本信息集合
     * @param {*} cm 
     * @param {*} lineInds 
     */
    const getOtherNodeLineTxts=(cm, lineInds)=>{
        const txts=[];
        const lineCnt=cm.doc.lineCount();
        const refPartSplitLineInd=getRefPartSplitLineInd(cm);
        for(let i=0; i<lineCnt; ++i){
            const line=cm.doc.getLine(i);
            const isNode=(line.trim().startsWith("- ") && (-1===refPartSplitLineInd || (-1!==refPartSplitLineInd && i<refPartSplitLineInd)));
            if(isNode && !lineInds.includes(i)){
                txts.push(line);
            }
        }
        return txts;
    };

    /**
     * 获得当前行表示的节点及其所有子节点的行号集合
     * @param {*} cm
     * @param {*} startLineInd 
     */
    const getSelfAndSubNodeLineInds=(cm, startLineInd)=>{
        const result=[];
        const lineCnt=cm.doc.lineCount();
        const refPartSplitLineInd=getRefPartSplitLineInd(cm);
        let startLev=-1;
        for(let i=startLineInd; i<lineCnt; ++i){
            const line=cm.doc.getLine(i);
            const isNode=(line.trim().startsWith("- ") && (-1===refPartSplitLineInd || (-1!==refPartSplitLineInd && i<refPartSplitLineInd)));
            if(!isNode){
                break;
            }
            const nodeLev=line.indexOf("- ");
            if(-1===startLev){
                startLev=nodeLev;
                result.push(i);
                continue;
            }
            if(nodeLev>startLev){
                result.push(i);
                continue;
            }
            break;
        }
        return result;
    };


    /**
     * 获得引用部分分隔行的索引（即***行），如果不存在则返回-1
     * @param {*} cm 
     */
    const getRefPartSplitLineInd=(cm)=>{
        const lineCnt=cm.doc.lineCount();
        for(let i=0;i<lineCnt;++i){
            if('***'===cm.doc.getLine(i).trim()){
                return i;
            }
        }
        return -1;
    };


    /**
     * 检查指定行是否在节点部分：满足节点格式并且在引用部分之前，若无引用部分则可忽略该条件
     * 节点格式如：[tab][tab]...- abc
     */
    const isInNodePart=(lineInd, line, cm)=>{
        let refPartLineInd=getRefPartSplitLineInd(cm);
        return line.trim().startsWith("- ") && (-1===refPartLineInd || (-1!==refPartLineInd && lineInd<refPartLineInd))
    };


    /**
     * 读取所有引用名称及对应的行号：
     * 如果有下一行且下一行不是特殊标题行，则行号定在下一行；否则定在当前行
     * @param {*} cm 
     * @returns [
     *  {
     *      name:           "ref:xxx",
     *      headLineInd:    13, // 引用标题行索引
     *      contentLineInd: 14, // 引用正文行索引
     *  }
     * ]
     */
    const loadAllRefNames=(cm)=>{
        const doc=analyzeDoc(getAllLines(cm));
        return doc.refs.map(ref=>({
            name:           ref.header.name,
            headLineInd:    ref.header.ind,
            contentLineInd: ref.conts.length>0 ? ref.conts[0].ind : ref.header.ind
        }));
    };

    const loadAllTrefNames=(cm)=>{
        const doc=analyzeDoc(getAllLines(cm));
        return doc.trefs.map(tref=>({
            name:           tref.header.name,
            headLineInd:    tref.header.ind,
            contentLineInd: tref.conts.length>0 ? tref.conts[0].ind : tref.header.ind
        }));
    };


    /**
     * 如果引用部分不存在则创建，并返回引用部分起始行号（即***下面一行）
     * @param {*} cm 
     * @returns 
     */
    const createRefPart=(cm)=>{
        // 找分隔行***
        let refSplitLine=null;
        const lineCnt=cm.doc.lineCount();
        for(let i=0;i<lineCnt;++i){
            const currLine=cm.doc.getLine(i);
            if('***'===currLine.trim()){
                refSplitLine={
                    ind: i,
                    txt: currLine,
                    len: currLine.length,
                };
                break;
            }
        }

        // 找到分隔行，即***
        // 如果分隔行下面还有内容，则返回分隔行下一行索引；否则在分隔行下面创建一个空行，并返回分隔行下一行索引
        if(refSplitLine){
            if(refSplitLine.ind+1<lineCnt){
                return refSplitLine.ind+1;
            }
            cm.doc.replaceRange("\n",{line:refSplitLine.ind, ch:refSplitLine.len},{line:refSplitLine.ind, ch:refSplitLine.len});
            return refSplitLine.ind+1;
        }

        // 未找到分隔行
        // 如果最后一行为空，则在最后一行下面分别创建分隔行、空行，并返回最后一个空行的索引
        // 如果最后一行不为空，则在最后一行下面分别创建空行、分隔行、空行，并返回最后一个空行的索引
        const lastLine=cm.doc.getLine(lineCnt-1);
        const lastLineLen=lastLine.length;
        const lastLineEmpty=(""===lastLine.trim());
        if(lastLineEmpty){
            cm.doc.replaceRange("\n***\n",{line:lineCnt-1, ch:lastLineLen},{line:lineCnt-1, ch:lastLineLen});
            return lineCnt+1;
        }
        cm.doc.replaceRange("\n\n***\n",{line:lineCnt-1, ch:lastLineLen},{line:lineCnt-1, ch:lastLineLen});
        return lineCnt+2;
    };


    /**
     * 导航到指定行并获取输入焦点
     * @param {*} cm 
     * @param {*} lineInd 
     */
    const gotoLine=(cm, headLineInd, contentLineInd)=>{
        cm.focus();
        cm.scrollIntoView({line:headLineInd, ch:0});
        cm.doc.setCursor({line:contentLineInd, ch:0});
    };


    /**
     * 从编辑器中查找指定名称（ref:xx）的引用部分并跳转到该位置
     */
    const findOrCreateRefAndScrollTo=(cm, refName)=>{
        const refPartStartPos=createRefPart(cm);
        const lineCnt=cm.doc.lineCount();  

        let refHeadLineInd=-1;
        let refContentLineInd=-1;
        for(let i=refPartStartPos;i<lineCnt;++i){
            if("# "+refName === cm.doc.getLine(i).trim()){
                refHeadLineInd=i;
                refContentLineInd=i;
                if(i+1<lineCnt){
                    const nextLine=cm.doc.getLine(i+1).trim();
                    const nextLineIsSpecialHeader=isSpecialHeaderLine(nextLine);
                    if(!nextLineIsSpecialHeader){
                        refContentLineInd=i+1;
                    }
                }
                break;
            }
        }

        // 找到指定引用部分，直接跳转到该位置
        if(-1!==refHeadLineInd){
            gotoLine(cm, refHeadLineInd, refContentLineInd);
            return;
        }

        // 未找到指定引用部分，在引用部分的开头创建并跳转
        cm.doc.replaceRange(`# ${refName}\n\n\n`,{line:refPartStartPos, ch:0},{line:refPartStartPos, ch:0});
        gotoLine(cm, refPartStartPos, refPartStartPos+1);
        return true;
    }


    /**
     * 向下或向上复制当前行内容
     * @param {*} cm 
     * @param {*} downDirection 
     * @returns 
     */
    const copyLine=(cm, downDirection=true)=>{
        const pos=cm.doc.getCursor();// { ch: 3  line: 0}
        const lineTxt=cm.doc.getLine(pos.line);
        const len=lineTxt.length;
    
        // 向下复制，直接创建新行
        if(downDirection){
            const newData=lineTxt+"\n"+lineTxt;
            cm.doc.replaceRange(newData, {line: pos.line, ch: 0}, {line: pos.line, ch: len});
            cm.doc.setCursor({line:pos.line+1, ch:pos.ch});
            return;
        }
    
        // 向上复制
        // 如果有前一行且前一行为空行，则把前一行替换
        if(pos.line>0){
            const preLineTxt=cm.doc.getLine(pos.line-1);
            if(""===preLineTxt.trim()){
                const preLineLen=preLineTxt.length;
                cm.doc.replaceRange(lineTxt, {line: pos.line-1, ch: 0}, {line: pos.line-1, ch: preLineLen});
                cm.doc.setCursor({line:pos.line-1, ch:pos.ch});
                return;
            }
        }
        // 否则把当前行向下复制一行，且光标停在当前行
        const newData=lineTxt+"\n"+lineTxt;
        cm.doc.replaceRange(newData, {line: pos.line, ch: 0}, {line: pos.line, ch: len});
        cm.doc.setCursor({line:pos.line, ch:pos.ch});
    };

    return {
        gotoDefinition,
        loadAllRefNames,
        loadAllTrefNames,
        gotoLine,
        toDateFmt,
        copyLine,
    };
})();

export default editorSvcExInstWrapper;