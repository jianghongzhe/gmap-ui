import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button, List, Modal} from 'antd';
import {QuestionCircleOutlined, TableOutlined} from '@ant-design/icons';
import {tw} from 'gstyle-creater/src';

import {withEnh} from '../../common/specialDlg';

import AdvColorPickerDlg from './edit/AdvColorPickerDlg';
import ColorPickerDlg from './edit/ColorPickerDlg';
import Editor from './edit/Editor';
import editorSvcEx from '../../../service/editorSvcEx';
import TableEditDlg from './edit/TableEditDlg';
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
                    <div css={toolbarStyle}>
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

const toolbarStyle=tw('mb-6');


const baseHoverStyle = {
    ...tw("cursor-pointer transition-all duration-0.2s delay:0.1s"),
    '&:hover': tw("rounded-6 opacity-0.6"),
}

const txtBtnStyle={
    ...tw(`
        w-30 h-18 text-14 leading-18 text-center align-top inline-block ml-10 rounded-7 cursor-pointer
        transition-all duration-0.5s delay:2.5s
        border-1 border-solid border-grey
    `),
    '&:hover': tw('text-#1890ff rounded-7 opacity-0.8 border-1 border-solid border-#1890ff')
};

const tableStyle = {
    ...tw('text-19 ml-10 text-#1890ff'),
    ...baseHoverStyle,
    '&:hover': tw('opacity-0.6 rotate-180'),
}

const helpStyle = {
    ...tw('text-19 ml-10 text-#1890ff'),
    ...baseHoverStyle,
    '&:hover': tw('opacity-0.6 rotate-45')
}

const colorBoxhoverStyle = {
    ...tw("w-16 h-16 inline-block mr-10"),
    ...baseHoverStyle
}

const selColorStyle = {
    ...tw("bg-[linear-gradient(135deg,orange 20%,green 100%)]"),
    ...colorBoxhoverStyle
};

const selColorStyleAdv = {
    ...tw('bg-[linear-gradient(135deg,orange 20%,pink 40%,green 100%)]'),
    ...colorBoxhoverStyle
};

const clearColorStyle = {
    ...tw('bg-white border-1 border-solid border-gray'),
    ...colorBoxhoverStyle
};

const getEditDlgColorBoxStyle = (color) => ({
    ...tw(`bg-${color}`),
    ...colorBoxhoverStyle
});



export default React.memo(EditGraphDlg);