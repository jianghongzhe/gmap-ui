class EchartParser{
    constructor(){
        this.typeHandlerMap={
            "pie": this.loadPieConfig,
            "bar": this.loadBarOrLineOrStackConfig,
            "line": this.loadBarOrLineOrStackConfig,
            "stack": this.loadBarOrLineOrStackConfig,
            "scatter": this.loadScatterConfig,
            "bar-line": this.loadBarLineStackCustomOption,
            "bar_line": this.loadBarLineStackCustomOption,
            "graph": this.loadGraphConfig,
        };
    }

    parse=(txt)=>{
        if(null===txt || ""===txt.trim()){
            throw new Error("格式有误");
        }
        txt=txt.trim();

        // json形式的配置 {...}
        if(txt.startsWith("{") && txt.endsWith("}")){
            return this.loadJsonConfig(txt);
        }

        // 首行是图表类型的情况，按类型分发不同处理函数进行处理
        const lines=txt.split("\n").map(each=>each.trim()).filter(each=>""!==each);
        const graphType=lines[0];
        if(!this.typeHandlerMap[graphType]){
            throw new Error(`不支持的图表类型 [${lines[0]}]`);
        }
        return this.typeHandlerMap[graphType](lines);
    };

    /**
     * 加载json形式的echart配置
     * @param {*} txt 
     * @returns 
     */
    loadJsonConfig=(txt)=>{
        let json=new Function(`return (${txt});`)(); //eval(`(${txt})`);
        let {w,h,...opt}=json;
        if(!w){
            w="100%";
        }
        if(!h){
            h="400px";
        }
        return {w,h,opt};
    };

    loadGraphConfig=(lines)=>{
        let title= null;
        let w="100%";
        let h="400px";
        let sumOpts=[];
        lines.filter((line,ind)=>ind>0).forEach(line => {
            if(line.startsWith("title ")){
                title=line.substring("title ".length).trim();
                return;
            }
            if(line.startsWith("w ")){
                w=line.substring("w ".length).trim();
                return;
            }
            if(line.startsWith("h ")){
                h=line.substring("h ".length).trim();
                return;
            }
            if(/^[^,]+[,][^,]+[,][^,]+$/.test(line)){
                const parts=line.split(",").map(each=>each.trim()).filter(each=>""!==each);
                if(3!==parts.length){
                    throw new Error("无效的配置行："+line);
                }
                sumOpts.push(parts);
                return;
            }
            if(/^[^,]+[,][^,]+$/.test(line)){
                const parts=line.split(",").map(each=>each.trim()).filter(each=>""!==each);
                if(2!==parts.length){
                    throw new Error("无效的配置行："+line);
                }
                sumOpts.push([...parts,""]);
                return;
            }
            throw new Error("未知的配置行："+line);
        });

        let names=[];
        sumOpts.forEach(line=>{
            names.push(line[0]);
            names.push(line[1]);
        });
        names=Array.from(new Set(names));
        
        const data=names.map(item=>({name:item}));
        const links=sumOpts.map(line=>({
            source: line[0],
            target: line[1],
            //symbolSize: [4, 10],
            label: {
                show: true,
                formatter:line[2] ? line[2] : "",
            },
            tooltip:{
                show:line[2] ? true : false,
                formatter:line[2] ? line[2] : "",
            },
        }));
    
        const opt={
            title: {
                text: title ? title.trim() : "",
                left: 'center',
            },
            tooltip: {
                show:true,
                trigger:'item',
            },
            animationDurationUpdate: 1500,
            animationEasingUpdate: 'quinticInOut',
            color:['#5470c6','#91cc75','#fac858','#ee6666','#73c0de','#3ba272', '#fc8452','#9a60b4','#ea7ccc',],
            textStyle:{
                width:600,
                overflow:'truncate',
                ellipsis:'...',
            },
            series: [
                {
                    type: 'graph',
                    layout: 'force',
                    force: {
                        repulsion: 4000
                    },
                    symbolSize: 60,
                    roam: true,
                    draggable:true,
                    emphasis:{
                        focus: 'adjacency',
                    },
                    label: {
                        show: true,
                        formatter:"{b}",
                    },
                    edgeSymbol: ['none', 'arrow',/*'none', 'none'*/],
                    edgeSymbolSize: [0,10,/*10*/],
                    edgeLabel: {
                        fontSize: 12
                    },
                    tooltip:{
                        show:true,
                        formatter:"{b}",
                    },
                    lineStyle: {
                        opacity: 0.9,
                        width: 1,
                        curveness: 0
                    },
        
                    data: data,                  
                    links: links,
                }
            ]
        };

        return {w,h,opt};
    };

    loadPieConfig=(lines)=>{
        let title= null;
        let w="100%";
        let h="400px";
        let data=[];
        lines.filter((line,ind)=>ind>0).forEach(line => {
            if(line.startsWith("title ")){
                title=line.substring("title ".length).trim();
                return;
            }
            if(line.startsWith("w ")){
                w=line.substring("w ".length).trim();
                return;
            }
            if(line.startsWith("h ")){
                h=line.substring("h ".length).trim();
                return;
            }
            if(/^"[^:"]+"[ ]*:[ ]*[^ ]+$/.test(line)){
                const name=line.substring(1,line.indexOf('"',1)).trim();
                const value=parseFloat(line.substring(line.indexOf(":")+1).trim());
                data.push({value, name});
                return;
            }
            throw new Error("未知的配置行："+line);
        });

        const opt={
            title: {
                text: title ? title.trim() : "",
                //subtext: '纯属虚构',
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                /**
                 * tooltip格式化方法
                 * @param {*} param {
                 *  marker: 小圆点
                 *  name: 项名
                 *  value: 值
                 *  percent: 百分比
                 * }
                 * @returns 
                 */
                formatter: (param)=>{
                    return `
                        ${param.marker}
                        <span style="display:inline-block;margin-left:0px;">${param.name}</span>
                        <span style="display:inline-block;margin-left:4px;">${param.value}</span>
                        <span style="display:inline-block;margin-left:4px;">(${param.percent}%)</span>
                    `;
                },
            },
            legend: {
                // orient: 'vertical',
                // left: 'left',

                right:'0%',
                top:'middle',
                orient: 'vertical',
                align:'right',
            },
            series: [
                {
                    name: '',//'访问来源',
                    type: 'pie',
                    radius: '50%',
                    label : {
                　　　　normal : {
                            // formatter: '{b} {c}  ({d}%)',
                　　　　    textStyle : {
                　　　　　　　　fontWeight : 'normal',
                　　　　　　　　fontSize : 15
                　　　　　　}
                　　　　}
                　　},
                    data: data,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };

        return {w, h, opt};
    };

    loadScatterConfig=(lines)=>{
        let title= null;
        let w="100%";
        let h="400px";
        let xName=null;
        let yName=null;
        let data=[];
        lines.filter((line,ind)=>ind>0).forEach(line => {
            if(line.startsWith("title ")){
                title=line.substring("title ".length).trim();
                return;
            }
            if(line.startsWith("w ")){
                w=line.substring("w ".length).trim();
                return;
            }
            if(line.startsWith("h ")){
                h=line.substring("h ".length).trim();
                return;
            }
            if(line.startsWith("x ")){
                xName=line.substring("x ".length).trim();
                return;
            }
            if(line.startsWith("y ")){
                yName=line.substring("y ".length).trim();
                return;
            }
            if(/^[^,]+([,][^,]+)+$/.test(line)){
                const strs=line.split(",").map(each=>each.trim()).filter(each=>""!==each);
                const serName=strs[0];
                const serData=strs.filter((each,ind)=>ind>0).map(each=>{
                    let coor=each.split(" ").filter(item=>item.trim()).filter(item=>""!==item);
                    return [parseFloat(coor[0]), parseFloat(coor[1])];
                });
                data.push({
                    symbolSize: 10,
                    name: serName,
                    type: 'scatter',
                    data: serData,
                });
                return;
            }
            throw new Error("未知的配置行："+line);
        });


        const opt={
            title: {
                text: title ? title.trim() : "",
                //subtext:'qqq',
                left: 'center',
            },
            tooltip: {
                trigger: 'item',
                axisPointer: {
                    type: 'shadow'
                },
                formatter: (param)=>{
                    return `
                        ${param.marker}
                        <span style="display:inline-block;margin-left:0px;">${param.seriesName}</span>
                        <span style="display:inline-block;margin-left:10px;">( ${param.value[0]}, ${param.value[1]} )</span>
                    `;
                }
            },
            legend: {
                right:'0%',
                top:'middle',
                orient: 'vertical',
                align:'right',
            },
            xAxis: {},
            yAxis: {},
            series: data,
        };
        if(xName){
            opt.xAxis.show=true;
            opt.xAxis.name=xName;
            opt.xAxis.nameTextStyle={fontSize :15};
        }
        if(yName){
            opt.yAxis.show=true;
            opt.yAxis.name=yName;
            opt.yAxis.nameTextStyle={fontSize :15};
        }
        return {w, h, opt};
    };

    loadBarOrLineOrStackConfig=(lines)=>{
        const graphType=lines[0];
        let title= null;
        let w="100%";
        let h="400px";
        let xName=null;
        let yName=null;
        let xLabs=[];
        let serItems=[];

        lines.filter((line,ind)=>ind>0).forEach(line => {
            if(line.startsWith("title ")){
                title=line.substring("title ".length).trim();
                return;
            }
            if(line.startsWith("w ")){
                w=line.substring("w ".length).trim();
                return;
            }
            if(line.startsWith("h ")){
                h=line.substring("h ".length).trim();
                return;
            }
            if(line.startsWith("x ")){
                xName=line.substring("x ".length).trim();
                return;
            }
            if(line.startsWith("y ")){
                yName=line.substring("y ".length).trim();
                return;
            }
            if(line.startsWith(",")){
                xLabs=line.split(",").map(each=>each.trim()).filter(each=>""!==each);
                return;
            }
            if(/^[^,]+([,][ ]*[0-9]+([.][0-9]+)?[ ]*)+$/.test(line)){
                const parts=line.split(",").map(each=>each.trim()).filter(each=>""!==each);
                const item={
                    name: parts[0],
                    type: 'stack'=== graphType ? 'bar' : graphType,
                    barGap: 0,
                    //label: {show:true,},
                    emphasis: {focus: 'series'},
                    data: parts.filter((each,ind)=>ind>0).map(each=>parseFloat(each))
                };
                if('stack'=== graphType){
                    item.stack="__stack__";
                }
                serItems.push(item);
                return;
            }
            throw new Error("未知的配置行："+line);
        });


        let opt={
            title: {
                text: title ? title.trim() : "",
                left: 'center',
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            legend: {
                right:'0%',
                top:'middle',
                orient: 'vertical',
                align:'right',
            },
            
            xAxis: [
                {
                    type: 'category',
                    axisTick: {show: false},
                    data: xLabs
                }
            ],
            yAxis: [
                {
                    type: 'value'
                }
            ],
            series: serItems
        };
        if(xName){
            opt.xAxis[0].show=true;
            opt.xAxis[0].name=xName;
            opt.xAxis[0].nameTextStyle={fontSize :15};
        }
        if(yName){
            opt.yAxis[0].show=true;
            opt.yAxis[0].name=yName;
            opt.yAxis[0].nameTextStyle={fontSize :15};
        }
        return {w, h, opt};
    };

    loadBarLineStackCustomOption=(lines)=>{
        let title= null;
        let w="100%";
        let h="400px";
        let xName=null;
        let yName=null;
        let xLabs=[];
        let serItems=[];
        let currStack=null;

        lines.filter((line,ind)=>ind>0).forEach(line => {
            if(line.startsWith("title ")){
                title=line.substring("title ".length).trim();
                return;
            }
            if(line.startsWith("w ")){
                w=line.substring("w ".length).trim();
                return;
            }
            if(line.startsWith("h ")){
                h=line.substring("h ".length).trim();
                return;
            }
            if(line.startsWith("x ")){
                xName=line.substring("x ".length).trim();
                return;
            }
            if(line.startsWith("y ")){
                yName=line.substring("y ".length).trim();
                return;
            }
            if(line.startsWith("stack ")){
                currStack=line.substring("stack ".length).trim();
                return;
            }
            if(line.startsWith(",")){
                xLabs=line.split(",").map(each=>each.trim()).filter(each=>""!==each);
                return;
            }
            if(/^[-] [^,]+[ ]*[,][ ]*[^,]+([ ]*[,][ ]*[0-9]+([.][0-9]+)?[ ]*)+$/.test(line)){
                if(!currStack){
                    throw new Error("还未设置堆积系列的组名");
                }
                const parts=line.substring(2).split(",").map(each=>each.trim()).filter(each=>""!==each);
                serItems.push({
                    name: parts[1],
                    type: parts[0],
                    barGap: 0,
                    //label: {show:true,},
                    emphasis: {focus: 'series'},
                    stack: currStack,
                    data: parts.filter((each,ind)=>ind>1).map(each=>parseFloat(each))
                });
                return;
            }
            if(/^[^,]+[ ]*[,][ ]*[^,]+([ ]*[,][ ]*[0-9]+([.][0-9]+)?[ ]*)+$/.test(line)){
                const parts=line.split(",").map(each=>each.trim()).filter(each=>""!==each);
                serItems.push({
                    name: parts[1],
                    type: parts[0],
                    barGap: 0,
                    //label: {show:true,},
                    emphasis: {focus: 'series'},
                    data: parts.filter((each,ind)=>ind>1).map(each=>parseFloat(each))
                });
                return;
            }
            
            throw new Error("未知的配置行："+line);
        });

        let opt={
            title: {
                text: title ? title.trim() : "",
                left: 'center',
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            legend: {
                right:'0%',
                top:'middle',
                orient: 'vertical',
                align:'right',
            },
            
            xAxis: [
                {
                    type: 'category',
                    axisTick: {show: false},
                    data: xLabs
                }
            ],
            yAxis: [
                {
                    type: 'value'
                }
            ],
            series: serItems
        };
        if(xName){
            opt.xAxis[0].show=true;
            opt.xAxis[0].name=xName;
            opt.xAxis[0].nameTextStyle={fontSize :15};
        }
        if(yName){
            opt.yAxis[0].show=true;
            opt.yAxis[0].name=yName;
            opt.yAxis[0].nameTextStyle={fontSize :15};
        }
        return {w, h, opt};
    };
}

export default new EchartParser();