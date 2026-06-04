// Electron wrapper for the Linen Paper Co. planner.
// Loads the standalone HTML; localStorage persists in the app's userData.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 720,
    minHeight: 540,
    backgroundColor: '#F5EFE6',
    title: 'Linen Paper Co.',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, sandbox: true }
  });

  win.loadFile(path.join(__dirname, 'app', 'linen-planner.html'));

  // open external links in the system browser, keep internal hash nav inside
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });
}

// minimal native menu: keep Print, DevTools off in prod
const menu = Menu.buildFromTemplate([
  { label: 'File', submenu: [{ role: 'quit' }] },
  { label: 'Edit', submenu: [
    { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
    { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
  ] },
  { label: 'View', submenu: [
    { role: 'reload' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
    { type: 'separator' }, { role: 'togglefullscreen' }
  ] }
]);
Menu.setApplicationMenu(menu);

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
