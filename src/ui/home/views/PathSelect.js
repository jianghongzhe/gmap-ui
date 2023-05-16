import React from 'react';
import { Breadcrumb,Button,Row, Col,List, Avatar,Divider,BackTop   } from 'antd';
import { FileMarkdownOutlined,ReloadOutlined,HomeOutlined,FolderOutlined } from '@ant-design/icons';
import { useBindAndGetRef } from '../../../common/commonHooks';
import TagItem from "../../common/TagItem";
import {useMemoizedFn} from "ahooks";
import classnames from 'classnames';
import styles from './PathSelect.module.scss';

/**
 * 路径选择
 */
const PathSelect=({maxH, forceMaxH, backtopLoc, filelist, dirs, onloadDir, onloadCurrDir, onSelectMapItem: onselectFileItem})=>{
    const [, bindListRef, getScrollTarget]=useBindAndGetRef();

    const onSelectMapItem=useMemoizedFn((item)=>{
        if (!item.isfile) {
            onloadDir(item.fullpath);
            return;
        }
        onselectFileItem(item);
    });


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
            <div  className={classnames({[styles.list]:true, [styles.list_force_maxh]:forceMaxH})} style={{'--max-list-h': maxH,}}  ref={bindListRef}>
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
                                description={<div>
                                    <span style={{display:'inline-block', width:'70px'}}>{item.size}</span>
                                    {
                                        (item.isfile && item.tags && item.tags.length>0) && <span>
                                            {item.tags.map((tag,tagInd)=>
                                                <TagItem key={`filelist-tag-${tagInd}`} tag={tag} colored={true}/>
                                            )}
                                        </span>
                                    }
                                </div>}/>
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