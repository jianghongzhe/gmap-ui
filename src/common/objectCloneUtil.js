


const clone=(obj)=>{
    if (typeof obj !== "object") {
        return obj;
    }
    if(obj instanceof Date){
        return new Date(obj.getTime());
    }
    if (obj instanceof Array) {
        let array=[];
        for (let i = 0, len = obj.length; i < len; ++i) {
            array.push(clone(obj[i]));
        }
        return array;
    }
    let json={};
    for (let key in obj) {
        json[key]=clone(obj[key]);
    }
    return json;
};


export default {
    clone
};