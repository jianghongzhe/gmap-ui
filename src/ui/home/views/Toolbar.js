/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider } from 'antd';
import { PlusOutlined, FolderOpenOutlined, EditOutlined, FolderOutlined,CodeOutlined } from '@ant-design/icons';
const { Header, Content } = Layout;

class Toolbar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }
    render() {
        return (
            <Header css={headerStyle}>
                <Button shape='circle' icon={<PlusOutlined />} className='toolbtn' type='primary' size='large' onClick={this.props.onShowNewMapDlg} title='新建' />
                <Button shape='circle' icon={<FolderOpenOutlined />} className='toolbtn' type='primary' size='large' onClick={this.props.onShowSelMapDlg} title='打开' />
                <Button shape='circle' icon={<EditOutlined />} className='toolbtn' type='primary' size='large' onClick={this.props.onShowEditMapDlg} title='编辑' />

                <Divider type="vertical" />
                <Button shape='circle' icon={<FolderOutlined />} className='toolbtn' type='primary' size='large' onClick={this.props.onShowDir}  title='打开目录' />                                   
                <Button shape='circle' icon={<CodeOutlined />} className='toolbtn' type='primary' size='large' onClick={this.props.onShowCmd}  title='打开命令行' />
            </Header>
        );
    }
}

//background-color:#f0f2f5;
//background-color:#EEE;
const headerStyle = {
    backgroundColor:    '#f0f2f5',
    paddingLeft:        0,
    '& .toolbtn':       {
        marginLeft:     20
    }
};

export default Toolbar;