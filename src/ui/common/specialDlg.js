import styles from './specialDlg.module.scss';

/**
 * 对话框的增强：支持无头、无底部、指定宽高、固定高等
 * noTitle
 * noFooter
 * size={w, h, fixh, wrapperId, wrapperRef}
 * @param {*} WrappedDlg 
 */
const withEnh=(WrappedDlg)=>{
    return (props)=>{
        const {title,footer,noTitle,noFooter,size,backtop,children, ...otherProps} =props;

        // 对话框中visible属性已弃用，改为open
        let otherPropsEx=otherProps;
        if('undefined'!==typeof (otherProps.visible)){
            let {visible, ...tmp}=otherProps;
            otherPropsEx={...tmp, open:visible};
        }


        let enhProps={};

        //标题和底部
        if(true===noTitle){
            enhProps.title=null;
        }else if('undefined'!==typeof(title)){
            enhProps.title=title;
        }
        if(true===noFooter){
            enhProps.footer=null;
        }else if('undefined'!==typeof(footer)){
            enhProps.footer=footer;
        }

        //宽度
        if(size && size.w){
            enhProps.className=styles.widthStyle;
            enhProps.style={
                '--width': appendPx(size.w),
            };
        }

        //高度：设置该值需要一个容器元素来支撑起来
        let wrapperProps=null;
        if(size && size.h){
            //设置最大高：当内容小于该高度时会自动调整，但不会超过该高度
            wrapperProps={
                className: styles.maxHeightStyle,
                style: {
                    '--height': appendPx(size.h),
                },
            };
            //固定高度：起始显示为该高度，不随内容高度调整
            if(true===size.fixh){
                wrapperProps.className+=` ${styles.fixHeightStyle}`;
            }
            //指定包装容器的id
            if(size.wrapperId){
                wrapperProps.id=size.wrapperId;
            }
            if(size.wrapperRef){
                wrapperProps.ref=size.wrapperRef;
            }
        }

        if(wrapperProps){
            return <WrappedDlg {...enhProps} {...otherPropsEx}><div {...wrapperProps}>{children}</div></WrappedDlg>;
        }
        return <WrappedDlg {...enhProps} {...otherPropsEx}>{children}</WrappedDlg>;
    }
};


const appendPx=(str)=>{
    str=(''+str).trim();
    if(/^[0-9]+$/.test(str)){
        return `${str}px`;
    }
    return str;
};

export {withEnh};