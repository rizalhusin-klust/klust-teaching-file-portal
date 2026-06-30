import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure APP_DATA_PATH is set before server loads
const userDataPath = app.getPath('userData');
process.env.APP_DATA_PATH = userDataPath;

console.log("User Data Path:", userDataPath);

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    title: "Course Manager Application"
  });

  // Start Express Backend
  try {
    const { default: expressApp } = await import('./server/server.js');
    const server = expressApp.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`Express server started successfully on port ${port}`);
      mainWindow.loadURL(`http://127.0.0.1:${port}`);
    });
  } catch (err) {
    console.error("Failed to start Express server:", err);
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
