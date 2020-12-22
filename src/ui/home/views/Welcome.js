/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import React, { useEffect, useRef, useState } from 'react';
import { Button,Row, Col, Avatar   } from 'antd';
import { PlusOutlined,FolderOutlined,CodeOutlined,ControlOutlined,ReloadOutlined } from '@ant-design/icons';

import PathSelect from './PathSelect';
import logourl from '../../../assets/logo.jpg';
import { createSelector } from 'reselect';
import api from '../../../service/api';
import {connect} from '../../../common/gflow';
import ConnectedPathSelect from './ConnectedPathSelect';
import { useSelector } from 'react-redux';

/**
 * 首页
 * @param {*} props 
 */
const Welcome=(props)=>{
    const {winW,winH}=useSelector((state)=>({
        winW:state.common.winW,
        winH:state.common.winH,
    }));

    const [appInfo]=useState(()=>appInfoSelector(undefined));
    const fileselectRight= calcBackTopRight({winW,winH});

    return (
        <Row>
            <Col span={16} offset={4}>
                <Row css={{
                    marginTop:50,
                    padding:10,
                    backgroundColor:'white'
                }}>
                    <Col span={14} >
                        <ConnectedPathSelect 
                            maxH={winH-160}
                            backtopLoc={[fileselectRight,120]}
                            onSelectMapItem={props.onSelectMapItem}/>
                    </Col>
                    <Col span={10}>                   
                        <div css={logoWrapperStyle}>
                            <p><Avatar size={256} src={logourl}/></p>
                            <p className='appname'>{appInfo.showname}<span className='ver'>V{appInfo.version}</span></p>
                            <div className='btns'>
                                <Button type="primary"  icon={<PlusOutlined />} size='large' onClick={props.onAddMap}>新建</Button>
                                <Button type="default" className='r2btn' title='打开目录' shape='circle'  icon={<FolderOutlined />} size='large' onClick={props.onOpenMapsDir}></Button>
                                <Button type="default" className='rbtn' title='打开控制台' shape='circle' icon={<CodeOutlined/>} size='large' onClick={props.onOpenBash}></Button>
                                <Button type="default" className='rbtn' title='开发者工具' shape='circle' icon={<ControlOutlined/>} size='large' onClick={props.onShowDevTool}></Button>
                                <Button type="default" className='rbtn' title='重新载入应用' shape='circle' icon={<ReloadOutlined/>} size='large' onClick={props.onReloadApp}></Button>
                            </div>                               
                        </div>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
    
}


const calcBackTopRight= createSelector(
    props=>props.winW,
    winw=>parseInt(winw*4/9)+80
);


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



export default React.memo(Welcome);