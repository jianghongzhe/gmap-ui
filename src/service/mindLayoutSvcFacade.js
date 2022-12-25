import mindHLayoutSvc from './mindHLayoutSvc';
import mindDownLayoutSvc from './mindDownLayoutSvc';
import mindUpLayoutSvc from './mindUpLayoutSvc';


/**
 * 导图节点布局的门面业务类，用于以后扩展其它方式的布局，如垂直方式布局、异形布局等
 */
class MindLayoutFacade{
    /**
     * 计算节点布局位置并返回计算结果，不修改dom
     * @param {*} ndsSet 
     * @returns 
     */
    loadStyles=(ndsSet)=>{
        return getSvcInst(ndsSet).loadStyles(ndsSet);
    }
}


const getSvcInst=(ndsSet)=>{
    if(true===ndsSet?.tree?.down){
        return mindDownLayoutSvc;
    }
    if(true===ndsSet?.tree?.up){
        return mindUpLayoutSvc;
    }
    return mindHLayoutSvc;
};


export default new MindLayoutFacade();