/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import PathSelect from './PathSelect';
import {connect} from '../../../common/gflow';


class ConnectedPathSelect extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {  };
    }
    render() {
        return <PathSelect {...this.props} 
            onloadDir={this.props.dispatcher.filesel.load}
            onloadCurrDir={this.props.dispatcher.filesel.loadCurrDir}
        />;
    }
}

const mapState=(state)=>({
    filelist:   state.filesel.filelist,
    dirs:       state.filesel.dirs,
});

export default connect(mapState)(ConnectedPathSelect);