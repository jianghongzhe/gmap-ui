import mindMapValidateSvc from './mindMapValidateSvc';
import ganttSvc from './ganttSvc';
import api from './api';



/**
 * 根据指定文本格式，解析为table方式显示的思维导数的数据格式
 * 
 * 层级式节点的格式 nd
 *  {
        id:     uuid,
        forceRight: true/false  //是否强制所有子树都在右侧，只对根节点有效
        lev:    lev,        //层级
        str:    txt,        //文本
        left:   false,      //方向，true-根节点左侧 false-根节点右侧
        par:    null,       //父节点，如果是根节点则为null
        color:  lineColor,  //节点颜色
        memo:   memo,       //备注信息
        links:  [
            {
                name:'',    //null或文字
                addr:''     //非空，url
            }
        ]
        childs: []          //子节点数组
        leaf:false,         //是否为叶节点
        expand:true,        //是否展开，在为叶节点时，此值无用
        defExp: true/false, //默认是否展开，在为叶节点时，此值无用
        ref: {
            txt:'',
            parsedTxt:''
        },
        visual:false,
        dateItem: dateItem,
        prog: prog,
    }
 * 
 * 
 * 树节点的格式 cell
 * {
 *      txt: "　",          //文本
        cls:0,              //样式符号（前期），样式对象（最后）
        llineColor:null,    //左右上下边框的颜色
        rlineColor:null,
        tlineColor:null,
        blineColor:null,
        nd: nd              //关联层级式节点
 * }
 * 
 */
class MindmapSvc {
    /**
     * 切换非叶节点展开状态。为了处理此状态，所有与布局相关的操作都要在调用childs之前检查expand状态，如果未展开，则不再继续执行
     */
    toggleExpandNode = (cell,cells) => {
        // //获取根节点
        // let root = cell.nd;
        // while (null != root.par) {
        //     root = root.par;
        // }

        //修改当前节点的展开状态
        if (!cell.nd.leaf) {
            cell.nd.expand = !cell.nd.expand;
        }

        //重新解析表格结构
        return this.parseMindMapDataInner(cells.root);
    }

    /**
     * 展开所有节点
     * @param {*} cells 
     */
    expandAllNds=(cells)=>{
        // let root = this.getRootNodeByCells(cells);
        this.expandNode(cells.root);
        //重新解析表格结构
        return this.parseMindMapDataInner(cells.root);
    }

    /**
     * 恢复节点的默认状态
     */
    restoreAllNdExpSts=(cells)=>{
        this.restoreNode(cells.root);
        return this.parseMindMapDataInner(cells.root);
    }

    


    /**
     * 判断是否所有节点都已展开
     */
    isAllNodeExpand = (cells) => {
        // let root = this.getRootNodeByCells(cells);
        return this.isNodeExpandRecursively(cells.root);
    }
    
    /**
     * 判断所有节点中是否有展开状态变化的
     */
    isAnyNdExpStChanged=(cells)=>{
        return this.isNdExpStChangedRecursively(cells.root);
    }

    parseMindMapData = (txts, defLineColor, theThemeStyles, bordTypesMap, getBorderStyleCallback,defDateColor, shouldValidate = true) => {
        try{
            let root=this.parseRootNode(txts, defLineColor, theThemeStyles, bordTypesMap, getBorderStyleCallback,defDateColor, shouldValidate = true);
            let cells= this.parseMindMapDataInner(root);
            return cells;
        }catch(e){
            return {
                succ: false,
                msg: '内容解析失败',
                desc: ('string'===typeof(e)? ""+e : "图表内容解析过程中发生错误 ~~~")
            }
        }
    }


    /**
     * 外部调用的主方法：解析为最终显示的数据格式
     * @param {txts} 待解析的文本
     * @param {defLineColor} 连接线的默认颜色
     * @param {mainThemeStyle} 中心主题的样式
     * @param {bordTypesMap} 边框类型的枚举
     * @param {getBorderStyleCallback} 根据边框类型解析为边框样式的回调
     */
    parseRootNode = (txts, defLineColor, theThemeStyles, bordTypesMap, getBorderStyleCallback,defDateColor, shouldValidate = true) => {
        //校验
        if (shouldValidate) {
            if ('' === txts) {
                return {
                    succ: false,
                    msg: '内容解析失败',
                    desc: '图表内容不能为空 ~~~'
                }
            }
            let valiResult = mindMapValidateSvc.validate(txts);

            if (true !== valiResult) {
                return {
                    succ: false,
                    msg: '内容解析失败',
                    desc: valiResult + " ~~~"
                }
            }
        }

        try {
            //设置共享的变量
            defaultLineColor = defLineColor;
            defaultDateColor=defDateColor;
            bordType = bordTypesMap;
            getBorderStyle = getBorderStyleCallback;
            themeStyles = theThemeStyles;

            //表格行列相关计算
            let nd = this.load(txts);//根节点
            this.setNodeLineColor(nd, defaultLineColor);
            return nd;
        } catch (e) {
            console.error(e);
            return {
                succ: false,
                msg: '内容解析失败',
                desc: ('string'===typeof(e)? ""+e : "图表内容解析过程中发生错误 ~~~")
            }
        }

    }


    //----------------如下为非暴露的方法-------------------------------------------------
    restoreNode=(nd)=>{
        if (nd.leaf) {
            return;
        }

        nd.expand=nd.defExp;
        nd.childs.forEach(child => {
            this.restoreNode(child);
        });
    }

    expandNode = (nd) => {
        nd.expand = true;
        if (!nd.leaf) {
            nd.childs.forEach(child => {
                this.expandNode(child);
            });
        }
    }

