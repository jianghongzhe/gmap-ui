/**
 * gflow相关工具
 */

 const regWithModel=/^[^/]+[/][^/]+$/;
const regNoModel=/^[^/]+$/;;


class GflowUtil{
    isModelActionType=(type)=>regWithModel.test(type);
    isNoModelActionType=(type)=>regNoModel.test(type);
    addModelPrefix=(type,currModel)=>{
        if(this.isModelActionType(type)){
            return type;
        }
        return currModel+"/"+type;
    };
};

export default new GflowUtil();