import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, message, Button,List } from 'antd';
import { QuestionCircleOutlined, TableOutlined } from '@ant-design/icons';

import {withEnh} from '../../common/specialDlg';

import AdvColorPickerDlg from './edit/AdvColorPickerDlg';
import ColorPickerDlg from './edit/ColorPickerDlg';
import Editor from './edit/Editor';
import editorSvcEx from '../../../service/editorSvcEx';
import TableEditDlg from './edit/TableEditDlg';
import { useBoolean } from 'ahooks';
import {useTableEditDlg} from "../../../hooks/tableEditDlg";
import {useRefNavDlg} from "../../../hooks/refNavDlg";
import {useColorPicker} from "../../../hooks/colorPicker";


const EnhDlg=withEnh(Modal);


/**
 * 编辑图表对话框
 */
const EditGraphDlg=(props)=>{
    const codeMirrorInstRef=useRef();
    const [editorAction, setEditorAction]= useState(null);
    const [colorPickerVisible, advColorPickerVisible, onAddColor, onClearColor, showColorPicker, showAdvColorPicker, handleColorPickerColorChange, hideColorPicker, hideAdvColorPicker]=useColorPicker(setEditorAction);
    const [refNavDlgVisible,refNavDlgTitle,refNavDlgItems, showRefs, showTrefs, hideRefNavDlg]=useRefNavDlg(codeMirrorInstRef);
    const [tableEditData, tableEditDlgVisible, onEditTable, onSetTableMarkdown, hideTableEditDlg]=useTableEditDlg(codeMirrorInstRef);


    const setCodeMirrorInst=useCallback((inst)=>{
        codeMirrorInstRef.current=inst;
    },[]);


    const hideAllDlg =useCallback(() => {
        hideColorPicker();
        hideAdvColorPicker();
        hideRefNavDlg();
    },[hideColorPicker, hideAdvColorPicker,   hideRefNavDlg]);


    const gotoRefDefinition=useCallback((ref)=>{
        hideAllDlg();
        setTimeout(() => {
            editorSvcEx.gotoLine(codeMirrorInstRef.current, ref.headLineInd, ref.contentLineInd);    
        }, 400);
    },[hideAllDlg]);


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
            
            <TableEditDlg visible={tableEditDlgVisible} onCancel={hideTableEditDlg} data={tableEditData} onOk={onSetTableMarkdown}/>
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