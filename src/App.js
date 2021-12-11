/** @jsxImportSource @emotion/react */
import {Global } from '@emotion/react';
import React from 'react';
import { view as MapsViewer } from './ui/home';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import 'moment/locale/zh-cn';
import 'antd/dist/antd.css';


function App() {
    return (
        <React.Fragment>
            <Global styles={{
                body: {
                    margin: 0,
                    backgroundColor: '#f0f2f5',
                },
                '.markdown-body blockquote': {
                    borderLeft: '.25em solid lightgreen !important',
                },
                '.markdown-body table > thead > tr': {
                    color: '#fff',
                    backgroundColor: '#1890ff',
                },
                '.markdown-body table > thead > tr > th': {
                    border: '1px solid #1890ff',
                    borderLeft: '1px solid #d0d7de',
                    borderRight: '1px solid #d0d7de',
                },
                '.markdown-body table > thead > tr > th:first-child': {
                    borderLeft: '1px solid #1890ff',
                },
                '.markdown-body table > thead > tr > th:last-child': {
                    borderRight: '1px solid #1890ff',
                },
            }}/>
            <ConfigProvider locale={zhCN}>
                <MapsViewer />
            </ConfigProvider>
        </React.Fragment>
    );
}


export default App;
