/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider,Popover } from 'antd';
import { CirclePicker  } from 'react-color'
import {Controlled as CodeMirror} from 'react-codemirror2'

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/addon/selection/active-line';  
import 'codemirror/keymap/sublime';

import editorSvc from '../editorSvc';

class EditGraphDlg extends React.Component {
    constructor(props) {
        super(props);
        this.codeMirrorInst=null;
        this.state = { 
            colorPickerVisible:false,
        };
    }

    bindCodeMirrorInst=(editor)=>{
        this.codeMirrorInst = editor;
    }

    onEditMapDlgEscKey=(cm)=>{
        window.event.stopPropagation();
    }

    onClearColor=()=>{
        this.onAddColor(null);
    }

    onAddColor=(color=null)=>{
        if(!this.codeMirrorInst){return;}
        let cursor=this.codeMirrorInst.getCursor();
        let {line,ch}=cursor;
        let lineTxt=this.codeMirrorInst.getLine(line);
        let newLine=editorSvc.setColor(lineTxt,color);

        //插入内容并设置光标位置
        this.codeMirrorInst.setCursor({line,ch:0});
        this.codeMirrorInst.setSelection({line,ch:0},{line,ch:lineTxt.length})
        this.codeMirrorInst.replaceSelection(newLine);
        this.codeMirrorInst.setCursor({line,ch:newLine.length});
        this.codeMirrorInst.setSelection({line,ch:newLine.length});
        this.codeMirrorInst.focus();
    }

    handleColorChange=(color)=>{
        this.hideColorPicker();
        this.onAddColor(color.hex);
        setTimeout(()=>{
            this.codeMirrorInst.focus();
        },500);
    }

    showColorPicker=()=>{
        this.setState({colorPickerVisible:true});
    }
    hideColorPicker=()=>{
        this.setState({colorPickerVisible:false});
    }
    test=()=>{
        console.log("out out");
    }

    render() {
        console.log("位置",(this.props.winW-this.props.dlgW)/2+200,);

        return (
            <>
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
                                    <div key={colorInd} title={eachcolor} css={getEditDlgColorBoxStyle(eachcolor)} onClick={this.onAddColor.bind(this,eachcolor)}></div>
                                ))
                            }    
                            <div css={selColorStyle} title='选择颜色' onClick={this.showColorPicker}></div>  
                            <div css={clearColorStyle} title='清除颜色' onClick={this.onClearColor}></div>                  
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
                <Modal
                    title={null}
                    footer={null}
                    closable={false}
                    css={{
                        left:258-(this.props.dlgW-290)/2,
                        // left:-200,
                        top:204,
                        width: 290 ,
                        minWidth: 290,
                        maxWidth: 290
                    }}
                    visible={this.state.colorPickerVisible}
                    onCancel={this.hideColorPicker}>
                    <CirclePicker onChange={this.handleColorChange}/>
                </Modal>
            </>
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

const selColorStyle={
    backgroundImage:'linear-gradient(135deg,orange 20%,green 100%)',
    width:          16,
    height:         16,
    display:        'inline-block',
    cursor:         'pointer',
    marginRight:    10,
};

const clearColorStyle={
    backgroundColor:'white',
    width:          16,
    height:         16,
    display:        'inline-block',
    cursor:         'pointer',
    border:         '1px solid gray',
    marginRight:    10,
};

const getEditDlgColorBoxStyle=(color)=>({
    backgroundColor:color,
    width:          16,
    height:         16,
    display:        'inline-block',
    cursor:         'pointer',
    marginRight:    10,
});

export default EditGraphDlg;