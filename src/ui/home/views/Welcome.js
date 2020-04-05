/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Button,Row, Col, Avatar   } from 'antd';
import { PlusOutlined,FolderOutlined,CodeOutlined,ControlOutlined,ReloadOutlined } from '@ant-design/icons';

import PathSelect from './PathSelect';
import logourl from '../../../assets/logo.jpg';
import { createSelector } from 'reselect';
import api from '../../api';

class Welcome extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }

    render() {
        let {showname,version}=appInfoSelector(undefined);
        let fileselectRight= parseInt(this.props.winW*4/9)+80;

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
                                maxH={this.props.maxH}
                                backtopLoc={[fileselectRight,120]}
                                dirs={this.props.dirs} 
                                filelist={this.props.filelist}
                                onloadDir={this.props.onloadDir}
                                onReloadCurrDir={this.props.onReloadCurrDir}
                                onSelectMapItem={this.props.onSelectMapItem}/>
                        </Col>
                        <Col span={10}>                   
                            <div css={logoWrapperStyle}>
                                <p><Avatar size={256} src={logourl}/></p>
                                <p className='appname'>{showname}<span className='ver'>V{version}</span></p>
                                <div className='btns'>
                                    <Button type="primary"  icon={<PlusOutlined />} size='large' onClick={this.props.onAddMap}>新建</Button>
                                    <Button type="default" className='r2btn' title='打开目录' shape='circle'  icon={<FolderOutlined />} size='large' onClick={this.props.onOpenMapsDir}></Button>
                                    <Button type="default" className='rbtn' title='打开git' shape='circle' icon={<CodeOutlined/>} size='large' onClick={this.props.onOpenBash}></Button>
                                    <Button type="default" className='rbtn' title='开发者工具' shape='circle' icon={<ControlOutlined/>} size='large' onClick={this.props.onShowDevTool}></Button>
                                    <Button type="default" className='rbtn' title='重新载入应用' shape='circle' icon={<ReloadOutlined/>} size='large' onClick={this.props.onReloadApp}></Button>
                                    
                                </div>                               
                            </div>
                        </Col>
                    </Row>
                </Col>
            </Row>
        );
    }
}



const appInfoSelector=createSelector(
    noUse=>noUse,
    noUse=>api.loadAppInfo()
);

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
        'marginLeft':10
    },
    '& .btns .r2btn':{
        'marginLeft':20
    }
};



export default Welcome;