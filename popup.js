document.addEventListener('DOMContentLoaded', () => {
  const baseUrlInput = document.getElementById('baseUrl');
  const tokenInput = document.getElementById('token');
  const saveButton = document.getElementById('save');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(['blinkoBaseUrl', 'blinkoToken'], (items) => {
    if (items.blinkoBaseUrl) {
      baseUrlInput.value = items.blinkoBaseUrl;
    }
    if (items.blinkoToken) {
      tokenInput.value = items.blinkoToken;
    }
  });

  // Save settings
  saveButton.addEventListener('click', () => {
    const baseUrl = baseUrlInput.value.trim().replace(/\/$/, ''); // Remove trailing slash
    const token = tokenInput.value.trim();

    if (!baseUrl || !token) {
      showStatus('Please fill in both fields.', 'error');
      return;
    }

    chrome.storage.sync.set({
      blinkoBaseUrl: baseUrl,
      blinkoToken: token
    }, () => {
      showStatus('Settings saved!', 'success');
    });
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = '';
    }, 3000);
  }
});
