/**
 * 处理textarea的tab和shift+tab按键事件，模拟代码编辑器的效果。实现移植了tabIndent.js库。
 * 由于在react中，textarea组件状态由state管理，不能直接操作html元素的value属性，
 * 因此不能直接使用tabIndent.js库，而是参照该库，把实现思路抽取出来以适应react的情况。
 * @param {*} originVal             元素的值
 * @param {*} originSelectionStart  元素的起始选中位置
 * @param {*} originSelectionEnd    元素的结束选中位置
 * @returns 如果改变了值，返回[newVal,newStart,newEnd]，否则返回false
 */
export const onEvent = (event,originVal, originSelectionStart, originSelectionEnd) => {
    //ESC
    if(27===event.keyCode){
        event.preventDefault();
        event.stopPropagation();
        return handleEsc(originVal,originSelectionStart,originSelectionEnd);
    }

    //回车
    if (13===event.keyCode && false===event.shiftKey){
        return handleEnter(originVal,originSelectionStart,originSelectionEnd,()=>{
            event.preventDefault();
            event.stopPropagation();
        });
    }
    
    //tab
    if (9 === event.keyCode) {
        event.preventDefault();
        event.stopPropagation();
        let flagMultiLine= isMultiLine(originVal,originSelectionStart,originSelectionEnd);

        //未按shift
        if(false===event.shiftKey){
            //tab键，选中内容未跨行
            if(false===flagMultiLine){
                return handleTabInline(originVal,originSelectionStart,originSelectionEnd);
            }
            //tab键，选中内容已跨行
            else{
                return handleTabMultiline(originVal,originSelectionStart,originSelectionEnd);
            }
        }
        //按了shift
        else{
            //shift+tab键，选中内容未跨行
            if(false===flagMultiLine){
                return handleShiftTabInline(originVal,originSelectionStart,originSelectionEnd);
            }
            //shift+tab键，选中内容已跨行
            else{
                return handleShiftTabMultiline(originVal,originSelectionStart,originSelectionEnd);
            }
        }
    }

    return false;
}

/**
 * ESC键，光标移到选中内部的末尾
 * @param {*} val 
 * @param {*} selectionStart 
 * @param {*} selectionEnd 
 */
const handleEsc=(val,selectionStart,selectionEnd)=>{
    return [val,selectionEnd,selectionEnd];
}

/**
 * 回车键
 * @param {*} val 
 * @param {*} selectionStart 
 * @param {*} selectionEnd 
 */
const handleEnter=(val,selectionStart,selectionEnd,cbPreventDefault)=>{
    let cursorPos = selectionStart;
    let startIndices = findStartIndices(val);
    let numStartIndices = startIndices.length;
    let startIndex = 0;
    let endIndex = 0;
    let tabMatch = new RegExp("^" + '\t'.replace('\t', '\\t').replace(/ /g, '\\s') + "+", 'g');
    let lineText = '';
    let tabs = null;

    for(var x=0;x<numStartIndices;x++) {
        if (startIndices[x+1] && (cursorPos >= startIndices[x]) && (cursorPos < startIndices[x+1])) {
            startIndex = startIndices[x];
            endIndex = startIndices[x+1] - 1;
            break;
        } else {
            startIndex = startIndices[numStartIndices-1];
            endIndex = val.length;
        }
    }

    lineText = val.slice(startIndex, endIndex);
    tabs = lineText.match(tabMatch);
    if (tabs !== null) {
        cbPreventDefault();
        var indentText = tabs[0];
        var indentWidth = indentText.length;
        var inLinePos = cursorPos - startIndex;
        if (indentWidth > inLinePos) {
            indentWidth = inLinePos;
            indentText = indentText.slice(0, inLinePos);
        }
        
        let newVal = val.slice(0, cursorPos) + "\n" + indentText + val.slice(cursorPos);
        let newStart= cursorPos + indentWidth + 1;
        let newEnd = newStart;
        return [newVal,newStart,newEnd];
    }

    return false;
}

/**
 * tab键，选中内容未跨行
 * @param {*} val 
 * @param {*} selectionStart 
 * @param {*} selectionEnd 
 */
const handleTabInline=(val,selectionStart,selectionEnd)=>{
    val = val.slice(0, selectionStart) + '\t' + val.slice(selectionEnd);
    selectionStart = selectionStart + 1;
    selectionEnd = selectionEnd + 1;
    return [val, selectionStart, selectionEnd];
}

