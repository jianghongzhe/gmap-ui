/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout, Input,  Tabs, Modal,Form,  message, Button, Divider,Popover } from 'antd';
import { PictureOutlined, FolderOpenOutlined } from '@ant-design/icons';



import { CirclePicker  } from 'react-color'
import {Controlled as CodeMirror} from 'react-codemirror2'

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/addon/selection/active-line';  
import 'codemirror/keymap/sublime';

import editorSvc from '../editorSvc';
import api from '../../api';

class EditGraphDlg extends React.Component {
    constructor(props) {
        super(props);
        this.codeMirrorInst=null;
        this.state = { 
            colorPickerVisible:false,
            insertPicDlgVisible:false,
            insertPicPath:'',
            insertPicName:'',
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


    showInsertPicDlg=()=>{
        this.setState({
            insertPicDlgVisible:true,
            insertPicPath:'',
            insertPicName:'',

        });
    }
    hideInsertPicDlg=()=>{
        this.setState({insertPicDlgVisible:false});
    }

    test=()=>{
        console.log("out out");
    }

    onInsertPicPathChanged=(e)=>{
        this.setState({
            insertPicPath:e.target.value
        });
    }

    onInsertPicNameChanged=(e)=>{
        this.setState({
            insertPicName:e.target.value
        });
    }

    selPic=()=>{
        let selFilePaths=api.selPicFile();
        if(selFilePaths && selFilePaths[0]){
            this.setState({
                insertPicPath:selFilePaths[0]
            });
        }
    }

    onAddPicCommit=()=>{
        console.log(1111);
        try{
            console.log("选择文件");
            console.log(this.state.insertPicPath);
            console.log(this.state.insertPicName);
            console.log(this.props.activeKey);

            let rs=null;
            //是文件路径
            if(true){
                rs=api.copyPicToImgsDir(this.state.insertPicPath,this.state.insertPicName,this.props.activeKey);
            }
            //是网络url
            else{
                //。。。。下载并复制到指定目录
            }

            
            console.log("选择文件结果",rs);
        }catch(e){
            console.error(e);
        }
    }



    render() {
        console.log("位置",(this.props.winW-this.props.dlgW)/2+200,);

        let insertPicDlgW= (this.props.winW<800?this.props.winW-20:800);

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

                            {/* <Divider type="vertical" /> */}
                            <PictureOutlined title='插入图片' css={{
                                fontSize:19,
                                marginLeft:10,
                                cursor:'pointer',
                                transition:'all 0.2s 0.1s',
                                '&:hover':{
                                    opacity:0.6,
                                    transform:'skew(-15deg)'
                                }

                            }} onClick={this.showInsertPicDlg}/>
                            {/* <Button type="circle" css={{marginBottom:20}} size='small' title='插入图片' shape="circle" icon={<PictureOutlined />} onClick={this.showInsertPicDlg}/> */}
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
                    title="插入图片"
                    closable={true}
                    css={{
                        width: insertPicDlgW ,
                        minWidth: insertPicDlgW,
                        maxWidth:insertPicDlgW
                    }}
                    visible={this.state.insertPicDlgVisible}
                    onCancel={this.hideInsertPicDlg}
                    onOk={this.onAddPicCommit}>

                    <div css={{
                        width:'100%',
                        display:'table',
                        '& .row':{
                            display: 'table-row'
                        },
                        '& .cell.space':{
                            // paddingTop:10,
                        },
                        '& .cell':{
                            display: 'table-cell',
                            verticalAlign:'center',
                            paddingTop:5,
                            paddingBottom:5,
                        },
                        '& .cell.lab':{
                            width:80,
                        },
                    }}>
                        <div className='row'>
                            <div className='cell lab'>
                                图片位置：
                            </div>
                            <div className='cell'>
                                <Input value={this.state.insertPicPath} onChange={this.onInsertPicPathChanged} addonAfter={
                                    <FolderOpenOutlined onClick={this.selPic} css={{cursor:'pointer'}}/>
                                } placeholder='请输入图片本地路径或url' />
                            </div>
                        </div>
                        <div className='row space'>
                            <div className='cell lab space'>
                                显示名称：
                            </div>
                            <div className='cell space'>
                                <Input value={this.state.insertPicName} onChange={this.onInsertPicNameChanged} placeholder='请输入图片显示名称'/>
                            </div>
                        </div>
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


const hoverStyle={
    width:          16,
    height:         16,
    display:        'inline-block',
    cursor:         'pointer',
    marginRight:    10,
    transition:     'all 0.2s 0.1s',
    '&:hover':{
        opacity:0.6,
        transform:'skew(-15deg)',
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
    ...hoverStyle
};

const clearColorStyle={
    backgroundColor:'white',
    border:         '1px solid gray',
    ...hoverStyle
};

const getEditDlgColorBoxStyle=(color)=>({
    backgroundColor:color,
    ...hoverStyle
});



export default EditGraphDlg;