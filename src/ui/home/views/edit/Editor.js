/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useRef } from 'react';
import {useSelector} from 'react-redux';

import { Controlled as CodeMirror } from 'react-codemirror2';

import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/dialog/dialog.css';
import 'codemirror/addon/search/matchesonscrollbar.css';

import 'codemirror/mode/markdown/markdown';
import 'codemirror/keymap/sublime';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/search';
import 'codemirror/addon/scroll/annotatescrollbar';
import 'codemirror/addon/search/matchesonscrollbar';
import 'codemirror/addon/search/jump-to-line';

import editorSvc from '../../../../service/editorSvc';
import editorSvcEx from '../../../../service/editorSvcEx';
import { createSelector } from 'reselect';
import { propertyOf } from 'lodash';
import { useMemo } from 'react';
import api from '../../../../service/api';



/**
 * 编辑器
 * @param {*} props 
 */
const Editor=(props)=>{

    const {activeKey}= useSelector((state)=>({
        activeKey:  state.tabs.activeKey,
    }));

    const currAssetsDir=useMemo(()=>{
        if(!activeKey){
            return null;
        }
        const to=parseInt(Math.max(activeKey.lastIndexOf("/"), activeKey.lastIndexOf("\\")))+1;
        const result= activeKey.substring(0, to)+"assets";
        return result;
    },[activeKey]);
    


    const propsOnSetInst=props.onSetInst;
    const codeMirrorInstRef=useRef(null);
    const bindCodeMirrorInstRef=useCallback((ele)=>{
        codeMirrorInstRef.current=ele;
        propsOnSetInst(ele);
    },[propsOnSetInst]);

    /**
     * 防止默认事件触发的处理
     */
    const onPreventKey =useCallback(() => {
        if(window.event){
            window.event.stopPropagation();
            window.event.preventDefault();
        }
    },[]);


    /**
     * 替换内容并获得焦点
     * @param {*} originCursor   替换前光标位置
     * @param {*} originLineLen  替换前光标所在行的长度
     * @param {*} newCursor      替换后光标位置
     * @param {*} newLine        替换后整行的内容
     * @param {*} delayFocus     是否延迟获得焦点
     */
    const replaceLine =useCallback((originCursor, originLineLen, newCursor, newLine, delayFocus = false) => {
        if(!codeMirrorInstRef.current){
            return;
        }
        const codeMirrorInst=codeMirrorInstRef.current;
        codeMirrorInst.setCursor(originCursor);
        codeMirrorInst.setSelection(originCursor, { line: originCursor.line, ch: originLineLen });
        codeMirrorInst.replaceSelection(newLine);
        codeMirrorInst.setCursor(newCursor);
        codeMirrorInst.setSelection(newCursor);
        codeMirrorInst.focus();

        //对话框刚关闭时，不能马上获得焦点，因此这种情况需要延迟一下
        if (delayFocus) {
            setTimeout(() => {
                codeMirrorInst.setCursor(newCursor);
                codeMirrorInst.setSelection(newCursor);
                codeMirrorInst.focus();
            }, 500);
        }
    },[]);

    const onAddColor =useCallback((color = null, delayFocus = false) => {
        if(!codeMirrorInstRef.current){
            return;
        }
        const codeMirrorInst=codeMirrorInstRef.current;

        //获得当前光标位置与光标所在行
        let cursor = codeMirrorInst.getCursor();
        let { line } = cursor;
        let lineTxt = codeMirrorInst.getLine(line);

        //替换行
        let newLine = editorSvc.setColor(lineTxt, color);
        replaceLine({ line, ch: 0 }, lineTxt.length, { line, ch: newLine.length }, newLine, delayFocus);
    },[replaceLine]);

    const onAddPic = useCallback((picRelaPath,pname) => {
        if(!codeMirrorInstRef.current){
            return;
        }
        const codeMirrorInst=codeMirrorInstRef.current;

        //获得当前光标位置与光标所在行     
        let cursor = codeMirrorInst.getCursor();
        let { line, ch } = cursor;
        let lineTxt = codeMirrorInst.getLine(line);

        //替换行
        let { newLinetxt, cusorPos } = editorSvc.addPic(lineTxt, ch, picRelaPath,pname);
        replaceLine({ line, ch: 0 }, lineTxt.length, { line, ch: cusorPos }, newLinetxt, true);
    },[replaceLine]);

    const onAddAtt = useCallback((picRelaPath,pname) => {
        if(!codeMirrorInstRef.current){
            return;
        }
        const codeMirrorInst=codeMirrorInstRef.current;

        //获得当前光标位置与光标所在行     
        let cursor = codeMirrorInst.getCursor();
        let { line, ch } = cursor;
        let lineTxt = codeMirrorInst.getLine(line);

        //替换行
        let { newLinetxt, cusorPos } = editorSvc.addAtt(lineTxt, ch, picRelaPath,pname);
        replaceLine({ line, ch: 0 }, lineTxt.length, { line, ch: cusorPos }, newLinetxt, true);
    },[replaceLine]);

    const onAddDate=useCallback((dateStr)=>{
        //获得当前光标位置与光标所在行
        if(!codeMirrorInstRef.current){
            return;
        }
        const codeMirrorInst=codeMirrorInstRef.current; 
        let cursor = codeMirrorInst.getCursor();
        let { line, ch } = cursor;
        let lineTxt = codeMirrorInst.getLine(line);

        //替换行
        // let targetDateStr=dateStr.substring(2).replace(/[-]/g,'.');//去掉两位年
        const targetDateStr=editorSvcEx.toDateFmt(new Date(dateStr));
        let { newLinetxt, cusorPos } = editorSvc.addDate(lineTxt, ch, targetDateStr);
        replaceLine({ line, ch: 0 }, lineTxt.length, { line, ch: cusorPos }, newLinetxt, true);
    },[replaceLine]);



    useEffect(()=>{
        if(!codeMirrorInstRef.current){
            return;
        }

        /**
         * 键盘事件处理：
         * tab：转到定义处
         * ctrl+alt+下：复制当前行到下一行
         * ctrl+alt+上：复制当前行到上一行
         * @param {*} instance 
         * @param {*} event 
         * @returns 
         */
        const keyDownHandler=(instance, event)=>{
            if("Tab"===event.code && !event.altKey && !event.shiftKey && !event.ctrlKey){
                editorSvcEx.gotoDefinition(instance, event, api, currAssetsDir);
                return;
            }
            if("ArrowUp"===event.code && event.altKey && !event.shiftKey && event.ctrlKey){
                event.preventDefault();
                editorSvcEx.copyLine(instance, false);
                return;
            }
            if("ArrowDown"===event.code && event.altKey && !event.shiftKey && event.ctrlKey){
                event.preventDefault();
                editorSvcEx.copyLine(instance, true);
                return;
            }
        };
        codeMirrorInstRef.current.on("keydown", keyDownHandler);
        return ()=>{
            codeMirrorInstRef.current.off("keydown", keyDownHandler);
        };
    },[currAssetsDir]);


    /**
     * 显示后获取焦点并刷新
     */
    useEffect(()=>{
        if(props.forceRefresh) {
             const focusFun=()=>{
                if(codeMirrorInstRef.current){
                    codeMirrorInstRef.current.focus();
                    codeMirrorInstRef.current.refresh();
                    return true;
                }
                return false;
             }
             setTimeout(focusFun, 0);
        }
    },[props.forceRefresh]);

    useEffect(()=>{
        if(!props.action){
            return;
        }
        if('addColor'===props.action.type){
            onAddColor(props.action.color, props.action.delayFocus);
            return;
        }
        if('addPic'===props.action.type){
            onAddPic(props.action.relaPath, props.action.name);
            return;
        }
        if('addAtt'===props.action.type){
            onAddAtt(props.action.relaPath, props.action.name);
            return;
        }
        if('addDate'===props.action.type){
            onAddDate(props.action.date);
        }
    },[props.action, onAddColor, onAddPic, onAddAtt, onAddDate]);

    
    return <CodeMirror
        css={codeEditorStyle}
        editorDidMount={bindCodeMirrorInstRef}
        value={props.value}
        options={{
            lineNumbers: true,
            theme: 'default',
            mode: 'markdown',
            styleActiveLine: true,
            indentWithTabs: true,
            indentUnit: 4,
            keyMap: "sublime",
            extraKeys: {
                "Ctrl-F": "findPersistent",
                "Ctrl-G": "jumpToLine",
                "Ctrl-S": props.onOnlySave,
                "Shift-Ctrl-S": props.onOk,                                  
                // "Ctrl-P": props.onShowInsertPicDlg,
                // "Ctrl-I": props.onShowInsertAttDlg,
                "Ctrl-H": props.onShowHelpDlg,
                // "Ctrl-T": props.onShowDateDlg,
                
                "Shift-Ctrl-G": onPreventKey,
                "Shift-Ctrl-F": onPreventKey,
                "Shift-Ctrl-R": onPreventKey,
                "Esc":          onPreventKey,
                "Alt-G":        onPreventKey,
            }
        }}
        onBeforeChange={props.onChange} />;
};

const codeEditorStyle = {
    '& .CodeMirror': {
        border: '1px solid lightgrey',
        fontSize: 16,
        height: 'calc(100vh - 400px)',
        maxHeight: 'calc(100vh - 400px)',
        minHeight: 'calc(100vh - 400px)',
    }
};


export default React.memo(Editor);
