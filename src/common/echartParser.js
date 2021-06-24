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

            // let tmp= lines.filter(line=>line.startsWith("title ") || line.startsWith("title　"));
            // let title=(tmp && tmp.length>0 ? tmp[0].substring("title ".length).trim() : "未知标题");
            console.log(title);
            console.log(w);
            console.log(h);


            const opt={
                title: {
                    text: title,
                    //subtext: '纯属虚构',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'item',
                    // formatter: '{b} {c}  ({d}%)',
                },
                legend: {
                    orient: 'vertical',
                    left: 'left',
                },
                series: [
                    {
                        name: '',//'访问来源',
                        type: 'pie',
                        radius: '50%',
                        label : {
                            　　　　normal : {
                            // 　　　　　　formatter: '{b} {c}  ({d}%)',
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

        throw `不支持的图表类型 [${lines[0]}]`;
    };
}

export default new EchartParser();