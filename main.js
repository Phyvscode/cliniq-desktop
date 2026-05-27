const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const url  = require("url");

// Remove menu bar before app is ready
Menu.setApplicationMenu(null);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:     1280,
    height:    800,
    minWidth:  1024,
    minHeight: 600,
    title:     "ClinIQ",
    show:      false,
    autoHideMenuBar: true,   // hide menu bar
    menuBarVisible:  false,  // ensure hidden
    webPreferences: {
      nodeIntegration:    false,
      contextIsolation:   true,
      devTools:           false,  // disable Ctrl+Shift+I
      preload:            path.join(__dirname, "preload.js"),
    },
  });

  // Remove menu on the window instance too
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMenu(null);

  const indexPath = url.format({
    protocol: "file",
    slashes:  true,
    pathname: path.join(__dirname, "frontend", "dist", "index.html"),
  });

  mainWindow.loadURL(indexPath);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // Block opening DevTools via keyboard
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (
      (input.control && input.shift && input.key.toLowerCase() === "i") ||
      (input.control && input.shift && input.key.toLowerCase() === "j") ||
      (input.key === "F12")
    ) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});