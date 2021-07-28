class ScreenShotSvc{
    constructor(){
        this.doing=false;
        this.resultImgPath=null;
    }


    /**
     * 进行滚动截屏，此方法会暴露给外部调用
     * @param {*} selFileFun        保存文件对话框函数
     * @param {*} takeScrenShotFun  截屏命令执行的函数
     * @param {*} eleContainer      容器组件的html元素对象
     * @param {*} eleContent        实际内容的组件的html元素对象
     * @param {*} offsetX           要开始截取的部分相对于浏览器主内容区域左端的偏移
     * @param {*} offsetY           要开始截取的部分相对于浏览器主内容区域上端的偏移
     */
    doScreenShot=(selFileFun, takeScrenShotFun, combineScreenShotFun, eleContainer, eleContent, offsetX=0, offsetY=0, hasBrowserMenu=true)=>{       
        //当前截屏任务未完成时不允许进行操作
        if(this.doing){
            return;
        }


        //保存文件对话框点击取消后不进行操作
        let resultImgPath=selFileFun();
        if('undefined'===typeof(resultImgPath)){
            return;
        }


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
            this.prepareScreenShot(eleContainer, eleContent);
        }, 200);
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
                    scrollTop:  row.scroll,
                    cutLeft:    col.pos,
                    cutTop:     row.pos,
                    width:      col.len,
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
                await this.takeScrenShotFun({
                    left:window.screenLeft+startLeft+this.offsetX,
                    top:window.screenTop+startTop+this.offsetY,
                    width:allPos[y][x].width,
                    height:allPos[y][x].height,
                    fileName:allPos[y][x].filename
                });
                
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
            ))
        };
        this.combineScreenShotFun(opt).then(()=>{
            this.eleContainer.scrollTop= this.oldPos.y;
            this.eleContainer.scrollLeft=this.oldPos.x;
            this.doing=false;
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
    let currPos=0;


    //计算一行中的位置
    let result=[];
    if(contentWidth<=viewPortWidth){
        result.push({
            scroll:0,
            pos:0,
            len: viewPortWidth,
        });
    }else{
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
    }

    return result;
};


const startLeft=0;//标题和菜单部分占用的高度
const startTopWithTitleAndMenu=43;//标题和菜单部分占用的高度
const startTopWithOnlyTitle=23;//标题部分占用的高度
const scrollbarThick=17;//滚动条的宽度

export default new ScreenShotSvc().doScreenShot;