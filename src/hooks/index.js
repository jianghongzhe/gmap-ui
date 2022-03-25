import {useSetRecoilState} from 'recoil';
import {installPathValid} from '../store';
import {useMount} from 'ahooks';
import api from '../service/api';
import generalSvc from '../service/generalSvc';


/**
 * 初始化根组件的状态：
 * 1、路径合法性状态
 * 2、窗口标题
 * 3、查询对话框
 * 
 */
export const useInitRootComponent=()=>{
    const setPathValid=useSetRecoilState(installPathValid);
    useMount(()=>{
        (async ()=>{
            // 加载路径合法性
            const installPath=await api.getBasePath();
            const pathValid=(generalSvc.isPathValid(installPath) ? true : false);
            setPathValid(pathValid);
            if(!pathValid){
                setTimeout(() => {
                    api.showNotification('警告', '请不要安装到中文路径或带空格的路径下，否则可能造成某些功能异常', 'warn');    
                }, 500);
            }

            // 窗口标题
            let titleTxt=await api.loadAppNameAndVersionTxt();
            const vers=await api.getInnerModuleVersions();
            document.querySelector("head > title").innerHTML = `${titleTxt}　( powered by electron ${vers.electron}, node ${vers.node}, chrome ${vers.chrome}, v8 ${vers.v8} )`;

            // 查询对话框
            api.initFindInPageDlg();
        })();
    });
};
