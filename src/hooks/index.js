import {useSetRecoilState, useRecoilState, useRecoilValue} from 'recoil';
import {installPathValid, allDirs} from '../store/common';
import {filelist, fileListDirLevels, currFileListDir} from '../store/filelist';
import {useMount} from 'ahooks';
import api from '../service/api';
import generalSvc from '../service/generalSvc';
import { useCallback } from 'react';



/**
 * 加载路径合法性
 * @returns func
 */
export const useSetPathValidState=()=>{
    const set=useSetRecoilState(installPathValid);
    return useCallback(()=>{
        (async ()=>{
            const installPath=await api.getBasePath();
            const pathValid=(generalSvc.isPathValid(installPath) ? true : false);
            set(pathValid);
            if(!pathValid){
                setTimeout(() => {
                    api.showNotification('警告', '请不要安装到中文路径或带空格的路径下，否则可能造成某些功能异常', 'warn');    
                }, 500);
            }
        })();
    },[set]);
};


/**
 * 加载窗口标题
 * @returns 
 */
export const useSetWindowTitle=()=>{
    return useCallback(()=>{
        (async ()=>{
            let titleTxt=await api.loadAppNameAndVersionTxt();
            const vers=await api.getInnerModuleVersions();
            document.querySelector("head > title").innerHTML = `${titleTxt}　( powered by electron ${vers.electron}, node ${vers.node}, chrome ${vers.chrome}, v8 ${vers.v8} )`;
        })();
    },[]);
};


/**
 * 初始化查找对话框
 * @returns 
 */
export const useInitFindInPageDlg=()=>{
    return useCallback(()=>{
        api.initFindInPageDlg();
    },[]);
};


/**
 * 获得并加载所有目录
 * @returns 
 */
export const useGetAndLoadAllDirs=()=>{
    const [dirs, set]=useRecoilState(allDirs);
    const loadFunc= useCallback(()=>{
        (async ()=>{
            const allDirs=await api.listAllDirs();
            set(allDirs);
        })();        
    },[set]);
    return [dirs, loadFunc];
};


/**
 * 加载所有目录
 * @returns 
 */
export const useLoadAllDirs=()=>{
    const set=useSetRecoilState(allDirs);
    return useCallback(()=>{
        (async ()=>{
            const allDirs=await api.listAllDirs();
            set(allDirs);
        })();        
    },[set]);
};


/**
 * 加载文件列表
 * @returns 
 */
export const useLoadFileList=()=>{
    const setFileList= useSetRecoilState(filelist);
    const setFileListDirLevels= useSetRecoilState(fileListDirLevels);
    const currDir=useRecoilValue(currFileListDir);

    const load= useCallback((dir=null)=>{
        (async()=>{
            const filelist=await (dir ? api.list(dir) : api.list());
            const dirs=await (dir ? api.getPathItems(dir) : api.getPathItems());
            setFileList(filelist);
            setFileListDirLevels(dirs);
        })();        
    },[setFileList, setFileListDirLevels]);

    const reload=useCallback(()=>{
        (async()=>{
            const filelist=await (currDir ? api.list(currDir) : api.list());
            const dirs=await (currDir ? api.getPathItems(currDir) : api.getPathItems());
            setFileList(filelist);
            setFileListDirLevels(dirs);
        })();        
    },[currDir, setFileList, setFileListDirLevels]);

    return [load, reload];
};


export const useGetAndLoadFileList=()=>{
    const [files, setFileList]= useRecoilState(filelist);
    const [dirLevs, setFileListDirLevels]= useRecoilState(fileListDirLevels);
    const currDir=useRecoilValue(currFileListDir);

    const load= useCallback((dir=null)=>{
        (async()=>{
            const filelist=await (dir ? api.list(dir) : api.list());
            const dirs=await (dir ? api.getPathItems(dir) : api.getPathItems());
            setFileList(filelist);
            setFileListDirLevels(dirs);
        })();        
    },[setFileList, setFileListDirLevels]);

    const reload=useCallback(()=>{
        (async()=>{
            const filelist=await (currDir ? api.list(currDir) : api.list());
            const dirs=await (currDir ? api.getPathItems(currDir) : api.getPathItems());
            setFileList(filelist);
            setFileListDirLevels(dirs);
        })();        
    },[currDir, setFileList, setFileListDirLevels]);

    return [files, dirLevs, load, reload];
};

