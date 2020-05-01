import mindmapSvc from './mindmapSvc';

class NewMindmapSvc {
    /**
     * 判断是否所有节点都已展开
     */
    isAllNodeExpand = (ndsSet) => {
        // let root = this.getRootNodeByCells(cells);
        return mindmapSvc.isNodeExpandRecursively(ndsSet.tree);
    }

    /**
     * 判断所有节点中是否有展开状态变化的
     */
    isAnyNdExpStChanged=(ndsSet)=>{
        return mindmapSvc.isNdExpStChangedRecursively(ndsSet.tree);
    }

    /**
     * 获得节点和其所有子节点整个区域所占的高
     */
    getNdHeight = (nd,ndsSet) => {
        //无子节点或未展开，取本节点的高度
        if (!nd.childs || 0 === nd.childs.length || !nd.expand) {
            return parseInt(ndsSet.rects[nd.id].height);
        }

        //有子节点，取所有子节点的高度和，中间加上空白的距离
        let sumChildrenH = 0;
        nd.childs.forEach((child,ind) => {
            sumChildrenH +=(0<ind?nodePaddingTop:0)+ this.getNdHeight(child,ndsSet);//从第二个子节点开始，要加上空白的距离
        });
        return parseInt(Math.max(ndsSet.rects[nd.id].height, sumChildrenH));
    }


    /**
     * 对根节点的子树进行左右方向的计算，并返回左右子树的高度
     */
    setNdDirection = (ndsSet) => {
        //先假设所有节点都在右边
        let leftH = 0;
        let rightH = 0;

        //如果根节点未展开，则不再继续计算
        if(!ndsSet.tree.childs || 0===ndsSet.tree.childs.length || !ndsSet.tree.expand){
            return [leftH, rightH];
        }

        let sumNdCnt=0;
        ndsSet.tree.childs.forEach((child,ind) => {
            child.left = false;//default right
            rightH +=(0<ind?nodePaddingTop:0)+ this.getNdHeight(child,ndsSet);
            ++sumNdCnt;
        });
        let dist = rightH;

        //依次计算如果把节点放到左侧，是否两边高度差比之前小，如果是就移动，否则结束
        let end = false;
        let leftNdCnt=0;
        ndsSet.tree.childs.forEach(child => {
            if (end) {
                return;
            }
            let h = this.getNdHeight(child,ndsSet);
            let newLeftH = leftH +(0<leftH?nodePaddingTop:0)+ h;//
            let newRightH = rightH - h- (1<sumNdCnt-leftNdCnt?nodePaddingTop:0);
            let newDist = Math.abs(newRightH - newLeftH);

            if (newDist < dist) {
                child.left = true;
                leftH = newLeftH;
                rightH = newRightH;
                dist = newDist;
                ++leftNdCnt;
                return;
            }
            end = true;
        });

        return [leftH, rightH];
    }

    /**
     * 放置折叠按钮的位置
     */
    putExpBtn=(ndsSet, nd, l, t, left=false)=>{
        if(!nd.childs || 0===nd.childs.length){return;}

        ndsSet.expBtnStyles[nd.id]={
            left:parseInt(l+ndsSet.rects[nd.id].width), //先假设横向位置在节点右侧
            top:parseInt(t+ndsSet.rects[nd.id].height-ndsSet.expBtnRects[nd.id].height+4),
        };
        //如果横向位置在左，侧重新设置
        if(left){
            ndsSet.expBtnStyles[nd.id].left=parseInt(l-ndsSet.expBtnRects[nd.id].width);
        }
        //如果是根节点和二级节点，则纵向位置不同，且在展开/折叠状态时纵向位置也不同
        if(0===nd.lev || 1===nd.lev){
            if(nd.expand){
                ndsSet.expBtnStyles[nd.id].top=parseInt(t+ndsSet.rects[nd.id].height/2-ndsSet.expBtnRects[nd.id].height+4);
            }else{
                ndsSet.expBtnStyles[nd.id].top=parseInt(t+ndsSet.rects[nd.id].height/2-(ndsSet.expBtnRects[nd.id].height/1.5)+4);
            }
            
        }
    }

