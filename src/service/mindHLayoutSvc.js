import globalStyleConfig from '../common/globalStyleConfig';
import baseLayoutSvc from './baseLayoutSvc';



class MindHLayoutSvc {

    /**
     * 加载样式信息：需要在第一次渲染之后再调用，否则dom还没生成
     * @param {*} ndsSet
     */
    loadStyles=(ndsSet)=>{
        if(!ndsSet){return;}

        let result={
            rects:{},
            expBtnRects:{},
            directions:{},
            ndStyles:{},
            expBtnStyles:{},
            wrapperStyle:{},
            lineStyles:{},
        };

        //加载节点和折叠按钮所占区域大小
        ndsSet.list.forEach(nd=>{
            result.rects[nd.id]=document.querySelector(`#${nd.id}`).getBoundingClientRect();
            if(nd.childs && 0<nd.childs.length){
                result.expBtnRects[nd.id]=document.querySelector(`#expbtn_${nd.id}`).getBoundingClientRect();
            }
        });

        //节点位置与画布大小计算
        let [w,h]=this.putNds(ndsSet, result);
        result.wrapperStyle={
            width:w,
            height:h,
        };

        //连线位置计算
        let newLineStyles={};
        ndsSet.list.forEach(nd=>{
            if(!nd.parid){return;}
            let styleResult=this.setLineStyle(ndsSet,nd.par,nd,result);
            newLineStyles={...newLineStyles, ...styleResult};
        });
        result.lineStyles=newLineStyles;
        //console.log("hlayout lineStyles", result.lineStyles)
        return result;
    }

    /**
     * 获得节点子树的高度，如果无子树或未展开，则返回0
     * @param nd
     * @param ndsSet
     * @param resultWrapper
     * @returns {number}
     */
    getSubTreeHeight=(nd,ndsSet, resultWrapper)=>{
        if (!nd.childs || 0 === nd.childs.length || !ndsSet.expands[nd.id]) {
            return 0;
        }
        let sumChildrenH = 0;
        nd.childs.forEach((child,ind) => {
            sumChildrenH +=(0<ind?globalStyleConfig.hlayout.nodePaddingTop:0)+ this.getNdHeight(child,ndsSet,resultWrapper);//从第二个子节点开始，要加上空白的距离
        });
        return sumChildrenH;
    }

    /**
     * 获得节点和其所有子节点整个区域所占的高
     */
    getNdHeight = (nd,ndsSet, resultWrapper) => {
        

        //无子节点或未展开，取本节点的高度
        if (!nd.childs || 0 === nd.childs.length || !ndsSet.expands[nd.id]) {
            return parseInt(resultWrapper.rects[nd.id].height);
        }

        //有子节点，取所有子节点的高度和，中间加上空白的距离
        let sumChildrenH = 0;
        nd.childs.forEach((child,ind) => {
            sumChildrenH +=(0<ind?globalStyleConfig.hlayout.nodePaddingTop:0)+ this.getNdHeight(child,ndsSet,resultWrapper);//从第二个子节点开始，要加上空白的距离
        });
        return parseInt(Math.max(resultWrapper.rects[nd.id].height, sumChildrenH));
    }


