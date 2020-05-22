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

        //每行开头必须是0或多个tab符和一个减号和一个空格，且空格后还有内容
        let lines=txt.split("\n");
        let ret=/^\t*- .+$/;
        let lineInd=0;
        for(let line of lines){
            if("***"===line.trim()){
                break;
            }
            if(''===line.trim()){
                ++lineInd;
                continue;
            }

            //todo 数据可断行后此处要调整
            if(!ret.test(line)){
                return "第 "+(lineInd+1)+" 行的格式有误";
            }
            let txtPart=line.substring(line.indexOf("- ")+"- ".length);
            if(""===txtPart.trim()){
                return "第 "+(lineInd+1)+" 必须有文字内容";
            }
            ++lineInd;
        }

        //不能多个顶级主题，且顶级主题只能在第一个位置
        lineInd=0;
        let meetFirstNd=false;
        for(let line of lines){
            if("***"===line.trim()){
                break;
            }
            if(''===line.trim()){
                ++lineInd;
                continue;
            }

            //第一个出现的主题：如果不是根主题，则不通过，否则置状态
            let isTopLev=(0===line.indexOf("- "));
            if(!meetFirstNd){
                if(!isTopLev){
                    return "第 "+(lineInd+1)+" 行必须为顶级主题";
                }
                meetFirstNd=true;
                ++lineInd;
                continue;
            }

            //非第一个主题：如果为根主题，则不通过
            if(isTopLev){
                return "第 "+(lineInd+1)+" 行不能为顶级主题";
            }          
            ++lineInd;
        }

        //下一行的层级 <= 上一行+1
        lineInd=0;
        let lastLev=-1;
        let hasLast=false;
        for(let line of lines){
            if("***"===line.trim()){
                break;
            }
            if(''===line.trim()){
                ++lineInd;
                continue;
            }

            //第一个节点
            let lev=line.indexOf("- ");
            if(!hasLast){
                lastLev=lev;
                ++lineInd;
                hasLast=true;
                continue;
            }

            //todo 数据可断行后此处要调整 afterWrapLine
            //非第一个节点
            if(hasLast && lev>lastLev+1){
                return "第 "+(lineInd+1)+" 行的层级有误";
            }
            lastLev=lev;
            ++lineInd;
        }
        return true;
    }
}

export default new MindMapValidateSvc();