    putNds = (ndsSet) => {
        let [leftH, rightH] = this.setNdDirection(ndsSet);
        let currLeftTop = (leftH < rightH ? parseInt((rightH - leftH) / 2) : 0);
        let currRightTop = (rightH < leftH ? parseInt((leftH - rightH) / 2) : 0);
        

        //根节点位置：x假设为500，y为在左右两边子树中高的一侧居中的位置
        let rootLoc = [500, parseInt((Math.max(leftH, rightH)-ndsSet.rects[ndsSet.tree.id].height) / 2)];
        

        ndsSet.ndStyles[ndsSet.tree.id] = {
            left: rootLoc[0],
            top: rootLoc[1],
        }
        
        
        this.putExpBtn(ndsSet,ndsSet.tree,rootLoc[0],rootLoc[1],false);
        


        //expBtnStyles
        //expBtnRects

        if(ndsSet.tree.expand){
            //依次摆放每个节点的位置
            //左
            ndsSet.tree.childs.filter(nd => nd.left).forEach(nd => {
                let allHeight = this.getNdHeight(nd,ndsSet);
                let l = parseInt(rootLoc[0] - ndXDist*3/2 -ndsSet.rects[nd.id].width);//根节点x - 空隙 - 节点本身宽度
                let t = parseInt(currLeftTop + (allHeight - ndsSet.rects[nd.id].height) / 2);
                ndsSet.ndStyles[nd.id] = { left: l, top: t }
                this.putExpBtn(ndsSet,nd,l,t,true);
                this.putSubNds(currLeftTop, l - ndXDist, nd, ndsSet, true);
                currLeftTop += allHeight+nodePaddingTop;//
            });

            //右
            ndsSet.tree.childs.filter(nd => !nd.left).forEach(nd => {
                let allHeight = this.getNdHeight(nd,ndsSet);
                let l = parseInt(rootLoc[0] +ndsSet.rects[ndsSet.tree.id].width + ndXDist*3/2);//根节点x + 根节点宽 + 空隙
                let t = parseInt(currRightTop + (allHeight - ndsSet.rects[nd.id].height) / 2);
                ndsSet.ndStyles[nd.id] = { left: l, top: t, }
                this.putExpBtn(ndsSet,nd,l,t,false);
                this.putSubNds(currRightTop, l + ndsSet.rects[nd.id].width + ndXDist, nd, ndsSet, false);
                currRightTop += allHeight+nodePaddingTop;//
            });
        }

        
        

        return this.calcOptNdPos(ndsSet);
    }

    



    /**
     * @param {*} startL 当向右排序时，表示要放置的左侧位置，向左排列时，表示放置节点的右边位置
     */
    putSubNds = (startT, startL, parNd, ndsSet, left = false) => {
        if(!parNd.expand){return;}

        parNd.childs.forEach(nd => {
            //往右排
            if (!left) {
                let allHeight = this.getNdHeight(nd,ndsSet);
                let t = parseInt(startT + (allHeight -ndsSet.rects[nd.id].height) / 2);

                ndsSet.ndStyles[nd.id] = {
                    left: startL,
                    top: t,
                };
                this.putExpBtn(ndsSet,nd,startL,t,left);
                this.putSubNds(startT, startL + ndsSet.rects[nd.id].width + ndXDist, nd, ndsSet, left);//右边节点的位置是当前节点
                startT += allHeight+nodePaddingTop;
                return;
            }

            //往左排
            let allHeight = this.getNdHeight(nd,ndsSet);
            let t = parseInt(startT + (allHeight - ndsSet.rects[nd.id].height) / 2);
            let l = startL - ndsSet.rects[nd.id].width;
            ndsSet.ndStyles[nd.id] = {
                left: l,
                top: t,
            };
            this.putExpBtn(ndsSet,nd,l,t,left);
            this.putSubNds(startT, l - ndXDist, nd, ndsSet, left);
            startT += allHeight+nodePaddingTop;
            return;
        });
    }