    // getRootNodeByCells = (cells) => {
    //     //找到第一个有节点的单元格的节点对象
    //     let root = null;
    //     let isFin = false;
    //     for (let i in cells) {
    //         let line = cells[i];
    //         for (let j in line) {
    //             let tmpCell = line[j];
    //             if (tmpCell.nd) {
    //                 root = tmpCell.nd;
    //                 isFin = true;
    //                 break;
    //             }
    //         }
    //         if (isFin) {
    //             break;
    //         }
    //     }

    //     //向上找到根节点
    //     while (null != root.par) {
    //         root = root.par;
    //     }
    //     return root;
    // }

    isNdExpStChangedRecursively=(nd)=>{
        if(!nd){
            return false;
        }

        //叶节点认为展开状态没有变化
        if (nd.leaf) {
            return false;
        }

        //如果当前节点的展开状态有变化，则直接返回true
        if (nd.expand !==nd.defExp) {
            return true;
        }

        //否则递归判断子节点展开状态有无变化，若有，直接返回true
        for (let i in nd.childs) {
            if (this.isNdExpStChangedRecursively(nd.childs[i])) {
                return true;
            }
        }

        return false;
    }

    isNodeExpandRecursively = (nd) => {
        if(!nd){
            return false;
        }

        //叶节点认为是展开状态
        if (nd.leaf) {
            return true;
        }

        //从自己向子节点递归，遇到未展开，就返回false，直到最后返回true
        if (!nd.expand) {
            return false;
        }
        for (let i in nd.childs) {
            if (!this.isNodeExpandRecursively(nd.childs[i])) {
                return false;
            }
        }
        return true;
    }


    parseMindMapDataInner = (nd) => {
        //计算根节点子树的方向，同时在其中设置虚拟节点（如果需要）
        let leftAndRightLeafCnt = this.setDirection(nd);

        let rows = Math.max(leftAndRightLeafCnt[0], leftAndRightLeafCnt[1]);//行数
        rows = (0 === rows ? 1 : rows);
        let leftAndRightCols = this.getLeftRightDeeps(nd);//左右子树深度（不包含根节点）
        let cols = leftAndRightCols[0] + 1 + leftAndRightCols[1];//列数
        let rootLoc = [parseInt((rows - 1) / 2), leftAndRightCols[0]];//根节点位置



        //从根节点向下递归设置各节点的颜色
        this.setNodeLineColor(nd, defaultLineColor);


        //创建表格结构，其中cls用来存bordtype，在最后会把bordtype解析为实际的样式对象
        let cells = [];
        for (let i = 0; i < rows; ++i) {
            let line = [];
            for (let j = 0; j < cols; ++j) {
                line.push({
                    txt: "　",
                    cls: 0,
                    llineColor: null,
                    rlineColor: null,
                    tlineColor: null,
                    blineColor: null,
                    nd: null,
                });
            }
            cells.push(line);
        }

        //设置根节点的文本的颜色
        let rootCell=cells[rootLoc[0]][rootLoc[1]];
        rootCell.txt = nd.str;
        rootCell.blineColor = nd.color
        rootCell.nd = nd;
        addBord(rootCell, bordType.b);


        //设置左右子树的起始行号，为了使左右的高度比较对称，叶节点少的一方应该向下移，而不应从0开始
        let leftCurrPos = 0;
        let rightCurrPos = 0;
        if (leftAndRightLeafCnt[0] < leftAndRightLeafCnt[1]) {//为了使结果树的左右调度比较均匀
            rightCurrPos = 0;
            leftCurrPos = parseInt((leftAndRightLeafCnt[1] - leftAndRightLeafCnt[0]) / 2);
        } else {
            leftCurrPos = 0;
            rightCurrPos = parseInt((leftAndRightLeafCnt[0] - leftAndRightLeafCnt[1]) / 2);
        }


        //分别向左右子树递归放置节点
        if (nd.expand) {
            let lcnt = 0;
            let rcnt = 0;
            nd.childs.forEach(child => {
                if (child.left) {
                    ++lcnt;
                }
                if (!child.left) {
                    ++rcnt;
                }
            });


            nd.childs.forEach(child => {
                if (child.left) {
                    this.putCell(cells, child, leftCurrPos, rootLoc[1] - 1, true, rootLoc, nd.color, 1 === lcnt ? rootLoc[0] : null);
                    leftCurrPos += this.getLeafCnt(child);
                    return;
                }
                if (!child.left) {
                    this.putCell(cells, child, rightCurrPos, rootLoc[1] + 1, false, rootLoc, nd.color, 1 === rcnt ? rootLoc[0] : null);
                    rightCurrPos += this.getLeafCnt(child);
                    return;
                }
            });
        }






        //左边部分圆角设置
        for (let i = 0; i < leftAndRightCols[0]; ++i) {
            for (let j = 0; j < rows; ++j) {
                let item = cells[j][i];

                //有右下边框，且下面格无右边框，且右边无下边框，则设置右下圆角
                if (
                    hasBord(item, bordType.r) &&
                    hasBord(item, bordType.b) &&
                    (j === rows - 1 || !hasBord(cells[j + 1][i], bordType.r)) &&
                    (i === cols - 1 || !hasBord(cells[j][i + 1], bordType.b))
                ) {
                    addBord(item, bordType.rbRad)
                }

                //有下边框无右边框，且下面格有右边框，且右边无下边框，则把下格设右上圆角和上边框，同时把当前格下边框去掉，依次向左直到无下边框
                if (
                    !hasBord(item, bordType.r) &&
                    hasBord(item, bordType.b) &&
                    (j < rows - 1 && hasBord(cells[j + 1][i], bordType.r)) &&
                    (i < cols - 1 && !hasBord(cells[j][i + 1], bordType.b))
                ) {
                    //下面格设置右上圆角和上边框
                    addBord(cells[j + 1][i], bordType.rtRad);
                    addBord(cells[j + 1][i], bordType.t);
                    cells[j + 1][i].tlineColor = cells[j][i].blineColor;

                    //本格到左边所有有下边框的都去掉，同时在下边格加上边框
                    for (let k = i; k >= 0; --k) {
                        if (!hasBord(cells[j][k], bordType.b)) {
                            break;
                        }

                        //当前行取消下边框
                        removeBord(cells[j][k], bordType.b);

                        //下一行增加上边框
                        if (k !== i) {
                            addBord(cells[j + 1][k], bordType.t);
                            cells[j + 1][k].tlineColor = cells[j][k].blineColor;
                        }
                    }
                }
            }
        }

        //右边部分圆角设置
        for (let i = leftAndRightCols[0] + 1; i < cols; ++i) {
            for (let j = 0; j < rows; ++j) {
                let item = cells[j][i];

                //有左下边框，且下面格无左边框，，且右边无下边框，则设置左下圆角
                if (
                    hasBord(item, bordType.l) &&
                    hasBord(item, bordType.b) &&
                    (j === rows - 1 || !hasBord(cells[j + 1][i], bordType.l)) &&
                    (i === 0 || !hasBord(cells[j][i - 1], bordType.b))
                ) {
                    addBord(item, bordType.lbRad);
                }

                //有下边框无左边框，且下面格有左边框，且左边无下边框，则把下格设左上圆角和上边框，同时把当前格下边框去掉，依次向右直到无下边框
                if (
                    !hasBord(item, bordType.l) &&
                    hasBord(item, bordType.b) &&
                    (j < rows - 1 && hasBord(cells[j + 1][i], bordType.l)) &&
                    (i > 0 && !hasBord(cells[j][i - 1], bordType.b))
                ) {
                    //下面格设置左上圆角和上边框
                    addBord(cells[j + 1][i], bordType.ltRad);
                    addBord(cells[j + 1][i], bordType.t);
                    cells[j + 1][i].tlineColor = cells[j][i].blineColor;

                    //本格到右边所有有下边框的都去掉，同时在下边格加上边框
                    for (let k = i; k < cols; ++k) {
                        if (!hasBord(cells[j][k], bordType.b)) {
                            break;
                        }

                        //当前行取消下边框
                        removeBord(cells[j][k], bordType.b);

                        //下一行增加上边框
                        if (k !== i) {
                            addBord(cells[j + 1][k], bordType.t);
                            cells[j + 1][k].tlineColor = cells[j][k].blineColor;
                        }
                    }

                }
            }
        }


        
        
        


        //把边框样式的记号转换为实际的样式对象
        for (let i = 0; i < cols; ++i) {
            for (let j = 0; j < rows; ++j) {
                let item = cells[j][i];
                item.cls = this.parseBordStyle(item);
            }
        }

        //加入中心主题和其他各层主题的样式
        //当前只支持三种样式，即根主题、二级主题、其他任何层主题
        for (let r = 0; r < rows; ++r) {
            for (let c = 0; c < cols; ++c) {
                if (cells[r][c].nd) {
                    let themeInd = cells[r][c].nd.lev;
                    themeInd = (themeInd > 2 ? 2 : themeInd);
                    cells[r][c].cls.push(themeStyles[themeInd]);
                }
            }
        }

        // cells[rootLoc[0]][rootLoc[1]].cls.push(centerThemeStyle);
        cells.root=nd;//绑定单元格集合与根节点的对应关系
        return cells;
    }

