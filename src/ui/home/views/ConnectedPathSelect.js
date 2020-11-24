/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import PathSelect from './PathSelect';
import {connect} from '../../../common/gflow';

/**
 * 路径选择组件的包装
 */
const ConnectedPathSelect=(props)=>{
    return <PathSelect {...props} 
        onloadDir={props.dispatcher.filesel.load}
        onloadCurrDir={props.dispatcher.filesel.loadCurrDir}
    />;
}

const mapState=(state)=>({
    filelist:   state.filesel.filelist,
    dirs:       state.filesel.dirs,
});

export default connect(mapState)(ConnectedPathSelect);