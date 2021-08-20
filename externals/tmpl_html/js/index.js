/**
 * 工具函数与全局常量
 */
(function(win){
    // 全局常量：代码块的背景色
    win.codeConfig={
        bg: 'rgba(40,44,52,1)',
    };


    // 生成id
    let index=0;
    win.getNewId=()=>(++index);


    // 转义处理
    const escapeTest = /[&<>"']/;
    const escapeReplace = /[&<>"']/g;
    const escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
    const escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
    const escapeReplacements = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    const getEscapeReplacement = (ch) => escapeReplacements[ch];
    win.doEscape=(html, encode)=>{
        if (encode) {
            if (escapeTest.test(html)) {
            return html.replace(escapeReplace, getEscapeReplacement);
            }
        } else {
            if (escapeTestNoEncode.test(html)) {
            return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
            }
        }

        return html;
    }
})(window);



/**
 * markdown组件初始化
 */
const init=()=>{
    /**
     * 语法高亮函数
     * @param {*} code 
     * @param {*} language 
     * @returns 
     */
    const highlightFun = (code, language) => {
        if('latex'===language){
            let expStr=katex.renderToString(code,{throwOnError: false});
            return `<div style='font-size:30px;'>${expStr}</div>`;
        }
        if('sequence'===language){
            const tmpId=`seqdiagram-${getNewId()}`;
            return `<div>
                <div class="sequence" style='display:none;' targetid='${tmpId}' handled='false'>${code}</div>
                <div id='${tmpId}'></div>
            </div>`;
        }
        if('flow'===language){
            const tmpId=`flowchart-${getNewId()}`;
            return `<div>
                <div class="flowchart" style='display:none;' targetid='${tmpId}' handled='false'>${code}</div>
                <div id='${tmpId}'></div>
            </div>`;
        }
        if('echart'===language){
            const tmpId=`echart-${getNewId()}`;
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


    /**
     * 自定义渲染器
     */
    const renderer = new marked.Renderer({ highlight: highlightFun });


    /**
     * 渲染器中代码块的处理
     * @param {*} code 
     * @param {*} infostring 
     * @param {*} escaped 
     * @returns 
     */
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
        const bgStyle = (codeConfig && codeConfig.bg) ? `style="background-color:${codeConfig.bg}"` : "";
        if (!lang) {
            return `<pre ${bgStyle}><code class="hljs">${finalCodeHtml}</code></pre>`;
        }
        return `<pre ${bgStyle}><code class="hljs ${this.options.langPrefix + doEscape(lang, true)}">${finalCodeHtml}</code></pre>
            `;
    };


    /**
     * 渲染器中文本的处理，支持几种扩展的语法：
     * 行内latex表达式：$a_{1}+b_{1}=c$
     * 文字高亮：==文字==
     * 上标：x^2^
     * 下标：H--2--O
     * @param {*} txt 
     * @returns 
     */
    renderer.text=function(txt){
        const latexItems=txt.match(/[$][^$\r\n\t]+?[$]/g);
        if(latexItems && latexItems.length){
            for(let i=0; i<latexItems.length; ++i){
                const item=latexItems[i].substring(1, latexItems[i].length-1);
                const latexStr=katex.renderToString(item,{throwOnError: false});
                txt=txt.replace(latexItems[i], latexStr);
            }
        }

        const newTxt=txt.replace(/(==)([^=\r\n\t]+?)(==)/g,"<span style='background-color:#f8f840;'>$2</span>")
            .replace(/(\^)([^^\r\n\t]{1,20})(\^)/g, "<sup>$2</sup>")
            .replace(/(--)([^\-\r\n\t]{1,20})(--)/g, "<sub>$2</sub>");
        return newTxt;
    };


    /**
     * marked配置项
     */
    marked.setOptions({
        renderer: renderer,
        highlight: highlightFun,
        pedantic: false,
        gfm: true,
        breaks: false,
        sanitize: false,
        smartLists: true,
        smartypants: false,
        xhtml: false,
    });
};