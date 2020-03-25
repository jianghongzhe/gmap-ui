/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout,   Tabs, Modal, Input, message, Button, Divider } from 'antd';
import Mindmap from './Mindmap';

const { TabPane } = Tabs;

class GraphTabs extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }
    render() {
        return (
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
                                <Mindmap cells={pane.mapCells} 
                                    onOpenLink={this.props.onOpenLink} 
                                    onOpenRef={this.props.onOpenRef}
                                    onShowTimeline={this.props.onShowTimeline}
                                    onToggleExpand={this.props.onToggleExpand.bind(this, pane.key)} />
                            </div>
                        </TabPane>
                    ))
                }
            </Tabs>
        );
    }
}

const getTabItemContainerStyle=(h)=>({
    height: h,
    maxHeight: h,
    overflowY: 'auto',
    overflowX: 'auto',
    width:'100%',
    paddingBottom:'30px'
});

export default GraphTabs;