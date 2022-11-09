import { Button, Col, DatePicker, Input, Modal, Row, Table } from "antd"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import FrameHeader from "../../components/FrameHeader"
import styles from './index.module.scss'
import cn from 'classnames'
import { message } from "antd"
import moment from "moment/moment"

const { RangePicker } = DatePicker;

export default function Dashboard() {

    const deleteTaskItem = useCallback((id) => {
        let modal = Modal.confirm({
            title: '确认删除',
            content: '是否确认要删除？',
            okText: '确认',
            cancelText: '取消',
            onOk: async () => {
                const res = await window.electronAPI.deleteTaskTecordApi(id)
                if (res.code === 200) {
                    message.success("删除成功")
                    modal.destroy()
                } else {
                    message.success("删除失败")
                }
            }
        })
    }, [])

    const columns = useMemo(() => {
        return [
            {
                title: '任务描述',
                dataIndex: 'description',
                key: 'description',
            },
            {
                title: '时长',
                dataIndex: 'duration',
                key: 'duration',
                width: 120
            },
            {
                title: '开始时间',
                dataIndex: 'startAt',
                key: 'startAt',
                width: 190
            },
            {
                title: '结束时间',
                dataIndex: 'endAt',
                key: 'endAt',
                width: 190
            },
            {
                title: '操作',
                key: 'operation',
                width: 80,
                render: (row) => {
                    return (
                        <Button
                            danger
                            size="small"
                            type={"link"}
                            onClick={() => {deleteTaskItem(row.id)}}
                        >
                            删除
                        </Button>
                    )
                }
            }
        ]
    }, [deleteTaskItem])

    // 加载啊表格数据
    const [tableLoading, setTableLoading] = useState(false)
    const [tableData, setTableData] = useState([])
    const [keyword, setKeyword] = useState("")
    const [dateRange, setDateRange] = useState(null)
    const [total, setTotal] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(7)

    const fetchTableData = useCallback(async () => {
        const filterParam = {
            currentPage: currentPage,
            pageSize: pageSize
        }
        if (keyword) {
            filterParam.keyword = keyword
        }
        if (Array.isArray(dateRange)) {
            filterParam.startAt = dateRange[0].format("YYYY-MM-DD") + " 00:00:00"
            filterParam.endAt = dateRange[1].format("YYYY-MM-DD") + " 23:59:59"
        }

        setTableLoading(true)
        const res = await window.electronAPI.askForTaskRecordApi(filterParam)
        console.log(res)
        if (res.code === 200) {
            const { data } = res
            const tableData = data.rows.map(item => {
                const dura = moment.duration(item.duration)
                let durationStr = ""
                if (dura.days > 0) {
                    durationStr += ` ${dura.days()}天`
                }
                if (dura.hours > 0) {
                    durationStr += ` ${dura.hours()}小时`
                }
                if (dura.minutes > 0) {
                    durationStr += ` ${dura.minutes()}分钟`
                }
                if (durationStr.length === 0) {
                    durationStr += ` ${dura.seconds()}秒`
                }
                return {
                    ...item,
                    duration: durationStr
                }
            })
            setTableData(tableData)
            setTotal(data.total)
        }
        setTableLoading(false)
    }, [currentPage, dateRange, keyword, pageSize])

    useEffect(() => {
        fetchTableData()
    }, [fetchTableData])

    // 刷新表单
    useEffect(() => {
        window.electronAPI.onRefreshTable(() => {
            fetchTableData()
        })
        return () => {
            window.electronAPI.onClearRefreshTable()
        }
    }, [fetchTableData])

    return (
        <div className={styles.dashboardWrap}>
            <Row className={styles.searchHeader}>
                <Col span={9} className={cn(styles.filterItem)}>
                    <div className={styles.label}>关键字：</div>
                    <Input value={keyword} onChange={e => {
                        setKeyword(e.currentTarget.value)
                        setCurrentPage(1)
                    }}/>
                </Col>
                <Col span={15} className={cn(styles.filterItem)}>
                    <div className={styles.label}>日期范围：</div>
                    <RangePicker style={{width: 350}} onChange={v => {
                        setDateRange(v)
                        setCurrentPage(1)
                    }}/>
                </Col>
            </Row>
            <div className={styles.tableWrap}>
                <Table
                    key={'id'}
                    loading={tableLoading}
                    style={{height: '100%'}}
                    columns={columns}
                    dataSource={tableData}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        showTotal: total => `共 ${total} 条数据`,
                        position: ['bottomRIght']
                    }}
                    onChange={pagination => {
                        let { current, pageSize } = pagination;
                        setCurrentPage(current)
                        setPageSize(pageSize)
                    }}
                />
            </div>
        </div>
    )
}