/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider } from 'antd';
import {Controlled as CodeMirror} from 'react-codemirror2'

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/addon/selection/active-line';  
import 'codemirror/keymap/sublime';

class EditGraphDlg extends React.Component {
    constructor(props) {
        super(props);
        this.codeMirrorInst=null;
        this.state = {  };
    }

    bindCodeMirrorInst=(editor)=>{
        this.codeMirrorInst = editor;
    }

    onEditMapDlgEscKey=(cm)=>{
        window.event.stopPropagation();
    }

    onAddColor=(color)=>{
        if(!this.codeMirrorInst){return;}

        //获取当前光标位置与当前行内容
        let {line,ch}=this.codeMirrorInst.getCursor();
        let lineTxt=this.codeMirrorInst.getLine(line);
        
        //最终加入内容的行内位置和加入的内容
        let pos=-1;    
        let addStr="";

        //该行包含减号
        let ind=lineTxt.indexOf("-");
        let reg=/^\t*[-].*$/;
        if(0<=ind && reg.test(lineTxt)){
            //先假设插入位置是减号后面的位置
            pos=ind+1;
            addStr=" c:"+color+"|";//插入内容包含空格

            //如果减号后面有字符并且是空格，则插入位置往后移一位
            if(ind+1<lineTxt.length && ' '===lineTxt[ind+1]){
                ++pos;
                addStr=addStr.trim();//插入内容不包含空格
            }
        }
        //该行不包含减号
        else{
            //找到第一个非tab的字符作为插入位置
            pos=0;
            addStr="- c:"+color+"|";
            for(let i=0;i<lineTxt.length;++i){
                if('\t'!==lineTxt[i]){
                    break;
                }
                ++pos;
            }
        }

        //插入内容并设置光标位置
        this.codeMirrorInst.setCursor({line,ch:pos});
        this.codeMirrorInst.setSelection({line,ch:pos})
        this.codeMirrorInst.replaceSelection(addStr);
        this.codeMirrorInst.focus();
    }

    render() {
        return (
            <Modal
                title={"编辑图表 - " + this.props.currMapName}
                css={{
                    width: (this.props.dlgW) ,
                    minWidth: (this.props.dlgW),
                    maxWidth: (this.props.dlgW)
                }}
                maskClosable={false}
                visible={this.props.visible}
                onOk={this.props.onOk}
                onCancel={this.props.onCancel}>
                <div>
                    <div css={{'marginBottom':"10px"}}>
                        {
                            ['#cf1322','#389e0d','#0050b3','#fa8c16','#13c2c2','#ad6800','#1890ff','#722ed1','#c41d7f'].map((eachcolor,colorInd)=>(
                                <div key={colorInd} css={getEditDlgColorBoxStyle(eachcolor)} onClick={this.onAddColor.bind(this,eachcolor)}></div>
                            ))
                        }                                
                    </div>
                    <CodeMirror
                        css={getCodeEditorStyle(this.props.editorH)}
                        editorDidMount={this.bindCodeMirrorInst}
                        value={this.props.editTmpTxt}
                        options={{
                            lineNumbers: true,
                            theme: 'default',
                            mode:   'markdown',
                            styleActiveLine: true,
                            indentWithTabs:true,
                            indentUnit:4,
                            keyMap: "sublime",
                            extraKeys:{
                                "Ctrl-S":   this.props.onOk,
                                "Esc":      this.onEditMapDlgEscKey
                            }
                        }}
                        onBeforeChange={this.props.onChangeEditTmpTxt}/>
                </div>
            </Modal>
        );
    }
}

const getCodeEditorStyle=(height)=>({
    '& .CodeMirror':{
        border:     '1px solid lightgrey',
        fontSize:   16,
        height:     height,
        maxHeight:  height,
        minHeight:  height,
    }
});

const getEditDlgColorBoxStyle=(color)=>({
    backgroundColor:color,
    width:          16,
    height:         16,
    display:        'inline-block',
    cursor:         'pointer',
    marginRight:    10,
});

export default EditGraphDlg;