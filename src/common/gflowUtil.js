/**
 * gflow相关工具
 */
class GflowUtil{
    /**
     * action type是否包含模块名
     */
    isModelActionType=(type)=>regWithModel.test(type);

    /**
     * action type是否不包含模块名
     */
    isNoModelActionType=(type)=>regNoModel.test(type);

    /**
     * 对action type增加模块前缀，如果已经有了，则不变
     */
    addModelPrefix=(type,currModel)=>{
        if(this.isModelActionType(type)){
            return type;
        }
        return currModel+"/"+type;
    };

    /**
     * 连接模块名和action type
     */
    joinModNameAndActionType=(modName,actionType)=>{
        return modName+"/"+actionType;
    }

    /**
     * action type名称是否指明是promise类型（程序中除该方式外，还有另一方式判断是否是promise类型action）
     */
    isPromiseActionType=(actionType)=>{
        return needPromiseReg.test(actionType.trim());
    }

    /**
     * 是否是生成器
     */
    isGen=(fn)=>{
        if(!fn){
            return false;
        }
        return "function"===typeof(fn) && 0<=(""+fn.prototype).toLowerCase().indexOf("generator");
    }
};


/**
 * 带有模块的正则
 * aaa/bbb
 */
const regWithModel=/^[^/]+[/][^/]+$/;

/**
 * 不带模块的正则
 * xyz
 */
const regNoModel=/^[^/]+$/;


//根据action.type判断是否需要返回promise的正则
//1、promiseAddUser          不带命名空间，以promise作为前缀
//2、addUserPromise          不带命名空间，以promise作为后缀
//3、user/promiseAddUser     带命名空间，以promise作为前缀
//4、user/addUserPromise     带命名空间，以promise作为后缀
const needPromiseReg=/^([^/]+[/])?((promise[^/]+)|([^/]+promise))$/i;



export default new GflowUtil();