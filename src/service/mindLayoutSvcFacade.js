import mindHLayoutSvc from './mindHLayoutSvc';


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
        // 其它方式布局，待开发

        // 默认使用水平布局
        return mindHLayoutSvc.loadStyles(ndsSet);
    }
}

export default new MindLayoutFacade();