const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const path = require('path')
const url = require('url');

// read the environment config
const mode = process.argv[2];

const createWindow = () => {
    Menu.setApplicationMenu(null)
    const mainWindow = new BrowserWindow({
        width: 250,
        height: 120,
        maxWidth: 250,
        maxHeight: 120,
        minWidth: 250,
        minHeight: 120,
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
    // mainWindow.webContents.openDevTools({
    //     mode:'undocked'
    // });
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