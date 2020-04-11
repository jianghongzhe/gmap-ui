/** @jsx jsx */
import { css, jsx,Global } from '@emotion/core';
import React from 'react';
import logo from './logo.svg';
import { view as MapsViewer } from './ui/home';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import 'moment/locale/zh-cn';
import 'antd/dist/antd.css';


function App() {
    return (
        <>
            <Global styles={{
                body: {
                    margin: 0,
                    backgroundColor: '#f0f2f5',
                }
            }}/>
            <ConfigProvider locale={zhCN}>
                <MapsViewer />
            </ConfigProvider>
        </>
    );
}


export default App;
