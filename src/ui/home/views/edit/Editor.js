import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import * as CodeMirrorCls from 'codemirror';
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

const CodeMirror=React.memo(NotMemoedCodeMirror);


/**
 * 编辑器
 * @param {*} props 
 */
const Editor=({onSetInst, action, value, onOnlySave, onOk, onShowHelpDlg, onChange , onEditTable})=>{
    /**
     * [
     *      {
     *          selected: true/false,
     *          label: '',
     *          option: {}
     *      }
     * ]
     */
    const [hintMenus, setHintMenus]= useState([]);
    const [hintMenuPos, setHintMenuPos]= useState({left:-99999, top:-99999});

    const currAssetsDir=useRecoilValue(tabActivePaneAssetsDir);
    const codeMirrorInstRef=useRef(null);
    const {
        copyLineDown, copyLineUp, 
        setTitle0,setTitle1,setTitle2,setTitle3,setTitle4,setTitle5,setTitle6,
        onPreventKey, clearSelection,
    }= useEditorOperation();
    const [rulerStyle, calcRulerStyle]= useRulerStyle(rulers.length);

    /**
     * 绑定codemirror对象到本组件和父组件（通过回调函数）
     */
    const bindCodeMirrorInstRef=useCallback((ele)=>{
        codeMirrorInstRef.current=ele;
        onSetInst(ele);
    },[onSetInst, codeMirrorInstRef]);


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
        codeMirrorInstRef.current.on("cursorActivity", calcRulerStyle);        

        return ()=>{
            codeMirrorInstRef.current.off("keydown", keyDownHandler);
            codeMirrorInstRef.current.off("cursorActivity", calcRulerStyle);
        };
    },[currAssetsDir, calcRulerStyle]);


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

    /**
     * cm, options
     * @type {(function(*, *))|*}
     */
    const onAutoComplete=useMemoizedFn((cm)=>{

        // console.log(CodeMirrorCls.hint.markdown) ;
        //cm.showHint({hint: CodeMirrorCls.hint.markdown});

        const cur = cm.getCursor();
        console.log("位置",cm.cursorCoords(cur, "page"));
        let {left,top}=cm.cursorCoords(cur, "page");
        left-=100;
        top-=75;

        setHintMenuPos({left,top});
        setHintMenus([

                {
                    selected: true,
                    label: '菜单1',
                    option: {}
                },
                {
                    selected: false,
                    label: '菜单1',
                    option: {}
                }

        ]);

        // console.log("args",args);
    });

    
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
                    "Esc":          clearSelection,
                    "Alt-G":        onPreventKey,
                    "Ctrl-Alt-Up":  copyLineUp,
                    "Ctrl-Alt-Down": copyLineDown,

                    // 自动完成：Alt-/为eclipse风格，Alt-Enter为idea风格
                    "Alt-/":        onAutoComplete,
                    "Alt-Enter":    onAutoComplete,
                }
            }}
            onBeforeChange={onChange} />

        {
            (hintMenus && hintMenus.length>0) && (
                <ul  className="CodeMirror-hints default"
                        style={{left: `${hintMenuPos.left}px`, top: `${hintMenuPos.top}px`,}}>
                    {
                        hintMenus.map((eachMenu, menuInd)=>(
                            <li key={`hintmenu-${menuInd}`} className={`CodeMirror-hint ${eachMenu.selected ? "CodeMirror-hint-active" : ""}`} >
                                p - 保存剪切板图片到本地
                            </li>
                        ))
                    }
                </ul>
            )


        }
        {/*<ul role="listbox" aria-expanded="true" id="cm-complete-0" className="CodeMirror-hints default"*/}
        {/*    style={{left: '17px', top: '56px',}}>*/}
        {/*   <li className="CodeMirror-hint CodeMirror-hint-active" aria-selected="true" id="cm-complete-0-0"
                                role="option">p - 保存剪切板图片到本地
                            </li>  */}
        {/*    <li className="CodeMirror-hint" id="cm-complete-0-1" role="option">p + - 保存剪切板图片到图床</li>*/}
        {/*    <li className="CodeMirror-hint" id="cm-complete-0-2" role="option">![]() - 图片</li>*/}
        {/*</ul>*/}
    </React.Fragment>;
};


/**
 * 标尺的默认样式
 */
const rulerColors=["#fcc", "#f5f577", "#cfc", "#aff", "#ccf", "#fcf"];
const rulers=[...rulerColors, ...rulerColors, ...rulerColors].map((color,ind)=>({
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
