import { useCallback, useState } from "react";

const useEditTableData=()=>{
    const [data, set]=useState({aligns:[], colNames:[], lines:[]});

    // --------------------如下为工具方法-----------------------------------
    const setItemForNewArray=useCallback((array, ind, val)=>{
        const tmp=[...array];
        tmp[ind]=val;
        return tmp;
    },[]);

    const delItemForNewArray=useCallback((array, ind)=>{
        const tmp=[...array];
        tmp.splice(ind,1);
        return tmp;
    },[]);

    const addItemForNewArray=useCallback((array, ind, val)=>{
        const tmp=[...array];
        tmp.splice(ind, 0, val);
        return tmp;
    },[]);

    const swapItemForNewArray=useCallback((array, ind1, ind2)=>{
        const tmp=[...array];
        let t=tmp[ind1];
        tmp[ind1]=tmp[ind2];
        tmp[ind2]=t;
        return tmp;
    },[]);

    const handleVLine=useCallback((txt)=>{
        return txt.replace(/[\\][|]/g, "|").replace(/[|]/g, "\\|");
    },[]);



    // --------------------如下为业务方法-----------------------------------
    /**
     * 设置数据
     * @param colNames
     * @param aligns
     * @param lines
     */
    const setData=useCallback((colNames, aligns, lines)=>{
        set({colNames, aligns, lines});
    },[set]);


    /**
     * 修改列头
     * @param ind 列索引
     * @param e 事件对象
     */
    const changeCol=useCallback((ind, e)=>{
        set(oldState=>{
            return {
                ...oldState,
                colNames: setItemForNewArray(oldState.colNames, ind, e.target.value),
            };
        });
    },[set, setItemForNewArray]);


    /**
     * 修改列的对齐方式
     * @param ind 列索引
     * @param align 对齐方式：left、right、center
     */
    const changeAlign=useCallback((ind, align)=>{
        set(oldState=>{
            return {
                ...oldState,
                aligns: setItemForNewArray(oldState.aligns, ind, align)
            };
        });
    },[set, setItemForNewArray]);


    /**
     * 修改单元格值
     * @param line 行索引
     * @param col 列索引
     * @param e 事件对象
     */
    const changeCell=useCallback((line, col, e)=>{
        set(oldState=>{
            return {
                ...oldState,
                lines: oldState.lines.map((items, ind)=>(ind!==line ? items : setItemForNewArray(items, col, e.target.value))),
            }
        });
    },[set, setItemForNewArray]);


    /**
     * 添加行
     * @param ind 行索引
     */
    const addLine=useCallback((ind)=>{
        set(oldState=>{
            return {
                ...oldState,
                lines: addItemForNewArray(oldState.lines, ind, oldState.colNames.map(cn=>"-")),
            };
        });
    },[set, addItemForNewArray]);


    /**
     * 添加列，对齐方式默认为左对齐
     * @param ind 列索引
     */
    const addCol=useCallback((ind)=>{
        set(oldState=>{
            return {
                colNames: addItemForNewArray(oldState.colNames, ind, `列头`), 
                aligns: addItemForNewArray(oldState.aligns, ind, `left`), 
                lines: oldState.lines.map(line=>addItemForNewArray(line, ind, '-')),
            };
        });
    },[set, addItemForNewArray]);


    /**
     * 删除列
     * @param ind 列索引
     */
    const delCol=useCallback((ind)=>{
        set(oldState=>{
            return {
                colNames: delItemForNewArray(oldState.colNames, ind), 
                aligns: delItemForNewArray(oldState.aligns, ind), 
                lines: oldState.lines.map(line=>delItemForNewArray(line, ind)),
            };
        });
    },[set, delItemForNewArray]);


    /**
     * 删除行
     * @param ind 行索引
     */
    const delRow=useCallback((ind)=>{
        set(oldState=>{
            return {
                ...oldState,
                lines: delItemForNewArray(oldState.lines, ind)
            };
        });
    },[set, delItemForNewArray]);


    /**
     * 交换行
     * @param ind1 行索引1
     * @param ind2 行索引2
     */
    const swapLine=useCallback((ind1,ind2)=>{
        set(oldState=>{
            return {
                ...oldState,
                lines: swapItemForNewArray(oldState.lines, ind1, ind2)
            };
        });
    },[set,swapItemForNewArray]);


    /**
     * 交换列
     * @param ind1 列索引1
     * @param ind2 列索引2
     */
    const swapCol=useCallback((ind1,ind2)=>{
        set(oldState=>{
            return {
                colNames: swapItemForNewArray(oldState.colNames, ind1, ind2), 
                aligns: swapItemForNewArray(oldState.aligns, ind1, ind2), 
                lines: oldState.lines.map(line=>swapItemForNewArray(line, ind1, ind2)),
            };
        });
    }, [set,swapItemForNewArray]);


    /**
     * 生成markdown文本
     */
    const createTableMd=useCallback((needExtraBlankLine)=>{
        let lineSep=`
`;
        let tableMd=""+
            `|${data.colNames.map(handleVLine).join("|")}|${lineSep}`+
            `|${data.aligns.map(v=>('center'===v ? ':-:' : ('right'===v ? "-:" : "-"))).join("|")}|${lineSep}`+
            data.lines.map(line=>`|${line.map(handleVLine).join("|")}|${lineSep}`).join("");
        tableMd=tableMd.trim();
        if(needExtraBlankLine){
            tableMd=lineSep+tableMd+lineSep;
        }
        return tableMd;
    },[data, handleVLine]);


    return [
        data, 
        {setData, changeCol,changeAlign, changeCell, addLine, addCol, delCol, delRow, swapLine, swapCol, createTableMd}
    ];
};

export {useEditTableData};