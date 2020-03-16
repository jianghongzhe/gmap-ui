/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { Component } from 'react';
import { Layout, Menu, Breadcrumb,Tabs,Button,Tooltip,Row, Col,List, Avatar,Divider   } from 'antd';
import { PlusOutlined,FileMarkdownOutlined,ReloadOutlined,HomeOutlined,FolderOutlined } from '@ant-design/icons';

class PathSelect extends Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }
    render() {
        let listWrapperStyle={'maxHeight':this.props.maxH,'overflowY':'auto','overflowX':'hidden'};
        if(this.props.forceMaxH){
            listWrapperStyle={'height':this.props.maxH, ...listWrapperStyle};
        }

        return (
            <>
                <Row>
                    <Col span={22}>
                        <Breadcrumb> 
                            {
                                this.props.dirs.map((dir,ind)=>(
                                    <Breadcrumb.Item key={ind} {...(dir.iscurr?{}:{'href':'#'})}  onClick={this.props.onloadDir.bind(this,dir.fullpath)}>
                                        {dir.ishome ? <HomeOutlined /> : dir.showname}
                                    </Breadcrumb.Item>
                                ))
                            }    
                        </Breadcrumb>
                    </Col>
                    <Col span={2} style={{textAlign:'right'}}>
                        <Button title='刷新' size='small' type="default" shape="circle" icon={<ReloadOutlined />} onClick={this.props.onReloadCurrDir} />
                    </Col>
                </Row>                          
                <Divider style={{marginTop:'10px',marginBottom:'0px'}}/>
                <div style={listWrapperStyle}>
                    <List
                        itemLayout="horizontal"
                        dataSource={this.props.filelist}
                        renderItem={item => (
                        <List.Item>
                            <List.Item.Meta onClick={this.props.onSelectMapItem.bind(this,item)}
                            avatar={<Avatar icon={item.isfile ? <FileMarkdownOutlined /> : <FolderOutlined />} style={{ "backgroundColor": (item.isfile?'#40a9ff':'orange') }} />}
                            title={item.showname}
                            description={item.size}
                            />
                        </List.Item>
                        )}
                    />
                </div>
            </>
        );
    }
}

export default PathSelect;