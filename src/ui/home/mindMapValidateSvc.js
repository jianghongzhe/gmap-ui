/**
 * 
 */
class MindMapValidateSvc{






    /**
     * 1、内容不能为空
     * 2、每行开头必须是0或多个tab符和一个减号和一个空格，且空格后还有内容
     * 3、不能多个顶级主题，且顶级主题只能在第一行
     * 4、下一行的层级 <= 上一行+1
     * @param {*} txt
     * @returns {*} 验证通过返回true，失败返回文本消息
     */
    validate=(txt="")=>{
        txt=txt.trim();

        //内容不能为空
        if(''===txt){
            return "请输入图表的文本内容";
        }

        //每行开头必须是0或多个tab符和一个减号和一个空格，且空格后还有内容
        let lines=txt.split("\n");
        let ret=/^\t*- .+$/;
        let lineInd=0;
        for(let line of lines){
            if(''===line.trim()){
                return "第 "+(lineInd+1)+" 行不能为空";
            }
            if(!ret.test(line)){
                return "第 "+(lineInd+1)+" 行的格式有误";
            }
            let txtPart=line.substring(line.indexOf("- ")+"- ".length);
            if(""===txtPart.trim()){
                return "第 "+(lineInd+1)+" 必须有文字内容";
            }
            ++lineInd;
        }

        //不能多个顶级主题，且顶级主题只能在第一行
        let topLevThemeCnt=0;
        lineInd=0;
        for(let line of lines){
            let isTopLev=(0===line.indexOf("- "));
            if(0===lineInd && !isTopLev){
                return "第一行必须为顶级主题";
            }
            if(isTopLev){
                ++topLevThemeCnt;
                if(1<topLevThemeCnt){
                    return "只能有一个顶级主题且只能在第一行（第 "+(lineInd+1)+" 行）";
                }
            }          
            ++lineInd;
        }

        //下一行的层级 <= 上一行+1
        lineInd=0;
        let lastLev=-1;
        for(let line of lines){
            let lev=line.indexOf("- ");
            if(0<lineInd){
                console.log("上一行",lastLev);
                if(lev>lastLev+1){
                    return "第 "+(lineInd+1)+" 行的层级最多只能比上一行多一级";
                }
            }
            lastLev=lev;
            ++lineInd;
        }
        


        return true;
    }
}

export default new MindMapValidateSvc();