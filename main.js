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

// 初始化托盘
let tray = null
const icon = nativeImage.createFromPath('./images/trayIcon.png')

// 初始化数据库
const database_root = path.join(__dirname, '/database')
const data_path = path.join(database_root, 'data.db')

// read the environment config
const mode = process.argv[2];
const createWindow = () => {
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
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        alwaysOnTop: true,
        icon: icon
    })

    if (mode === 'dev') {
        mainWindow.loadURL("http://127.0.0.1:3000/")
    } else {
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, './build/index.html'),
            protocol: 'file:',
            slashes: true
        }))
    }
    // mainWindow.webContents.openDevTools({
    //     mode:'undocked'
    // });
    // mainWindow.setIgnoreMouseEvents(true)

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
        label: 'operation',
        submenu: [{
            role: 'start/pause',
            accelerator: process.platform === 'darwin' ? 'Ctrl+D' : 'Ctrl+D',
            click: () => debouncedAccelerator('startOrPause')
        }]
    }))
    menu.append(new MenuItem({
    label: 'operation',
    submenu: [{
        role: 'stop',
        accelerator: process.platform === 'darwin' ? 'Ctrl+F' : 'Ctrl+F',
        click: () => debouncedAccelerator('stop')
    }]
    }))

    Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
    globalShortcut.register('Alt+X', () => {
        let allWindows = BrowserWindow.getAllWindows()
        if (allWindows.length === 0) {
            createWindow()
            return
        }
        let miniWindow = allWindows[0]
        
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
        let allWindows = BrowserWindow.getAllWindows()
        if (allWindows.length === 0) {
            return
        }
        let miniWindow = allWindows[0]
        
        // 最小化窗口
        miniWindow.minimize()
    })
}).then(() => {
    ipcMain.on('invoke:penetrate', (event) => {
        const webContents = event.sender
        const miniWindow = BrowserWindow.fromWebContents(webContents)
        miniWindow.setIgnoreMouseEvents(true, { forward: true });
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

        });
    })
}).then(() => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
}).then(() => {
    tray = new Tray(icon)
    const contextMenu = Menu.buildFromTemplate([
    ])
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