const config= {

    /**
     * 导图连接线的默认颜色
     */
    defaultLineColor: 'lightgrey',

    /**
     * 日期图标的颜色
     */
    defaultDateColor: {
        expired: '#f5222d',//red', //过期
        near: '#fa8c16',//'orange',    //近几天
        future: '#389e0d',//'#73d13d',//'green'   //以后
    },

    /**
     * 导图连接线的z轴位置，
     * general: 默认
     * promote: 用于突出显示带颜色的连接线，以免被覆盖
     */
    lineZIndex:{
        general: 0,
        promote: 1,
    },

    /**
     * 节点的z轴位置
     */
    nodeZIndex: 2,

    /**
     * 展开/折叠按钮z轴位置
     */
    expBtnZIndex: 2,

    /**
     * 关联线z轴位置
     */
    relaLineZIndex: 1,

    /**
     * 帮助对话框z轴位置
     */
    helpDlgZIndex: 2000,

    /**
     * 水平布局相关属性：
     * ndXDistRoot - 根节点到子节点之间最小水平距离（该值还要与根据夹角角度的计算值比较后取最大）
     * ndXDist - 二级或以下节点到子节点之间最小水平距离（该值还要与根据夹角角度的计算值比较后取最大）
     * dynDdXDistAngleDegree - 节点与子树夹角的大小，单位为度
     * nodePaddingTop - 节点垂直方向的间距
     */
    hlayout: {
        ndXDistRoot: 60,
        ndXDist: 40,//40,
        dynDdXDistAngleDegree: 13,
        nodePaddingTop: 10,
    },
};

export default config;