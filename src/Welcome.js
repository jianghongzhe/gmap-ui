/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { Component } from 'react';
import { Layout, Menu, Breadcrumb,Tabs,Button,Tooltip,Row, Col,List, Avatar } from 'antd';
import { PlusOutlined,FileMarkdownOutlined,ReloadOutlined } from '@ant-design/icons';
import logourl from './assets/logo.jpg';

class Welcome extends Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }



    render() {
        return (
            <Row>
                <Col span={16} offset={4}>
                    <Row css={container}>
                        <Col span={12} >
                        
                            <List
                                itemLayout="horizontal"
                                dataSource={this.props.filelist}
                                renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta onClick={this.props.onSelectMapItem.bind(this,item)}
                                    avatar={<Avatar icon={<FileMarkdownOutlined />} style={{ backgroundColor: '#40a9ff' }} />}
                                    title={item.showname}
                                    description={item.size}
                                    />
                                </List.Item>
                                )}
                            />
                        </Col>
                        <Col span={12}>                   
                            <div css={logoWrapper}>
                                <p><Avatar size={256} src={logourl}/></p>
                                <p className='appname'>GMap - 思维导图<span className='ver'>v0.1</span></p>
                                <div className='btns'>
                                    <Button type="default"  icon={<PlusOutlined />} size='large' onClick={this.props.onAddMap}>新建</Button>
                                </div>                               
                            </div>
                        </Col>
                    </Row>
                </Col>
            </Row>

            
            
            
        );
    }
}

const logoWrapper=css`
    text-align:center;
    & .appname{
        font-size:18px;
    }
    & .ver{
        display:inline-block;
        margin-left:30px;
    }
    & .btns{
        margin-top:20px;
    }
`;


const container=css`
    margin-top:50px;
    padding:20px;
    background-color:white;
`;

const data = [
    {
      title: 'Ant Design Title 1',
    },
    {
      title: 'Ant Design Title 2',
    },
    {
      title: 'Ant Design Title 3',
    },
    {
      title: 'Ant Design Title 4',
    },
  ];
  

export default Welcome;