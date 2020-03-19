/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider } from 'antd';
import PathSelect from './PathSelect';

class OpenGraphDlg extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }
    render() {
        //宽度计算
        let winW=this.props.winW;
        let expectW=900;
        if(winW<=expectW){
            expectW=winW-50;
        }

        return (
            <Modal
                title="打开图表"
                css={{
                    width: expectW,
                    minWidth: expectW,
                    maxWidth: expectW
                }}
                visible={this.props.visible}
                footer={null}
                onCancel={this.props.onCancel}>
                    <PathSelect 
                        maxH={this.props.itemsH}
                        forceMaxH={true}
                        dirs={this.props.dirs} 
                        filelist={this.props.filelist}
                        onloadDir={this.props.onloadDir}
                        onReloadCurrDir={this.props.onReloadCurrDir}
                        onSelectMapItem={this.props.onSelectMapItem}/>
            </Modal>
        );
    }
}

export default OpenGraphDlg;