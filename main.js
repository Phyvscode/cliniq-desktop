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
    autoHideMenuBar: true,
    menuBarVisible:  false,
    webPreferences: {
      nodeIntegration:       false,
      contextIsolation:      true,
      devTools:              false,
      backgroundThrottling:  false,   // CRITICAL: prevents input freeze after idle
      preload:               path.join(__dirname, "preload.js"),
    },
  });

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

  // Keyboard shortcuts
  mainWindow.webContents.on("before-input-event", (event, input) => {
    // F5 or Ctrl+R → reload
    if (input.key === "F5" || (input.control && input.key.toLowerCase() === "r")) {
      mainWindow.webContents.reload();
      return;
    }
    // Block DevTools shortcuts
    if (
      (input.control && input.shift && input.key.toLowerCase() === "i") ||
      (input.control && input.shift && input.key.toLowerCase() === "j") ||
      (input.key === "F12")
    ) {
      event.preventDefault();
    }
  });

  // Auto-recover if renderer crashes
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("Renderer crashed:", details.reason);
    if (["crashed", "oom", "launch-failed"].includes(details.reason)) {
      mainWindow.reload();
    }
  });

  // Auto-recover if window becomes unresponsive
  mainWindow.on("unresponsive", () => {
    console.warn("Window unresponsive — reloading...");
    mainWindow.reload();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(() => {
  // Disable hardware acceleration throttle
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  app.commandLine.appendSwitch("disable-background-timer-throttling");

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});