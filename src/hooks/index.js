import {useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import {allDirs, installPathValid} from '../store/common';
import {currFileListDir, filelist, fileListDirLevels} from '../store/filelist';
import api from '../service/api';
import generalSvc from '../service/generalSvc';
import {useMemoizedFn} from "ahooks";


/**
 * 加载路径合法性
 * @returns func
 */
export const useSetPathValidState=()=>{
    const set=useSetRecoilState(installPathValid);
    return useMemoizedFn(()=>{
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
    });
};


/**
 * 加载窗口标题
 * @returns 
 */
export const useSetWindowTitle=()=>{
    return useMemoizedFn(()=>{
        (async ()=>{
            let titleTxt=await api.loadAppNameAndVersionTxt();
            let {react,antd}=await api.loadDepsVersion();
            const vers=await api.getInnerModuleVersions();
            document.querySelector("head > title").innerHTML = `${titleTxt}　( powered by electron ${vers.electron}, node ${vers.node}, chrome ${vers.chrome}, v8 ${vers.v8}, react ${react}, antd ${antd} )`;
        })();
    });
};


/**
 * 初始化查找对话框
 * @returns 
 */
export const useInitFindInPageDlg=()=>{
    return useMemoizedFn(()=>{
        api.initFindInPageDlg();
    });
};


/**
 * 获得并加载所有目录
 * @returns 
 */
export const useGetAndLoadAllDirs=()=>{
    const [dirs, set]=useRecoilState(allDirs);
    const loadFunc= useMemoizedFn(()=>{
        (async ()=>{
            const allDirs=await api.listAllDirs();
            set(allDirs);
        })();        
    });
    return [dirs, loadFunc];
};


/**
 * 加载所有目录
 * @returns 
 */
export const useLoadAllDirs=()=>{
    const set=useSetRecoilState(allDirs);
    return useMemoizedFn(()=>{
        (async ()=>{
            const allDirs=await api.listAllDirs();
            set(allDirs);
        })();        
    });
};


/**
 * 加载文件列表
 * @returns 
 */
export const useLoadFileList=()=>{
    const setFileList= useSetRecoilState(filelist);
    const setFileListDirLevels= useSetRecoilState(fileListDirLevels);
    const currDir=useRecoilValue(currFileListDir);

    const load= useMemoizedFn((dir=null)=>{
        (async()=>{
            const filelist=await (dir ? api.list(dir) : api.list());
            const dirs=await (dir ? api.getPathItems(dir) : api.getPathItems());
            setFileList(filelist);
            setFileListDirLevels(dirs);
        })();        
    });

    const reload=useMemoizedFn(()=>{
        (async()=>{
            const filelist=await (currDir ? api.list(currDir) : api.list());
            const dirs=await (currDir ? api.getPathItems(currDir) : api.getPathItems());
            setFileList(filelist);
            setFileListDirLevels(dirs);
        })();        
    });

    return [load, reload];
};


export const useGetAndLoadFileList=()=>{
    const [files, setFileList]= useRecoilState(filelist);
    const [dirLevs, setFileListDirLevels]= useRecoilState(fileListDirLevels);
    const currDir=useRecoilValue(currFileListDir);

    const load= useMemoizedFn((dir=null)=>{
        (async()=>{
            const filelist=await (dir ? api.list(dir) : api.list());
            const dirs=await (dir ? api.getPathItems(dir) : api.getPathItems());
            setFileList(filelist);
            setFileListDirLevels(dirs);
        })();        
    });

    const reload=useMemoizedFn(()=>{
        (async()=>{
            const filelist=await (currDir ? api.list(currDir) : api.list());
            const dirs=await (currDir ? api.getPathItems(currDir) : api.getPathItems());
            setFileList(filelist);
            setFileListDirLevels(dirs);
        })();        
    });

    return [files, dirLevs, load, reload];
};

