import React from 'react';
import globalStyleConfig from "../../../../common/globalStyleConfig";
import styles from './HintDlg.module.scss';
import classnames from "classnames";


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
                <ul ref={bindRefFunc}
                    className="CodeMirror-hints default"
                    style={{
                        '--left': `${pos.left}px`,
                        '--top': `${pos.top}px`,
                        '--maxh': `${globalStyleConfig.hintDlg.maxh}px`
                    }}
                >
                    {
                        menus.map((eachMenu, menuInd)=>(<React.Fragment key={`hintmenu-${menuInd}`}>
                            {
                                "-"!==eachMenu ?
                                (
                                    <li     className={classnames('CodeMirror-hint', {"CodeMirror-hint-active":eachMenu.selected})}
                                            onClick={onClick.bind(this, null)}
                                            onMouseOver={onSelect.bind(this, menuInd)}>
                                        {eachMenu.label}
                                    </li>
                                ) :
                                (
                                    <li  className="CodeMirror-hint splitItem">
                                        <div></div>
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