/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { Component } from 'react';

class Mindmap extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            txts: [
                "- 数据结构",
                "\t- 线性结构",
                "\t\t- 顺序表",
                "\t\t- 链表",
                "\t\t\t- 单向",
                "\t\t\t\t- 循环",
                "\t\t\t\t\t- 约瑟夫问题",
                "\t\t\t\t- 非循环",
                "\t\t\t- 双向",
                "\t\t\t\t- 循环",
                "\t\t\t\t- 非循环",
                "\t\t- 栈",
                "\t\t\t- 逆波兰计算器",
                "\t\t\t\t- 中缀转后缀表达式",
                "\t\t\t\t- 后缀表达式计算",
                "\t\t- 队列",
                "\t\t\t- 优先队列",
                "\t- 非线性结构",
                "\t\t- 二维表",
                "\t\t- 多维表",
                "\t\t- 广义表",
                "\t\t- 哈希表",
                "\t\t- 树",
                "\t\t\t- 遍历",
                "\t\t\t\t- 先序",
                "\t\t\t\t- 后序",
                "\t\t\t- 二叉树",
                "\t\t\t\t- 遍历",
                "\t\t\t\t\t- 前序",
                "\t\t\t\t\t- 中序",
                "\t\t\t\t\t- 后序",
                "\t\t\t- 线索二叉树",
                "\t\t\t- 哈夫曼树",
                "\t\t\t- B树",
                "\t\t\t- B+树",
                "\t\t\t- B*树",
                "\t\t\t- 红黑树",
                "\t\t- 图",
            ],
            cells:[]
        };

        
    }

    componentDidMount(){
        console.log("componentDidUpdate");

        let nd = this.load(this.state.txts);
        let leftAndRightLeafCnt = this.setDirection(nd);
        let rows=Math.max(leftAndRightLeafCnt[0],leftAndRightLeafCnt[1]);
        let leftAndRightCols=this.fillCells(nd);
        let cols=leftAndRightCols[0]+1+leftAndRightCols[1];
        let rootLoc=[parseInt((rows-1)/2),leftAndRightCols[0]];



        
        
        let cells=[];
        for(let i=0;i<rows;++i){
            let line=[];
            for(let j=0;j<cols;++j){
                line.push({
                    txt: "　",
                    cls:0,
                    lineColor:'lightgrey'
                });
            }
            cells.push(line);
        }

        cells[rootLoc[0]][rootLoc[1]]={
            txt:nd.str,
            cls:0,
            lineColor:'lightgrey'
        };

        let leftCurrPos=0;
        let rightCurrPos=0;

        //为了使结果树的左右调度比较均匀
        if(leftAndRightLeafCnt[0]<leftAndRightLeafCnt[1]){
            rightCurrPos=0;
            leftCurrPos=(leftAndRightLeafCnt[1]-leftAndRightLeafCnt[0])/2;
        }else{
            leftCurrPos=0;
            rightCurrPos=(leftAndRightLeafCnt[0]-leftAndRightLeafCnt[1])/2;
        }


        nd.childs.forEach(child=>{
            if(child.left){
                
                this.putCell(cells,child,leftCurrPos,rootLoc[1]-1,true,rootLoc);
                leftCurrPos+=this.getLeafCnt(child);

                
                return;
            }
            if(!child.left){
                this.putCell(cells,child,rightCurrPos,rootLoc[1]+1,false,rootLoc);
                rightCurrPos+=this.getLeafCnt(child);
                return;
            }
        });

        this.setState({
            cells:cells
        });



        // //test
        // for(let i=5;i<=10;++i){
        //     cells[i][4].cls.push(getBordL());
        // }

        //cells[11][3].cls.push(getBordCorner());        
        
        

        for(let i=0;i<leftAndRightCols[0];++i){
            for(let j=0;j<rows;++j){
                let item=cells[j][i];
                
                //有右下边框，且下面格无右边框，则设置右下圆角
                if(
                    bordType.r === (bordType.r & item.cls) &&
                    bordType.b === (bordType.b & item.cls) &&
                    (
                        j===rows-1 || bordType.r !== (bordType.r & cells[j+1][i].cls)
                    )
                ){
                    item.cls|=bordType.rbRad;
                }

                //有下边框无右边框，且下面格有右边框，且右边无下边框
                if(
                    bordType.r !== (bordType.r & item.cls) &&
                    bordType.b === (bordType.b & item.cls) &&
                    (
                        j<rows && bordType.r === (bordType.r & cells[j+1][i].cls)
                    ) &&
                    (
                        i<cols-1 && bordType.b !== (bordType.b & cells[j][i+1].cls)
                    )
                ){
                    //下面格设置圆角右上边框
                    cells[j+1][i].cls|=bordType.rtRad;
                    cells[j+1][i].cls|=bordType.t;

                    //本格到左边所有有下边框的都去掉，同时在下边格加上边框
                    for(let k=i;k>=0;--k){
                        if(bordType.b !== (bordType.b & cells[j][k].cls)){
                            break;
                        }

                        //当前行取消下边框
                        cells[j][k].cls&=(~bordType.b);

                        //下一行增加上边框
                        if(k!==i){
                            cells[j+1][k].cls|=bordType.t;
                        }
                    }

                }
            }
        }

        for(let i=leftAndRightCols[0]+1;i<cols;++i){
            for(let j=0;j<rows;++j){
                let item=cells[j][i];
                
                //有右下边框，且下面格无右边框，则设置右下圆角
                if(
                    bordType.l === (bordType.l & item.cls) &&
                    bordType.b === (bordType.b & item.cls) &&
                    (
                        j===rows-1 || bordType.l !== (bordType.l & cells[j+1][i].cls)
                    )
                ){
                    item.cls|=bordType.lbRad;
                }

                //有下边框无左边框，且下面格有左边框，且左边无下边框
                if(
                    bordType.l !== (bordType.l & item.cls) &&
                    bordType.b === (bordType.b & item.cls) &&
                    (
                        j<rows && bordType.l === (bordType.l & cells[j+1][i].cls)
                    ) &&
                    (
                        i>0 && bordType.b !== (bordType.b & cells[j][i-1].cls)
                    )
                ){
                    //下面格设置圆角右上边框
                    cells[j+1][i].cls|=bordType.ltRad;
                    cells[j+1][i].cls|=bordType.t;

                    //本格到左边所有有下边框的都去掉，同时在下边格加上边框
                    for(let k=i;k<cols;++k){
                        if(bordType.b !== (bordType.b & cells[j][k].cls)){
                            break;
                        }

                        //当前行取消下边框
                        cells[j][k].cls&=(~bordType.b);

                        //下一行增加上边框
                        if(k!==i){
                            cells[j+1][k].cls|=bordType.t;
                        }
                    }

                }
            }
        }


        for(let i=0;i<cols;++i){
            for(let j=0;j<rows;++j){
                let item=cells[j][i];
                item.cls= this.parseBordStyle(item);
            }
        }

        


        cells[rootLoc[0]][rootLoc[1]].cls.push(centerThemeStyle);

        console.log(rootLoc);
    }

    parseBordStyle=(item)=>{
        let targetStyle=[];
        if(bordType.l === (bordType.l & item.cls)){
            targetStyle.push(getBordL(item.lineColor));
        }
        if(bordType.r === (bordType.r & item.cls)){
            targetStyle.push(getBordR(item.lineColor));
        }
        if(bordType.t === (bordType.t & item.cls)){
            targetStyle.push(getBordT(item.lineColor));
        }
        if(bordType.b === (bordType.b & item.cls)){
            targetStyle.push(getBordB(item.lineColor));
        }
        if(bordType.rbRad === (bordType.rbRad & item.cls)){
            targetStyle.push(getBordCorner(item.lineColor));
        }
        if(bordType.lbRad === (bordType.lbRad & item.cls)){
            targetStyle.push(getLBBordCorner(item.lineColor));
        }
        if(bordType.rtRad === (bordType.rtRad & item.cls)){
            targetStyle.push(getRTBordCorner(item.lineColor));
        }
        if(bordType.ltRad === (bordType.ltRad & item.cls)){
            targetStyle.push(getLTBordCorner(item.lineColor));
        }
        
        
        return targetStyle;
    }


    putCell=(cells,nd,startRow,col,isLeft,parLoc)=>{
        //console.log(nd.str+" "+nd.lev);
        let endRow=startRow+this.getLeafCnt(nd)-1;
        let row=parseInt((startRow+endRow)/2);// startRow+parseInt(this.getLeafCnt(nd)/2);
        cells[row][col].txt=nd.str;
        let currLoc=[row,col];
        this.setLine(cells,parLoc,currLoc); 


        let subStartRow=startRow;
        nd.childs.forEach(child => {
            //console.log("next "+child.str+" "+child.par.str+" "+(isLeft?col-1:col+1));
            this.putCell(cells,child,subStartRow,isLeft?col-1:col+1,isLeft,currLoc);
            subStartRow+=this.getLeafCnt(child);
        });
        //console.log(nd.str+" "+nd.lev+"---------");
    }

    setLine=(cells,par,child)=>{
        console.log(par[0],par[1],child[0],child[1]);
        // console.log( cells[par[0]][par[1]].cls,"aa");
        //cells[child[0]][child[1]].cls.push(getBordB());

        //父子节点都设置下划线
        cells[par[0]][par[1]].cls|=bordType.b;
        cells[child[0]][child[1]].cls|=bordType.b;

        

        //子节点在父节点左
        

        // if(child[1]<par[1]){
            let isLeft=child[1]<par[1];

            //父子节点纵坐标相同，不需要其他设置
            if(child[0]===par[0]){
                return;
            }

            //子节点在父节点下面
            if(child[0]>par[0]){
                console.log("sssss");
                for(let i=child[0];i>par[0];--i){
                    cells[i][child[1]].cls|=(isLeft?bordType.r:bordType.l);
                }
                return;
            }

            //子节点在父节点上面
            for(let i=child[0]+1;i<=par[0];++i){
                cells[i][child[1]].cls|=(isLeft?bordType.r:bordType.l);
            }

            return;
        // }
        // //子节点在父节点右
        // if(child[1]>par[1]){
        //     return;
        // }
    }


    setDirection=(root)=>{
        let childCnt = root.childs.length;
        if(0===childCnt){
            return [0,0];
        }
        //根节点只有一个子节点，则该子节点和其所有子孙节点都在右边
        if(1===childCnt){
            let onlyChild = root.childs[0];
            this.setDirectionRecursively(onlyChild,false);
            return [0,this.getLeafCnt(onlyChild)];
        }
        //根节点有多个子节点，则按左右侧叶节点数相差最小为准
        //先假设所有子树都在右侧，同时计算总叶节点数
        let rightLeafCnt=0;
        let leftLeafCnt=0;
        let dist=0;
        root.childs.forEach(child => {
            this.setDirectionRecursively(child,false);
            rightLeafCnt+=this.getLeafCnt(child);
        });
        dist=rightLeafCnt;

        //再依次计算如果把某个节点放到左侧，侧左右侧叶节点数差值是否比当前小，如果小，就移到左侧
        root.childs.forEach(child => {
            let currNodeLeftCnt = this.getLeafCnt(child);
            let assumeDist=parseInt( Math.abs ((leftLeafCnt+currNodeLeftCnt)-(rightLeafCnt-currNodeLeftCnt)));
            if(assumeDist<dist){
                dist=assumeDist;
                leftLeafCnt+=currNodeLeftCnt;
                rightLeafCnt-=currNodeLeftCnt;
                this.setDirectionRecursively(child,true);
            }
        });
        return [leftLeafCnt,rightLeafCnt];
    }

    fillCells=(root)=>{
        let deepLeft=0;
        let deepRight=0;
        root.childs.forEach(child => {
            if(child.left){
                deepLeft=Math.max(this.getDeep(child),deepLeft);
                return;
            }
            if(!child.left){
                deepRight=Math.max(this.getDeep(child),deepRight);
                return;
            }
        });
       

//        int cols=deepLeft+1+deepRight;
        return [deepLeft,deepRight];
    }

    getDeep=(nd)=>{
        if(null==nd){
            return 0;
        }
        let max=0;
        nd.childs.forEach(child => {
            max=Math.max(max,this.getDeep(child));
        });
        return 1+max;
    }

    getLeafCnt=(nd)=>{
        if(0===nd.childs.length){
            return 1;
        }
        let cnt=0;
        nd.childs.forEach(child => {
            cnt+=this.getLeafCnt(child);
        });
        return cnt;
    }

    setDirectionRecursively=(nd,left)=>{
        nd.left=left;
        nd.childs.forEach(child => {
            this.setDirectionRecursively(child,left);
        });
    }

    load=(strs)=>{
        let lastNd=null;
        let root=null;
        strs.forEach(str => {
            let lev=str.indexOf("-");
            let txt=str.substring(lev+1).trim();

            let nd={
                lev:    lev,
                str:    txt,
                left:   false,
                par:    null,
                childs: []
            };
            

            //还没有第一个节点，以第一个节点为根节点
            if(null==root){
                root=nd;
                lastNd=nd;
                return;
            }

            //当前节点的父节点为从上一个节点向父层找第一个匹配 lev=当前节点lev-1 的节点
            let targetLev = nd.lev - 1;
            let tmpNd=lastNd;
            while(tmpNd.lev>targetLev){
                tmpNd=tmpNd.par;
            }
            nd.par=tmpNd;
            tmpNd.childs.push(nd);

            //每次处理完一次记录上个节点
            lastNd=nd;
        });
        return root;
    }


    render() {
        //style={{'width':'800px','marginTop':'20px'}}
        return (
            <table border='0' cellSpacing='0' cellPadding='0'  align='center' css={mindTabStyle}>
                <tbody>
                {
                    this.state.cells.map((line,rowInd)=>
                        <tr key={rowInd}>
                        {
                            line.map((item,colInd)=>
                                <td key={colInd} css={item.cls}>
                                    {item.txt}
                                </td>    
                            )
                        }
                        </tr>
                    )
                }
                </tbody>
            </table>
        );
    }
}

const bordType={
    l: 1,
    r: 2,
    t: 4,
    b: 8,
    rbRad: 16,
    lbRad: 32,
    rtRad: 64,
    ltRad: 128,
};

const centerThemeStyle=css`
    background-color:lightblue;
`;

const mindTabStyle=css`
    & td{
        font-size:14px;
        padding-left:20px;
        padding-right:20px;
        padding-top:15px;
        padding-bottom:0px;
    }
`;

const getBordCorner=()=>css`
    border-bottom-right-radius:14px;
`;

const getLBBordCorner=()=>css`
    border-bottom-left-radius:14px;
`;
const getRTBordCorner=()=>css`
    border-top-right-radius:14px;
`;
const getLTBordCorner=()=>css`
    border-top-left-radius:14px;
`;

//border-bottom-left-radius:25px;
const getBordL=(color='lightgrey')=>css`
    border-left:2px solid ${color};
    
`;



//border-bottom-right-radius:25px;
const getBordR=(color='lightgrey')=>css`
    border-right:2px solid ${color};
`;
const getBordT=(color='lightgrey')=>css`
    border-top:2px solid ${color};
`;
const getBordB=(color='lightgrey')=>css`
    border-bottom:2px solid ${color};
`;

export default Mindmap;