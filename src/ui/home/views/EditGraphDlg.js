/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Layout, Input, Tabs, Modal, Form, message, Button, Divider, Popover } from 'antd';
import { PictureOutlined, FolderOpenOutlined, QuestionCircleOutlined,CalendarOutlined,FileOutlined } from '@ant-design/icons';
import moment  from 'moment';


import { CirclePicker,PhotoshopPicker } from 'react-color';
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




import HelpDlg from './edit/HelpDlg';
import InsertImgDlg from './edit/InsertImgDlg';
import DateDlg from './edit/DateDlg';

import editorSvc from '../../../service/editorSvc';
import * as uiUtil from '../../../common/uiUtil';
import api from '../../../service/api';
import {withEnh} from '../../common/specialDlg';
import {connect} from '../../../common/gflow';

import AdvColorPickerDlg from './edit/AdvColorPickerDlg';
import ColorPickerDlg from './edit/ColorPickerDlg';
import {useSelector} from 'react-redux';

const EnhDlg=withEnh(Modal);


/**
 * 编辑图表对话框
 */
const EditGraphDlg=(props)=>{
    const {winW,winH,activeKey}= useSelector((state)=>({
        winW:       state.common.winW,
        winH:       state.common.winH,
        activeKey:  state.tabs.activeKey,
    }));

    const codeMirrorInstRef=useRef(null);

    const [colorPickerVisible, setColorPickerVisible]=useState(false);
    const [advColorPickerVisible, setAdvColorPickerVisible]=useState(false);
    const [insertPicDlgVisible, setInsertPicDlgVisible]=useState(false);
    const [helpDlgVisible, setHelpDlgVisible]=useState(false);
    const [dateDlgVisible, setDateDlgVisible]=useState(false);
    const [isImg, setIsImg]=useState(true);

    const bindCodeMirrorInstRef=useCallback((ele)=>{
        codeMirrorInstRef.current=ele;
    },[]);

    /**
     * 防止默认事件触发的处理
     */
    const onEditMapDlgPreventKey =useCallback(() => {
        if(window.event){
            window.event.stopPropagation();
            window.event.preventDefault();
        }
    },[]);

    /**
     * 显示后获取焦点
     */
    useEffect(()=>{
       if(props.visible) {
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
    },[props.visible]);

    


    const hideAllDlg = () => {
        setColorPickerVisible(false);
        setAdvColorPickerVisible(false);
        setInsertPicDlgVisible(false);
        setHelpDlgVisible(false);
        setDateDlgVisible(false);
    }

    

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




    //-------------------颜色选择-----------------------------------
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
    },[]);

    const onClearColor =useCallback(() => {
        onAddColor(null);
    },[onAddColor]);

    const handleColorPickerColorChange = (color) => {
        hideAllDlg();
        onAddColor(color.hex, true);
    }

    

    const showColorPicker =useCallback(() => {
        setColorPickerVisible(true);
    },[setColorPickerVisible]);

    const showAdvColorPicker =useCallback(() => {
        setAdvColorPickerVisible(true);
    },[setAdvColorPickerVisible]);





    //-------------------增加图片-----------------------------------
    const onAddPic = (picRelaPath,pname) => {
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
    }

    const onAddAtt = (picRelaPath,pname) => {
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
    }

    const showInsertPicDlg =useCallback(() => {
        setIsImg(true);
        setInsertPicDlgVisible(true);
    },[setIsImg, setInsertPicDlgVisible]);

    const showInsertAttDlg=useCallback(()=>{
        setIsImg(false);
        setInsertPicDlgVisible(true);
    },[setIsImg, setInsertPicDlgVisible]);

    


    

    



    const showHelpPicDlg = () => {
        setHelpDlgVisible(true);
    }


    //-------------------插入日期-----------------------------------    
    const showDateDlg=()=>{
        setDateDlgVisible(true);
    }

    

    const onInsertDate=(dateStr)=>{
        if(null===dateStr || ''===dateStr.trim()){
            message.warn("请选择日期");
            return;
        }

        hideAllDlg();

        //获得当前光标位置与光标所在行
        if(!codeMirrorInstRef.current){
            return;
        }
        const codeMirrorInst=codeMirrorInstRef.current; 
        let cursor = codeMirrorInst.getCursor();
        let { line, ch } = cursor;
        let lineTxt = codeMirrorInst.getLine(line);

        //替换行
        let targetDateStr=dateStr.substring(2).replace(/[-]/g,'.');//去掉两位年
        let { newLinetxt, cusorPos } = editorSvc.addDate(lineTxt, ch, targetDateStr);
        replaceLine({ line, ch: 0 }, lineTxt.length, { line, ch: cusorPos }, newLinetxt, true);
    }

    



    
    let insertPicDlgW = (winW < 820 ? winW - 20 : 800);

    return (
        <>
            <EnhDlg
                    title={"编辑图表 - " + props.currMapName}
                    size={{w:winW-200}}
                    maskClosable={false}
                    visible={props.visible}
                    footer={[
                        <Button key="btncancel" onClick={props.onCancel}>取消</Button>,
                        <Button key="btnneutral" type="primary" onClick={props.onOnlySave}>保存</Button>,
                        <Button key="btnok" type="primary" onClick={props.onOk}>保存并关闭</Button>,
                    ]}
                    onCancel={props.onCancel}>
                        
                <div>
                    <div css={{ 'marginBottom': "10px" }}>
                        {/* 颜色选择器 */}
                        {
                            ['#cf1322', '#389e0d', '#0050b3', '#fa8c16', '#13c2c2', '#ad6800', '#1890ff', '#722ed1', '#c41d7f'].map((eachcolor, colorInd) => (
                                <div key={colorInd} title={eachcolor} css={getEditDlgColorBoxStyle(eachcolor)} onClick={onAddColor.bind(this, eachcolor)}></div>
                            ))
                        }
                        <div css={selColorStyle} title='选择颜色' onClick={showColorPicker}></div>
                        <div css={selColorStyleAdv} title='选择颜色（高级）' onClick={showAdvColorPicker}></div>
                        <div css={clearColorStyle} title='清除颜色' onClick={onClearColor}></div>

                        {/* 插入图片、帮助 */}
                        <CalendarOutlined title='插入日期（ Ctrl + T ）' css={insertImgStyle} onClick={showDateDlg} />
                        <PictureOutlined title='插入图片（ Ctrl + P ）' css={insertImgStyle} onClick={showInsertPicDlg} />
                        <FileOutlined title='插入附件（ Ctrl + I ）' css={insertImgStyle} onClick={showInsertAttDlg} />
                        <QuestionCircleOutlined title='帮助（ Ctrl + H ）' css={helpStyle} onClick={showHelpPicDlg} />
                    </div>
                    <CodeMirror
                        css={getCodeEditorStyle(winH-400)}
                        editorDidMount={bindCodeMirrorInstRef}
                        value={props.editTmpTxt}
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
                                "Ctrl-P": showInsertPicDlg,
                                "Ctrl-I": showInsertAttDlg,
                                "Ctrl-H": showHelpPicDlg,
                                "Ctrl-T": showDateDlg,
                                

                                "Shift-Ctrl-G": onEditMapDlgPreventKey,
                                "Shift-Ctrl-F": onEditMapDlgPreventKey,
                                "Shift-Ctrl-R": onEditMapDlgPreventKey,
                                "Esc": onEditMapDlgPreventKey,
                                "Alt-G": onEditMapDlgPreventKey,
                            }
                        }}
                        onBeforeChange={props.onChangeEditTmpTxt} />
                </div>
            </EnhDlg>

            {/*插入图片对话框*/}
            <InsertImgDlg                    
                visible={insertPicDlgVisible}
                dlgW={insertPicDlgW}
                isImg={isImg}
                activeKey={activeKey}
                onAddPic ={onAddPic}
                onAddAtt={onAddAtt}
                onCancel={hideAllDlg}
            />

            {/* 颜色选择对话框 */}
            <ColorPickerDlg
                t={colorDlgY}
                offsetX={colorDlgAdjustX}
                parW={winW-200}
                visible={colorPickerVisible}
                onCancel={hideAllDlg}
                onOk={handleColorPickerColorChange}
            />
            <AdvColorPickerDlg
                t={colorDlgY}
                offsetX={advColorDlgAdjustX}
                parW={winW-200}
                visible={advColorPickerVisible}
                onCancel={hideAllDlg}
                onOk={handleColorPickerColorChange}
            />
            



            {/* 帮助对话框 */}
            <HelpDlg
                maxBodyH={winH-400+80}
                visible={helpDlgVisible}
                onCancel={hideAllDlg}/>

            {/* 插入日期对话框 */}
            <DateDlg
                visible={dateDlgVisible}
                onCancel={hideAllDlg}
                onOk={onInsertDate}
                />
        </>
    );
    
}

//颜色选择对话框位置
const colorDlgAdjustX = 258;
const advColorDlgAdjustX = 284;
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

const selColorStyleAdv = {
    backgroundImage: 'linear-gradient(135deg,orange 20%,pink 40%,green 100%)',
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



export default React.memo(EditGraphDlg);