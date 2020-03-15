/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { Component } from 'react';
import { Layout, Menu, Breadcrumb,Tabs,Button,Tooltip,Row, Col,List, Avatar,Divider   } from 'antd';
import { PlusOutlined,FileMarkdownOutlined,ReloadOutlined,HomeOutlined } from '@ant-design/icons';
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
                        <Col span={14} >
                            <Row>
                                <Col span={22}>
                                    <Breadcrumb> 
                                        {/*href=""*/}
                                        <Breadcrumb.Item href=''>
                                            <HomeOutlined />
                                        </Breadcrumb.Item>
                                        <Breadcrumb.Item href=''>第一层</Breadcrumb.Item>
                                        <Breadcrumb.Item >第二层</Breadcrumb.Item>
                                        {/* <Breadcrumb.Item>Application</Breadcrumb.Item> */}
                                    </Breadcrumb>
                                </Col>
                                <Col span={2} style={{textAlign:'right'}}>
                                    <Button title='刷新' size='small' type="default" shape="circle" icon={<ReloadOutlined />} />
                                </Col>
                            </Row>                          
                            <Divider style={{marginTop:'10px',marginBottom:'0px'}}/>
                            <div style={{'maxHeight':this.props.maxH-160,'overflowY':'auto','overflowX':'hidden'}}>
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
                                </div>
                        </Col>
                        <Col span={10}>                   
                            <div css={logoWrapper}>
                                <p><Avatar size={256} src={logourl}/></p>
                                <p className='appname'>GMap - 思维导图<span className='ver'>v0.1</span></p>
                                <div className='btns'>
                                    <Button type="default" className='btn' icon={<PlusOutlined />} size='large' onClick={this.props.onAddMap}>新建</Button>
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
    padding:10px;
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