    /**
     * 移除节点子节点中的
     */
    removeVisualNds=(nd)=>{
        let len=nd.childs.length;
        for(let i=len-1;i>=0;--i){
            if(nd.childs[i].visual){
                nd.childs.splice(i,1);
                continue;
            }
            this.removeVisualNds(nd.childs[i]);
        }
    }



    /**
     * 递归设置节点和其子节点颜色
     * @param {nd} 当前节点
     * @param {parColor} 父节点颜色
     */
    setNodeLineColor = (nd, parColor = defaultLineColor) => {
        let currColor = (null == nd.color ? parColor : nd.color);//如果当前节点没有指定颜色，则使用继承的颜色（即父节点的颜色），否则使用自己的颜色
        nd.color = currColor;

        //如果节点上的日期没有颜色，则继承线的颜色
        if(nd.dateItem && (null==nd.dateItem.color || ''===nd.dateItem.color)){
            nd.dateItem.color=currColor;
        }

        nd.childs.forEach(child => {
            this.setNodeLineColor(child, currColor);
        });
    }

    /**
     * 样式符号解析为实际的样式对象
     */
    parseBordStyle = (item) => {
        let targetStyle = [];
        for (let type in bordType) {
            if (hasBord(item, bordType[type])) {
                let tmpColor = item.lineColor;

                //如果是上下左右边框，则使用各自的颜色
                if (bordType.l === bordType[type]) {
                    tmpColor = item.llineColor;
                } else if (bordType.t === bordType[type]) {
                    tmpColor = item.tlineColor;
                } else if (bordType.r === bordType[type]) {
                    tmpColor = item.rlineColor;
                } else if (bordType.b === bordType[type]) {
                    tmpColor = item.blineColor;
                }

                targetStyle.push(getBorderStyle(bordType[type], tmpColor));
            }
        }
        return targetStyle;
    }


