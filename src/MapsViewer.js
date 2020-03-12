/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { Component } from 'react';
import { Layout, Menu, Breadcrumb,Tabs,Modal,Input,message,Button,Divider,Row, Col,  } from 'antd';
import { UserOutlined, LaptopOutlined, NotificationOutlined,SearchOutlined,PlusOutlined,FolderOpenOutlined,EditOutlined  } from '@ant-design/icons';

import mindmapSvc from './mindmapSvc';
import Mindmap from './Mindmap';
import Welcome from './Welcome';

const { SubMenu } = Menu;
const { Header, Content, Footer, Sider } = Layout;
const { TextArea } = Input;

const { TabPane } = Tabs;

class MapsViewer extends Component {
    constructor(props) {
        super(props);
        this.newTabIndex = 0;
        const panes = [
          // { title: 'Tab 1', content: 'Content of Tab 1', key: '1' },
          // { title: 'Tab 2', content: 'Content of Tab 2', key: '2' },
          // {
          //   title: 'Tab 3',
          //   content: 'Content of Tab 3',
          //   key: '3',
          //   closable: false,
          // },
        ];
        this.state = {
          mapTxtarea:null,
          editTmpTxt:'',
          editMapDlgVisible:false,
          newMapDlgVisible:false,
          newMapName:'',
          activeKey: null,// panes[0].key,
          panes:[
          ],
        };

        this.tabHeight=document.documentElement.clientHeight-64;
    }


    onChange = activeKey => {
        this.setState({ activeKey });
      };
    
      onEdit = (targetKey, action) => {
        this[action](targetKey);
      };
    
      add = () => {
        const { panes } = this.state;
        const activeKey = `newTab${this.newTabIndex++}`;
        panes.push({ title: 'New Tab', content: 'Content of new Tab', key: activeKey });
        this.setState({ panes, activeKey });
      };
    
      remove = targetKey => {
        let { activeKey } = this.state;
        let lastIndex;
        this.state.panes.forEach((pane, i) => {
          if (pane.key === targetKey) {
            lastIndex = i - 1;
          }
        });
        const panes = this.state.panes.filter(pane => pane.key !== targetKey);
        if (panes.length && activeKey === targetKey) {
          if (lastIndex >= 0) {
            activeKey = panes[lastIndex].key;
          } else {
            activeKey = panes[0].key;
          }
        }
        this.setState({ panes, activeKey });
      };


    onAddMap=()=>{
      this.setState({
        newMapDlgVisible:true,
        newMapName:''
      });
    }

    onNewMapDlgCancel=()=>{
      this.setState({
        newMapDlgVisible:false
      });
    }

    onEditMap=()=>{
      let item=this.state.panes.filter(pane=>pane.key===this.state.activeKey);
      if(null==item || 0===item.length){
        return;
      }

      this.setState({
        editMapDlgVisible:true,
        editTmpTxt:item[0].mapTxts
      }); 
    }

    onEditMapDlgCancel=()=>{
      this.setState({
        editMapDlgVisible:false
      });
    }
    onEditMapDlgOK=()=>{


      let txt=this.state.editTmpTxt.trim();
      if(''===txt){
        message.warning('请输入图表内容');
        return;
      }

      let item=this.state.panes.filter(pane=>pane.key===this.state.activeKey);
      if(null==item || 0===item.length){
        return;
      }

      item=item[0]
      let cells=mindmapSvc.parseMindMapData(txt,defaultLineColor,centerThemeStyle,bordType,getBorderStyle);
      item.mapTxts=txt;
      item.mapCells=cells;
      this.setState({ 
        panes:[...this.state.panes],
        editMapDlgVisible:false
      });
      
      
    }

    onChangeNewMapName=(e)=>{
      this.setState({
        newMapName:e.target.value
      });
    }

    onChangeEditTmpTxt=(e)=>{
      this.setState({
        editTmpTxt:e.target.value
      });
    }

    setMapTxtareaControl=(control)=>{
      this.mapTxtarea=control.resizableTextArea.textArea;
  }

