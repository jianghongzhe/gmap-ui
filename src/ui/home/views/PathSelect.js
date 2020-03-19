/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Breadcrumb,Button,Row, Col,List, Avatar,Divider   } from 'antd';
import { FileMarkdownOutlined,ReloadOutlined,HomeOutlined,FolderOutlined } from '@ant-design/icons';

class PathSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }
    render() {
        //列表样式，如果指定的forceMaxH，则保持高度和最大高度一致
        let listWrapperStyle={'maxHeight':this.props.maxH,'overflowY':'auto','overflowX':'hidden'};
        if(this.props.forceMaxH){
            listWrapperStyle={'height':this.props.maxH,'minHeight':this.props.maxH, ...listWrapperStyle};
        }

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
                        <Button title='刷新' size='small' type="default" shape="circle" icon={<ReloadOutlined />} onClick={this.props.onReloadCurrDir} />
                    </Col>
                </Row>                          
                <Divider css={{marginTop:'10px',marginBottom:'0px'}}/>
                <div css={listWrapperStyle}>
                    <List
                        itemLayout="horizontal"
                        dataSource={this.props.filelist}
                        renderItem={item => (
                            <List.Item>
                                <List.Item.Meta onClick={this.props.onSelectMapItem.bind(this,item)}
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
            </>
        );
    }
}

export default PathSelect;