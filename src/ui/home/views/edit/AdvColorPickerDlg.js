/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Layout, Input, Tabs, Modal, Form, message, Button, Divider, Popover } from 'antd';
import { PictureOutlined, FolderOpenOutlined, QuestionCircleOutlined,CalendarOutlined,FileOutlined } from '@ant-design/icons';
import moment  from 'moment';
import { CirclePicker,PhotoshopPicker } from 'react-color';
import {withEnh} from '../../../common/specialDlg';

const EnhDlg=withEnh(Modal);

/**
 * 高级颜色选择对话框
 * @param {*} props 
 */
const AdvColorPickerDlg=(props)=>{
    const [color, setColor]= useState({hex: "#1890ff",});

    const onOk=()=>{
        props.onOk(color);
    }

    return <EnhDlg noTitle noFooter closable={false}
            size={{w: props.w}}
            css={{left: props.l, top: props.t,}}
            visible={props.visible}
            onCancel={props.onCancel}>
        <PhotoshopPicker color={color.hex} onChangeComplete={setColor} onAccept ={onOk} onCancel={props.onCancel}/>
    </EnhDlg>;
};

export default AdvColorPickerDlg;