const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog } = require('electron')
const path = require('path')
const url = require('url');

// read the environment config
const mode = process.argv[2];

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 250,
        height: 90,
        maxWidth: 250,
        maxHeight: 90,
        minWidth: 250,
        minHeight: 90,
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

    const menu = new Menu()
    menu.append(new MenuItem({
    label: 'operation',
    submenu: [{
        role: 'start/pause',
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+D',
        click: () => debouncedAccelerator('startOrPause')
    }]
    }))
    menu.append(new MenuItem({
    label: 'operation',
    submenu: [{
        role: 'stop',
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+F',
        click: () => debouncedAccelerator('stop')
    }]
    }))

    Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
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