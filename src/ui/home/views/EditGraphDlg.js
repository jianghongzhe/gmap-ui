/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout, Input, Tabs, Modal, Form, message, Button, Divider, Popover } from 'antd';
import { PictureOutlined, FolderOpenOutlined, QuestionCircleOutlined } from '@ant-design/icons';



import { CirclePicker } from 'react-color'
import { Controlled as CodeMirror } from 'react-codemirror2'

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/addon/selection/active-line';
import 'codemirror/keymap/sublime';

import HelpDlg from './edit/HelpDlg';
import InsertImgDlg from './edit/InsertImgDlg';

import editorSvc from '../editorSvc';
import * as uiUtil from '../../../common/uiUtil';
import api from '../../api';

class EditGraphDlg extends React.Component {
    constructor(props) {
        super(props);
        this.codeMirrorInst = null;
        this.state = {
            colorPickerVisible: false,
            insertPicDlgVisible: false,
            helpDlgVisible: false,

            insertPicPath: '',
            insertPicName: '',
            insertPicHasSelFileSymbol:Symbol(),
        };
    }

    bindCodeMirrorInst = (editor) => {
        this.codeMirrorInst = editor;
    }

    onEditMapDlgEscKey = (cm) => {
        window.event.stopPropagation();
    }

    hideAllDlg = () => {
        this.setState({
            colorPickerVisible: false,
            insertPicDlgVisible: false,
            helpDlgVisible: false,
        });
    }

    

    /**
     * 替换内容并获得焦点
     * @param {*} originCursor   替换前光标位置
     * @param {*} originLineLen  替换前光标所在行的长度
     * @param {*} newCursor      替换后光标位置
     * @param {*} newLine        替换后整行的内容
     * @param {*} delayFocus     是否延迟获得焦点
     */
    replaceLine = (originCursor, originLineLen, newCursor, newLine, delayFocus = false) => {
        this.codeMirrorInst.setCursor(originCursor);
        this.codeMirrorInst.setSelection(originCursor, { line: originCursor.line, ch: originLineLen });
        this.codeMirrorInst.replaceSelection(newLine);
        this.codeMirrorInst.setCursor(newCursor);
        this.codeMirrorInst.setSelection(newCursor);
        this.codeMirrorInst.focus();

        //对话框刚关闭时，不能马上获得焦点，因此这种情况需要延迟一下
        if (delayFocus) {
            setTimeout(() => {
                this.codeMirrorInst.setCursor(newCursor);
                this.codeMirrorInst.setSelection(newCursor);
                this.codeMirrorInst.focus();
            }, 500);
        }
    }




    //-------------------颜色选择-----------------------------------
    onClearColor = () => {
        this.onAddColor(null);
    }

    onAddColor = (color = null, delayFocus = false) => {
        //获得当前光标位置与光标所在行
        if (!this.codeMirrorInst) { return; }
        let cursor = this.codeMirrorInst.getCursor();
        let { line } = cursor;
        let lineTxt = this.codeMirrorInst.getLine(line);

        //替换行
        let newLine = editorSvc.setColor(lineTxt, color);
        this.replaceLine({ line, ch: 0 }, lineTxt.length, { line, ch: newLine.length }, newLine, delayFocus);
    }

    handleColorPickerColorChange = (color) => {
        this.hideAllDlg();
        this.onAddColor(color.hex, true);
    }

    showColorPicker = () => {
        this.setState({ colorPickerVisible: true });
    }





    //-------------------增加图片-----------------------------------
    onAddPic = (picRelaPath,pname) => {
        //获得当前光标位置与光标所在行     
        if (!this.codeMirrorInst) { return; }
        let cursor = this.codeMirrorInst.getCursor();
        let { line, ch } = cursor;
        let lineTxt = this.codeMirrorInst.getLine(line);

        //替换行
        let { newLinetxt, cusorPos } = editorSvc.addPic(lineTxt, ch, picRelaPath,pname);
        this.replaceLine({ line, ch: 0 }, lineTxt.length, { line, ch: cusorPos }, newLinetxt, true);
    }

