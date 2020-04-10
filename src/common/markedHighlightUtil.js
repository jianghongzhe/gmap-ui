import { cleanUrl, escape as doEscape } from 'marked/src/helpers';

/**
 * marked结合hljs实现语法高亮与点击事件处理等功能
 */
class MarkedHighlightUtil {

    constructor(){
        this.mdLinkCls="gmap_mk_link_"+new Date().getTime();
        this.mdImgCls="gmap_mk_img_"+new Date().getTime();
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
        //代码高亮函数
        const highlightFun = (code, language) => {
            let tmp = hljs.getLanguage(language);
            const validLanguage = tmp ? language : 'plaintext';
            return hljs.highlight(validLanguage, code).value;
        };

        //渲染器实现，对原代码做如下修改：
        //1、解决marked生成的html中没有hljs样式的问题
        //2、解决hljs中背景颜色样式没有github-markdown-css优先级高的问题
        const renderer = new marked.Renderer({ highlight: highlightFun });
        if (codeConfig) {
            renderer.code = function (code, infostring, escaped) {
                //高亮处理
                const lang = (infostring || '').match(/\S*/)[0];
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
            renderer.link = function (href, title, text) {
                href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
                if (href === null) {
                    return text;
                }

                let newHref=href;
                if(linkConfig.convertUrl){
                    newHref=linkConfig.convertUrl(newHref);
                }
                let out = `<a class="${mdLinkCls}" href="${doEscape(newHref)}" `;
                if(linkConfig.disableDefault){
                    out = `<a class="${mdLinkCls}" href="javascript:void(0);" hrefex="${doEscape(newHref)}" `;
                }                
                if (title) {
                    out += `title="${title}" `;
                }
                out =out.trim()+ `>${text}</a>`;
                return out;
            };
        }


        //-----------图片----------------------------
        if(imgConfig){
            renderer.image=function(href, title, text) {
                href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
                if (href === null) {
                  return text;
                }
            
                let newHref=href;
                if(imgConfig.convertUrl){
                    newHref=imgConfig.convertUrl(newHref);
                }
                let out = `<img class="${mdImgCls}" style="display:block;" src="${newHref}" alt="${text}"`;
                if (title) {
                  out += ` title="${title}"`;
                }
                out += '/>';
                return out;
            }
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
            ele.addEventListener("click",()=>{cb(addr,ele);});//增加点击事件，点击时使用外部浏览器打开
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
            let addr=ele.getAttribute('src');
            ele.addEventListener("click",()=>{cb(addr,ele);});//本地打开时使用不带随机参数的url
        });
    }
}

export default MarkedHighlightUtil;