    editTmpTxtKeyDown=(e)=>{
      if(9===e.keyCode){
        e.preventDefault();

        let val=e.target.value;
        let ind=e.target.selectionStart;
        let left=(0===ind ? "" : val.substring(0,ind));
        let right=(ind===val.length-1?"":val.substring(ind));
        let newVal=left+"\t"+right;

        
        
        
        this.setState({
          editTmpTxt:newVal
        });
       
        setTimeout(()=>{
          //console.log("框", this.mapTxtarea.resizableTextArea.textArea);
          this.mapTxtarea.selectionStart=ind+1;
          this.mapTxtarea.selectionEnd=ind+1;
        },50);

        //
      }
      
      // if(e.keyCode)
      // 
    }



    toggleExpand=(key,cell)=>{
      //alert(key+" "+cell);

      this.state.panes.filter(eachPane=>key===eachPane.key).forEach(eachPane=>{
        eachPane.mapCells=mindmapSvc.toggleExpandNode(cell);
      });
      this.setState({ 
        panes:[...this.state.panes]
      });

      // alert(cell.nd.str);
      // 
      // this.setState({
      //     cells:cells
      // });
  }


    onNewMapDlgOK=()=>{
      let name=this.state.newMapName.trim();
      if(''===name){
        message.warning('请输入图表名称');
        return;
      }

      let id="map_"+new Date().getTime();
      let cells=mindmapSvc.parseMindMapData(defMapTxt,defaultLineColor,centerThemeStyle,bordType,getBorderStyle);

      
      let tabdata=this.state.panes;
      tabdata.push({
        title:name,
        key:id,
        mapTxts:defMapTxt,
        mapCells:cells
      });
      this.setState({ 
        panes:[...tabdata], 
        activeKey:id,
        newMapDlgVisible:false
      });
    }

    onSelectMapItem=()=>{
      let id="map_"+new Date().getTime();
      let cells=mindmapSvc.parseMindMapData(defMapTxt,defaultLineColor,centerThemeStyle,bordType,getBorderStyle);

      
      let tabdata=this.state.panes;
      tabdata.push({
        title:"名字"+id,
        key:id,
        mapTxts:defMapTxt,
        mapCells:cells
      });
      this.setState({ 
        panes:[...tabdata], 
        activeKey:id,
        
      });
    }

    
    
    

    render() {
        return (
          <>
            <Layout css={container}>
            {
              (null!=this.state.panes && 0<this.state.panes.length) ?
              <>
                  <Header css={headerStyle}>
                    
                    <Button shape='circle' icon={<PlusOutlined/>} className='toolbtn' type='primary' size='large' onClick={this.onAddMap} title='新建'/>
                    <Button shape='circle' icon={<FolderOpenOutlined />} className='toolbtn' type='primary' size='large' title='打开'/>  
                    <Button shape='circle' icon={<EditOutlined />} className='toolbtn' type='primary' size='large' onClick={this.onEditMap} title='编辑'/>
                    
                    
                    
                    
        
                    

                    
                  </Header>
                 
                  <Tabs
                    hideAdd={true}
        onChange={this.onChange}
        activeKey={this.state.activeKey}
        type="editable-card"
        style={{ height: this.tabHeight+'px','backgroundColor':'white'}}
        onEdit={this.onEdit}
      >
        {this.state.panes.map(pane => (
          <TabPane tab={pane.title} key={pane.key} closable={true}>
              <div style={{height: (this.tabHeight-55)+'px','overflowY':'auto','overflowX':'auto'}}>
                
                    <Mindmap cells={pane.mapCells} onToggleExpand={this.toggleExpand.bind(this,pane.key)}/> 
                    
                    
                
                

                
              </div>

              
            
          </TabPane>
        ))}
      </Tabs>
              </> :

<Content>






 

<Welcome onAddMap={this.onAddMap} onSelectMapItem={this.onSelectMapItem}/>


</Content>
          } 



                
                
                    
                    
                
                
                
            </Layout>
            <Modal
              title="新建图表"
              visible={this.state.newMapDlgVisible}
              onOk={this.onNewMapDlgOK}
              onCancel={this.onNewMapDlgCancel}
            >
              <Input placeholder="请输入图表名称" value={this.state.newMapName} onChange={this.onChangeNewMapName}/>
          </Modal>
          <Modal
              style={{'minWidth':'1800px','width':'1800px'}}
              title="编辑图表内容"
              visible={this.state.editMapDlgVisible}
              onOk={this.onEditMapDlgOK}
              onCancel={this.onEditMapDlgCancel}
            >
             <TextArea ref={this.setMapTxtareaControl} rows={25} value={this.state.editTmpTxt} onChange={this.onChangeEditTmpTxt} onKeyDown={this.editTmpTxtKeyDown}/>
          </Modal>
          </>
        );
    }
}