    showInsertPicDlg = () => {
        this.setState({
            insertPicDlgVisible: true,
            insertPicPath: '',
            insertPicName: '',
        });
    }

    onSelPicFile = () => {
        let selFilePaths = api.selPicFile();
        if (selFilePaths && selFilePaths[0]) {
            let fullpath = selFilePaths[0];
            let fn = fullpath.substring(Math.max(fullpath.lastIndexOf("\\"), fullpath.lastIndexOf("/")) + 1);
            this.setState({
                insertPicPath: fullpath,
                insertPicName: (''===this.state.insertPicName.trim()?fn:this.state.insertPicName),
                insertPicHasSelFileSymbol:Symbol(),
            });
        }
    }

    openPicByName = () => {
        api.openPicByName(this.state.insertPicName);
    }

    onAddPicCommit = () => {
        if (null != this.state.insertPicPath && 
                "" !== this.state.insertPicPath.trim() && 
                !api.existsFullpath(this.state.insertPicPath) &&
                !api.isUrlFormat(this.state.insertPicPath)) {
            message.warn("图片路径或url格式有误");
            return;
        }
        if (null == this.state.insertPicName || "" === this.state.insertPicName.trim()) {
            message.warn("图片显示名称不能为空");
            return;
        }
        if (this.state.insertPicName.includes("/") || this.state.insertPicName.includes("\\")) {
            message.warn('图片显示名称格式有误，不能包含 "/" 或 "\\" ');
            return;
        }
        if (true === api.existsPic(this.state.insertPicName)) {
            Modal.confirm({
                title: '是否覆盖',
                content: <>
                    <div css={{ marginBottom: 10 }}>图片显示名称已存在，是否要覆盖 ？</div>
                    <Button type="link" title='查看已有同名图片' css={{ margin: 0, padding: 0 }} onClick={this.openPicByName}>查看已有同名图片</Button>
                </>,
                icon: <QuestionCircleOutlined />,
                onOk: this.copyPicAndAddTxt
            });
            return;
        }

        this.copyPicAndAddTxt();
    }

    copyPicAndAddTxt = () => {
        //如果路径为空，则从剪切板找图片；否则从指定路径加载图片
        let prom =null;
        if(''===this.state.insertPicPath.trim()){//路径为空，从剪切板取图片
            prom=api.copyClipboardPicToImgsDir(this.state.insertPicName, this.props.activeKey);
        }else{//路径不为空，从文件取图片
            prom=api.copyPicToImgsDir(this.state.insertPicPath,this.state.insertPicName, this.props.activeKey);
        }
        prom.then(rs=>{
            this.hideAllDlg();
            this.onAddPic(rs,this.state.insertPicName);
        }).catch(e=>{
            message.warn(e.msg);
        });
    }



    showHelpPicDlg = () => {
        this.setState({
            helpDlgVisible: true,
        });
    }

    



