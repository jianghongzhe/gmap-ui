/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Modal, Timeline, Table,Progress,Tooltip } from 'antd';
import {createSelector} from 'reselect';
import {withEnh} from '../../common/specialDlg';
import {connect} from '../../../common/gflow';
import { useSelector } from 'react-redux';

const EnhDlg=withEnh(Modal);

/**
 * 进度对话框
 */
const ProgsViewer=(props)=>{
    const {winW,winH}=useSelector((state)=>({
        winW:state.common.winW,
        winH:state.common.winH,
    }));

    let dlgW = (winW < 820 ? winW - 20 : 800);

    return (
        <EnhDlg noFooter
                title="查看事项完成进度"
                size={{w:dlgW}}                  
                visible={props.visible}
                maskClosable={true}
                onCancel={props.onCancel}>
            
            <Table pagination={false} 
                bordered={true}
                dataSource={parseDataSource(props)} 
                columns={columns} 
                size='small' 
                scroll={{ y: winH-300 }} />
        </EnhDlg>
    );
}

const parseDataSource=createSelector(
    props=>props.progsObj,
    progs=>{
        if(!progs){
            return [];
        }
        return progs.map((each,ind)=>({
            key: ind,
            thing: each.txt,
            prog: each.num,
            msg:each.msg,
            err: each.err,
        }));
    }
);

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