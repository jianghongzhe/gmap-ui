/** @jsxImportSource @emotion/react */
import React, {  useMemo } from 'react';
import { Modal,  Table,Progress,Tooltip } from 'antd';
import {withEnh} from '../../common/specialDlg';

const EnhDlg=withEnh(Modal);
const dlgW = 900;

/**
 * 进度对话框
 */
const ProgsViewer=({visible,progsObj,onCancel})=>{
    const parsedDataSource=useMemo(()=>{
        if(!progsObj){
            return [];
        }
        return progsObj.map((each,ind)=>({
            key: ind,
            thing: each.txt,
            prog: each.num,
            msg:each.msg,
            err: each.err,
        }));
    },[progsObj]);

    return (
        <EnhDlg noFooter
                title="查看事项完成进度"
                size={{w:dlgW}}                  
                visible={visible}
                maskClosable={true}
                onCancel={onCancel}>
            
            <Table pagination={false} 
                bordered={true}
                dataSource={parsedDataSource} 
                columns={columns} 
                size='small' 
                scroll={{ y: 'calc(100vh - 300px)' }} />
        </EnhDlg>
    );
}



const columns = [
    {
        title: '事项',
        dataIndex: 'thing',
        key: 'thing',
        render:(txt,line)=>{
            console.log(typeof(txt),txt.length,txt);
            return <>{txt.map((line,ind)=><>{0<ind && <br/>}{line}</>)}</>;
        }
    },
    {
        title: '完成进度',
        dataIndex: 'prog',
        key: 'prog',
        width:'260px',
        render: (prog, line) => (
            <Tooltip title={line.msg}>
                <Progress  percent={prog} size='default' status={line.err?"exception":(prog<100?"active":"success")}/>
            </Tooltip>
        )
    },
];

export default React.memo(ProgsViewer);