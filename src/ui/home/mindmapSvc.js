import mindMapValidateSvc from './mindMapValidateSvc';
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
        links:  [
            {
                name:'',    //null或文字
                addr:''     //非空，url
            }
        ]
        childs: []          //子节点数组
        leaf:false,         //是否为叶节点
        expand:true,        //是否展开
        ref: {
            txt:'',
            parsedTxt:''
        }
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
     * 展开所有节点
     * @param {*} cells 
     */
    expandAllNds(cells) {
        let root = this.getRootNodeByCells(cells);
        this.expandNode(root);
        //重新解析表格结构
        return this.parseMindMapDataInner(root);
    }




    /**
     * 判断是否所有节点都已展开
     */
    isAllNodeExpand = (cells) => {
        let root = this.getRootNodeByCells(cells);
        return this.isNodeExpand(root);
    }





    /**
     * 外部调用的主方法：解析为最终显示的数据格式
     * @param {txts} 待解析的文本
     * @param {defLineColor} 连接线的默认颜色
     * @param {mainThemeStyle} 中心主题的样式
     * @param {bordTypesMap} 边框类型的枚举
     * @param {getBorderStyleCallback} 根据边框类型解析为边框样式的回调
     */
    parseMindMapData = (txts, defLineColor, theThemeStyles, bordTypesMap, getBorderStyleCallback,defDateColor, shouldValidate = true) => {
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
                console.log("验证结果", valiResult);
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
            return this.parseMindMapDataInner(nd);
        } catch (e) {
            console.error(e);
            return {
                succ: false,
                msg: '内容解析失败',
                desc: "图表内容解析过程中发生错误 ~~~"
            }
        }

    }


    //----------------如下为非暴露的方法-------------------------------------------------


    expandNode = (nd) => {
        nd.expand = true;
        if (!nd.leaf) {
            nd.childs.forEach(child => {
                this.expandNode(child);
            });
        }
    }

    getRootNodeByCells = (cells) => {
        //找到第一个有节点的单元格的节点对象
        let root = null;
        let isFin = false;
        for (let i in cells) {
            let line = cells[i];
            for (let j in line) {
                let tmpCell = line[j];
                if (tmpCell.nd) {
                    root = tmpCell.nd;
                    isFin = true;
                    break;
                }
            }
            if (isFin) {
                break;
            }
        }

        //向上找到根节点
        while (null != root.par) {
            root = root.par;
        }
        return root;
    }

    isNodeExpand = (nd) => {


        //叶节点认为是展开状态
        if (nd.leaf) {
            return true;
        }

        //从自己向子节点递归，遇到未展开，就返回false，直到最后返回true
        if (!nd.expand) {
            return false;
        }
        for (let i in nd.childs) {
            if (!this.isNodeExpand(nd.childs[i])) {
                return false;
            }
        }
        return true;
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
     * 根据指定文本，加载节点信息（树型结构）
     * @param {arrayOrTxt} 文本数组或由包含换行符的字符串
     * @returns {nd} 包含各层节点信息的根节点
     */
    load = (arrayOrTxt) => {
        let lastNd = null;
        let root = null;
        let timeline = [];//时间线对象，后面会往里放
        // console.log("测试新解析");
        // console.log(this.loadParts(arrayOrTxt));

        let { ndLines, refs } = this.loadParts(arrayOrTxt);

        ndLines.forEach(str => {           
            //=============数据行开始======================

            let lev = str.indexOf("-");//减号之前有几个字符即为缩进几层，层数从0开始计
            let txt = str.substring(lev + 1).trim();
            let lineColor = null;
            let memo = [];
            let links = [];
            let expand = true;
            let ref = null;
            let dateItem = null;


            //内容是复合类型，则分别计算每一部分
            if (0 <= txt.indexOf("|")) {
                txt.split('|').forEach(tmp => {
                    //=============指定行的项开始======================
                    
                    let item = tmp.trim();
                    if (null == item || "" === item) { return; }

                    //节点默认是折叠状态
                    if ('zip:' === item) {
                        expand = false;
                        return
                    }

                    //是引用
                    let refPrefixLen = 'ref:'.length;
                    if (item.startsWith("ref:") && item.length > refPrefixLen) {
                        if ('undefined' !== typeof (refs[item])) {
                            ref = {
                                name: item,
                                showname: item.substring(refPrefixLen).trim(),
                                txt: refs[item],
                                parsedTxt: null,
                            }
                        }
                        return;
                    }

                    //是颜色标记  c:red  c:#fcfcfc 
                    if (item.startsWith("c:") && item.length <= 20) {
                        lineColor = item.substring("c:".length).trim();//如果出现多次，则以最后一次为准
                        return;
                    }

                    //是备注标记  m:说明
                    if (item.startsWith("m:")) {
                        memo.push(item.substring("m:".length).trim());//备注可以出现多个，最终加入数组中
                        return;
                    }

                    //日期类型 d:20.1.8、d:20.1.8,purple
                    //匹配规则：[0]整串  [1]日期部分  [2],purple  [3]purple
                    let dateMatchItems = /^d[:]([0-9]{2}[-/.][0-9]{1,2}[-/.][0-9]{1,2})(,(.{0,25}))?$/.exec(item);
                    if (item.startsWith("d:") && dateMatchItems && dateMatchItems[1]) {
                        dateItem = {
                            fullDate: '', //2020-05-23 五
                            msg: '', //昨天、前天、大前天，过期x天，今天、明天、后天、大后天，还差x天
                            abbrDate: '', //是当年： 5/23   不是当年 22/3/20,
                            timeline: timeline, //时间线对象
                            color: null,
                            txt: null,
                            expired:false,
                            near:false,
                            future:false,
                        };
                        dateItem=this.parseDateInfo(dateItem,dateMatchItems[1],dateMatchItems[3]);
                        timeline.push(dateItem);
                        return;
                    }

                    //是markdown链接 [文字](地址)
                    if (/^\[.+\]\(.+\)$/.test(item)) {
                        let txt = item.substring(1, item.lastIndexOf("]")).trim();
                        let url = item.substring(item.indexOf("(") + 1, item.length - 1).trim();
                        if (!this.hasUrlPrefix(url)) {
                            url = "http://" + url;
                        }
                        links.push({
                            name: txt,
                            addr: url
                        });
                        return;
                    }

                    //是普通链接  http://www.xxx.com
                    let urlPattern = this.isUrlPattern(item);
                    if (false !== urlPattern) {
                        links.push({
                            name: null,
                            addr: urlPattern
                        });
                        return;
                    }

                    //都不是，即为文本内容
                    txt = item;//如出现多次，只保留最后一次

                    //-------------指定行的项结束----------------------
                });
            }

            //整行加载完之后，设置日期项对应的文本
            if (dateItem) {
                dateItem.txt = txt;
            }

            let nd = {
                lev: lev,
                str: txt,
                left: false,
                par: null,
                color: lineColor,
                memo: memo,
                links: links,
                childs: [],
                leaf: false,         //是否为叶节点
                expand: expand,      //默认全部展开
                ref: ref,
                dateItem: dateItem,
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

        return root;
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
        //今天到大后天
        else if (now <= assignedDate && dist <= 3) {
            dateItem.color = defaultDateColor.near;
            dateItem.near=true;
            let dayNames = ["今天", "明天", "后天", "大后天"];
            dateItem.msg = dayNames[dist];
        }
        //以后
        else {
            dateItem.color = defaultDateColor.future;
            dateItem.future=true;
            dateItem.msg = "还剩 " + dist + " 天";
        }

        //手动指定了颜色，则覆盖掉前面的颜色设置。可能是 "" 或 "red" 的格式，如果是空，则在计算节点颜色时会设置上
        if ('undefined'!==typeof(colorPart)) {
            dateItem.color = colorPart;
        }
        return dateItem;
    }


    /**
     * 把内容拆分为
     */
    loadParts = (alltxts) => {
        let refs = {};
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
            if (trimLine.startsWith("# ref:") && trimLine.length > "# ref:".length) {
                currRefName = trimLine.substring("# ".length);
                return;
            }
            //还没有当前标识符
            if (null == currRefName) {
                return;
            }
            //是已记录过的引用
            if ("undefined" !== typeof (refs[currRefName])) {
                // console.log("添加内容 "+currRefName,'\n['+line+']');
                refs[currRefName] += '\n' + line;
                return;
            }
            //是新引用
            // console.log("添加新内容 "+currRefName,'['+line+']');
            refs[currRefName] = line;
            return;
        });

        return { ndLines, refs };
    }

    setLeaf = (nd) => {
        nd.leaf = (0 === nd.childs.length);
        nd.childs.forEach(child => {
            this.setLeaf(child);
        });
    }

    hasUrlPrefix = (url) => {
        return (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("ftp://") || url.startsWith("ftps://"));
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
let defaultDateColor = {
    expired:'#f5222d',//'red', //过期
    near:'orange',    //近几天
    future:'#fa8c16',//'#73d13d',//'green'   //以后
};

let defaultLineColor = null;
let bordType = null;
let getBorderStyle = null;
let themeStyles = [null, null, null];

export default new MindmapSvc();