import {escape as doEscape} from './helpers';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';
import tableEnh from './tableEnh';
import loadMetaData, {parseMetadata} from './metadataLoader';
import {createId, unbindEvent} from "./uiUtil";
import api from "../service/api";

/**
 * marked结合hljs实现语法高亮与点击事件处理等功能
 */
class MarkedHighlightUtil {

    constructor(){
        this.mdLinkCls=createId("gmap_mk_link_");
        this.mdImgCls=createId("gmap_mk_img_");
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
            // 搜索关键词 abc##hello##def
            (txt.match(/[#][#][^#]+?[#][#]/g)??[]).forEach(matchItem=>{
                const kw=matchItem.substring(2, matchItem.length-2).trim();
                if(''===kw){
                    txt=txt.replace(matchItem, '');
                }else{
                    txt=txt.replace(matchItem, `<u style="cursor: pointer;" class="search_keyword"  handled='false' title="搜索: ${kw}">${kw}</u>`);
                }
            });

            // 锚点
            (txt.match(/[$]anchor[{].+?[}][$]/g)??[]).forEach(item=>{
                const [, anchorId]=item.match(/^[$]anchor[{](.+?)[}][$]$/);
                txt=txt.replace(item, `<span data-logicid="${anchorId.trim()}"></span>`);
            });

            // 文字颜色
            (txt.match(/[$][\\]textcolor[{].+?[}][{].+?[}][$]/g)??[]).forEach(item=>{
                const [, color, str]=item.match(/^[$][\\]textcolor[{](.+?)[}][{](.+?)[}][$]$/);
                txt=txt.replace(item, `<span style="color:${color}">${str}</span>`);
            });

            // 行内latex公式
            (txt.match(/[$][^$\r\n\t]+?[$]/g)??[]).forEach(latexItem=>{
                const item=latexItem.substring(1, latexItem.length-1);
                const latexStr=katex.renderToString(item,{throwOnError: false});
                txt=txt.replace(latexItem, latexStr);
            });

            // 高亮与上下标
            const newTxt=txt.replace(/(==)([^=\r\n\t]+?)(==)/g,"<span style='background-color:#f8f840;'>$2</span>")
                .replace(/(\^)([^^\r\n\t]{1,20})(\^)/g, "<sup>$2</sup>")
                .replace(/(--)([^\-\r\n\t]{1,20})(--)/g, "<sub>$2</sub>");
            return newTxt;
        };

        /**
         * 标题：自定义id与class，id用于与导航栏关联，class用于查找元素
         */
        renderer.heading=function(text, level, raw, slugger) {
            const id=createId(`h${level}_`);
            return `<h${level} class="markdown_head" id="${id}">${text}</h${level}>\n`;
        };

        if (codeConfig) {
            renderer.code = function (code, infostring, escaped) {
                //高亮处理
                const lang = (infostring || '').match(/\S*/)[0];
                if(['mermaid', 'flow', 'sequence', 'echart',].includes(lang)){
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
                let cls="hljs";
                if(lang){
                    cls=`hljs ${this.options.langPrefix + doEscape(lang, true)}`;
                }
                // latex公式不支持复制代码，其它类型支持
                let copyBtn=''; // ('latex'===lang ? '' : `<div class="copy_btn">复制代码</div>`);
                if('latex'!==lang){
                    copyBtn+=`<div class="btn_group">`;
                    if('cmd'===lang || 'bat'===lang){
                        copyBtn+=`<div class="btn_item cmd_btn">运行</div>`;
                        copyBtn+=`<div class="btn_item cmdp_btn">运行并停住</div>`;
                    }
                    copyBtn+=`<div class="btn_item copy_btn">复制代码</div>`;
                    copyBtn+=`</div>`;
                }

                return `<div class="code_wrapper">
                    ${copyBtn}
                    <pre ${bgStyle}><code class="${cls}" handled='false'>${finalCodeHtml}</code></pre>
                </div>`;
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
                href=(href??'').trim();
                text=(text??'').trim();

                // 提取toid元数据，用于点击后的导航操作
                let isAnchorLink=false;
                let toIdAttr='';
                let anchorName='';
                if(href.startsWith("#") && href.length>1){
                    anchorName=href.substring(1).trim();
                    isAnchorLink=true;
                    toIdAttr=`data-toid="${anchorName}"`;
                }

                // 如果不是锚点链接，并且没有指定链接地址，则只输出链接名字文本
                if(!isAnchorLink && ''===href){
                    return text;
                }

                let newHref=href;
                if(linkConfig.convertUrl){
                    newHref=linkConfig.convertUrl(newHref);
                }

                // 显示的文本：有链接名则使用，否则有链接地址则使用，否则为固定值【链接】
                let showTxt=text;
                if(''===text){
                    if(isAnchorLink){
                        showTxt=`跳转到 - ${anchorName}`;
                    }else{
                        showTxt=href;
                        if(''===href){
                            showTxt="链接";
                        }
                    }
                }
                return `<a class="${mdLinkCls}" href="javascript:void(0);" ${toIdAttr} hrefex="${newHref}" title="${showTxt}">${showTxt}</a>`;
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
                const [handledTxt, metas]=loadMetaData(text);
                let style="";
                let wrapperStyle="";
                let display="block";
                let wrap=false;

                metas.forEach(meta=>{
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
    bindLinkClickEvent=(cb, filter=null, cleanupFunsArray=null)=>{
        document.querySelectorAll("."+this.mdLinkCls).forEach(ele=>{
            //如果已绑定过事件，则不处理
            let hasBindEvent=ele.getAttribute("hasBindEvent");
            if(hasBindEvent){return;}

            // 是跳转锚点的链接
            if(ele?.dataset?.toid){
                const handler=delegateGotoEleFunc.bind(this, ele.dataset.toid);
                ele.addEventListener("click",handler);
                ele.setAttribute("hasBindEvent","yes");
                if(Array.isArray(cleanupFunsArray)){
                    cleanupFunsArray.push(unbindEvent.bind(this, ele, "click", handler));
                }
                return;
            }


            let addr=ele.getAttribute('hrefex');
            if(!addr){return;}
            if(filter && !filter(ele)){return;}

            //绑定事件
            ele.setAttribute("hasBindEvent","yes");
            const handler=delegateOpenUrlFun.bind(this, cb, addr);
            ele.addEventListener("click",handler);//增加点击事件，点击时使用外部浏览器打开
            if(Array.isArray(cleanupFunsArray)){
                cleanupFunsArray.push(unbindEvent.bind(this, ele, "click", handler));
            }
        });
    }

    /**
     * 绑定图片点击事件
     * @param {*} cb          (addr, ele)=>...
     * @param {*} filter      (ele)=>...return boolean
     */
    bindImgClickEvent=(cb,filter=null, cleanupFunsArray=null)=>{
        document.querySelectorAll("."+this.mdImgCls).forEach(ele=>{
            let hasBindEvent=ele.getAttribute("hasBindEvent");
            if(hasBindEvent){return;}
            if(filter && !filter(ele)){return;}

            ele.setAttribute("hasBindEvent","yes");
            ele.style.cursor='pointer';//绑定点击事件要把光标设为手形
            let addr=ele.getAttribute('srcex');

            const handler=delegateOpenUrlFun.bind(this, cb, addr);
            ele.addEventListener("click", handler);//本地打开时使用不带随机参数的url
            if(Array.isArray(cleanupFunsArray)){
                cleanupFunsArray.push(unbindEvent.bind(this, ele, "click", handler));
            }
        });
    }
}


const delegateGotoEleFunc=(logicid)=>{
    const targetELe=document.querySelector(`[data-logicid="${logicid}"]`);
    if(targetELe){
        targetELe.scrollIntoView(true);
    }else{
        api.showNotification('无法跳转到指定锚点', `未找到指定锚点：${logicid}`, 'warn');
    }
};

const delegateOpenUrlFun=(fun, url)=>{
    if(fun && url){
        fun(url);
    }
};

export default MarkedHighlightUtil;