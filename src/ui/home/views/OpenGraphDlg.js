/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider } from 'antd';
import PathSelect from './PathSelect';
import {withEnh} from '../../common/specialDlg';
import {connect} from '../../../common/gflow';

const EnhDlg=withEnh(Modal);

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

        let pathselectBacktopLoc=[
            (winW-expectW)/2+100,
            150
        ];

        return (
            <EnhDlg noFooter
                    title="打开图表"
                    size={{w:expectW}}
                    visible={this.props.visible}
                    onCancel={this.props.onCancel}>

                <PathSelect 
                    maxH={this.props.winH- 64 - 250}
                    forceMaxH={true}
                    backtopLoc={pathselectBacktopLoc}
                    dirs={this.props.dirs} 
                    filelist={this.props.filelist}
                    onloadDir={this.props.onloadDir}
                    onReloadCurrDir={this.props.onReloadCurrDir}
                    onSelectMapItem={this.props.onSelectMapItem}/>
            </EnhDlg>
        );
    }
}

export default connect((state)=>({
    winW:state.common.winW,
    winH:state.common.winH,
}))(OpenGraphDlg);