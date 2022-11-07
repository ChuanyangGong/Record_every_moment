import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "antd"
import styles from './index.module.scss'
import CONST from "../../common/const"
import moment from 'moment';

import ClockItem from "./components/ClockItem"

export default function MiniRecoder() {
    const [timeRecords, setTimeRecords] = useState([])
    const [hasPassedTime, setHasPassedTime] = useState(moment.duration(0))
    const [curStatus, setCurStatus] = useState(CONST.CLOCK_STATUS.READY_TO_START)
    const [intervalHandler, setIntervalHandler] = useState(null)

    // 启动定时任务
    const startInterval = useCallback((timeRecords) => {
        const handler = window.setInterval(() => {
            const lastRecord = timeRecords[timeRecords.length - 1]
            const passedTime = lastRecord.hasPassed.clone().add(moment().diff(lastRecord.startAt))
            setHasPassedTime(passedTime)
        }, 100)
        if (intervalHandler !== null) {
            window.clearInterval(intervalHandler)
        }
        setIntervalHandler(handler)
    }, [intervalHandler])

    // 处理状态变更事件
    const onChangeStatus = useCallback((action) => {
        let newTimeReocrds = [...timeRecords]
        let newStatus = curStatus
        
        if (action === "start") {
            let newRecord = {
                startAt: moment(),
                endAt: null,
                hasPassed: moment.duration(0)
            }
            if (newTimeReocrds.length > 0) {
                let lastRecord = newTimeReocrds[newTimeReocrds.length - 1]
                let duration = moment.duration(lastRecord.endAt.diff(lastRecord.startAt))
                newRecord.hasPassed = lastRecord.hasPassed.clone().add(duration)
            }
            newTimeReocrds.push(newRecord)
            newStatus = CONST.CLOCK_STATUS.IS_RECORDING
        } else {
            let lastRecord = newTimeReocrds[newTimeReocrds.length - 1]
            lastRecord.endAt = moment()
            newStatus = action === "pause" ? CONST.CLOCK_STATUS.IS_PAUSE : CONST.CLOCK_STATUS.READY_TO_START
            
            if (intervalHandler !== null) {
                window.clearInterval(intervalHandler)
            }
            setIntervalHandler(null)
        }
        if (action === "stop") {
            setHasPassedTime(moment.duration(0))
            newTimeReocrds = []
        }
        setTimeRecords(newTimeReocrds)
        setCurStatus(newStatus)
        
        // 启动定时任务，更新时间
        if (newStatus === CONST.CLOCK_STATUS.IS_RECORDING) {
            startInterval(newTimeReocrds)
        }
    }, [curStatus, intervalHandler, startInterval, timeRecords])

    const ButtonList = useMemo(() => {
        let res = []
        if (curStatus === CONST.CLOCK_STATUS.READY_TO_START) {
            res.push(
                <Button key="start" onClick={() => onChangeStatus("start")}>开始</Button>
            )
        } else if (curStatus === CONST.CLOCK_STATUS.IS_PAUSE) {
            res.push(
                <Button key="continue" onClick={() => onChangeStatus("start")}>继续</Button>,
            )
        } else if (curStatus === CONST.CLOCK_STATUS.IS_RECORDING) {
            res.push(
                <Button key="pause" onClick={() => onChangeStatus("pause")}>暂停</Button>,
            )
        }
        if (curStatus !== CONST.CLOCK_STATUS.READY_TO_START) {
            res.push(
                <Button key="stop" onClick={() => onChangeStatus("stop")}>结束</Button>,
            )
        }
        return res
    }, [curStatus, onChangeStatus])

    return (
        <div className={styles.mainWraper}>
            <ClockItem hasPassedTime={hasPassedTime}/>
            {ButtonList}
        </div>
    )
}