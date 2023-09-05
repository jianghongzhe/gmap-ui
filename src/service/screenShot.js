import api from "./api";

class ScreenShotSvc{
    constructor(){
        this.doing=false;
        this.resultImgPath=null;
        this.excludeId=null;
        this.excludePrevState=null;
        this.maxWH=null;
    }

    hideExclude=()=>{
        if(this.excludeId){
            const ele=document.querySelector(`#${this.excludeId}`);
            this.excludePrevState=ele.style.display;
            ele.style.display="none";
        }
    };

    showExclude=()=>{
        if(this.excludeId){
            const ele=document.querySelector(`#${this.excludeId}`);
            if("none"===ele.style.display){
                ele.style.display=this.excludePrevState;
            }
        }
    };


    /**
     * 进行滚动截屏，此方法会暴露给外部调用
     * @param {*} selFileFun        保存文件对话框函数
     * @param {*} takeScrenShotFun  截屏命令执行的函数
     * @param {*} combineScreenShotFun 合并图片的函数
     * @param {*} eleContainer      容器组件的html元素对象
     * @param {*} eleContent        实际内容的组件的html元素对象
     * @param {*} offsetX           要开始截取的部分相对于浏览器主内容区域左端的偏移
     * @param {*} offsetY           要开始截取的部分相对于浏览器主内容区域上端的偏移
     * @param {*} hasBrowserMenu    是否包含菜单栏，此值对截图位置有影响
     * @param {*} _excludeId        排除的元素的id，截图前先隐藏，完成后恢复显示
     */
    doScreenShot=(selFileFun, takeScrenShotFun, combineScreenShotFun, eleContainer, eleContent, offsetX=0, offsetY=0, hasBrowserMenu=true, _excludeId, _maxWH)=>{       





        //当前截屏任务未完成时不允许进行操作
        if(this.doing){
            return;
        }

        this.excludeId=null;
        if(_excludeId){
            this.excludeId=_excludeId;
        }
        this.maxWH=null;
        if(_maxWH && _maxWH[0] &&_maxWH[1]){
            this.maxWH=_maxWH;
        }


        //保存文件对话框点击取消后不进行操作
        selFileFun().then(resultImgPath=>{
            //记录原来的滚动位置
            this.oldPos={
                y: eleContainer.scrollTop,
                x: eleContainer.scrollLeft
            };
            
            //等对话框关闭后再开始截取
            this.hasBrowserMenu=hasBrowserMenu;
            this.offsetX=offsetX;
            this.offsetY=offsetY;
            this.doing=true;
            this.resultImgPath=resultImgPath;
            this.takeScrenShotFun=takeScrenShotFun;
            this.combineScreenShotFun=combineScreenShotFun;
            setTimeout(() => {   
                this.hideExclude(); 
                this.prepareScreenShot(eleContainer, eleContent);
            }, 200);
        }).catch(e=>{
            this.doing=false;
            console.log("截图取消。。。");
            this.showExclude();
        });
    }


    /**
     * 准备开始截屏
     * @param {*} eleContainer  容器html对象
     * @param {*} eleContent    内容html对象
     */
    prepareScreenShot=(eleContainer, eleContent)=>{
        //宽度与高度的计算与校正
        this.eleContainer=eleContainer;
        let eleContainerRect=eleContainer.getBoundingClientRect();
        let eleContentRect=eleContent.getBoundingClientRect();
        
        let {containerW, containerH, contentW, contentH}=this.adjustSize(
            Math.floor(eleContainerRect.width), 
            Math.floor(eleContainerRect.height), 
            Math.floor(eleContentRect.width), 
            Math.floor(eleContentRect.height)
        );


        //计算每个截取块的位置和大小等
        console.log(containerW,contentW,containerH,contentH);
        let colPos=splitPos(containerW,contentW);    //计算一行中的位置
        let rowPos=splitPos(containerH,contentH);    //计算一列中的位置
        let result=[];

        rowPos.forEach((row,lineInd)=>{
            let line=[];
            colPos.forEach((col,colInd)=>{
                line.push({
                    scrollLeft: col.scroll,
                    cutLeft:    col.pos,
                    width:      col.len,

                    scrollTop:  row.scroll,
                    cutTop:     row.pos,
                    height:     row.len,

                    filename:   lineInd+"_"+colInd+".jpg",
                });
            });
            result.push(line);
        });

        console.log(result);


        //开始进行截取
        let maxY=result.length-1;
        let maxX=result[0].length-1;
        this.startShot(result,0,0,maxX,maxY);
    }


    /**
     * 容器大小的校正，因为容器中滚动条也占一部分宽度，而实际内容所占宽度会比容器本身宽度小
     * @param {*} containerW 
     * @param {*} containerH 
     * @param {*} contentW 
     * @param {*} contentH 
     */
    adjustSize=(containerW, containerH, contentW, contentH)=>{
        //内容未超过容器大小，不做修改
        if(contentW<=containerW && contentH<=containerH){
            //do nothing
        }
        //内容宽度超过容器，高度未超过
        else if(contentW>containerW && contentH<=containerH-scrollbarThick){
            containerH-=scrollbarThick;
        }
        //内容高度超过容器，宽度未超过
        else if(contentH>containerH && contentW<=containerW-scrollbarThick){
            containerW-=scrollbarThick;
        }
        //内容宽高都超过容器
        else{
            containerH-=scrollbarThick;
            containerW-=scrollbarThick;
        }

        return {containerW, containerH, contentW, contentH};
    }


