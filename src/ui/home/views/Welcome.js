/** @jsxImportSource @emotion/react */
import React, {  useEffect, useState } from 'react';
import { Button,Row, Col, Avatar,Tooltip   } from 'antd';
import { PlusOutlined,FolderOutlined,CodeOutlined,ControlOutlined,ReloadOutlined,CloudSyncOutlined,HistoryOutlined } from '@ant-design/icons';

import logourl from '../../../assets/logo.jpg';
import api from '../../../service/api';
import ConnectedPathSelect from './ConnectedPathSelect';

/**
 * 首页
 * @param {*} props 
 */
const Welcome=(props)=>{
    const [appInfo, setAppInfo]=useState(()=>({}));


    useEffect(()=>{
        api.loadAppInfo().then(info=>setAppInfo(info));
    }, [setAppInfo]);
   

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
                            maxH='calc(100vh - 160px)' 
                            backtopLoc={['calc(44vw + 80px)',120]}
                            onSelectMapItem={props.onSelectMapItem}/>
                    </Col>
                    <Col span={10}>                   
                        <div css={logoWrapperStyle}>
                            <p><Avatar size={256} src={logourl}/></p>
                            <p className='appname'>{appInfo.showname}<span className='ver'>V{appInfo.version}</span></p>
                            <div className='btns'>
                                <div>
                                    <ButtonItem title='打开目录'  icon={<FolderOutlined />} onClick={props.onOpenMapsDir}/>
                                    <ButtonItem title='打开控制台' className='rbtn' icon={<CodeOutlined />} onClick={props.onOpenBash}/>
                                    <ButtonItem title='开发者工具' className='rbtn' icon={<ControlOutlined />} onClick={props.onShowDevTool}/>
                                    <ButtonItem title='重新载入应用' className='rbtn' icon={<ReloadOutlined />} onClick={props.onReloadApp}/>
                                    <ButtonItem title='版本发布说明' className='rbtn' icon={<HistoryOutlined />} onClick={api.openReleaseNote}/>
                                    <ButtonItem title='检查更新' className='rbtn' icon={<CloudSyncOutlined />} onClick={props.onOpenUpdateApp}/>
                                </div>
                                <div css={{marginTop:'20px'}}>
                                    <div css={{width:'280px',marginLeft:'auto',marginRight:'auto',}}>
                                        <Button type="primary" block  icon={<PlusOutlined />} size='large' onClick={props.onAddMap}>新建</Button>
                                    </div>
                                </div> 
                                
                                
                            </div>                               
                        </div>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
    
}


const ButtonItem=({title, className, icon, onClick})=>(
    <Tooltip color='cyan' placement="bottomLeft" title={title}>
        <Button type="default" className={className} shape='circle' icon={icon} size='large' onClick={onClick}></Button>
    </Tooltip>
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
        marginTop:50,
    },
    '& .btns .rbtn':{
        'marginLeft':10
    },
    '& .btns .r2btn':{
        'marginLeft':20
    }
};



export default React.memo(Welcome);