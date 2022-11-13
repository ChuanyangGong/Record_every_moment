const { 
    app, 
    BrowserWindow, 
    Menu, 
    MenuItem, 
    ipcMain, 
    globalShortcut, 
    screen, 
    Tray, 
    nativeImage 
} = require('electron');
// const sqlite3 = require('sqlite3')
const path = require('path')
const url = require('url');
const { connectDb } = require('./service/database')

// window instance
const winContents = {
    miniRecorder: null,
    dashboardWindow: null
}

// 初始化托盘
let tray = null
const icon = nativeImage.createFromPath(path.join(__dirname, './images/icon.png'))

// 初始化数据库
const database_root = path.join(__dirname, '/database')
const data_path = path.join(database_root, 'data.db')

// 寻找指定窗口
const getTargetWindow = target => {
    let allWindows = BrowserWindow.getAllWindows()
    let tarWin = null
    allWindows.forEach(win => {
        if (winContents[target]?.id === win.id) {
            tarWin = win
        }
    })
    return tarWin
}

// read the environment config
const mode = process.argv[2];
const createMiniRecorder = () => {
    let miniRecorder = getTargetWindow('miniRecorder')
    if (miniRecorder !== null) {
        miniRecorder.restore()
        miniRecorder.focus()
        return
    }
    // 获取屏幕大小数据
    let priScreenInfo = screen.getPrimaryDisplay()
    let screenWidth = priScreenInfo.size.width;
    let winWidth = 500
    let winHeight = 90
    let margin = 40
    
    const mainWindow = new BrowserWindow({
        width: winWidth,
        height: winHeight,
        x: screenWidth - winWidth - margin,
        y: margin,
        resizable: false,
        frame: false,
        transparent: true,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        alwaysOnTop: true,
        icon: icon
    })

    winContents.miniRecorder = {
        type: 'miniRecorder',
        id: mainWindow.id
    }
    if (mode === 'dev') {
        mainWindow.loadURL("http://127.0.0.1:3000/")
        mainWindow.webContents.openDevTools({
            mode:'undocked'
        });
    } else {
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, './build/index.html'),
            protocol: 'file:',
            slashes: true
        }))
    }

    // 设置快捷键
    const debouncedAccelerator = debounce((action) => {
        mainWindow.webContents.send('invoke:accelerator', action)
    }, 100, true)

    // 监听窗口事件
    mainWindow.on('focus', () => {
        mainWindow.webContents.send('invoke:focusOrBlur', 'focus')
        mainWindow.setIgnoreMouseEvents(false)
    })
    mainWindow.on('blur', () => mainWindow.webContents.send('invoke:focusOrBlur', 'blur'))

    const menu = new Menu()
    menu.append(new MenuItem({
        label: '操作',
        submenu: [{
            role: 'start/pause',
            accelerator: process.platform === 'darwin' ? 'Ctrl+D' : 'Ctrl+D',
            click: () => debouncedAccelerator('startOrPause')
        },
        {
            role: 'stop',
            accelerator: process.platform === 'darwin' ? 'Ctrl+F' : 'Ctrl+F',
            click: () => debouncedAccelerator('stop')
        }]
    }))

    Menu.setApplicationMenu(menu)
}

const createDashboard = () => {
    // 检查时候存在 dashboard 窗口
    let dashboardWin = getTargetWindow('dashboardWindow')
    if (dashboardWin !== null) {
        dashboardWin.restore()
        dashboardWin.focus()
        return
    }
    dashboardWin = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 700,
        minHeight: 420,
        // frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        title: 'Dashboard',
        icon: icon
    })

    winContents.dashboardWindow = {
        type: 'dashboardWindow',
        id: dashboardWin.id
    }
    if (mode === 'dev') {
        dashboardWin.loadURL("http://127.0.0.1:3000/")

        // dashboardWin.webContents.openDevTools({
        //     mode:'undocked'
        // });
    } else {
        dashboardWin.loadURL(url.format({
            pathname: path.join(__dirname, './build/index.html'),
            protocol: 'file:',
            slashes: true
        }))
    }
}

// 调用 dashboard 去刷新
const invokeDashboardToRefresh = () => {
    let curWin = getTargetWindow('dashboardWindow')
    if (curWin !== null) {
        curWin.webContents.send('invoke:refreshTable')
    }
}

