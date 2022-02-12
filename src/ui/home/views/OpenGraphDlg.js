/** @jsxImportSource @emotion/react */
import React from 'react';
import { Modal} from 'antd';
import {withEnh} from '../../common/specialDlg';
import ConnectedPathSelect from './ConnectedPathSelect';

const EnhDlg=withEnh(Modal);

/**
 * 打开图表对话框
 * @param {*} props 
 */
const OpenGraphDlg=(props)=>{
    return (
        <EnhDlg noFooter
                title="打开图表"
                size={{w:`${dlgW}px`}}
                visible={props.visible}
                onCancel={props.onCancel}>
            <ConnectedPathSelect 
                maxH='calc(100vh - 64px - 250px)'
                forceMaxH={true}
                backtopLoc={backTopLoc}
                onSelectMapItem={props.onSelectMapItem}/>
        </EnhDlg>
    );
}


const dlgW=900;
const backTopLoc=[`calc(50vw - ${parseInt(dlgW/2)}px + 100px)`, '150px'];


export default React.memo(OpenGraphDlg);