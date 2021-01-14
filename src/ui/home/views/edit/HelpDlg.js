/** @jsxImportSource @emotion/react */
import React from 'react';
import { Layout, Input, Tabs, Modal, Form, message, Button, Divider, Popover } from 'antd';
import {withEnh} from '../../../common/specialDlg';
import api from '../../../../service/api';

const EnhDlg=withEnh(Modal);

const { TabPane } = Tabs;

/**
 * 帮助对话框
 * @param {*} props 
 */
const HelpDlg=(props)=>{
    return (
        <EnhDlg noFooter
                title="帮助"
                closable={true}
                size={{w: 800}}
                visible={props.visible}
                onCancel={props.onCancel}>
            
            <Tabs tabPosition='left' css={getTabsStyle(props.maxBodyH)}>
                <TabPane tab="节点部分" key="1" className='tabitem'>
                    <div className='wrapper'>
                        <table css={helpTableStyle}>
                            <tbody>
                            <tr>
                                <th>类型</th>
                                <th>用法示例</th>
                            </tr>
                            {
                                nodes.map((item,ind)=>(
                                    <tr key={ind}>
                                        <td>{item[0]}</td>
                                        <td>
                                            {
                                                item[1].map((subitem,subInd)=>(
                                                    <div key={''+ind+"_"+subInd}>
                                                        <div>
                                                            <div>{subitem[0]}</div>
                                                            <div dangerouslySetInnerHTML={{__html:subitem[1]}}></div>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                            
                                        </td>
                                    </tr>
                                ))
                            }
                            </tbody>
                        </table>
                    </div>
                </TabPane>
                <TabPane tab="引用部分" key="2" className='tabitem'>
                    <div className='wrapper'>
                        <table css={helpTableStyle}>
                            <tbody>
                            <tr>
                                <th>类型</th>
                                <th>用法示例</th>
                            </tr>
                            {
                                refs.map((item,ind)=>(
                                    <tr key={ind}>
                                        <td>{item[0]}</td>
                                        <td>
                                            <div>
                                                <div>
                                                    <div>{item[1]}</div>
                                                    <div>{item[2]}</div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            }
                            </tbody>
                        </table>
                        <div css={{marginTop:'10px',}}>
                            <Button type='link' css={{paddingLeft:0,}} onClick={api.openUrl.bind(this,'https://guides.github.com/features/mastering-markdown/')}>Markdown 语法说明</Button>
                        </div>
                        <div>
                            <Button type='link' css={{paddingLeft:0,}} onClick={api.openUrl.bind(this,'https://katex.org/docs/supported.html')}>Latex 语法说明</Button>
                        </div>
                    </div>
                </TabPane>
                <TabPane tab="快捷键" key="3" className='tabitem'>
                    <div className='wrapper'>
                        <table css={helpTableStyle}>
                            <tbody>
                            {
                                shortcuts.map((item,ind)=><React.Fragment key={ind}>
                                    <tr key={ind}>
                                        <th colSpan='2' css={{fontWeight:'bold',}}>{item.title}</th>
                                    </tr>
                                    <tr>
                                        <th>按键</th>
                                        <th>功能</th>
                                    </tr>
                                    <React.Fragment>
                                    {
                                        item.rows.map((row,rowInd)=><tr key={ind+"_"+rowInd}>
                                            <td>{row[0]}</td>
                                            <td>
                                                <div>
                                                    <div>
                                                        <div>{row[1]}</div>
                                                        <div></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>)
                                    }
                                    </React.Fragment>
                                </React.Fragment>)
                            }
                            </tbody>
                        </table>
                    </div>
                </TabPane>
            </Tabs>
        </EnhDlg>
    );
    
}

const nodes=[
    ['项目符号',[
        ['- aaa',"// '-' 前用[tab]表示层级关系"],
    ]],
    ['文本',[
        ['aaabbb','// 单行文本'],
        ['aaa|bbb','// 多行用 <span style="color:black;">|</span> 分隔'],
        ['ls \\| grep aa','// 使用 <span style="color:black;">\\|</span> 来显示竖线'],
        ['press `ctrl` + `c`','// 支持markdown语法'],
        ['[打开](file:///d:\\a\\b.txt)','// 执行文件或打开目录'],
        ['[选择](dir:///d:\\a\\b.txt)','// 打开目录并选择指定文件或目录'],
        ['[执行](cmd:///dir d:\\)','// 执行命令，使用 <span style="color:black;">[space]\\</span> 表示换行'],
        ['[复制](cp:///这是一段文本)','// 复制内容，使用 <span style="color:black;">[space]\\</span> 表示换行'],
    ]],
    ['线条颜色',[
        ['c:red',''],
        ['c:#fbfbfb',''],
        ['c:rgba(80,90,20,0.5)',''],
    ]],
    ['简短说明',[
        ['m:说明1',''],
        ['m:说明x|m:说明y','// 多条说明用 | 分隔'],
    ]],
    ['日期',[
        ['d:10/8/2','// 可使用 / . - 分隔'],
        ['d:10-8-2',"// 无 ',' 则自动计算颜色"],
        ['d:10.8.2',''],
        ['d:10.8.2,','// 使用线条的颜色'],
        ['d:10.8.2,red','// 指定颜色'],
    ]],
    ['进度',[
        ['p:10','// 进行中'],
        ['p:100','// 已完成'],
        ['p:-30','// 出错'],
    ]],
    ['甘特图',[
        ['基本格式','// id、起始或引用id、结束或天数、进度'],
        ['g:id,20.4.6,20.4.7,30','// id、起始、结束、进度'],
        ['g:id,refid,8,30','// 引用任务的后一天为起始时间</div></div>'],
        ['g:id,refid+2,20,30','// 引用任务可以向后(+)或向前(-)N天'],
    ]],
    ['默认折叠',[
        ['zip:','']
    ]],
    ['引用文字替换',[
        ['tref:xxx','// 对应引用部分 # tref:xxx']
    ]],
    ['长段独立引用',[
        ['ref:xxx','// 对应引用部分 # ref:xxx'],
    ]],
    ['链接',[
        ['http://aa.bb','// 普通链接'],
        ['[某网](http://cc.dd)','// markdown格式链接'],
    ]]
];


                          
                                     
                                       
                                      

                       
                         
                          



const refs=[
    ['开始标志','***','// 第一次出现表示引用开始'],
    ['文字引用','# tref:xxx','// 节点内容可分多行写'],
    ['文字正文','Markdown语法','// 多行会连接为一行，除非指定 | 符号'],
    ['引用名称','# ref:xxx','// 对应节点中的设置'],
    ['引用正文','Markdown语法','// 支持github markdown及latex'],
];


const shortcuts=[
    {
        title:'导图编辑窗口',
        rows:[
            ['Ctrl + S','只保存'],
            ['Ctrl + Shift + S','保存并关闭'],
            ['Ctrl + F','查找对话框'],
            ['Enter','下一个'],
            ['Shift + Enter','上一个'],
            ['Ctrl + G','跳转到指定行'],
            ['Ctrl + P','插入图片'],
            ['Ctrl + I','插入附件'],
            ['Ctrl + T','插入日期'],
            ['Ctrl + H','打开帮助页'],
        ]
    },
    {
        title:'导图浏览窗口',
        rows:[
            ['Alt+W','关闭当前选项卡'],
            ['Alt+Shift+W','关闭所有选项卡'],
            ['Alt+O','关闭其它选项卡'],
            ['Alt+P','关闭右侧选项卡'],
            ['Alt+I','关闭左侧选项卡'],
            ['Ctrl+PageUp','选中前一个选项卡'],
            ['Ctrl+PageDown','选中后一个选项卡'],
            ['Ctrl+Shift+PageUp','当前选项卡前移'],
            ['Ctrl+Shift+PageDown','当前选项卡后移'],
        ]
    }
];



                          
                  


const getTabsStyle=(maxH)=>{
    let requireH=600;
    let itemMaxH=maxH-0;
    let factH=(requireH>itemMaxH ? itemMaxH : requireH);

    return {
        '& .tabitem div.wrapper': {
            minHeight: factH,
            maxHeight: factH,
            height:    factH,
            overflowY: 'auto',
            overflowX: 'hidden',
        },
    }
};


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
        width: 120,
        textAlign:'left',
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
        width:180,
        // backgroundColor:'red',
        // textAlign:'center',
    },
    '& td:nth-child(2) > div > div > div:nth-child(2)': {
        textAlign: 'left',
        color:'#BBB',
    },
};

export default React.memo(HelpDlg);