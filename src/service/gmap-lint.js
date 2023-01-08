import * as CodeMirror from 'codemirror';
import mindMapValidateSvc from './mindMapValidateSvc';



/**
 * 向CodeMirror注册语法检查组件
 */
(()=>{
    CodeMirror.registerHelper("lint", "markdown", function(text, options) {
        const result=mindMapValidateSvc.validateForLintTooltip(text);
        if(true===result){
            return [];
        }
        const {line, pos1, pos2, msg}=result;
        let found = [
            {
                from: CodeMirror.Pos(line, pos1),
                to: CodeMirror.Pos(line, pos2),
                message: msg,
                severity : 'error',
            }
        ];
        return found;
    });



    // CodeMirror.registerHelper("hint", "markdown",(cm, options)=>{
    //     const cur = cm.getCursor();
    //     console.log("位置",cm.cursorCoords(cur, "page"));
    //
    //     console.log("cursor", cur);
    //
    //
    //
    //     // console.log("qqq");
    //
    //     const hintList=[
    //         {
    //             lab1: '{p}',
    //             lab2: '保存剪切板图片到本地',
    //             val: '{p}',
    //         },
    //         {
    //             lab1: '{p+}',
    //             lab2: '保存剪切板图片到图床',
    //             val: '{p+}',
    //         },
    //         {
    //             lab1: '![]()',
    //             lab2: '图片',
    //             val: '![图片]()',
    //         }
    //
    //     ];
    //     const list= createHintList(hintList);
    //
    //
    //     //let result=await new Promise((res,rej)=>({list: ['aaa','bbb'], from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end)}));
    //     let result={list
    // // :
    //         //     [
    //         //
    //         //
    //         //     {displayText:'![]() - 图片', text:'![图片]()', },
    //         //     {displayText:'[]() - 超链接', text:'[链接]()', },
    //         //     {displayText:'[](file:///) - 本地文件链接', text:'[](file:///)', },
    //         //
    //         //     {displayText:'{p} - 保存剪切板图片到本地', text:'{p}', },
    //         //     {displayText:'{p+} - 保存剪切板图片到图床', text:'{p+}', },
    //         //     {displayText:'{a} - 保存剪切板文件到本地', text:'{a}', },
    //         //     {displayText:'{a+} - 保存剪切板文件到图床', text:'{a+}', },
    //         //     {displayText:'{u} - 提取剪切板url链接', text:'{u}', },
    //         //
    //         //
    //         //     {displayText:'{d} - 今天日期', text:'{d}', },
    //         //     {displayText:'{d+1} - 明天日期', text:'{d+1}', },
    //         //     {displayText:'{d+2} - 后天日期', text:'{d+2}', },
    //         //     {displayText:'{d-1} - 昨天日期', text:'{d-1}', },
    //         //     {displayText:'{d-2} - 前天日期', text:'{d-2}', },
    //         //     {displayText:'{t} - 当前时间', text:'{t}', },
    //         //     {displayText:'{dt} - 当前日期时间', text:'{dt}', },
    //         //
    //         //
    //         //
    //         //
    //         //
    //         //
    //         //
    //         // ]
    //
    //                 ,
    //         from: cur/*CodeMirror.Pos(cur.line, start)*/, to: cur/*CodeMirror.Pos(cur.line, end)*/
    //     };
    //
    //     // setTimeout(()=>{
    //     //     console.log("ele", document.querySelector("ul[role=listbox]").outerHTML);
    //     // },2000);
    //
    //
    //     return result;
    // });

})();


/**
 *
 * @param list [
 *  {
 *      lab1: '{u}',
 *      lab2: '',
 *      val: '提取剪切板url链接',
 *  }
 * ]
 */
const createHintList=(list=[])=>{
    const maxLabelLen= list.map(item=>item.lab1.trim()).reduce((accu, cur)=>Math.max(accu, `${cur}`.length),0);
    return list.map(item=>({
        displayText: `${item.lab1.padEnd(maxLabelLen, " ")} - ${item.lab2}`,
        text: item.val,
    }));
};

createHintList([
    {
        lab1: '{u}'
    },
    {
        lab1: '[](file:///)'
    }
]);