    /**
     * 逐步截取图片
     * @param {*} allPos    所有图片的位置
     * @param {*} x         横标         
     * @param {*} y         纵标
     * @param {*} maxX      最大横标
     * @param {*} maxY      最大纵标
     */
    startShot=(allPos, x,y, maxX, maxY)=>{
        //移动滚动位置
        this.eleContainer.scrollTop= allPos[y][x].scrollTop;
        this.eleContainer.scrollLeft= allPos[y][x].scrollLeft;

        //等滚动完后，延迟一段时间再进行截屏操作
        setTimeout(() => {
            const fun=async ()=>{
                //截取当前索引处的图片
                let startTop=(this.hasBrowserMenu ? startTopWithTitleAndMenu : startTopWithOnlyTitle);//浏览器有菜单栏和无菜单栏所占的高度不同
                //await this.takeScrenShotFun(`shot://${window.screenLeft+startLeft+this.offsetX},${window.screenTop+startTop+this.offsetY},${allPos[y][x].width},${allPos[y][x].height},${allPos[y][x].filename}`);    


                // // takeScrshot
                // api.takeScrshot({
                //     x: parseInt(this.offsetX+allPos[y][x].cutLeft),
                //     y: parseInt(this.offsetY+allPos[y][x].cutTop),
                //     width: parseInt(allPos[y][x].width-allPos[y][x].cutLeft),
                //     height: parseInt(allPos[y][x].height-allPos[y][x].cutTop),
                // });


                await this.takeScrenShotFun({
                    left:window.screenLeft+startLeft+this.offsetX,
                    top:window.screenTop+startTop+this.offsetY,
                    width:allPos[y][x].width,
                    height:allPos[y][x].height,
                    fileName:allPos[y][x].filename
                });

                console.log("each shot", allPos);
                
                //未到一行最后，移到下一个图片继续截取
                if(x<maxX){
                    this.startShot(allPos,x+1,y,maxX,maxY);
                    return;
                }

                //到一行的最后，未到最后一行，移到下一行继续截取
                if(y<maxY){
                    this.startShot(allPos,0,y+1,maxX,maxY);
                    return;
                }
                
                //所有部分的图片截取完成，进行合并
                this.combineShots(allPos);
            };
            fun();
        }, 50);
    }


    /**
     * 合并图片
     * @param {*} allPos 
     */
    combineShots=(allPos)=>{
        const opt={
            itemWidth:      allPos[0][0].width,
            itemHeight:     allPos[0][0].height,
            resultFullPath: this.resultImgPath,
            lines:          allPos.map((line)=>(
                line.map((item)=>({
                    picName:    item.filename,
                    cutLeft:    item.cutLeft,
                    cutTop:     item.cutTop
                }))
            )),
            maxW: (this.maxWH ? this.maxWH[0] : null),
            maxH: (this.maxWH ? this.maxWH[1] : null),
        };
        this.combineScreenShotFun(opt).then(()=>{
            this.eleContainer.scrollTop= this.oldPos.y;
            this.eleContainer.scrollLeft=this.oldPos.x;
            this.doing=false;
            this.showExclude();
        });   
    }
}



/**
 * 对一行或一列中的位置进行分割
 * @param {*} viewPortWidth 容器的大小 
 * @param {*} contentWidth  内容的大小
 * @returns 
 * [
 *      {
 *          scroll:0,   //滚动大小
            pos:0,      //在结果中截取的位置
            len         //结果大小
 *      }
 * ]
 */
const splitPos=(viewPortWidth, contentWidth)=>{
    // 内容未超出容器大小，不需要滚动，只返回一个结果，即整个容器的区域
    if(contentWidth<=viewPortWidth){
        return {
            scroll:0,
            from: 0,
            to: viewPortWidth,
            pos:0,
            len: viewPortWidth,
        };
    }

    // 内容超出容器大小，依次计算滚动位置和要截取的位置
    const result=[];
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

    let currPos=0;
    while(true){


        result.push({
            scroll: (currPos+viewPortWidth>contentWidth ? contentWidth-viewPortWidth : currPos),
            pos: (currPos+viewPortWidth>contentWidth ? (viewPortWidth-(contentWidth-currPos)) : 0),
            len: viewPortWidth,
        });
        if(currPos+viewPortWidth>=contentWidth){
            break;
        }
        currPos+=viewPortWidth;
    }
    return result;
};


const startLeft=0;//标题和菜单部分占用的高度
const startTopWithTitleAndMenu=43;//标题和菜单部分占用的高度
const startTopWithOnlyTitle=23;//标题部分占用的高度
const scrollbarThick=17;//滚动条的宽度


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

    // 开始截屏处理，每次截取完成使用setTimeout调用下一次，都截取完成后调用doEnd进行合并
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
                    setTimeout(eachShot, 100);
                    return;
                }
                setTimeout(doEnd, 100);
            });
        }, 50);
    };
    setTimeout(eachShot, 100);




    // 合并与收尾处理
    const doEnd=()=>{
        // 恢复原来的滚动位置
        // 解除截屏前的预处理，即预处理的反向操作
        eleContainer.scrollTop=originScroll[0];
        eleContainer.scrollLeft=originScroll[1];
        if(postHandle){
            postHandle();
        }

        //
        const combineConfig={
            Action: "combine_scrshot",
            SumSize: {
                Width: sumW,
                Height: sumH,
            },
            Items:result.map(({pos})=>({X1:pos.x1, X2:pos.x2, Y1:pos.y1, Y2:pos.y2})),
            ResultType: 0,
            ResultPath: "",
            ForceValidSize: false,
            ValidSize: null,
            // 由ipcMain处理，把实际的buffer传递到go后端
            shotIds: result.map(({pos})=>pos.shotId),
        };
        console.log("final result ", combineConfig);
        api.combineScrshot(combineConfig);
    };

    // takeScrshot
};

export {
    takeScrshot,
};


export default new ScreenShotSvc().doScreenShot;