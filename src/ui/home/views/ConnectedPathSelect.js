import React from 'react';
import PathSelect from './PathSelect';
import { useGetAndLoadFileList } from '../../../hooks';


/**
 * 路径选择组件的包装
 */
const ConnectedPathSelect=(props)=>{
    const [filelist, dirs, load, reload]=useGetAndLoadFileList();
    const extProps={...props, filelist, dirs};

    return <PathSelect {...extProps} 
        onloadDir={load}
        onloadCurrDir={reload}
    />;
}



export default React.memo(ConnectedPathSelect);