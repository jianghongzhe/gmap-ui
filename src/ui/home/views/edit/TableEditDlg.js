/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Table, Input  } from 'antd';
import { DoubleLeftOutlined,LeftOutlined,RightOutlined,DoubleRightOutlined } from '@ant-design/icons';
import moment  from 'moment';
import {withEnh} from '../../../common/specialDlg';


const EnhDlg=withEnh(Modal);

/**
 * 日期选择对话框
 * @param {
 *  visible: true,                      //
 *  data: {
 *      hasInitData: false,             // 是否有初始数据，如果光标所在行为空行则为false，否则为true
 *      data: {
 *          heads: ['标题1','标题2'],   // 标题名称
 *          aligns: ['left','right'],   // 对齐方式
 *          lines: [
 *              ['', ''],               // 每行的数据
 *              ['', '']
 *          ] ,
 *      },  
 *      fromPos: {line: 0, ch: 0},      // codemirror中表格部分的起始行及行首位置
 *      toPos: {line: 10, ch: 15},      // codemirror中表格部分的结束行及行尾位置，用于生成新的markdown后替换
 *      needExtraBlankLine: true,       // 生成的结果markdown文本中是否包含前后的空行，当光标所在行为空时会指定为true，以与其它部分区别开
 *  }
 *  
 */
const TableEditDlg=({visible, data, onCancel, onOk})=>{
    
    const [colNames, setColNames]= useState([]);
    const [lines, setLines]= useState([]);


    const onChange=useCallback((line, col, e)=>{
        console.log("--->>");
        setLines(originLines=>{
            let newLines=[...originLines];
            newLines[line][`${col}`]={
                line,
                col,
                data: e.target.value,
            };
            console.log(newLines);
            return newLines;
        });
        console.log("--->>222");
    },[setLines]);

    const columns = useMemo(()=>{
        return colNames.map((col,_ind)=>{
            const ind=_ind;
            return {
                title: col,
                dataIndex: `${ind}`,
                key: ''+ind,
                render: (text, record, index)=>{
                    console.log("record", record);
                    console.log("text", text);
                    //return <Input value={text.data} onChange={onChange.bind(this, text.line, text.col)}/>;
                    return text.data;
                },
            };
        });
    },[colNames, onChange]);


        

    const dataSource =useMemo(()=>{
        return lines.map((line, lineInd)=>{
            let tmp={key: `tableline_${lineInd}`};
            line.map((item, colInd)=>{
                tmp={
                    ...tmp,
                    [`${colInd}`]: {
                        line: lineInd,
                        col: colInd,
                        data: item,
                    }
                };
            });
            return tmp;
        });
    },[lines]);
    
    console.log("ds", dataSource);
    
      


    useEffect(()=>{
        if(!visible){
            return;
        }
        if(!data.hasInitData){
            setColNames(['列头1','列头2']);
            setLines([ ['数据1','数据2'] ]);
            return;
        }

    },[visible, data, setColNames]);  


    return (
        <EnhDlg  title="表格编辑"
                closable={true}
                maskClosable={false}
                visible={visible}
                onCancel={onCancel}
                onOk={onOk}
                zIndex={2000}
                width="calc(100vw - 200px)"
                bodyStyle={{paddingTop:5}}>
            
            

            <Table scroll={{x:'100%', y:'calc(100vh - 400px)'}} size='small' bordered pagination={false} dataSource={dataSource} columns={columns} />
        </EnhDlg>
    );
    
}



export default React.memo(TableEditDlg);