const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog, globalShortcut, screen } = require('electron');
const { min } = require('moment');
const path = require('path')
const url = require('url');

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
        alwaysOnTop: true
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
    mainWindow.loadURL("http://127.0.0.1:3000/")
    mainWindow.webContents.openDevTools({
        mode:'undocked'
    });
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
}).then(() => {
    ipcMain.on('invoke:penetrate', (event) => {
        const webContents = event.sender
        const miniWindow = BrowserWindow.fromWebContents(webContents)
        miniWindow.setIgnoreMouseEvents(true, { forward: true });
    })
}).then(() => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
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