    /**
     * 对根节点的子树进行左右方向的计算，并返回左右子树的高度
     */
    setNdDirection = (ndsSet, resultWrapper) => {
        //先假设所有节点都在右边
        let leftH = 0;
        let rightH = 0;

        //如果根节点未展开，则不再继续计算
        if(!ndsSet.tree.childs || 0===ndsSet.tree.childs.length || !ndsSet.expands[ndsSet.tree.id]){
            return [leftH, rightH];
        }

        let sumNdCnt=0;
        ndsSet.tree.childs.forEach((child,ind) => {
            //child.left = false;//default right
            resultWrapper.directions[child.id]=false;
            rightH +=(0<ind?globalStyleConfig.hlayout.nodePaddingTop:0)+ this.getNdHeight(child, ndsSet, resultWrapper);
            ++sumNdCnt;
        });
        let dist = rightH;


        //如果设置了强制所有节点都在右侧，则直接返回
        if(ndsSet.tree.forceRight){
            return [leftH, rightH];
        }

        // 如果根节点只有一个子节点，则直接返回
        if(1===ndsSet.tree.childs.length){
            return [leftH, rightH];
        }
            
        // 从最后一个节点开始，依次计算如果把节点放到左侧，是否两边高度差比之前小，如果是就移动，否则结束
        let end = false;
        let leftNdCnt=0;
        [...ndsSet.tree.childs].reverse().forEach(child => {
            if (end) {
                return;
            }
            let h = this.getNdHeight(child,ndsSet, resultWrapper);
            let newLeftH = leftH +(0<leftH?globalStyleConfig.hlayout.nodePaddingTop:0)+ h;//
            let newRightH = rightH - h- (1<sumNdCnt-leftNdCnt?globalStyleConfig.hlayout.nodePaddingTop:0);
            let newDist = Math.abs(newRightH - newLeftH);

            if (newDist < dist) {
                //child.left = true;
                resultWrapper.directions[child.id]=true;
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
    putExpBtn=(ndsSet, nd, l, t, left=false, resultWrapper=null)=>{
        if(!nd.childs || 0===nd.childs.length){return;}

        resultWrapper.expBtnStyles[nd.id]={
            left:parseInt(l+resultWrapper.rects[nd.id].width), //先假设横向位置在节点右侧
            top:parseInt(t+resultWrapper.rects[nd.id].height-resultWrapper.expBtnRects[nd.id].height+4),
        };
        //如果横向位置在左，侧重新设置
        if(left){
            resultWrapper.expBtnStyles[nd.id].left=parseInt(l-resultWrapper.expBtnRects[nd.id].width);
        }
        //如果是根节点和二级节点，则纵向位置不同，且在展开/折叠状态时纵向位置也不同
        if(0===nd.lev || 1===nd.lev){
            if(ndsSet.expands[nd.id]){
                resultWrapper.expBtnStyles[nd.id].top=parseInt(t+resultWrapper.rects[nd.id].height/2-resultWrapper.expBtnRects[nd.id].height+4);
            }else{
                resultWrapper.expBtnStyles[nd.id].top=parseInt(t+resultWrapper.rects[nd.id].height/2-(resultWrapper.expBtnRects[nd.id].height/1.5)+4);
            }
        
        }

        // 在之前基础上，对于三级以上（>=2）节点，且是折叠的时候，高度减去5
        if(nd.lev>=2 && !ndsSet.expands[nd.id]){
            resultWrapper.expBtnStyles[nd.id].top-=5;
        }
    }




    /**
     * 摆放根节点的左右子树
     * @param {*} ndsSet 
     * @param {*} resultWrapper 
     * @returns 
     */
    putNds = (ndsSet, resultWrapper) => {
        let [leftH, rightH] = this.setNdDirection(ndsSet, resultWrapper);

        // 计算根节点与其子节点间的水平距离
        const xDist =this.calcXDist(ndsSet.tree, ndsSet, resultWrapper, [leftH, rightH]);

        let currLeftTop = (leftH < rightH ? parseInt((rightH - leftH) / 2) : 0);
        let currRightTop = (rightH < leftH ? parseInt((leftH - rightH) / 2) : 0);
        

        //根节点位置：x假设为500，y为在左右两边子树中高的一侧居中的位置
        let rootLoc = [500, parseInt((Math.max(leftH, rightH)-resultWrapper.rects[ndsSet.tree.id].height) / 2)];
        

        resultWrapper.ndStyles[ndsSet.tree.id] = {
            left: rootLoc[0],
            top: rootLoc[1],
        }
        
        
        this.putExpBtn(ndsSet,ndsSet.tree,rootLoc[0],rootLoc[1],false, resultWrapper);
        

        if(ndsSet.expands[ndsSet.tree.id]){
            //左
            ndsSet.tree.childs.filter(nd =>resultWrapper.directions[nd.id]).forEach(nd => {
                // 设置根节点的子节点的位置，并递归设置再下层节点的位置
                let allHeight = this.getNdHeight(nd,ndsSet,resultWrapper);
                let l = parseInt(rootLoc[0] - xDist -resultWrapper.rects[nd.id].width);//根节点x - 空隙 - 节点本身宽度
                let t = parseInt(currLeftTop + (allHeight - resultWrapper.rects[nd.id].height) / 2);
                resultWrapper.ndStyles[nd.id] = { left: l, top: t }
                this.putExpBtn(ndsSet,nd,l,t,true, resultWrapper);

                const subXDist =this.calcXDist(nd, ndsSet, resultWrapper);
                this.putSubNds(currLeftTop, l - subXDist, nd, ndsSet, true, resultWrapper);
                currLeftTop += allHeight+globalStyleConfig.hlayout.nodePaddingTop;//
            });

            //右
            ndsSet.tree.childs.filter(nd => !resultWrapper.directions[nd.id]).forEach(nd => {
                // 设置根节点的子节点的位置，并递归设置再下层节点的位置
                let allHeight = this.getNdHeight(nd,ndsSet,resultWrapper);
                let l = parseInt(rootLoc[0] +resultWrapper.rects[ndsSet.tree.id].width + xDist);//根节点x + 根节点宽 + 空隙
                let t = parseInt(currRightTop + (allHeight - resultWrapper.rects[nd.id].height) / 2);
                resultWrapper.ndStyles[nd.id] = { left: l, top: t, }
                this.putExpBtn(ndsSet,nd,l,t,false, resultWrapper);

                const subXDist = this.calcXDist(nd, ndsSet, resultWrapper);
                this.putSubNds(currRightTop, l + resultWrapper.rects[nd.id].width + subXDist, nd, ndsSet, false, resultWrapper);
                currRightTop += allHeight+globalStyleConfig.hlayout.nodePaddingTop;//
            });
        }

        return this.calcOptNdPos(ndsSet, resultWrapper);
    }

    




    /**
     * 计算指定节点与其子节点间的水平距离
     *
     *              /|   -> 子节点位置          ---
     *             / |                         ^
     *            / x|   -> x为夹角的大小        |
     *           /   |                         |
     *          /    |                         |  h - 垂直高度
     *         /     |                         |
     *        /      |                         |
     *       /       |                         v
     *      /________|                        ---
     *      ^        ^
     *    父节点   角度垂直
     *
     * 由上图可知，父子节点的水平距离为：h*tan(x*PI/180)，其中x单位为度
     * 把公式计算结果与指定的最小值比较后取较大者，即为最终结果
     *
     * @param nd 指定节点
     * @param ndsSet 节点对象集合
     * @param resultWrapper 节点相关参数
     * @param rootLeftRightH [根节点左子树高， 右子树高] 只有根节点时才需要传入
     */
    calcXDist=(nd, ndsSet, resultWrapper, rootLeftRightH=null)=>{
        // 节点未展开或没有子节点，返回0
        if(!ndsSet.expands[nd.id]){return 0;}
        if(!nd.childs || 0===nd.childs.length){return 0;}
        let hDist=0;

        // 如果是根节点到子节点，则分别计算左子树的第一个节点与最后一个节点和右子树的第一个节点与最后一个节点中最大的高度差；
        // 然后根据公式计算得到水平距离并与指定最小值取较大者
        if(0===nd.lev){
            const [leftH, rightH]=rootLeftRightH;

            if(leftH>0){
                const leftNds = nd.childs.filter(subNd=>resultWrapper.directions[subNd.id]);
                let fromY=parseInt(leftH/2);
                let tmpHDist=this.getVDist(leftH, fromY, leftNds[0], ndsSet, resultWrapper, true);
                hDist=Math.max(tmpHDist, hDist);
                tmpHDist=this.getVDist(leftH, fromY, leftNds[leftNds.length-1], ndsSet, resultWrapper, false);
                hDist=Math.max(tmpHDist, hDist);
            }
            if(rightH>0){
                const rightNds = nd.childs.filter(subNd=>!resultWrapper.directions[subNd.id]);
                let fromY=parseInt(rightH/2);
                let tmpHDist=this.getVDist(rightH, fromY, rightNds[0], ndsSet, resultWrapper, true);
                hDist=Math.max(tmpHDist, hDist);
                tmpHDist=this.getVDist(rightH, fromY, rightNds[rightNds.length-1], ndsSet, resultWrapper, false);
                hDist=Math.max(tmpHDist, hDist);
            }

            const calcXDist=parseInt(hDist*Math.tan(globalStyleConfig.hlayout.dynDdXDistAngleDegree*Math.PI/180));
            return parseInt(Math.max(globalStyleConfig.hlayout.ndXDistRoot, calcXDist));
        }


        // 二级或以下节点到子节点的情况
        const allHeight =this.getSubTreeHeight(nd, ndsSet, resultWrapper);

        // 起始纵坐标位置：
        // 如果为根节点或二级节点到其子节点的连接线，起始位置为节点中间；否则，起始位置为节点底部
        let fromY=parseInt(allHeight/2);
        if(nd.lev>=2){
            fromY+=parseInt(resultWrapper.rects[nd.id].height/2);
        }

        // 以第一个子节点和最后一个子节点为代表计算与起始位置的高度差，取较大者
        // 第一个子节点，位置从头算
        // 最后一个子节点，位置从末尾高度减去空白开始算
        let tmpHDist=this.getVDist(allHeight, fromY, nd.childs[0], ndsSet, resultWrapper, true);
        hDist=Math.max(tmpHDist, hDist);
        tmpHDist=this.getVDist(allHeight, fromY, nd.childs[nd.childs.length-1], ndsSet, resultWrapper, false);
        hDist=Math.max(tmpHDist, hDist);

        // 取按夹角计算的水平距离与指定最小距离中的较大者
        const calcXDist=parseInt(hDist*Math.tan(globalStyleConfig.hlayout.dynDdXDistAngleDegree*Math.PI/180));
        return parseInt(Math.max(globalStyleConfig.hlayout.ndXDist, calcXDist));
    }

    /**
     *
     * @param allHeight
     * @param fromY
     * @param subNd
     * @param ndsSet
     * @param resultWrapper
     * @param topDown true-从上向下算，false-从下向上
     * @returns {number}
     */
    getVDist=( allHeight, fromY, subNd, ndsSet, resultWrapper, topDown=true)=>{
        let subAllHeight= this.getNdHeight(subNd, ndsSet, resultWrapper);
        let subSelfHeight= resultWrapper.rects[subNd.id].height;
        let toY= (subAllHeight-subSelfHeight)/2+(0===subNd.par.lev ? subSelfHeight/2 : subSelfHeight);
        if(!topDown){
            toY= allHeight-(subAllHeight-subSelfHeight)/2-subSelfHeight+(0===subNd.par.lev ? subSelfHeight/2 : subSelfHeight);
        }
        let tmpHDist=parseInt(Math.abs(toY-fromY));
        return tmpHDist;
    }




    /**
     * @param {*} startL 当向右排序时，表示要放置的左侧位置，向左排列时，表示放置节点的右边位置
     */
    putSubNds = (startT, startL, parNd, ndsSet, left = false, resultWrapper=null) => {
        if(!ndsSet.expands[parNd.id]){return;}

        // 子节点y坐标起始位置校正
        // 如果子节点高度之和小于父节点本身高度，则起始位置增加两者差值的一半
        const parHeight= parseInt(resultWrapper.rects[parNd.id].height);
        let childAllHeight=0;
        parNd.childs.forEach((nd, childInd) => {
            childAllHeight+=this.getNdHeight(nd,ndsSet,resultWrapper)+(0<childInd ? globalStyleConfig.hlayout.nodePaddingTop : 0);
        });
        if(childAllHeight<parHeight){
            startT=parseInt(startT+(parHeight-childAllHeight)/2);
        }



        parNd.childs.forEach(nd => {
            // 子节点与下级节点间的水平距离
            const xDist= this.calcXDist(nd, ndsSet, resultWrapper);

            //往右排
            if (!left) {
                let allHeight = this.getNdHeight(nd,ndsSet,resultWrapper);
                let t = parseInt(startT + (allHeight -resultWrapper.rects[nd.id].height) / 2);

                resultWrapper.ndStyles[nd.id] = {
                    left: startL,
                    top: t,
                };

                this.putExpBtn(ndsSet,nd,startL,t,left, resultWrapper);
                this.putSubNds(startT, startL + resultWrapper.rects[nd.id].width + xDist, nd, ndsSet, left, resultWrapper);//右边节点的位置是当前节点
                startT += allHeight+globalStyleConfig.hlayout.nodePaddingTop;
                return;
            }

            //往左排
            let allHeight = this.getNdHeight(nd,ndsSet,resultWrapper);
            let t = parseInt(startT + (allHeight - resultWrapper.rects[nd.id].height) / 2);
            let l = startL - resultWrapper.rects[nd.id].width;
            resultWrapper.ndStyles[nd.id] = {
                left: l,
                top: t,
            };
            this.putExpBtn(ndsSet,nd,l,t,left, resultWrapper);
            this.putSubNds(startT, l - xDist, nd, ndsSet, left, resultWrapper);
            startT += allHeight+globalStyleConfig.hlayout.nodePaddingTop;
            return;
        });
    }

    /**
     * 计算合适的节点位置与画布大小
     */
    calcOptNdPos = (ndsSet, resultWrapper) => {
        //计算最小位置与最大位置
        let minX = 9999999;
        let minY = 9999999;
        let maxX = 0;
        let maxY = 0;
       
        for (let key in resultWrapper.ndStyles) {
            let l = resultWrapper.ndStyles[key].left;
            let t = resultWrapper.ndStyles[key].top;
            let r = l + resultWrapper.rects[key].width;
            let b = t + resultWrapper.rects[key].height;

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




        for (let key in resultWrapper.ndStyles) {
            resultWrapper.ndStyles[key].left += xAdjust+moreXAdjust;
            resultWrapper.ndStyles[key].top += yAdjust;
        }
        for (let key in resultWrapper.expBtnStyles) {
            resultWrapper.expBtnStyles[key].left += xAdjust+moreXAdjust;
            resultWrapper.expBtnStyles[key].top += yAdjust;
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
    setLineStyle = (ndsSet, fromNd, toNd, resultWrapper) => {
        if (!resultWrapper || !resultWrapper.ndStyles[fromNd.id] || !resultWrapper.ndStyles[toNd.id]) {
            return {};
        }
        let color=toNd.color;// fromNd.color;

        // 取父节点到所有子节点的连接线颜色中，最后一个不是默认颜色的子节点，使该节点的连接线zIndex增加以突出显示颜色
        const shouldPromoteZIndex=baseLayoutSvc.shouldPromoteLineZIndex(toNd,fromNd);



        //rect只用于获取宽高
        let r1 = getRelaRect(resultWrapper.rects[fromNd.id]);
        let r2 = getRelaRect(resultWrapper.rects[toNd.id]);

        //其他四个位置需要进行样式计算
        r1.left = resultWrapper.ndStyles[fromNd.id].left;
        r1.top = resultWrapper.ndStyles[fromNd.id].top;
        r1.right = r1.left + r1.width;
        r1.bottom = r1.top + r1.height;

        r2.left = resultWrapper.ndStyles[toNd.id].left;
        r2.top = resultWrapper.ndStyles[toNd.id].top;
        r2.right = r2.left + r2.width;
        r2.bottom = r2.top + r2.height;


        // 根节点->二级节点
        if(0===fromNd.lev){
            // 根节点的中心点
            const x1 = parseInt((r1.left+r1.right)/2);
            const y1 = parseInt((r1.top+r1.bottom)/2);

            // 子节点垂直的中心点
            // 子节点水平位置：子节点在根节点右侧时为子节点左侧位置，子节点在根节点右侧时为子节点右侧位置
            const x2 = r1.left<r2.left ? parseInt(r2.left+1) : parseInt(r2.right);//  parseInt((r2.left+r2.right)/2);
            const y2 =parseInt((r2.top+r2.bottom)/2);

            const w=Math.abs(x2-x1);
            const h=Math.abs(y2-y1);
            const top= Math.min(y1,y2);
            const left=Math.min(x1,x2);
            const middleTop=parseInt((y1+y2)/2-1);
            const borderExp=`1px solid ${color}`;

            // 起始结束位置高度差比较小，特殊处理，使用一个1px高的div表示连接线
            if(h<=3){
                return {
                    [toNd.id]: {
                        line:{
                            boxSizing:'border-box',
                            top:`${middleTop}px`,
                            left:`${left}px`,
                            width:`${w}px`,
                            height:`1px`,
                            backgroundColor: color,
                        },
                        lineFrom: {display:'none',},
                        lineTo: {display:'none',},
                        lineExp: {display:'none',},
                    }
                };
            }

            const baseLinePart={
                boxSizing:'border-box',
                top:`${top}px`,
                left:`${left}px`,
                width:`${w}px`,
                height:`${h}px`,
            };

            // 通过边框设置连接线
            // 左->右，有左边框
            // 右->左，有右边框
            // 上->下，有下边框
            // 下->上，有上边框
            // 左上->右下，设置左下边框半径
            // 左下->右上，设置左上边框半径
            // 右上->左下，设置右下边框半径
            // 右下->左上，设置右上边框半径
            const result={
                [toNd.id]: {
                    line:   {
                        ...baseLinePart,
                        borderLeft: x1<x2 ? borderExp : '0',
                        borderRight: x1>x2 ? borderExp : '0',
                        borderBottom: ( y1<y2) ? borderExp : '0',
                        borderTop: (y1>y2) ? borderExp : '0',

                        borderBottomLeftRadius: (x1<x2 && y1<y2) ? '100% 100%' : "0",
                        borderTopLeftRadius: (x1<x2 && y1>y2) ? '100% 100%' : '0',
                        borderBottomRightRadius: (x1>x2 && y1<y2) ? '100% 100%' : '0',
                        borderTopRightRadius: (x1>x2 && y1>y2) ? '100% 100%' : '0',
                    },
                    lineFrom: {display:'none',},
                    lineTo: {display:'none',},
                    lineExp: {display:'none',},
                }
            };
            return result;
        }


        //根节点->二级节点，连接线的纵向位置应该是中间->中间
        if(0===fromNd.lev){
            r1.height=parseInt(r1.height/2);//+(globalStyleConfig.hlayout.nodePaddingTop/2);
            r1.bottom=r1.top+r1.height;

            r2.height=parseInt(r2.height/2);//+(globalStyleConfig.hlayout.nodePaddingTop/2);
            r2.bottom=r2.top+r2.height;
        }
        //二级节点->三级节点，连接线的纵向位置应该是中间->下边
        if(1===fromNd.lev){
            r1.height=parseInt(r1.height/2);//+(globalStyleConfig.hlayout.nodePaddingTop/2);
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
                zIndex: shouldPromoteZIndex ? globalStyleConfig.lineZIndex.promote: globalStyleConfig.lineZIndex.general,
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
            zIndex: shouldPromoteZIndex ? globalStyleConfig.lineZIndex.promote: globalStyleConfig.lineZIndex.general,
        };



        //左下右上
        if (t1 > t2) {
            let result = {};
            this.setLinePartsStyle(line.width, line.height, lineFrom, lineTo,lineExp, color,  false, reverseW);
            result[toNd.id] = { line, lineFrom, lineTo, lineExp };
            // console.log(result);
            return result;
        }

        //左上右下
        if (t1 < t2) {
            let result = {};
            this.setLinePartsStyle(line.width, line.height, lineFrom, lineTo,lineExp, color,  true, reverseW);
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
    setLinePartsStyle = (w, h, lineFrom, lineTo,lineExp, color,  reverseV = false, reverseW = false) => {
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
const containerMinW=800;    //导图容器最小宽
const containerMinH=600;    //导图容器最小高
const lineWid = 1;          //连接线宽度，与节点的下边框宽度一致



const lineExpDist=16;       //父子节点水平距离中的留给折叠按钮的距离
const fromXRatio = 0.3;     //起始弧线水平占比
const fromYRatio = 0.3;     //终止弧线水平占比
const graphPadding = 40;    //图表内容与容器边缘之间的距离








const inst=new MindHLayoutSvc();
export default inst;