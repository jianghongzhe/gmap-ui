import React, { useCallback, useMemo } from 'react';
import { Breadcrumb,Button,Row, Col,List, Avatar,Divider,BackTop   } from 'antd';
import { FileMarkdownOutlined,ReloadOutlined,HomeOutlined,FolderOutlined } from '@ant-design/icons';
import { useBindAndGetRef } from '../../../common/commonHooks';

/**
 * 路径选择
 */
const PathSelect=({maxH, forceMaxH, backtopLoc, filelist, dirs, onloadDir, onloadCurrDir, onSelectMapItem: onselectFileItem})=>{
    const [, bindListRef, getScrollTarget]=useBindAndGetRef();

    const onSelectMapItem=useCallback((item)=>{
        if (!item.isfile) {
            onloadDir(item.fullpath);
            return;
        }
        onselectFileItem(item);
    },[onloadDir, onselectFileItem]);

    
    //列表样式，如果指定的forceMaxH，则保持高度和最大高度一致
    const listWrapperStyle=useMemo(()=>{
        let style={
            'maxHeight':maxH,
            'overflowY':'auto',
            'overflowX':'hidden',

            '& .listitem:hover':{
                backgroundColor:'#EEE',
                borderRadius:10,
            },
            '& .listitem':{
                cursor:'pointer',
                transition: 'all 0.3s 0s',
                transitionTimingFunction: 'ease',
            }
        };
        if(forceMaxH){
            style={'height':maxH,'minHeight':maxH, ...style};
        }
        return style;
    },[maxH, forceMaxH]);


    return (
        <React.Fragment>
            <Row>
                <Col span={22}>
                    <Breadcrumb> 
                        {
                            dirs.map((dir,ind)=>(
                                <Breadcrumb.Item key={ind}  {...(dir.iscurr?{}:{'href':'#'})}  onClick={onloadDir.bind(this,dir.fullpath)}>
                                    {dir.ishome ? <HomeOutlined /> : dir.showname}
                                </Breadcrumb.Item>
                            ))
                        }    
                    </Breadcrumb>
                </Col>
                <Col span={2} css={{textAlign:'right'}}>
                    <Button title='刷新' size='small' type="default" shape="circle" icon={<ReloadOutlined />} onClick={onloadCurrDir} />
                </Col>
            </Row>                          
            <Divider css={{marginTop:'10px',marginBottom:'0px'}}/>
            
            {/* id={listWrapperId} */}
            <div css={listWrapperStyle}  ref={bindListRef}>                   
                <List
                    itemLayout="horizontal"
                    dataSource={filelist}
                    renderItem={item => (
                        <List.Item className='listitem' onClick={onSelectMapItem.bind(this,item)} {...getListItemExtra(item)}>
                            <List.Item.Meta 
                                avatar={
                                    <Avatar icon={item.isfile ? <FileMarkdownOutlined /> : <FolderOutlined />} 
                                        css={{ "backgroundColor": (item.isfile?'#40a9ff':'orange') }} />
                                }
                                title={item.showname}
                                description={item.size}/>
                        </List.Item>
                    )}
                />
            </div>
            
            {
                (backtopLoc && 2===backtopLoc.length) && (
                    <BackTop target={getScrollTarget} css={{right:backtopLoc[0],bottom:backtopLoc[1]}}/>
                )
            }
        </React.Fragment>
    );
}


const getListItemExtra=(item)=>{
    if(item.pic){
        return {
            extra: <div css={{marginRight:16,width:48,height:48,
                    backgroundImage:`url('${item.pic}')`,
                    backgroundRepeat:'no-repeat',
                    backgroundSize:'cover',
                    backgroundPosition:'center center'}}></div>
        };
    }
    return {};
}



export default PathSelect;