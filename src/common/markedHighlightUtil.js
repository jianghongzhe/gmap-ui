class MarkedHighlightUtil{

    init=(marked,hljs,bgColor=null)=>{
        //代码高亮函数
        const highlightFun=(code, language)=>{
            let tmp=hljs.getLanguage(language);
            const validLanguage = tmp ? language : 'plaintext';
            return hljs.highlight(validLanguage, code).value;
        };

        //渲染器实现，对原代码做如下修改：
        //1、解决空格被转义的问题
        //2、解决marked生成的html中没有hljs样式的问题
        //3、解决hljs中背景颜色样式没有github-markdown-css优先级高的问题
        const renderer=new marked.Renderer({highlight:highlightFun});
        renderer.code=function(code, infostring, escaped){
            const lang = (infostring || '').match(/\S*/)[0];
            if (this.options.highlight) {
                const out = this.options.highlight(code, lang);
                if (out != null /*&& out !== code*/) {//如不修改，页面中的空格会被转义成 %20
                    escaped = true;
                    code = out;
                }                
            }

            const finalCodeHtml=(escaped ? code : escape(code, true));
            if (!lang) {
                return `<pre style="background-color:${bgColor}"><code class="hljs">${finalCodeHtml}</code></pre>`;
            }

            return `<pre style="background-color:${bgColor}"><code class="hljs ${this.options.langPrefix+escape(lang, true)}">${finalCodeHtml}</code></pre>
                `;
        };


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
}

export default new MarkedHighlightUtil();