/**
 * tab键，选中内容已跨行
 * @param {*} val 
 * @param {*} selectionStart 
 * @param {*} selectionEnd 
 */
const handleTabMultiline=(val,selectionStart,selectionEnd)=>{
    // Iterating through the startIndices, if the index falls within selectionStart and selectionEnd, indent it there.
    let	startIndices = findStartIndices(val);
    let l = startIndices.length;
    let newStart = undefined;
    let newEnd = undefined;
    let affectedRows = 0;

    while(l--) {
        var lowerBound = startIndices[l];
        if (startIndices[l+1] && selectionStart !== startIndices[l+1]) lowerBound = startIndices[l+1];

        if (lowerBound >= selectionStart && startIndices[l] < selectionEnd) {
            val = val.slice(0, startIndices[l]) + '\t' + val.slice(startIndices[l]);

            newStart = startIndices[l];
            if (!newEnd) newEnd = (startIndices[l+1] ? startIndices[l+1] - 1 : 'end');
            affectedRows++;
        }
    }

    selectionStart = newStart;
    selectionEnd = (newEnd !== 'end' ? newEnd + (1 * affectedRows) : val.length);
    return [val,selectionStart,selectionEnd];
}

/**
 * shift+tab键，选中内容未跨行
 * @param {*} val 
 * @param {*} selectionStart 
 * @param {*} selectionEnd 
 */
const handleShiftTabInline=(val,selectionStart,selectionEnd)=>{
    if (val.substr(selectionStart - 1, 1) === '\t') {
        // If there's a tab before the selectionStart, remove it
        val = val.substr(0, selectionStart - 1) + val.substr(selectionStart);
        selectionStart = selectionStart - 1;
        selectionEnd = selectionEnd - 1;
    } else if (val.substr(selectionStart - 1, 1) === "\n" && val.substr(selectionStart, 1) === '\t') {
        // However, if the selection is at the start of the line, and the first character is a tab, remove it
        val = val.substring(0, selectionStart) + val.substr(selectionStart + 1);
        selectionStart = ""+selectionStart;
        selectionEnd = selectionEnd - 1;
    }
    return [val, selectionStart, selectionEnd];
}

/**
 * shift+tab键，选中内容已跨行
 * @param {*} val 
 * @param {*} selectionStart 
 * @param {*} selectionEnd 
 */
const handleShiftTabMultiline=(val,selectionStart,selectionEnd)=>{
    // Iterating through the startIndices, if the index falls within selectionStart and selectionEnd, remove an indent from that row
    let startIndices = findStartIndices(val);
    let l = startIndices.length;
    let newStart = undefined;
    let newEnd = undefined;
    let affectedRows = 0;

    while(l--) {
        var lowerBound = startIndices[l];
        if (startIndices[l+1] && selectionStart !== startIndices[l+1]) lowerBound = startIndices[l+1];

        if (lowerBound >= selectionStart && startIndices[l] < selectionEnd) {
            if (val.substr(startIndices[l], 1) === '\t') {
                // Remove a tab
                val = val.slice(0, startIndices[l]) + val.slice(startIndices[l] + 1);
                affectedRows++;
            } else {}	// Do nothing

            newStart = startIndices[l];
            if (!newEnd) newEnd = (startIndices[l+1] ? startIndices[l+1] - 1 : 'end');
        }
    }

    selectionStart = newStart;
    selectionEnd = (newEnd !== 'end' ? newEnd - (affectedRows * 1) : val.length);
    return [val,selectionStart,selectionEnd];
}

/**
 * 选中部分是否跨行
 * @param {*} txt 
 * @param {*} selectionStart 
 * @param {*} selectionEnd 
 */
const isMultiLine=(txt,selectionStart,selectionEnd)=>{
    let	snippet = txt.slice(selectionStart, selectionEnd);
    let nlRegex = new RegExp(/\n/);
    return nlRegex.test(snippet) ? true : false;
}

/**
 * 获得每行首个字符的索引
 * @param {*} txt 
 */
const findStartIndices=(txt)=>{
    let	startIndices = [];
    let offset = 0;

    while(txt.match(/\n/) && txt.match(/\n/).length > 0) {
        offset = (startIndices.length > 0 ? startIndices[startIndices.length - 1] : 0);
        let lineEnd = txt.search("\n");
        startIndices.push(lineEnd + offset + 1);
        txt = txt.substring(lineEnd + 1);
    }
    startIndices.unshift(0);
    return startIndices;
}

