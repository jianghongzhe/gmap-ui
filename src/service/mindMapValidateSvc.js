/**
 * 
 */
class MindMapValidateSvc{

    /**
     * 格式校验，只验证节点部分，不验证引用部分
     * 1、内容不能为空
     * 2、每行开头必须是0或多个tab符和一个减号和一个空格，且空格后还有内容
     * 3、不能多个顶级主题，且顶级主题只能在第一行
     * 4、下一行的层级 <= 上一行+1
     * @param {*} txt
     * @returns {*} 验证通过返回true，失败返回文本消息
     */
    validate=(txt="")=>{
        try{
            return this.validateInner(txt);
        }catch(e){
            console.error(e);
            return "格式校验过程中发生错误";
        }
    }


    validateInner=(txt="")=>{
        //内容不能为空
        if(''===txt){
            return "请输入图表的文本内容";
        }
        const result=this.validateForLintTooltip(txt);
        if(true===result){
            return true;
        }
        return "内容中含有语法错误，不能保存";
    }


    /**
     * 内容格式语法验证
     * @param {*} txt 
     * @returns 
     * {line, pos1, pos2, msg} 语法有误 
     * false - 语法无误
     */
    validateForLintTooltip=(txt="")=>{
        //内容为空则忽略验证
        if(null===txt || ''===txt.trim()){
            return true;
        }

        // 内容整理，把行变成带有行号的对象数组{line,lineInd}，并且去掉引用部分
        let lines=txt.replaceAll("\r\n","\n").split("\n").map((line,lineInd)=>({line,lineInd}));
        const splitLine=lines.find(({line})=>"***"===line.trim());
        if(splitLine){
            lines=lines.splice(0, splitLine.lineInd);
        }

        //每行开头必须是0或多个tab符和一个减号和一个空格，且空格后还有内容
        const reg=/^\t*- .*$/;
        for(let {line,lineInd} of lines){
            if(''===line.trim()){
                continue;
            }
            if(!reg.test(line)){
                return {
                    line: lineInd,
                    pos1: 0,
                    pos2: line.length,
                    msg:  "格式有误，应为零或多个tab，紧接一个减号和一个空格，后面为正文内容：\r\n[tab][tab]- blabla",
                };
            }
            let txtPart=line.substring(line.indexOf("- ")+"- ".length);
            if(""===txtPart.trim()){
                return {
                    line: lineInd,
                    pos1: 0,
                    pos2: line.length,
                    msg:  "请填写正文内容",
                };
            }
        }

        //不能多个顶级主题，且顶级主题只能在第一个位置
        let meetFirstNd=false;
        for(let {line,lineInd} of lines){
            if(''===line.trim()){
                continue;
            }
            //第一个出现的主题：如果不是根主题，则不通过，否则置状态
            let isTopLev=(0===line.indexOf("- "));
            if(!meetFirstNd){
                if(!isTopLev){
                    return {
                        line: lineInd,
                        pos1: 0,
                        pos2: line.length,
                        msg:  "该行必须为顶级主题，即减号前不能有tab",
                    };
                }
                meetFirstNd=true;
                continue;
            }
            //非第一个主题：如果为根主题，则不通过
            if(isTopLev){
                return {
                    line: lineInd,
                    pos1: 0,
                    pos2: line.length,
                    msg:  "该行不能为顶级主题",
                };
            }          
        }

        //下一行的层级 <= 上一行+1
        let lastLev=-1;
        let hasLast=false;
        for(let {line,lineInd} of lines){
            if(''===line.trim()){
                continue;
            }
            //第一个节点
            let lev=line.indexOf("- ");
            if(!hasLast){
                lastLev=lev;
                hasLast=true;
                continue;
            }
            //非第一个节点
            if(hasLast && lev>lastLev+1){
                return {
                    line: lineInd,
                    pos1: 0,
                    pos2: line.length,
                    msg:  `该行层级有误，不能超过 ${lastLev+1} 个tab`,
                };
            }
            lastLev=lev;
        }
        return true;
    };


    
}

export default new MindMapValidateSvc();