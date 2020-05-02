/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Breadcrumb,Button,Row, Col,List, Avatar,Divider,BackTop   } from 'antd';
import { FileMarkdownOutlined,ReloadOutlined,HomeOutlined,FolderOutlined } from '@ant-design/icons';

import {createSelector} from 'reselect';

class PathSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
        this.listWrapperId='fileselectlist'+new Date().getTime();
    }

    

    getScrollTarget=()=>{
        return document.getElementById(this.listWrapperId);
    }

    onSelectMapItem=(item)=>{
        if (!item.isfile) {
            this.props.onloadDir(item.fullpath);
            return;
        }
        this.props.onSelectMapItem(item);
    }

    render() {
        //列表样式，如果指定的forceMaxH，则保持高度和最大高度一致
        let listWrapperStyle=getListWrapperStyle(this.props);

        return (
            <>
                <Row>
                    <Col span={22}>
                        <Breadcrumb> 
                            {
                                this.props.dirs.map((dir,ind)=>(
                                    <Breadcrumb.Item key={ind}  {...(dir.iscurr?{}:{'href':'#'})}  onClick={this.props.onloadDir.bind(this,dir.fullpath)}>
                                        {dir.ishome ? <HomeOutlined /> : dir.showname}
                                    </Breadcrumb.Item>
                                ))
                            }    
                        </Breadcrumb>
                    </Col>
                    <Col span={2} css={{textAlign:'right'}}>
                        <Button title='刷新' size='small' type="default" shape="circle" icon={<ReloadOutlined />} onClick={this.props.onloadCurrDir} />
                    </Col>
                </Row>                          
                <Divider css={{marginTop:'10px',marginBottom:'0px'}}/>
                
                <div css={listWrapperStyle} id={this.listWrapperId}>                   
                    <List
                        itemLayout="horizontal"
                        dataSource={this.props.filelist}
                        renderItem={item => (
                            <List.Item className='listitem' onClick={this.onSelectMapItem.bind(this,item)} {...getListItemExtra(item)}>
                                <List.Item.Meta 
                                    avatar={
                                        <Avatar icon={item.isfile ? <FileMarkdownOutlined /> : <FolderOutlined />} 
                                            css={{ "backgroundColor": (item.isfile?'#40a9ff':'orange') }} />
                                    }
                                    title={item.showname}
                                    description={item.size}/>
                            </List.Item>
                        )}
                    />
                </div>
                
                {
                    (this.props.backtopLoc && 2===this.props.backtopLoc.length) && (
                        <BackTop target={this.getScrollTarget} css={{right:this.props.backtopLoc[0],bottom:this.props.backtopLoc[1]}}/>
                    )
                }
            </>
        );
    }
}


const getListItemExtra=(item)=>{
    if(item.pic){
        return {
            extra: <div css={{marginRight:16,width:48,height:48,
                    backgroundImage:`url('${item.pic}')`,
                    backgroundRepeat:'no-repeat',
                    backgroundSize:'cover',
                    backgroundPosition:'center center'}}></div>
        };
    }

    return {};
}

const getListWrapperStyle=createSelector(
    props=>props.maxH,
    props=>props.forceMaxH,
    (maxH,forceMaxH)=>{
        let style={
            'maxHeight':maxH,
            'overflowY':'auto',
            'overflowX':'hidden',

            '& .listitem:hover':{
                backgroundColor:'#EEE',
                borderRadius:10,
            },
            '& .listitem':{
                cursor:'pointer',
                transition: 'all 0.3s 0s',
                transitionTimingFunction: 'ease',
            }

        };
        if(forceMaxH){
            style={'height':maxH,'minHeight':maxH, ...style};
        }
        return style;
    }
);

export default PathSelect;