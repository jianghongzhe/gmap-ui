/** @jsxImportSource @emotion/react */
import React from 'react';
import { Tabs, Modal, Button } from 'antd';
import {withEnh} from '../../../common/specialDlg';
import api from '../../../../service/api';
import imgUrlPie from '../../../../assets/graph_pie.png';
import imgUrlBar from '../../../../assets/graph_bar.png';
import imgUrlLine from '../../../../assets/graph_line.png';
import imgUrlStack from '../../../../assets/graph_stack.png';
import imgUrlMix from '../../../../assets/graph_mix.png';
import imgUrlScatter from '../../../../assets/graph_scatter.png';
import imgUrlRela from '../../../../assets/graph_rela.png';
import imgUrlEchart from '../../../../assets/graph_echart.png';

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
                size={{w: 960}}
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
                            <Button type='link' css={{paddingLeft:0,}} onClick={api.openUrl.bind(this,'https://katex.org/docs/supported.html')}>Latex 语法说明（```latex）</Button>
                        </div>

                        <div>
                            <Button type='link' css={{paddingLeft:0,}} onClick={api.openUrl.bind(this,'https://mermaid-js.github.io/mermaid/#/flowchart')}>基于mermaid的图表（```mermaid）</Button>
                        </div>
                        <div>
                            <Button type='link' css={{paddingLeft:0,}} onClick={api.openUrl.bind(this,'https://flowchart.js.org/')}>流程图（```flow）</Button>
                        </div>
                        <div>
                            <Button type='link' css={{paddingLeft:0,}} onClick={api.openUrl.bind(this,'https://bramp.github.io/js-sequence-diagrams/')}>时序图（```sequence）</Button>
                        </div>

                        
                        
                        
                    </div>
                </TabPane>
                <TabPane tab="markdown扩展" key="3" className='tabitem'>
                    <div className='wrapper'>
                        <table css={helpTableStyle}>
                            <tbody>
                            <tr>
                                <th>名称</th>
                                <th>用法示例</th>
                            </tr>
                            {
                                markdownExts.map((item,ind)=>(
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
                    </div>
                </TabPane>
                <TabPane tab="Echart图" key="4" className='tabitem'>
                    <div className='wrapper'>
                    <table css={helpTableStyle}>
                            <tbody>
                            <tr>
                                <th style={{width:'100px'}}>图表名称</th>
                                <th>用法示例</th>
                                <th>图示</th>
                            </tr>
                            <tr>
                                <td>饼图</td>
                                <td>
                                    <div>
                                        <div>
                                            <div className='chartItem' style={{width:'200px'}}> 
                                                ```echart<br/>
                                                pie<br/>
                                                title 饼图<br/>
                                                w 50%<br/>
                                                h 200px<br/>
                                                "食品": 500<br/>
                                                "娱乐": 600<br/>
                                                "医疗": 500<br/>
                                                ```
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{textAlign:'center'}}>
                                    <img src={imgUrlPie} style={{width:'320px'}} alt="饼图"/>
                                </td>
                            </tr>
                            <tr>
                                <td>柱状图</td>
                                <td>
                                    <div>
                                        <div>
                                            <div className='chartItem'>
                                                ```echart<br/>
                                                bar<br/>
                                                title 柱状图<br/>
                                                w 50%<br/>
                                                h 200px<br/>
                                                x 横轴名称<br/>
                                                y 纵轴名称<br/>
                                                ,2018,2019,2020<br/>
                                                食品,500,400,300<br/>
                                                娱乐,600,400,600<br/>
                                                医疗,500,200,300<br/>
                                                ```
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{textAlign:'center'}}>
                                    <img src={imgUrlBar} style={{width:'320px'}} alt="柱状图"/>
                                </td>
                            </tr>
                            <tr>
                                <td>折线图</td>
                                <td>
                                    <div>
                                        <div>
                                            <div className='chartItem'>
                                                ```echart<br/>
                                                line<br/>
                                                title 折线图<br/>
                                                w 50%<br/>
                                                h 200px<br/>
                                                x 横轴名称<br/>
                                                y 纵轴名称<br/>
                                                ,2018,2019,2020<br/>
                                                食品,500,400,300<br/>
                                                娱乐,600,400,600<br/>
                                                医疗,500,200,300<br/>
                                                ```
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{textAlign:'center'}}>
                                    <img src={imgUrlLine} style={{width:'320px'}} alt="折线图"/>
                                </td>
                            </tr>
                            <tr>
                                <td>堆积图</td>
                                <td>
                                    <div>
                                        <div>
                                            <div className='chartItem'>
                                                ```echart<br/>
                                                stack<br/>
                                                title 堆积图<br/>
                                                w 50%<br/>
                                                h 200px<br/>
                                                x 横轴名称<br/>
                                                y 纵轴名称<br/>
                                                ,2018,2019,2020<br/>
                                                食品,500,400,300<br/>
                                                娱乐,600,400,600<br/>
                                                医疗,500,200,300<br/>
                                                ```
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{textAlign:'center'}}>
                                    <img src={imgUrlStack} style={{width:'320px'}} alt="堆积图"/>
                                </td>
                            </tr>
                            <tr>
                                <td>柱线混合图</td>
                                <td>
                                    <div>
                                        <div>
                                            <div className='chartItem'>
                                                ```echart<br/>
                                                bar-line<br/>
                                                title 柱线混合图<br/>
                                                w 50%<br/>
                                                h 200px<br/>
                                                x 横轴名称<br/>
                                                y 纵轴名称<br/>
                                                ,2018,2019,2020<br/>
                                                stack 食品<br/>
                                                - bar,三餐,500,400,300<br/>
                                                - bar,食品,500,400,300<br/>
                                                bar,娱乐,600,400,600<br/>
                                                line,参考值,500,200,300<br/>
                                                ```
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{textAlign:'center'}}>
                                    <img src={imgUrlMix} style={{width:'320px'}} alt="柱线混合图"/>
                                </td>
                            </tr>
                            <tr>
                                <td>散点图</td>
                                <td>
                                    <div>
                                        <div>
                                            <div className='chartItem'>
                                                ```echart<br/>
                                                scatter<br/>
                                                title 散点图<br/>
                                                w 50%<br/>
                                                h 200px<br/>
                                                x 横轴名称<br/>
                                                y 纵轴名称<br/>
                                                第一类, 15.0 8.04, 8.07 7.97, 13.0 7.58<br/>
                                                第二类, 9.05 8.81, 11.0 8.33, 14.0 7.96<br/>
                                                ```
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{textAlign:'center'}}>
                                    <img src={imgUrlScatter} style={{width:'320px'}} alt="散点图"/>
                                </td>
                            </tr>
                            <tr>
                                <td>关系图</td>
                                <td>
                                    <div>
                                        <div>
                                            <div className='chartItem'>     
                                                ```echart<br/>
                                                graph<br/>
                                                title 关系图<br/>
                                                w 100%<br/>
                                                h 400px<br/>
                                                张三,李四,同学<br/>
                                                李四,王五,夫妻<br/>
                                                张三,王五,发小<br/>
                                                张三,小明<br/>
                                                张三,小华<br/>
                                                ```
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{textAlign:'center'}}>
                                    <img src={imgUrlRela} style={{width:'320px'}} alt="关系图"/>
                                </td>
                            </tr>
                            <tr>
                                <td>使用json配置</td>
                                <td>
                                    <div>
                                        <div>
                                            <div className='chartItem'>
                                                ```echart<br/>
                                                {'{'}<br/>
                                                    <div css={{marginLeft:'20px'}}>w: '50%',</div>
                                                    <div css={{marginLeft:'20px'}}>h: '200px',</div>
                                                    <div css={{marginLeft:'20px'}}>{'//'} echart官方配置项</div>
                                                {'}'}<br/>
                                                ```
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{textAlign:'center'}}>
                                    <img src={imgUrlEchart} style={{width:'100px'}} alt="自定义json配置"/>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </TabPane>
                <TabPane tab="快捷键" key="5" className='tabitem'>
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
        ['[打开](file:///%java_home%\\bin)','// 从环境变量匹配路径并执行'],
        ['[打开](file:///control)','// 从path环境变量或注册表app path匹配路径并执行'],
        ['[打开方式](openas://d:\\xx.txt)','// 选择打开方式'],
        ['[打开](openby://d:\\a.txt@@nt)','// 用指定打开方式打开文件'],
        ['[打开](diropenby://d:\\a\\b@@code)','// 用指定打开方式打开目录'],
        ['[打开](openin://d:\\a.exe@@f:\\x\\y)','// 以指定目录为当前目录打开指定文件'],
        ['[选择](dir://d:\\a\\b.txt)','// 打开目录并选择指定文件或目录'],
        ['[打开](filex://d:\\a\\b.txt)','// 相当于file、openas、dir、cppath的组合'],
        ['[打开](dirx://d:\\a\\b\\c)','// 相当于file、dir、cppath的组合'],
        ['[执行](cmd://dir d:\\)','// 执行命令，使用 <span style="color:black;">[space]\\</span> 表示换行'],
        ['[执行](cmdp://ping 127.0.0.1)','// 执行命令并在结尾加一条 pause 指令'],       
        ['[执行](cmdopen://d:\\abc)','// 从命令提示符打开指定目录'],
        ['[复制](cp://这是一段文本)','// 复制内容，使用 <span style="color:black;">[space]\\</span> 表示换行'],
        ['[复制](cppath://这是一段文本)','// 复制路径，如果路径无效则提示错误'],
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
    ['子节点全在右侧',[
        ['right:','// 只对根节点设置有效']
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


                          
                                     
                                       
                                      

                       
                         
                          
const markdownExts=[
    ['行内latex','$a_{1}^{2}+b_{1}=c$',''],
    ['文字高亮','==高亮==',''],
    ['上标','a^2^=9',''],
    ['下标','H--2--O',''],
];


const refs=[
    ['开始标志','***','// 第一次出现表示引用开始'],
    ['文字引用','# tref:xxx','// 节点内容可分多行写'],
    ['文字正文','Markdown语法','// 多行会连接为一行，除非指定 | 符号'],
    ['引用名称','# ref:xxx','// 对应节点中的设置'],
    ['引用正文','Markdown语法','// 支持github markdown及latex'],
    //['关系图引用','# graph:xxx','// 对应节点中的设置'],
    //['关系图正文','- 名称1,名称2,关系1','// 每行一个关系，可写多行'],
    ['打开方式引用','# openers',''],
    ['打开方式正文','[txt]: notepad','// txt对应节点openby协议中@@后的部分'],
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
            ['Tab','跳转到ref或tref定义位置'],
            ['Ctrl + Alt+ ↓','复制当前行到下一行'],
            ['Ctrl + Alt+ ↑','复制当前行到上一行'],
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
        '& .tabitem div.wrapper .chartTitle': {
            fontSize:'20px',
            fontWeight:'bold',
        },
        '& .tabitem div.wrapper .chartItem': {
            color:'grey'
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
        width:250,
        // backgroundColor:'red',
        // textAlign:'center',
    },
    '& td:nth-child(2) > div > div > div:nth-child(2)': {
        textAlign: 'left',
        color:'#BBB',
    },
};

export default React.memo(HelpDlg);