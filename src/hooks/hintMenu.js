import {useReducer,  useMemo, useRef,} from "react";
import {useMemoizedFn} from "ahooks";
import {actionTypes} from "../common/hintMenuConfig";
import editorSvcEx from "../service/editorSvcEx";
import globalStyleConfig from "../common/globalStyleConfig";
import api from '../service/api';


const cates={
    metadata: Symbol(),
    node_operate: Symbol(),
    shortcut_alias_frag: Symbol(),
    link_and_color: Symbol(),
    clipboard: Symbol(),
    date_and_time: Symbol(),
};

export const useHintMenu=()=>{

    const [{hintMenus,hintMenuPos}, dispatch]=useReducer(reducer, {
         /**
          * [
          *      {
          *          selected: true/false,
          *          label: '',
          *          option: {}
          *      }
          * ]
          */
        hintMenus: [],
        hintMenuPos: {left:-99999, top:-99999},
    });
    const eleRef= useRef(null);


    /**
     * 根据数据判断当前对话框是否已打开
     * @type {unknown}
     */
    const hintMenuOpen= useMemo(()=>(hintMenuPos && hintMenus?.length>0),[hintMenus, hintMenuPos]);

    /**
     * 从数据中取出当前被选中的菜单项
     * @type {*}
     */
    const currMenu= useMemo(()=>(hintMenus.filter(m=>m.selected)?.[0]),[hintMenus]);

    /**
     * 关闭提示框
     * @type {(function(): void)|*}
     */
    const closeHintMenu=useMemoizedFn(()=>{
        dispatch({type:"clear-all"});
    });

    const moveHintMenu= useMemoizedFn((delta)=>{
        // 记录分隔符的位置然后生成一个不带分隔符的数组
        const splitInds= hintMenus.map((m,i)=>"-"===m ? i : null).filter(i=>null!==i);
        const validItems= hintMenus.filter(m=>"-"!==m);

        // 从不带分隔符的数组中计算当前选项的索引
        let selInd=-1;
        validItems.forEach((m,i)=>{if(m.selected){selInd=i;}});
        if(-1===selInd){
            return;
        }

        // 索引前后移并保证不越界
        selInd+=delta;
        if(selInd>=validItems.length){
            selInd=0;
        }
        if(selInd<0){
            selInd=validItems.length-1;
        }

        // 设置新的选中项位置并把原分隔符插入回去
        const newMenus= validItems.map((m,i)=>({
            ...m,
            selected: (i===selInd)
        }));
        splitInds.forEach(i=>newMenus.splice(i,0,"-"));


        dispatch({
            type: 'update-menu',
            data: newMenus,
        });

        // 当前选中的项移入可见区域
        if(eleRef.current){
            selInd=-1;
            newMenus.forEach((m,i)=>{if(m.selected){selInd=i;}});
            setTimeout(()=>{
                eleRef?.current?.querySelectorAll("li")?.[selInd]?.scrollIntoViewIfNeeded({
                    behavior: 'smooth',
                    block: 'center',
                });
            },50);
        }
    });


    /**
     * 下移
     * @type {(function(): void)|*}
     */
    const moveHintMenuDown= useMemoizedFn(()=>{
        moveHintMenu(1);
    });

    /**
     * 上移
     * @type {(function(): void)|*}
     */
    const moveHintMenuUp= useMemoizedFn(()=>{
        moveHintMenu(-1);
    });

    const moveHintMenuTo=useMemoizedFn((ind)=>{
        const newMenus= hintMenus.map((m,i)=>{
            if("-"===m){
                return m;
            }
            return {
                ...m,
                selected: (i===ind),
            };
        });
        dispatch({
            type: 'update-menu',
            data: newMenus,
        });
    });


    /**
     * 显示自动完成对话框
     * @param menus [
     *      {
     *          selected: true/false,
     *          label: '',
     *          option: {}
     *      }
     * ]
     * @param pos {left,top}
     *
     */
    const showMenuInner=useMemoizedFn((menus, pos)=>{
        // 预处理
        // 如果没有选中项，则默认让第一个不是分隔符的项选中
        if(!menus.some(m=>m.selected)){
            let handled=false;
            menus=menus.map((m,i)=>{
                if("-"!==m && !handled){
                    handled=true;
                    return {...m, selected:true,};
                }
                return m;
            });
        }

        dispatch({
            type: 'update-all',
            data: {
                hintMenus: menus,
                hintMenuPos: pos,
            },
        });
    });



    /**
     * 动态组装自动提示菜单项：
     * @type {(function(*): void)|*}
     */
    const showMenu=useMemoizedFn((cm)=>{
        (async ()=>{
            const resp=await api.getClipboardHasContent();
            if(!resp || true!==resp.succ){
                return;
            }

            // 当前环境信息汇总，用于被各菜单项的匹配器函数使用
            const selectionType= editorSvcEx.getSelectionType(cm);
            const lines=[];
            for(let i=selectionType.pos.line; i<=selectionType.pos2.line; ++i){
                lines.push(cm.doc.getLine(i));
            }
            const parseResult={
                clipboardHasContent: resp.data,
                selectionType,
                lines,
                cursorScope: {
                    inImgNamePart: editorSvcEx.isInImgNamePart(cm),
                    inLinkNamePart: editorSvcEx.isInLinkNamePart(cm),
                    inTablePart: editorSvcEx.isInTable(cm),
                },
                cursorLineScope:{
                    inNodePart: editorSvcEx.isInNodePart(cm),
                },
                cursorLineMultiScope: {
                    inRefPart: editorSvcEx.isInRefPart(cm),
                },
            };

            console.log("inTablePart", parseResult.cursorScope.inTablePart)

            // 菜单项过滤并插入分隔符
            // 先按selectionTypes过滤；
            // 再按matcher函数过滤: 如果匹配，则把函数返回结果附加到函数的data对象中
            const visibleMenus= menuConfig
                .filter(menu=>menu.selectionTypes && menu.matcher)
                .filter(menu=>menu.selectionTypes.includes(parseResult.selectionType.type))
                .map(menu=>{
                    const match=menu.matcher(cm, parseResult);
                    if(!match){
                        return null;
                    }
                    const item={
                        label: menu.label,
                        option: menu.option,
                        cate: menu.cate,
                    };
                    item.option.data={
                        ...item.option.data,
                        extra: match,
                    };
                    return item;
                })
                .filter(menu=>null!==menu);
            for (let i=visibleMenus.length-1;i>0;--i){
                if(visibleMenus[i].cate!==visibleMenus[i-1].cate){
                    visibleMenus.splice(i, 0, "-");
                }
            }

            if(0===visibleMenus.length){
                closeHintMenu();
                return;
            }
            cm.scrollIntoView(parseResult.selectionType.pos2);
            setTimeout(()=>{
                showMenuInner(visibleMenus, getHintMenuPos(cm, parseResult.selectionType.pos2));
            },50);
        })();
    });

    return {
        // 状态
        hintMenus,
        hintMenuPos,
        currMenu,
        hintMenuOpen,

        // 函数
        bindRefFunc: eleRef,
        showMenu,
        closeHintMenu,
        moveHintMenuDown,
        moveHintMenuUp,
        moveHintMenuTo,
    };
};



