/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { Component } from 'react';
import { Layout, Menu, Breadcrumb,Tabs,Button,Tooltip,Row, Col,List, Avatar,Divider   } from 'antd';
import { PlusOutlined,FileMarkdownOutlined,ReloadOutlined,HomeOutlined,FolderOutlined } from '@ant-design/icons';

import PathSelect from './PathSelect';
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
                            <PathSelect 
                                maxH={this.props.maxH-160}
                                dirs={this.props.dirs} 
                                filelist={this.props.filelist}
                                onloadDir={this.props.onloadDir}
                                onReloadCurrDir={this.props.onReloadCurrDir}
                                onSelectMapItem={this.props.onSelectMapItem}/>
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