/**
 * 对指定函数使用timeout重试
 * @param func
 * @param times 每次重试的间隔
 * @param lastCatch
 */
const retryTimeout=(func=()=>{}, times=[0], lastCatch=false)=>{
    const newTimes=[...times];
    const runnable=()=>{
        const timeout= newTimes.shift();
        const lastTime=(0===newTimes.length);
        if('undefined'!==typeof(timeout)){
            setTimeout(()=>{
                if(lastTime){
                    if(lastCatch){
                        try{
                            func();
                        }catch (e){
                            console.error("最后一次重试出现错误", e);
                        }
                        return;
                    }
                    func();
                    return;
                }

                try {
                    func();
                }catch (e){
                    console.error("出现错误等待重试", e);
                    runnable();
                }
            }, timeout);
        }
    };
    runnable();
};



export default retryTimeout;