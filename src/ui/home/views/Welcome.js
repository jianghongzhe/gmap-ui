/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Button,Row, Col, Avatar   } from 'antd';
import { PlusOutlined,FolderOutlined,CodeOutlined } from '@ant-design/icons';

import PathSelect from './PathSelect';
import logourl from '../../../assets/logo.jpg';

class Welcome extends React.Component {
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
                                    <Button type="primary"  icon={<PlusOutlined />} size='large' onClick={this.props.onAddMap}>新建</Button>
                                    <Button type="default" className='rbtn' title='打开目录' shape='circle'  icon={<FolderOutlined />} size='large' onClick={this.props.onOpenMapsDir}></Button>
                                    <Button type="default" className='rbtn' title='打开命令行' shape='circle' icon={<CodeOutlined/>} size='large' onClick={this.props.onOpenBash}></Button>
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
    margin-bottom:50px;
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
    & .btns .rbtn{
        margin-left:20px;
    }
`;


const container=css`
    margin-top:50px;
    padding:10px;
    background-color:white;
`;
  

export default Welcome;