/**
 * 提取字符串中的元数据：
 * 你好#abc#def -> ['你好', ['abc','def']]
 * @param txt
 * @return [
 *      '去掉元数据的字符串',
 *      ['元数据1', '元数据2', ...]
 * ]
 */
const loader= (txt)=>{
    txt=(txt??'').trim();
    let metas=(txt.match(/[#][^#]*/g)??[]).map(item=>{
        txt=txt.replace(item, '').trim();
        return item.substring(1).trim()
    }).filter(item=>null!==item && ''!==item);
    return [txt, [...new Set(metas)]];
};


/**
 *
 * @param meta
 * @return {opts:[], type: string}
 */
const parseMetadata=(meta)=>{
    meta=(meta??'').trim();
    const ind1=meta.indexOf("{");
    let ind2=meta.lastIndexOf("}");
    if(ind1>=0){
        if(!(ind1<ind2)){
            ind2=meta.length;
        }

        // 如果元数据为icon，则 { } 之间的内容看作一个整体，不拆分。否则按逗号拆分
        const type= meta.substring(0, ind1).trim();
        if('icon'===type){
            return {
                type,
                opts: [
                    meta.substring(ind1+1, ind2).trim(),
                ],
            };
        }
        const opts=meta.substring(ind1+1, ind2).split(",").map(t=>t.trim()).filter(t=>null!==t && ''!==t);
        return {type, opts};
    }
    return {
        type: meta,
        opts: [],
    };
};





export default loader;

export {
    parseMetadata
};