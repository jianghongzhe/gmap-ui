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
                    <Row css={{
                        marginTop:50,
                        padding:10,
                        backgroundColor:'white'
                    }}>
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
                            <div css={logoWrapperStyle}>
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

const logoWrapperStyle={
    'textAlign':'center',
    'marginBottom':50,

    '& .appname':{
        'fontSize':18
    },
    '& .ver':{
        'display':'inline-block',
        'marginLeft':30
    },
    '& .btns':{
        'marginTop':20
    },
    '& .btns .rbtn':{
        'marginLeft':20
    }
};



export default Welcome;