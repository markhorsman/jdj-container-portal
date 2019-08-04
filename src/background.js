'use strict'

import { app, protocol, BrowserWindow, dialog } from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'

const log = require('electron-log')
const { autoUpdater } = require("electron-updater")

const isDevelopment = process.env.NODE_ENV !== 'production'

autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'
log.info('App starting...')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function sendStatusToWindow(text) {
  log.info(text);
  win.webContents.send('message', text);
}

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], { secure: true })

autoUpdater.on('update-downloaded', (info) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Herstarten', 'Nu niet'],
    title: 'App update',
    message: 'Nieuwe update beschikbaar!',
    detail: `Er is een nieuwe versie (${info.releaseName}) gedownload. Herstart de app om de nieuwste versie te gebruiken.`
  }

  dialog.showMessageBox(dialogOpts, (response) => {
    if (response === 0) autoUpdater.quitAndInstall()
  })
});

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({ width: 1360, height: 900, show: false, useContentSize: true, frame: false })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.webContents.openDevTools({ mode: 'undocked' })
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    // if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    // win.webContents.openDevTools()
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })

  // Show when ready
  win.once('ready-to-show', () => {
    win.show()
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  createWindow()

  await installVueDevtools()
  // if (isDevelopment && !process.env.IS_TEST) {
  //   // Install Vue Devtools
  //   await installVueDevtools()
  // }

  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, 60000)
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
