import loadMetaData, {parseMetadata} from './metadataLoader';

/**
 * 对表格html串增强：
 * 通过提取表格中的元数据信息，生成对应的echart图html串并插入原html串中
 * @param html
 * @return {string}
 */
const tableEnh= (html, idCreater)=>{
    try {
        return innerEnhancer(html, idCreater);
    }catch (e){
        return `${createErrorHtmlStr(e, '无法加载图表：')}${html}`;
    }
};


const innerEnhancer=(html, idCreater)=>{

    // 提取表格中的元数据
    // 提取表格中的数据（去掉元数据后的值）
    // 去掉表格对象中的元数据
    let metas=[];
    const barLineSeriesConfig=[];
    const lines=[];
    const tableEle=new DOMParser().parseFromString(html, "text/html").querySelector("table");
    let hasBarLineChart=false;
    tableEle.querySelectorAll("tr").forEach((tr,rowInd)=>{
        const line=[];
        tr.querySelectorAll("th,td").forEach((td,colInd)=>{
            const originVal=td.innerHTML.trim();
            let val=originVal;

            // 首行第一列为图表元数据，如果其中有柱线混合图则记录一个标识
            if(0===colInd && 0===rowInd){
                [val, metas]=loadMetaData(val);
                hasBarLineChart=metas.some(meta=>"bar-line"===meta || meta.startsWith("bar-line{"));
            }
            // 如果图表元数据中包含柱线混合图，则第二行到最后一行的第一列中都包含系列相关的配置元数据，且每个格只取第一个元数据
            if(0===colInd && 0<rowInd && hasBarLineChart){
                let tmp=null;
                [val, tmp]=loadMetaData(val);
                if(0<tmp.length){
                    barLineSeriesConfig.push(tmp[0]);
                }
            }
            // 如果去掉元数据后的单元格值与之前不同，则修改
            if(val!==originVal){
                td.innerHTML=val;
            }
            line.push(val);
        });
        lines.push(line);
    });



    // 解析元数据 {type, opts, serialConfig}
    const chartTypes=metas.reduce((currChartTypes, meta)=>{
        const {type, opts}=parseMetadata(meta);
        if(!currChartTypes.some(eachType=>type===eachType.type)){
            currChartTypes.push({
                type,
                opts,
                serialConfig: 'bar-line'===type ? barLineSeriesConfig : null,
            });
        }
        return currChartTypes;
    },[]);



    // 根据图表元数据和解析得到的单元格数据计算出图表的html文本
    let extraContent='';
    chartTypes.forEach(({type,opts,serialConfig})=>{
        if(!parsers[type]){
            extraContent+=createErrorHtmlStr(`未知的图表类型：${type}`);
            return;
        }
        if(parsers[type]){
            let resultHtml='';
            try {
                resultHtml = parsers[type](lines, {type, opts, serialConfig}, idCreater);
            }catch (e){
                resultHtml=createErrorHtmlStr(e);
            }
            if(resultHtml){
                extraContent+=resultHtml;
            }
        }
    });
    return `${extraContent}${tableEle.outerHTML}`;
};

const createErrorHtmlStr=(err, prefix='')=>{
    let msg='';
    if('string'===typeof(err)){
        msg=(prefix ? prefix : '')+err;
    }else if(err.message){
        msg=(prefix ? prefix : '')+err.message;
    }else{
        msg="无法加载图表";
    }

    return `<div style="color:red; padding:10px; margin-top:20px; margin-bottom:20px; width:70%; border:1px solid red;border-radius: 5px;">${msg}</div>`;

};


/**
 * 柱图、拆线图、堆积图解析器
 * @param lines
 * @param type
 * @param opts
 * @param serialConfig
 * @param eleId
 * @return {string}
 */
const barLineStackParser=(lines, {type,opts,serialConfig}, idCreater)=>{
    const chartTypeCn=('bar'===type ? "柱状图" : ('line'===type ? "拆线图" : ('stack'===type ? "堆积图" : "其它图")));

    // 需要有标题行和至少一个数据行
    if(lines.length<2){
        throw new Error(`无法加载${chartTypeCn}，没有有效数据行`);
    }

    // x轴的配置：  ,2015,2016,2017
    const xAxis= lines[0].map((val,ind)=>(0===ind ? '' : val.trim())).join(',');

    // 数据行的配置：
    // 苹果,25,30,40
    // 桔子,20,40,70
    const dataLines=lines.filter((val,ind)=>ind>0).map(vals=> vals.map(v=>v.trim()).join(","));

    const eleId=idCreater();
    return `<div>
                    <div class="echart-graph" style='display:none;' targetid='${eleId}' handled='false'>
${type}
${opts.join("\n")}
${xAxis}
${dataLines.join("\n")}
                    </div>
                    <div id='${eleId}'></div>
                </div>`;
};