    /**
     * 放置单元格
     * @param {cells}   所有单元格的数组
     * @param {nd}  当前节点对象
     * @param {startRow} 起始行
     * @param {col} 列
     * @param {isLeft} 是否是根节点的左子树
     * @param {parLoc} 父节点的位置
     * @param {parColor} 父节点的颜色
     * @param {forceAlignToRoot} 如果不为null，表示强制与根节点纵坐标一致，此值即为纵坐标
     */
    putCell = (cells, nd, startRow, col, isLeft, parLoc, parColor, forceAlignToRoot) => {
        let endRow = startRow + this.getLeafCnt(nd) - 1;//最后一行：由叶子节点数计算得到
        let row = parseInt((startRow + endRow) / 2);//当前节点所在行
        if (null != forceAlignToRoot) {//强制与根节点纵坐标一致
            row = forceAlignToRoot;
        }
        
        cells[row][col].txt = nd.str;//节点文本
        
        cells[row][col].blineColor = nd.color;//节点下边框
        cells[row][col].nd = nd;
        let currLoc = [row, col];//当前节点位置






        //设置节点到父节点的连接线        
        this.setLine(cells, parLoc, currLoc, parColor, nd.color);

        //递归放置子节点
        let subStartRow = startRow;
        if (nd.expand) {
            nd.childs.forEach(child => {
                this.putCell(cells, child, subStartRow, isLeft ? col - 1 : col + 1, isLeft, currLoc, nd.color, null);
                subStartRow += this.getLeafCnt(child);
            });
        }
    }


    /**
     * 设置节点到线
     * @param {cells}  节点数组
     * @param {par}    父节点坐标
     * @param {child}  子节点坐标
     * @param {parColor} 父节点颜色
     * @param {currColor} 子节点颜色
     */
    setLine = (cells, par, child, parColor, currColor) => {
        let childNd=cells[child[0]][child[1]].nd;

        //虚拟节点不需要设置线条
        if(childNd.visual){
            return;
        }

        //父子节点都设置下划线和颜色
        addBord(cells[par[0]][par[1]], bordType.b);
        addBord(cells[child[0]][child[1]], bordType.b);
        cells[par[0]][par[1]].blineColor = parColor;
        cells[child[0]][child[1]].blineColor = currColor;

        //子节点在父节点的左还是右
        let isLeft = child[1] < par[1];

        //父子节点纵坐标相同，不需要其他设置
        if (child[0] === par[0]) {
            return;
        }

        //子节点在父节点下面，设置连线到父节点的左或右边框线
        if (child[0] > par[0]) {
            for (let i = child[0]; i > par[0]; --i) {
                addBord(cells[i][child[1]], (isLeft ? bordType.r : bordType.l));
                if (isLeft) {
                    cells[i][child[1]].rlineColor = parColor;
                } else {
                    cells[i][child[1]].llineColor = parColor;
                }
            }
            return;
        }

        //子节点在父节点上面，设置连线到父节点的左或右边框线
        for (let i = child[0] + 1; i <= par[0]; ++i) {
            addBord(cells[i][child[1]], (isLeft ? bordType.r : bordType.l));
            if (isLeft) {
                cells[i][child[1]].rlineColor = parColor;
            } else {
                cells[i][child[1]].llineColor = parColor;
            }
        }
    }


    /**
     * 设置根节点各子节点的方向（即左/右）
     * @param {root} 根节点
     * @returns {[lcnt,rcnt]} 左右子树的叶子节点数量
     */
    setDirection = (root) => {
        console.log("所有节点都在右",root.forceRight);


        let childCnt = root.childs.length;
        if (0 === childCnt || !root.expand) {
            return [0, 0];
        }

        //根节点只有一个子节点，则该子节点和其所有子孙节点都在右边
        if (1 === childCnt) {
            let onlyChild = root.childs[0];
            this.setDirectionRecursively(onlyChild, false);
            return [0, this.getLeafCnt(onlyChild)];
        }


        //根节点有多个子节点
        //先假设所有子树都在右侧，同时计算总叶节点数
        let rightLeafCnt = 0;
        let leftLeafCnt = 0;
        let dist = 0;
        root.childs.forEach(child => {
            this.setDirectionRecursively(child, false);
            rightLeafCnt += this.getLeafCnt(child);
        });
        dist = rightLeafCnt;

        
        //如果设置了强制所有节点都在右侧，则直接返回
        if(root.forceRight){
            return [0, rightLeafCnt];
        }

        //否则，以左右侧叶节点数相差最小为准
        //依次计算如果把某个节点放到左侧，侧左右侧叶节点数差值是否比当前小，如果小，就移到左侧
        let loopFin = false;
        root.childs.forEach(child => {
            if (loopFin) {
                return;
            }

            let currNodeLeftCnt = this.getLeafCnt(child);
            let assumeDist = parseInt(Math.abs((leftLeafCnt + currNodeLeftCnt) - (rightLeafCnt - currNodeLeftCnt)));
            if (assumeDist < dist) {
                dist = assumeDist;
                leftLeafCnt += currNodeLeftCnt;
                rightLeafCnt -= currNodeLeftCnt;
                this.setDirectionRecursively(child, true);
                return;
            }
            loopFin = true;
        });

        

        return [leftLeafCnt, rightLeafCnt];
    }

    /**
     * 递归设置节点和所有子孙节点的方向
     */
    setDirectionRecursively = (nd, left) => {
        nd.left = left;
        nd.childs.forEach(child => {
            this.setDirectionRecursively(child, left);
        });
    }


