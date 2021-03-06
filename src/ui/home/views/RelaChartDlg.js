import React, { useEffect, useRef, useState } from 'react';
import {Button,Modal} from 'antd';
import RelaChart from './RelaChart';
import { useSelector } from 'react-redux';



const RelaChartDlg=(props)=>{
    const {winW,winH}=useSelector((state)=>({
        winW:state.common.winW,
        winH:state.common.winH,
    }));

    // const [forceRender, setForceRender]=useState(Symbol());

    // useEffect(()=>{
    //     if(props.visible){
    //         setForceRender(Symbol());
    //     }
    // },[props.visible]);

    const w=winW-200;
    const h=winH-300;

    return (
        <Modal 
                title={`关系图 - ${props.name}`} 
                visible={props.visible} 
                width={w} 
                footer={null}
                onCancel={props.onCancel}>
            <RelaChart w={w-50} h={h} opts={props.opts} />
        </Modal>
    );
};

export default RelaChartDlg;