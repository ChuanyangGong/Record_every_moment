import { useState, useEffect, useMemo, useCallback, useRef, useDebugValue } from "react"
import styles from './index.module.scss'
import CONST from "../../common/const"
import moment from 'moment'
import cn from 'classnames'

import ClockItem from "./components/ClockItem"
import Iconfont from "../../components/Iconfont";
import { Input } from "antd"
const { TextArea } = Input

export default function MiniRecoder() {
    const [timeRecords, setTimeRecords] = useState([])
    const [hasPassedTime, setHasPassedTime] = useState(moment.duration(0))
    const [curStatus, setCurStatus] = useState(CONST.CLOCK_STATUS.READY_TO_START)
    const [intervalHandler, setIntervalHandler] = useState(null)

    // 输入当前事项内容
    const [curTaskDesc, setCurTaskDesc] = useState("")

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

    // 提交任务记录
    const excuteSubmitTaskRecord = useCallback((curTaskDesc, timeRecords) => {
        let totalDuration = moment.duration(0)
        let totalStartAt = null;
        let totalEndAt = null;
        const timeRec = timeRecords.map((item, idx) => {
            if (idx === 0) {
                totalStartAt = moment(item.startAt)
            }
            totalEndAt = moment(item.endAt)

            let thisDuration = item.endAt.diff(item.startAt)
            totalDuration.add(thisDuration)
            return {
                duration: moment.duration(thisDuration).asMilliseconds(),
                startAt: item.startAt.format("YYYY-MM-DD HH:mm:ss.SSS"),
                endAt: item.endAt.format("YYYY-MM-DD HH:mm:ss.SSS")
            }
        })
        const submitData = {
            duration: totalDuration.asMilliseconds(),
            startAt: totalStartAt.format("YYYY-MM-DD HH:mm:ss.SSS"),
            endAt: totalEndAt.format("YYYY-MM-DD HH:mm:ss.SSS"),
            description: curTaskDesc,
            details: timeRec
        }
        window.electronAPI.submitTaskRecordApi(submitData)
    }, [])

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
        } else if (action === "pause") {
            let lastRecord = newTimeReocrds[newTimeReocrds.length - 1]
            lastRecord.endAt = moment()
            newStatus = CONST.CLOCK_STATUS.IS_PAUSE
            
            if (intervalHandler !== null) {
                window.clearInterval(intervalHandler)
            }
            setIntervalHandler(null)
        } else {
            excuteSubmitTaskRecord(curTaskDesc, newTimeReocrds)
            setCurTaskDesc("")
            setHasPassedTime(moment.duration(0))
            newTimeReocrds = []
            newStatus = CONST.CLOCK_STATUS.READY_TO_START
        }
        setTimeRecords(newTimeReocrds)
        setCurStatus(newStatus)
        
        // 启动定时任务，更新时间
        if (newStatus === CONST.CLOCK_STATUS.IS_RECORDING) {
            startInterval(newTimeReocrds)
        }
    }, [curStatus, curTaskDesc, excuteSubmitTaskRecord, intervalHandler, startInterval, timeRecords])

    // 设置快捷键处理函数及事件注册
    const [winIsFocus, setWinIsFocus] = useState(true)
    const [blurTimeout, setBlurTimeout] = useState(null)
    const inputRef = useRef(null)
    useEffect(() => {
        window.electronAPI.onHandleAccelerator((event, value) => {
            if (curStatus === CONST.CLOCK_STATUS.IS_PAUSE && value === "startOrPause") {
                onChangeStatus("start")
            } else if (curStatus === CONST.CLOCK_STATUS.READY_TO_START && value === "startOrPause") {
                onChangeStatus("start")
            } else if (curStatus === CONST.CLOCK_STATUS.IS_PAUSE && value === "stop") {
                onChangeStatus("stop")
            } else if (curStatus === CONST.CLOCK_STATUS.IS_RECORDING && value === "startOrPause") {
                onChangeStatus("pause")
            }
        })

        window.electronAPI.onHandleFocusOrBlur((event, value) => {
            if (blurTimeout !== null) {
                window.clearTimeout(blurTimeout)
            }
            if (value === "focus") {
                setBlurTimeout(null)
                setWinIsFocus(true)
                inputRef.current.focus()
            } else {
                let curTimeout = window.setTimeout(() => {
                    window.electronAPI.onInvokePenetrate()
                    setWinIsFocus(false)
                }, 1000)
                setBlurTimeout(curTimeout)
            }
        })
        
        return () => {
            window.electronAPI.onClearAccelerator()
            window.electronAPI.onClearFocusOrBlur()
        }
    }, [blurTimeout, curStatus, onChangeStatus])

    const [fontSize, setFontSize] = useState(18)

    const ButtonList = useMemo(() => {
        let res = []
        if (curStatus === CONST.CLOCK_STATUS.READY_TO_START) {
            res.push(
                <div className={styles.button} key="start" onClick={() => onChangeStatus("start")}>
                    <Iconfont iconName={'icon-play'} fontSize={fontSize}/>
                </div>
            )
        } else if (curStatus === CONST.CLOCK_STATUS.IS_PAUSE) {
            res = [
                <div className={styles.button} key="continue" onClick={() => onChangeStatus("start")}>
                    <Iconfont iconName={'icon-play'} fontSize={fontSize}/>
                </div>,
                <div className={styles.button} key="stop" onClick={() => onChangeStatus("stop")}>
                    <Iconfont iconName={'icon-stop'} fontSize={fontSize}/>
                </div>,
            ]
        } else if (curStatus === CONST.CLOCK_STATUS.IS_RECORDING) {
            res.push(
                <div className={styles.button} key="pause" onClick={() => onChangeStatus("pause")}>
                    <Iconfont iconName={'icon-pause'} fontSize={fontSize}/>
                </div>,
            )
        }
        return res
    }, [curStatus, fontSize, onChangeStatus])

    return (
        <div className={cn(styles.mainWraper, winIsFocus ? '' : styles.mainWraperBlur)}>
            <div className={styles.dragArea}></div>
            <div className={cn(styles.inputArea, winIsFocus ? '' : styles.inputAreaFocus)}>
                <div className={styles.inputWrap}>
                    <TextArea
                        ref={inputRef}
                        className={styles.textarea}
                        value={curTaskDesc} 
                        onChange={(e) => setCurTaskDesc(e.currentTarget.value)} 
                        rows={2} 
                        autoSize={false}
                    />
                </div>
            </div>
            <div className={styles.timerWrap}>
                <div className={styles.clockWrap}>
                    <ClockItem hasPassedTime={hasPassedTime}/>
                </div>
                <div className={styles.buttonWrap}>
                    {ButtonList}
                </div>
            </div>
        </div>
    )
}