/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { Component } from 'react';
import mindmapSvc from './mindmapSvc';
import { Layout, Menu, Breadcrumb,Tabs,Button,Tooltip } from 'antd';
import { PlusCircleOutlined,MinusCircleOutlined,EditOutlined,FormOutlined } from '@ant-design/icons';

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
                "\t\t\t\t- 后缀表达式计算|m:见数进栈|m:见符号取两数计算结果进栈|m:直到最后一个数即为结果",
                "\t\t- 队列",
                "\t\t\t- 优先队列",
                "\t- 非线性结构",
                "\t\t- 二维表",
                "\t\t- 多维表",
                "\t\t- 广义表",
                "\t\t- 哈希表",
                "\t\t- c:red|树|m:哈哈|m:第二一个|m:第三个",
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

    

    componentDidMount(){
        // let cells=mindmapSvc.parseMindMapData(this.state.txts,defaultLineColor,centerThemeStyle,bordType,getBorderStyle);
        // this.setState({
        //     cells:cells
        // });
    }


    render() {
        //style={{'width':'800px','marginTop':'20px' }}
        return (
            <table border='0' cellSpacing='0' cellPadding='0'  align='center' css={mindTabStyle}>
                <tbody>
                {
                    this.props.cells.map((line,rowInd)=>
                        <tr key={rowInd}>
                        <td className='paddingcell'></td>
                        {
                            line.map((item,colInd)=>
                                <td key={colInd} css={item.cls}>
                                    {/* {
                                        (item.nd && false===item.nd.leaf && (null!=item.nd.par && true===item.nd.left)) && 
                                        <Button type="link" size='small' title={item.nd.expand?"折叠":"展开"} className='btn' icon={item.nd.expand ?<MinusCircleOutlined className='icon' />:<PlusCircleOutlined className='icon' />}  onClick={this.props.onToggleExpand.bind(this,item)}/>
                                    } */}

                                    <span className='themetxt'>
                                        {item.txt}
                                        {
                                            (item.nd && item.nd.memo && 0!==item.nd.memo.length) && 
                                            <Tooltip title={
                                                <div>
                                                    {
                                                        item.nd.memo.map((eachmemo,memoInd)=><div key={memoInd}>{eachmemo}</div>)
                                                    }
                                                </div>
                                            }><FormOutlined className='memoicon'/></Tooltip>
                                        }
                                    </span>
                                    {
                                        (item.nd && false===item.nd.leaf ) && 
                                        <Button type="link" size='small' title={item.nd.expand?"折叠":"展开"} className='btn' icon={item.nd.expand ?<MinusCircleOutlined className='icon' />:<PlusCircleOutlined className='icon' />}  onClick={this.props.onToggleExpand.bind(this,item)}/>
                                    }
                                </td>    
                            )
                        }
                        <td className='paddingcell'></td>
                        </tr>
                    )
                }
                </tbody>
            </table>
        );
    }

    

    
}

const mindTabStyle=css`
    border-collapse: separate;
    max-width:999999999px;
    margin-left:auto;
    margin-right:auto;

    & td{
        padding-left:14px;
        padding-right:14px;
        white-space:nowrap;
        text-align:left;
    }

    & td.paddingcell{
        padding-left:16px;
        padding-right:16px;
    }

    & td .memoicon{
        font-size:16px;
        line-height:16px;
        margin-left:5px;
        color:#fa8c16;
    }
`; 
// css`
//     border-collapse: separate;
//     max-width:999999999px;


//     & td{
//         font-size:14px;
//         padding-left:20px;
//         padding-right:20px;
//         padding-top:12px;
//         padding-bottom:0px;
//         vertical-align:bottom;
//         white-space:nowrap;
//     }

//     & td .memoicon{
//         font-size:16px;
//         line-height:16px;
//         margin-left:5px;
//         color:#fa8c16;
//     }

//     & td .themetxt{
//         font-size:14px;
//         line-height:16px;
//         vertical-align:bottom;
//         white-space:nowrap;
//         display:inline-block;
//         margin-bottom:0px;
//         padding-bottom:0px;
//     }

//     & td .btn{
//         width:18px;
//         height:18px;
//         font-size:14px;
//         line-height:16px;
//         margin:0px;
        
//         margin-left:5px;
//         margin-right:5px;
//         padding:0px;
//         vertical-align:bottom;
//     }

//     & td .btn .icon{
//         font-size:14px;
//         line-height:18px;
//         margin:0px;
//         padding:0px;
//     }
// `;






export default Mindmap;