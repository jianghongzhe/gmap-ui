import api from '../service/api';
import {message} from 'antd';
import mindmapSvc from '../service/mindmapSvc';
import newMindmapSvc from '../service/newMindmapSvc';
import mindMapValidateSvc from '../service/mindMapValidateSvc';


const model={
    namespace:'tabs',
    state:{
        activeKey: null,
        panes: [],
    },
    reducers:{
        setPanes:(state,panes)=>{
            return {...state, panes};
        },
        changeActiveKey:(state,activeKey)=>{
            return {...state, activeKey};
        },
        setPanesAndActiveKey:(state,{panes, activeKey})=>{
            return {...state, panes, activeKey};
        },
        removeTab : (state,targetKey) => {
            let { activeKey } = state;
    
            //计算要删除的选项卡前一位置
            let lastIndex = -1;
            state.panes.forEach((pane, i) => {
                if (pane.key === targetKey) {
                    lastIndex = i - 1;
                }
            });
    
            //要删除以外的选项卡集合
            const panes = state.panes.filter(pane => pane.key !== targetKey);
    
            //要删除的是唯一一个选项卡
            if (0 === panes.length) {
                activeKey = null;
            }
            //要删除的项之外还有别的选项卡，并且要删除的是当前活动的选项卡
            else if (activeKey === targetKey) {
                activeKey = panes[lastIndex >= 0 ? lastIndex : 0].key;
            }
            //要删除的项之外还有别的选项卡，并且要删除的不是当前活动的选项卡，则不影响activeKey（即不需要改变）
            else {
                //activeKey不变
            }
    
            return {...state,  panes, activeKey };
        },
    },
    effects:{
        *selectCurrPanePromise(payload,{sel,res,rej}){
            let currState=yield sel();
            let item = currState.panes.filter(pane => pane.key === currState.activeKey);
            if (null == item || 0 === item.length) {
                rej();
                return;
            }
            res(item[0]);
        },

        *onSaveMapPromise(txt,{sel,res,rej,put,gcreater,creater}){
            //校验
            let valiResult = mindMapValidateSvc.validate(txt);
            if (true !== valiResult) {
                message.warning(valiResult);
                rej();
                return;
            }

            //
            let currState=yield sel();
            let item = currState.panes.filter(pane => pane.key === currState.activeKey);
            if (null == item || 0 === item.length) {
                rej();
                return;
            }

            //保存并修改状态
            let ret = api.save(currState.activeKey, txt);
            if (ret && false === ret.succ) {
                message.error(ret.msg);
                rej();
                return;
            }

            item = item[0]
            let rootNd=mindmapSvc.parseRootNode(txt, defaultLineColor, themeStyles, bordType, getBorderStyle, defaultDateColor, false);
            let ndsSet=newMindmapSvc.loadNdsSet(rootNd);
            item.mapTxts = txt;
            item.ds = ndsSet;
            yield put(creater.setPanes([...currState.panes]));
            res();
        },

        *onNewMapPromise(name,{sel,res,rej,put,gcreater,creater}){
            //验证名称为空和文件是否存在
            if (!name || '' === name) {
                message.warning('请输入图表名称');
                rej();
                return;
            }
            let reg = /^[^ 　\\/\t\b\r\n]+([/][^ 　\\/\t\b\r\n]+)*$/;
            if (!reg.test(name)) {
                message.warning('图表名称格式有误，请更换另一名称');
                rej();
                return;
            }
            let fnAndFullpath = api.existsGraph(name);//如果存在返回true，如果不存在返回 [文件名, 全路径]
            if (true === fnAndFullpath) {
                message.warning('该图表名称已存在，请更换另一名称');
                rej();
                return;
            }
            let [fn, themeName, fullpath] = fnAndFullpath;

            //保存文件
            let defMapTxt = getDefMapTxt(themeName);
            let ret = api.save(fullpath, defMapTxt);
            if (ret && false === ret.succ) {
                message.error(ret.msg);
                rej();
                return;
            }

            //计算导图表格信息并加入新tab      
            // let cells = mindmapSvc.parseMindMapData(defMapTxt, defaultLineColor, themeStyles, bordType, getBorderStyle, defaultDateColor);
            let rootNd=mindmapSvc.parseRootNode(defMapTxt, defaultLineColor, themeStyles, bordType, getBorderStyle, defaultDateColor);
            let ndsSet=newMindmapSvc.loadNdsSet(rootNd);

            let currState=yield sel();
            let newPanes=[
                ...currState.panes,
                {
                    title: fn,
                    key: fullpath,
                    mapTxts: defMapTxt,
                    ds: ndsSet,
                }
            ];
            yield put(creater.setPanesAndActiveKey({
                panes:newPanes, 
                activeKey:fullpath,
            }));
            yield put(gcreater.filesel.loadCurrDir());
            res();
        },

        *onSelItemPromise(item,{put,gcreater,select,creater,sel,res,rej}){
            //如果点击了目录，则显示目录下的内容
            if (!item.isfile) {
                yield put(gcreater.filesel.load(item.fullpath));
                rej();
                return;
            }

            //如果选项卡中已经有该项，则激活该tab
            let currState=yield sel();
            if (currState.panes.some(pane => pane.key === item.fullpath)) {
                yield put(creater.changeActiveKey(item.fullpath));
                res();
                return;
            }

            //加载文件内容并计算导图表格的数据
            let origintxts = api.load(item.fullpath);
            if (origintxts && false === origintxts.succ) {
                message.error(origintxts.msg);
                rej();
                return;
            }


            //let cells = mindmapSvc.parseMindMapData(origintxts, defaultLineColor, themeStyles, bordType, getBorderStyle, defaultDateColor);
            let rootNd=mindmapSvc.parseRootNode(origintxts, defaultLineColor, themeStyles, bordType, getBorderStyle, defaultDateColor);
            let ndsSet=newMindmapSvc.loadNdsSet(rootNd);

            //增加新选项卡并设置状态
            let newPanes=[
                ...currState.panes,
                {
                    title: item.itemsName,// item.showname,
                    key: item.fullpath,
                    mapTxts: origintxts,
                    //mapCells: cells,
                    ds: ndsSet,
                }
            ];

            yield put(creater.setPanesAndActiveKey({
                panes:newPanes, 
                activeKey:item.fullpath,
            }));
            res();
        },
        *toggleExpand(nd,{sel,put,creater}){
            let currState=yield sel();
            currState.panes.filter(eachPane => currState.activeKey === eachPane.key).forEach(eachPane => {
                eachPane.ds=newMindmapSvc.toggleExp(eachPane.ds,nd);
            });
            yield put(creater.setPanes([...currState.panes]));
        },
        *expandAll(payload,{sel,put,creater}){
            let currState=yield sel();
            let currPane = currState.panes.filter(eachPane => currState.activeKey === eachPane.key);
            if (currPane && 0 < currPane.length) {
                let eachPane=currPane[0];
                eachPane.ds = newMindmapSvc.expandAll(eachPane.ds);
                yield put(creater.setPanes([...currState.panes]));
            }
        },
        *restoreAll(payload,{sel,put,creater}){
            let currState=yield sel();
            let currPane = currState.panes.filter(eachPane => currState.activeKey === eachPane.key);
            if (currPane && 0 < currPane.length) {
                let eachPane=currPane[0];
                eachPane.ds = newMindmapSvc.restore(eachPane.ds);
                yield put(creater.setPanes([...currState.panes]));
            }
        }
    }

};

