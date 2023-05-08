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
import globalStyleConfig from '../../../../common/globalStyleConfig';
import styles from './HelpDlg.module.scss';

const EnhDlg=withEnh(Modal);

/**
 * 帮助对话框
 * @param {*} props 
 */
const HelpDlg=(props)=>{
    return (
        <EnhDlg noFooter
                title="帮助"
                closable={true}
                size={{w: 1100}}
                visible={props.visible}
                zIndex={globalStyleConfig.helpDlgZIndex}
                onCancel={props.onCancel}>
            
            <Tabs tabPosition='left' className={styles.tabContainer}
                items={[
                    {
                        label:'节点部分',
                        key:"1",
                        className: "tabitem",
                        children: (
                            <div className="wrapper">
                                <table className="helpTable nodes">
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
                                                                    <div>
                                                                        {
                                                                            Array.isArray(subitem[1]) ?
                                                                                (
                                                                                    subitem[1].map((line,lineInd)=>(
                                                                                        <div key={lineInd} dangerouslySetInnerHTML={{__html:line}}></div>
                                                                                    ))
                                                                                )
                                                                                :
                                                                                (<div dangerouslySetInnerHTML={{__html:subitem[1]}}></div>)
                                                                        }
                                                                    </div>

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
                        )
                    },
                    {
                        label:'引用部分',
                        key:"2",
                        className: "tabitem",
                        children: (
                            <div className="wrapper">
                                <table className="helpTable refs">
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
                                                            <div>
                                                                <MultiLineTxt txt={item[1]} retainEmptyLine={true}/>
                                                            </div>
                                                            <div>
                                                                <MultiLineTxt txt={item[2]} retainEmptyLine={true}/>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                    </tbody>
                                </table>
                                <div className="linkItemContainer">
                                    <div>
                                        <Button type='link' className="btn" onClick={api.openUrl.bind(this,'https://guides.github.com/features/mastering-markdown/')}>Markdown 语法说明</Button>
                                    </div>
                                    <div>
                                        <Button type='link' className="btn" onClick={api.openUrl.bind(this,'https://katex.org/docs/supported.html')}>Latex 语法说明（```latex```）</Button>
                                    </div>
                                    <div>
                                        <Button type='link' className="btn" onClick={api.openUrl.bind(this,'https://mermaid-js.github.io/mermaid/#/flowchart')}>基于mermaid的图表（```mermaid```）</Button>
                                    </div>
                                    <div>
                                        <Button type='link' className="btn" onClick={api.openUrl.bind(this,'https://flowchart.js.org/')}>流程图（```flow```）</Button>
                                    </div>
                                    <div>
                                        <Button type='link' className="btn" onClick={api.openUrl.bind(this,'https://bramp.github.io/js-sequence-diagrams/')}>时序图（```sequence```）</Button>
                                    </div>
                                </div>
                            </div>
                        )
                    },
                    {
                        label: 'markdown扩展',
                        key: "3",
                        className: "tabitem",
                        children: (
                            <div className="wrapper">
                                <table className="helpTable">
                                    <tbody>
                                    <tr>
                                        <th>名称</th>
                                        <th>用法示例</th>
                                    </tr>
                                    {
                                        markdownExts.map((item, ind) => (
                                            <tr key={ind}>
                                                <td>{item[0]}</td>
                                                <td>
                                                    <div>
                                                        <div>
                                                            <div><MultiLineTxt txt={item[1]} retainEmptyLine={true}/></div>
                                                            <div><MultiLineTxt txt={item[2]} retainEmptyLine={true}/></div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                    </tbody>
                                </table>
                            </div>
                        )
                    },
                    {
                        label: '自动补全',
                        key: "4",
                        className: "tabitem",
                        children: (
                            <div className="wrapper">
                                <table className="helpTable autocomplete">
                                    <tbody>
                                    <tr>
                                        <th>名称</th>
                                        <th>用法示例</th>
                                    </tr>
                                    {
                                        autoCompletes.map((item,ind)=>(
                                            <tr key={ind}>
                                                <td>{item[0]}</td>
                                                <td>
                                                    <div>
                                                        <div>
                                                            <div dangerouslySetInnerHTML={{__html:item[1]}}></div>
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
                        )
                    },
                    {
                        label: 'Echart图',
                        key: "5",
                        className: "tabitem",
                        children: (
                            <div className="wrapper">
                                <table className="helpTable">
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
                                                    <div className="chartItem" >
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
                                            <img src={imgUrlPie} alt="饼图"/>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>柱状图</td>
                                        <td>
                                            <div>
                                                <div>
                                                    <div className="chartItem" >
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
                                            <img src={imgUrlBar} alt="柱状图"/>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>折线图</td>
                                        <td>
                                            <div>
                                                <div>
                                                    <div className="chartItem" >
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
                                            <img src={imgUrlLine} alt="折线图"/>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>堆积图</td>
                                        <td>
                                            <div>
                                                <div>
                                                    <div className="chartItem" >
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
                                            <img src={imgUrlStack} alt="堆积图"/>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>柱线混合图</td>
                                        <td>
                                            <div>
                                                <div>
                                                    <div className="chartItem" >
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
                                            <img src={imgUrlMix} alt="柱线混合图"/>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>散点图</td>
                                        <td>
                                            <div>
                                                <div>
                                                    <div className="chartItem" >
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
                                            <img src={imgUrlScatter} alt="散点图"/>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>关系图</td>
                                        <td>
                                            <div>
                                                <div>
                                                    <div className="chartItem" >
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
                                            <img src={imgUrlRela} alt="关系图"/>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>使用json配置</td>
                                        <td>
                                            <div>
                                                <div>
                                                    <div className="chartItem" >
                                                        ```echart<br/>
                                                        {'{'}<br/>
                                                        <div className="spaceTab">w: '50%',</div>
                                                        <div className="spaceTab">h: '200px',</div>
                                                        <div className="spaceTab">{'//'} echart官方配置项</div>
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
                        )
                    },
                    {
                        label: '快捷键',
                        key: "6",
                        className: "tabitem",
                        children: (
                            <div className="wrapper">
                                <table className="helpTable">
                                    <tbody>
                                    {
                                        shortcuts.map((item,ind)=><React.Fragment key={ind}>
                                            <tr key={ind}>
                                                <th colSpan='2' className="colSpan">{item.title}</th>
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
                        )
                    }
                ]}
            >
            </Tabs>
        </EnhDlg>
    );
    
}


/**
 *
 * @param txt 字符串或字符串数组
 * @param retainEmptyLine 是否保留空行
 * @constructor
 */
const MultiLineTxt=({txt, retainEmptyLine})=>{
    if(Array.isArray(txt)){
        return txt.map((line, lineInd)=>(
                    <div key={`line-${lineInd}`}>{line}{retainEmptyLine && ''===line.trim()?'　':''}</div>
        ));
    }

    return txt;
};


const nodes=[
    ['项目符号',[
        ['- aaa',"// '-' 前用 <span style=\"color:black;\">[tab]</span> 表示层级关系"],
    ]],
    ['文本',[
        ['aaabbb','// 单行文本'],
        ['aaa|bbb','// 多行用 <span style="color:black;">|</span> 分隔'],
        ['ls \\| grep aa','// 使用 <span style="color:black;">\\|</span> 来显示竖线'],
        ['press `ctrl` + `c`','// 支持markdown语法'],
    ]],
    ['链接',[
        ['http://aa.bb','// 普通链接，不建议使用，建议使用 <span style="color:black;">[xx](yy)</span> 的方式'],
        ['[某网](http://cc.dd)','// markdown格式链接'],
        ['[打开](file:///d:\\a\\b.txt)','// 执行文件或打开目录'],
        ['[打开](file:///%java_home%\\bin)','// 从环境变量匹配路径并执行'],
        ['[打开](file:///control)','// 从path环境变量或注册表app path匹配路径并执行'],
        ['[打开方式](openas://d:\\xx.txt)','// 选择文件的打开方式'],
        ['[打开方式](openas://https://baidu.com)','// 选择网址的打开方式'],
        ['[打开](openby://d:\\a.txt@@notepad)','// 用指定打开方式打开文件'],
        ['[打开](openby://https://baidu.com@@chrome)','// 用指定打开方式打开网址'],
        ['[打开](openby://txt://-a -b -c@@aa.exe)',[
            '// 使指定程序按指定命令行参数执行；',
            '// 其中txt://表示后面内容为纯文本，不验证路径有效性；',
            '// txt://只是标识，本身并不传入命令行参数',
            '// 最终的命令为：aa.exe -a -b -c',
        ]],
        ['[打开](diropenby://d:\\a\\b@@code)','// 用指定打开方式打开目录'],
        ['[打开](openin://d:\\a.exe@@f:\\x\\y)','// 以指定目录为当前目录打开指定文件'],
        ['[选择](dir://d:\\a\\b.txt)','// 打开目录并选择指定文件或目录'],
        ['[打开](filex://d:\\a\\b.txt)','// 相当于file、openas、dir、cppath的组合'],
        ['[打开](dirx://d:\\a\\b\\c)','// 相当于file、dir、cppath的组合'],
        ['[打开](urlx://http://xxx)','// 相当于普通链接、cp的组合'],
        ['[执行](cmd://dir d:\\)','// 执行命令，使用 <span style="color:black;">[space]\\</span> 表示换行'],
        ['[执行](cmdp://ping 127.0.0.1)','// 执行命令并在结尾加一条 pause 指令'],
        ['[执行](cmdopen://d:\\abc)','// 从命令提示符打开指定目录'],
        ['[执行](start://code d:\\ws\\xxx)','// 以start "win"方式执行命令（命令窗口自动关闭）'],
        ['[复制](cp://这是一段文本)','// 复制内容，使用 <span style="color:black;">[space]\\</span> 表示换行'],
        ['[复制](cppath://这是一段文本)','// 复制路径，如果路径无效则提示错误'],
        ['[打开](grp://https://baidu.com)','// 同一节点上可指定多个组链接，以一起打开'],
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
    // ['甘特图',[
    //     ['基本格式','// id、起始或引用id、结束或天数、进度'],
    //     ['g:id,20.4.6,20.4.7,30','// id、起始、结束、进度'],
    //     ['g:id,refid,8,30','// 引用任务的后一天为起始时间</div></div>'],
    //     ['g:id,refid+2,20,30','// 引用任务可以向后(+)或向前(-)N天'],
    // ]],
    ['默认折叠',[
        ['zip:','']
    ]],
    ['子节点全在右侧',[
        ['right:','// 只对根节点设置有效']
    ]],
    ['上下结构导图',[
        ['down:','// 只对根节点设置有效']
    ]],
    ['下上结构导图',[
        ['up:','// 只对根节点设置有效']
    ]],
    ['引用文字替换',[
        ['tref:xxx','// 对应引用部分 # tref:xxx']
    ]],
    ['长段独立引用',[
        ['ref:xxx','// 对应引用部分 # ref:xxx'],
    ]],

    ['关联线',[
        ['toid:xx','// 起始位置，默认线条为灰色'],
        ['toid:xx,c:red','// 起始位置，指定线条颜色'],
        ['id:xx','// 目标位置'],
    ]]
];
           
                         
                          
const markdownExts=[
    ['行内Latex','$a_{1}^{2}+b_{1}=c$',''],
    ['文字颜色','$\\textcolor{red}{文字}$','// 可从自动完成菜单生成'],
    ['文字高亮','==高亮==',''],
    ['上标','a^2^=9',''],
    ['下标','H--2--O',''],
    [
        '图片元数据',
        [
            '',
            '![图#left](aa.jpg)',
            '![图#float-right](aa.jpg)',
            '![图#inline](aa.jpg)',
            '![图#70%](aa.jpg)',
            '![图#300px*200px](aa.jpg)',
            '![图#200px#center](aa.jpg)',
        ],
        [
            '// 名称中以 # 开头的部分为元数据',
            '// 左中右对齐：left、center、right',
            '// 浮动左右对齐：float-left、float-right',
            '// 行内样式（即：inline-block），可图文混排，不设置则默认为 block',
            '// 图片宽度设置，单位可为 px 或 %',
            '// 同时指定宽度和高度',
            '// 可同时指定多个元数据',
        ],
    ],
    [
        '表格元数据',
        [
            '',
            '|表格#bar|2015|2016|',
            '|表格#bar{w 50%,h 250px}|2015|2016|',
            '|表格#bar#line{title haha}|2015|2016|',
        ],
        [
            '// 表格列头第一个单元格中可指定元数据，以 # 开头的部分为元数据',
            '// bar-柱状图、line-拆线图、pie-饼图',
            '// 增加配置选择，与 [Echart图] 中的配置一致，多个选项以逗号分隔',
            '// 可指定多个元数据',
        ],
    ]

];

const autoCompletes=[
    ['ref:xx','跳转到引用位置','// 光标在节点内该段中任意位置时生效'],
    ['tref:yy','跳转到文字引用位置','// 光标在节点内该段中任意位置时生效'],
    ['toid:zz','跳转到指定id的节点','// 光标在节点内该段中任意位置时生效'],
    ['{d}','生成当天日期','// 光标 { } 之间或 } 右侧时生效'],
    ['{d+2}','生成后天日期','// 光标 { } 之间或 } 右侧时生效'],
    ['{d-3}','生成大前天日期','// 光标 { } 之间或 } 右侧时生效'],
];


const refs=[
    ['开始标志','***','// 第一次出现表示引用部分开始'],
    [
        '文字引用',
        [
            '# tref:xxx',
            'Markdown语法',
        ],
        [
            '// 节点内容可分多行写',
            '// 多行会连接为一行，除非指定 | 符号'
        ],
    ],
    [
        '引用',
        [
            '# ref:xxx',
            '### hello',
            '- blabla',
        ],
        [
            '// 与节点中对应的名称一致',
            '// 支持 github markdown 及 latex',
            '',
        ],
    ],
    [
        '别名',
        [
            '# alias',
            '[aa]: https://baidu.com',
            '[bb]:',
            'd:\\xx\\yy.exe',
            '[cc]:',
            'dir',
            'rem 注释1',
            '::注释2',
            '# 注释3',
            'ping 127.0.0.1',
        ],
        [
            '',
            '// 以别名作为链接地址 [](aa) ',
            '// 以别名作为打开方式 [](openby://d:\\aa.txt@@bb)',
            '// 别名内容可以另起一行',
            '// 以别名作为批处理命令内容 [](cmd://cc) ',
            '',
            '// 可用rem、#、::作为注释',
            '',
            '',
            '// 批处理命令可以是多行',
        ]
    ],
    [
        '快捷方式',
        [
            '# shortcuts',
            '- [邮箱](https://mail.163.com)',
            '- [百度](aa)',
            '- 记事本 + emeditor',
            '　- [](file:///notepad)',
            '　- [](file:///emeditor)',
        ],
        [
            '',
            '// 配置的快捷方式会出现在工具栏上',
            '// 其中可使用别名',
            '// 多个链接可一起打开，在工具栏上只占一个按钮',
            '// 子链接前面以 [tab] 缩进',
            '',
        ],
    ],
];



const shortcuts=[
    {
        title:'导图编辑窗口',
        rows:[
            ['Ctrl + S','只保存'],
            ['Ctrl + Shift + S','保存并关闭'],
            ['Ctrl + F','查找对话框'],
            ['Ctrl + Shift + F','在文件中查找对话框'],
            ['Enter','下一个'],
            ['Shift + Enter','上一个'],
            ['Ctrl + G','跳转到指定行'],
           
            ["Ctrl + B", "加粗"],
            ["Ctrl + I","倾斜"],
            ["Ctrl + D", "删除线"],
            ['Ctrl + H','打开帮助页'],
           
            ["Ctrl + 0", "去掉标题"],
            ["Ctrl + 1", "一级标题"],
            ["Ctrl + 2", "二级标题"],
            ["Ctrl + 3", "三级标题"],
            ["Ctrl + 4", "四级标题"],
            ["Ctrl + 5", "五级标题"],
            ["Ctrl + 6", "六级标题"],

            ['Ctrl + Alt+ ↓','复制当前行到下一行'],
            ['Ctrl + Alt+ ↑','复制当前行到上一行'],
            ['Alt + /','打开自动完成菜单'],
            ['Alt + Enter','打开自动完成菜单'],
            ['Tab','自动补全'],
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
            ['Ctrl + H','打开帮助页'],
        ]
    },
    {
        title:'引用窗口',
        rows:[
            ['鼠标右键','在代码片段中右键可复制当前代码片段'],
        ]
    }
];



                          
                  


// const tabsStyle={
//     '& .tabitem div.wrapper': {
//         height:    '600px',
//         minHeight: '100px',
//         maxHeight: 'calc(100vh - 320px)',
//         overflowY: 'auto',
//         overflowX: 'hidden',
//     },
//     '& .tabitem div.wrapper .chartTitle': {
//         fontSize:'20px',
//         fontWeight:'bold',
//     },
//     '& .tabitem div.wrapper .chartItem': {
//         color:'grey'
//     },
// };




// const helpTableStyle = {
//     width: '100%',
//     borderCollapse: 'collapse',
//     border: '1px solid lightgrey',
//     '& td,& th': {
//         border: '1px solid lightgrey',
//         padding: '5px 10px',
//     },
//     '& th': {
//         textAlign: 'center',
//     },
//     '& td:nth-child(1)': {
//         width: 120,
//         textAlign:'left',
//     },
//     '& td:nth-child(2) > div': {
//         display: 'table',
//         width: '100%',
//         // backgroundColor:'lightblue',
//     },
//     '& td:nth-child(2) > div > div': {
//         display: 'table-row',
//     },
//     '& td:nth-child(2) > div > div > div': {
//         display: 'table-cell',
//     },
//     '& td:nth-child(2) > div > div > div:nth-child(1)': {
//         width:250,
//         // backgroundColor:'red',
//         // textAlign:'center',
//     },
//     '& td:nth-child(2) > div > div > div:nth-child(2)': {
//         textAlign: 'left',
//         color:'#BBB',
//     },
// };

export default React.memo(HelpDlg);