/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Table, Input,Button  } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined,DeleteOutlined, InsertRowAboveOutlined, InsertRowBelowOutlined, InsertRowLeftOutlined, InsertRowRightOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
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
    const [aligns, setAligns]=useState([]);
    const [colNames, setColNames]= useState([]);
    const [lines, setLines]= useState([]);
    

    const onChange=useCallback((line, col, e)=>{
        setLines(originLines=>{
            let newLines=[...originLines];
            newLines[line]=[...originLines[line]];
            newLines[line][col]=e.target.value;
            return newLines;
        });
    },[setLines]);


    const changeCol=useCallback((col, e)=>{
        setColNames(originColNames=>{
            const colNames=[...originColNames];
            colNames[col]=e.target.value;
            return colNames;
        });
    },[setColNames]);


    const addLine=useCallback((ind=null)=>{
        if(null===ind){
            setLines(originLines=>[
                ...originLines,
                colNames.map(cn=>" ")
            ]);
            return;
        }
        setLines(originLines=>{
            let newLines=[...originLines];
            newLines.splice(ind,0,colNames.map(cn=>" "));
            return newLines;
        });
    },[colNames, setLines]);



    const addCol=useCallback((ind=null)=>{
        if(null===ind){
            setLines(originLines=>originLines.map(line=>([...line, " "])));
            setColNames(originColNames=>([...originColNames, `列头`]));
            return;
        }
        setLines(originLines=>{
            return originLines.map(line=>{
                let newLine=[...line];
                newLine.splice(ind,0," ");
                return newLine;
            });
        });
        setColNames(originColNames=>{
            let newColNames=[...originColNames];
            newColNames.splice(ind,0,`列头`);
            return newColNames;
        });
    },[setLines,setColNames]);


    /**
     * 派生数据之表格的列：由原始的一维字符串数组转换为一维对象数组：
     * 一维字符串数组如下：
     * ['列头1','列头2']
     * 
     * 一维对象数组如下：
     * [
     *      {
     *          title: '列头1',
     *          dataIndex: 'item0', // 与datasource中的结构对应
     *          key: 'col_0',
     *          render: ()=>{},     // 数据对象中包含行列索引，以便在onchange事件中找到行和列
     *      },
     *      {
     *          title: '列头2',
     *          dataIndex: 'item1',
     *          key: 'col_1',
     *          render: ()=>{},
     *      }
     * ]
     */
    const columns = useMemo(()=>{
        const tmp=colNames.map((col,ind)=>{
            return {
                title: ()=>{
                    return <div>
                        <div>
                            <Input value={col} onChange={changeCol.bind(this, ind)} style={{textAlign:'center',fontWeight:'bold',}} bordered={false}/>
                        </div>
                        <div style={{textAlign:'center',}}>
                        <AlignCenterOutlined />
                        <AlignLeftOutlined />
                        <AlignRightOutlined />
                            {
                                ind>0 && <Button className='opBtnStyle' shape="circle" icon={<ArrowLeftOutlined />} size='middle' title='左移' ></Button>
                            }
                            {
                                ind<colNames.length-1 && <Button className='opBtnStyle' shape="circle" icon={<ArrowRightOutlined />} size='middle' title='右移' ></Button>
                            }
                            <Button className='opBtnStyle' shape="circle" icon={<InsertRowLeftOutlined />} size='middle' title='在左侧插入列'  ></Button>
                            <Button className='opBtnStyle' shape="circle" icon={<InsertRowRightOutlined />} size='middle' title='在右侧插入列'  ></Button>
                            {
                                colNames.length>1 && <Button className='opBtnStyle' shape="circle" icon={<DeleteOutlined />} size='middle' title='删除列'  ></Button>
                            }
                        </div>
                    </div>;
                },
                dataIndex: `item${ind}`,
                key: 'col_'+ind,
                render: (text, record, index)=>{
                    return <Input value={text.data} style={{textAlign:aligns[text.col]}} onChange={onChange.bind(this, text.line, text.col)}/>;
                },
            };
        });
        tmp.push({
            title: "操作",
            align:'center',
            dataIndex: `op`,
            key: 'col_'+colNames.length,
            width:'210px',
            render: (text, record, index)=>{
                return <div style={{textAlign:'left',}}>
                    {
                        index>0 && <Button className='opBtnStyle' shape="circle" icon={<ArrowUpOutlined />} size='middle' title='上移' ></Button>
                    }
                    {
                        index<lines.length-1 && <Button className='opBtnStyle' shape="circle" icon={<ArrowDownOutlined />} size='middle' title='下移' ></Button>
                    }
                    <Button className='opBtnStyle' shape="circle" icon={<InsertRowAboveOutlined />} size='middle'title='在上面插入行'  ></Button>
                    <Button className='opBtnStyle' shape="circle" icon={<InsertRowBelowOutlined />} size='middle' title='在下面插入行'  ></Button>
                    {
                        lines.length>1 && <Button className='opBtnStyle' shape="circle" icon={<DeleteOutlined />} size='middle' title='删除行'></Button>
                    }
                </div>;
            },
        });
        return tmp;
    },[colNames,aligns,lines, onChange, changeCol]);


        
    /**
     * 派生数据之表格数据：由原始的二维数组转换为一维数组套对象的结构：
     * 二维数组结构如下：
     * [ 
     *      ['数据1','数据2'],
     *      ['数据3','数据4'],
     *      ['数据5','数据6'] 
     * ]
     * 
     * 一维数组套对象的结构如下：
     * [
     *      {
     *          key: 'line_0',
     *          item0: {
     *              line: 0,
     *              col:  0,
     *              data: '数据1'，
     *          },
     *          item1: {
     *              line: 0,
     *              col:  1,
     *              data: '数据2'，
     *          },
     *      }
     * ]
     */
    const dataSource =useMemo(()=>{
        return lines.map((line, lineInd)=>{
            const lineObj={key: `line_${lineInd}`};
            line.forEach((item, colInd) => {
                lineObj[`item${colInd}`]={
                    line: lineInd,
                    col:  colInd,
                    data: item,
                };
            });
            return lineObj;
        });
    },[lines]);
    
      


    useEffect(()=>{
        if(!visible || !data){
            return;
        }
        if(!data.hasInitData){
            setAligns(['left','left']);
            setColNames(['列头1','列头2']);
            setLines([ ['数据1','数据2'] ]);
            return;
        }

        console.log(data);
        setAligns(data.data.aligns);
        setColNames(data.data.heads);
        setLines(data.data.lines);
    },[visible, data, setColNames,setAligns,setLines]);  


    const onCommit=useCallback(()=>{
        let lineSep=`
`;
        let tableMarkdown=`|${colNames.join("|")}|${lineSep}`+
            `|${aligns.map(v=>('center'===v ? ':-:' : ('right'===v ? "-:" : "-"))).join("|")}|${lineSep}`;
        lines.forEach(line=>{
            tableMarkdown+=`|${line.join("|")}|${lineSep}`;
        });
        if(data.needExtraBlankLine){
            tableMarkdown=lineSep+tableMarkdown;
        }
        onCancel();
        onOk(tableMarkdown);
    },[aligns, colNames, lines, data, onOk]);


    return (
        <EnhDlg  title="表格编辑"
                closable={true}
                maskClosable={false}
                visible={visible}
                onCancel={onCancel}
                onOk={onCommit}
                zIndex={2000}
                width="calc(100vw - 200px)"
                bodyStyle={{paddingTop:5}}>
            
            

            <Table scroll={{x:'100%', y:'calc(100vh - 400px)'}} size='small' bordered pagination={false} dataSource={dataSource} columns={columns} />
        </EnhDlg>
    );
    
}

const opBtnStyle={
    marginRight:'5px',
};



export default React.memo(TableEditDlg);