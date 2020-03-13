// Modules to control application life and create native browser window
const { app, BrowserWindow,Menu } = require('electron');
const fs=require('fs');
const path = require('path');
// const childproc=require('child_process');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;


app.listFiles=()=>{
    //return [__dirname,process.execPath];
    

    return fs.readdirSync(getMapsPath()).filter(fn=>{
        let handledFN=fn.toLowerCase().trim();
        return handledFN!=='readme.md' && handledFN.endsWith(".md");
    }).map(fn=>{
        let fullpath=getMapsPath(fn);
        return {
            name:       fn,
            fullpath:   fullpath,
            size:       fs.statSync(fullpath).size
        };
    });
};

app.exists=(fn)=>{
    let handledFN=fn.toLowerCase().trim();
    if(!handledFN.endsWith(".md")){
        fn+=".md";
    }
    let fullpath=getMapsPath(fn);
    if(fs.existsSync(fullpath)){
        return true;
    }
    return [fn,fullpath];
}

app.readFile=(fullpath)=>{
    return fs.readFileSync(fullpath,'utf-8');
}

app.saveFile=(fullpath,content)=>{
    fs.writeFileSync(fullpath,content,'utf-8');
}

// app.openGitBash=()=>{
//     let basedir="";
//     if(process.env.DEV_SERVER_URL){
//         basedir=__dirname;
//     }else{
//         basedir=__dirname;
//     }
//     let cmdPath=basedir+"\\opengitbash_"+new Date().getTime()+".cmd";
//     fs.writeFileSync(cmdPath,'cd /d "'+getMapsPath()+'" && bash','utf-8');
//     //childproc.execFile(cmdPath);
// }

const getMapsPath=(fn=null)=>{
    let basedir="";
    if(process.env.DEV_SERVER_URL){
        basedir=__dirname;
    }else{
        basedir=__dirname;
    }
    basedir+='\\gmaps';
    return basedir+(fn?"\\"+fn:"");
}


function createWindow() {
    Menu.setApplicationMenu(null);

    // Create the browser window.
    mainWindow = new BrowserWindow({
        //width: 1920,
        //height: 1080,
        show: false,
        webPreferences: {
            //preload: path.join(__dirname, 'preload.js')
            nodeIntegration: true
        }
    });
    mainWindow.maximize();
    mainWindow.show();

    // and load the index.html of the app.

    if(process.env.DEV_SERVER_URL){
        mainWindow.loadURL(process.env.DEV_SERVER_URL);
    }else{
        mainWindow.loadFile(__dirname+'\\build\\index.html');
    }
    //
    // mainWindow.loadURL("http://localhost:3001");

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.