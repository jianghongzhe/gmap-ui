import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import { Controlled as NotMemoedCodeMirror } from 'react-codemirror2';

import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/dialog/dialog.css';
import 'codemirror/addon/search/matchesonscrollbar.css';
import 'codemirror/addon/lint/lint.css'
import 'codemirror/addon/hint/show-hint.css'

import 'codemirror/mode/markdown/markdown';
import 'codemirror/keymap/sublime';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/search';
import 'codemirror/addon/scroll/annotatescrollbar';
import 'codemirror/addon/search/matchesonscrollbar';
import 'codemirror/addon/search/jump-to-line';
import 'codemirror/addon/display/rulers';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/hint/show-hint';

import '../../../../service/gmap-lint';


import editorSvcEx from '../../../../service/editorSvcEx';
import api from '../../../../service/api';
import { tabActivePaneAssetsDir } from '../../../../store/tabs';
import { useRecoilValue } from 'recoil';
import { Global } from '@emotion/react';
import { useEditorOperation, useRulerStyle } from '../../../../hooks/editor';
import {useMemoizedFn} from "ahooks";
import HintDlg from "./HintDlg";
import {useHintMenu} from "../../../../hooks/hintMenu";
import {useAutoComplateFuncs} from "../../../../hooks/autoComplete";
import {actionTypes} from "../../../../common/hintMenuConfig";

const CodeMirror=React.memo(NotMemoedCodeMirror);


/**
 * 编辑器
 * @param {*} props 
 */
