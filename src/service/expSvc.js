import api from './api';

class ExpSvc{
    expHtml=(title='', content='', preHandle=false)=>{
        (async()=>{
            try{
                if(preHandle){
                    content=this.preHandleMDBeforeExport(content);
                }
                const path= await api.openSaveFileDlg("html");
                const basePath=await api.getBasePath();
                let txt=await api.load(`${basePath}\\tmpl_exp_html.html`);
                txt=txt.replace('#title#',title).replace('#cont#',content);
                await api.save(path, txt);
                api.showNotification('操作成功', '已导出html', 'succ');
            }catch(e){
                if(e instanceof Error && e.message.includes('已取消')){
                    return;
                }
                api.showNotification('操作失败', '未能已导出html', 'err');
                console.log(e);
            }
        })();
    };

    expMarkdown=(content='', preHandle=false)=>{
        (async()=>{
            try{
                if(preHandle){
                    content=this.preHandleMDBeforeExport(content);
                }
                const path=await api.openSaveFileDlg("md");
                await api.save(path, content);
                api.showNotification('操作成功', '已导出markdown', 'succ');
            }catch(e){
                if(e instanceof Error && e.message.includes('已取消')){
                    return;
                }
                api.showNotification('操作失败', '未能导出markdown', 'err');
                console.log(e);
            }
        })();
    };

    preHandleMDBeforeExport=(mdTxt)=>{
        let hasReachRefPart=false;
        let resultLines=[];
        let idInd=0;
        const refNameIdMap={};

        mdTxt.replace(/\r/g,"").split("\n").forEach(line=>{
            let lineTrim=line.trim();

            // 节点和引用的分隔符
            if("***"===lineTrim && !hasReachRefPart){
                hasReachRefPart=true;
                resultLines.push("***");
                return;
            }

            // 节点部分
            if(!hasReachRefPart){
                let handledLine=line;
                extractRefNames(line).forEach(refPart=>{
                    const refName=refPart.substring("ref:".length);
                    const refId=`ref${++idInd}`;
                    const anchorMd=`[${refName}](#${refId})`;
                    handledLine=handledLine.replace(refPart, anchorMd);
                    refNameIdMap[refPart]=refId;
                });
                resultLines.push(handledLine);
                return;
            }

            // 引用部分
            if(lineTrim.startsWith("# ref:")){
                const refName=lineTrim.substring("# ".length);
                if('undefined'!==typeof(refNameIdMap[refName])){
                    resultLines.push(`${lineTrim.replace("ref:","")} <span id="${refNameIdMap[refName]}"> </span>`);
                    return;
                }
                resultLines.push(`${lineTrim.replace("ref:","")}`);
                return;
            }
            resultLines.push(line);
        });
        return resultLines.join("\r\n");
    };
}


/**
 * 从节点行中提取引用部分
 * @param ndLine
 * @returns ["ref:aa", "ref:bb"]
 */
 const extractRefNames=(ndLine)=>{
    ndLine=ndLine.trim();
    if(ndLine.startsWith("- ")){
      ndLine=ndLine.substring(2).trim();
    }
    return ndLine.split(/(?<![\\])[|]/g)
            .map(item=>item.replace(/[\\][|]/g,"|").trim())
            .filter(item=>item.startsWith("ref:"));
};

const inst=new ExpSvc();
export default inst;