/**
 * 饼图解析器
 * @param lines
 * @param type
 * @param opts
 * @param serialConfig
 * @param eleId
 * @return {string}
 */
const pieParser=(lines, {type,opts,serialConfig}, idCreater)=>{
    // 需要有标题行和唯一一个数据行
    if(lines.length<2){
        throw new Error(`无法加载饼图，没有有效数据行`);
    }
    if(2!==lines.length){
        throw new Error(`无法加载饼图，只允许有一个数据行`);
    }
    const dataLines=[];
    const cols=Math.min(lines[0].length, lines[1].length);
    for (let i = 0; i < cols; ++i) {
        const value=lines[1][i].trim();
        let label=lines[0][i].trim();
        if(!label.startsWith("\"")){
            label="\""+label;
        }
        if(!label.endsWith("\"")){
            label+="\"";
        }
        dataLines.push(`${label}:${value}`);
    }

    const eleId=idCreater();
    return `<div>
                <div class="echart-graph" style='display:none;' targetid='${eleId}' handled='false'>
pie
${opts.join("\n")}
${dataLines.join("\n")}
                </div>
                <div id='${eleId}'></div>
            </div>`;
};


/**
 * 柱线混合图解析器
 * @param lines
 * @param type
 * @param opts
 * @param serialConfig
 * @param eleId
 * @return {string}
 */
const barLineMixParser=(lines, {type,opts,serialConfig}, idCreater)=>{
    // 需要有标题行和至少一个数据行
    if(lines.length<2){
        throw new Error(`无法加载柱线图，没有有效数据行`);
    }
    // 柱线图每个数据行都要指定分类
    if(serialConfig.length!==lines.length-1){
        throw new Error(`无法加载柱线图，数据行中未指定线条类型（bar、line、stack:xx）`);
    }

    // 数据行上的分类只能是指定格式：bar、line、stack:xx
    for (const eachConfig of serialConfig) {
        const match=(
            'bar'===eachConfig ||
            'line'===eachConfig ||
            (eachConfig.startsWith("stack:") && eachConfig.length>"stack:".length)
        );
        if(!match){
            throw new Error(`无法加载柱线图，未知的线条类型 ${eachConfig}`);
        }
    }


    // x轴的配置：  ,2015,2016,2017
    const xAxis= lines[0].map((val,ind)=>(0===ind ? '' : val.trim())).join(',');

    // stack 食品
    // - bar,三餐,500,400,300
    // - bar,食品,500,400,300
    // bar,娱乐,600,400,600
    // line,参考值,500,200,300
    const dataLines=[];
    const cates=[];
    lines.filter((val,ind)=>ind>0).forEach((val,ind)=>{
        if('bar'===serialConfig[ind] || 'line'===serialConfig[ind]){
            cates.push({
                type: '',
                txt:  [serialConfig[ind], ...val].join(",")
            });
            return;
        }
        if(serialConfig[ind].startsWith("stack:")){
            const groupName=serialConfig[ind].substring("stack:".length).trim();
            const existItem= cates.find(cate=>groupName===cate.type);
            if(existItem){
                existItem.txt.push(['- bar', ...val].join(","));
                return;
            }
            cates.push({
                type:groupName,
                txt:[
                    `stack ${groupName}`,
                    ['- bar', ...val].join(","),
                ],
            });
        }
    });
    cates.forEach(cate=>{
        if(''===cate.type){
            dataLines.push(cate.txt);
            return ;
        }
        cate.txt.forEach(eachLine=>dataLines.push(eachLine));
    });


    const eleId=idCreater();
    return `<div>
                        <div class="echart-graph" style='display:none;' targetid='${eleId}' handled='false'>
bar-line
${opts.join("\n")}
${xAxis}
${dataLines.join("\n")}
                        </div>
                        <div id='${eleId}'></div>
                    </div>`;
};


const parsers= {
    bar: barLineStackParser,
    line: barLineStackParser,
    stack: barLineStackParser,
    pie: pieParser,
    'bar-line' : barLineMixParser,
};

export default tableEnh;