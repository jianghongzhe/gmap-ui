import React from 'react';
import logo from './logo.svg';
import './App.css';
import Mindmap from './Mindmap';
import MapsViewer from './MapsViewer';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import 'antd/dist/antd.css';
import './global.css';

//<Mindmap/>
function App() {
  return (
    <ConfigProvider locale={zhCN}>
    <MapsViewer/>
     {/* <Mindmap/> */}
    </ConfigProvider>
  );
}

export default App;
