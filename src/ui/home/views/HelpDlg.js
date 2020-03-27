/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Layout, Input, Tabs, Modal, Form, message, Button, Divider, Popover } from 'antd';

class HelpDlg extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }
    render() {
        return (
            <Modal
                title="帮助"
                footer={null}
                closable={true}
                css={{
                    width: 600,
                    minWidth: 600,
                    maxWidth: 600
                }}
                visible={this.props.visible}
                onCancel={this.props.onCancel}>
                <div css={{
                    maxHeight: this.props.maxBodyH,
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}>
                    <div css={helpTitleStyle}>节点部分</div>
                    <table css={helpTableStyle}>
                        <tr>
                            <th>类型</th>
                            <th>用法示例</th>
                        </tr>
                        <tr>
                            <td>项目符号</td>
                            <td>
                                <div>
                                    <div>
                                        <div>- aaa</div>
                                        <div>// '-' 前用tab表示层级关系</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>文本</td>
                            <td>
                                <div>
                                    <div>
                                        <div>aaabbb</div>
                                        <div>// 单行文本</div>
                                    </div>
                                    <div>
                                        <div>aaa|bbb</div>
                                        <div>// 多行用 | 分隔</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>线条颜色</td>
                            <td>
                                <div>
                                    <div>
                                        <div>c:red</div>
                                        <div></div>
                                    </div>
                                    <div>
                                        <div>c:#fbfbfb</div>
                                        <div></div>
                                    </div>
                                    <div>
                                        <div>c:rgba(80,90,20,0.5)</div>
                                        <div></div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>简短说明</td>
                            <td>
                                <div>
                                    <div>
                                        <div>m:说明1</div>
                                        <div></div>
                                    </div>
                                    <div>
                                        <div>m:说明x|m:说明y</div>
                                        <div>// 多条说明用 | 分隔</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>日期</td>
                            <td>
                                <div>
                                    <div>
                                        <div>d:10/8/2</div>
                                        <div>// 可使用 / . - 分隔</div>
                                    </div>
                                    <div>
                                        <div>d:10-8-2</div>
                                        <div>// 无 ',' 则自动计算颜色</div>
                                    </div>
                                    <div>
                                        <div>d:10.8.2</div>
                                        <div></div>
                                    </div>
                                    <div>
                                        <div>d:10.8.2,</div>
                                        <div>// 使用线条的颜色</div>
                                    </div>
                                    <div>
                                        <div>d:10.8.2,red</div>
                                        <div>// 指定颜色</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>进度</td>
                            <td>
                                <div>
                                    <div>
                                        <div>p:10</div>
                                        <div>// 进行中</div>
                                    </div>
                                    <div>
                                        <div>p:100</div>
                                        <div>// 已完成</div>
                                    </div>
                                    <div>
                                        <div>p:-30</div>
                                        <div>// 出错</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>默认折叠</td>
                            <td>
                                <div>
                                    <div>
                                        <div>zip:</div>
                                        <div></div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>长段引用</td>
                            <td>
                                <div>
                                    <div>
                                        <div>ref:xxx</div>
                                        <div>// 对应引用部分 # ref:xxx</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>链接</td>
                            <td>
                                <div>
                                    <div>
                                        <div>http://aa.bb</div>
                                        <div>// 普通链接</div>
                                    </div>
                                    <div>
                                        <div>[某网](http://cc.dd)</div>
                                        <div>// markdown格式链接</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>

                    <div css={helpTitleStyle}>引用部分</div>
                    <table css={helpTableStyle}>
                        <tr>
                            <th>类型</th>
                            <th>用法示例</th>
                        </tr>
                        <tr>
                            <td>开始标志</td>
                            <td>
                                <div>
                                    <div>
                                        <div>***</div>
                                        <div>// 每一次出现表示引用开始</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>引用名称</td>
                            <td>
                                <div>
                                    <div>
                                        <div># ref:xxx</div>
                                        <div>// 对应节点中的设置</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>正文</td>
                            <td>
                                <div>
                                    <div>
                                        <div>Markdown语法</div>
                                        <div>// 包括github扩展的表格等</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
            </Modal>
        );
    }
}


const helpTitleStyle={
    fontSize:16,
    fontWeight:'bold',
    marginBottom:5,
    '&:nth-last-of-type(1)':{
        marginTop:20,
    }
}

const helpTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    border: '1px solid lightgrey',
    '& td,& th': {
        border: '1px solid lightgrey',
        padding: '5px 10px',
    },
    '& th': {
        textAlign: 'center',
    },
    '& td:nth-child(1)': {
        width: 100,
        textAlign:'center',
    },
    '& td:nth-child(2) > div': {
        display: 'table',
        width: '100%',
        // backgroundColor:'lightblue',
    },
    '& td:nth-child(2) > div > div': {
        display: 'table-row',
    },
    '& td:nth-child(2) > div > div > div': {
        display: 'table-cell',
    },
    '& td:nth-child(2) > div > div > div:nth-child(1)': {
        width:150,
        // backgroundColor:'red',
        // textAlign:'center',
    },
    '& td:nth-child(2) > div > div > div:nth-child(2)': {
        textAlign: 'left',
        color:'#BBB',
    },
};

export default HelpDlg;