    /**
     * 计算合适的节点位置与画布大小
     */
    calcOptNdPos = (ndsSet) => {
        //计算最小位置与最大位置
        let minX = 9999999;
        let minY = 9999999;
        let maxX = 0;
        let maxY = 0;
        for (let key in ndsSet.ndStyles) {
            let l = ndsSet.ndStyles[key].left;
            let t = ndsSet.ndStyles[key].top;
            let r = l + ndsSet.rects[key].width;
            let b = t + ndsSet.rects[key].height;

            if (l < minX) {
                minX = l;
            }
            if (t < minY) {
                minY = t;
            }
            if (r > maxX) {
                maxX = r;
            }
            if (b > maxY) {
                maxY = b;
            }
        }

        //图表容器的大小，里面包括空白
        let requireW = (maxX - minX) + graphPadding * 2;
        let requireH = (maxY - minY) + graphPadding * 2;

        let xAdjust = graphPadding - minX;
        let yAdjust = graphPadding - minY;
        let moreXAdjust=0;

        //如果容器大小还不到整个区域的大小-10,则增加到该值，同时x坐标也增加以保证在容器里居中
        if(requireW<containerMinW){
            moreXAdjust=(containerMinW-requireW)/2;
            requireW=containerMinW;
        }
        if(requireH<containerMinH){
            requireH=containerMinH;
        }




        for (let key in ndsSet.ndStyles) {
            ndsSet.ndStyles[key].left += xAdjust+moreXAdjust;
            ndsSet.ndStyles[key].top += yAdjust;
        }
        for (let key in ndsSet.expBtnStyles) {
            ndsSet.expBtnStyles[key].left += xAdjust+moreXAdjust;
            ndsSet.expBtnStyles[key].top += yAdjust;
        }

        return [requireW, requireH];
    }



    /**
     * 设置节点之间的连接线
     * @param {*} fromNd 父节点
     * @param {*} toNd   子节点
     * @param {*} ndStyles
     * @param {*} color
     */
    setLineStyle = (ndsSet, fromNd, toNd) => {
        if (!ndsSet.ndStyles[fromNd.id] || !ndsSet.ndStyles[toNd.id]) {
            return {};
        }
        let color=toNd.color;// fromNd.color;

        //rect只用于获取宽高
        let r1 = getRelaRect(ndsSet.rects[fromNd.id]);
        let r2 = getRelaRect(ndsSet.rects[toNd.id]);

        //其他四个位置需要进行样式计算
        r1.left = ndsSet.ndStyles[fromNd.id].left;
        r1.top = ndsSet.ndStyles[fromNd.id].top;
        r1.right = r1.left + r1.width;
        r1.bottom = r1.top + r1.height;

        r2.left = ndsSet.ndStyles[toNd.id].left;
        r2.top = ndsSet.ndStyles[toNd.id].top;
        r2.right = r2.left + r2.width;
        r2.bottom = r2.top + r2.height;

        //根节点->二级节点，连接线的纵向位置应该是中间->中间
        if(0===fromNd.lev){
            r1.height=parseInt(r1.height/2);//+(nodePaddingTop/2);
            r1.bottom=r1.top+r1.height;

            r2.height=parseInt(r2.height/2);//+(nodePaddingTop/2);
            r2.bottom=r2.top+r2.height;
        }
        //二级节点->三级节点，连接线的纵向位置应该是中间->下边
        if(1===fromNd.lev){
            r1.height=parseInt(r1.height/2);//+(nodePaddingTop/2);
            r1.bottom=r1.top+r1.height;
        }


        //左边r1 右边r2
        let reverseW = false;
        if (r1.left > r2.left) {
            let t = null;
            t = r1;
            r1 = r2;
            r2 = t;
            reverseW = true;//子节点在父节点左边
        }

        let w = r2.left - r1.right;
        let t1 = r1.bottom - lineWid;
        let t2 = r2.bottom - lineWid;

        let line = {};
        let lineFrom = {};
        let lineTo = {};
        let lineExp={};

        //连接线起始与末尾高度一样，不需要其中的两个div
        if (t1 === t2) {
            line = {
                width: w,
                left: r1.right,
                height: lineWid,
                top: t1,
                borderBottom: `${lineWid}px solid ${color}`,
            };

            let result = {};
            result[toNd.id] = { line, lineFrom, lineTo };
            return result;
        }


        //高度不一致，但容器矩形位置可以确定
        line = {
            width: w,
            left: r1.right,
            top: Math.min(t1, t2),
            height: Math.abs(t1 - t2) + lineWid,
        };



        //左下右上
        if (t1 > t2) {
            let result = {};
            this.setLinePartsStyle(line.width, line.height, lineFrom, lineTo,lineExp, color, false, reverseW);
            result[toNd.id] = { line, lineFrom, lineTo, lineExp };
            // console.log(result);
            return result;
        }

        //左上右下
        if (t1 < t2) {
            let result = {};
            this.setLinePartsStyle(line.width, line.height, lineFrom, lineTo,lineExp, color, true, reverseW);
            result[toNd.id] = { line, lineFrom, lineTo, lineExp };
            // console.log(result);
            return result;
        }

        return {};
    };

