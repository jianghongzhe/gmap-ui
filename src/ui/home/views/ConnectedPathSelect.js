import React from 'react';
import PathSelect from './PathSelect';
import { useGetAndLoadFileList } from '../../../hooks';


/**
 * 路径选择组件的包装
 */
const ConnectedPathSelect=(props)=>{
    const {files:filelist, dirLevs:dirs, recentFileList, load, reload}=useGetAndLoadFileList();
    const extProps={...props, filelist, dirs};

    return <PathSelect {...extProps} 
        onloadDir={load}
        onloadCurrDir={reload}
        recentFileList={recentFileList}
    />;
}



export default React.memo(ConnectedPathSelect);