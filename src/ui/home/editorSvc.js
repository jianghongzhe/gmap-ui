class EditorSvc{
    /**
     * 设置指定行的颜色标记，如果未指定颜色，则说明清除颜色标记
     * @param {*} originLine 原始行的内容
     * @param {*} color 颜色，如果未指定，则说明清除颜色标记
     * @returns 处理后的行的内容
     */
    setColor=(originLine,color=null)=>{
        //拆分成项目符号部分和后面部分
        let resultLine=originLine;
        let left='';
        let regStart=/^\t*[-].*$/;
        if(regStart.test(resultLine)){
            let ind=resultLine.indexOf("-");
            left=resultLine.substring(0,ind+1)+" ";
            resultLine=resultLine.substring(ind+1).trim();
        }

        //后面部分处理，过滤掉颜色标识
        let regColor=/^c:.+$/;
        let right=resultLine.split("|").map(item=>item.trim()).filter(item=>!regColor.test(item)).join("|");

        //把项目符号、颜色（可能有）、后面部分重新拼接
        resultLine=left+(color?"c:"+color+"|":"")+right;
        return resultLine;
    }   
    
    addPic=(originLine,pos,picRelaPath)=>{
        let resultLine=originLine;

        let before=resultLine.substring(0,pos);
        before=(''===before?'':before+" ");
        let after=resultLine.substring(pos);
        after=(''===after?'':" "+after);

        let addCont="![]("+picRelaPath.trim()+")";

        resultLine=before+addCont+after;
        return {
            newLinetxt: resultLine,
            cusorPos:before.length+addCont.length
        };
    }
}

export default new EditorSvc();