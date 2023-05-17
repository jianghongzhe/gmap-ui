import React, { useEffect, useRef, useState} from 'react';
import {Button, Input, List, Modal, Select} from 'antd';
import {FormOutlined, QuestionCircleOutlined, ReadOutlined, TableOutlined} from '@ant-design/icons';

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
import styles from './EditGraphDlg.module.scss';


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
                let currSavedTheme=await api.getEditorTheme();
                setTheme(currSavedTheme);
                console.log("curr theme loaded", currSavedTheme);
            })();
        },500);
    });

    const setAndSaveTheme=useMemoizedFn((val)=>{
        setTheme(val);
        api.saveEditorTheme(val);
    });

    const setCodeMirrorInst=useMemoizedFn((inst)=>{
        codeMirrorInstRef.current=inst;
    });


    const hideAllDlg =useMemoizedFn(() => {
        hideColorPicker();
        hideAdvColorPicker();
        hideRefNavDlg();
    });


    const gotoRefDefinition=useMemoizedFn((ref)=>{
        hideAllDlg();
        setTimeout(() => {
            editorSvcEx.gotoLine(codeMirrorInstRef.current, ref.headLineInd, ref.contentLineInd);    
        }, 400);
    });


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
                    title={<div className={styles.title}>
                        <span>{"编辑图表 - " + props.currMapName}</span>
                        <Select size='small'
                                className='theme_selector'
                                value={theme}
                                options={themeOpts}
                                onChange={setAndSaveTheme}
                        />
                        <span className='tag_container'>
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
                        <Input className='tag_input'
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
                    <div className={styles.toolbar}>
                        {/* 颜色选择器 */}
                        {
                            commonColors.map((eachcolor, colorInd) => (
                                <div key={colorInd}
                                     title={eachcolor}
                                     className={styles.assignedColorStyle}
                                     style={{'--bg_color':eachcolor,}}
                                     onClick={onAddColor.bind(this, eachcolor)}></div>
                            ))
                        }
                        <div className={styles.selColorStyle} title='选择颜色' onClick={showColorPicker}></div>
                        <div className={styles.selColorStyleAdv} title='选择颜色（高级）' onClick={showAdvColorPicker}></div>
                        <div className={styles.clearColorStyle} title='清除颜色' onClick={onClearColor}></div>

                        {/* 插入日期、图片、附件、帮助 */}
                        {/*<div className={styles.txtBtnStyle} title='查看引用' onClick={showRefs}>ref</div>*/}
                        {/*<div className={styles.txtBtnStyle} title='查看文本引用' onClick={showTrefs}>tref</div>*/}
                        <ReadOutlined className={styles.refStyle} title='跳转到引用' onClick={showRefs}/>
                        <FormOutlined className={styles.refStyle} title='跳转到文本引用' onClick={showTrefs}/>
                        <TableOutlined title="编辑表格（ Ctrl + T ）" className={styles.tableStyle} onClick={onEditTable}/>
                        <QuestionCircleOutlined title='帮助（ Ctrl + H ）' className={styles.helpStyle} onClick={props.onOpenHelpDlg} />
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
                <div className={styles.refNavDlgBody}>
                    <List
                        header={null}
                        footer={null}
                        bordered={false}
                        dataSource={refNavDlgItems}
                        renderItem={item => (
                            <List.Item className='item' onClick={gotoRefDefinition.bind(this, item)}>{item.name}</List.Item>
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


export default React.memo(EditGraphDlg);