const common = require("./common");

class Detector {
    constructor(timeoutMs, timeoutCheckIntervalMs, errCb) {
        this.lastSignalTime=new Date().getTime();
        this.timeoutMs=timeoutMs;
        this.timeoutCheckIntervalMs=timeoutCheckIntervalMs;
        this.errCb=errCb;
        this.beginCheck();
        this.id=""+parseInt(Math.random()*100000);
    }

    signal=()=>{
        this.lastSignalTime=new Date().getTime();
    }

    beginCheck=()=>{
        const func=()=>{
            const dist = new Date().getTime()-this.lastSignalTime;
            if(dist>this.timeoutMs){
                this?.errCb?.(dist);
            }
        };
        setInterval(func, this.timeoutCheckIntervalMs);
    }
}

const createTimeoutDetector=(timeoutMs, timeoutCheckIntervalMs, errCb)=>{
    return new Detector(timeoutMs, timeoutCheckIntervalMs, errCb);
};


module.exports={
    createTimeoutDetector,
};