/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Modal } from 'antd';
import {  } from '@ant-design/icons';
import GantChart from './GantChart';


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
        if(this.props.winW!==prevProps.winW || this.props.maxH!==prevProps.maxH){
            setTimeout(()=>{
                this.isForceUpdate=true;//此标志会使重绘完成之后再回调本方法，进行第二次操作：设置箭头位置
                this.forceUpdate();
            }, 100);
            return;
        }
    }

    render() {

        return (
            <Modal  title="甘特图"
                    visible={this.props.visible}
                    footer={null}
                    onCancel={this.props.onCancel}
                    css={{width: this.props.maxW, minWidth:this.props.maxW, maxWidth:this.props.maxW}}>
                {/* <div css={{
                    height:this.props.maxH,
                    minHeight:this.props.maxH,
                    maxHeight:this.props.maxH,
                }}> */}
                    <GantChart 
                        key='gant-comp'
                        ds={this.props.ds}
                        colKeys={this.props.colKeys} 
                        arrows={this.props.arrows}
                        winW={this.props.winW} 
                        maxh={this.props.maxH-100}  
                        layoutArrows={this.state.layoutArrows}/>    
                {/* </div>         */}
            </Modal>
        );
    }
}

export default GantDlg;