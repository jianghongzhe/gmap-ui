import baseLayoutSvc from "./baseLayoutSvc";
import globalStyleConfig from "../common/globalStyleConfig";

class MindDownLayoutSvc{

    /**
     * 加载样式
     * @param ndsSet
     * @returns {{expBtnRects: {}, expBtnStyles: {}, directions: {}, ndStyles: {}, wrapperStyle: {}, lineStyles: {}, rects: {}}}
     */
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

        // 折叠按钮位置
        this.putExpBtnRecursively(ndsSet.tree, ndsSet, result);

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
        const promoteLine = baseLayoutSvc.shouldPromoteLineZIndex(toNd, fromNd);

        const y1 = parseInt(resultWrapper.ndStyles[fromNd.id].top+resultWrapper.rects[fromNd.id].height);
        const y2 = parseInt(resultWrapper.ndStyles[toNd.id].top);
        const distY=y2-y1;
        const x1=parseInt(resultWrapper.ndStyles[fromNd.id].left+resultWrapper.rects[fromNd.id].width/2);
        const x2=parseInt(resultWrapper.ndStyles[toNd.id].left+resultWrapper.rects[toNd.id].width/2);
        const distX=Math.abs(x1-x2)+1;
        const l2r=(x1<x2);
        const height1=parseInt(distY/2);
        const height2=distY-height1;

        // 如果父节点有唯一一个子节点，且水平位置距离不超过3像素，则不使用两段式的边框，而改为直接使用外层div的背景表示连线
        if(fromNd.childs && 1===fromNd.childs.length && distX<=3){
            return {
                [toNd.id]: {
                    line: {
                        boxSizing:'border-box',
                        left: parseInt((x1+x2)/2),
                        top: y1,
                        width: '1px',
                        height: distY,
                        backgroundColor: `${color}`,
                        zIndex: promoteLine ? globalStyleConfig.lineZIndex.promote : globalStyleConfig.lineZIndex.general,
                    },
                    lineFrom: {
                        display:'none',
                    },
                    lineTo:{
                        display:'none',
                    },
                    lineExp:{
                        display:'none',
                    },
                }
            };
        }


        let result={};
        result[toNd.id] = {
            line:{
                boxSizing:'border-box',
                left: Math.min(x1,x2),
                top: y1,
                width: distX,
                height: distY,
                zIndex: promoteLine ? globalStyleConfig.lineZIndex.promote : globalStyleConfig.lineZIndex.general,
            },
            // 上面部分
            // 父子节点为左右，需要左下边框
            // 父子节点为右左，需要右下边框
            lineFrom:{
                boxSizing:'border-box',
                left:0,
                top:0,
                width:'100%',
                height: `${height1}px`,
                borderBottom:`1px solid ${color}`,
                borderLeft: l2r ? `1px solid ${color}` : "0",
                borderRight: l2r ?  "0" :`1px solid ${color}`,
            },
            // 下面部分
            // 父子节点为左右，需要右边框
            // 父子节点为右左，需要左边框
            lineTo:{
                boxSizing:'border-box',
                left:0,
                top: `${height1}px`,
                width:'100%',
                height: `${height2}px`,
                borderRight: l2r ? `1px solid ${color}` : "0px",
                borderLeft: l2r ?  "0px" :`1px solid ${color}`,
            },
            lineExp:{
                display:'none',
            },
        };
        return result;
    };


    /**
     * 摆放根节点的左右子树
     * @param {*} ndsSet
     * @param {*} resultWrapper
     * @returns
     */
    putNds = (ndsSet, resultWrapper) => {
        this.putNdsRecursively(ndsSet.tree, ndsSet, resultWrapper,0, 0);
        return this.calcOptNdPos(ndsSet, resultWrapper);
    }

    /**
     * 递归计算展开按钮的样式
     * @param nd
     * @param ndsSet
     * @param resultWrapper
     */
    putExpBtnRecursively =(nd, ndsSet, resultWrapper)=>{
        if (!nd.childs || 0 === nd.childs.length) {
            return;
        }

        const expended=ndsSet.expands[nd.id];
        let baseLeft=parseInt(resultWrapper.ndStyles[nd.id].left + resultWrapper.rects[nd.id].width/2);
        let baseTop=parseInt(resultWrapper.ndStyles[nd.id].top + resultWrapper.rects[nd.id].height);

        // 根据是展开还是折叠状态，对位置进行校正
        if(expended){
            baseLeft-=2;
            baseTop-=2;
        }else{
            baseLeft-=12;
            baseTop+=3;
        }

        resultWrapper.expBtnStyles[nd.id]={
            left: `${baseLeft}px`,
            top: `${baseTop}px`,
        };

        // 如果是展开状态，则继续计算子节点的展开按钮样式
        if(expended) {
            nd.childs.forEach(subNd => this.putExpBtnRecursively(subNd, ndsSet, resultWrapper));
        }
    };

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


        if (nd.childs && 0 < nd.childs.length && ndsSet.expands[nd.id]) {
            let accuBeginLeft=beginLeft;

            // 如果子节点所占用的全部宽度比父节点本身宽度还小，则增加一些偏移量（宽度差的一半）
            let childSumW=0;
            for(let i=0;i<nd.childs.length;++i){
                childSumW+=this.getNdWidth(nd.childs[i], ndsSet, resultWrapper)+(i>0 ? ndXDist : 0);
            }
            if(childSumW<selfW){
                accuBeginLeft+=parseInt((selfW-childSumW)/2);
            }

            for(let i=0;i<nd.childs.length;++i){
                this.putNdsRecursively(nd.childs[i], ndsSet, resultWrapper, accuBeginLeft, subBeginTop);
                accuBeginLeft+=this.getNdWidth(nd.childs[i], ndsSet, resultWrapper)+ndXDist;
            }
        }
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
const containerMinW=800;    //导图容器最小宽
const containerMinH=600;    //导图容器最小高
const ndXDist = 40;         //父子节点之间水平距离
const graphPadding = 40;    //图表内容与容器边缘之间的距离


const inst=new MindDownLayoutSvc();
export default inst;