    render() {
        let insertPicDlgW = (this.props.winW < 820 ? this.props.winW - 20 : 800);

        return (
            <>
                <Modal
                    title={"编辑图表 - " + this.props.currMapName}
                    css={{
                        width: (this.props.dlgW),
                        minWidth: (this.props.dlgW),
                        maxWidth: (this.props.dlgW)
                    }}
                    maskClosable={false}
                    visible={this.props.visible}
                    onOk={this.props.onOk}
                    onCancel={this.props.onCancel}>
                    <div>
                        <div css={{ 'marginBottom': "10px" }}>
                            {/* 颜色选择器 */}
                            {
                                ['#cf1322', '#389e0d', '#0050b3', '#fa8c16', '#13c2c2', '#ad6800', '#1890ff', '#722ed1', '#c41d7f'].map((eachcolor, colorInd) => (
                                    <div key={colorInd} title={eachcolor} css={getEditDlgColorBoxStyle(eachcolor)} onClick={this.onAddColor.bind(this, eachcolor)}></div>
                                ))
                            }
                            <div css={selColorStyle} title='选择颜色' onClick={this.showColorPicker}></div>
                            <div css={clearColorStyle} title='清除颜色' onClick={this.onClearColor}></div>

                            {/* 插入图片、帮助 */}
                            <PictureOutlined title='插入图片' css={insertImgStyle} onClick={this.showInsertPicDlg} />
                            <QuestionCircleOutlined title='帮助' css={helpStyle} onClick={this.showHelpPicDlg} />
                        </div>
                        <CodeMirror
                            css={getCodeEditorStyle(this.props.editorH)}
                            editorDidMount={this.bindCodeMirrorInst}
                            value={this.props.editTmpTxt}
                            options={{
                                lineNumbers: true,
                                theme: 'default',
                                mode: 'markdown',
                                styleActiveLine: true,
                                indentWithTabs: true,
                                indentUnit: 4,
                                keyMap: "sublime",
                                extraKeys: {
                                    "Ctrl-S": this.props.onOk,
                                    "Esc": this.onEditMapDlgEscKey
                                }
                            }}
                            onBeforeChange={this.props.onChangeEditTmpTxt} />
                    </div>
                </Modal>

                {/*插入图片对话框*/}
                <InsertImgDlg
                    dlgW={insertPicDlgW}
                    visible={this.state.insertPicDlgVisible}
                    insertPicPath={this.state.insertPicPath}
                    insertPicName={this.state.insertPicName} 
                    hasSelFileSymbo={this.state.insertPicHasSelFileSymbol}
                    onCancel={this.hideAllDlg}
                    onOk={this.onAddPicCommit}
                    onPicPathChange={uiUtil.bindChangeEventToState.bind(this, this, 'insertPicPath')} 
                    onPicNameChange={uiUtil.bindChangeEventToState.bind(this, this, 'insertPicName')} 
                    onSelPicFile={this.onSelPicFile}
                />

                {/* 颜色选择对话框 */}
                <Modal
                    title={null}
                    footer={null}
                    closable={false}
                    css={{
                        left: colorDlgAdjustX - (this.props.dlgW - colorDlgW) / 2,
                        top: colorDlgY,
                        width: colorDlgW,
                        minWidth: colorDlgW,
                        maxWidth: colorDlgW
                    }}
                    visible={this.state.colorPickerVisible}
                    onCancel={this.hideAllDlg}>
                    <CirclePicker onChange={this.handleColorPickerColorChange} />
                </Modal>

                {/* 帮助对话框 */}
                <HelpDlg
                    maxBodyH={this.props.editorH+50}
                    visible={this.state.helpDlgVisible}
                    onCancel={this.hideAllDlg}/>
            </>
        );
    }
}

//颜色选择对话框位置
const colorDlgW = 290;
const colorDlgAdjustX = 258;
const colorDlgY = 204;




const getCodeEditorStyle = (height) => ({
    '& .CodeMirror': {
        border: '1px solid lightgrey',
        fontSize: 16,
        height: height,
        maxHeight: height,
        minHeight: height,
    }
});



const baseHoverStyle = {
    cursor: 'pointer',
    transition: 'all 0.2s 0.1s',
    '&:hover': {
        borderRadius: 4,
        opacity: 0.6,
        // transform:'skew(-15deg)'
    }
}

const insertImgStyle = {
    fontSize: 19,
    marginLeft: 10,
    color: 'grey',
    ...baseHoverStyle,
    '&:hover': {
        opacity: 0.6,
        transform: 'skew(-15deg)'
    }
}

const helpStyle = {
    fontSize: 19,
    marginLeft: 10,
    color: '#1890ff',
    ...baseHoverStyle,
    '&:hover': {
        opacity: 0.6,
        transform: 'rotate(45deg)'
    }
}

const colorBoxhoverStyle = {
    width: 16,
    height: 16,
    display: 'inline-block',
    marginRight: 10,
    ...baseHoverStyle
}

const selColorStyle = {
    backgroundImage: 'linear-gradient(135deg,orange 20%,green 100%)',
    ...colorBoxhoverStyle
};

const clearColorStyle = {
    backgroundColor: 'white',
    border: '1px solid gray',
    ...colorBoxhoverStyle
};

const getEditDlgColorBoxStyle = (color) => ({
    backgroundColor: color,
    ...colorBoxhoverStyle
});



export default EditGraphDlg;