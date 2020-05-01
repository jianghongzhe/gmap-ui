/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Modal } from 'antd';
import {  } from '@ant-design/icons';
import GantChart from './GantChart';
import {withEnh} from '../../../common/specialDlg';
import {connect} from '../../../../common/gflow';
import { createSelector } from 'reselect';

const EnhDlg=withEnh(Modal);


class GantDlg extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            layoutArrows:null
        };
        this.showCnt=0;
        this.isForceUpdate=false;

    }

    /**
     * 强制重绘并重新计算箭头位置
     * 两种情况会触发强制重绘：
     * 1、对话框第2次以后的显示，如果不强制则表格变形
     * 2、窗口大小变化
     * @param {*} prevProps 
     * @param {*} prevState 
     */
    componentDidUpdate(prevProps,prevState){
        //设置箭头位置
        if(this.isForceUpdate){
            this.isForceUpdate=false;
            this.setState({
                layoutArrows: Symbol()
            });
            return;
        }

        //当不是第一次显示时进行强制重绘（保证表格不变形（不这样会变形）），并触发下次进行箭头位置计算
        if(!prevProps.visible && this.props.visible){
            ++this.showCnt;            
            if(1<this.showCnt){
                setTimeout(()=>{
                    this.isForceUpdate=true;//此标志会使重绘完成之后再回调本方法，进行第二次操作：设置箭头位置
                    this.forceUpdate();
                }, 100);
            }
            return;
        }

        //当窗口大小有变化时也进行强制重绘，并触发下次进行箭头位置计算
        if(this.props.resizeSymbol!==prevProps.resizeSymbol){
            setTimeout(()=>{
                this.isForceUpdate=true;//此标志会使重绘完成之后再回调本方法，进行第二次操作：设置箭头位置
                this.forceUpdate();
            }, 100);
            return;
        }
    }

    render() {
        let {ds, colKeys, relas}=getParts(this.props);

        return (
            <EnhDlg noFooter
                    title="甘特图"
                    visible={this.props.visible}
                    size={{w:this.props.winW-200}}
                    onCancel={this.props.onCancel}>

                <GantChart 
                    key='gant-comp'
                    ds={ds}
                    colKeys={colKeys} 
                    arrows={relas}
                    winW={this.props.winW} 
                    maxh={this.props.winH-250-100}  
                    layoutArrows={this.state.layoutArrows}/>    
            </EnhDlg>
        );
    }
}

const getParts=createSelector(
    props=>props.gantObj,
    gantObj=>{
        if(!gantObj){
            return {
                ds:         [],
                colKeys:    [],
                relas:      [],
            };
        }
        return {
            ds:         gantObj.data? gantObj.data: [],
            colKeys:    gantObj.colKeys? gantObj.colKeys: [],
            relas:      gantObj.relas? gantObj.relas:[],
        };
    }
);

const mapState=(state)=>({
    winW:           state.common.winW,
    winH:           state.common.winH,
    resizeSymbol:   state.common.resizeSymbol
});

export default connect(mapState)(GantDlg);