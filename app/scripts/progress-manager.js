class ProgressManager {
  constructor(popupContainerId, progressBarId) {
    this.popup = document.getElementById(popupContainerId)
    this.progress = document.getElementById(progressBarId)
    this.progress.max = 6
  }

  reset() {
    this.progress.value = 0
  }

  hide() {
    this.popup.style.display = 'none'
  }

  display() {
    this.popup.style.display = 'block'
  }

  setValue(value) {
    this.progress.value = value
  }
}

module.exports = ProgressManager