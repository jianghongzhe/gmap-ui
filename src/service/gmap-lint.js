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
})();
  