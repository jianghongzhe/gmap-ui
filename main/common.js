const ws=require('./ws');


let wsConnected=false;
let wsClient=null;


/**
 * 
 * @param {*} url 
 */
const connWs=(url)=>{
    wsClient = new ws(url);
    w.on('open', ()=>{
        wsConnected=true;
    });
};

/**
 * 
 * @param {*} req 
 */
const send=(req)=>{

};



const wsClient = new ws('ws://localhost:8080/ws');

    w.on('open', function open() {
        w.send('something');
    });

    w.on('message', function incoming(message) {
        log("- msg -----------------");
        log(`received: ${message instanceof Buffer}`);
        log(`received: ${message.toString('utf-8')}`);
        log(`received: ${typeof(message)}`);
    });


module.exports={
    connWs,
    send,

};