    /**
     * 计算根节点左右子树的深度，不包括根节点
     */
    getLeftRightDeeps = (root) => {
        let deepLeft = 0;
        let deepRight = 0;
        if (!root.expand) {
            return [deepLeft, deepRight];
        }

        root.childs.forEach(child => {
            if (child.left) {
                deepLeft = Math.max(this.getDeep(child), deepLeft);
                return;
            }
            if (!child.left) {
                deepRight = Math.max(this.getDeep(child), deepRight);
                return;
            }
        });
        return [deepLeft, deepRight];
    }

    /**
     * 获得节点的深度，自己也算一层
     */
    getDeep = (nd) => {
        if (null == nd) {
            return 0;
        }
        let max = 0;
        if (nd.expand) {
            nd.childs.forEach(child => {
                max = Math.max(max, this.getDeep(child));
            });
        }
        return 1 + max;
    }

    /**
     * 获得节点叶节点的数量
     */
    getLeafCnt = (nd) => {
        if (0 === nd.childs.length || !nd.expand) {
            return 1;
        }
        let cnt = 0;
        nd.childs.forEach(child => {
            cnt += this.getLeafCnt(child);
        });
        return cnt;
    }

    
    /**
     * 获得节点行中的特殊部分的处理器
     * @returns [
     *      (item, ...)=>[boolean, boolean, value]
     *      //参数：该行文本、其他依赖的对象等 
     *      //返回：是否已处理、是否有有效的结果值、结果值内容
     * ]
     * 
     */
    linePartHandlers={
        handleForceRight: (item)=>{
            if ('right:' !== item) {
                return [false,false,null];
            }

            return [true,true,true];
        },

        /**
         * 节点默认是折叠状态
         * @param {*} item 
         * @returns 
         */
        handleZip: (item)=>{
            if ('zip:' !== item) {
                return [false,false,null];
            }

            return [true,true,false];
        },


        handleRef: (item, refs)=>{
            let refPrefixLen = 'ref:'.length;
            if (!item.startsWith("ref:") || item.length <= refPrefixLen) {
                return [false,false,null];
            }

            if ('undefined' !== typeof (refs[item])) {
                let ref = {
                    name: item,
                    showname: item.substring(refPrefixLen).trim(),
                    txt: refs[item],
                    parsedTxt: null,
                };
                return [true,true,ref];
            }
            return [true,false,null];
        },

        handleGraph:(item, graphs)=>{
            let graphfPrefixLen = 'graph:'.length;
            if (!item.startsWith("graph:") || item.length <= graphfPrefixLen) {
                return [false,false,null];
            }

            if ('undefined' !== typeof (graphs[item])) {
                let graph = {
                    name: item,
                    showname: item.substring(graphfPrefixLen).trim(),
                    items: graphs[item],
                }
                return [true,true,graph];
            }
            return [true,false,null];
        },

        handleLineColor:(item)=>{
            if (!item.startsWith("c:")) {
                return [false,false,null];
            }

            if(item.length > 20){
                return [true,false,null];
            }
            let lineColor = item.substring("c:".length).trim();//如果出现多次，则以最后一次为准
            return [true,true,lineColor];
        },
        
        handleMemo:(item)=>{
            if (!item.startsWith("m:")) {
                return [false,false,null];
            }
            let memo=item.substring("m:".length).trim();//备注可以出现多个，最终加入数组中
            if(null==memo || ''===memo.trim()){
                return [true,false,null];
            }
            return [true,true,memo];
        },

        handleCommonLink:(item, isUrlPattern)=>{
            let urlPattern = isUrlPattern(item);
            if (false === urlPattern) {
                return [false,false,null];
            }

            let link={
                name: null,
                addr: urlPattern
            };
            return [true,true,link];
        },

        handleMarkdownLink:(item, hasUrlPrefix)=>{
            //是markdown链接 [文字](地址)
            if (!(/^\[.*?\]\(.+?\)$/.test(item))) {
                return [false,false,null];
            }

            let txt = item.substring(1, item.lastIndexOf("]")).trim();
            let url = item.substring(item.indexOf("(") + 1, item.length - 1).trim();
            if(null===txt || ''===txt || ""===txt.trim()){
                if(url.startsWith("cmd://")){
                    txt='执行命令';
                }else if(url.startsWith("cp://")){
                    txt='复制';
                }else if(url.startsWith("dir://")){
                    txt='打开目录并选择';
                }else if(url.startsWith("openas://")){
                    txt='打开方式';
                }else{
                    txt='打开';
                }
            }

            if (hasUrlPrefix(url)) {
                url=url+"";
            }else if(url.startsWith("./")){
                url=api.calcAttUrlSync("",url);
            }/*else{
                url = "http://" + url;
            }*/

            let link={
                name: txt,
                addr: url
            };
            return [true,true,link];
        },

        handleGant:(item)=>{
            let gantItem=ganttSvc.parseGantItem(item);
            if(false===gantItem){
                return [false,false,null];
            }
            return [true,true,gantItem];
        },

        handleProg:(item, progs)=>{
            let progMatchItems=/^p[:]([-]?)([0-9]{1,3})$/.exec(item);
            if(!(item.startsWith("p:") && progMatchItems)){
                return [false,false,null];
            }

            let isErr=(progMatchItems[1]?true:false);
            let num=parseInt(progMatchItems[2]);
            num=(num>100?100:num);
            let msg=(isErr?"完成到 "+num+"% 时出现错误":(100===num?"已完成":"已完成 "+num+"%"));

            let prog={
                num: num,
                txt: null,//稍后加入
                st: isErr?'exception':(100===num?'success':'normal'),
                allProgs: progs,
                msg: msg,
                err : isErr,
                done: !isErr && 100===num,
                doing: !isErr && 100>num,
            };
            return [true,true,prog];
        },

        handleDate:(item, timeline, parseDateInfo)=>{
            //匹配规则：[0]整串  [1]日期部分  [2],purple  [3]purple
            let dateMatchItems = /^d[:]([0-9]{2}[-/.][0-9]{1,2}[-/.][0-9]{1,2})(,(.{0,25}))?$/.exec(item);
            if (!(item.startsWith("d:") && dateMatchItems && dateMatchItems[1])) {
                return [false,false,null];
            }

            let dateItem = {
                fullDate: '', //2020-05-23 五
                msg: '', //昨天、前天、大前天，过期x天，今天、明天、后天、大后天，还差x天
                abbrDate: '', //是当年： 5/23   不是当年 22/3/20,
                timeline: timeline, //时间线对象
                color: null,
                txt: null,//稍后加入
                expired:false,
                near:false,
                future:false,
            };
            dateItem=parseDateInfo(dateItem,dateMatchItems[1],dateMatchItems[3]);
            return [true,true,dateItem];
        },
    };


    

