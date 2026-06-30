import { app, BrowserWindow, ipcMain, dialog } from 'electron';
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
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    title: "Course Manager Application"
  });

  // Capture all console output from the renderer process (React app)
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] ${message} (Source: ${sourceId}:${line})`);
  });

  // Log renderer process crashes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error(`[Renderer Crash] Process gone:`, details);
  });

  mainWindow.webContents.on('unresponsive', () => {
    console.error(`[Renderer Unresponsive] The window became unresponsive!`);
  });

  // Toggle DevTools with F12 (helps in troubleshooting blank screens)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Open external links in default browser instead of new Electron windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    import('electron').then(({ shell }) => {
      shell.openExternal(url);
    });
    return { action: 'deny' };
  });

  // Start Express Backend
  try {
    const { default: expressApp } = await import('./server/server.js');
    const server = expressApp.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`Express server started successfully on port ${port}`);
      mainWindow.loadURL(`http://127.0.0.1:${port}`);

      // Intercept navigation to prevent blank screens or window hijacking
      mainWindow.webContents.on('will-navigate', (event, url) => {
        const localOrigin = `http://127.0.0.1:${port}`;
        const isUpload = url.includes('/uploads/');
        if (!url.startsWith(localOrigin) || isUpload) {
          event.preventDefault();
          import('electron').then(({ shell }) => {
            shell.openExternal(url);
          });
        }
      });
    });
  } catch (err) {
    console.error("Failed to start Express server:", err);
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Handle Export to PDF
  ipcMain.handle('export-to-pdf', async (event, defaultFilename) => {
    try {
      const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save PDF',
        defaultPath: path.join(app.getPath('downloads'), defaultFilename || 'document.pdf'),
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
      });

      if (!filePath) return { success: false, reason: 'canceled' };

      const pdfData = await mainWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margin: { marginType: 'default' }
      });
      
      fs.writeFileSync(filePath, pdfData);
      return { success: true, filePath };
    } catch (error) {
      console.error('Failed to export PDF:', error);
      return { success: false, reason: error.message };
    }
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
