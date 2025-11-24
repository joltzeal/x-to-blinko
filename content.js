// Icon Image
const BLINKO_ICON = `<img src="${chrome.runtime.getURL('icons/icon.png')}" alt="Blinko" style="width: 20px; height: 20px;">`;

// Observer to handle dynamic content loading
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      injectButtons();
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

function injectButtons() {
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');

  tweets.forEach((tweet) => {
    // Check if button already exists
    if (tweet.querySelector('.blinko-button')) return;

    // Find the action bar (Reply, Retweet, Like, Bookmark, Share)
    // Instead of relying on unstable class names, we find the Bookmark button by its stable data-testid
    // and then use its parent container to position our button.
    const bookmarkButton = tweet.querySelector('[data-testid="bookmark"]');

    if (bookmarkButton) {
      // The bookmark button is wrapped in a div that handles layout (flex item).
      // We want to insert our button as a sibling to that wrapper.
      const bookmarkContainer = bookmarkButton.parentElement;

      if (bookmarkContainer) {
        const blinkoContainer = document.createElement('div');
        // Dynamically copy classes from the bookmark container.
        // This ensures our button looks correct even if X.com updates their class names.
        blinkoContainer.className = bookmarkContainer.className;

        const button = document.createElement('div');
        button.className = 'blinko-button';
        button.innerHTML = BLINKO_ICON;
        button.title = 'Save to Blinko';
        button.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleBlinkoClick(tweet);
        };

        blinkoContainer.appendChild(button);

        // Insert before the bookmark container
        bookmarkContainer.parentNode.insertBefore(blinkoContainer, bookmarkContainer);
      }
    }
  });
}

async function handleBlinkoClick(tweetElement) {
  // 1. Get Settings
  const settings = await chrome.storage.sync.get(['blinkoBaseUrl', 'blinkoToken']);
  if (!settings.blinkoBaseUrl || !settings.blinkoToken) {
    alert('Blinko settings not found. Please configure the extension.');
    return;
  }

  // 2. Extract Data
  // User Name and Handle
  const userElement = tweetElement.querySelector('[data-testid="User-Name"]');
  let userName = 'Unknown';
  let userHandle = '';

  if (userElement) {
    const textContent = userElement.innerText.split('\n');
    // Usually: [Name, Handle, ·, Time] or similar. 
    // Let's try to find the handle starting with @
    userName = textContent[0];
    userHandle = textContent.find(t => t.startsWith('@')) || '';
  }

  // Avatar
  const avatarElement = tweetElement.querySelector('[data-testid="Tweet-User-Avatar"] img');
  const avatarUrl = avatarElement ? avatarElement.src : '';

  // Tweet Text
  const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]');
  const tweetText = tweetTextElement ? tweetTextElement.innerText : '';

  // Timestamp
  const timeElement = tweetElement.querySelector('time');
  const timestamp = timeElement ? timeElement.getAttribute('datetime') : new Date().toISOString();
  const formattedTime = timeElement ? timeElement.innerText : timestamp;

  // URL
  const tweetLinkElement = tweetElement.querySelector('a[href*="/status/"]');
  const tweetUrl = tweetLinkElement ? `https://x.com${tweetLinkElement.getAttribute('href')}` : window.location.href;

  // Images
  const images = [];
  const imageElements = tweetElement.querySelectorAll('[data-testid="tweetPhoto"] img');
  imageElements.forEach(img => {
    images.push(img.src);
  });

  // 3. Construct Markdown Content
  // Format:
  // > ![Avatar](url) **Name** @Handle
  // >
  // > Text
  // >
  // > ![Image](url)
  // >
  // > *Time* [Link]

  let markdown = `> ![](${avatarUrl}) **${userName}** \`${userHandle}\`\n>\n`;

  if (tweetText) {
    markdown += `> ${tweetText.replace(/\n/g, '\n> ')}\n>\n`;
  }

  if (images.length > 0) {
    images.forEach(img => {
      markdown += `> ![](${img})\n`;
    });
    markdown += `>\n`;
  }

  markdown += `> *${formattedTime}* · [View Tweet](${tweetUrl})`;

  // 4. Send to Background for API Call
  chrome.runtime.sendMessage({
    action: 'saveToBlinko',
    data: {
      content: markdown,
      baseUrl: settings.blinkoBaseUrl,
      token: settings.blinkoToken
    }
  }, (response) => {
    if (response && response.success) {
      showToast('Saved to Blinko!', 'success');
    } else {
      showToast('Failed to save to Blinko: ' + (response ? response.error : 'Unknown error'), 'error');
    }
  });
}

function showToast(message, type = 'success') {
  let toast = document.querySelector('.blinko-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'blinko-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `blinko-toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Initial injection
injectButtons();