    /**
     * 根据指定文本，加载节点信息（树型结构）
     * @param {arrayOrTxt} 文本数组或由包含换行符的字符串
     * @returns {nd} 包含各层节点信息的根节点
     */
    load = (arrayOrTxt) => {
        let lastNd = null;
        let root = null;
        let timeline = [];//时间线对象，后面会往里放
        let progs=[];
        let gantData={
            gantItems:[],
        };
        let nodeIdCounter=0;
        let nodeIdPrefix="nd_"+new Date().getTime()+"_";

        let { ndLines, refs, graphs} = this.loadParts(arrayOrTxt);

        ndLines.forEach(str => {           
            //=============数据行开始======================

            let lev = str.indexOf("-");//减号之前有几个字符即为缩进几层，层数从0开始计
            let txt = str.substring(lev + 1).trim();
            let txts=[txt];
            let lineColor = null;
            let memo = [];
            let links = [];
            let expand = true;
            let ref = [];
            let dateItem = null;
            let prog=null;
            let gant=null;
            let graph=null;//关系图
            let forceRight=false;


            //内容是简单类型，把转换的竖线再恢复回来
            let replTxt=escapeVLine(txt);
            if (0 > replTxt.indexOf("|")) {
                txt=unescapeVLine(replTxt);
                txts=[txt];
            }

            //内容是复合类型，则分别计算每一部分
            if (0 <= replTxt.indexOf("|")) {
                txts=[];
                replTxt.split('|').map(txt=>unescapeVLine(txt)).forEach(tmp => {
                    //=============指定行的项开始======================
                    
                    let item = tmp.trim();
                    if (null == item || "" === item) { return; }

                    //forceRight
                    let [handled,hasVal,val]=this.linePartHandlers.handleForceRight(item);
                    if(handled){
                        if(hasVal){
                            forceRight = val;
                        }
                        return;
                    }

                    //节点默认是折叠状态
                    [handled,hasVal,val]=this.linePartHandlers.handleZip(item);
                    if(handled){
                        if(hasVal){
                            expand = val;
                        }
                        return;
                    }

                    //是引用
                    [handled,hasVal,val]=this.linePartHandlers.handleRef(item, refs);
                    if(handled){
                        if(hasVal){
                            ref.push(val);
                        }
                        return;
                    }
                    
                    //是关系图引用
                    [handled,hasVal,val]=this.linePartHandlers.handleGraph(item, graphs);
                    if(handled){
                        if(hasVal){
                            graph=val;
                        }
                        return;
                    }

                    //是颜色标记  c:red  c:#fcfcfc 
                    [handled,hasVal,val]=this.linePartHandlers.handleLineColor(item);
                    if(handled){
                        if(hasVal){
                            lineColor=val;
                        }
                        return;
                    }

                    //是备注标记  m:说明
                    [handled,hasVal,val]=this.linePartHandlers.handleMemo(item);
                    if(handled){
                        if(hasVal){
                            memo.push(val);
                        }
                        return;
                    }

                    //是普通链接  http://www.xxx.com
                    [handled,hasVal,val]=this.linePartHandlers.handleCommonLink(item, this.isUrlPattern);
                    if(handled){
                        if(hasVal){
                            links.push(val);
                        }
                        return;
                    }


                    //是甘特图标识
                    [handled,hasVal,val]=this.linePartHandlers.handleGant(item);
                    if(handled){
                        if(hasVal){
                            gantData.gantItems.push(val);
                            gant=gantData;
                        }
                        return;
                    }

                    //进度   p:10   p:-20   
                    [handled,hasVal,val]=this.linePartHandlers.handleProg(item, progs);
                    if(handled){
                        if(hasVal){
                            prog=val;
                            progs.push(prog);//保持加入的顺序不变，后面不用排序
                        }
                        return;
                    }

                    //日期类型 d:20.1.8、d:20.1.8,purple
                    [handled,hasVal,val]=this.linePartHandlers.handleDate(item,timeline,this.parseDateInfo);
                    if(handled){
                        if(hasVal){
                            dateItem=val;
                            timeline.push(dateItem);//保持加入的顺序不变，后面不用排序
                        }
                        return;
                    }

                    //是markdown链接 [文字](地址)
                    [handled,hasVal,val]=this.linePartHandlers.handleMarkdownLink(item,this.hasUrlPrefix);
                    if(handled){
                        if(hasVal){
                            links.push(val);
                        }
                        return;
                    }

                    //都不是，即为文本内容
                    txts.push(item);//如出现多次，只保留最后一次

                    //-------------指定行的项结束----------------------
                });
            }

            //整行加载完之后，设置日期项对应的文本
            if (dateItem) {
                dateItem.txt = txts;
            }
            if(prog){
                prog.txt=txts;
            }
            if(gant){
                gant.gantItems[gant.gantItems.length-1].task=txts;
            }


            let nd = {
                id: nodeIdPrefix+(++nodeIdCounter),
                lev: lev,
                str: txts,
                left: false,
                par: null,
                parid:null,
                color: lineColor,
                memo: memo,
                links: links,
                childs: [],
                leaf: false,         //是否为叶节点
                expand: expand,      //展开状态
                defExp: expand,      //默认展开状态
                refs: ref,
                dateItem: dateItem,
                prog: prog,
                gant:gant,
                graph:graph,
                forceRight: (0===lev?forceRight:false), //只有根节点才有可能设置forceRight，其他节点一律为false
            };

            // console.log("关系图2",nd);


            //还没有第一个节点，以第一个节点为根节点
            if (null == root) {
                root = nd;
                lastNd = nd;
                return;
            }

            //当前节点的父节点为从上一个节点向父层找第一个匹配 lev=当前节点lev-1 的节点
            let targetLev = nd.lev - 1;
            let tmpNd = lastNd;
            while (tmpNd.lev > targetLev) {
                tmpNd = tmpNd.par;
            }
            nd.par = tmpNd;
            nd.parid=tmpNd.id;
            tmpNd.childs.push(nd);

            //每次处理完一次记录上个节点
            lastNd = nd;

            //-------------数据行结束----------------------
        });

        
        //从顶部开始递归设置叶节点标志
        this.setLeaf(root);

        //所有节点所加载完宾，对时间线排序
        timeline.sort((t1, t2) => {
            if (t1.fullDate === t2.fullDate) {
                return 0;
            }
            return t1.fullDate < t2.fullDate ? -1 : 1;
        });


        //甘特图处理
        // console.log("甘",gantData);

        let {data,colKeys,relas}=ganttSvc.parseGantData(gantData.gantItems)
        gantData.data=data;
        gantData.colKeys=colKeys;
        gantData.relas=relas;
        // console.log(data);
        
        return root;
    }


