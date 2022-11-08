import { useState, useEffect, useCallback } from "react";
import styles from "./index.module.scss"

export default function ClockItem(props) {
    const { hasPassedTime } = props
    const [hourStr, setHour] = useState("00")
    const [minuteStr, setMinute] = useState("00")
    const [secondStr, setSecond] = useState("00")

    const timeProcessor = useCallback((data, setter) => {
        if (data < 10) {
            data = "0" + data
        } else if(data > 99) {
            data = 99
        }
        data = data.toString()
        setter(data)
    }, [])

    useEffect(() => {
        timeProcessor(hasPassedTime.get('hours'), setHour)
        timeProcessor(hasPassedTime.get('minutes'), setMinute)
        timeProcessor(hasPassedTime.get('seconds'), setSecond)
    }, [hasPassedTime, timeProcessor])

    return (
        <div className={styles.clockWrap}>
            <div className={styles.clockContent}>
                {hourStr}:{minuteStr}:{secondStr}
            </div>
        </div>
    )
}