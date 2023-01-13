import React, {useEffect, useMemo, useRef,} from 'react';

import { Controlled as NotMemoedCodeMirror } from 'react-codemirror2';
import useBus from 'use-bus';
import keyDetector from 'key-detector';

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
import globalStyleConfig from "../../../../common/globalStyleConfig";
import {editorEvents} from "../../../../common/events";

const CodeMirror=React.memo(NotMemoedCodeMirror);


/**
 * 编辑器
 * @param {*} props 
 */
const Editor=({onSetInst, value, onOnlySave, onOk, onShowHelpDlg, onChange , onEditTable})=>{
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
    }= useHintMenu();

    const {
        doClipboardAction,
        doLiteralAction,
        doDateTimeAction,
        doRefAction,
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
     * 绑定键盘事件处理：
     * 没有使用codemirror自带的extraKeys，因为该方式会阻止按键本来的行为，即带有preventDefault效果。
     * 而该处的按键事件处理需要根据情况自己决定是否保持按键默认的行为，或是自定义的行为（preventDefault）
     */
    useEffect(()=>{
        if(!codeMirrorInstRef.current){
            return;
        }

        /**
         * 键盘事件处理：
         * @param {*} instance
         * @param {*} event 
         * @returns 
         */
        const keyDownHandler=(instance, event)=>{
            const clearEvent=()=>{
                try{
                    event.stopPropagation();
                    event.preventDefault();
                }catch (ex){}
            };

            const withHintMenuOpen=(openFunc, notOpenFunc)=>{
                if(hintMenuOpen) {
                    openFunc?.();
                }else{
                    notOpenFunc?.();
                }
            };

            // 按键事件分发：
            // tab、enter、space: 如果自动提示框打开则触发确认操作；如果未打开且为tab则按自动补全功能处理
            // up、down: 如果自动提示框打开则触发选中项上下移操作
            keyDetector.on(event, {
                'tab | enter | space': (e, which)=>{
                    withHintMenuOpen(
                        ()=>{
                            clearEvent();
                            hintMenuOk(instance, event);
                        },
                        ()=>{
                            if('tab'===which){
                                editorSvcEx.gotoDefinition(instance, event, api, currAssetsDir);
                            }
                        },
                    );
                },
                'up': ()=>{
                    withHintMenuOpen(()=>{
                        clearEvent();
                        moveHintMenuUp();
                    });
                },
                'down': ()=>{
                    console.log("down do2wn.....")
                    withHintMenuOpen(()=>{
                        clearEvent();
                        moveHintMenuDown();
                    });
                },
            });
        };

        codeMirrorInstRef.current.on("keydown", keyDownHandler);
        codeMirrorInstRef.current.on("cursorActivity", onCursorActivity);

        return ()=>{
            codeMirrorInstRef.current.off("keydown", keyDownHandler);
            codeMirrorInstRef.current.off("cursorActivity", onCursorActivity);
        };
    },[currAssetsDir, onCursorActivity, hintMenuOpen, moveHintMenuUp, moveHintMenuDown, hintMenuOk, closeHintMenu]);


    /**
     * 处理光标定位事件
     * @param {
     *      type: 'putCursor',
     *      payload: {line,ch},
     * }
     */
    const handlePutCursorEvent=useMemoizedFn((action)=>{
        if(!codeMirrorInstRef.current){
            return;
        }
        const cm=codeMirrorInstRef.current;
        cm.focus();
        cm.setCursor(action.payload);
        cm.scrollIntoView(action.payload);
    });
    useBus(editorEvents.putCursor, (action)=> handlePutCursorEvent(action), [handlePutCursorEvent]);


    /**
     * 处理颜色选择或取消事件
     * @param {
     *     type: 'addColor',
     *     payload: {
     *         color,
     *         delayFocus
     *     }
     * }
     */
    const handleAddColorEvent=useMemoizedFn((action)=>{
        if(!codeMirrorInstRef.current){
            return;
        }
        editorSvcEx.setColor(codeMirrorInstRef.current, action?.payload?.color, action?.payload?.delayFocus);
    });
    useBus(editorEvents.addColor, (action)=> handleAddColorEvent(action), [handleAddColorEvent]);


    /**
     * 处理编辑器显示事件：
     * 1、codemirror.refresh
     * 2、关闭自动提示框
     * @param {
     *     type: 'show',
     *     payload: null,
     * }
     */
    const handleShowEvent=useMemoizedFn((action)=>{
        const func=()=>{
            setTimeout(()=>{
                if(!codeMirrorInstRef.current){
                    return;
                }
                codeMirrorInstRef.current.focus();
                codeMirrorInstRef.current.refresh();
            },0);
        }
        func();
        setTimeout(func, 500);
        closeHintMenu();
    });
    useBus(editorEvents.show, (action)=> handleShowEvent(action), [handleShowEvent]);






    /**
     * 标尺的样式和语法检查tooltip的样式
     */
    const globalStyle=useMemo(()=>({...rulerStyle, ...fixedGlobalStyle,}),[rulerStyle]);


    
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


const fixedGlobalStyle= {
    'body .CodeMirror-lint-tooltip': {zIndex: 1000,},
    'body .CodeMirror-hints': {
        zIndex: 1000,
        maxHeight: `${globalStyleConfig.hintDlg.maxh}px`,
    }
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
