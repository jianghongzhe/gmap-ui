import api from "../service/api";
import {useMemoizedFn} from "ahooks";


export const useAutoComplateFuncs=()=>{

    /**
     * 从剪切板取链接
     * @type {(function(*): void)|*}
     */
    const getUrlFromClipboard=useMemoizedFn((cm)=> {
        (async () => {
            let resp = await api.getUrlFromClipboard();
            if (resp) {
                if (true === resp.succ) {
                    const replTxt = `[${resp.data.title}](${resp.data.url})`;
                    insertTxtAndMoveCursor(cm, replTxt);
                } else {
                    api.showNotification("操作有误", resp.msg, "err");
                }
            }
        })();
    });

    return {
        getUrlFromClipboard
    };
};

/**
 * 向光标开始处插入内容并把光标后移
 * @param cm
 * @param txt
 */
const insertTxtAndMoveCursor=(cm, txt)=>{
    const pos=cm.doc.getCursor();// { ch: 3  line: 0}
    cm.doc.replaceRange(txt, pos, pos);
    cm.doc.setCursor({...pos, ch:pos.ch+txt.length});
};