const Editor=({openSymbol, onSetInst, action, value, onOnlySave, onOk, onShowHelpDlg, onChange , onEditTable})=>{

    const {
        hintMenus,
        hintMenuPos,
        currMenu,
        hintMenuOpen,
        bindRefFunc,
        showMenu: onAutoComplete,
        closeHintMenu,
        moveHintMenuDown,
        moveHintMenuUp,
        moveHintMenuTo,
    }= useHintMenu({forceCloseSymbol: openSymbol});

    const {
        doClipboardAction,
        doLiteralAction,
        doDateTimeAction,
        doRefAction,
        shouldShowRefMenu,
        shouldShowContMenu,
    }=useAutoComplateFuncs();

    const currAssetsDir=useRecoilValue(tabActivePaneAssetsDir);
    const codeMirrorInstRef=useRef(null);
    const {
        copyLineDown, copyLineUp, 
        setTitle0,setTitle1,setTitle2,setTitle3,setTitle4,setTitle5,setTitle6,
        onPreventKey, clearSelection,
    }= useEditorOperation();
    const [rulerStyle, calcRulerStyle]= useRulerStyle(rulers.length);

    /**
     * 绑定codemirror对象到本组件和父组件（通过回调函数），以给上层组件使用
     */
    const bindCodeMirrorInstRef=useMemoizedFn((ele)=>{
        codeMirrorInstRef.current=ele;
        onSetInst(ele);
    });


    /**
     * 处理光标位置有变化的函数：
     * 1、设置标尺线
     * 2、关闭自动提示菜单
     * @type {(function(): void)|*}
     */
    const onCursorActivity=useMemoizedFn(()=>{
        calcRulerStyle(codeMirrorInstRef.current);
        closeHintMenu();
    });

    /**
     * esc键的处理
     * 1、清空选择的文本
     * 2、关闭自动提示菜单
     * @type {(function(*): void)|*}
     */
    const onEsc= useMemoizedFn((cm)=>{
        clearSelection(cm);
        closeHintMenu();
    });


    /**
     * 自动完成菜单的处理函数
     * @param cm codemirror对象，如果没有传递，则使用引用中记录的
     * @param event
     */
    const hintMenuOk=useMemoizedFn((cm, event)=>{
        cm=(cm??codeMirrorInstRef.current);
        const type= currMenu?.option?.type;
        const data= currMenu?.option?.data;
        closeHintMenu();

        if(actionTypes.editTable===type){
            onEditTable();
            return;
        }
        if(actionTypes.clipboardAction===type){
            doClipboardAction(data, cm, currAssetsDir);
            return;
        }
        if(actionTypes.literal===type){
            doLiteralAction(data, cm);
            return;
        }
        if(actionTypes.dateTimeAction===type){
            doDateTimeAction(data, cm);
            return;
        }
        if(actionTypes.refAction===type){
            doRefAction(data, cm);
            return;
        }
    });




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
            const noOtherCombKey=(!event.altKey && !event.shiftKey && !event.ctrlKey);
            const isOnlyTab=("Tab"===event.code && noOtherCombKey);
            const isOnlyEnter=("Enter"===event.code && noOtherCombKey);
            const isOnlySpace=("Space"===event.code && noOtherCombKey);
            const isOnlyUp=("ArrowUp"===event.code && noOtherCombKey);
            const isOnlyDown=("ArrowDown"===event.code && noOtherCombKey);

            // 如果已打开了自动完成对话框，则优先按它处理
            if(hintMenuOpen){
                const func=()=>{
                    try{
                        event.stopPropagation();
                        event.preventDefault();
                    }catch (e){}
                };

                // tab、回车、空格会触发菜单确定事件
                if(isOnlyTab || isOnlyEnter || isOnlySpace){
                    func();
                    hintMenuOk(instance, event);
                    return;
                }
                // 上下移动菜单选中项
                if(isOnlyUp){
                    func();
                    moveHintMenuUp();
                    return;
                }
                if(isOnlyDown){
                    func();
                    moveHintMenuDown();
                    return;
                }
                return;
            }

            // 否则如果是tab键，则按自动完成处理方式
            if(isOnlyTab){
                editorSvcEx.gotoDefinition(instance, event, api, currAssetsDir);
                return;
            }
        };

        codeMirrorInstRef.current.on("keydown", keyDownHandler);
        codeMirrorInstRef.current.on("cursorActivity", onCursorActivity);

        return ()=>{
            codeMirrorInstRef.current.off("keydown", keyDownHandler);
            codeMirrorInstRef.current.off("cursorActivity", onCursorActivity);
        };
    },[currAssetsDir, onCursorActivity, hintMenuOpen, moveHintMenuUp, moveHintMenuDown, hintMenuOk, closeHintMenu]);


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



    /**
     * 标尺的样式和语法检查tooltip的样式
     */
    const globalStyle=useMemo(()=>{
        let result={
            ...rulerStyle,
            'body .CodeMirror-lint-tooltip':{zIndex: 1000,},
            'body .CodeMirror-hints':{zIndex: 1000,},
        };
        return result;
    },[rulerStyle]);



    
    return <React.Fragment>
        <Global styles={globalStyle}/>
        <CodeMirror
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
                gutters: ["CodeMirror-lint-markers"],
                // lint: true, selfContain: true
                selfContain: true,
                highlightLines:true,
                lint: {options: {selfContain: true, highlightLines:true,}},
                rulers,
                extraKeys: {
                    "Ctrl-F": "findPersistent",
                    "Ctrl-G": "jumpToLine",
                    "Ctrl-S": onOnlySave,
                    "Shift-Ctrl-S": onOk,                                  
                    // "Ctrl-P": props.onShowInsertPicDlg,               
                    "Ctrl-B": editorSvcEx.setBold,
                    "Ctrl-I": editorSvcEx.setItalic,
                    "Ctrl-D": editorSvcEx.setStrikeLine,
                    "Ctrl-H": onShowHelpDlg,
                    "Ctrl-0": setTitle0,
                    "Ctrl-1": setTitle1,
                    "Ctrl-2": setTitle2,
                    "Ctrl-3": setTitle3,
                    "Ctrl-4": setTitle4,
                    "Ctrl-5": setTitle5,
                    "Ctrl-6": setTitle6,
                    "Ctrl-T": onEditTable,
                    
                    "Shift-Ctrl-G": onPreventKey,
                    "Shift-Ctrl-F": onPreventKey,
                    "Shift-Ctrl-R": onPreventKey,
                    "Esc":          onEsc,
                    "Alt-G":        onPreventKey,
                    "Ctrl-Alt-Up":  copyLineUp,
                    "Ctrl-Alt-Down": copyLineDown,

                    // 自动完成：Alt-/为eclipse风格，Alt-Enter为idea风格
                    "Alt-/":        onAutoComplete,
                    "Alt-Enter":    onAutoComplete,
                }
            }}
            onBeforeChange={onChange}
        />
        <HintDlg pos={hintMenuPos} menus={hintMenus}
                 bindRefFunc={bindRefFunc}
                 onClick={hintMenuOk}
                 onSelect={moveHintMenuTo}
        />
    </React.Fragment>;
};




/**
 * 标尺的默认样式
 */
const rulerColors=["#fcc", "#f5f577", "#cfc", "#aff", "#ccf", "#fcf"];
const rulers=[...rulerColors, ...rulerColors, ...rulerColors, ...rulerColors].map((color,ind)=>({
    color,
    column:4*(ind+1),
    lineStyle: "dashed",
    className: `rulerItem ruler${ind}`,
}));




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