    getVisualND=(par,lev,left=false)=>{
        return {
            lev: lev,
            str: "　",
            left: left,
            par: par,
            color: "transparent",
            memo: [],
            links: [],
            childs: [],
            leaf: true,         //是否为叶节点
            expand: true,      //默认全部展开
            ref: null,
            dateItem: null,
            prog: null,
            visual:true,
        };
    }

    /**
     * 把只有两棵子树并且每个子树最多只有一个叶节点的节点，在两子树之间增加一个虚拟节点，以使最终图表好年
     */
    convertTwoSub2ThreeSub=(nd)=>{
        if(nd.leaf || !nd.expand){
            return;
        }
    }


    parseDateInfo=(dateItem,datePart,colorPart)=>{
        //指定的日期
        let ymd = datePart.replace(/[-/.]/g, '|').split('|').map(eachPart => parseInt(eachPart));
        let assignedDate = new Date(2000 + ymd[0], ymd[1] - 1, ymd[2]);//月份从0开始

        //当前日期
        let now = new Date();
        now.setHours(0);
        now.setMinutes(0);
        now.setSeconds(0);
        now.setMilliseconds(0);

        //日期全称
        dateItem.fullDate=""+(2000 + ymd[0])+"-"+(ymd[1]<10?"0":"")+ymd[1]+"-"+(ymd[2]<10?"0":"")+ymd[2]+" ";
        let dayOfWeek=['日','一','二','三','四','五','六'][assignedDate.getDay()];
        dateItem.fullDate+=dayOfWeek;

        //日期简称
        dateItem.abbrDate='';
        if(assignedDate.getFullYear()!==now.getFullYear()){
            dateItem.abbrDate+=ymd[0]+"/"
        }
        dateItem.abbrDate+=ymd[1]+"/"
        dateItem.abbrDate+=ymd[2];

        //指定日期与当前日期相差的天数
        let dist=Math.abs((now - assignedDate)/86400000);

        //指定日期小于当前日期，过期，显示为红色
        if (assignedDate < now) {
            dateItem.color = defaultDateColor.expired;
            dateItem.expired=true;
            let dayNames = [undefined, "昨天", "前天", "大前天"];
            dateItem.msg =(dist in dayNames ? dayNames[dist] : "过期 " + dist + " 天");
        }
        //7天之内为近期任务
        else if (now <= assignedDate && dist <= 7) {
            dateItem.color = defaultDateColor.near;
            dateItem.near=true;
            let dayNames = ["今天", "明天", "后天", "大后天"];

            dateItem.msg =(dist in dayNames ? dayNames[dist]: "还剩 " + dist + " 天");
        }
        //以后
        else {
            dateItem.color = defaultDateColor.future;
            dateItem.future=true;
            dateItem.msg = dist+" 天以后";
        }

        //手动指定了颜色，则覆盖掉前面的颜色设置。可能是 "" 或 "red" 的格式，如果是空，则在计算节点颜色时会设置上
        if ('undefined'!==typeof(colorPart)) {
            dateItem.color = colorPart;
        }
        return dateItem;
    }

    isWrapLine=(line)=>{
        if(line.trim().endsWith("\\")){
            return {
                flag: true,
                newLine:  line.substring(0,line.lastIndexOf("\\")),
            };
        }
        return {
            flag: false,
            newLine: line,
        }
    }

