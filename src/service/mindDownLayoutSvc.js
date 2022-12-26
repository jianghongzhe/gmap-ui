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


        //连线位置计算
        let newLineStyles={};
        ndsSet.list.forEach(nd=>{
            if(!nd.parid){return;}
            let styleResult=this.setLineStyle(ndsSet,nd.par,nd,result);
            newLineStyles={...newLineStyles, ...styleResult};
        });
        result.lineStyles=newLineStyles;

        console.log("load style for down layout: ", result);
        return result;
    }



    /**
     * 设置节点之间的连接线
     * @param {*} ndsSet
     * @param {*} fromNd 父节点
     * @param {*} toNd   子节点
     * @param {*} resultWrapper
     */
    setLineStyle = (ndsSet, fromNd, toNd, resultWrapper) => {
        if (!resultWrapper || !resultWrapper.ndStyles[fromNd.id] || !resultWrapper.ndStyles[toNd.id]) {
            return {};
        }

        let color=toNd.color;// fromNd.color;
        const y1 = parseInt(resultWrapper.ndStyles[fromNd.id].top+resultWrapper.rects[fromNd.id].height);
        const y2 = parseInt(resultWrapper.ndStyles[toNd.id].top);
        const distY=y2-y1;
        const x1=parseInt(resultWrapper.ndStyles[fromNd.id].left+resultWrapper.rects[fromNd.id].width/2);
        const x2=parseInt(resultWrapper.ndStyles[toNd.id].left+resultWrapper.rects[toNd.id].width/2);
        const distX=Math.abs(x1-x2)+1;
        const l2r=(x1<x2);

        let result={};
        result[toNd.id] = {
            line:{
                boxSizing:'border-box',
                left: Math.min(x1,x2),
                top: y1,
                width: distX,
                height: distY,
                //backgroundColor:'lightgreen',
            },
            lineFrom:{
                boxSizing:'border-box',
                left:0,
                top:0,
                width:'100%',
                height: distY/2,
                borderBottom:`1px solid ${color}`,
                borderLeft: l2r ? `1px solid ${color}` : "0px",
                borderRight: l2r ?  "0px" :`1px solid ${color}`,
            },
            lineTo:{
                boxSizing:'border-box',
                width:'100%',
                top: `${distY/2}px`,
                left:0,
                height: `${distY/2}px`,
                borderRight: l2r ? `1px solid ${color}` : "0px",
                borderLeft: l2r ?  "0px" :`1px solid ${color}`,
            },
            lineExp:{
                display:'none',
            },
        };
        return result;





        //
        // //rect只用于获取宽高
        // let r1 = getRelaRect(resultWrapper.rects[fromNd.id]);
        // let r2 = getRelaRect(resultWrapper.rects[toNd.id]);
        //
        // //其他四个位置需要进行样式计算
        // r1.left = resultWrapper.ndStyles[fromNd.id].left;
        // r1.top = resultWrapper.ndStyles[fromNd.id].top;
        // r1.right = r1.left + r1.width;
        // r1.bottom = r1.top + r1.height;
        //
        // r2.left = resultWrapper.ndStyles[toNd.id].left;
        // r2.top = resultWrapper.ndStyles[toNd.id].top;
        // r2.right = r2.left + r2.width;
        // r2.bottom = r2.top + r2.height;
        //
        // //根节点->二级节点，连接线的纵向位置应该是中间->中间
        // if(0===fromNd.lev){
        //     r1.height=parseInt(r1.height/2);//+(nodePaddingTop/2);
        //     r1.bottom=r1.top+r1.height;
        //
        //     r2.height=parseInt(r2.height/2);//+(nodePaddingTop/2);
        //     r2.bottom=r2.top+r2.height;
        // }
        // //二级节点->三级节点，连接线的纵向位置应该是中间->下边
        // if(1===fromNd.lev){
        //     r1.height=parseInt(r1.height/2);//+(nodePaddingTop/2);
        //     r1.bottom=r1.top+r1.height;
        // }
        //
        //
        // //左边r1 右边r2
        // let reverseW = false;
        // if (r1.left > r2.left) {
        //     let t = null;
        //     t = r1;
        //     r1 = r2;
        //     r2 = t;
        //     reverseW = true;//子节点在父节点左边
        // }
        //
        // let w = r2.left - r1.right;
        // let t1 = r1.bottom - lineWid;
        // let t2 = r2.bottom - lineWid;
        //
        // let line = {};
        // let lineFrom = {};
        // let lineTo = {};
        // let lineExp={};
        //
        // //连接线起始与末尾高度一样，不需要其中的两个div
        // if (t1 === t2) {
        //     line = {
        //         width: w,
        //         left: r1.right,
        //         height: lineWid,
        //         top: t1,
        //         borderBottom: `${lineWid}px solid ${color}`,
        //     };
        //
        //     let result = {};
        //     result[toNd.id] = { line, lineFrom, lineTo };
        //     return result;
        // }
        //
        //
        // //高度不一致，但容器矩形位置可以确定
        // line = {
        //     width: w,
        //     left: r1.right,
        //     top: Math.min(t1, t2),
        //     height: Math.abs(t1 - t2) + lineWid,
        // };
        //
        //
        //
        // //左下右上
        // if (t1 > t2) {
        //     let result = {};
        //     this.setLinePartsStyle(line.width, line.height, lineFrom, lineTo,lineExp, color, false, reverseW);
        //     result[toNd.id] = { line, lineFrom, lineTo, lineExp };
        //     // console.log(result);
        //     return result;
        // }
        //
        // //左上右下
        // if (t1 < t2) {
        //     let result = {};
        //     this.setLinePartsStyle(line.width, line.height, lineFrom, lineTo,lineExp, color, true, reverseW);
        //     result[toNd.id] = { line, lineFrom, lineTo, lineExp };
        //     // console.log(result);
        //     return result;
        // }

        return {};
    };


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