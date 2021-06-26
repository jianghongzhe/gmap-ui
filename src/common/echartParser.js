class EchartParser{
    parse=(txt)=>{
        if(null==txt || ""==txt.trim()){
            throw "格式有误";
        }

        const lines=txt.split("\n").map(each=>each.trim()).filter(each=>""!==each);
        if("pie"===lines[0]){
            let title= "未知标题";
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
                if(/^\"[^:\"]+\"[ ]*:[ ]*[^ ]+$/.test(line)){
                    const name=line.substring(1,line.indexOf('"',1)).trim();
                    const value=parseFloat(line.substring(line.indexOf(":")+1).trim());
                    data.push({value, name});
                    return;
                }
                throw "未知的配置行："+line;
            });;

            const opt={
                title: {
                    text: title,
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
        }

        if("bar"===lines[0] || "line"===lines[0]){
            const graphType=lines[0];
            let title= "未知标题";
            let w="100%";
            let h="400px";
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
                if(line.startsWith(",")){
                    xLabs=line.split(",").map(each=>each.trim()).filter(each=>""!==each);
                    return;
                }
                if(/^[^,]+([,][ ]*[0-9]+([.][0-9]+)?[ ]*)+$/.test(line)){
                    const parts=line.split(",").map(each=>each.trim()).filter(each=>""!==each);
                    serItems.push({
                        name: parts[0],
                        type: graphType,
                        barGap: 0,
                        //label: {show:true,},
                        emphasis: {focus: 'series'},
                        data: parts.filter((each,ind)=>ind>0).map(each=>parseFloat(each))
                    });
                    return;
                }
                throw "未知的配置行："+line;
            });


            let opt={
                title: {
                                text: title,
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
            return {w, h, opt};
        }

        if("stack"===lines[0]){
            let title= "未知标题";
            let w="100%";
            let h="400px";
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
                if(line.startsWith(",")){
                    xLabs=line.split(",").map(each=>each.trim()).filter(each=>""!==each);
                    return;
                }
                if(/^[^,]+([,][ ]*[0-9]+([.][0-9]+)?[ ]*)+$/.test(line)){
                    const parts=line.split(",").map(each=>each.trim()).filter(each=>""!==each);
                    serItems.push({
                        name: parts[0],
                        type: 'bar',
                        stack:'__stack__',
                        barGap: 0,
                        //label: {show:true,},
                        emphasis: {focus: 'series'},
                        data: parts.filter((each,ind)=>ind>0).map(each=>parseFloat(each))
                    });
                    return;
                }
                throw "未知的配置行："+line;
            });


            let opt={
                title: {
                                text: title,
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
            return {w, h, opt};
        }

        if("bar-line"===lines[0] || "bar_line"===lines[0]){
            let title= "未知标题";
            let w="100%";
            let h="400px";
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
                if(line.startsWith(",")){
                    xLabs=line.split(",").map(each=>each.trim()).filter(each=>""!==each);
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
                throw "未知的配置行："+line;
            });


            let opt={
                title: {
                                text: title,
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
            return {w, h, opt};
        }

        throw `不支持的图表类型 [${lines[0]}]`;
    };
}

export default new EchartParser();