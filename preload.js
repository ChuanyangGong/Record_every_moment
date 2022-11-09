const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    onHandleAccelerator : (callback) => ipcRenderer.on('invoke:accelerator', callback),
    onClearAccelerator : () => ipcRenderer.removeAllListeners('invoke:accelerator'),
    onHandleFocusOrBlur: (callback) => ipcRenderer.on('invoke:focusOrBlur', callback),
    onClearFocusOrBlur : () => ipcRenderer.removeAllListeners('invoke:focusOrBlur'),
    onInvokePenetrate: () => ipcRenderer.send('invoke:penetrate'),
    submitTaskRecordApi: (data) => ipcRenderer.send('api:submitTaskRecord', data)
})
