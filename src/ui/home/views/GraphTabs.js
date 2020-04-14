/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider,Spin  } from 'antd';
import { PlusCircleOutlined,MinusCircleOutlined,FormOutlined,LinkOutlined,ReadOutlined,ClockCircleOutlined,CloseOutlined,CheckOutlined } from '@ant-design/icons';
import Mindmap from './Mindmap';
import NewMindmap from './NewMindmap';

const { TabPane } = Tabs;

class GraphTabs extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }



    


    ndContentRenderer=(nd)=>{
        return (<>
            <span className='themetxt' css={{paddingLeft:10,paddingRight:10, ...styles.themetxt}}>
                <span className='themename'>
                    {
                        "string"===typeof(nd.str) ?
                            <>{nd.str}</>
                                :
                            <>{nd.str.map((line,ind)=><span key={'ndtxt-'+ind}>{0<ind && <br/>}{line}</span>)}</>
                    } 
                </span>
            </span>
        </>);
    }

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

    // onToggleExpState=(nd)=>{

    // }

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


    themetxt: {
        whiteSpace: 'nowrap',
        display: 'inline-block',
        verticalAlign: 'bottom',
        // padding: '0px 0px  0px 0px',
        // fontSize: 16,

        '& .themename': {
            // color: 'white',
            // backgroundColor: '#108ee9',
            // borderRadius: 5,
            // fontSize: 18,
            // lineHeight: '20px',
            // padding: '8px 16px',
            whiteSpace: 'nowrap',
            display: 'inline-block',
            // marginLeft: 3,
            // marginRight: 3,
        },
    },

    

};


const colors={
    ref: {color:'#faad14'},
    memo: {color:'#faad14'},
    link: {color:'#1890ff'},
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