const shortcutsSampleLastLine="\t- [](https://mm.nn.oo)";
const shortcutsSample=`# shortcuts
- [某网](https://xx.yy.zz)
- 多个链接
\t- [](https://aa.bb.cc)
${shortcutsSampleLastLine}`;
const shortCutLastLineOffset=4;


const threeQuote="```";
const aliasSampleLastLine=threeQuote;
const aliasSample=`# alias
[xxx]: 单行内容
[yyy]:
${threeQuote}bat
多行内容第一行
多行内容第二行
${threeQuote}`;
const aliasLastLineOffset=6


/**
 * 菜单项配置
 * @type {}
 */
const menuConfig=[
    // 图片元数据
    ...(["#left", "#center", "#right", "#float-left", "#float-right", "#inline",].map(item=>{
        return {
            cate: cates.metadata,
            selectionTypes: ['cursor'],
            matcher: (cm, parseResult)=>parseResult.cursorScope.inImgNamePart,
            label: `图片属性　${item}`,
            option: {
                type: actionTypes.literal,
                data: {
                    txt: item,
                    cursorOffset: item.length,
                }
            }
        };
    })),

    // 链接元数据
    ...(["#confirm", "#confirm{txt aa}"].map(item=>{
        return {
            cate: cates.metadata,
            selectionTypes: ['cursor'],
            matcher: (cm, parseResult)=>parseResult.cursorScope.inLinkNamePart,
            label: `链接属性　${item}`,
            option: {
                type: actionTypes.literal,
                data: {
                    txt: item,
                    cursorOffset: item.length,
                }
            }
        };
    })),

    // 表格第一行第一列元数据
    ...(["#bar", "#line", "#stack", "#pie", "#bar-line"].map(item=>{
        return {
            cate: cates.metadata,
            selectionTypes: ['cursor'],
            matcher: (cm, parseResult)=> parseResult.cursorScope.inTablePart?.titleLineFirstCol,
            label: `表格属性　${item}`,
            option: {
                type: actionTypes.literal,
                data: {
                    txt: item,
                    cursorOffset: item.length,
                }
            }
        };
    })),

    // 表格数据行第一列元数据： 当表头第一列中有#bar-line元数据时才有效
    ...(["#bar", "#line", "#stack:xx"].map(item=>{
        return {
            cate: cates.metadata,
            selectionTypes: ['cursor'],
            matcher: (cm, parseResult)=>{
                if(parseResult.cursorScope.inTablePart?.dataLineFirstCol){
                    const titleFirstCell= parseResult.cursorScope.inTablePart?.data?.heads?.[0]??'';
                    return titleFirstCell.includes("#bar-line") ? parseResult.cursorScope.inTablePart.dataLineFirstCol : false;
                }
                return false;
            },
            label: `系列属性　${item}`,
            option: {
                type: actionTypes.literal,
                data: {
                    txt: item,
                    cursorOffset: item.length,
                }
            }
        };
    })),

    // 表格编辑：该菜单项已对应工具栏上的按钮功能以及快捷键功能，此处不再放在自动提示菜单中
    // {
    //     cate: cates.metadata,
    //     selectionTypes: ['cursor'],
    //     matcher: (cm, parseResult)=>{
    //         return parseResult.cursorScope.inTablePart;
    //     },
    //     label: '表格编辑　',
    //     option: {
    //         type: actionTypes.editTable,
    //     }
    // },


    // 根节点功能
    ...([
        {lab:'节点在右　right:', val:'right:'},
        {lab:'上下结构　down:', val:'down:'},
        {lab:'下上结构　up:', val:'up:'},
    ].map(({lab,val})=>{
        return {
            cate: cates.node_operate,
            selectionTypes: ['cursor', 'line'],
            matcher: (cm, parseResult)=> {
                if(parseResult.cursorLineScope.inNodePart?.inRoot){
                    const {pos, pos2, fill}=parseResult.cursorLineScope.inNodePart;
                    return {pos, pos2, fill};
                }
                return false;
            },
            label: lab,
            option: {
                type: actionTypes.literal,
                data: {
                    txt: val,
                    cursorOffset: val.length,
                }
            }
        };
    })),

    // 所有节点功能
    ...([
        {
            label: '引用　　　ref:xx',
            option: {
                type: actionTypes.refAction,
                data: {
                    ref:true,
                    tref:false,
                }
            }
        },
        {
            label: '文本引用　tref:yy',
            option: {
                type: actionTypes.refAction,
                data:{
                    ref:false,
                    tref:true,
                }
            }
        },
        {
            label: '折叠节点　zip:',
            option: {
                type: actionTypes.literal,
                data: {
                    txt: 'zip:',
                    cursorOffset: 'zip:'.length,
                }
            }
        },
    ].map(item=>({
        ...item,
        cate: cates.node_operate,
        selectionTypes: ['cursor', 'line'],
        matcher: (cm, parseResult)=> {
            if(parseResult.cursorLineScope.inNodePart){
                const {pos, pos2, fill}=parseResult.cursorLineScope.inNodePart;
                return {pos, pos2, fill};
            }
            return false;
        },
    }))),

    // 生成 shortcut段与alias段
    // 当未选中或单行选中时有效，且行为空或行中只有空字符
    // 生成shortcut段需要整个引用部分中没有shortcut段，alias段同理
    {
        cate: cates.shortcut_alias_frag,
        selectionTypes: ['cursor', 'line'],
        matcher: (cm, parseResult)=>{
            if(parseResult.cursorLineMultiScope.inRefPart &&
                !parseResult.cursorLineMultiScope.inRefPart.hasShortcutPart &&
                ''===parseResult.lines[0].trim()
            ){
                return {
                    pos: {...parseResult.selectionType.pos, ch:0,},
                    pos2: {...parseResult.selectionType.pos, ch:parseResult.lines[0].length,},
                };
            }
            return false;
        },
        label: '快捷方式　# shortcuts',
        option: {
            type: actionTypes.literal,
            data: {
                txt: shortcutsSample,
                cursorOffset: [shortCutLastLineOffset, shortcutsSampleLastLine.length],
            }
        }
    },
    {
        cate: cates.shortcut_alias_frag,
        selectionTypes: ['cursor', 'line'],
        matcher: (cm, parseResult)=>{
            if(parseResult.cursorLineMultiScope.inRefPart &&
                !parseResult.cursorLineMultiScope.inRefPart.hasAliasPart &&
                ''===parseResult.lines[0].trim()
            ){
                return {
                    pos: {...parseResult.selectionType.pos, ch:0,},
                    pos2: {...parseResult.selectionType.pos, ch:parseResult.lines[0].length,},
                };
            }
            return false;
        },
        label: '别名　　　# alias',
        option: {
            type: actionTypes.literal,
            data: {
                txt: aliasSample,
                cursorOffset: [aliasLastLineOffset, aliasSampleLastLine.length],
            }
        }
    },

    // 插入链接
    // 分两种情况处理：
    // 1、选中了节点，且选中类型为cursor：直接在节点末尾插入空标记
    // 2、选中了节点且选中类型为line 或是 选中了引用部分：使用前后标记包裹
    ...([
        {
            label: '插入图片　![]()',
            option: {
                type: actionTypes.literal,
                data: {
                    wrap: true,
                    txt: ["![](", ")"],
                    cursorOffset: -1,
                }
            }
        },
        {
            label: '插入链接　[]()',
            option: {
                type: actionTypes.literal,
                data: {
                    wrap: true,
                    txt: ["[](", ")"],
                    cursorOffset: -1,
                }
            }
        },
        {
            label: '文件链接　[](file:///)',
            option: {
                type: actionTypes.literal,
                data: {
                    wrap: true,
                    txt: ["[](file:///", ")"],
                    cursorOffset: -1,
                }
            }
        },
        {
            label: '命令链接　[](cmd://)',
            option: {
                type: actionTypes.literal,
                data: {
                    wrap: true,
                    txt: ["[](cmd://", ")"],
                    cursorOffset: -1,
                }
            }
        },

    ].flatMap(item=>{
        return [
            {
                ...item,
                option: {
                    ...item.option,
                    data: {
                        ...item.option.data,
                        wrap: false,
                        txt: item.option.data.txt[0]+item.option.data.txt[1],
                    },
                },
                cate: cates.link_and_color,
                selectionTypes: ['cursor'],
                matcher: (cm, parseResult)=>{
                    if(parseResult.cursorScope.inImgNamePart || parseResult.cursorScope.inLinkNamePart){
                        return false;
                    }
                    if(parseResult.cursorLineScope.inNodePart){
                        return {
                            pos: parseResult.cursorLineScope.inNodePart.pos,
                            pos2: parseResult.cursorLineScope.inNodePart.pos2,
                            fill: parseResult.cursorLineScope.inNodePart.fill,
                        };
                    }
                    return false;
                },
            },
            {
                ...item,
                cate: cates.link_and_color,
                selectionTypes: ['cursor','line'],
                matcher: (cm, parseResult)=>{
                    if(parseResult.cursorScope.inImgNamePart || parseResult.cursorScope.inLinkNamePart){
                        return false;
                    }
                    if(parseResult.cursorLineMultiScope.inRefPart || (parseResult.cursorLineScope.inNodePart && 'line'===parseResult.selectionType.type)){
                        return {};
                    }
                    return false;
                },
            }
        ];
    })),


    // 锚点链接和锚点
    ...([
        {
            label: '锚点链接　[跳转到](#xxx)',
            txt: ["[跳转到](#)"],
            cursorOffset: "[跳转到](#".length,
        },
        {
            label: '插入锚点　$anchor{xxx}$',
            txt: ["$anchor{}$"],
            cursorOffset: "$anchor{".length,
        },
    ].map(item=>({
        cate: cates.link_and_color,
        selectionTypes: ['cursor'],
        matcher: (cm, parseResult)=>{
            if(parseResult.cursorScope.inImgNamePart || parseResult.cursorScope.inLinkNamePart){
                return false;
            }
            if(parseResult.cursorLineScope.inNodePart){
                return false;
            }
            if(parseResult.cursorLineMultiScope.inRefPart){
                return {};
            }
            return false;
        },
        label: item.label,
        option: {
            type: actionTypes.literal,
            data: {
                wrap: false,
                txt: item.txt,
                cursorOffset: item.cursorOffset,
            }
        }
    }))),



    // 文字颜色
    {
        cate: cates.link_and_color,
        selectionTypes: ['cursor','line','multi'],
        matcher: (cm, parseResult)=>{
            if(parseResult.cursorScope.inImgNamePart || parseResult.cursorScope.inLinkNamePart){
                return false;
            }
            if(parseResult.cursorLineScope.inNodePart){
                return {
                    // pos: parseResult.cursorLineScope.inNodePart.pos,
                    // pos2: parseResult.cursorLineScope.inNodePart.pos2,
                    // fill: parseResult.cursorLineScope.inNodePart.fill,
                };
            }
            if(parseResult.cursorLineMultiScope.inRefPart){
                return {};
            }
            return false;
        },
        label: '文字颜色　',
        option: {
            type: actionTypes.literal,
            data: {
                wrap: true,
                txt: ["$\\textcolor{}{", "}$"],
                cursorOffset: "$\\textcolor{".length,
                txt2: ['<font color="">', '</font>'],
                cursorOffset2: '<font color="'.length,
            }
        }
    },


    // 剪切板菜单项
    ...([
        {
            label: '剪切板　　　->　url',
            option: {
                type: actionTypes.clipboardAction,
                data: {subActionType: actionTypes.getUrlFromClipboard},
            }
        },
        {

            label: '剪切板　　　->　图片引用',
            option: {
                type: actionTypes.clipboardAction,
                data: {subActionType: actionTypes.getImgUrlFromClipboard},
            }
        },
        {

            label: '剪切板图片　->　本地',
            option: {
                type: actionTypes.clipboardAction,
                data: {subActionType: actionTypes.clipboardImgToLocal},
            }
        },
        {

            label: '剪切板图片　->　图床',
            option: {
                type: actionTypes.clipboardAction,
                data: {subActionType: actionTypes.clipboardImgToPicHost},
            }
        },
        {

            label: '剪切板文件　->　本地',
            option: {
                type: actionTypes.clipboardAction,
                data: {subActionType: actionTypes.clipboardFileToLocal},
            }
        },
        {

            label: '剪切板文件　->　图床',
            option: {
                type: actionTypes.clipboardAction,
                data: {subActionType: actionTypes.clipboardFileToPicHost},
            }
        },
    ].map(item=>({
        ...item,
        cate: cates.clipboard,
        selectionTypes: ['cursor'],
        // 在图片元数据、链接元数据位置，或剪切板为空，则不显示菜单项
        matcher: (cm, parseResult)=>{
            if(parseResult.cursorScope.inImgNamePart || parseResult.cursorScope.inLinkNamePart || !parseResult.clipboardHasContent){
                return false;
            }
            if(parseResult.cursorLineScope.inNodePart){
                const {pos, pos2, fill}=parseResult.cursorLineScope.inNodePart;
                return {pos, pos2, fill};
            }
            if(parseResult.cursorLineMultiScope.inRefPart){
                return {pos: parseResult.selectionType.pos,};
            }
            return false;
        },
    }))),


    // 时间项
    ...([
        {
            label: '当前时间',
            option: {
                type: actionTypes.dateTimeAction,
                data:{
                    date:false,
                    time:true,
                },
            }
        },
        {
            label: '当前日期时间',
            option: {
                type: actionTypes.dateTimeAction,
                data:{
                    date:true,
                    time:true,
                },
            }
        },
        {
            label: '今天的日期',
            option: {
                type: actionTypes.dateTimeAction,
                data:{
                    date:true,
                    time:false,
                    dateOffset:0,
                },
            }
        },
        {
            label: '明天的日期',
            option: {
                type: actionTypes.dateTimeAction,
                data:{
                    date:true,
                    time:false,
                    dateOffset:1,
                },
            }
        },
        {
            label: '后天的日期',
            option: {
                type: actionTypes.dateTimeAction,
                data:{
                    date:true,
                    time:false,
                    dateOffset:2,
                },
            }
        },
        {
            label: '之后的日期　{d+}',
            option: {
                type: actionTypes.literal,
                data: {
                    txt: '{d+}',
                    cursorOffset: '{d+}'.length-1,
                }
            }
        },
        {
            label: '昨天的日期',
            option: {
                type: actionTypes.dateTimeAction,
                data:{
                    date:true,
                    time:false,
                    dateOffset:-1,
                },
            }
        },
        {
            label: '前天的日期',
            option: {
                type: actionTypes.dateTimeAction,
                data:{
                    date:true,
                    time:false,
                    dateOffset:-2,
                },
            }
        },
        {
            label: '之前的日期　{d-}',
            option: {
                type: actionTypes.literal,
                data: {
                    txt: '{d-}',
                    cursorOffset: '{d-}'.length-1,
                }
            }
        },
    ].map(item=>({
        ...item,
        cate: cates.date_and_time,
        selectionTypes: ['cursor'],
        matcher: (cm, parseResult)=> {
            if (parseResult.cursorLineScope.inNodePart) {
                const {pos, pos2, fill} = parseResult.cursorLineScope.inNodePart;
                return {pos, pos2, fill};
            }
            if (parseResult.cursorLineMultiScope.inRefPart) {
                return {pos: parseResult.selectionType.pos,};
            }
            return false;
        }
    }))),
];








