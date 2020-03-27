/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Button, Divider } from 'antd';
import { PlusOutlined, FolderOpenOutlined, EditOutlined, FolderOutlined,CodeOutlined,ExpandOutlined,ControlOutlined,ReloadOutlined } from '@ant-design/icons';
const { Header, Content } = Layout;

class Toolbar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }
    render() {
        return (
            <Header css={headerStyle}>
                <Button shape='circle' icon={<PlusOutlined />} className='toolbtnFirst' type='default' size='large' onClick={this.props.onShowNewMapDlg} title='新建' />
                <Button shape='circle' icon={<FolderOpenOutlined />} className='toolbtn' type='default' size='large' onClick={this.props.onShowSelMapDlg} title='打开' />

                <Divider type="vertical" className='divider'/>
                <Button shape='circle' icon={<FolderOutlined />} className='toolbtn' type='default' size='large' onClick={this.props.onShowDir}  title='打开目录' />                                   
                <Button shape='circle' icon={<CodeOutlined />} className='toolbtn' type='default' size='large' onClick={this.props.onShowCmd}  title='打开git' />
                <Button shape='circle' icon={<ControlOutlined />} className='toolbtn' type='default' size='large' onClick={this.props.onShowDevTool}  title='开发者工具' />
                <Button shape='circle' icon={<ReloadOutlined />} className='toolbtn' type='default' size='large' onClick={this.props.onReloadApp}  title='重新载入应用' />

                <Divider type="vertical" className='divider'/>
                <Button shape='circle' icon={<EditOutlined />} className='toolbtn' type='default' size='large' onClick={this.props.onShowEditMapDlg} title='编辑' />
                {
                    this.props.showExpandAll &&      
                        <Button shape='circle' icon={<ExpandOutlined />} className='toolbtn' type='primary' size='large' onClick={this.props.onExpandAll} title='展开全部节点' />
                }

                

                
            </Header>
        );
    }
}

//#f0f2f5
const headerStyle = {
    backgroundColor:    '#f0f2f5',
    paddingLeft:        0,
    '& .toolbtn':       {
        marginLeft:     10
    },
    '& .toolbtnFirst':       {
        marginLeft:     15
    },
    '& .divider':{
        backgroundColor:'#CCC',
        height:'50%',
        width:2, 
        padding:0,
        marginLeft:10,
        marginRight:0
    }
};

export default Toolbar;