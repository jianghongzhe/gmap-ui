/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider,Popover,BackTop,Avatar } from 'antd';
import {withEnh} from '../../common/specialDlg';
import {connect} from '../../../common/gflow';
import MarkedHighlightUtil from '../../../common/MarkedHighlightUtil';
import mindmapSvc from '../../../service/mindmapSvc';
import api from '../../../service/api';
import {createSelector} from 'reselect';

import marked from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark-reasonable.css';
import 'github-markdown-css/github-markdown.css';

const EnhDlg=withEnh(Modal);
const codeBg = 'rgba(40,44,52,1)'; //40 44 52  #282c34
const markedHighlightUtil = new MarkedHighlightUtil();

class RefViewer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
        this.wrapperId="refviewercontainer"+new Date().getTime();
    }

    componentDidMount(){
        //初始化marked与hljs
        markedHighlightUtil.init(marked, hljs, {
            codeConfig: {
                bg: codeBg
            },
            linkConfig: {
                disableDefault: true,
                convertUrl: (oldurl) => {
                    let addr = oldurl;
                    if (!mindmapSvc.hasUrlPrefix(addr)) { addr = "http://" + addr.trim(); }//不带协议的加http前缀
                    return addr;
                }
            },
            imgConfig: {
                convertUrl: (oldurl) => {
                    if (!(oldurl.startsWith("./") || oldurl.startsWith("../"))) { return oldurl; }//跳过不是本地相对路径的
                    return api.calcPicUrl(this.props.activeKey, oldurl);
                }
            }
        });
    }

    componentDidUpdate(prevProps, prevState) {
        //每次显示时重新绑定点击事件
        if(!prevProps.visible && this.props.visible){
            setTimeout(() => {
                markedHighlightUtil.bindLinkClickEvent(api.openUrl);
                markedHighlightUtil.bindImgClickEvent(api.openUrl);
            }, 100);//迟延一会等视图已加载完再处理（否则第一次显示看不到效果）
        }
    }

    getScrollTarget=()=>{
        return document.getElementById(this.wrapperId);
    }

    render() {
        let result=dataSelector(this.props);
        if(null===result){
            return null;
        }
        let {refname,refCont}=result;
        

        return (
            <EnhDlg noFooter
                    title={"查看引用 - " + refname}
                    size={{w:this.props.winW-200, h:this.props.winH-300, fixh:true, wrapperId:this.wrapperId}}                
                    visible={this.props.visible}
                    maskClosable={true}               
                    onCancel={this.props.onCancel}>
                <div className='markdown-body' css={{
                    margin:'0px auto',
                    width:'98%',
                    overflowX:'hidden'}}
                    dangerouslySetInnerHTML={{__html:refCont}}>
                </div>
                {
                    (this.props.backtopLoc && 2===this.props.backtopLoc.length) && (   
                        <BackTop  target={this.getScrollTarget} css={{
                            right:200,
                            bottom:170,
                            ...backtopColorStyle
                        }}/>
                    )
                }
            </EnhDlg>
        );
    }
}

const dataSelector=createSelector(
    props=>props.currRefObj,
    refObj=>{
        if(!refObj || !refObj.txt || !refObj.showname){
            return null;
        }
        if (null == refObj.parsedTxt) {
            refObj.parsedTxt = marked(refObj.txt);
        }
        let refname=refObj.showname;
        let refCont=refObj.parsedTxt;
        return {refname,refCont};
    }
);

//24  144 255    #1890ff
//16  136 233    #1088e9
const backtopColorStyle={
    '& .ant-back-top-content':{
        backgroundColor:'rgba(24,144,255, .80)',
    },
    '&:hover .ant-back-top-content':{
        backgroundColor:'rgba(24,144,255, 1.0)', 
    },
}

export default connect((state)=>({
    winW:       state.common.winW,
    winH:       state.common.winH,
    activeKey:  state.tabs.activeKey,
}))(RefViewer);