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
const HintDlg=({pos, menus, onOk, onCancel})=>{




    return (<React.Fragment>
        {
            (pos && menus?.length>0) && (
                <ul  className="CodeMirror-hints default" style={{left: `${pos.left}px`, top: `${pos.top}px`,}}>
                    {
                        menus.map((eachMenu, menuInd)=>(
                            <li key={`hintmenu-${menuInd}`} className={`CodeMirror-hint ${eachMenu.selected ? "CodeMirror-hint-active" : ""}`} >
                                {eachMenu.label}
                            </li>
                        ))
                    }
                </ul>
            )
        }
    </React.Fragment>);
};

export default React.memo(HintDlg);