import {useReducer,useEffect, useMemo, } from "react";
import {useMemoizedFn} from "ahooks";


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
        let selInd=-1;
        hintMenus.forEach((m,i)=>{if(m.selected){selInd=i;}});
        if(-1===selInd){
            return;
        }
        selInd+=delta;
        if(selInd>=hintMenus.length){
            selInd=0;
        }
        if(selInd<0){
            selInd=hintMenus.length-1;
        }
        const newMenus= hintMenus.map((m,i)=>({
            ...m,
            selected: (i===selInd)
        }));
        dispatch({
            type: 'update-menu',
            data: newMenus,
        });
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
    const showMenu=useMemoizedFn((menus, pos)=>{
        // 如果没有选中项，则默认让第一项选中
        if(!menus.some(m=>m.selected)){
            menus=menus.map((m,i)=>({...m, selected:(0===i)}));
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
        showMenu,
        closeHintMenu,
        moveHintMenuDown,
        moveHintMenuUp,
    };
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