    /**
     * 设置节点间连接的里面三个div的具体样式
     * 1、起始部分
     * 2、结束部分
     * 3、留给折叠按钮的部分
     */
    setLinePartsStyle = (w, h, lineFrom, lineTo,lineExp, color, reverseV = false, reverseW = false) => {
        //两个div水平与垂直高度
        let toW = parseInt((w-lineExpDist) * (reverseW ? fromXRatio : 1 - fromXRatio));
        let fromW = (w-lineExpDist) - toW + lineWid;//水平位置要重叠一部分（即连接的宽度）   
        let toH = parseInt(h * (reverseW ? fromYRatio : 1 - fromYRatio));
        let fromH = h - toH;

        let hasTrivialH=false;
        if(0===toH){
            toH+=lineWid;
            fromH-=lineWid;
            hasTrivialH=true;
        }
        if(0===fromH){
            fromH+=lineWid;
            toH-=lineWid;
            hasTrivialH=true;
        }

        // if(2===h){
        //     console.log("到这个节点了",w,h,fromW,toW,fromH,toH);
            

        // }

        //左下右上的顺序
        if (!reverseV) {
            lineFrom.top = toH + "px";
            lineFrom.left=lineExpDist+"px";
            lineFrom.width = fromW + "px";
            lineFrom.height = fromH + "px";
            if(!hasTrivialH){
                lineFrom.borderBottomRightRadius = `${fromW}px ${fromH}px`;
                lineFrom.borderRight = `${lineWid}px solid ${color}`;
            }
            lineFrom.borderBottom = `${lineWid}px solid ${color}`;
            

            lineTo.left = (lineExpDist+fromW - lineWid) + "px";
            lineTo.width = toW + "px";
            lineTo.height = toH + "px";
            if(!hasTrivialH){
                lineTo.borderTopLeftRadius = `${toW}px ${toH}px`;
                lineTo.borderLeft = `${lineWid}px solid ${color}`;
            }
            lineTo.borderTop = `${lineWid}px solid ${color}`;
            

            //左父右子
            if(!reverseW){
                lineFrom.left=lineExpDist+"px";
                lineTo.left = (lineExpDist+fromW - lineWid) + "px";

                lineExp.top = (h-lineWid) + "px";
                lineExp.left = 0 + "px";
                lineExp.height = lineWid + "px";
                lineExp.width=lineExpDist;
                lineExp.borderBottom= `${lineWid}px solid ${color}`;
            }
            //左子右父
            else{
                lineFrom.left="0px";
                lineTo.left = (fromW - lineWid) + "px";

                lineExp.top = 0 + "px";
                lineExp.left = (w-lineExpDist) + "px";
                lineExp.height = lineWid + "px";
                lineExp.width=lineExpDist;
                lineExp.borderBottom= `${lineWid}px solid ${color}`;
            }


            return;
        }

        //左上右下的顺序
        lineFrom.width = fromW + "px";
        lineFrom.height = fromH + "px";
        if(!hasTrivialH){
            lineFrom.borderTopRightRadius = `${fromW}px ${fromH}px`;
            lineFrom.borderRight = `${lineWid}px solid ${color}`;
        }
        lineFrom.borderTop = `${lineWid}px solid ${color}`;
        

        lineTo.left = (fromW - lineWid) + "px";
        lineTo.top = fromH + "px";
        lineTo.width = toW + "px";
        lineTo.height = toH + "px";
        if(!hasTrivialH){
            lineTo.borderBottomLeftRadius = `${toW}px ${toH}px`;
            lineTo.borderLeft = `${lineWid}px solid ${color}`;
        }
        lineTo.borderBottom = `${lineWid}px solid ${color}`;
        

        //左父右子
        if(!reverseW){
            lineFrom.left=lineExpDist+"px";
            lineTo.left = (lineExpDist+fromW - lineWid) + "px";

            lineExp.top = 0 + "px";
            lineExp.left = 0 + "px";
            lineExp.height = lineWid + "px";
            lineExp.width=lineExpDist;
            lineExp.borderBottom= `${lineWid}px solid ${color}`;
        }
        //左子右父
        else{
            lineFrom.left=0+"px";
            lineTo.left = (fromW - lineWid) + "px";

            lineExp.top = (h-lineWid) + "px";
            lineExp.left = (w-lineExpDist) + "px";
            lineExp.height = lineWid + "px";
            lineExp.width=lineExpDist;
            lineExp.borderBottom= `${lineWid}px solid ${color}`;      
        }
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
        };

