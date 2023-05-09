import {  escape as doEscape } from './helpers';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';
import tableEnh from './tableEnh';

/**
 * marked结合hljs实现语法高亮与点击事件处理等功能
 */
class MarkedHighlightUtil {

    constructor(){
        this.mdLinkCls="gmap_mk_link_"+new Date().getTime();
        this.mdImgCls="gmap_mk_img_"+new Date().getTime();
        this.mermaidInited=false;
        this.index=0;
    }

    mermaidInit=()=>{
        if(true===this.mermaidInited){
            return;
        }
        mermaid.initialize({
            theme: 'default',//default, forest, dark or neutral
            flowchart:{
                htmlLabels: true,
                curve: 'basis', // basis, linear, cardinal
                defaultRenderer: 'dagre-d3', // dagre-d3, dagre-wrapper
            }
        });
        this.mermaidInited=true;
    }

    getNewId=()=>{
        return ++this.index;
    }   

    /**
     * 初始化
     * @param {*} marked
     * @param {*} hljs
     * @param {*} config    {codeConfig:{bg}, linkConfig:{convertUrl,disableDefault}, imgConfig:{convertUrl}} 
     */
    init = (marked, hljs, {codeConfig, linkConfig, imgConfig}) => {
        const mdLinkCls=this.mdLinkCls;
        const mdImgCls=this.mdImgCls;


        //-----------代码高亮功能----------------------------
        //代码高亮函数：如果是latex表达式，则用katex解析，否则用hljs解析
        const highlightFun = (code, language) => {
            if('latex'===language){
                let expStr=katex.renderToString(code,{throwOnError: false});
                return `<div style='font-size:30px;'>${expStr}</div>`;
            }
            if('sequence'===language){
                const tmpId=`seqdiagram-${this.getNewId()}`;
                return `<div>
                    <div class="sequence" style='display:none;' targetid='${tmpId}' handled='false'>${code}</div>
                    <div id='${tmpId}'></div>
                </div>`;
            }
            if('flow'===language){
                const tmpId=`flowchart-${this.getNewId()}`;
                return `<div>
                    <div class="flowchart" style='display:none;' targetid='${tmpId}' handled='false'>${code}</div>
                    <div id='${tmpId}'></div>
                </div>`;
            }
            if('echart'===language){
                const tmpId=`echart-${this.getNewId()}`;
                return `<div>
                    <div class="echart-graph" style='display:none;' targetid='${tmpId}' handled='false'>${code}</div>
                    <div id='${tmpId}'></div>
                </div>`;
            }
            if('mermaid'===language){
                return `<div style="display:none;">
                    <div class="mermaid" >${code}</div>
                </div>`;
            }

            let tmp = hljs.getLanguage(language);
            const validLanguage = tmp ? language : 'plaintext';
            return hljs.highlight(code, {language:validLanguage}).value;
        };



        //渲染器实现，对原代码做如下修改：
        //1、解决marked生成的html中没有hljs样式的问题
        //2、解决hljs中背景颜色样式没有github-markdown-css优先级高的问题
        const renderer = new marked.Renderer({ highlight: highlightFun });

        /**
         * 拦截文本块，增加如下功能：
         * 行内latex表示式：$a_{1}+b_{1}=c$
         * 文字高亮：==文字==
         * 上标：x^2^
         * 下标：H--2--O
         * @param {*} txt 
         * @returns 
         */
        renderer.text=function(txt){
            // 文字颜色
            const colorItems=txt.match(/[$][\\]textcolor[{].+?[}][{].+?[}][$]/g);
            if(colorItems && colorItems.length){
                colorItems.forEach(item=>{
                    const [_nouse, color, str]=item.match(/^[$][\\]textcolor[{](.+?)[}][{](.+?)[}][$]$/);
                    txt=txt.replace(item, `<span style="color:${color}">${str}</span>`);
                });
            }

            // 行内latex公式
            const latexItems=txt.match(/[$][^$\r\n\t]+?[$]/g);
            if(latexItems && latexItems.length){
                for(let i=0; i<latexItems.length; ++i){
                    const item=latexItems[i].substring(1, latexItems[i].length-1);
                    const latexStr=katex.renderToString(item,{throwOnError: false});
                    txt=txt.replace(latexItems[i], latexStr);
                }
            }

            // 高亮与上下标
            const newTxt=txt.replace(/(==)([^=\r\n\t]+?)(==)/g,"<span style='background-color:#f8f840;'>$2</span>")
                .replace(/(\^)([^^\r\n\t]{1,20})(\^)/g, "<sup>$2</sup>")
                .replace(/(--)([^\-\r\n\t]{1,20})(--)/g, "<sub>$2</sub>");
            return newTxt;
        };

        if (codeConfig) {
            renderer.code = function (code, infostring, escaped) {
                //高亮处理
                const lang = (infostring || '').match(/\S*/)[0];
                if(['mermaid', 'flow', 'sequence', 'echart'].includes(lang)){
                    return this.options.highlight(code, lang);
                }

                if (this.options.highlight) {
                    const out = this.options.highlight(code, lang);
                    if (out != null && out !== code) {
                        escaped = true;
                        code = out;
                    }
                }

                //结果生成
                const finalCodeHtml = (escaped ? code : doEscape(code, true));
                const bgStyle = codeConfig.bg ? `style="background-color:${codeConfig.bg}"` : "";
                if (!lang) {
                    return `<pre ${bgStyle}><code class="hljs">${finalCodeHtml}</code></pre>`;
                }
                return `<pre ${bgStyle}><code class="hljs ${this.options.langPrefix + doEscape(lang, true)}">${finalCodeHtml}</code></pre>
                    `;
            };
        }



        //-----------链接----------------------------
        if (linkConfig) {
            /**
             * markdown中链接的处理：
             * 生成的a标签中hrefex为附件实际的路径，用于点击后打开处理
             * @param {*} href 
             * @param {*} title 
             * @param {*} text 
             * @returns 
             */
            renderer.link = function (href, title, text) {
                if (href === null) {
                    return text;
                }

                let newHref=href;
                if(linkConfig.convertUrl){
                    newHref=linkConfig.convertUrl(newHref);
                }
                const out = `<a class="${mdLinkCls}" href="javascript:void(0);" hrefex="${newHref}" title="${text}">${text}</a>`;
                return out;
            };
        }


        //-----------图片----------------------------
        if(imgConfig){
            /**
             * markdown中图片的处理：
             * 生成的img标签中：src为显示用，已进行urlencode的url；srcex为点击时打开用，未进行urlencode，即明文url
             * @param {*} href 
             * @param {*} title 
             * @param {*} text 
             * @returns 
             */
            renderer.image=function(href, title, text) {
                if (href === null) {
                  return text;
                }

                // 对图片文本中的元数据进行处理
                // ![图片#640px*480px#center](xxx.jpg)
                let style="";
                let wrapperStyle="";
                let handledTxt=text;
                let display="block";
                let wrap=false;

                const metas=text.match(/[#][^#]+/g);
                if(metas){
                    metas.map(meta=>{
                        handledTxt=handledTxt.replace(meta, "");
                        return meta.substring(1).trim();
                    }).forEach(meta=>{
                        // 20px、50%
                        if(/^[0-9]+(px|[%])$/.test(meta)){
                            style+=`width:${meta};`;
                            return;
                        }
                        // 20px*50px、30%*20px
                        if(/^[0-9]+(px|[%])[*][0-9]+(px|[%])$/.test(meta)){
                            const [w,h]=meta.split("*");
                            style+=`width:${w};height:${h};`;
                            return;
                        }
                        if('inline'===meta){
                            display="inline-block";
                            return;
                        }
                        if('float-left'===meta){
                            style+="float:left;";
                            display="block";
                            return;
                        }
                        if('float-right'===meta){
                            style+="float:right;";
                            display="block";
                            return;
                        }
                        // 左中右对齐，需要一个包裹元素，对齐样式设置在包裹元素上
                        if('left'===meta){
                            wrapperStyle+="text-align:left;";
                            display="inline-block";
                            wrap=true;
                            return;
                        }
                        if('right'===meta){
                            wrapperStyle+="text-align:right;";
                            display="inline-block";
                            wrap=true;
                            return;
                        }
                        if('center'===meta){
                            wrapperStyle+="text-align:center;";
                            display="inline-block";
                            wrap=true;
                            return;
                        }
                    });
                }


                let newHref=href;
                let newHrefEx=href;

                if(imgConfig.convertUrl){
                    const tmp=imgConfig.convertUrl(newHref);
                    newHrefEx=tmp[0];
                    newHref=tmp[1];
                }
                let out = `<img class="${mdImgCls}" style="display:${display};${style}" src="${newHref}" srcex="${newHrefEx}" alt="${handledTxt}" title="${handledTxt}"/>`;
                if(wrap){
                   out=`<div style="${wrapperStyle}">${out}</div>`;
                }
                return out;
            }
        }

        renderer.table=(header, body)=>{
            if (body) body = `<tbody>${body}</tbody>`;
            let html= `<table><thead>${header}</thead>${body}</table>`;
            const idCreater=()=>`echart-${this.getNewId()}`;
            return tableEnh(html, idCreater);



//             const metas=[];
//             const barLineSeriesConfig=[];
//             const lines=[];
//             const tableEle=new DOMParser().parseFromString(html, "text/html").querySelector("table");
//             let hasBarLineChart=false;
//             tableEle.querySelectorAll("tr").forEach((tr,rowInd)=>{
//                 const line=[];
//                 tr.querySelectorAll("th,td").forEach((td,colInd)=>{
//                     const originVal=td.innerHTML.trim();
//                     let val=originVal;
//
//                     // 首行第一列为图表元数据，如果其中有柱线混合图则记录一个标识
//                     if(0===colInd && 0===rowInd){
//                         (val.match(/[#][^#]+/g)??[]).forEach(meta=>{
//                             val=val.replace(meta, "");
//                             metas.push(meta.trim());
//                             if(meta.includes("#bar-line")) {
//                                 hasBarLineChart = true;
//                             }
//                         });
//                     }
//                     // 如果图表元数据中包含柱线混合图，则第二行到最后一行的第一列中都包含系列相关的配置
//                     if(0===colInd && 0<rowInd && hasBarLineChart){
//                         (val.match(/[#][^#]+/g)??[]).filter((ele,ind)=>ind<1).forEach(meta=>{
//                             val=val.replace(meta, "");
//                             barLineSeriesConfig.push(meta.substring(1).trim());
//                         });
//                     }
//                     // 如果去掉元数据后的单元格值与之前不同，则修改
//                     if(val!==originVal){
//                         td.innerHTML=val;
//                     }
//                     line.push(val);
//                 });
//                 lines.push(line);
//             });
//
//
//
//             // 从第一个单元格中提取元数据，同时记录去掉元数据后的单元格值
//             // TODO 当为柱线混合图时，数据行第一列也会有元数据，都需要提取
//             const chartTypes=metas.map(meta=>meta.substring(1).trim()).reduce((currChartTypes, meta)=>{
//                 let opts=[];
//                 let type=meta;
//                 const ind1= meta.indexOf("{");
//                 if(0<ind1){
//                     const ind2= meta.indexOf("}", ind1);
//                     opts=meta.substring(ind1+1, ind2).trim()
//                         .split(",")
//                         .filter(v=>""!==v.trim());
//                     type=meta.substring(0, ind1);
//                 }
//                 if(!currChartTypes.some(eachType=>type===eachType.type)){
//                     currChartTypes.push({
//                         type,
//                         opts,
//                         serialConfig: 'bar-line'===type ? barLineSeriesConfig : null,
//                     });
//                 }
//                 return currChartTypes;
//             },[]);
//
//             console.log("chartTypes.....", chartTypes);
//
//
//
//
//             // 根据图表元数据和解析得到的单元格数据计算出图表的html文本
//             let extraContent='';
//             chartTypes.forEach(({type,opts,serialConfig})=>{
//                 // 柱状图和拆线图配置信息一致，一块处理
//                 if('bar'===type || 'line'===type || 'stack'===type){
//                     // 需要有标题行和至少一个数据行
//                     if(lines.length<2){
//                         return;
//                     }
//
//
//
//                     // x轴的配置：  ,2015,2016,2017
//                     const xAxis= lines[0].map((val,ind)=>(0===ind ? '' : val.trim())).join(',');
//
//                     // 数据行的配置：
//                     // 苹果,25,30,40
//                     // 桔子,20,40,70
//                     const dataLines=lines.filter((val,ind)=>ind>0).map(vals=> vals.map(v=>v.trim()).join(","));
//
//                     const tmpId=`echart-${this.getNewId()}`;
//                     extraContent+= `<div>
//                         <div class="echart-graph" style='display:none;' targetid='${tmpId}' handled='false'>
// ${type}
// ${opts.join("\n")}
// ${xAxis}
// ${dataLines.join("\n")}
//                         </div>
//                         <div id='${tmpId}'></div>
//                     </div>`;
//                     return;
//                 }
//                 if('pie'===type){
//                     // 需要有标题行和唯一一个数据行
//                     if(2!==lines.length){
//                         return;
//                     }
//                     const dataLines=[];
//                     const cols=Math.min(lines[0].length, lines[1].length);
//                     for (let i = 0; i < cols; ++i) {
//                         const value=lines[1][i].trim();
//                         let label=lines[0][i].trim();
//                         if(!label.startsWith("\"")){
//                             label="\""+label;
//                         }
//                         if(!label.endsWith("\"")){
//                             label+="\"";
//                         }
//                         dataLines.push(`${label}:${value}`);
//                     }
//
//                     const tmpId=`echart-${this.getNewId()}`;
//                     extraContent+= `<div>
//                         <div class="echart-graph" style='display:none;' targetid='${tmpId}' handled='false'>
// pie
// ${opts.join("\n")}
// ${dataLines.join("\n")}
//                         </div>
//                         <div id='${tmpId}'></div>
//                     </div>`;
//                     return;
//                 }
//                 if('bar-line'===type){
//                     // 柱线图每个数据行都要指定分类
//                     if(serialConfig.length!==lines.length-1){
//                         return;
//                     }
//
//                     // x轴的配置：  ,2015,2016,2017
//                     const xAxis= lines[0].map((val,ind)=>(0===ind ? '' : val.trim())).join(',');
//
//                     // stack 食品
//                     // - bar,三餐,500,400,300
//                     // - bar,食品,500,400,300
//                     // bar,娱乐,600,400,600
//                     // line,参考值,500,200,300
//                     const dataLines=[];
//                     const cates=[];
//                     lines.filter((val,ind)=>ind>0).forEach((val,ind)=>{
//                         if('bar'===serialConfig[ind] || 'line'===serialConfig[ind]){
//                             cates.push({
//                                 type: '',
//                                 txt:  [serialConfig[ind], ...val].join(",")
//                             });
//                             return;
//                         }
//                         if(serialConfig[ind].startsWith("stack:")){
//                             const groupName=serialConfig[ind].substring("stack:".length).trim();
//                             const existItem= cates.find(cate=>groupName===cate.type);
//                             if(existItem){
//                                 existItem.txt.push(['- bar', ...val].join(","));
//                                 return;
//                             }
//                             cates.push({
//                                 type:groupName,
//                                 txt:[
//                                     `stack ${groupName}`,
//                                     ['- bar', ...val].join(","),
//                                 ],
//                             });
//                         }
//                     });
//                     cates.forEach(cate=>{
//                         if(''===cate.type){
//                             dataLines.push(cate.txt);
//                             return ;
//                         }
//                         cate.txt.forEach(eachLine=>dataLines.push(eachLine));
//                     });
//
//
//                     const tmpId=`echart-${this.getNewId()}`;
//                     extraContent+= `<div>
//                         <div class="echart-graph" style='display:none;' targetid='${tmpId}' handled='false'>
// bar-line
// ${opts.join("\n")}
// ${xAxis}
// ${dataLines.join("\n")}
//
//                         </div>
//                         <div id='${tmpId}'></div>
//                     </div>`;
//                     return;
//                 }
//             });
//             return `${extraContent}${tableEle.outerHTML}`;
        }



        //初始化markdown解析功能：使用上面的高亮函数和渲染器
        marked.setOptions({
            renderer: renderer,
            highlight: highlightFun,
            pedantic: false,
            gfm: true,
            breaks: false,
            sanitize: false,
            smartLists: true,
            smartypants: false,
            xhtml: false
        });
    }

    /**
     * 绑定链接点击事件
     * @param {*} cb          (addr, ele)=>...
     * @param {*} filter      (ele)=>...return boolean
     */
    bindLinkClickEvent=(cb,filter=null)=>{
        document.querySelectorAll("."+this.mdLinkCls).forEach(ele=>{
            //如果已绑定过事件、链接地址不存在、过滤条件忽略，则不处理
            let hasBindEvent=ele.getAttribute("hasBindEvent");
            if(hasBindEvent){return;}
            let addr=ele.getAttribute('hrefex');
            if(!addr){return;}
            if(filter && !filter(ele)){return;}

            //绑定事件
            ele.setAttribute("hasBindEvent","yes");
            const handler=delegateOpenUrlFun.bind(this, cb, addr);
            ele.addEventListener("click",handler);//增加点击事件，点击时使用外部浏览器打开
        });
    }

    /**
     * 绑定图片点击事件
     * @param {*} cb          (addr, ele)=>...
     * @param {*} filter      (ele)=>...return boolean
     */
    bindImgClickEvent=(cb,filter=null)=>{
        document.querySelectorAll("."+this.mdImgCls).forEach(ele=>{
            let hasBindEvent=ele.getAttribute("hasBindEvent");
            if(hasBindEvent){return;}
            if(filter && !filter(ele)){return;}

            ele.setAttribute("hasBindEvent","yes");
            ele.style.cursor='pointer';//绑定点击事件要把光标设为手形
            let addr=ele.getAttribute('srcex');

            const handler=delegateOpenUrlFun.bind(this, cb, addr);
            ele.addEventListener("click", handler);//本地打开时使用不带随机参数的url
        });
    }
}

const delegateOpenUrlFun=(fun, url)=>{
    if(fun && url){
        fun(url);
    }
};

export default MarkedHighlightUtil;