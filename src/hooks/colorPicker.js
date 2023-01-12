import {useBoolean, useMemoizedFn} from "ahooks";
import {dispatch} from 'use-bus';
import {editorEvents} from "../common/events";

export const useColorPicker=()=>{
    const [colorPickerVisible, {setTrue:showColorPicker, setFalse:hideColorPicker}]=useBoolean(false);
    const [advColorPickerVisible, {setTrue:showAdvColorPicker, setFalse:hideAdvColorPicker}]=useBoolean(false);

    const onAddColor =useMemoizedFn((color = null, delayFocus = false) => {
        /*setEditorAction({
            type: 'addColor',
            color,
            delayFocus
        });*/

        dispatch({
            type: editorEvents.addColor,
            payload: {
                color,
                delayFocus
            }
        });
    });

    const onClearColor =useMemoizedFn(() => {
        onAddColor(null);
    });

    const handleColorPickerColorChange =useMemoizedFn((color) => {
        hideColorPicker();
        hideAdvColorPicker();
        onAddColor(color.hex, true);
    });


    return [colorPickerVisible, advColorPickerVisible, onAddColor, onClearColor, showColorPicker, showAdvColorPicker, handleColorPickerColorChange, hideColorPicker, hideAdvColorPicker];
};
