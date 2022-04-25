import React, {useCallback, useEffect, useMemo} from 'react';
import {Button, Input, Modal, Table} from 'antd';
import {
    AlignCenterOutlined,
    AlignLeftOutlined,
    AlignRightOutlined,
    ArrowDownOutlined,
    ArrowLeftOutlined,
    ArrowRightOutlined,
    ArrowUpOutlined,
    DeleteOutlined,
    InsertRowAboveOutlined,
    InsertRowBelowOutlined,
    InsertRowLeftOutlined,
    InsertRowRightOutlined
} from '@ant-design/icons';
import {withEnh} from '../../../common/specialDlg';
import {useEditTableData} from '../../../../hooks/tableEdit';
import {useBindAndGetRefs} from '../../../../common/commonHooks';


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
    const [
        {colNames,aligns,lines},
        {setData, changeCol,changeAlign, changeCell, addLine, addCol, delCol, delRow, swapLine, swapCol, createTableMd}
    ]= useEditTableData();
    const [, bindIptRef, getIptRef]= useBindAndGetRefs();
    

    /**
     * 根据引用的key使对应元素获得焦点
     */
    const focusIpt=useCallback((key)=>{
        const ele=getIptRef(key);
        if(ele){
            ele.focus();
        }
    },[getIptRef]);


    /**
     * 处理tab键导航
     */
    const onKeyDown=useCallback((lineInd,colInd,e)=>{
        if(!e.altKey && !e.shiftKey && !e.ctrlKey && "Tab"===e.key){
            e.preventDefault();
            e.stopPropagation();

            // 标题行：如果后面还有列，则焦点到后一列，否则焦点到数据首行首列
            if(lineInd<0){
                if(colInd<colNames.length-1){
                    focusIpt(`head-${colInd+1}`);
                    return;
                }
                focusIpt(`0-0`);
                return;
            }
            // 数据行
            // 如果后面还有列，则焦点到后一列
            if(colInd<colNames.length-1){
                focusIpt(`${lineInd}-${colInd+1}`);
                return;
            }
            // 已是最后一列，且有下一行，则焦点到下一行第一列
            if(lineInd<lines.length-1){
                focusIpt(`${lineInd+1}-0`);
                return;
            }
            // 已是最后一列，且无下一行，则焦点到标题行首列
            focusIpt(`head-0`);
            return;
        }
    },[lines,colNames, focusIpt]);

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
                            <Input  ref={bindIptRef.bind(this,`head-${ind}`)}
                                    value={col} 
                                    onChange={changeCol.bind(this, ind)} 
                                    style={{textAlign:'center',fontWeight:'bold',}} 
                                    bordered={false}
                                    onKeyDown={onKeyDown.bind(this,-1,ind)}
                                    onPressEnter={focusIpt.bind(this, `0-${ind}`)}
                            />
                        </div>
                        <div style={{textAlign:'center',}}>                            
                            <BtnItem icon={<AlignLeftOutlined />} title='靠左' enabled={'left'!==aligns[ind]} onClick={changeAlign.bind(this, ind, 'left')}/>
                            <BtnItem icon={<AlignCenterOutlined  />} title='居中' enabled={'center'!==aligns[ind]} onClick={changeAlign.bind(this, ind, 'center')}/>
                            <BtnItem icon={<AlignRightOutlined />} title='靠右' enabled={'right'!==aligns[ind]} onClick={changeAlign.bind(this, ind, 'right')}/>
                            <BtnItem icon={<ArrowLeftOutlined />} title='左移' enabled={ind>0} onClick={swapCol.bind(this, ind, ind-1)}/>
                            <BtnItem icon={<ArrowRightOutlined />} title='右移' enabled={ind<colNames.length-1} onClick={swapCol.bind(this, ind, ind+1)}/>
                            <BtnItem icon={<InsertRowLeftOutlined />} title='在左侧插入列' onClick={addCol.bind(this, ind)}/>
                            <BtnItem icon={<InsertRowRightOutlined />} title='在右侧插入列' onClick={addCol.bind(this, ind+1)}/>
                            <BtnItem icon={<DeleteOutlined />} title='删除列' enabled={colNames.length>1} onClick={delCol.bind(this, ind)}/>
                        </div>
                    </div>;
                },
                dataIndex: `item${ind}`,
                width:'150px',
                key: 'col_'+ind,
                render: (text, record, index)=>{
                    return <Input   ref={bindIptRef.bind(this,`${text.line}-${text.col}`)} 
                                    value={text.data} 
                                    style={{textAlign:aligns[text.col]}} 
                                    bordered={false} 
                                    onChange={changeCell.bind(this, text.line, text.col)}
                                    onKeyDown={onKeyDown.bind(this,text.line,text.col)}
                                    onPressEnter={focusIpt.bind(this, index<lines.length-1 ? `${text.line+1}-${text.col}` : `head-${text.col}`)}
                            />;
                },
            };
        });
        tmp.push({
            title: "操作",
            align:'center',
            dataIndex: `op`,
            key: 'col_'+colNames.length,
            width:'170px',
            fixed: 'right',
            render: (text, record, index)=>{
                return <div style={{textAlign:'center',}}>
                    <BtnItem icon={<ArrowUpOutlined />} title='上移' enabled={index>0} onClick={swapLine.bind(this, index, index-1)}/>
                    <BtnItem icon={<ArrowDownOutlined />} title='下移' enabled={index<lines.length-1} onClick={swapLine.bind(this, index, index+1)}/>
                    <BtnItem icon={<InsertRowAboveOutlined />} title='在上面插入行' onClick={addLine.bind(this,index)}/>
                    <BtnItem icon={<InsertRowBelowOutlined />} title='在下面插入行' onClick={addLine.bind(this,index+1)}/>
                    <BtnItem icon={<DeleteOutlined />} title='删除行' enabled={lines.length>1} onClick={delRow.bind(this, index)}/>
                </div>;
            },
        });
        return tmp;
    },[
        colNames,aligns,lines, 
        bindIptRef, focusIpt, onKeyDown,
        changeCol,changeAlign, changeCell, addLine, addCol, delCol, delRow, swapLine, swapCol,
    ]);


        
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
    
      

    /**
     * 当显示时加载初始数据，如果没有则加载默认表格数据
     */
    useEffect(()=>{
        if(!visible || !data){
            return;
        }
        if(!data.hasInitData){
            setData(
                ['列头1','列头2'],
                ['left','left'],
                [ ['数据1','数据2'] ]
            );
            return;
        }
        setData(data.data.heads, data.data.aligns, data.data.lines);
    },[visible, data, setData]);  


    const onCommit=useCallback(()=>{
        const tableMd=createTableMd(data.needExtraBlankLine);
        onCancel();
        onOk(tableMd);
    },[data, createTableMd, onCancel, onOk]);


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
            <Table scroll={{x:'100%', y:'calc(100vh - 450px)'}} size='small' bordered tableLayout="fixed" pagination={false} dataSource={dataSource} columns={columns} />
        </EnhDlg>
    );
    
}


const BtnItem=({icon, title, type='default', enabled=true,  onClick})=>{
    return <Button style={opBtnStyle} shape="circle" type={type} icon={icon} disabled={enabled?false:true} size='small' title={title} onClick={onClick}/>
};

const opBtnStyle={
    marginRight:'5px',
};



export default React.memo(TableEditDlg);