const getDefMapTxt = (theleName = "中心主题") => (
    `- ${theleName}
\t- 分主题
\t- c:#1890ff|带颜色的分主题
\t- 带说明的分主题|m:balabala
\t- 带链接的分主题|www.sina.com
\t- 带链接的另一分主题|[新浪网](www.sina.com)
\t- 带引用的分主题|ref:长段文字

***
# ref:长段文字
这里可以放长段内容，支持markdown格式
`
);

const defaultLineColor = 'lightgrey';

const defaultDateColor = {
    expired: '#f5222d',//red', //过期
    near: '#fa8c16',//'orange',    //近几天
    future: '#389e0d',//'#73d13d',//'green'   //以后
};

//根据边框类型动态生成对应的样式
const getBorderStyle = (type, color = 'lightgrey') => {
    let radius = 14;

    //边框样式
    if (bordType.l === type) { return { borderLeft: `2px solid ${color}` }; }
    if (bordType.r === type) { return { borderRight: `2px solid ${color}` }; }
    if (bordType.t === type) { return { borderTop: `2px solid ${color}` }; }
    if (bordType.b === type) { return { borderBottom: `2px solid ${color}` }; }

    //圆角样式
    if (bordType.rbRad === type) { return { borderBottomRightRadius: radius }; }
    if (bordType.lbRad === type) { return { borderBottomLeftRadius: radius }; }
    if (bordType.rtRad === type) { return { borderTopRightRadius: radius }; }
    if (bordType.ltRad === type) { return { borderTopLeftRadius: radius }; }
};

//边框类型枚举
const bordType = {
    l: 1,
    r: 2,
    t: 4,
    b: 8,
    rbRad: 16,
    lbRad: 32,
    rtRad: 64,
    ltRad: 128,
};

//#2db7f5
const centerThemeStyle = {
    paddingTop: 0,
    paddingBottom: 0,
    verticalAlign: 'bottom',

    '& span.themetxt': {
        whiteSpace: 'nowrap',
        display: 'inline-block',
        padding: '0px 0px  0px 0px',
        verticalAlign: 'bottom',
        fontSize: 16,
    },

    '& span.themetxt .themename': {
        color: 'white',
        backgroundColor: '#108ee9',
        borderRadius: 5,
        fontSize: 18,
        lineHeight: '20px',
        padding: '8px 16px',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        marginLeft: 3,
        marginRight: 3,
    },
};

const secendThemeStyle = {
    paddingTop: 12,
    paddingBottom: 0,
    verticalAlign: 'bottom',

    '& span.themetxt': {
        // paddingRight:5,
        whiteSpace: 'nowrap',
        display: 'inline-block',
        marginBottom: 0,
        paddingBottom: 0,
        fontSize: 16,
        lineHeight: '20px',
        verticalAlign: 'bottom',
    },

    '& span.themetxt .themename': {
        whiteSpace: 'nowrap',
        display: 'inline-block',
    },
};

const otherThemeStyle = {
    paddingTop: 12,
    paddingBottom: 0,
    verticalAlign: 'bottom',

    '& span.themetxt': {
        whiteSpace: 'nowrap',
        display: 'inline-block',
        marginBottom: 0,
        paddingBottom: 0,
        fontSize: 14,
        lineHeight: '18px',
        verticalAlign: 'bottom',
    },

    '& span.themetxt .themename': {
        whiteSpace: 'nowrap',
        display: 'inline-block',

    },
};

const themeStyles = [centerThemeStyle, secendThemeStyle, otherThemeStyle];

export default model;