        this.flatNds(ndsSet.tree, ndsSet.list, ndsSet.map);
        return ndsSet;
    }



    expandAll=(ndsSet)=>{
        mindmapSvc.expandNode(ndsSet.tree);
        return this.baseLoadNdsSet(ndsSet.tree);
    }

    restore=(ndsSet)=>{
        mindmapSvc.restoreNode(ndsSet.tree);
        return this.baseLoadNdsSet(ndsSet.tree);
    }

    toggleExp=(ndsSet, nd)=>{
        nd.expand=!nd.expand;
        return this.baseLoadNdsSet(ndsSet.tree);
    }


    loadNdsSet=(treeRoot)=>{
        //如果是解析失败的信息，则直接返回
        if(treeRoot && false===treeRoot.succ){
            return treeRoot;
        }
        return this.baseLoadNdsSet(treeRoot);
    }

    



    flatNds = (nd, listContainer,mapContainer) => {
        listContainer.push(nd);
        mapContainer[nd.id]=nd;
        if(nd.childs && 0<nd.childs.length && nd.expand){
            nd.childs.forEach(child => {
                this.flatNds(child,listContainer,mapContainer);
            });
        }
    }


    /**
     * 加载样式信息：需要在第一次渲染之后再调用，否则dom还没生成
     * @param {*} ndsSet
     */
    loadStyles=(ndsSet)=>{
        if(!ndsSet){return;}

        //加载节点和折叠按钮所占区域大小
        ndsSet.list.forEach(nd=>{
            ndsSet.rects[nd.id]=document.querySelector(`#${nd.id}`).getBoundingClientRect();
            if(nd.childs && 0<nd.childs.length){
                ndsSet.expBtnRects[nd.id]=document.querySelector(`#expbtn_${nd.id}`).getBoundingClientRect();
            }
        });

        //节点位置与画布大小计算
        let [w,h]=this.putNds(ndsSet);
        ndsSet.wrapperStyle={
            width:w,
            height:h,
        };

        //连线位置计算
        let newLineStyles={};
        ndsSet.list.forEach(nd=>{
            if(!nd.parid){return;}
            let result=this.setLineStyle(ndsSet,nd.par,nd);
            newLineStyles={...newLineStyles, ...result};
        });
        ndsSet.lineStyles=newLineStyles;
        
    }
}


const getRelaRect = (rect, refRect = null) => {
    if (null === refRect) {
        return {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
        };
    }

    return {
        left: rect.left - refRect.left,
        top: rect.top - refRect.top,
        right: rect.right - refRect.left,
        bottom: rect.bottom - refRect.top,
        width: rect.width,
        height: rect.height,
    };
}




//常量值
const nodePaddingTop=10;    //节点垂直方向的间距
const containerMinW=800;    //导图容器最小宽
const containerMinH=600;    //导图容器最小高
const lineWid = 1;          //连接线宽度，与节点的下边框宽度一致
const ndXDist = 40;         //父子节点之间水平距离
const lineExpDist=16;       //父子节点水平距离中的留给折叠按钮的距离
const fromXRatio = 0.3;     //起始弧线水平占比
const fromYRatio = 0.3;     //终止弧线水平占比
const graphPadding = 40;    //图表内容与容器边缘之间的距离

export default new NewMindmapSvc();