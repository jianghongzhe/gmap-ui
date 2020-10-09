/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { Component } from 'react';
import { Layout, message,Modal } from 'antd';

class AlertPathInvalidDlg extends Component {
    constructor() {
        super(...arguments);
        this.state = {  };
    }
    render() {
        return (
            <Modal visible={this.props.visible} >

            </Modal>
        );
    }
}

export default AlertPathInvalidDlg;