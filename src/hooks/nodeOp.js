import {useMemoizedFn} from "ahooks";

export const useNodeOp=(mapTxts)=>{

    /**
     *
     * @param nd
     * @param action edit/appendChild/addSiblingBefore/addSiblingAfter
     */
    const calcNewTxtAndCursor=useMemoizedFn((nd, action)=>{
        const getLines=()=>splitLines(mapTxts);
        let newLineTxt=mapTxts??'';
        let cursorPos={line:0, ch: 0};

        // 编辑节点，光标位置定在节点所有行的行尾
        if('edit'===action){
            const ch=getLines()[nd.lineInd].length;
            cursorPos={line:nd.lineInd, ch};
            return [newLineTxt, cursorPos];
        }
        // 添加子节点，层级为当前节点下一层，行号为节点及所有子节点中最后一行的下一行
        else if('appendChild'===action){
            const lineInd= getLastSubNdLineInd(nd)+1;
            const newLine= `${"\t".repeat(nd.lev+1)}- `;
            return [
                insertLineAndJoin(getLines(), lineInd, newLine),
                {line:lineInd,  ch:newLine.length},
            ];
        }
        // 在节点前添加兄弟节点，层级与当前节点相同，行号为节点所在行，同时节点下移一行
        else if('addSiblingBefore'===action){
            const newLine= `${"\t".repeat(nd.lev)}- `;
            return [
                insertLineAndJoin(getLines(), nd.lineInd, newLine),
                {line:nd.lineInd,  ch:newLine.length}
            ];
        }
        // 在节点后添加兄弟节点，层级与当前节点相同，行号为节点及所有子节点中最后一行的下一行
        else if('addSiblingAfter'===action){
            const lineInd= getLastSubNdLineInd(nd)+1;
            const newLine= `${"\t".repeat(nd.lev)}- `;
            return [
                insertLineAndJoin(getLines(), lineInd, newLine),
                {line:lineInd,  ch:newLine.length}
            ];
        }

        return [newLineTxt, cursorPos];
    });

    return {calcNewTxtAndCursor};
};

const splitLines=(mapTxts)=>(mapTxts.replace(/\r/g,'').split("\n"));

const insertLineAndJoin=(lines, lineInd, newLine)=>{
    lines.splice(lineInd,0,newLine);
    return lines.join("\n");
};

/**
 * 获得节点及所有层子节点中最大的行号
 * @param nd
 * @returns {*}
 */
const getLastSubNdLineInd=(nd)=>{
    if(!nd.childs || 0===nd.childs.length){
        return nd.lineInd;
    }
    let tmp=nd.lineInd;
    nd.childs.forEach(subNd=>{
        tmp=Math.max(tmp, getLastSubNdLineInd(subNd));
    });
    return tmp;
};