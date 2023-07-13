import React, {useRef} from 'react';
import PathSelect from './PathSelect';
import { useGetAndLoadFileList } from '../../../hooks';
import {useBoolean, useMemoizedFn} from "ahooks";
import {Button, Modal} from "antd";
import {QuestionCircleOutlined, QuestionOutlined} from "@ant-design/icons";
import styles from './ConnectedPathSelect.module.scss';


/**
 * 路径选择组件的包装
 */
const ConnectedPathSelect=(props)=>{
    const {files:filelist, dirLevs:dirs, recentFileList, load, reload, clearAccHisAndReload}=useGetAndLoadFileList();
    const extProps={...props, filelist, dirs};
    const [confirmDlgVisible, {setTrue: showConfirmDlg, setFalse: hideConfirmDlg}]= useBoolean(false);
    const dataRef= useRef(null);

    const confirmedClearAttHis=useMemoizedFn((item)=>{
        dataRef.current=item;
        showConfirmDlg(true);
    });

    const doDel=useMemoizedFn((item=null)=>{
        clearAccHisAndReload(item?.itemsName??null);
        hideConfirmDlg();
    });



    return <React.Fragment>
        <PathSelect {...extProps}
                    onloadDir={load}
                    onloadCurrDir={reload}
                    onClearAccHis={confirmedClearAttHis}
                    recentFileList={recentFileList}
        />
        <Modal title={null}
               closable={false}
               className={styles.dlg}
               open={confirmDlgVisible}
               onCancel={hideConfirmDlg}
               footer={<React.Fragment>
                   <Button type='primary' danger onClick={doDel.bind(this, dataRef.current)}>删除当前</Button>
                   <Button type='primary' danger onClick={doDel.bind(this, null)}>清空所有</Button>
                   <Button onClick={hideConfirmDlg}>取消</Button>
               </React.Fragment>}
        >
            <div className='titleWrapper'>
                <QuestionCircleOutlined size='large' className='icon'/>
                <span className='title'>浏览记录操作</span>
            </div>
            <div className='content'>
                <div>删除当前 - 从浏览记录中删掉 [{dataRef.current?.itemsName}] 项</div>
                <div>清空所有 - 把所有浏览记录清空</div>
                <div className='warningTxt'>注：删除或清空操作后不可恢复，请谨慎操作 !!!</div>
            </div>
        </Modal>
    </React.Fragment>;
}



export default React.memo(ConnectedPathSelect);