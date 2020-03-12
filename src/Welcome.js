/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { Component } from 'react';
import { Layout, Menu, Breadcrumb,Tabs,Button,Tooltip,Row, Col,List, Avatar } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

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
                            dataSource={data}
                            renderItem={item => (
                            <List.Item>
                                <List.Item.Meta onClick={this.props.onSelectMapItem}
                                avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
                                title={item.title}
                                description="Ant Design, a design language for background applications, is refined by Ant UED Team"
                                />
                            </List.Item>
                            )}
                        />

                        </Col>
                        <Col span={12}>                   
                            <div css={logoWrapper}>
                                <p><Avatar size={256} src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"/></p>
                                <Button type="default"  icon={<PlusOutlined />} size='large' onClick={this.props.onAddMap}>新建</Button>
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