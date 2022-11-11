import { useCallback } from "react";
import Iconfont from "../../../../components/Iconfont";
import styles from "./index.module.scss"

export default function RecorderHeader() {
    const onMinimize = useCallback(() => {
        window.electronAPI.onMinimizeRecorder();
    }, [])

    const onClose = useCallback(() => {
        window.electronAPI.onCloseRecorder();
    }, [])

    return (
    <div className={styles.dragArea}>
        <div className={styles.dragAreaItem} />
        <div className={styles.rightButtonWrap}>
            <div className={styles.iconWrap} onClick={onMinimize}>
                <Iconfont iconName={'icon-minimize1'} className={styles.minimize}/>
            </div>
            <div className={styles.iconWrap} onClick={onClose}>
                <Iconfont iconName={'icon-close1'}/>
            </div>
        </div>
    </div>        
    )
}