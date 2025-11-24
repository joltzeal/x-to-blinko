chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveToBlinko') {
    const { content, baseUrl, token } = request.data;

    // Construct API URL
    const apiUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/note/upsert`;
    console.log(apiUrl);
    console.log(content);

    const payload = {
      content: content,
      type: 1, // Markdown type
      attachments: [],
      references: []
    };

    // User example had "type": -1. I will stick to that.

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
      })
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error('Blinko API Error:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep the message channel open for async response
  }
});
