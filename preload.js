const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronInit', {
    getWindowType: () => ipcRenderer.invoke('invoke:setWindowType')
})

contextBridge.exposeInMainWorld('electronAPI', {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    onHandleAccelerator : (callback) => ipcRenderer.on('invoke:accelerator', callback),
    onClearAccelerator : () => ipcRenderer.removeAllListeners('invoke:accelerator'),
    onHandleFocusOrBlur: (callback) => ipcRenderer.on('invoke:focusOrBlur', callback),
    onClearFocusOrBlur : () => ipcRenderer.removeAllListeners('invoke:focusOrBlur'),
    onInvokePenetrate: () => ipcRenderer.send('invoke:penetrate'),
    onRefreshTable: (callback) => ipcRenderer.on('invoke:refreshTable', callback),
    onClearRefreshTable: () => ipcRenderer.removeAllListeners('invoke:refreshTable'),
    submitTaskRecordApi: (data) => ipcRenderer.send('api:submitTaskRecord', data),
    askForTaskRecordApi: (filterParam, sorterParam) => ipcRenderer.invoke('invoke:askForTaskRecord', filterParam, sorterParam),
    deleteTaskTecordApi: (id) => ipcRenderer.invoke('invoke:deleteTaskTecordApi', id),
    onMinimizeRecorder: () => ipcRenderer.send('handle:minimizeRecorder'),
    onCloseRecorder: () => ipcRenderer.send('handle:closeRecorder')
})
