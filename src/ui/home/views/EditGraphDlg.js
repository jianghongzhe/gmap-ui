/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, message, Button,List } from 'antd';
import { QuestionCircleOutlined, TableOutlined } from '@ant-design/icons';

import {withEnh} from '../../common/specialDlg';

import AdvColorPickerDlg from './edit/AdvColorPickerDlg';
import ColorPickerDlg from './edit/ColorPickerDlg';
import Editor from './edit/Editor';
import editorSvcEx from '../../../service/editorSvcEx';


const EnhDlg=withEnh(Modal);


/**
 * 编辑图表对话框
 */
const EditGraphDlg=(props)=>{
    const [editorAction, setEditorAction]= useState(null);
    const [colorPickerVisible, setColorPickerVisible]=useState(false);
    const [advColorPickerVisible, setAdvColorPickerVisible]=useState(false);
    const codeMirrorInstRef=useRef();
    const [refNavDlgVisible, setRefNavDlgVisible]=useState(false);
    const [refNavDlgTitle, setRefNavDlgTitle]=useState("");
    const [refNavDlgItems, setRefNavDlgItems]=useState([]);
    

    const hideAllDlg =useCallback(() => {
        setColorPickerVisible(false);
        setAdvColorPickerVisible(false);
        setRefNavDlgVisible(false);
    },[setColorPickerVisible, setAdvColorPickerVisible,   setRefNavDlgVisible]);

   


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



    
    


    //-------------------显示引用对话框与跳转功能-----------------------------------    
    const showRefs=useCallback(()=>{
        const items=editorSvcEx.loadAllRefNames(codeMirrorInstRef.current);
        if(null==items || 0===items.length){
            message.info("当前文档不存在引用");
            return;
        }
        setRefNavDlgItems(items);
        setRefNavDlgTitle("引用");
        setRefNavDlgVisible(true);
    },[setRefNavDlgItems, setRefNavDlgTitle, setRefNavDlgVisible]);

    const showTrefs=useCallback(()=>{
        const items=editorSvcEx.loadAllTrefNames(codeMirrorInstRef.current);
        if(null==items || 0===items.length){
            message.info("当前文档不存在文本引用");
            return;
        }
        setRefNavDlgItems(items);
        setRefNavDlgTitle("文本引用");
        setRefNavDlgVisible(true);
    },[setRefNavDlgItems, setRefNavDlgTitle, setRefNavDlgVisible]);

    const gotoRefDefinition=useCallback((ref)=>{
        hideAllDlg();
        setTimeout(() => {
            editorSvcEx.gotoLine(codeMirrorInstRef.current, ref.headLineInd, ref.contentLineInd);    
        }, 400);
    },[hideAllDlg]);

    const setCodeMirrorInst=useCallback((inst)=>{
        codeMirrorInstRef.current=inst;
    },[]);


    const onEditTable=useCallback(()=>{
        console.log("edit table cm", codeMirrorInstRef.current);
        message.warn("该功能正在建设中");
    },[codeMirrorInstRef]);

    

    /**
     * 每次显示后强制子编辑器组件重新渲染
     */
    useEffect(()=>{
        if(props.visible){
            setEditorAction({type: 'refresh',});
            setTimeout(() => {
                setEditorAction({type: 'refresh',});
            }, 500);
        }
    },[props.visible, setEditorAction]);


    return (
        <>
            <EnhDlg
                    title={"编辑图表 - " + props.currMapName}
                    size={{w:'calc(100vw - 200px)'}}
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
                        {/* <CalendarOutlined title='插入日期（ Ctrl + T ）' css={insertImgStyle} onClick={showDateDlg} />
                        <PictureOutlined title='插入图片（ Ctrl + P ）' css={insertImgStyle} onClick={showInsertPicDlg} />
                        <FileOutlined title='插入附件（ Ctrl + I ）' css={insertImgStyle} onClick={showInsertAttDlg} /> */}
                        <div css={txtBtnStyle} title='查看引用' onClick={showRefs}>ref</div>
                        <div css={txtBtnStyle} title='查看文本引用' onClick={showTrefs}>tref</div>
                        <TableOutlined title="编辑表格（ Ctrl + T ）" css={tableStyle} onClick={onEditTable}/>
                        <QuestionCircleOutlined title='帮助（ Ctrl + H ）' css={helpStyle} onClick={props.onOpenHelpDlg} />
                    </div>
                    <Editor
                        value={props.editTmpTxt}
                        action={editorAction}
                        onChange={props.onChangeEditTmpTxt}
                        onOnlySave={props.onOnlySave}
                        onOk={props.onOk}
                        onSetInst={setCodeMirrorInst}
                        onShowHelpDlg={props.onOpenHelpDlg}
                        onEditTable={onEditTable}
                    />
                </div>
            </EnhDlg>

            <Modal
                title={refNavDlgTitle}
                visible={refNavDlgVisible}
                onCancel={hideAllDlg}
                width={800}
                footer={null}>
                <div css={{overflowX:'hidden', overflowY:'auto', maxHeight:'calc(100vh - 320px)'}}>
                    <List
                        header={null}
                        footer={null}
                        bordered={false}
                        dataSource={refNavDlgItems}
                        renderItem={item => (
                            <List.Item css={{cursor:'pointer','&:hover':{color:'#1890ff',}}} onClick={gotoRefDefinition.bind(this, item)}>{item.name}</List.Item>
                        )}
                    />
                </div>
            </Modal>

            {/* 颜色选择对话框 */}
            <ColorPickerDlg
                visible={colorPickerVisible}
                onCancel={hideAllDlg}
                onOk={handleColorPickerColorChange}
            />
            <AdvColorPickerDlg
                visible={advColorPickerVisible}
                onCancel={hideAllDlg}
                onOk={handleColorPickerColorChange}
            />
            
            
        </>
    );
    
}



const commonColors=[
    '#cf1322', '#389e0d', '#0050b3', '#fa8c16', 
    '#13c2c2', '#ad6800', '#1890ff', '#722ed1', '#c41d7f'
];




const baseHoverStyle = {
    cursor: 'pointer',
    transition: 'all 0.2s 0.1s',
    '&:hover': {
        borderRadius: 6,
        opacity: 0.6,
        // transform:'skew(-15deg)'
    }
}

const txtBtnStyle={
    width: 30,
    height: 16,
    fontSize:'14px',
    lineHeight:'16px',
    textAlign:'center',
    display: 'inline-block',
    marginLeft: 10,
    borderRadius: 7,
    border:'1px solid grey',
    cursor: 'pointer',
    transition: 'all 0.2s 0.1s',
    '&:hover': {
        color: '#1890ff',
        borderRadius: 7,
        opacity: 0.8,
        border:'1px solid #1890ff',
        // transform:'skew(-15deg)'
    }
};

const tableStyle = {
    fontSize: 19,
    marginLeft: 10,
    color: '#1890ff',
    ...baseHoverStyle,
    '&:hover': {
        opacity: 0.6,
        transform: 'rotate(180deg)'
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