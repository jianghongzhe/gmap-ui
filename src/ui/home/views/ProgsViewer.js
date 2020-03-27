/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Modal, Timeline, Table,Progress,Tooltip } from 'antd';

import {createSelector} from 'reselect';

class ProgsViewer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    render() {
        let dlgW = (this.props.winW < 820 ? this.props.winW - 20 : 800);

        return (
            <Modal
                title="查看事项完成进度"
                css={{
                    width: dlgW,
                    minWidth: dlgW,
                    maxWidth: dlgW
                }}
                visible={this.props.visible}
                maskClosable={true}
                footer={null}
                onCancel={this.props.onCancel}>
                    <Table pagination={false} 
                        bordered={true}
                        dataSource={parseDataSource(this.props)} 
                        columns={columns} 
                        size='small' 
                        scroll={{ y: this.props.bodyH }} />
            </Modal>
        );
    }
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

export default ProgsViewer;