const editTxtModalStyle=css`
  width:1800px;
`;

//background-color:#f0f2f5;
//background-color:#EEE;
const headerStyle=css`
    background-color:#FFF;
    padding-left:0px;
    & .toolbtn{
      margin-left:20px;
    }
    & .divider{
      margin:0px;
      padding:0px;
    }
`;

//background-color:white;  
const container=css`
    
`;

const defaultLineColor='lightgrey';

//边框类型枚举
const bordType={
    l: 1,
    r: 2,
    t: 4,
    b: 8,
    rbRad: 16,
    lbRad: 32,
    rtRad: 64,
    ltRad: 128,
};

//根据边框类型动态生成对应的样式
const getBorderStyle=(type,color='lightgrey')=>{
    if(bordType.l===type){
        return css`border-left:2px solid ${color};`;
    }
    if(bordType.r===type){
        return css`border-right:2px solid ${color};`;
    }
    if(bordType.t===type){
        return css`border-top:2px solid ${color};`;
    }
    if(bordType.b===type){
        return css`border-bottom:2px solid ${color};`;
    }

    if(bordType.rbRad===type){
        
        return css`border-bottom-right-radius:14px;`;
    }
    if(bordType.lbRad===type){
        return css`border-bottom-left-radius:14px;`;
    }
    if(bordType.rtRad===type){
        return css`border-top-right-radius:14px !important;`;
    }
    if(bordType.ltRad===type){
        return css`border-top-left-radius:14px;`;
    }
};


//#2db7f5
const centerThemeStyle=css`
    padding-top:0px;
    padding-bottom:0px;
    vertical-align:center !important;
    
    & span.themetxt{
        display:inline-block;
        padding:6px 20px 6px 20px;
        background-color:#108ee9;
        border-radius:5px;
        color:white;
        font-size:18px !important;
    }
`;



const defMapTxt=
  "- JVM\n"+
  "\t- bbb\n"+
  "\t- ccc\n"+
  "\t- ddd\n"+
  "\t- eee\n"+
  "\t- fff\n"+
  "\t- ggg\n"+
  "\t\t- sss|m:说明一下哈哈\n"+
  "\t- dfa\n"+
  "\t- sdfsd";

  // "- 数据结构",
  // "\t- 线性结构",
  // "\t\t- 顺序表",
  // "\t\t- 链表",
  // "\t\t\t- 单向",
  // "\t\t\t\t- 循环",
  // "\t\t\t\t\t- 约瑟夫问题",
  // "\t\t\t\t- 非循环",
  // "\t\t\t- 双向",
  // "\t\t\t\t- 循环",
  // "\t\t\t\t- 非循环",
  // "\t\t- 栈",
  // "\t\t\t- 逆波兰计算器",
  // "\t\t\t\t- 中缀转后缀表达式",
  // "\t\t\t\t- 后缀表达式计算|m:见数进栈|m:见符号取两数计算结果进栈|m:直到最后一个数即为结果",
  // "\t\t- 队列",
  // "\t\t\t- 优先队列",
  // "\t- 非线性结构",
  // "\t\t- 二维表",
  // "\t\t- 多维表",
  // "\t\t- 广义表",
  // "\t\t- 哈希表",
  // "\t\t- c:red|树|m:哈哈|m:第二一个|m:第三个",
  // "\t\t\t- 遍历",
  // "\t\t\t\t- 先序",
  // "\t\t\t\t- 后序",
  // "\t\t\t- 二叉树",
  // "\t\t\t\t- 遍历",
  // "\t\t\t\t\t- 前序",
  // "\t\t\t\t\t- 中序",
  // "\t\t\t\t\t- 后序",
  // "\t\t\t- 线索二叉树",
  // "\t\t\t- 哈夫曼树",
  // "\t\t\t- B树",
  // "\t\t\t- B+树",
  // "\t\t\t- B*树",
  // "\t\t\t- 红黑树",
  // "\t\t- c:blue|图",
  // "\t\t\t- 遍历",
  // "\t\t\t\t- 深度",
  // "\t\t\t\t- 广度",
  // "\t\t\t- 有向",
  // "\t\t\t- 无向",
  // "\t\t\t- 带权",
// ];

export default MapsViewer;