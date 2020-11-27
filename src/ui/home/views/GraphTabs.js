/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider,Spin  } from 'antd';
import { PlusCircleOutlined,MinusCircleOutlined,FormOutlined,LinkOutlined,ReadOutlined,ClockCircleOutlined,CloseOutlined,CheckOutlined } from '@ant-design/icons';
import {createSelector} from 'reselect';

import NewMindmap from './NewMindmap';
import MindNode from './MindNode';
import {connect} from '../../../common/gflow';

import api from '../../../service/api';


const { TabPane } = Tabs;



/**
 * 选项卡组件
 * @param {*} props 
 */
const GraphTabs=(props)=>{

    
    
    /**
     * 节点内容的render props
     */
    const ndContentRenderer=(nd)=>{
        return <MindNode key={nd.id} nd={nd}
            onOpenLink={props.onOpenLink} 
            onOpenRef={props.onOpenRef}
            onShowTimeline={props.onShowTimeline}
            onShowProgs={props.onShowProgs}
            onShowGant={props.onShowGant}/>;
    }

    /**
     * 折叠按钮的render props
     */
    const ndExpBtnRenderer=(nd)=>{
        return (
            <Button 
                type="link" 
                size='small' 
                title={nd.expand?"折叠":"展开"} 
                css={styles.expbtn}
                icon={
                    nd.expand ?
                        <MinusCircleOutlined className='expbtnicon' css={colors.toggle}/>
                            :
                        <PlusCircleOutlined className='expbtnicon' css={colors.toggle2}/>
                }  
                onClick={props.dispatcher.tabs.toggleExpand.bind(this,nd)}/>
        );
    }

    /**
     * 删除tab
     * @param {*} targetKey 
     * @param {*} action 
     */
    const onEditTab =useCallback((targetKey, action) => {
        if ("remove" === action) {
            props.dispatcher.tabs.removeTabCheckShouldStopFindInPage(targetKey);
        }
    },[props.dispatcher.tabs]);


    /**
     * 初始化快捷键，并在组件销毁时移除
     */
    useEffect(()=>{
        const keyHandle=(e)=>{
            //ctrl+f 网页内查找
            if(e && true===e.ctrlKey && 'KeyF'===e.code && true!==props.editing){
                api.showFindInPageDlg();
                return;
            }
            //esc 关闭网页内查找
            if(e && false===e.ctrlKey && false===e.altKey && false===e.shiftKey && 'Escape'===e.code && true!==props.editing){
                api.closeFindInPageDlg();
                return;
            }
            
            //alt+w 关闭当前选项卡（未使用ctrl+w，因为快捷键已被chrome使用，程序不能捕获到事件）
            if(e && true===e.altKey && 'KeyW'===e.code && true!==props.editing){
                // e.stopPropagation();
                // e.preventDefault();
                onEditTab(props.activeKey,"remove");
                return;
            }

            //ctrl+PageUp 前一个选项卡
            if(e && true===e.ctrlKey && 'PageUp'===e.code && true!==props.editing){
                props.dispatcher.tabs.movePreTab();
                return;
            }

            //ctrl+PageDown 后一个选项卡
            if(e && true===e.ctrlKey && 'PageDown'===e.code && true!==props.editing){
                props.dispatcher.tabs.moveNextTab();
                return;
            }
        }

        document.addEventListener('keydown', keyHandle);
        return ()=>document.removeEventListener('keydown',keyHandle);
    },[props.editing,props.activeKey,props.dispatcher.tabs,onEditTab]);

    
    
    return <React.Fragment>
        <Tabs
            hideAdd={true}
            type="editable-card"
            activeKey={props.activeKey}
            css={{ height:props.winH-64, 'backgroundColor': 'white' }}
            onChange={props.dispatcher.tabs.changeActiveKey}
            onEdit={onEditTab}>
            {
                props.panes.map((pane,ind) => (
                    <TabPane tab={pane.title} key={pane.key} closable={true}>
                        <div css={getTabItemContainerStyle(props.winH- 64 - 55-1)}>
                            <NewMindmap
                                ind={ind}
                                ds={pane.ds}
                                ndContentRenderer={ndContentRenderer}
                                ndExpBtnRenderer={ndExpBtnRenderer}
                            />
                        </div>
                    </TabPane>
                ))
            }
        </Tabs>
    </React.Fragment>;
}





const styles={
    expbtn:{
        width:14,
        height:14,
        verticalAlign:'bottom',
        padding:0,
        lineHeight:'14px',

        '& .expbtnicon':{
            fontSize:14,
            lineHeight:'14px',
            margin:0,
            padding:0,
        }
    },
};


const colors={
    toggle: {color:'#7cb305'},
    toggle2: {color:'#eb2f96'},//#eb2f96 #9254de
};

const getTabItemContainerStyle=(h)=>({
    height: h,
    maxHeight: h,
    overflowY: 'auto',
    overflowX: 'auto',
    width:'100%',
    paddingBottom:'30px'
});

export default connect((state)=>({
    winW:       state.common.winW,
    winH:       state.common.winH,
    activeKey:  state.tabs.activeKey,
    panes:      state.tabs.panes,
}))(GraphTabs);