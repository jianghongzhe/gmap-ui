/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { useCallback, useEffect, useState } from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider,Spin  } from 'antd';
import { PlusCircleOutlined,MinusCircleOutlined,FormOutlined,LinkOutlined,ReadOutlined,ClockCircleOutlined,CloseOutlined,CheckOutlined } from '@ant-design/icons';
import {createSelector} from 'reselect';
import Mindmap from './Mindmap';
import NewMindmap from './NewMindmap';
import MindNode from './MindNode';
import {connect} from '../../../common/gflow';
import newMindmapSvc from '../../../service/newMindmapSvc';
import api from '../../../service/api';
import FindInPageDlg from './FindInPageDlg';
import {useBoolean} from 'ahooks';

const { TabPane } = Tabs;

const GraphTabs=(props)=>{
    const [findDlgVisible, {setTrue: showFindDlg, setFalse}]=useBoolean(false);
    

    const hideFindDlg=useCallback(()=>{
        setFalse();
        api.stopFindInPage();
    },[setFalse]);

    useEffect(()=>{
        const keyHandle=(e)=>{
            // code: "PageDown"
            //ctrlKey: true
            // PageUp

            // findInPage
            /*
            Escape
            ArrowRight
            ArrowLeft
            */
            //e.altKey 
            //e.shiftKey
           
            // console.log(e);

            if(e && false===e.ctrlKey && false===e.altKey && false===e.shiftKey && 'Escape'===e.code && true!==props.editing){
                api.stopFindInPage();
                return;
            }
            if(e && false===e.ctrlKey && 'ArrowLeft'===e.code && true!==props.editing){
                api.findInPagePre();
                return;
            }
            if(e && false===e.ctrlKey && 'ArrowRight'===e.code && true!==props.editing){
                api.stopFindInPage();
                return;
            }


            console.log(e.code);

            if(e && true===e.ctrlKey && 'KeyF'===e.code && true!==props.editing){
                console.log("22 ----<");
                // api.findInPage("22");
                console.log("22 ---->");

                showFindDlg();
                return;
            }
            if(e && true===e.ctrlKey && 'KeyG'===e.code && true!==props.editing){
                console.log("22 ----<");
                api.findInPageNext("22");
                console.log("22 ---->");
                return;
            }
            if(e && true===e.ctrlKey && 'KeyH'===e.code && true!==props.editing){
                console.log("22 ----<");
                api.findInPagePre("22");
                console.log("22 ---->");
                return;
            }
            
            if(e && true===e.altKey && 'KeyW'===e.code && true!==props.editing){
                e.stopPropagation();
                e.preventDefault();
                onEditTab(props.activeKey,"remove");
                return;
            }
            if(e && true===e.ctrlKey && 'PageUp'===e.code && true!==props.editing){
                props.dispatcher.tabs.movePreTab();
                return;
            }
            if(e && true===e.ctrlKey && 'PageDown'===e.code && true!==props.editing){
                props.dispatcher.tabs.moveNextTab();
                return;
            }

            
        }

        document.addEventListener('keyup', keyHandle);
        return ()=>document.removeEventListener('keyup',keyHandle);
    },[props.panes, props.editing, props.activeKey,findDlgVisible]);
    
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
    const onEditTab = (targetKey, action) => {
        if ("remove" === action) {
            props.dispatcher.tabs.removeTab(targetKey);
        }
    };

    
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
        <FindInPageDlg 
            visible={findDlgVisible} 
            onCancel={hideFindDlg}
        />
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