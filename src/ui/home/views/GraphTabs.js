import React, { useCallback, useEffect} from 'react';
import {Tabs,  Button} from 'antd';
import { PlusCircleOutlined,MinusCircleOutlined,FileMarkdownOutlined,FileOutlined} from '@ant-design/icons';

import NewMindmap from './NewMindmap';
import MindNode from './MindNode';
import keyDetector from 'key-detector/src';
import {tabActiveKey, tabPanes} from '../../../store/tabs';
import {useRecoilValue} from 'recoil';
import { useMoveNextTab, useMovePreTab, useRemoveAllTabs, useRemoveLeftTabs, useRemoveOtherTabs, useRemoveRightTabs, useRemoveTab, useSetAssignedTabKey, useToggleExpand, useToggleNextTab, useTogglePreTab } from '../../../hooks/tabs';

const { TabPane } = Tabs;



/**
 * 选项卡组件
 * @param {*} props 
 */
const GraphTabs=(props)=>{
    const activeKey=useRecoilValue(tabActiveKey);
    const panes=useRecoilValue(tabPanes);
    const toggleExpand= useToggleExpand();
    const togglePreTab=useTogglePreTab();
    const toggleNextTab=useToggleNextTab();
    const setAssignedTabKey=useSetAssignedTabKey();
    const removeTab=useRemoveTab();
    const removeAllTabs=useRemoveAllTabs();
    const removeOtherTabs=useRemoveOtherTabs();
    const removeLeftTabs=useRemoveLeftTabs();
    const removeRightTabs=useRemoveRightTabs();
    const movePreTab=useMovePreTab();
    const moveNextTab=useMoveNextTab();
    
    
    /**
     * 节点内容的render props
     */
    const ndContentRenderer=(nd)=>{
        return <MindNode key={nd.id} nd={nd}
            onOpenLink={props.onOpenLink} 
            onOpenRef={props.onOpenRef}
            onShowTimeline={props.onShowTimeline}
            onShowProgs={props.onShowProgs}
            onShowGant={props.onShowGant}
            onShowGraph={props.onShowGraph}/>;
    }

    /**
     * 折叠按钮的render props
     */
    const ndExpBtnRenderer=(nd, expands)=>{
        return (
            <Button 
                type="link" 
                size='small' 
                title={nd.expand?"折叠":"展开"} 
                css={styles.expbtn}
                icon={
                    expands[nd.id] ?
                        <MinusCircleOutlined className='expbtnicon' css={colors.toggle}/>
                            :
                        <PlusCircleOutlined className='expbtnicon' css={colors.toggle2}/>
                }  
                onClick={toggleExpand.bind(this,nd)}/>
        );
    }

    /**
     * 删除tab
     * @param {*} targetKey 
     * @param {*} action 
     */
    const onEditTab =useCallback((targetKey, action) => {
        if ("remove" === action) {
            removeTab(targetKey);
        }
    },[removeTab]);


    /**
     * 初始化快捷键，并在组件销毁时移除
     */
    useEffect(()=>{
        const keyHandle=(e)=>{
            //当有对话框窗口打开时，不支持选项卡操作
            const isExclude=props.hasOpenDlg;// excludeStates.some(each=>true===each);

            keyDetector.on(e,{
                //alt+w 关闭当前选项卡（未使用ctrl+w，因为快捷键已被chrome使用，程序不能捕获到事件）
                'alt+w':(e)=>{
                    if(isExclude){return;}
                    onEditTab(activeKey,"remove");
                },

                //alt+shift+w 关闭全部选项卡
                'alt+shift+w':(e)=>{
                    if(isExclude){return;}
                    removeAllTabs();
                },

                //alt+o 关闭其他选项卡
                'alt+o':(e)=>{
                    if(isExclude){return;}
                    removeOtherTabs();
                },

                //alt+p 关闭右侧选项卡
                'alt+p':(e)=>{
                    if(isExclude){return;}
                    removeRightTabs();
                },

                //alt+i 关闭左侧选项卡
                'alt+i':(e)=>{
                    if(isExclude){return;}
                    removeLeftTabs();
                },

                //ctrl+PageUp 前一个选项卡
                'ctrl+pgup':(e)=>{
                    if(isExclude){return;}
                    togglePreTab();
                },

                //ctrl+PageDown 后一个选项卡
                'ctrl+pgdn':(e)=>{
                    if(isExclude){return;}
                    toggleNextTab();
                },

                //ctrl+Shift+PageUp 选项卡前移
                'ctrl+shift+pgup':(e)=>{
                    if(isExclude){return;}
                    movePreTab();
                },

                //ctrl+Shift+PageDown 选项卡后移
                'ctrl+shift+pgdn':(e)=>{
                    if(isExclude){return;}
                    moveNextTab();
                },
            });
        }

        document.addEventListener('keydown', keyHandle);
        return ()=>document.removeEventListener('keydown',keyHandle);
    },[props.hasOpenDlg, activeKey, onEditTab, togglePreTab, toggleNextTab,moveNextTab, movePreTab, removeAllTabs, removeLeftTabs, removeOtherTabs, removeRightTabs]);

    
    
    const result= <React.Fragment>
        <Tabs
            hideAdd={true}
            type="editable-card"
            activeKey={activeKey}
            css={{ height:'calc(100vh - 64px)', 'backgroundColor': 'white' }}
            onChange={setAssignedTabKey}
            onEdit={onEditTab}>
            {
                panes.map((pane,ind) => (
                    <TabPane tab={
                        <span>
                            {pane.key===activeKey ? <FileMarkdownOutlined /> : <FileOutlined/>}
                            {pane.title}
                        </span>
                    } key={pane.key} closable={true}>
                        <div css={getTabItemContainerStyle(tabContentH)}>
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

    
    return result;
}

// 100vh- 64 - 55-1
const tabContentH='calc(100vh - 120px)';



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


export default React.memo(GraphTabs);