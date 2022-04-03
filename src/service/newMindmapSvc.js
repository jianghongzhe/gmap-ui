import mindmapSvc from './mindmapSvc';

class NewMindmapSvc {
    /**
     * 判断是否所有节点都已展开
     */
    isAllNodeExpand = (ndsSet) => {
        return mindmapSvc.isNodeExpandRecursively(ndsSet.tree, ndsSet.expands);
    }

    /**
     * 判断所有节点中是否有展开状态变化的
     */
    isAnyNdExpStChanged=(ndsSet)=>{
        return mindmapSvc.isNdExpStChangedRecursively(ndsSet.tree, ndsSet.expands);
    }
 

    // {
    //     tree: {
    //         id:'root',
    //         str:'...',
    //         childs:[
    //             {
    //                 id:'sub',
    //                 str:'...',
    //                 childs:[...]
    //             }
    //         ]
    //     },
    //     list:[
    //         {id:'', str:'', childs:[...]},
    //         {id:'', str:'', childs:[...]},
    //         // ...
    //     ],
    //     map:{
    //         'id1': {id:'', str:'', childs:[...]},
    //         'id2': {id:'', str:'', childs:[...]},
    //         // ...
    //     },
    //     ndStyles:{
    //            'id1': {...},
    //            'id2': {...},
    //     },
    //     expBtnStyles:{
    //            'id1': {...},
    //            'id2': {...},
    //     },
    //     lineStyles:{
    //            'id1': {...},
    //            'id2': {...},
    //     },
    // }
    /**
     * 根据节点树结构加载其他信息
     */
    baseLoadNdsSet=(tree)=>{
        let ndsSet={
            //节点相关数据
            tree: tree,
            list: [],
            map: {},

            //dom操作需要的数据：元素占用空间大小
            rects:{},
            expBtnRects:{},

            //样式相关数据
            ndStyles:{},
            lineStyles:{},
            expBtnStyles:{},
            wrapperStyle:{},
            expands:{},
        };

        this.flatNds(ndsSet.tree, ndsSet.list, ndsSet.map, ndsSet.expands);
        return ndsSet;
    }



    expandAll=(ndsSet)=>{
        return mindmapSvc.expandNode(ndsSet.tree, ndsSet.expands);
    }

    restore=(ndsSet)=>{
        return mindmapSvc.restoreNode(ndsSet.tree, ndsSet.expands);
    }


    loadNdsSet=(treeRoot)=>{
        //如果是解析失败的信息，则直接返回
        if(treeRoot && false===treeRoot.succ){
            return treeRoot;
        }
        return this.baseLoadNdsSet(treeRoot);
    }

    

    flatNds = (nd, listContainer,mapContainer, expands) => {
        listContainer.push(nd);
        expands[nd.id]=nd.defExp;
        mapContainer[nd.id]=nd;
        if(nd.childs && 0<nd.childs.length/* && nd.expand*/){
            nd.childs.forEach(child => {
                this.flatNds(child,listContainer,mapContainer, expands);
            });
        }
    }
}

export default new NewMindmapSvc();