app.whenReady().then(() => {
    globalShortcut.register('Alt+X', () => {
        let miniWindow = getTargetWindow('miniRecorder')
        if (miniWindow === null) {
            createMiniRecorder()
            return
        }
        
        // 恢复最小化窗口
        if (miniWindow.isMinimized()) {
            miniWindow.restore()
        } else if (miniWindow.isFocused()) {
            miniWindow.blur()
        } else if (!miniWindow.isFocused()) {
            miniWindow.focus()
        }
    })
    globalShortcut.register('Alt+C', () => {
        let miniWindow = getTargetWindow('miniRecorder')
        if (miniWindow === null) {
            createMiniRecorder()
            return
        }
        if (miniWindow.isMinimized()) {
            miniWindow.restore()
        } else {
            // 最小化窗口
            miniWindow.minimize()
        }
    })
}).then(() => {
    ipcMain.handle('invoke:setWindowType', (event) => {
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        for (let key in winContents) {
            if (winContents[key] !== null && winContents[key].id === win.id) {
                return key
            }
        }
    })
    ipcMain.on('invoke:penetrate', (event) => {
        const webContents = event.sender
        const miniWindow = BrowserWindow.fromWebContents(webContents)
        miniWindow.setIgnoreMouseEvents(true, { forward: true });
    })
    ipcMain.on('handle:minimizeRecorder', (event) => {
        const webContents = event.sender
        const miniWindow = BrowserWindow.fromWebContents(webContents)
        miniWindow.minimize()
    })
    ipcMain.on('handle:closeRecorder', (event) => {
        const webContents = event.sender
        const miniWindow = BrowserWindow.fromWebContents(webContents)
        miniWindow.close()
    })
    ipcMain.handle('invoke:askForTaskRecord', async (event, filterParam) => {
        // 查询数据
        const db = connectDb(data_path)
        let querySql = `SELECT * FROM task_record_tb WHERE isDelete = 0 AND description LIKE '%${filterParam.keyword ?? ""}%'`
        if (filterParam.startAt) {
            querySql += ` AND startAt BETWEEN '${filterParam.startAt}' AND '${filterParam.endAt}'`
        }
        const queryPromise = new Promise((resolve, reject) => {
            db.all(querySql, function(err, rows) {
                if (err) {
                    reject({
                        code: 500,
                        msg: err.message
                    })
                } else {
                    let idxStart = (filterParam.currentPage - 1) * filterParam.pageSize
                    let idxLast = idxStart + filterParam.pageSize
                    let data = {
                        total: rows.length,
                        rows: rows.slice(idxStart, idxLast)
                    }

                    resolve({
                        code: 200,
                        data: data
                    })
                }
            })
        })
        const res = await queryPromise;
        return res
    })
    ipcMain.handle('invoke:deleteTaskTecordApi', async (event, id) => {
        const db = connectDb(data_path)
        let deleteSql = `UPDATE task_record_tb SET isDelete = 1 WHERE id = ${id}`
        const deletePromise = new Promise((resolve, reject) => {
            db.run(deleteSql, function(err, rows) {
                if (err) {
                    reject({
                        code: 500,
                        msg: err.message
                    })
                } else {
                    resolve({
                        code: 200,
                        data: true
                    })
                }
            })
        })
        const res = await deletePromise;
        invokeDashboardToRefresh()
        return res
    })
    ipcMain.on('api:submitTaskRecord', (event, data) => {
        // 存入 task 数据
        const taskInfo = {
            $startAt: data.startAt,
            $endAt: data.endAt,
            $duration: data.duration,
            $description: data.description
        }
        const db = connectDb(data_path)
        let insertSql = `
        INSERT INTO task_record_tb (startAt, endAt, duration, description) values ($startAt, $endAt, $duration, $description)
        `
        db.run(insertSql, taskInfo, function(err, rows) {
            const { lastID } = this

            // 存入 time slice 数据
            insertSql = `
            INSERT INTO time_slice_tb (startAt, endAt, duration, task_record_id) values ($startAt, $endAt, $duration, $task_id)
            `

            const timeSlice = data.details.map(item => {
                return {
                    $startAt: item.startAt,
                    $endAt: item.endAt,
                    $duration: item.duration,
                    $task_id: lastID,
                }
            })
            db.parallelize(() => {
                const stmt = db.prepare(insertSql)
                timeSlice.forEach(item => {
                    stmt.run(item)
                })
                stmt.finalize();
            })
            
            invokeDashboardToRefresh()
        });
    })
}).then(() => {
    createMiniRecorder()
    createDashboard()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMiniRecorder()
    })
}).then(() => {
    tray = new Tray(icon)
    const contextMenu = Menu.buildFromTemplate([{
        label: '退出',
        role: 'quit'
    }])
    tray.on('double-click', () => {createDashboard()})
    tray.on('click', () => {createMiniRecorder()})
    tray.setContextMenu(contextMenu)
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

function debounce(func, wait, immediate) {
    let timeout, result;
    let debounced = function () {
        let context = this;
        let args = arguments;

        if (timeout) clearTimeout(timeout);
        if (immediate) {
            // 如果已经执行过，不再执行
            let callNow = !timeout;
            timeout = setTimeout(function(){
                timeout = null;
            }, wait)
            if (callNow) result = func.apply(context, args)
        }
        else {
            timeout = setTimeout(function(){
                func.apply(context, args)
            }, wait);
        }
        return result;
    };

    debounced.cancel = function() {
        clearTimeout(timeout);
        timeout = null;
    };

    return debounced;
}