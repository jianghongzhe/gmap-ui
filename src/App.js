import React from 'react';
import { view as MapsViewer } from './ui/home';
import { ConfigProvider } from 'antd';
import {RecoilRoot} from 'recoil';
import zhCN from 'antd/es/locale/zh_CN';
import 'moment/locale/zh-cn';
import 'antd/dist/antd.css';
import './App.module.scss';

function App() {
    return (
        <React.Fragment>
            <ConfigProvider locale={zhCN}>
                <RecoilRoot>
                    <MapsViewer />
                </RecoilRoot>
            </ConfigProvider>
        </React.Fragment>
    );
}


export default App;
