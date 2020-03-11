/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { Component } from 'react';
import mindmapSvc from './mindmapSvc';

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
                "\t\t- c:red|树|m:哈哈",
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
                "\t\t- c:blue|图",
                "\t\t\t- 遍历",
                "\t\t\t\t- 深度",
                "\t\t\t\t- 广度",
                "\t\t\t- 有向",
                "\t\t\t- 无向",
                "\t\t\t- 带权",
                
            ],
            cells:[]
        };

        
    }

    toggleExpand=(cell)=>{
        // alert(cell.nd.str);
        let cells=mindmapSvc.toggleExpandNode(cell);
        this.setState({
            cells:cells
        });
    }

    componentDidMount(){
        let cells=mindmapSvc.parseMindMapData(this.state.txts,defaultLineColor,centerThemeStyle,bordType,getBorderStyle);
        this.setState({
            cells:cells
        });
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
                                    {(item.nd && false===item.nd.leaf) && <button onClick={this.toggleExpand.bind(this,item)}>{item.nd.expand ? "-" : "+"}</button>}
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



const defaultLineColor='lightgrey';

//边框类型枚举
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

//根据边框类型动态生成对应的样式
const getBorderStyle=(type,color='lightgrey')=>{
    if(bordType.l===type){
        return css`border-left:2px solid ${color};`;
    }
    if(bordType.r===type){
        return css`border-right:2px solid ${color};`;
    }
    if(bordType.t===type){
        return css`border-top:2px solid ${color};`;
    }
    if(bordType.b===type){
        return css`border-bottom:2px solid ${color};`;
    }

    if(bordType.rbRad===type){
        return css`border-bottom-right-radius:14px;`;
    }
    if(bordType.lbRad===type){
        return css`border-bottom-left-radius:14px;`;
    }
    if(bordType.rtRad===type){
        return css`border-top-right-radius:14px;`;
    }
    if(bordType.ltRad===type){
        return css`border-top-left-radius:14px;`;
    }
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




export default Mindmap;