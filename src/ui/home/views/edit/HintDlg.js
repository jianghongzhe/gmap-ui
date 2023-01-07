import React, {useState} from 'react';


/**
 *
 * @param pos {left:5, top:6}
 * @param menus [
 *      {
 *          selected: true/false,
 *          label: '',
 *          option: {}
 *      }
 * ]
 * @param onOk
 * @param onCancel
 * @return {JSX.Element}
 * @constructor
 */
const HintDlg=({pos, menus, bindRefFunc, onClick, onSelect})=>{

    return (<React.Fragment>
        {
            (pos && menus?.length>0) && (
                <ul ref={bindRefFunc} className="CodeMirror-hints default" style={{left: `${pos.left}px`, top: `${pos.top}px`,}}>
                    {
                        menus.map((eachMenu, menuInd)=>(<React.Fragment key={`hintmenu-${menuInd}`}>
                            {
                                "-"!==eachMenu ?
                                (
                                    <li     className={`CodeMirror-hint ${eachMenu.selected ? "CodeMirror-hint-active" : ""}`}
                                            onClick={onClick.bind(this, menuInd)}
                                            onMouseOver={onSelect.bind(this, menuInd)}>
                                        {eachMenu.label}
                                    </li>
                                ) :
                                (
                                    <li  className="CodeMirror-hint" style={{cursor:'default',}}>
                                        <div style={{height:'1px', backgroundColor:"#DDD", marginTop:'5px',marginBottom:'5px',}}></div>
                                    </li>
                                )
                            }
                        </React.Fragment>))
                    }
                </ul>
            )
        }
    </React.Fragment>);
};

export default React.memo(HintDlg);