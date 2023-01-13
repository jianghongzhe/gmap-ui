import {useState} from "react";
import {useMemoizedFn} from "ahooks";

export const useEditorDlg=()=>{

    const [{currMapName,editTmpTxt,editMapDlgVisible}, setEditDlgState]= useState({
        currMapName: '',
        editTmpTxt: '',
        editMapDlgVisible: false,
    });

    const closeDlg=useMemoizedFn(()=>{
        setEditDlgState(state=>({...state, editMapDlgVisible:false}));
    });

    const showDlg=useMemoizedFn((title, txt)=>{
        setEditDlgState({
            editMapDlgVisible: true,
            editTmpTxt: txt,
            currMapName: title,
        });
    });

    const changeTxt=useMemoizedFn((txt)=>{
        setEditDlgState(state=>({...state, editTmpTxt: txt}));
    });

    return {
        currMapName,
        editTmpTxt,
        editMapDlgVisible,

        closeDlg,
        showDlg,
        changeTxt,
    };
};