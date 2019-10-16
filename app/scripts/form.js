const FileSystem = require('fs')
const Path = require('path')
const exec = require('child_process').exec;

////////////////////////////////////////
// References
////////////////////////////////////////

const form = document.getElementById('form')
const formFields = {
  path:   document.getElementById('path'),
  url:    document.getElementById('url'),
  lfs:    document.getElementById('lfs'),
  commit: document.getElementById('commit')
}
const selectFolderButton = document.getElementById('select-folder')
const browseButton = document.getElementById('browse')

const messagesManager = new MessagesManager('messages-container', 'messages');
const progressManager = new ProgressManager('popup', 'progress-bar')

////////////////////////////////////////
// Events
////////////////////////////////////////

/**
 * Mock real folder selection button.
 */
browseButton.addEventListener('click', (event) => {
  selectFolderButton.click()
})

/**
 * Process selected folder path.
 */
selectFolderButton.addEventListener('change', (event) => {
  if(selectFolderButton.files.length > 0) {
    formFields.path.value = selectFolderButton.files[0].path
  }
})

/**
 * Displays preventive messages when window loads.
 */
window.onload = (event) => {
  messagesManager.reset()
  progressManager.hide()
  progressManager.reset()

  controlGitInstallation(messagesManager)
  controlGitLFSInstallation(messagesManager, true)

  messagesManager.display()
}

/**
 * Control form values. Resolves the form, and displays results.
 */
form.onsubmit = (event) => {
  event.preventDefault()
  messagesManager.reset()

  controlPath(formFields.path.value, messagesManager)
  controlGitInstallation(messagesManager)
  controlGitLFSInstallation(messagesManager, false)
  controlCommitMessage(formFields.commit.value, messagesManager)

  if(!messagesManager.containsErrors()) {
    progressManager.reset()
    progressManager.display()
    initializeProject(
      formFields.path.value,
      formFields.url.value,
      formFields.commit.value,
      formFields.lfs.checked,
      messagesManager,
      progressManager
    )
    .finally(() => {
      progressManager.hide()
      messagesManager.display()
    })
  }
  else {
    messagesManager.display()
  }
}

////////////////////////////////////////
// Methods
////////////////////////////////////////

/**
 * Checks if the given path is valid, and leads to a Unity project.
 * @param {string} path Path to the Unity project folder.
 * @param {MessagesManager} messages
 */
function controlPath(path, messages) {
  if(!path || path === '') {
    messages.addError('The given path to your Unity project is not valid.')
  }
  else {
    containsAssetsFolder(path, messages)
  }
}

/**
 * Checks if the given path leads to a Unity project.
 * @param {string} path Path to the Unity project folder.
 * @param {MessagesManager} messages
 */
function containsAssetsFolder(path, messages) {
  if(!FileSystem.existsSync(Path.join(path, './Assets'))) {
    messages.addError('The target folder doesn\'t contain an /Assets folder, so it\'s not considered as an Unity project.')
  }
}

/**
 * Checks if Git is installed on this machine.
 * @param {MessagesManager} messages
 */
function controlGitInstallation(messages) {
  exec('git --version 2>&1', (error, stdout, stderr) => {
    if(error !== null) {
      messages.addError('Git is not installed on your machine. Go to <a href="https://git-scm.com/downloads">https://git-scm.com/downloads</a> and install Git before running this app.')
    }
  })
}

/**
 * Checks if Git LFS is installed on this machine.
 * @param {MessagesManager} messages
 * @param {boolean} warning If true, the output error is a warning instead an error.
 */
function controlGitLFSInstallation(messages, warning) {
  exec('git lfs env', (error, stdout, stderr) => {
    if(error !== null) {
      const message = 'Git LFS is not installed on your machine. Go to <a href="https://git-lfs.github.com">https://git-lfs.github.com</a> and install Git LFS before running this app if you wish to use it.'
      if(warning === true) {
        messages.addWarning(message)
      }
      else {
        messages.addError(message)
      }
    }
  })
}

/**
 * Controls the "first commit" message.
 * @param {string} commitMessage
 * @param {MessagesManager} messages
 */
function controlCommitMessage(commitMessage, messages) {
  if(!commitMessage || commitMessage === '') {
    messages.addError('The given commit message is not valid.')
  }
}

/**
 * Initializes Git in the target Unity project.
 * @param {string} path Path to the Unity project. Assumes this path is valid.
 * @param {string} url URL to the Git repository. If empty or not valid, git is only initialized locally.
 * @param {string} commit Message of the first commit. Assumes it's valid.
 * @param {boolean} lfs If true, enable Git LFS in the created repository.
 * @param {MessagesManager} messages
 */
async function initializeProject(path, url, commit, lfs, messages, progress) {
  progress.setValue(0)

  // Initialize git repository
  try {
    await executeCommand('git init', path, messages)
    progress.setValue(1)
  }
  catch(error) { return }
  
  // Copy .gitignore
  if(!copyFiles(Path.join(__dirname, '../assets/copy/.gitignore'), Path.join(path, './.gitignore'), messages)) { return }
  progressManager.setValue(2)

  // If LFS enabled
  if(lfs) {
    // Copy .gitattributes
    if(!copyFiles(Path.join(__dirname,'../assets/copy/.gitattributes'), Path.join(path, './.gitattributes'), messages)) { return }
    progressManager.setValue(3)
    // Install Git LFS
    try {
      await executeCommand('git lfs install', path, messages)
      progressManager.setValue(4)
    }
    catch(error) { return }
  }

  // Add changes, then commit
  try {
    await executeCommand(`git add . && git commit -m "${commit}"`, path, messages)
    progressManager.setValue(5)
  }
  catch(error) { return }

  // If given URL is valid, push project to repository
  if(url && url !== '') {
    try {
      await executeCommand(`git remote add origin ${url} && git push -u origin master`, path, messages)
    }
    catch(error) { return }
  }

  progressManager.setValue(6)
  messages.addSuccess('Git has successfully been initialized in this Unity project!')
}

/**
 * Copy the file at given source path to given dest path.
 * @param {string} source
 * @param {string} dest
 * @param {MessagesManager} messages
 * @returns {boolean} Returns true if the operation is successful, otherwise false.
 */
function copyFiles(source, dest, messages) {
  try {
    FileSystem.copyFileSync(source, dest)
  }
  catch(error) {
    messages.addError('Copy error: ' + (error.message || error))
    return false
  }
  return true
}

/**
 * Executes the given command.
 * @async
 * @param {string} command
 * @param {string} cwd Path of the process origin
 * @param {MessagesManager} messages
 * @returns {boolean} Returns true if the operation is successful, otherwise false.
 */
async function executeCommand(command, cwd, messages) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      console.log('PARAMS', {error, stdout, stderr});
      if(error !== null) {
        messages.addError('Command execution failure: ' + (error.message || stderr))
        reject()
      }
      else {
        resolve()
      }
    })
  })
}