/**
 * 计算自动完成菜单的位置:
 * 从codemirror中获取位置后还需要增加校准值，同时还要处理提示框下边缘超出窗口的情况
 * @param cm
 * @return {{top: *, left: *}}
 */
const getHintMenuPos=(cm, cur=null)=>{
    // 光标为相对于codemirror编辑器的位置
    if(!cur){
        cur = cm.getCursor();
    }
    let {left,top}=cm.cursorCoords(cur, "page");

    // 增加校正值后变为相对于编辑器对话框的位置，返回结果也需要这种相对位置
    left+=hintMenuAdjust.x;
    top+=hintMenuAdjust.y;

    // 如果提示框的下边缘超过窗口高度，则提示框应应显示在光标处的上面，默认是下面
    // 相对于对话框的高度 + 100（编辑器对话框距窗口顶部的位置）+ 提示框高度 = 提示框下边相对于窗口的位置
    if(top+100+globalStyleConfig.hintDlg.maxh>=document.body.clientHeight-3){
        top-=globalStyleConfig.hintDlg.maxh+25;
    }

    return {left, top};
};

/**
 * 自动完成菜单位置校正
 * @type {{x: number, y: number}}
 */
const hintMenuAdjust={
    x: -100,
    y: -75,
};





const reducer=(state, action)=>{
    if("clear-all"===action.type){
        return {
            ...state,
            hintMenus: [],
            hintMenuPos: {left:-99999, top:-99999},
        };
    }
    if("update-menu"===action.type){
        return {
            ...state,
            hintMenus: action.data,
        };
    }
    if("update-all"===action.type){
        return {
            ...state,
            ...action.data,
        };
    }

    return state;
};