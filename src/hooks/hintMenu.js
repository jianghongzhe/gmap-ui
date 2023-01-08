import {useReducer, useEffect, useMemo, useRef,} from "react";
import {useMemoizedFn} from "ahooks";
import {actionTypes} from "../common/hintMenuConfig";
import editorSvcEx from "../service/editorSvcEx";
import {message} from "_antd@4.24.6@antd";


export const useHintMenu=({forceCloseSymbol})=>{

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

    const shouldShowRefMenu=useMemoizedFn((cm)=>{
        const cursor= cm.doc.getCursor();
        const lineTxt=cm.doc.getLine(cursor.line);

        if(!editorSvcEx.isCursorInNodePart(cm) || null==lineTxt || ""==lineTxt.trim()){
            return false;
        }

        const refName=editorSvcEx.getFirstGeneralTxt(lineTxt);
        if(false===refName || ""===refName.trim()){
            return false;
        }
        return true;
    });

    const shouldShowContMenu=useMemoizedFn((cm)=>{
        return !editorSvcEx.isCursorInNodePart(cm);
    });

    const shouldShowEditTableMenu=useMemoizedFn((cm)=>{
        const data=editorSvcEx.parseTable(cm);
        return !(false===data) && !editorSvcEx.isCursorInNodePart(cm);
    });

    const showMenu=useMemoizedFn((cm)=>{
        let list=[];
        if(shouldShowRefMenu(cm)){
            list=[...list, ...hintRefMenus];
        }
        if(shouldShowEditTableMenu(cm)){
            list=[...list, ...editTableMenus];
        }
        if(shouldShowContMenu(cm)){
            list=[...list, ...hintContMenus];
        }
        if(0<list.length){
            list=[...list, "-"];
        }
        list=[...list, ...fixedHintMenuList];
        showMenuInner(list.filter(item=>null!=item), getHintMenuPos(cm))
    });

    /**
     * 如果强制关闭标志有更新，则关闭自动完成提示框
     */
    useEffect(()=>{
        closeHintMenu();
    },[forceCloseSymbol, closeHintMenu]);

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


const openersSampleLine2="- [txt]: notepad";
const openersSample=`# openers
${openersSampleLine2}`;

const shortcutsSampleLine2="- [百度](https://baidu.com)";
const shortcutsSample=`# shortcuts
${shortcutsSampleLine2}`;


/**
 * 动态生成的自动提示菜单项 - 表格编辑
 * @type {[{label: string, option: {type: string}}]}
 */
const editTableMenus=[
    {
        label: '表格编辑（可视化）',
        option: {
            type: actionTypes.editTable,
        }
    },
];


/**
 * 动态生成的自动提示菜单项 - 节点部分
 * @type
 */
const hintRefMenus=[
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
];

/**
 * 动态生成的自动提示菜单项 - 引用部分
 * @type
 */
const hintContMenus=[
    {
        label: '打开方式　# openers',
        option: {
            type: actionTypes.literal,
            data: {
                txt: openersSample,
                cursorOffset: [1, openersSampleLine2.length],
            }
        }
    },
    {
        label: '快捷方式　# shortcuts',
        option: {
            type: actionTypes.literal,
            data: {
                txt: shortcutsSample,
                cursorOffset: [1, shortcutsSampleLine2.length],
            }
        }
    },
];

/**
 * 固定的自动提示菜单项
 * @type
 */
const fixedHintMenuList=[
    {
        label: '插入图片　![图片]()',
        option: {
            type: actionTypes.literal,
            data: {
                txt: "![图片]()",
                cursorOffset: "![图片]()".length-1,
            }
        }
    },
    {
        label: '插入链接　[链接]()',
        option: {
            type: actionTypes.literal,
            data: {
                txt: "[链接]()",
                cursorOffset: "[链接]()".length-1,
            }
        }
    },
    {
        label: '文件链接　[文件](file:///)',
        option: {
            type: actionTypes.literal,
            data: {
                txt: "[文件](file:///)",
                cursorOffset: "[文件](file:///)".length-1,
            }
        }
    },
    "-",
    {
        label: '剪切板　　　->　url',
        option: {
            type: actionTypes.clipboardAction,
            data: actionTypes.getUrlFromClipboard,
        }
    },
    {
        label: '剪切板　　　->　图片引用',
        option: {
            type: actionTypes.clipboardAction,
            data: actionTypes.getImgUrlFromClipboard,
        }
    },
    {
        label: '剪切板图片　->　本地',
        option: {
            type: actionTypes.clipboardAction,
            data: actionTypes.clipboardImgToLocal,
        }
    },
    {
        label: '剪切板图片　->　图床',
        option: {
            type: actionTypes.clipboardAction,
            data: actionTypes.clipboardImgToPicHost,
        }
    },
    {
        label: '剪切板文件　->　本地',
        option: {
            type: actionTypes.clipboardAction,
            data: actionTypes.clipboardFileToLocal,
        }
    },
    {
        label: '剪切板文件　->　图床',
        option: {
            type: actionTypes.clipboardAction,
            data: actionTypes.clipboardFileToPicHost,
        }
    },
    "-",
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
];






/**
 * 计算自动完成菜单的位置:
 * 从codemirror中获取位置后还需要增加校准值
 * @param cm
 * @return {{top: *, left: *}}
 */
const getHintMenuPos=(cm)=>{
    const cur = cm.getCursor();
    const {left,top}=cm.cursorCoords(cur, "page");
    return {
        left: left+hintMenuAdjust.x,
        top: top+hintMenuAdjust.y
    };
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