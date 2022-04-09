import {Global } from '@emotion/react';
import React from 'react';
import { view as MapsViewer } from './ui/home';
import { ConfigProvider } from 'antd';
import {RecoilRoot} from 'recoil';
import zhCN from 'antd/es/locale/zh_CN';
import 'moment/locale/zh-cn';
import 'antd/dist/antd.css';

const table_color_title="#409EFF";
const table_color_border="#d0d7de";

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
                    backgroundColor: table_color_title,
                },
                '.markdown-body table > thead > tr > th': {
                    border: `1px solid ${table_color_title}`,
                    borderLeft: `1px solid ${table_color_border}`,
                    borderRight: `1px solid ${table_color_border}`,
                },
                '.markdown-body table > thead > tr > th:first-child': {
                    borderLeft: `1px solid ${table_color_title}`,
                },
                '.markdown-body table > thead > tr > th:last-child': {
                    borderRight: `1px solid ${table_color_title}`,
                },
            }}/>
            <ConfigProvider locale={zhCN}>
                <RecoilRoot>
                    <MapsViewer />
                </RecoilRoot>
            </ConfigProvider>
        </React.Fragment>
    );
}


export default App;
