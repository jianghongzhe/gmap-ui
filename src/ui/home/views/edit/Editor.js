import React, { useCallback, useEffect, useRef } from 'react';

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
import api from '../../../../service/api';
import { tabActivePaneAssetsDir } from '../../../../store/tabs';
import { useRecoilValue } from 'recoil';


/**
 * 编辑器
 * @param {*} props 
 */
const Editor=({onSetInst, action, value, onOnlySave, onOk, onShowHelpDlg, onChange, onEditTable})=>{
    const currAssetsDir=useRecoilValue(tabActivePaneAssetsDir);
    const codeMirrorInstRef=useRef(null);

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
         * tab：自动完成
         * @param {*} instance 
         * @param {*} event 
         * @returns 
         */
        const keyDownHandler=(instance, event)=>{
            if("Tab"===event.code && !event.altKey && !event.shiftKey && !event.ctrlKey){
                editorSvcEx.gotoDefinition(instance, event, api, currAssetsDir);
                return;
            }
        };
        codeMirrorInstRef.current.on("keydown", keyDownHandler);
        return ()=>{
            codeMirrorInstRef.current.off("keydown", keyDownHandler);
        };
    },[currAssetsDir]);


    const copyLine=useCallback((down=true, cm=null)=>{
        window.event.preventDefault();
        editorSvcEx.copyLine(cm, down);
    },[]);


    const setTitle=useCallback((lev)=>{
        if(!codeMirrorInstRef.current){
            return;
        }
        editorSvcEx.setTitle(codeMirrorInstRef.current, lev);
    },[]);

    const setWrapperMark=useCallback((func)=>{
        if(!codeMirrorInstRef.current){
            return;
        }
        func(codeMirrorInstRef.current);
    },[]);

    const clearSelection=useCallback(()=>{
        if(!codeMirrorInstRef.current){
            return;
        }
        onPreventKey();
        editorSvcEx.clearSelection(codeMirrorInstRef.current);
    },[onPreventKey]);


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
                "Ctrl-B": setWrapperMark.bind(this,editorSvcEx.setBold),
                "Ctrl-I": setWrapperMark.bind(this,editorSvcEx.setItalic),
                "Ctrl-D": setWrapperMark.bind(this,editorSvcEx.setStrikeLine),
                "Ctrl-H": onShowHelpDlg,
                "Ctrl-0": setTitle.bind(this,0),
                "Ctrl-1": setTitle.bind(this,1),
                "Ctrl-2": setTitle.bind(this,2),
                "Ctrl-3": setTitle.bind(this,3),
                "Ctrl-4": setTitle.bind(this,4),
                "Ctrl-5": setTitle.bind(this,5),
                "Ctrl-6": setTitle.bind(this,6),
                "Ctrl-T": onEditTable,
                
                "Shift-Ctrl-G": onPreventKey,
                "Shift-Ctrl-F": onPreventKey,
                "Shift-Ctrl-R": onPreventKey,
                "Esc":          clearSelection,
                "Alt-G":        onPreventKey,
                "Ctrl-Alt-Up": copyLine.bind(this,false),
                "Ctrl-Alt-Down": copyLine.bind(this,true),
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
