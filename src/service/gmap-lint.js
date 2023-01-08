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



    /**
     * 关于自动完成功能的说明：
     * 由于codemirror的自动完成需要预先准备好label（显示用）和value（实际结果）值，不适用于本项目的情况，因此手动进行处理，但仍使用codemirror的css样式。
     *
     * codemirror的实现方式为如下代码示例。其中displayText和text需要预先准备好。
     * <code>
     *      CodeMirror.registerHelper("hint", "markdown",(cm, options)=>{
     *         return {
     *             list: [
     *                 {
     *                     displayText: "插入链接",
     *                     text: "[某网](https://www.abc.def)",
     *                 }
     *             ],
     *             from: {line:0, ch:0},
     *             to: {line:0, ch:0},
     *         };
     *     });
     * </code>
     *
     * 本项目不适用于上面实现方式的理由：
     * 1、而本项目需要的方式为用户选择了指定菜单后再动态计算需要向编辑器插入的文本。比如如下场景：
     * 把剪切板中的文件上传到图床并生成markdown链接，如：[xxx](http://yyy/a/b/c)。
     * 该功能不可能在用户确认前就上传图床并生成markdown文本，只能等用户确认后再操作。
     * 2、codemirror不适用于异步的情况，不支持Promise结果
     *
     *
     */
})();