import api from './api';
import { message } from 'antd';

class ExpSvc{
    expHtml=(title='', content='')=>{
        let path=api.openSaveFileDlg("html");
        if(!path){
            return;
        }
        api.getBasePath().then(basePath=>{
            let txt=api.load(`${basePath}\\tmpl_exp_html.html`).replace('#title#',title).replace('#cont#',content);
            api.save(path, txt);
            message.success("导出html完成");
            console.log("导出html完成");
        });
    };

    expMarkdown=(content='')=>{
        let path=api.openSaveFileDlg("md");
        if(!path){
            return;
        }
        api.save(path, content);
        message.success("导出markdown完成");
        console.log("导出markdown完成");
    };
}

export default new ExpSvc();