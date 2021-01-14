/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Layout, Input, Tabs, Modal, Form, message, Button, Divider, Popover } from 'antd';
import { PictureOutlined, FolderOpenOutlined, QuestionCircleOutlined,CalendarOutlined,FileOutlined } from '@ant-design/icons';
import {useSelector} from 'react-redux';

import {withEnh} from '../../common/specialDlg';

import HelpDlg from './edit/HelpDlg';
import InsertImgDlg from './edit/InsertImgDlg';
import DateDlg from './edit/DateDlg';
import AdvColorPickerDlg from './edit/AdvColorPickerDlg';
import ColorPickerDlg from './edit/ColorPickerDlg';
import Editor from './edit/Editor';



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

    const [editorForceRefresh, setEditorForceRefresh]= useState(Symbol());
    const [editorAction, setEditorAction]= useState(null);
    const [colorPickerVisible, setColorPickerVisible]=useState(false);
    const [advColorPickerVisible, setAdvColorPickerVisible]=useState(false);
    const [insertPicDlgVisible, setInsertPicDlgVisible]=useState(false);
    const [helpDlgVisible, setHelpDlgVisible]=useState(false);
    const [dateDlgVisible, setDateDlgVisible]=useState(false);
    const [isImg, setIsImg]=useState(true);

    

    const hideAllDlg =useCallback(() => {
        setColorPickerVisible(false);
        setAdvColorPickerVisible(false);
        setInsertPicDlgVisible(false);
        setHelpDlgVisible(false);
        setDateDlgVisible(false);
    },[setColorPickerVisible, setAdvColorPickerVisible, setInsertPicDlgVisible, setHelpDlgVisible, setDateDlgVisible]);

    const showHelpPicDlg = useCallback(() => {
        setHelpDlgVisible(true);
    },[setHelpDlgVisible]);



    //-------------------颜色选择相关-----------------------------------
    const onAddColor =useCallback((color = null, delayFocus = false) => {
        setEditorAction({
            type: 'addColor',
            color,
            delayFocus
        });
    },[setEditorAction]);

    const onClearColor =useCallback(() => {
        onAddColor(null);
    },[onAddColor]);

    const handleColorPickerColorChange =useCallback((color) => {
        hideAllDlg();
        onAddColor(color.hex, true);
    },[hideAllDlg, onAddColor]);

    const showColorPicker =useCallback(() => {
        setColorPickerVisible(true);
    },[setColorPickerVisible]);

    const showAdvColorPicker =useCallback(() => {
        setAdvColorPickerVisible(true);
    },[setAdvColorPickerVisible]);



    //-------------------增加图片或附件相关-----------------------------------
    const onAddPic =useCallback((picRelaPath,pname) => {
        setEditorAction({
            type:       'addPic',
            relaPath:   picRelaPath,
            name:       pname,
        });
    },[setEditorAction]);

    const onAddAtt =useCallback((picRelaPath,pname) => {
        setEditorAction({
            type:       'addAtt',
            relaPath:   picRelaPath, 
            name:       pname,
        });
    },[setEditorAction]);

    const showInsertPicDlg =useCallback(() => {
        setIsImg(true);
        setInsertPicDlgVisible(true);
    },[setIsImg, setInsertPicDlgVisible]);

    const showInsertAttDlg=useCallback(()=>{
        setIsImg(false);
        setInsertPicDlgVisible(true);
    },[setIsImg, setInsertPicDlgVisible]);




    //-------------------插入日期相关-----------------------------------    
    const showDateDlg=useCallback(()=>{
        setDateDlgVisible(true);
    },[setDateDlgVisible]);

    const onInsertDate=useCallback((dateStr)=>{
        if(null===dateStr || ''===dateStr.trim()){
            message.warn("请选择日期");
            return;
        }

        hideAllDlg();
        setEditorAction({
            type: 'addDate',
            date: dateStr.trim(),
        });        
    },[hideAllDlg, setEditorAction]);

    

    /**
     * 每次显示后强制子编辑器组件重新渲染
     */
    useEffect(()=>{
        if(props.visible){
            setEditorForceRefresh(Symbol());
        }
    },[props.visible]);


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
                            commonColors.map((eachcolor, colorInd) => (
                                <div key={colorInd} title={eachcolor} css={getEditDlgColorBoxStyle(eachcolor)} onClick={onAddColor.bind(this, eachcolor)}></div>
                            ))
                        }
                        <div css={selColorStyle} title='选择颜色' onClick={showColorPicker}></div>
                        <div css={selColorStyleAdv} title='选择颜色（高级）' onClick={showAdvColorPicker}></div>
                        <div css={clearColorStyle} title='清除颜色' onClick={onClearColor}></div>

                        {/* 插入日期、图片、附件、帮助 */}
                        <CalendarOutlined title='插入日期（ Ctrl + T ）' css={insertImgStyle} onClick={showDateDlg} />
                        <PictureOutlined title='插入图片（ Ctrl + P ）' css={insertImgStyle} onClick={showInsertPicDlg} />
                        <FileOutlined title='插入附件（ Ctrl + I ）' css={insertImgStyle} onClick={showInsertAttDlg} />
                        <QuestionCircleOutlined title='帮助（ Ctrl + H ）' css={helpStyle} onClick={showHelpPicDlg} />
                    </div>
                    <Editor
                        value={props.editTmpTxt}
                        forceRefresh={editorForceRefresh}
                        action={editorAction}
                        onChange={props.onChangeEditTmpTxt}
                        onOnlySave={props.onOnlySave}
                        onOk={props.onOk}
                        onShowInsertPicDlg={showInsertPicDlg}
                        onShowInsertAttDlg={showInsertAttDlg}
                        onShowHelpDlg={showHelpPicDlg}
                        onShowDateDlg={showDateDlg}
                    />
                </div>
            </EnhDlg>

            {/*插入图片对话框*/}
            <InsertImgDlg                    
                visible={insertPicDlgVisible}
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


const commonColors=[
    '#cf1322', '#389e0d', '#0050b3', '#fa8c16', 
    '#13c2c2', '#ad6800', '#1890ff', '#722ed1', '#c41d7f'
];


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