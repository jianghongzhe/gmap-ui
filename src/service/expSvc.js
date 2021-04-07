import api from './api';
import { Layout,   Tabs, Modal, Input, message, Button, Divider,Popover,BackTop,Avatar } from 'antd';

class ExpSvc{
    expHtml=(title='', content='')=>{
        let path=api.openSaveFileDlg("html");
        if(!path){
            return;
        }
        let txt=api.load(`${api.getBasePath()}\\tmpl_exp_html.html`).replace('#title#',title).replace('#cont#',content);
        api.save(path, txt);
        message.success("导出html完成");
        console.log("导出html完成");
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