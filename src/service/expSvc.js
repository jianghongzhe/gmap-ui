import api from './api';

class ExpSvc{
    expHtml=(title='', content='')=>{
        (async()=>{
            try{
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

    expMarkdown=(content='')=>{
        (async()=>{
            try{
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
}

export default new ExpSvc();