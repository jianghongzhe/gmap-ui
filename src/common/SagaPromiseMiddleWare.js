/**
 * 用来的对saga中间件进行增强，以支持返回值，该中间件应放在saga中间件之前
 * @param {*} param0 
 */
const sagaPromiseMiddleWare= (({ getState, dispatch })=>next=>action=>{

    //如果action.type为包含promise前缀或后缀，则表示执行该action会需要得到结果,以promise包装并在promise内部向下一个中间件传递
    if(needPromiseReg.test(action.type.trim())){
        return new Promise((res,rej)=>{
            if(!action.extras){
                action.extras={};
            }
            action.extras.promise=true;
            action.extras.res=res;
            action.extras.rej=rej;
            return next(action);
        });
    }

    //否则，直接向下一个中间传递
    let nextLink=next(action);
    return nextLink;
});


//根据action.type判断是否需要返回promise
//1、promiseAddUser          不带命名空间，以promise作为前缀
//2、addUserPromise          不带命名空间，以promise作为后缀
//3、user/promiseAddUser     带命名空间，以promise作为前缀
//4、user/addUserPromise     带命名空间，以promise作为后缀
const needPromiseReg=/^([^/]+[/])?((promise[^/]+)|([^/]+promise))$/i;



export default sagaPromiseMiddleWare;

