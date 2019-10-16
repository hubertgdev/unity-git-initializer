////////////////////////////////////////
// Setup
////////////////////////////////////////

const { app, BrowserWindow } = require('electron')

// Defines if dev tools and extended logs are enabled
const DEV_MODE = false;

////////////////////////////////////////
// App
////////////////////////////////////////

/**
 * @var window Main app window.
 */
let window = null;

/**
 * Creates the main app window.
 */
function createWindow() {
  // Creates the window itself
  window = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // Loads the main page file
  window.loadFile('app/views/index.html')

  // Open dev tools after loading the page if dev mode enabled
  if(DEV_MODE) {
    window.webContents.openDevTools()
  }
  if(!DEV_MODE) {
    window.setMenu(null);
    window.setResizable(false);
  }

  // Clears the main app window if it's closed by the user
  window.on('closed', () => {
    window = null
  })
}

////////////////////////////////////////
// Electron process
////////////////////////////////////////

// Creates the main app window after Electron initialization
app.on('ready', createWindow)

// Quits the applcation after all windows are closed.
app.on('window-all-closed', () => {
  if(process.platform !== 'darwin') {
    app.quit()
  }
})

// Creates the app window on macOS if the app is active but all windows are closed.
app.on('activate', () => {
  if(window === null) {
    createWindow()
  }
})