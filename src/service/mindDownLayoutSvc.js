class MindDownLayoutSvc{
    loadStyles=(ndsSet)=> {
        if (!ndsSet) {
            return;
        }

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

        console.log("load style for down layout: ", result);



        return result;
    }


    /**
     * 摆放根节点的左右子树
     * @param {*} ndsSet
     * @param {*} resultWrapper
     * @returns
     */
    putNds = (ndsSet, resultWrapper) => {
        this.putNdsRecursively(ndsSet.tree, ndsSet, resultWrapper,0, 0);

        // let [leftH, rightH] = this.setNdDirection(ndsSet, resultWrapper);
        // let currLeftTop = (leftH < rightH ? parseInt((rightH - leftH) / 2) : 0);
        // let currRightTop = (rightH < leftH ? parseInt((leftH - rightH) / 2) : 0);
        //
        //
        // //根节点位置：x假设为500，y为在左右两边子树中高的一侧居中的位置
        // let rootLoc = [500, parseInt((Math.max(leftH, rightH)-resultWrapper.rects[ndsSet.tree.id].height) / 2)];
        //
        //
        // resultWrapper.ndStyles[ndsSet.tree.id] = {
        //     left: rootLoc[0],
        //     top: rootLoc[1],
        // }
        //
        //
        // this.putExpBtn(ndsSet,ndsSet.tree,rootLoc[0],rootLoc[1],false, resultWrapper);
        //
        //
        // if(ndsSet.expands[ndsSet.tree.id]){
        //     //左
        //     ndsSet.tree.childs.filter(nd =>resultWrapper.directions[nd.id]).forEach(nd => {
        //         let allHeight = this.getNdHeight(nd,ndsSet,resultWrapper);
        //         let l = parseInt(rootLoc[0] - ndXDist*3/2 -resultWrapper.rects[nd.id].width);//根节点x - 空隙 - 节点本身宽度
        //         let t = parseInt(currLeftTop + (allHeight - resultWrapper.rects[nd.id].height) / 2);
        //         resultWrapper.ndStyles[nd.id] = { left: l, top: t }
        //         this.putExpBtn(ndsSet,nd,l,t,true, resultWrapper);
        //         this.putSubNds(currLeftTop, l - ndXDist, nd, ndsSet, true, resultWrapper);
        //         currLeftTop += allHeight+nodePaddingTop;//
        //     });
        //
        //     //右
        //     ndsSet.tree.childs.filter(nd => !resultWrapper.directions[nd.id]).forEach(nd => {
        //         let allHeight = this.getNdHeight(nd,ndsSet,resultWrapper);
        //         let l = parseInt(rootLoc[0] +resultWrapper.rects[ndsSet.tree.id].width + ndXDist*3/2);//根节点x + 根节点宽 + 空隙
        //         let t = parseInt(currRightTop + (allHeight - resultWrapper.rects[nd.id].height) / 2);
        //         resultWrapper.ndStyles[nd.id] = { left: l, top: t, }
        //         this.putExpBtn(ndsSet,nd,l,t,false, resultWrapper);
        //         this.putSubNds(currRightTop, l + resultWrapper.rects[nd.id].width + ndXDist, nd, ndsSet, false, resultWrapper);
        //         currRightTop += allHeight+nodePaddingTop;//
        //     });
        // }
        //
        return this.calcOptNdPos(ndsSet, resultWrapper);
    }

    putNdsRecursively=(nd, ndsSet, resultWrapper, beginLeft=0, beginTop=0)=>{

        const selfW=parseInt(resultWrapper.rects[nd.id].width);
        const sumW = this.getNdWidth(nd, ndsSet, resultWrapper);
        console.log("nd sumw", nd);
        console.log("nd sumw", sumW);
        const posStyle={
            left: parseInt(beginLeft+(sumW-selfW)/2),
            top: beginTop,
        };
        resultWrapper.ndStyles[nd.id]=posStyle;


        // 子节点的样式，高度的起始位置为父节点的下面加上空白的距离
        const subBeginTop= beginTop+resultWrapper.rects[nd.id].height+ndXDist;
        if (nd.childs && 0 < nd.childs.length || ndsSet.expands[nd.id]) {
            let accuBeginLeft=beginLeft;
            for(let i=0;i<nd.childs.length;++i){
                this.putNdsRecursively(nd.childs[i], ndsSet, resultWrapper, accuBeginLeft, subBeginTop);
                accuBeginLeft+=this.getNdWidth(nd.childs[i], ndsSet, resultWrapper)+ndXDist;
            }
        }



        console.log("nd", nd);
        console.log("nd pos", posStyle);

    }



    /**
     * 获得节点和其所有子节点整个区域所占的高
     */
    getNdWidth = (nd,ndsSet, resultWrapper) => {
        //无子节点或未展开，取本节点的宽度
        if (!nd.childs || 0 === nd.childs.length || !ndsSet.expands[nd.id]) {
            return parseInt(resultWrapper.rects[nd.id].width);
        }

        //有子节点，取所有子节点的高度和，中间加上空白的距离
        let sumChildrenH = 0;
        nd.childs.forEach((child,ind) => {
            sumChildrenH +=(0<ind?ndXDist:0)+ this.getNdWidth(child,ndsSet,resultWrapper);//从第二个子节点开始，要加上空白的距离
        });
        return parseInt(Math.max(resultWrapper.rects[nd.id].width, sumChildrenH));
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
            rightH +=(0<ind?nodePaddingTop:0)+ this.getNdHeight(child, ndsSet, resultWrapper);
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
            let newLeftH = leftH +(0<leftH?nodePaddingTop:0)+ h;//
            let newRightH = rightH - h- (1<sumNdCnt-leftNdCnt?nodePaddingTop:0);
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
}


//常量值
const nodePaddingTop=40;    //节点垂直方向的间距
const containerMinW=800;    //导图容器最小宽
const containerMinH=600;    //导图容器最小高
const lineWid = 1;          //连接线宽度，与节点的下边框宽度一致
const ndXDist = 40;         //父子节点之间水平距离
const lineExpDist=16;       //父子节点水平距离中的留给折叠按钮的距离
const fromXRatio = 0.3;     //起始弧线水平占比
const fromYRatio = 0.3;     //终止弧线水平占比
const graphPadding = 40;    //图表内容与容器边缘之间的距离



export default new MindDownLayoutSvc();