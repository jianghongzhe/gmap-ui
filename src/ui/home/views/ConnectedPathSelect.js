/** @jsxImportSource @emotion/react */
import React from 'react';
import PathSelect from './PathSelect';
import {connect,dispatcher} from '../../../common/gflow';
import { useSelector } from 'react-redux';


/**
 * 路径选择组件的包装
 */
const ConnectedPathSelect=(props)=>{
    const {filelist, dirs}= useSelector((state)=>{
        return {
            filelist:   state.filesel.filelist,
            dirs:       state.filesel.dirs,
        }
    });

    const extProps={...props, filelist, dirs};

    return <PathSelect {...extProps} 
        onloadDir={dispatcher.filesel.load}
        onloadCurrDir={dispatcher.filesel.loadCurrDir}
    />;
}



export default React.memo(ConnectedPathSelect);