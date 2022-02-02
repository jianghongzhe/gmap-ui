/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Input, Space, Typography} from 'antd';


const { Title,Paragraph } = Typography;

const FindInFileDlg=(props)=>{


    const cont=["前中华人民共和国中华人民共和国", {txt:"中间的部分", keyword:true}, "后中华人民共和国中华人民共和国"];

    const conts=[];
    for(var i=0;i<25;++i){
        conts.push({cont});
    }


    return <Modal 
            visible={props.visible}
            title="文件内查找"
            footer={null}
            width={"calc(80vw)"}
            onCancel={props.onCancel}>
        <div>
            <Space direction='vertical' css={{width:"80%"}}>
                <Input addonBefore="标题：　　　" size="large"/>
                <Input addonBefore="内容：　　　" size="large"/>
                <Input addonBefore="标题和内容：" size="large"/>
            </Space>
            <div css={{marginTop:'40px', maxHeight: 'calc(100vh - 350px)',height: 'calc(100vh - 450px)', overflowY:'auto'}}>
                {
                    conts.map((searchItem, ind)=><div css={{cursor:'pointer', marginBottom:'30px'}}>
                        <Title level={4}>h4. Ant Design</Title>
                        <Paragraph >
                            {
                                searchItem.cont.map((item,ind)=><React.Fragment key={"txt-"+ind}>
                                    {
                                        true===item.keyword ? 
                                            <span css={{color:'#f73131'}}>{item.txt}</span>
                                                :
                                            <span>{item}</span>
                                    }
                                </React.Fragment>)
                            }
                            
                            </Paragraph>
                    </div>)

                }

                
                
                
            </div>
        </div>
    </Modal>;
};


export default React.memo(FindInFileDlg);