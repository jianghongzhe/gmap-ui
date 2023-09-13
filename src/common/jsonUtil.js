


const parseValidJsonWith=(obj, extras)=>{
    const func=()=>{
        try {
            if ('string' === typeof obj) {
                obj = JSON.parse(obj);
                return obj;
            }
            if ('object' === typeof obj) {
                obj = JSON.parse(JSON.stringify(obj));
                return obj;
            }
        }catch (e){
        }
        return {};
    };
    return {
        ...func(obj),
        ...func(extras),
    };
};

const parseValidJson=(obj)=>{
    return parseValidJsonWith(obj, {});
};

export {
    parseValidJson,
    parseValidJsonWith,
};