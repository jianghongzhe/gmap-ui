/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider,Spin  } from 'antd';
import { PlusCircleOutlined,MinusCircleOutlined,FormOutlined,LinkOutlined,ReadOutlined,ClockCircleOutlined,CloseOutlined,CheckOutlined } from '@ant-design/icons';
import Mindmap from './Mindmap';
import NewMindmap from './NewMindmap';
import MindNode from './MindNode';

const { TabPane } = Tabs;

class GraphTabs extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }



    

    /**
     * 节点内容的render props
     */
    ndContentRenderer=(nd)=>{
        return <MindNode nd={nd}
            onOpenLink={this.props.onOpenLink} 
            onOpenRef={this.props.onOpenRef}
            onShowTimeline={this.props.onShowTimeline}
            onShowProgs={this.props.onShowProgs}
            onShowGant={this.props.onShowGant}/>;
    }

    /**
     * 折叠按钮的render props
     */
    ndExpBtnRenderer=(nd)=>{
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
                onClick={this.props.onToggleExpand.bind(this,nd)}/>
        );
    }

    

    render() {
        

        return (
            <Spin spinning={this.props.loading} size="large">
                <Tabs
                    hideAdd={true}
                    type="editable-card"
                    activeKey={this.props.activeKey}
                    css={{ height:this.props.containerH, 'backgroundColor': 'white' }}
                    onChange={this.props.onChangeTab}
                    onEdit={this.props.onEditTab}>
                    {
                        this.props.panes.map(pane => (
                            <TabPane tab={pane.title} key={pane.key} closable={true}>
                                <div css={getTabItemContainerStyle(this.props.contentH)}>
                                    <NewMindmap
                                        ds={pane.ds}
                                        ndContentRenderer={this.ndContentRenderer}
                                        ndExpBtnRenderer={this.ndExpBtnRenderer}
                                    />

                                    {/* <Mindmap cells={pane.mapCells} 
                                        onOpenLink={this.props.onOpenLink} 
                                        onOpenRef={this.props.onOpenRef}
                                        onShowTimeline={this.props.onShowTimeline}
                                        onShowProgs={this.props.onShowProgs}
                                        onShowGant={this.props.onShowGant}
                                        onToggleExpand={this.props.onToggleExpand.bind(this, pane.key)} /> */}
                                </div>
                            </TabPane>
                        ))
                    }
                </Tabs>
            </Spin>
        );
    }
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

export default GraphTabs;