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


import editorSvcEx from '../../../../service/editorSvcEx';
import { useMemo } from 'react';
import api from '../../../../service/api';


/**
 * 编辑器
 * @param {*} props 
 */
const Editor=({onSetInst, action, value, onOnlySave, onOk, onShowHelpDlg, onChange})=>{
    const {activeKey}= useSelector((state)=>({
        activeKey:  state.tabs.activeKey,
    }));
    const codeMirrorInstRef=useRef(null);


    /**
     * 计算当前导图文件附件的目录，用于插入图片、附件等
     */
    const currAssetsDir=useMemo(()=>{
        if(!activeKey){
            return null;
        }
        const to=parseInt(Math.max(activeKey.lastIndexOf("/"), activeKey.lastIndexOf("\\")))+1;
        const result= activeKey.substring(0, to)+"assets";
        return result;
    },[activeKey]);
    

    /**
     * 绑定codemirror对象到本组件和父组件（通过回调函数）
     */
    const bindCodeMirrorInstRef=useCallback((ele)=>{
        codeMirrorInstRef.current=ele;
        onSetInst(ele);
    },[onSetInst, codeMirrorInstRef]);


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
     * 绑定键盘事件
     */
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
     * 处理由父组件传递进来的事件：
     * addColor：设置颜色
     * refresh：刷新codemirror
     */
    useEffect(()=>{
        if(!action){
            return;
        }
        if('addColor'===action.type){
            editorSvcEx.setColor(codeMirrorInstRef.current, action.color, action.delayFocus);
            return;
        }
        if('refresh'===action.type){
            const focusFun=()=>{
                if(codeMirrorInstRef.current){
                    codeMirrorInstRef.current.focus();
                    codeMirrorInstRef.current.refresh();
                    return true;
                }
                return false;
            }
            setTimeout(focusFun, 0);
            return;
        }
    },[action, codeMirrorInstRef]);

    
    return <CodeMirror
        css={codeEditorStyle}
        editorDidMount={bindCodeMirrorInstRef}
        value={value}
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
                "Ctrl-S": onOnlySave,
                "Shift-Ctrl-S": onOk,                                  
                // "Ctrl-P": props.onShowInsertPicDlg,
                // "Ctrl-I": props.onShowInsertAttDlg,
                "Ctrl-H": onShowHelpDlg,
                // "Ctrl-T": props.onShowDateDlg,
                
                "Shift-Ctrl-G": onPreventKey,
                "Shift-Ctrl-F": onPreventKey,
                "Shift-Ctrl-R": onPreventKey,
                "Esc":          onPreventKey,
                "Alt-G":        onPreventKey,
            }
        }}
        onBeforeChange={onChange} />;
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