    /**
     * 把内容拆分为
     */
    loadParts = (alltxts) => {
        let refs = {};
        let trefs = {};
        let graphs = {};
        let ndLines = [];
        let currRefName = null;
        let alreadyHandleRefs = false;

        

        alltxts.trim().replace(/\r/g, '').split("\n").forEach(line => {
            if ("***" === line.trim() && !alreadyHandleRefs) {
                alreadyHandleRefs = true;
            }

            //还没到引用部分
            if (!alreadyHandleRefs) {
                if ('' === line.trim()) {
                    return;
                }
                ndLines.push(line);//此处不要trim，因为节点有层级关系，前面有制表符
                return;
            }

            //已经到引用部分
            //是引用标识符
            let trimLine = line.trim();
            if (    
                    (trimLine.startsWith("# ref:") && trimLine.length > "# ref:".length) ||
                    (trimLine.startsWith("# tref:") && trimLine.length > "# tref:".length) ||
                    (trimLine.startsWith("# graph:") && trimLine.length > "# graph:".length)
            ){
                currRefName = trimLine.substring("# ".length);
                return;
            }

            //还没有当前标识符
            if (null == currRefName) {
                return;
            }

            //已有当前标识符
            if(currRefName.startsWith("ref:")){
                //是已记录过的引用
                if ("undefined" !== typeof (refs[currRefName])) {
                    refs[currRefName] += '\n' + line;
                    return;
                }
                //是新引用
                refs[currRefName] = line;
                return;
            }else if(currRefName.startsWith("tref:")){
                if(""===trimLine){
                    return;
                }

                //是已记录过的引用
                if ("undefined" !== typeof (trefs[currRefName])) {
                    trefs[currRefName] += trimLine;
                    return;
                }
                //是新引用
                trefs[currRefName] = trimLine;
                return;
            }else if(currRefName.startsWith("graph:")){
                if(""===trimLine){
                    return;
                }
                if(!trimLine.startsWith("- ")){
                    return;
                }
                let items=trimLine.substring("- ".length)
                    .replaceAll("，",",")
                    .replaceAll("、",",")
                    .replaceAll("|",",")
                    .replaceAll("｜",",")                    
                    .replaceAll("/",",")
                    .replaceAll("／",",")
                    .replaceAll("\\",",")
                    .replaceAll("＼",",")
                    .split(",")
                    .filter(each=>null!==each && ""!==each.trim())
                    .map(each=>each.trim())
                    .filter((each,ind)=>ind<3);
                if(items.length<3){
                    return;
                }

                //是已记录过的引用
                if ("undefined" !== typeof (graphs[currRefName])) {
                    graphs[currRefName].push(items);
                    return;
                }
                //是新引用
                graphs[currRefName] = [items];
                return;
            }
        });



        // 文字引用直接替换到原文中
        ndLines=ndLines.map(line=>{
            let splitPos=line.indexOf("- ")+2;
            let front=line.substring(0,splitPos);
            let end="|"+escapeVLine(line.substring(splitPos).trim())+"|";

            for(let key in trefs){
                end=end.replace("|"+key+"|","|"+trefs[key]+"|");
            }
            while(end.startsWith("|")){
                end=end.substring(1);
            }
            while(end.endsWith("|")){
                end=end.substring(0,end.length-1);
            }
            return front+unescapeVLineRestore(end.trim());
        });


        return { ndLines, refs, graphs};
    }

    setLeaf = (nd) => {
        nd.leaf = (0 === nd.childs.length);
        nd.childs.forEach(child => {
            this.setLeaf(child);
        });
    }

    hasUrlPrefix = (url) => {
        return ["http://","https://","ftp://","ftps://","file://","dir://","cp://","cmd://","gmap://","//"].some(prefix=>url.startsWith(prefix));
    }

    /**
     * 判断是否为url类型
     * @param {*} url 
     * @returns 如果是url类型，返回处理过的地址，否则抬false
     */
    isUrlPattern = (url) => {
        if (this.hasUrlPrefix(url)) {
            return url.trim();
        }
        if (url.startsWith("www.") && url.length > "www.".length) {
            return "http://" + url.trim();
        }
        return false;
    }
}


//竖线转义相差工具方法
const vlineEscapeTxt='___vline___';
const escapeVLineReg=/[\\][|]/g;
const unescapeVLineReg=new RegExp(vlineEscapeTxt,"g");

const escapeVLine=(str)=>str.replace(escapeVLineReg,vlineEscapeTxt);
const unescapeVLine=(str)=>str.replace(unescapeVLineReg,'|');
const unescapeVLineRestore=(str)=>str.replace(unescapeVLineReg,'\\|');


const hasBord = (item, type) => {
    return type === (type & item.cls);
}

const addBord = (item, type) => {
    item.cls |= type;
}

const removeBord = (item, type) => {
    item.cls &= (~type);
}


/*
{
    expired:'', //过期
    near:'',    //近几天
    future:''   //以后
}
*/
let defaultDateColor = null;
let defaultLineColor = null;
let bordType = null;
let getBorderStyle = null;
let themeStyles = [null, null, null];

const inst=new MindmapSvc();

const expObj={
    hasUrlPrefix:       inst.hasUrlPrefix,
    toggleExpandNode:   inst.toggleExpandNode,
    parseMindMapData:   inst.parseMindMapData,
    parseRootNode:      inst.parseRootNode,

    isAllNodeExpand:    inst.isAllNodeExpand,
    expandAllNds:       inst.expandAllNds,
    isAnyNdExpStChanged:inst.isAnyNdExpStChanged,
    restoreAllNdExpSts: inst.restoreAllNdExpSts,

    isNodeExpandRecursively:inst.isNodeExpandRecursively,
    isNdExpStChangedRecursively:inst.isNdExpStChangedRecursively,
    expandNode:inst.expandNode,
    restoreNode:inst.restoreNode,
};

export default expObj;