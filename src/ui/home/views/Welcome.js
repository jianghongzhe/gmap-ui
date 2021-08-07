/** @jsxImportSource @emotion/react */
import React, {  useEffect, useState } from 'react';
import { Button,Row, Col, Avatar,Tooltip   } from 'antd';
import { PlusOutlined,FolderOutlined,CodeOutlined,ControlOutlined,ReloadOutlined } from '@ant-design/icons';

import logourl from '../../../assets/logo.jpg';
import { createSelector } from 'reselect';
import api from '../../../service/api';
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
    const [appInfo, setAppInfo]=useState(()=>({}));


    useEffect(()=>{
        api.loadAppInfo().then(info=>{
            setAppInfo(info);
        });
    }, [setAppInfo]);

    
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
                                <Tooltip color='cyan' placement="bottomLeft" title='打开目录'>
                                    <Button type="default" className='r2btn' shape='circle'  icon={<FolderOutlined />} size='large' onClick={props.onOpenMapsDir}></Button>
                                </Tooltip>
                                <Tooltip color='cyan' placement="bottomLeft" title='打开控制台'>
                                    <Button type="default" className='rbtn' shape='circle' icon={<CodeOutlined/>} size='large' onClick={props.onOpenBash}></Button>
                                </Tooltip>
                                <Tooltip color='cyan' placement="bottomLeft" title='开发者工具'>
                                    <Button type="default" className='rbtn' shape='circle' icon={<ControlOutlined/>} size='large' onClick={props.onShowDevTool}></Button>
                                </Tooltip>
                                <Tooltip color='cyan' placement="bottomLeft" title='重新载入应用'>
                                    <Button type="default" className='rbtn' shape='circle' icon={<ReloadOutlined/>} size='large' onClick={props.onReloadApp}></Button>
                                </Tooltip>
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