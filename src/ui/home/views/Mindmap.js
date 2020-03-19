/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import { Button,Tooltip } from 'antd';
import { PlusCircleOutlined,MinusCircleOutlined,FormOutlined } from '@ant-design/icons';

class Mindmap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {   
        };   
    }


    render() {
        return (
            <table border='0' cellSpacing='0' cellPadding='0'  align='center' css={mindTabStyle}>
                <tbody>
                {
                    this.props.cells.map((line,rowInd)=>
                        <tr key={rowInd}>
                        <td className='paddingcell'></td>
                        {
                            line.map((item,colInd)=>
                                <td key={colInd} css={item.cls}>
                                    <span className='themetxt'>
                                        {item.txt}
                                        {
                                            (item.nd && item.nd.memo && 0!==item.nd.memo.length) && 
                                            <Tooltip title={
                                                <div>
                                                    {
                                                        item.nd.memo.map((eachmemo,memoInd)=><div key={memoInd}>{eachmemo}</div>)
                                                    }
                                                </div>
                                            }><FormOutlined className='memoicon'/></Tooltip>
                                        }
                                    </span>
                                    {
                                        (item.nd && false===item.nd.leaf ) && 
                                        <Button type="link" size='small' title={item.nd.expand?"折叠":"展开"} className='btn' 
                                            icon={item.nd.expand ?<MinusCircleOutlined className='icon' />:<PlusCircleOutlined className='icon' />}  
                                            onClick={this.props.onToggleExpand.bind(this,item)}/>
                                    }
                                </td>    
                            )
                        }
                        <td className='paddingcell'></td>
                        </tr>
                    )
                }
                </tbody>
            </table>
        );
    }

    

    
}

const mindTabStyle={
    borderCollapse: 'separate',
    maxWidth:999999999,
    marginLeft:'auto',
    marginRight:'auto',

    '& td':{
        paddingLeft:14,
        paddingRight:14,
        whiteSpace:'nowrap',
        textAlign:'left'
    },

    '& td.paddingcell':{
        paddingLeft:16,
        paddingRight:16
    },

    '& td .memoicon':{
        fontSize:16,
        lineHeight:'16px',
        marginLeft:5,
        color:'#fa8c16'
    }
}; 






export default Mindmap;