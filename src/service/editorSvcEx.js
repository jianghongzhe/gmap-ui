import editorSvc from "./editorSvc";

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
        if(part.startsWith("toid:") && part.length>"toid:".length){
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



    

    const toDateFmt=(date)=>{
        const m=date.getMonth()+1;
        const d=date.getDate();
        const weekday=['日','一','二','三','四','五','六'][date.getDay()];
        const resultDate=""+(new Date().getFullYear()-2000)+"."+(m<10?"0":"")+m+"."+(d<10?"0":"")+d+" "+weekday;
        return resultDate;
    };

    const toTimeFmt=(date)=>{
        const [h,m,s]=[date.getHours(), date.getMinutes(), date.getSeconds()];
        return `${h<10?"0"+h:""+h}:${m<10?"0"+m:""+m}:${s<10?"0"+s:""+s}`;
    }


    


    /**
     * 获得当前光标处所在的自动完成表达式 {xxx}，如果找到返回json对象，否则返回false
     * @param {*} line 该行内容
     * @param {*} pos  光标在行中的位置
     * @returns {
     *  
     * }
     */
    const getBraceAutoCompletePart=(line, pos)=>{
        // 光标处在 } 的后面
        if(pos>0 && '}'===line[pos-1]){
            let tmp=line.substring(0, pos-1);
            let ind=tmp.lastIndexOf("{");
            if(ind>=0 && pos-ind>2){
                if(''!==line.substring(ind+1, pos-1).trim()){
                    return {
                        exp: line.substring(ind, pos),
                        range: [ind, pos],
                    };
                }
            }
            return false;
        }

        // 找光标后面最近的 } 和它左边最近的 {，以及光标在它们之间的情况
        let ind2=line.indexOf("}", pos);
        if(ind2>=0){
            let tmp=line.substring(0,ind2);
            let ind1=tmp.lastIndexOf("{");
            if(ind1>=0 && ind2-ind1>=2 && ind1<pos && pos<=ind2){
                if(''!==line.substring(ind1+1, ind2).trim()){
                    return {
                        exp: line.substring(ind1, ind2+1),
                        range: [ind1, ind2+1],
                    };
                }
            }
        }
        return false;
    };


    const getFirstGeneralTxt=(line)=>{
        const fixVals=['right:','zip:','r','t'];
        const prefixs=["id:","toid:","ref:","tref:","c:","m:","p:","d:"];
        const regs=[/^\[.*?\]\(.+?\)$/];
    
        line=line.trim();
        const generalTxts=(line.startsWith("- ") ? line.substring(2) : line).split(/(?<![\\])[|]/g)
                .map(item=>item.replace(/[\\][|]/g, '|'))
                .filter(item=>null!=item && ""!==item.trim())
                .map(item=>item.trim())
                .filter(item=>{
            for(let fixVal of fixVals){
                if (fixVal === item) {
                    return false;
                }
            }
            for(let prefix of prefixs){
                if (item.startsWith(prefix) && item.length > prefix.length) {
                    return false;
                }
            }
            for(let reg of regs){
                if (reg.test(item)) {
                    return false;
                }
            }
            return true;
        });
        return (generalTxts.length>0 ? generalTxts[0] : false);
    };


    /**
     * 跳到当前光标位置对应的ref:xx或tref:xx的定义处，如果没有找到定义，则自动创建。
     * 如果当前光标不在有效的节点处，或当前位置不存在ref:xx或tref:xx，则不做操作。
     * 如果最终完成了位置跳转，则阻止事件冒泡，否则不拦截。
     * @param {*} cm 
     * @param {*} event 
     */
    const gotoDefinition=(cm, event,api, currAssetsDir)=>{
        const pos=cm.doc.getCursor();// { ch: 3  line: 0}
        const line=cm.doc.getLine(pos.line);

        // // 输入固定字符的处理
        // // 输入[按tab会生成[链接]()，输入!按tab会生成![图片]()
        // if(0<pos.ch && '['===line[pos.ch-1]){
        //     event.preventDefault();
        //     cm.doc.replaceRange("[链接]()", {line: pos.line, ch: pos.ch-1}, {line: pos.line, ch: pos.ch});
        //     cm.doc.setCursor({line:pos.line, ch:pos.ch+4});
        //     return;
        // }
        // if(0<pos.ch && '!'===line[pos.ch-1]){
        //     event.preventDefault();
        //     cm.doc.replaceRange("![图片]()", {line: pos.line, ch: pos.ch-1}, {line: pos.line, ch: pos.ch});
        //     cm.doc.setCursor({line:pos.line, ch:pos.ch+5});
        //     return;
        // }
        // // [f -> [](file:///)
        // if(pos.ch>=2 && '[f'===line.substring(pos.ch-2,pos.ch)){
        //     event.preventDefault();
        //     const txt="[](file:///)";
        //     cm.doc.replaceRange(txt, {line: pos.line, ch: pos.ch-2}, {line: pos.line, ch: pos.ch});
        //     cm.doc.setCursor({line:pos.line, ch:pos.ch-2+txt.length-1});
        //     return;
        // }
        // // |t -> |tref:qqxx
        // // |r -> |ref:mmnn
        // if(pos.ch===line.length && (line.endsWith("|t") || line.endsWith("|r"))){
        //     const name=getFirstGeneralTxt(line);
        //     if(false===name){
        //         return;
        //     }
        //     event.preventDefault();
        //     const txt=(line.endsWith("|t") ? "ref" : "ef")+":"+name;
        //     cm.doc.replaceRange(txt, {line: pos.line, ch: pos.ch}, {line: pos.line, ch: pos.ch});
        //     cm.doc.setCursor({line:pos.line, ch:pos.ch+txt.length});
        //     return;
        // }


        // 输入大符号的表达式的处理
        // {t}、{dt}、{p}、{a}、{p+}、{a+}、{d}、{d+3}、{d-2}
        const autoCompletePart=getBraceAutoCompletePart(line, pos.ch);
        if(false!==autoCompletePart){
            const {exp, range}=autoCompletePart;
            
            // if("{t}"===exp){
            //     event.preventDefault();
            //     const txt=toTimeFmt(new Date());
            //     cm.doc.replaceRange(txt, {line: pos.line, ch: range[0]}, {line: pos.line, ch: range[1]});
            //     cm.doc.setCursor({line:pos.line, ch:range[0]+txt.length});
            //     return;
            // }
            // if("{dt}"===exp){
            //     event.preventDefault();
            //     const date=new Date();
            //     const txt=toDateFmt(date)+" "+toTimeFmt(date);
            //     cm.doc.replaceRange(txt, {line: pos.line, ch: range[0]}, {line: pos.line, ch: range[1]});
            //     cm.doc.setCursor({line:pos.line, ch:range[0]+txt.length});
            //     return;
            // }
            // if("{u}"===exp){
            //     event.preventDefault();
            //     (async()=>{
            //         let resp=await api.getUrlFromClipboard();
            //         if(resp){
            //             if(true===resp.succ){
            //                 const replTxt=`[${resp.data.title}](${resp.data.url})`;
            //                 cm.doc.replaceRange(replTxt, {line: pos.line, ch: range[0]}, {line: pos.line, ch: range[1]});
            //                 cm.doc.setCursor({line:pos.line, ch:range[0]+replTxt.length});
            //             }else{
            //                 api.showNotification("操作有误",resp.msg,"err");
            //             }
            //         }
            //     })();
            //     return;
            // }
            // if("{p}"===exp){
            //     event.preventDefault();
            //     (async()=>{
            //         let resp=await api.saveFileFromClipboard({img:true, saveDir:currAssetsDir, saveToPicHost:false});
            //         if(resp){
            //             if(true===resp.succ){
            //                 const replTxt=`![](assets/${resp.data.filename})`;
            //                 cm.doc.replaceRange(replTxt, {line: pos.line, ch: range[0]}, {line: pos.line, ch: range[1]});
            //                 cm.doc.setCursor({line:pos.line, ch:range[0]+replTxt.length});
            //             }else{
            //                 api.showNotification("操作有误",resp.msg,"err");
            //             }
            //         }
            //     })();
            //     return;
            // }
            // if("{a}"===exp){
            //     event.preventDefault();
            //     (async()=>{
            //         let resp=await api.saveFileFromClipboard({img:false, saveDir:currAssetsDir, saveToPicHost:false});
            //         if(resp){
            //             if(true===resp.succ){
            //                 const replTxt=`[${resp.data.title}](assets/${resp.data.filename})`;
            //                 cm.doc.replaceRange(replTxt, {line: pos.line, ch: range[0]}, {line: pos.line, ch: range[1]});
            //                 cm.doc.setCursor({line:pos.line, ch:range[0]+replTxt.length});
            //             }else{
            //                 api.showNotification("操作有误",resp.msg,"err");
            //             }
            //         }
            //     })();
            //     return;
            // }
            // if("{p+}"===exp){
            //     event.preventDefault();
            //     (async()=>{
            //         let resp=await api.saveFileFromClipboard({img:true, saveDir:currAssetsDir, saveToPicHost:true});
            //         if(resp){
            //             if(true===resp.succ){
            //                 const replTxt=`![](${resp.data.url})`;
            //                 cm.doc.replaceRange(replTxt, {line: pos.line, ch: range[0]}, {line: pos.line, ch: range[1]});
            //                 cm.doc.setCursor({line:pos.line, ch:range[0]+replTxt.length});
            //             }else{
            //                 api.showNotification("操作有误",resp.msg,"err");
            //             }
            //         }else{
            //
            //         }
            //     })();
            //     return;
            // }
            // if("{a+}"===exp){
            //     event.preventDefault();
            //     (async()=>{
            //         let resp=await api.saveFileFromClipboard({img:false, saveDir:currAssetsDir, saveToPicHost:true});
            //         if(resp){
            //             if(true===resp.succ){
            //                 const replTxt=`[${resp.data.title}](${resp.data.url})`;
            //                 cm.doc.replaceRange(replTxt, {line: pos.line, ch: range[0]}, {line: pos.line, ch: range[1]});
            //                 cm.doc.setCursor({line:pos.line, ch:range[0]+replTxt.length});
            //             }else{
            //                 api.showNotification("操作有误",resp.msg,"err");
            //             }
            //         }
            //     })();
            //     return;
            // }
            
            // {d}、{d+3}、{d-5}
            const dateReg=/^[{]d(([+-])([0-9]+))?[}]$/;
            const match=dateReg.exec(exp);
            if(match){
                event.preventDefault();
                let addDays=0;
                if('+'===match[2]){
                    addDays=parseInt(match[3]);
                }
                if('-'===match[2]){
                    addDays=0-parseInt(match[3]);
                }
                const date=new Date(new Date().getTime()+86400000*addDays);
                const txt=toDateFmt(date);
                cm.doc.replaceRange(txt, {line: pos.line, ch: range[0]}, {line: pos.line, ch: range[1]});
                cm.doc.setCursor({line:pos.line, ch:range[0]+txt.length});
                return;
            }
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
        if(name.startsWith("toid:")){
            // |id:xxx|
            const exp="|"+name.substring(2).trim()+"|";
            doc.nodes.filter(nd=>{
                let txt=nd.txt.trim();
                if(txt.startsWith("- ")){
                    txt=txt.substring(2).trim();
                }
                txt="|"+txt+"|";
                return txt.includes(exp);
            }).forEach(nd=>{
                gotoLine(cm, nd.ind, nd.ind);
                cm.doc.setCursor({line:nd.ind, ch:nd.txt.length});
            });
            return;
        }
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

    const isInRefPart=(cm)=>{
        const {type,pos, pos2}= getSelectionType(cm);
        let refPartLineInd=getRefPartSplitLineInd(cm);
        if(-1===refPartLineInd){
            return false;
        }
        if(pos.line<=refPartLineInd || pos2.line<=refPartLineInd){
            return false;
        }

        let hasShortcutPart=false;
        let hasAliasPart=false;
        const len=cm.doc.lineCount();
        for(let i=refPartLineInd+1;i<len;++i){
            const eachLine=cm.doc.getLine(i).trim();
            if('# shortcuts'===eachLine){
                hasShortcutPart=true;
            }
            if('# alias'===eachLine){
                hasAliasPart=true;
            }
        }
        return {
            hasShortcutPart,
            hasAliasPart,
        }
    };

    /**
     * 检查当前选中部分是否在节点部分：节点格式如：[tab][tab]...- abc
     * 选中部分只有未选中或选中同一行中的内容时才有效；
     * 只有不存在引用部分分隔符或当前选中行在分隔符之前时才有效；
     *
     */
    const isInNodePart=(cm)=>{
        const {type,pos, pos2}= getSelectionType(cm);
        if(!('cursor'===type || 'line'===type)){
            return false;
        }
        let refPartLineInd=getRefPartSplitLineInd(cm);
        if(!(-1===refPartLineInd || pos.line<refPartLineInd)){
            return false;
        }

        // 计算插入位置与填充字符
        // 插入位置在最后一个非空字符的后面，若一直未找到，则取0
        // 当插入位置前只有节点行标识时，填充字符为空格；当插入位置前不以|结尾或以\|结尾，填充字符为|；否则填充字符为空字符
        // -  ->  -_xxx
        // - abc  ->  - abc|xxx
        // - abc\|  ->  - abc\||xxx
        const currLine=cm.doc.getLine(pos.line);
        const ch2=currLine.length;
        let ch=0;
        for(let i=currLine.length-1;i>=0;--i){
            if(' '!==currLine[i] && '　'!==currLine[i] && '\t'!==currLine[i]){
                ch=i+1;
                break;
            }
        }
        const frontPart=currLine.substring(0,ch)??'';
        let fill='';
        if('-'===frontPart.trim()){
            fill=' ';
        }
        else if((''!==frontPart.trim() && !frontPart.endsWith("|")) || frontPart.endsWith("\\|")){
            fill='|';
        }
        const fixedPart={
            pos: {line:pos.line, ch},
            pos2: {line:pos.line, ch:ch2},
            fill,
        };

        // 计算节点类型：是否根节点，是否节点首行
        // 根节点的第一行
        if(currLine.startsWith("-")){
            return {
                inRoot: true,
                titleLine: true,
                ...fixedPart,
            };
        }
        // 非根节点的第一行
        else if(currLine.trim().startsWith("-")){
            return {
                inRoot: false,
                titleLine: true,
                ...fixedPart,
            };
        }
        // 其它情况：
        // 不停向上一行找，直到遇到标识符 '-' ;
        // 若一直未找到，则认为当前就是根节点；
        // 若找到，则根据标识符前是否有缩进来决定是否为根节点；
        else{
            let hasTitleLine=false;
            let titleLineRoot=false;
            let hasNotBlankLine=false;
            for(let i=pos.line-1;i>=0;--i){
                const eachLine=cm.doc.getLine(i);
                if(eachLine.trim().startsWith("-")){
                    hasTitleLine=true;
                    titleLineRoot=eachLine.startsWith("-");
                    break;
                }
            }
            for(let i=pos.line-1;i>=0;--i){
                const eachLine=cm.doc.getLine(i);
                if(''!==eachLine.trim()){
                    hasNotBlankLine=true;
                    break;
                }
            }
            return {
                inRoot: (!hasTitleLine || (hasTitleLine && titleLineRoot)),
                titleLine: hasTitleLine ? false : !hasNotBlankLine,
                ...fixedPart,
            };
        }
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

    const setColor=(cm, color, delayFocus = false)=>{
        let {line, ch} = cm.getCursor();

        // 如果已经到引用部分，则直接把颜色值插入文本中
        let refPartLineInd=getRefPartSplitLineInd(cm);
        if(refPartLineInd>=0 && line>=refPartLineInd){
            if(!color){
                return;
            }

            cm.doc.replaceRange(color, {line, ch}, {line, ch});
            cm.doc.setCursor({line, ch:ch+color.length});

            const fun=()=>{
                cm.doc.setCursor({line, ch:ch+color.length});
                cm.focus();
            };
            fun();
            if(delayFocus){
                setTimeout(fun, 500);
            }
            return;
        }

        // 否则把颜色标识插入节点行中，同时要分析文本行的格式
        let lineTxt = cm.getLine(line);
        const originLen=lineTxt.length;

        //拆分成项目符号部分和后面部分
        let resultLine=lineTxt;
        let left='';
        let regStart=/^\t*[-].*$/;
        if(regStart.test(resultLine)){
            let ind=resultLine.indexOf("-");
            left=resultLine.substring(0,ind+1)+" ";
            resultLine=resultLine.substring(ind+1).trim();
        }

        //后面部分处理，过滤掉颜色标识
        let regColor=/^c:.+$/;
        let right=resultLine.split("|").map(item=>item.trim()).filter(item=>!regColor.test(item)).join("|");

        //把项目符号、颜色（可能有）、后面部分重新拼接
        resultLine=left+(color?"c:"+color+"|":"")+right;
        cm.doc.replaceRange(resultLine, {line, ch: 0}, {line, ch: originLen});
        const focusFun=()=>{
            cm.setCursor({line, ch:resultLine.length});
            cm.setSelection({line, ch:resultLine.length});
            cm.focus();
        };
        if(!delayFocus){
            focusFun();
            return;
        }
        setTimeout(focusFun, 500);
    };

    /**
     * 设置光标所在行为指定级别的标题
     * @param {*} cm 
     * @param {*} titleLev 标题级别0-6，如果为0表示去掉标题标识符
     */
    const setTitle=(cm, titleLev)=>{
        let {line} = cm.getCursor();
        let lineTxt = cm.getLine(line);
        const len=lineTxt.length;
        const prefix=(0===titleLev?"":"#".repeat(titleLev)+" ");
        const newData=prefix+lineTxt.replace(/^[ 　\t]*[#]+ (.*)$/,"$1").trim();
        cm.doc.replaceRange(newData, {line, ch: 0}, {line, ch: len});
        cm.doc.setCursor({line, ch:newData.length});
    };




    /**
     * aa
     * xxx ![qqq]() yyy
     *        ^          -->> 光标位置
     *
     * @param cm
     * @return {boolean}
     */
    const isInImgNamePart=(cm)=>{
        const {type, pos, pos2}=getSelectionType(cm);
        if('cursor'===type){
            const line=cm.doc.getLine(pos.line);
            const frontPart=line.substring(0, pos.ch);
            const endPart=line.substring(pos.ch);
            const flag= (/^.*[!]\[[^\]]*$/.test(frontPart) && /^[^\]]*\][(][^()]*[)].*$/.test(endPart));
            if(!flag){
                return false;
            }
            return {
                pos: {
                    line: pos.line,
                    ch: frontPart.length+endPart.indexOf("]"),
                }
            };
        }
        return false;
    };

    const isInLinkNamePart=(cm)=>{
        const {type, pos, pos2}=getSelectionType(cm);
        if('cursor'===type){
            const line=cm.doc.getLine(pos.line);
            const frontPart=line.substring(0, pos.ch);
            const endPart=line.substring(pos.ch);
            const flag= (/^.*(?<![!])\[[^\]]*$/.test(frontPart) && /^[^\]]*\][(][^()]*[)].*$/.test(endPart));
            if(!flag){
                return false;
            }
            return {
                pos: {
                    line: pos.line,
                    ch: frontPart.length+endPart.indexOf("]"),
                }
            };
        }
        return false;
    };


    /**
     * aa
     * xxx ![qqq]() yyy
     *        ^          -->> 光标位置
     *
     * @param cm
     * @return {boolean}
     */
    const isInNoLinkTxtPart=(cm)=>{
        const {type, pos, pos2}=getSelectionType(cm);
        if('cursor'!==type){
            return false;
        }

        const line=cm.doc.getLine(pos.line);
        const frontPart=line.substring(0, pos.ch);
        const endPart=line.substring(pos.ch);
        // $gmap_enc{  }
        const flag= (/^.*[$]gmap[_]nolink[{][^{}]*$/.test(frontPart) && /^[^{}]*[}][$].*$/.test(endPart));
        if(!flag){
            return false;
        }
        return {
            pos: {
                line: pos.line,
                ch: frontPart.lastIndexOf("{")+1,
            },
            pos2: {
                line: pos.line,
                ch: frontPart.length+endPart.indexOf("}"),
            },
        };

    };


    const isInEncodeTxtPart=(cm)=>{
        const {type, pos, pos2}=getSelectionType(cm);
        if('cursor'!==type){
            return false;
        }

        const line=cm.doc.getLine(pos.line);
        const frontPart=line.substring(0, pos.ch);
        const endPart=line.substring(pos.ch);
        // $gmap_enc{  }
        const flag= (/^.*[$]gmap[_]enc[{][^{$}]*$/.test(frontPart) && /^[^{$}]*[}][$].*$/.test(endPart));
        if(!flag){
            return false;
        }
        return {
            pos: {
                line: pos.line,
                ch: frontPart.lastIndexOf("{")+1,
            },
            pos2: {
                line: pos.line,
                ch: frontPart.length+endPart.indexOf("}"),
            },
        };

    };





    const isInTable=(cm)=>{
        const {type, pos, pos2}=getSelectionType(cm);
        if('cursor'===type){
            const result= parseTable(cm, false);
            if(false===result){
                return false;
            }

            // 判断是否为第一个单元格，如果是，返回第一个单元格最后一个字符的位置，以便插入内容，否则返回false
            const isFirstCol=(()=>{
                const line=cm.doc.getLine(pos.line);
                const front=line.substring(0, pos.ch).trim();
                const end=line.substring(pos.ch).trim();
                if(/^[|]([^|]|[\\][|])*$/.test(front) && /^(([^|]|[\\][|])*[|])+$/.test(end)){
                    let tmp=-1;
                    for(let i=pos.ch;i<line.length;++i){
                        if('|'===line[i] && '\\'!==line[i-1]){
                            tmp=i;
                            break;
                        }
                    }
                    if(tmp<0) {
                        return false;
                    }
                    return {
                        pos: {
                            line: pos.line,
                            ch: tmp,
                        },
                    };
                }
                return false;
            })();

            return {
                ...result,
                titleLineFirstCol: (pos.line===result.fromPos.line && isFirstCol),
                dataLineFirstCol: (pos.line>=result.fromPos.line+2 && pos.line<=result.toPos.line && isFirstCol),
            };
        }
        return false;
    };



    const setBold=(cm)=>{
        wrapperOrTrimMark(cm, "**");
    };

    const setItalic=(cm)=>{
        wrapperOrTrimMark(cm, "*");
    };

    const setStrikeLine=(cm)=>{
        wrapperOrTrimMark(cm, "~~");
    };

    const setSuperscript=(cm)=>{
        wrapperOrTrimMark(cm, "^");
    };

    const setSubscript=(cm)=>{
        wrapperOrTrimMark(cm, "--");
    };

    const setEmphasize=(cm)=>{
        wrapperOrTrimMark(cm, "==");
    };

    const wrapperOrTrimMark=(cm, mark)=>{
        if(trimWrapperMark(cm, mark)){
            return;
        }
        setWrapperMark(cm,mark, mark, 0-mark.length);
    };


    /**
     * 删除当前行
     * @param cm
     */
    const delCurrLine=(cm)=>{
        const {type, pos, pos2}=getSelectionType(cm);

        // 有下一行，把选中区与下一行一起替换为下一行内容
        if(pos2.line<cm.doc.lineCount()-1){
            const nextLine=cm.doc.getLine(pos2.line+1);
            const len=nextLine.length;
            cm.doc.replaceRange(nextLine, {line:pos.line, ch:0,}, {line:pos2.line+1, ch:len});
            cm.focus();
            cm.doc.setCursor({line:pos.line, ch:len,});
            return;
        }
        // 有上一行，把上一行与选中区一起替换为上一行内容
        if(pos.line>0){
            const lastLine=cm.doc.getLine(pos.line-1);
            const len=lastLine.length;
            cm.doc.replaceRange(lastLine, {line:pos.line-1, ch:0,}, {line:pos2.line, ch:cm.doc.getLine(pos2.line).length});
            cm.focus();
            cm.doc.setCursor({line:pos.line-1, ch:len,});
            return;
        }
        // 即没上一行也没下一行，直接把选中区替换为空
        cm.doc.replaceRange('', {line:pos.line, ch:0,}, {line:pos2.line, ch:cm.doc.getLine(pos2.line).length});
        cm.focus();
        cm.doc.setCursor({line:pos.line, ch:0,});
    };

    const isSelMultiLine=(cm)=>{
        return 'multi'===getSelectionType(cm).type;
    };


    /**
     * 去掉选中部分左右的包裹，无论选中部分在包裹的内侧还是外侧，都可去掉包裹
     * 符号说明： |表示光标选中位置，**表示包裹
     * 情况1：选中部分在包裹内侧
     * mmm**|abc|**nnn -> mmmabc|nnn
     *
     * 情况2：选中部分在包裹外侧
     * mmm|**abc**|nnn -> mmmabc|nnn
     *
     * 情况3：选中部分在包裹字符之间
     * mmm*|*abc*|*nnn -> mmmabc|nnn
     *
     * 情况4：前后选中部分情况可以各不相同，本示例为前面在包裹之间后面在包裹之内
     * mmm*|*abc|**nnn -> mmmabc|nnn
     * @param cm
     * @param mark
     */
    const trimWrapperMark=(cm, mark)=>{
        const {pos, pos2}= getSelectionType(cm);
        const lineLen=cm.doc.getLine(pos2.line).length;

        let flag=false;
        let startPos=null;
        let endPos=null;
        let selContent=null;
        for(let ind1=pos.ch; ind1>=Math.max(pos.ch-mark.length,0); --ind1){
            for(let ind2=pos2.ch; ind2<=Math.min(lineLen, pos2.ch+mark.length); ++ind2){
                const tmpContent=cm.doc.getRange({line:pos.line,ch:ind1}, {line:pos2.line,ch:ind2})??'';
                if(tmpContent.length>=2*mark.length && tmpContent.startsWith(mark) && tmpContent.endsWith(mark)){
                    flag=true;
                    startPos={line:pos.line,ch:ind1};
                    endPos={line:pos2.line,ch:ind2};
                    selContent=tmpContent;
                    break;
                }
            }
        }

        if(!flag){
            return false;
        }

        if(pos.line===pos2.line){
            const replContent=selContent.substring(mark.length, selContent.length-mark.length).trim();
            cm.doc.replaceRange(replContent, startPos , endPos);
            cm.focus();
            cm.doc.setCursor({line:startPos.line, ch:startPos.ch+replContent.length,});
        }else{
            cm.doc.replaceRange("", startPos , {line:startPos.line, ch:startPos.ch+mark.length});
            cm.doc.replaceRange("", {line:endPos.line, ch:endPos.ch-mark.length}, endPos);
            cm.focus();
            cm.doc.setCursor({line:endPos.line, ch:endPos.ch-mark.length,});
        }
        return true;
    };



    /**
     *
     * @param cm
     * @return
     * {
     *     type: 'cursor/line/multi',   // cursor: 未选中内容，只取光标位置
     *                                  // line: 选中单行内容
     *                                  // multi: 选中多行内容
     *     pos,
     *     pos2,
     * }
     */
    const getSelectionType=(cm)=>{
        let pos=cm.doc.getCursor();// { ch: 3  line: 0}
        let pos2=pos;
        const selections=cm.doc.listSelections();
        if(0<selections.length){
            [pos, pos2]=sortCursor(selections[0].anchor, selections[0].head);
        }
        if(pos.line===pos2.line && pos.ch===pos2.ch){
            return {
                type: 'cursor',
                pos,
                pos2,
            };
        }
        if(pos.line===pos2.line){
            return {
                type: 'line',
                pos,
                pos2,
            };
        }
        return {
            type: 'multi',
            pos,
            pos2,
        };
    };

    /**
     * 在选中区域包裹指定内容
     * @param cm
     * @param beginMark 前半段内容
     * @param endMark 后半段内容
     * @param cursorOffset 包裹后光标位置：非负数为从替换的起始位置向后偏移；负数为从替换后的结束位置向前偏移
     */
    const setWrapperMark=(cm, beginMark, endMark, cursorOffset=null)=>{
        if('number'!==typeof(cursorOffset)){
            console.log("cursorOffset不支持数字以外的类型");
        }

        // 选中区域计算
        // 当没有选中区域时，取光标位置当作起始和结束区域
        // 有选中区域时，取第一个选中区域的开头与结束的位置作为起始和结束区域，同时要考虑从后向前选的情况
        let pos=cm.doc.getCursor();// { ch: 3  line: 0}
        let pos2=pos;
        const selections=cm.doc.listSelections();
        if(0<selections.length){
            [pos, pos2]=sortCursor(selections[0].anchor, selections[0].head);
        }

        let line=0;
        let ch=0;

        // 如果选中区为单行内容，则直接替换处理
        // 如果为多行，则在开头行和最后行分别加入包裹标记
        if(pos.line===pos2.line){
            const originTxt=(cm.doc.getRange(pos, pos2))??'';
            const replTxt=`${beginMark}${originTxt}${endMark}`;
            cm.doc.replaceRange(replTxt, pos, pos2);

            line=pos.line;
            ch=pos.ch+replTxt.length;

            if('number'===typeof(cursorOffset)){
                if(cursorOffset>=0){
                    ch=pos.ch+cursorOffset;
                }else{
                    ch=pos.ch+replTxt.length+cursorOffset;
                }
            }
        }else{
            line=pos2.line;
            ch=pos2.ch+endMark.length;

            cm.doc.replaceRange(beginMark, pos, pos);
            cm.doc.replaceRange(endMark, pos2 , pos2);

            if('number'===typeof(cursorOffset)){
                if(cursorOffset>=0){
                    line=pos.line;
                    ch=pos.ch+cursorOffset;
                }else{
                    line=pos2.line;
                    ch=pos2.ch+endMark.length+cursorOffset;
                }
            }
        }


        cm.focus();
        cm.doc.setCursor({line, ch});
    };

    const sortCursor=(pos1, pos2)=>{
        if(pos1.line!==pos2.line){
            return pos1.line<pos2.line ? [pos1, pos2] : [pos2, pos1];
        }
        return pos1.ch<pos2.ch ? [pos1, pos2] : [pos2, pos1];
    };

    const clearSelection=(cm)=>{
        let sel=cm.doc.listSelections();
        if(!sel[0]){
            return;
        }
        sel=sel[0];
        if(sel.anchor.line===sel.head.line && sel.anchor.ch===sel.head.ch){
            return;
        }
        cm.doc.setCursor(sel.anchor);
    };


    const appendItems=(array, cnt, valOrCallback)=>{
        let ind=array.length;
        for(let i=0;i<cnt;++i){
            if("function"===typeof valOrCallback){
                array.push(valOrCallback(ind+i));
                continue;
            }
            array.push(valOrCallback);
        }
        return array;
    };
    
    
    const parseTableAlign=(txts)=>{
        const flag=txts.map(t=>t.trim()).every(t=>/^[:]?[-]+[:]?$/.test(t));
        if(!flag){
            return false;
        }
        return txts.map(item=>{
            if(item.startsWith(":") && item.endsWith(":")){
                return "center";
            }
            if(item.startsWith(":")){
                return "left";
            }
            if(item.endsWith(":")){
                return "right";
            }
            return "left";
        });
    };
    
    
    const parseTableLine=(lineTxt)=>{
        const lineTxtTrim=lineTxt.trim();
        if(!/^[|](([^|]|[\\][|])*[|])+$/.test(lineTxtTrim)){
            return false;
        }
        let result=lineTxtTrim.split(/(?<![\\])[|]/g);
        result.splice(result.length-1,1);
        result.shift();
        return result;
    };
    
    
    /**
     * 
     * @param {*} cm 
     * @returns 如果无法解析为表格，返回false；如果能解析为表格，返回如下格式：
     * {
     *      hasInitData: false,             // 是否有初始数据，如果光标所在行为空行则为false，否则为true
     *      data: {
     *          heads: ['标题1','标题2'],   // 标题名称
     *          aligns: ['left','right'],   // 对齐方式
     *          lines: [
     *              ['', ''],               // 每行的数据
     *              ['', '']
     *          ] ,
     *      },  
     *      fromPos: {line: 0, ch: 0},      // codemirror中表格部分的起始行及行首位置
     *      toPos: {line: 10, ch: 15},      // codemirror中表格部分的结束行及行尾位置，用于生成新的markdown后替换
     *      needExtraBlankLine: true,       // 生成的结果markdown文本中是否包含前后的空行，当光标所在行为空时会指定为true，以与其它部分区别开
     * }
     */
    const parseTable=(cm, allowBlankLine=true)=>{
        const pos=cm.doc.getCursor();// { ch: 3  line: 0}
        const lineTxt=cm.doc.getLine(pos.line);
        const lineCnt=cm.doc.lineCount();
    
        // 是空行
        if(''===lineTxt.trim()){
            if(!allowBlankLine){
                return false;
            }
            return {
                hasInitData:        false,
                data:               null,
                fromPos:            {line: pos.line, ch: 0},
                toPos:              {line: pos.line, ch: lineTxt.length},
                needExtraBlankLine: true,
            };
        }
    
        // 不是表格的行
        let lines=[];
        let tmp=parseTableLine(lineTxt);
        if(false===tmp){
            return false;
        }

        console.log("1111111");

        // 是表格的行
        // 获取光标所在行附件所有符合表格行结构的行
        let lineIndFrom=99999;
        let lineIndTo=-1;
        if(pos.line<lineIndFrom){
            lineIndFrom=pos.line;
        }
        if(pos.line>lineIndTo){
            lineIndTo=pos.line;
        }
        lines.push(tmp);
        for(let i=pos.line-1; i>=0; --i){
            tmp=parseTableLine(cm.doc.getLine(i));
            if(false===tmp){
                break;
            }
            lines.unshift(tmp);
            if(i<lineIndFrom){
                lineIndFrom=i;
            }
            if(i>lineIndTo){
                lineIndTo=i;
            }
        }
        for(let i=pos.line+1; i<lineCnt; ++i){
            tmp=parseTableLine(cm.doc.getLine(i));
            if(false===tmp){
                break;
            }
            lines.push(tmp);
            if(i<lineIndFrom){
                lineIndFrom=i;
            }
            if(i>lineIndTo){
                lineIndTo=i;
            }
        }

        console.log("2222222");
    
        // 列数为列数最多行的列数
        const colCnt= lines.map(line=>line.length).reduce((accu, curr)=>Math.max(accu, curr),0);
    
        // 处理标题行
        const heads=lines[0];
        appendItems(heads, colCnt-heads.length, (ind)=>"列头_"+(ind+1));
        lines.shift();

        console.log("333333");

        // 处理对齐方式行
        let aligns=heads.map(h=>"left");
        if(lines.length>0){
            tmp=parseTableAlign(lines[0]);
            if(false!==tmp){
                aligns=tmp;
                appendItems(aligns, colCnt-aligns.length, "left");
                lines.shift();
            }
        }

        console.log("44444");
        
        // 处理数据行
        lines=lines.map(lineItems=>appendItems(lineItems, colCnt-lineItems.length, " "));

        console.log("55555");

        return {
            hasInitData:        true,
            data:               {heads, aligns, lines,},
            fromPos:            {line: lineIndFrom, ch: 0},
            toPos:              {line: lineIndTo, ch: cm.doc.getLine(lineIndTo).length},
            needExtraBlankLine: false,
        };
    };



    /**
     * 判断光标是不顺
     * 1、如果未找到分隔线，则返回false，表示标尺不需要特殊样式；
     * 2、如果分隔线上面没有有效节点（未空行），则返回0，表示不显示标尺；
     * 3、否则以 (最后一个节点的底端的位置 + 校正值) 进行返回
     * @param {*} cm 
     * @param {*} asjust 校正值
     * @returns 
     */
    const isCursorInNodePart=(cm, asjust=0)=>{
        const pos=cm.doc.getCursor();// { ch: 3  line: 0}
        const lines=getAllLines(cm);
        const matchedItems=lines.map((txt,ind)=>({txt,ind})).filter(({txt,ind})=>"***"===txt.trim());
        return (0===matchedItems.length || pos.line<matchedItems[0].ind);
    };



    /**
     * 计算标尺线的状态
     * @param {*} cm 
     * @param {*} rulerLineCnt  标尺线的总数量
     * @returns [
     *  {
     *      show: true/false,
     *      highlight: true/false,
     *  }
     * ]
     */
    const getRulerState=(cm, rulerLineCnt)=>{
        // 先默认设置为都不显示
        let result=[];
        for(let i=0;i<rulerLineCnt;++i){
            result.push({
                show: false,
                highlight: false,
            });
        }

        const pos=cm.doc.getCursor();// { ch: 3  line: 0}
        const lines=getAllLines(cm);
        const matchedItems=lines.map((txt,ind)=>({txt,ind})).filter(({txt,ind})=>"***"===txt.trim());
        const cursorInNodePart=(0===matchedItems.length || pos.line<matchedItems[0].ind);
        const maxNodeLindInd=(0===matchedItems.length ? lines.length-1 : matchedItems[0].ind-1);

        // 如果光标没在节点当中，则不显示标尺线
        if(!cursorInNodePart){
            return result;
        }

        // 计算每个节点对应的标尺线样式：
        // 如果不是以tab开头，或该行为空白字符，则跳过；
        // 否则置为显示，同时如果是当前行，则突出显示
        lines.filter((line,ind)=>ind<=maxNodeLindInd).forEach((line,ind)=>{
            const groups=line.match(/^([\t]+).*$/);
            if(!groups || ''===line.trim()){
                return;
            }
            result[groups[1].length-1].show=true;
            if(pos.line===ind){
                result[groups[1].length-1].highlight=true;
            }
        });
        return result;
    };


    return {
        gotoDefinition,
        loadAllRefNames,
        loadAllTrefNames,
        gotoLine,
        toDateFmt,
        toTimeFmt,
        copyLine,
        setColor,
        setTitle,
        setBold,
        setItalic,
        setStrikeLine,
        clearSelection,
        parseTable,
        isCursorInNodePart,
        getRulerState,
        getFirstGeneralTxt,
        isSelMultiLine,
        setWrapperMark,
        setSuperscript,
        setSubscript,
        setEmphasize,
        delCurrLine,
        getSelectionType,
        isInImgNamePart,
        isInLinkNamePart,
        isInTable,
        isInNodePart,
        isInRefPart,
        isInEncodeTxtPart,
        isInNoLinkTxtPart,
    };
})();

export default editorSvcExInstWrapper;