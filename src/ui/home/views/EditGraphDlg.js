import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button, Input, List, Modal, Select} from 'antd';
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
import TagItem from "../../common/TagItem";
import {dispatch} from "use-bus";
import {editorEvents} from "../../../common/events";
import {useMemoizedFn, useMount} from "ahooks";
import api from "../../../service/api";


const EnhDlg=withEnh(Modal);


/**
 * 编辑图表对话框
 */
const EditGraphDlg=(props)=>{
    const codeMirrorInstRef=useRef();
    const [colorPickerVisible, advColorPickerVisible, onAddColor, onClearColor, showColorPicker, showAdvColorPicker, handleColorPickerColorChange, hideColorPicker, hideAdvColorPicker]=useColorPicker();
    const [refNavDlgVisible,refNavDlgTitle,refNavDlgItems, showRefs, showTrefs, hideRefNavDlg]=useRefNavDlg(codeMirrorInstRef);
    const [tableEditData, tableEditDlgVisible, onEditTable, onSetTableMarkdown, hideTableEditDlg]=useTableEditDlg(codeMirrorInstRef);

    const [theme, setTheme]= useState('default');

    useMount(()=>{
        setTimeout(()=>{
            (async ()=>{
                let currSavedTheme=await api.getTheme();
                setTheme(currSavedTheme);
                console.log("curr theme loaded", currSavedTheme);
            })();
        },500);
    });

    const setAndSaveTheme=useMemoizedFn((val)=>{
        setTheme(val);
        api.saveTheme(val);
    });

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
            dispatch({
               type: editorEvents.show,
               payload: null,
            });
        }
    },[props.visible]);


    return (
        <>
            <EnhDlg
                    title={<div>
                        <span>{"编辑图表 - " + props.currMapName}</span>
                        <Select size='small'
                                style={{ marginLeft:'30px',marginRight:'0px', width:'200px'}}
                                value={theme}
                                options={themeOpts}
                                onChange={setAndSaveTheme}
                        />
                        <span style={{marginLeft:'40px'}}>
                            {
                                props.tags.map((tag,ind)=>
                                    <TagItem key={`taglist-item${ind}`}
                                             tag={tag}
                                             colored
                                             onClose={props.onRemoveTagByInd.bind(this,ind)}
                                    />
                                )
                            }
                        </span>
                        <Input style={{width:'100px'}}
                               size="small"
                               placeholder='+ 标签'
                               value={props.tagVal}
                               bordered={false}
                               onChange={props.onChangeTagVal}
                               onPressEnter={props.onAddTag.bind(this, props.tagVal)}/>
                    </div>}
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
                        theme={theme}
                        value={props.editTmpTxt}
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
                open={refNavDlgVisible}
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


/**
 * 主题下拉框选项
 * @type {{label: *, value: *}[]}
 */
const themeOpts=(()=>{
    const opts= [
        "3024-day",
        "colorforth",
        "juejin",
        "neat",
        "solarized",
        "3024-night",
        "darcula",
        "lesser-dark",
        "neo",
        "ssms",
        "abbott",
        "dracula",
        "liquibyte",
        "night",
        "the-matrix",
        "abcdef",
        "duotone-dark",
        "lucario",
        "nord",
        "tomorrow-night-bright",
        "ambiance-mobile",
        "duotone-light",
        "material-darker",
        "oceanic-next",
        "tomorrow-night-eighties",
        "ambiance",
        "eclipse",
        "material-ocean",
        "panda-syntax",
        "ttcn",
        "ayu-dark",
        "elegant",
        "material-palenight",
        "paraiso-dark",
        "twilight",
        "ayu-mirage",
        "erlang-dark",
        "material",
        "paraiso-light",
        "vibrant-ink",
        "base16-dark",
        "gruvbox-dark",
        "mbo",
        "pastel-on-dark",
        "xq-dark",
        "base16-light",
        "hopscotch",
        "mdn-like",
        "railscasts",
        "xq-light",
        "bespin",
        "icecoder",
        "midnight",
        "rubyblue",
        "yeti",
        "blackboard",
        "idea",
        "monokai",
        "seti",
        "yonce",
        "cobalt",
        "isotope",
        "moxer",
        "shadowfox",
        "zenburn",
    ].sort((s1,s2)=>s1.localeCompare(s2)).map(name=>({
        value: name,
        label: name,
    }));
    opts.unshift({
        value: 'default',
        label: '默认主题',
    })
    return opts;
})();









const commonColors=[
    '#cf1322', '#389e0d', '#0050b3', '#fa8c16', 
    '#13c2c2', '#ad6800', '#1890ff', '#722ed1', '#c41d7f'
];

const toolbarStyle=tw('mb-6');


const baseHoverStyle = tw(
    "cursor-pointer transition-all duration-0.2s delay:0.1s",
    {'&:hover': "rounded-6 opacity-0.6"},
);

const txtBtnStyle=tw(
    `
        w-30 h-18 text-14 leading-18 text-center align-top inline-block ml-10 rounded-7 cursor-pointer
        transition-all duration-0.5s delay:2.5s
        border-1 border-solid border-grey
    `,
    {'&:hover': 'text-#1890ff rounded-7 opacity-0.8 border-1 border-solid border-#1890ff'},
);

const tableStyle = {
    ...baseHoverStyle,
    ...tw(
        'text-19 ml-10 text-#1890ff',
        {'&:hover': 'opacity-0.6 rotate-180'},
    ),
}

const helpStyle = {
    ...baseHoverStyle,
    ...tw(
        'text-19 ml-10 text-#1890ff',
        {'&:hover': 'opacity-0.6 rotate-45'},
    ),
}

const colorBoxhoverStyle = {
    ...baseHoverStyle,
    ...tw("w-16 h-16 inline-block mr-10"),
}

const selColorStyle = {
    ...colorBoxhoverStyle,
    ...tw("bg-[linear-gradient(135deg,orange 20%,green 100%)]"),

};

const selColorStyleAdv = {
    ...colorBoxhoverStyle,
    ...tw('bg-[linear-gradient(135deg,orange 20%,pink 40%,green 100%)]'),
};

const clearColorStyle = {
    ...colorBoxhoverStyle,
    ...tw('bg-white border-1 border-solid border-gray'),
};

const getEditDlgColorBoxStyle = (color) => ({
    ...colorBoxhoverStyle,
    ...tw(`bg-${color}`),
});



export default React.memo(EditGraphDlg);