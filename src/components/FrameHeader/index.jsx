import { Button } from "antd"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Iconfont from "../Iconfont"
import styles from './index.module.scss'

export default function FrameHeader ({title}) {

    const [fontSize, setFontSize] = useState(11)
    
    return (
        <div className={styles.frameHeaderWrap}>
            <div className={styles.titleWrap}></div>
            <div className={styles.rightButton}>
                <Iconfont iconName={'icon-minimize'} fontSize={fontSize}/>
            </div>
            <div className={styles.rightButton}>
                <Iconfont iconName={'icon-normal-size'} fontSize={fontSize}/>
            </div>
            <div className={styles.rightButton}>
                <Iconfont iconName={'icon-close'} fontSize={fontSize}/>
            </div>
        </div>
    )
}