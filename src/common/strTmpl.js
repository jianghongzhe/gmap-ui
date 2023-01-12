/**
 * 字符串模板的解析、替换工具类
 */
class StrTmpl{

    /**
     * 是否包含占位符
     * @param txt
     * @returns {boolean}
     */
    containsParam=(txt)=>(/[{][{][^{}]+?[}][}]/g).test(txt);

    /**
     * 解析字符串中的模板参数：
     * abc{{name}}def - 不带默认值
     * abc{{name:xxx}}def - 带默认值
     * @returns null - 没有模板参数，json数组对象 - 模板参数及默认值
     * [
     *  {
     *      name: '参数名称',
     *      def: '参数默认值',
     *      matchPart: '原字符串中的匹配项文本',
     *      value: '参数实际的值，解析后默认为def的值，待用户填写后替换为实际的值'
     *  }
     * ]
     */
    parse=(txt)=>{
        let matches=txt.match(/[{][{][^{}]+?[}][}]/g);
        if(!matches || null===matches || 0===matches.length){
            return null;
        }
        return matches.map(each=>{
            let tmp=each.substring(2, each.length-2).trim();
            const ind=tmp.indexOf(":");
            if(ind>0 && ind<tmp.length-1){
                return {
                    name: tmp.substring(0, ind).trim(),
                    def: tmp.substring(ind+1).trim(),
                    matchPart: each,
                    value: tmp.substring(ind+1).trim(),
                };
            }
            return {
                name: tmp,
                def: '',
                matchPart: each,
                value: '',
            };
        });
    };


    /**
     * 进行替换
     * @param {*} txt 字符串
     * @param {*} replaceItems 类型与parse方法返回值相同，其中已填入value值
     */
    replace=(txt, replaceItems)=>{
        if(!replaceItems || null===replaceItems){
            return txt;
        }
        replaceItems.forEach(each=>{
            txt=txt.replace(each.matchPart, each.value);
        });
        return txt;
    };
}

const inst=new StrTmpl();
export default inst;