import api from "./api";


const splitPosNew=(viewPortWidth, contentWidth)=>{
    // 内容未超出容器大小，不需要滚动，只返回一个结果，即整个容器的区域
    if(contentWidth<=viewPortWidth){
        return [
            {
                scroll:0,
                from: 0,
                to: viewPortWidth,
            },
        ];
    }

    // 内容超出容器大小，依次计算滚动位置和要截取的位置
    const newResult=[];
    for (let i = 0; i < contentWidth; i+=viewPortWidth) {
        if(i+viewPortWidth<=contentWidth){
            newResult.push({
                scroll:i,
                from: 0,
                to: viewPortWidth,
            });
            continue;
        }
        newResult.push({
            scroll: contentWidth-viewPortWidth,
            from: viewPortWidth-(contentWidth-i),
            to: viewPortWidth,
        });
        break;
    }
    return newResult;
};


const takeScrshot=({
                        eleContainer,
                        eleContent,
                        preHandle,
                        postHandle,
                        finalSize,
                        resultType,
                        resultPath,
                        resultMultiPage=false,
                   })=>{

    // 开始截屏前的预处理，比如隐藏悬浮的组件，隐藏滚动条，设置利于截屏的样式等，记录原来滚动位置
    const originScroll=[eleContainer.scrollTop, eleContainer.scrollLeft];
    if(preHandle){
        preHandle();
    }

    const eleContainerRect=eleContainer.getBoundingClientRect();
    const eleContentRect=eleContent.getBoundingClientRect();
    const offsetX=Math.floor(eleContainerRect.left);
    const offsetY=Math.floor(eleContainerRect.top);
    const containerW= Math.floor(eleContainerRect.width);
    const containerH= Math.floor(eleContainerRect.height);
    const contentW=Math.floor(eleContentRect.width);
    const contentH=Math.floor(eleContentRect.height);

    // 计算要截取的位置
    let colPos=splitPosNew(containerW,contentW);    //计算一行中的位置
    let rowPos=splitPosNew(containerH,contentH);    //计算一列中的位置
    const sumW=colPos.reduce((accu,{from,to})=>(accu+(to-from)),0);
    const sumH=rowPos.reduce((accu,{from,to})=>(accu+(to-from)),0);

    // scrollX x1 x2 scrollY y1 y2 为截屏时相关的参数，位置中增加容器dom元素相对于视口的偏移量
    // pos{x1, x2, y1, y2} 为图片合并时的相关参数，即当前片段在最终大图中的位置
    const result=[];
    let accY=0;
    rowPos.forEach((row,lineInd)=>{
        let accX=0;
        colPos.forEach((col,colInd)=>{
            result.push({
                scrollX: col.scroll,
                x1:      offsetX+col.from,
                x2:      offsetX+col.to,

                scrollY: row.scroll,
                y1:      offsetY+row.from,
                y2:      offsetY+row.to,

                pos: {
                    x1: accX,
                    x2: accX+(col.to-col.from),
                    y1: accY,
                    y2: accY+(row.to-row.from),
                },
            });
            accX+=(col.to-col.from);
        });
        accY+=(row.to-row.from);
    });

    // 开始截屏处理，由于可能屏幕之前可能打开了文件对话框，因此延迟一会等对话框确实关闭后再开始截屏
    // 每次截取完成使用setTimeout调用下一次，都截取完成后调用doEnd进行合并
    // 设置完滚动位置后要等待一会再截屏，否则截取位置不准
    let currInt=0;
    const eachShot=()=>{
        eleContainer.scrollLeft= result[currInt].scrollX;
        eleContainer.scrollTop= result[currInt].scrollY;

        setTimeout(()=>{
            api.takeScrshot({
                x: parseInt(result[currInt].x1),
                y: parseInt(result[currInt].y1),
                width: parseInt(result[currInt].x2-result[currInt].x1),
                height: parseInt(result[currInt].y2-result[currInt].y1),
            }).then(shotId=>{
                result[currInt].pos.shotId=shotId;
                if(currInt<result.length-1){
                    ++currInt;
                    setTimeout(eachShot, 150);
                    return;
                }
                setTimeout(doEnd, 150);
            });
        }, 50);
    };
    setTimeout(eachShot, 300);

    // 合并与收尾处理
    const doEnd=()=>{
        // 恢复原来的滚动位置
        // 解除截屏前的预处理，即预处理的反向操作
        eleContainer.scrollTop=originScroll[0];
        eleContainer.scrollLeft=originScroll[1];
        if(postHandle){
            postHandle();
        }

        // 调用合并接口
        const forceSize=!!(Array.isArray(finalSize) && finalSize.length >= 2);
        const combineConfig={
            // 这些直接传递给go后端
            Action: "combine_scrshot",
            SumSize: {
                Width: sumW,
                Height: sumH,
            },
            Items:result.map(({pos})=>({X1:pos.x1, X2:pos.x2, Y1:pos.y1, Y2:pos.y2})),
            ResultType: resultType,
            ResultPath: resultPath,
            ResultMultiPage: resultMultiPage,
            ForceValidSize: forceSize,
            ValidSize: forceSize ? {Width:finalSize[0], Height:finalSize[1],} : null,
            // 由ipcMain处理，把实际的buffer传递到go后端
            shotIds: result.map(({pos})=>pos.shotId),
        };
        //console.log("final combine config ", combineConfig);
        api.combineScrshot(combineConfig);
    };

    // takeScrshot
};


const CombineShotResultMem = 0;
const CombineShotResultImg =1;
const CombineShotResultPdf = 2;
const CombineShotResultDoc = 3;

export {
    takeScrshot,
    CombineShotResultMem,
    CombineShotResultImg,
    CombineShotResultPdf,
    CombineShotResultDoc,
};


