'use strict';

const config = require('./config.json');

const {app, protocol, BrowserWindow} = require('electron');

const path = require('path')
const url = require('url')

var mainWindow = null;

function createWindow() {

    var extend = config.mode == "debug" ? 500 : 0;
    mainWindow = new BrowserWindow({
        width: 1180 + extend,
        height: 744,
        resizable: false,
        autoHideMenuBar: true
    });

    mainWindow.setMenu(null);

    if (config.mode == "debug") {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.setMenu(null);
    mainWindow.loadURL(`file:///${path.join(__dirname, 'index.html')}`);

    mainWindow.on('closed', () => {
        mainWindow = null
    })

}
app.allowRendererProcessReuse = true;

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    app.quit()
})

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
})