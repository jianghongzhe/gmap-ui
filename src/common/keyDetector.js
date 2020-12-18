/**
 * 简易按键检测工具
 */
class KeyDetector{

    /**
     * 找到匹配的按键字符串与处理函数，并调用处理函数
     * @param {*} e                 KeyboardEvent
     * @param {*} keyHandlerMap     {
     *      'ctrl+a': (e)=>{},
     *      'alt+c':  (e)=>{},
     * }
     */
    on=(e, keyHandlerMap)=>{
        for(let key in keyHandlerMap){
            if(this._isMatch(e,key)){
                keyHandlerMap[key](e);
                break;
            }
        }
    };

    /**
     * 判断按键事件与指定的按键字符串是否匹配
     * @param {*} e 
     * @param {*} key 
     */
    _isMatch=(e,key)=>{
        const keyObj=this._splitKeys(key);

        if(e.ctrlKey!==keyObj.ctrl){
            return false;
        }
        if(e.shiftKey!==keyObj.shift){
            return false;
        }
        if(e.altKey!==keyObj.alt){
            return false;
        }

        if(Array.isArray(keyObj.key)){
            if(!keyObj.key.some(each=>each===e.code)){
                return false; 
            }
        }
        if("string"===typeof(keyObj.key)){
            if(e.code!==keyObj.key){
                return false;
            }
        }
        
        return true;
    };

    /**
     * 按键字符串解析为json对象：eg. ctrl+a
     * @param {*} key 
     */
    _splitKeys=(key)=>{
        let keys=key.toLowerCase().trim().replace('{+}','__plus__').split("+")
            .map(each=>each.replace('__plus__','+'))
            .filter(each=>(null!==each && ''!==each));
        let result={
            alt:false,
            ctrl:false,
            shift:false,
            key:null,
        };
        keys.forEach(each=>{
            if('ctrl'===each || 'control'===each){
                result.ctrl=true;
                return;
            }
            if('alt'===each){
                result.alt=true;
                return;
            }
            if('shift'===each){
                result.shift=true;
                return;
            }

            let code=keyMap[each];
            if('undefined'!==typeof(code)){
                result.key=code;
            }
        });
        return result;
    }
}

/**
 * 按键字面值与code值的对应关系
 */
const keyMap={
    'f1':           "F1",
    'f2':           "F2",
    'f3':           "F3",
    'f4':           "F4",
    'f5':           "F5",
    'f6':           "F6",
    'f7':           "F7",
    'f8':           "F8",
    'f9':           "F9",
    'f10':          "F10",
    'f11':          "F11",
    'f12':          "F12",

    '0':            ["Digit0","Numpad0"],
    '1':            ["Digit1","Numpad1"],
    '2':            ["Digit2","Numpad2"],
    '3':            ["Digit3","Numpad3"],
    '4':            ["Digit4","Numpad4"],
    '5':            ["Digit5","Numpad5"],
    '6':            ["Digit6","Numpad6"],
    '7':            ["Digit7","Numpad7"],
    '8':            ["Digit8","Numpad8"],
    '9':            ["Digit9","Numpad9"],

    'a':            "KeyA",
    'b':            "KeyB",
    'c':            "KeyC",
    'd':            "KeyD",
    'e':            "KeyE",
    'f':            "KeyF",
    'g':            "KeyG",
    'h':            "KeyH",
    'i':            "KeyI",
    'j':            "KeyJ",
    'k':            "KeyK",
    'l':            "KeyL",
    'm':            "KeyM",
    'n':            "KeyN",
    'o':            "KeyO",
    'p':            "KeyP",
    'q':            "KeyQ",
    'r':            "KeyR",
    's':            "KeyS",
    't':            "KeyT",
    'u':            "KeyU",
    'v':            "KeyV",
    'w':            "KeyW",
    'x':            "KeyX",
    'y':            "KeyY",
    'z':            "KeyZ",

    'esc':          "Escape",
    'escape':       "Escape",
    'back':         "Backspace",
    'backspace':    "Backspace",
    'ent':          ["Enter","NumpadEnter"],
    'enter':        ["Enter","NumpadEnter"],
    'tab':          "Tab",
    'capslock':     "CapsLock",
    'caps':         "CapsLock",
    'cap':          "CapsLock",

    '+':            "NumpadAdd",
    '-':            ["Minus","NumpadSubtract"],
    '*':            "NumpadMultiply",
    '=':            "Equal",
    '[':            "BracketLeft",
    ']':            "BracketRight",
    ',':            "Comma",
    '.':            "Period",
    ';':            "Semicolon",
    '\'':           "Quote",
    '`':            "Backquote",
    '/':            ["Slash","NumpadDivide"],
    '\\':           "Backslash",

    ' ':            "Space",
    '　':           "Space",
    'space':        "Space",

    'win':          ["MetaLeft","MetaRight"],
    'meta':         ["MetaLeft","MetaRight"],

    'pause':        "Pause",
    'scrolllock':   "ScrollLock",
    'scrlk':        "ScrollLock",
    'sclk':         "ScrollLock",

    'insert':       "Insert",
    'ins':          "Insert",
    'delete':       "Delete",
    'del':          "Delete",
    'home':         "Home",
    'end':          "End",
    'pageup':       "PageUp",
    'pgup':         "PageUp",
    'pagedown':     "PageDown",
    'pgdn':         "PageDown",

    'up':           "ArrowUp",
    'down':         "ArrowDown",
    'left':         "ArrowLeft",
    'right':        "ArrowRight",

    'num':          "NumLock",
    'nums':         "NumLock",
};



export default new KeyDetector();