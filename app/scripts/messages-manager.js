/**
 * Manages "messages" block.
 */
class MessagesManager {

  constructor(messagesContainerId, messagesListId) {
    /**
     * @var {HTMLElement} messagesContainer
     */
    this.messagesContainer = document.getElementById(messagesContainerId)

    /**
     * @var {HTMLElement} messages
     */
    this.messages = document.getElementById(messagesListId)

    /**
     * @var {string[]} successes
     */
    this.successes = []

    /**
     * @var {string[]} successes
     */
    this.warnings = []

    /**
     * @var {string[]} successes
     */
    this.errors = []
  }

  /**
   * Clears all messages and hides the messages block.
   */
  reset() {
    this.successes = []
    this.warnings = []
    this.errors = []
    this.hide()
  }

  /**
   * Hides the messages block.
   */
  hide() {
    this.messagesContainer.style.display = 'none'
  }

  /**
   * Generates all messages elements and displays the messages tblock.
   */
  display() {
    let displayedMessage = 0

    // Clear the entire list
    while (this.messages.firstChild) {
      this.messages.removeChild(this.messages.firstChild)
    }

    // Generate stored errors
    this.errors.forEach(message => {
      displayedMessage++
      const li = document.createElement('li')
      li.innerHTML = message
      li.className = 'error'
      this.messages.append(li)
    })
    // Generate stored warnings
    this.warnings.forEach(message => {
      displayedMessage++
      const li = document.createElement('li')
      li.innerHTML = message
      li.className = 'warning'
      this.messages.append(li)
    })
    // Generate stored successes
    this.successes.forEach(message => {
      displayedMessage++
      const li = document.createElement('li')
      li.innerHTML = message
      li.className = 'success'
      this.messages.append(li)
    })

    // If at least one message is registered, display the list.
    if (displayedMessage > 0) {
      this.messagesContainer.style.display = 'block'
    }
  }

  /**
   * Adds a success message.
   * @param {string} message
   */
  addSuccess(message) {
    this.successes.push(message)
  }

  /**
   * Adds a warning message.
   * @param {string} message
   */
  addWarning(message) {
    this.warnings.push(message)
  }

  /**
   * Adds an error message.
   * @param {string} message
   */
  addError(message) {
    this.errors.push(message)
  }

  /**
   * Checks if this MessagesManager contains at least one error.
   * @param {string} message
   */
  containsErrors() {
    return (this.errors.length > 0)
  }
}