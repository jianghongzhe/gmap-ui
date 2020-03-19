/**
 * 根据指定文本格式，解析为table方式显示的思维导数的数据格式
 * 
 * 层级式节点的格式 nd
 * {
        lev:    lev,        //层级
        str:    txt,        //文本
        left:   false,      //方向，true-根节点左侧 false-根节点右侧
        par:    null,       //父节点，如果是根节点则为null
        color:  lineColor,  //节点颜色
        memo:   memo,       //备注信息
        childs: []          //子节点数组
        leaf:false,         //是否为叶节点
        expand:true         //是否展开
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
    toggleExpandNode = (cell) => {
        //获取根节点
        let root = cell.nd;
        while (null != root.par) {
            root = root.par;
        }

        //修改当前节点的展开状态
        if (!cell.nd.leaf) {
            cell.nd.expand = !cell.nd.expand;
        }

        //重新解析表格结构
        return this.parseMindMapDataInner(root);
    }




    /**
     * 外部调用的主方法：解析为最终显示的数据格式
     * @param {txts} 待解析的文本
     * @param {defLineColor} 连接线的默认颜色
     * @param {mainThemeStyle} 中心主题的样式
     * @param {bordTypesMap} 边框类型的枚举
     * @param {getBorderStyleCallback} 根据边框类型解析为边框样式的回调
     */
    parseMindMapData = (txts, defLineColor, theThemeStyles, bordTypesMap, getBorderStyleCallback) => {
        //设置共享的变量
        defaultLineColor = defLineColor;
        bordType = bordTypesMap;
        getBorderStyle = getBorderStyleCallback;
        themeStyles = theThemeStyles;

        //表格行列相关计算
        let nd = this.load(txts);//根节点
        return this.parseMindMapDataInner(nd);

    }
    parseMindMapDataInner = (nd) => {

        let leftAndRightLeafCnt = this.setDirection(nd);//左右子树叶子节点数量
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
        cells[rootLoc[0]][rootLoc[1]].txt = nd.str;
        cells[rootLoc[0]][rootLoc[1]].blineColor = nd.color
        cells[rootLoc[0]][rootLoc[1]].nd = nd;


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







        for (let i = 0; i < leftAndRightCols[0]; ++i) {
            for (let j = 0; j < rows; ++j) {
                let item = cells[j][i];

                //有右下边框，且下面格无右边框，且右边无下边框，则设置右下圆角
                if (
                    bordType.r === (bordType.r & item.cls) &&
                    bordType.b === (bordType.b & item.cls) &&
                    (
                        j === rows - 1 || bordType.r !== (bordType.r & cells[j + 1][i].cls)
                    )
                    &&
                    (
                        i === cols - 1 || bordType.b !== (bordType.b & cells[j][i + 1].cls)
                    )
                ) {
                    // console.log("右下",item.txt);
                    item.cls |= bordType.rbRad;
                }

                //有下边框无右边框，且下面格有右边框，且右边无下边框
                //console.log("超了",cells[j+1][i],cells[j][i+1]);

                if (
                    bordType.r !== (bordType.r & item.cls) &&
                    bordType.b === (bordType.b & item.cls) &&
                    (
                        j < rows - 1 && bordType.r === (bordType.r & cells[j + 1][i].cls)
                    ) &&
                    (
                        i < cols - 1 && bordType.b !== (bordType.b & cells[j][i + 1].cls)
                    )
                ) {
                    //下面格设置圆角右上边框
                    cells[j + 1][i].cls |= bordType.rtRad;
                    cells[j + 1][i].cls |= bordType.t;
                    cells[j + 1][i].tlineColor = cells[j][i].blineColor;

                    //本格到左边所有有下边框的都去掉，同时在下边格加上边框
                    for (let k = i; k >= 0; --k) {
                        if (bordType.b !== (bordType.b & cells[j][k].cls)) {
                            break;
                        }

                        //当前行取消下边框
                        cells[j][k].cls &= (~bordType.b);

                        //console.log("改边框",cells[j][k].txt,cells[j][k].lineColor,cells[j+1][k].plineColor);

                        //下一行增加上边框
                        if (k !== i) {
                            cells[j + 1][k].cls |= bordType.t;
                            cells[j + 1][k].tlineColor = cells[j][k].blineColor;
                            //console.log(cells[j][k].lineColor);
                        }
                    }


                    //console.log("dddd "+cells[j][i].txt+"下面", cells[j+1][i].lineColor);

                }
            }
        }

        for (let i = leftAndRightCols[0] + 1; i < cols; ++i) {
            for (let j = 0; j < rows; ++j) {
                let item = cells[j][i];

                //有右下边框，且下面格无右边框，则设置右下圆角
                if (
                    bordType.l === (bordType.l & item.cls) &&
                    bordType.b === (bordType.b & item.cls) &&
                    (
                        j === rows - 1 || bordType.l !== (bordType.l & cells[j + 1][i].cls)
                    ) &&
                    (
                        i === 0 || bordType.b !== (bordType.b & cells[j][i - 1].cls)
                    )
                ) {
                    item.cls |= bordType.lbRad;
                }

                //有下边框无左边框，且下面格有左边框，且左边无下边框

                //console.log(cells[j][i].txt);
                //console.log(cells[j+1][i].cls);

                if (
                    bordType.l !== (bordType.l & item.cls) &&
                    bordType.b === (bordType.b & item.cls) &&
                    (
                        j < rows - 1 && bordType.l === (bordType.l & cells[j + 1][i].cls)
                    ) &&
                    (
                        i > 0 && bordType.b !== (bordType.b & cells[j][i - 1].cls)
                    )
                ) {
                    //console.log("这了");


                    //下面格设置圆角右上边框
                    cells[j + 1][i].cls |= bordType.ltRad;
                    cells[j + 1][i].cls |= bordType.t;
                    cells[j + 1][i].tlineColor = cells[j][i].blineColor;

                    //本格到左边所有有下边框的都去掉，同时在下边格加上边框
                    for (let k = i; k < cols; ++k) {
                        if (bordType.b !== (bordType.b & cells[j][k].cls)) {
                            break;
                        }

                        //当前行取消下边框
                        cells[j][k].cls &= (~bordType.b);

                        //下一行增加上边框
                        if (k !== i) {
                            cells[j + 1][k].cls |= bordType.t;
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
        return cells;
    }



    /**
     * 递归设置节点和其子节点颜色
     * @param {nd} 当前节点
     * @param {parColor} 父节点颜色
     */
    setNodeLineColor = (nd, parColor = defaultLineColor) => {
        let currColor = (null == nd.color ? parColor : nd.color);//如果当前节点没有指定颜色，则使用继承的颜色（即父节点的颜色），否则使用自己的颜色
        nd.color = currColor;
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
            if (this.hasBord(item, bordType[type])) {
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
        //父子节点都设置下划线和颜色
        this.addBord(cells[par[0]][par[1]], bordType.b);
        this.addBord(cells[child[0]][child[1]], bordType.b);
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
                cells[i][child[1]].cls |= (isLeft ? bordType.r : bordType.l);
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
            cells[i][child[1]].cls |= (isLeft ? bordType.r : bordType.l);
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


        //根节点有多个子节点，则按左右侧叶节点数相差最小为准
        //先假设所有子树都在右侧，同时计算总叶节点数
        let rightLeafCnt = 0;
        let leftLeafCnt = 0;
        let dist = 0;
        root.childs.forEach(child => {
            this.setDirectionRecursively(child, false);
            rightLeafCnt += this.getLeafCnt(child);
        });
        dist = rightLeafCnt;

        //再依次计算如果把某个节点放到左侧，侧左右侧叶节点数差值是否比当前小，如果小，就移到左侧
        let loopFin=false;
        root.childs.forEach(child => {
            if(loopFin){
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
            loopFin=true;
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
     * 根据指定文本，加载节点信息（树型结构）
     * @param {arrayOrTxt} 文本数组或由包含换行符的字符串
     * @returns {nd} 包含各层节点信息的根节点
     */
    load = (arrayOrTxt) => {
        let lastNd = null;
        let root = null;

        let strs = null;
        if (Array.isArray(arrayOrTxt)) {
            strs = arrayOrTxt;
        } else {
            arrayOrTxt = arrayOrTxt.trim();
            while (0 <= arrayOrTxt.indexOf('\r\n')) {
                arrayOrTxt = arrayOrTxt.replace('\r\n', '\n');
            }
            strs = arrayOrTxt.split('\n');
        }

        strs.forEach(str => {
            let lev = str.indexOf("-");//减号之前有几个字符即为缩进几层，层数从0开始计
            let txt = str.substring(lev + 1).trim();
            let lineColor = null;
            let memo = [];

            //内容是复合类型，则分别计算每一部分
            if (0 <= txt.indexOf("|")) {
                txt.split('|').forEach(tmp => {
                    let item = tmp.trim();
                    if (null == item || "" === item) { return; }

                    //是颜色标记
                    if (0 === item.indexOf("c:")) {
                        lineColor = item.substring("c:".length).trim();//如果出现多次，则以最后一次为准
                        return;
                    }
                    //是备注标记
                    if (0 === item.indexOf("m:")) {
                        memo.push(item.substring("m:".length).trim());//如果出现多个，则加入数组中
                        // console.log("utqc "+memo);
                        return;
                    }
                    //都不是，即为文本内容
                    txt = item;//如出现多次，只保留最后一次
                });
            }

            let nd = {
                lev: lev,
                str: txt,
                left: false,
                par: null,
                color: lineColor,
                memo: memo,
                childs: [],
                leaf: false,         //是否为叶节点
                expand: true         //默认全部展开
            };


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
            tmpNd.childs.push(nd);

            //每次处理完一次记录上个节点
            lastNd = nd;
        });
        this.setLeaf(root);
        return root;
    }

    setLeaf = (nd) => {
        nd.leaf = (0 === nd.childs.length);
        nd.childs.forEach(child => {
            this.setLeaf(child);
        });
    }

    hasBord = (item, type) => {
        return type === (type & item.cls);
    }

    addBord = (item, type) => {
        item.cls |= type;
    }

    removeBord = (item, type) => {
        item.cls &= (~type);
    }
}

let defaultLineColor = null;
let bordType = null;
let getBorderStyle = null;
let themeStyles = [null, null, null];

export default new MindmapSvc();