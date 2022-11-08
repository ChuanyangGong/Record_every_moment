const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    ping: () => ipcRenderer.invoke('ping')
})

contextBridge.exposeInMainWorld('electronAPI', {
    setTitle: (title) => ipcRenderer.send('set-title', title),
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    onHandleAccelerator : (callback) => ipcRenderer.on('invoke:accelerator', callback),
    onClearAccelerator : () => ipcRenderer.removeAllListeners('invoke:accelerator'),
    onHandleFocusOrBlur: (callback) => ipcRenderer.on('invoke:focusOrBlur', callback),
    onClearFocusOrBlur : () => ipcRenderer.removeAllListeners('invoke:focusOrBlur'),
    onInvokePenetrate: () => ipcRenderer.send('invoke:penetrate'),
})
