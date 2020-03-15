const debounceThrottleFunCache=[];
const taskContainer={};

const getDebounceThrottleKey=(fun)=>{
	let ind=debounceThrottleFunCache.indexOf(fun);
	if(0<=ind){
		return '__debounce_throttle_key__'+ind;
	}
	
	debounceThrottleFunCache.push(fun);
	return '__debounce_throttle_key__'+debounceThrottleFunCache.indexOf(fun);
}

/**
 * 防抖处理，即指定时间间隔之内，每执行一个新任务，就取消前一个任务
 * @param {*} delay 
 * @param {*} fun 
 * @param  {...any} args 
 */
const debounce=(delay=500,fun,...args)=>{
    let key=getDebounceThrottleKey(fun);
    let now=new Date().getTime();

    //之前还有别的任务，并且未到指定时间间隔，则取消上个任务
    if(taskContainer[key] && taskContainer[key].time && now-taskContainer[key].time<=delay){
        taskContainer[key].task.cancel();
    }

    //创建新任务并执行，同时记录时间和任务对象以便以后计算超时时间和取消
    let task=new DebounceTask(delay,fun,...args);
    taskContainer[key]={
        time:   now,
        task:   task
    };
    return task.exe();
}

/**
 * 节流处理，即指定时间间隔之内，不允许执行新任务
 * @param {*} delay 
 * @param {*} fun 
 * @param  {...any} args 
 */
const throttle=(delay=500,fun,...args)=>{
    let key=getDebounceThrottleKey(fun);
    let now=new Date().getTime();

    //之前还有别的任务，并且未到指定时间间隔，则阻止任务执行（即返回一个只rejct的promise），同时设置上次执行时间
    if(taskContainer[key] && taskContainer[key].time && now-taskContainer[key].time<=delay){
        taskContainer[key].time=now;
        return new Promise((res,rej)=>{rej("任务已被阻止执行");});
    }

    //创建新任务
    let task=new DebounceTask(delay,fun,...args);
    taskContainer[key]={
        time:   now,
        task:   task
    };
    return task.exe();
}

/**
 * 防抖或节流的任务对象。
 * 任务取消的实现方式：直接clearTimeout不能使错误结果返回，因此使用设置标识的方式，当timeout处理时如有该标识，则返回错误结果。
 */
class DebounceTask{
    constructor(delay,fun,...args){
        this.delay=delay;
        this.fun=fun;
        this.args=args;
        this.canceled=false;
        this.timeout=null;
    }

    cancel=()=>{
        this.canceled=true;
    }
    
    exe=()=>{
        return new Promise((res,rej)=>{
            this.timeout=setTimeout(()=>{
                if(this.canceled){
                    rej("任务已取消");
                    return;
                }
                try{
                    let ret=this.fun(...this.args);
                    res(ret?ret:"任务已完成");
                }catch(e){
                    rej(e);
                }
            },this.delay);
        });
    }
}


export {debounce, throttle};