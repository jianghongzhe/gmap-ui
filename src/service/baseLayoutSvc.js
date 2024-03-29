import globalStyleConfig from "../common/globalStyleConfig";

class BaseLayoutSvc{

    /**
     * 判断到指定节点的连接线是否需要提升zindex；
     * 如果指定节点是其所有兄弟节点中最后一个非默认颜色的节点，则需要提升zindex，否则不需要
     * @param nd 指定节点
     * @param parNd 指定节点的父节点
     */
    shouldPromoteLineZIndex= (nd, parNd)=>{
        // 取父节点到所有子节点的连接线颜色中，最后一个不是默认颜色的子节点，使该节点的连接线zIndex增加以突出显示颜色
        let promoteZIndexNd=null;
        parNd.childs.forEach(subNd=>{
            if(globalStyleConfig.defaultLineColor!==subNd.color){
                promoteZIndexNd=subNd;
            }
        });
        return (nd.id===promoteZIndexNd?.id);
    }
}

const inst=new BaseLayoutSvc();
export default inst;