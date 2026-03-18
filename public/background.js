// AnimStudio Background Service Worker
// Handles context menu and message passing

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'animstudio-collect',
    title: '📎 收集到 AnimStudio',
    contexts: ['selection', 'image', 'link'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'animstudio-collect') return;

  const data = {
    type: 'CONTEXT_MENU_COLLECT',
    payload: {
      text: info.selectionText || '',
      imageUrl: info.srcUrl || '',
      linkUrl: info.linkUrl || '',
      pageUrl: tab?.url || '',
      pageTitle: tab?.title || '',
      timestamp: Date.now(),
    },
  };

  // Store in chrome.storage for the popup to pick up
  chrome.storage.local.get(['pendingCollections'], (result) => {
    const pending = result.pendingCollections || [];
    pending.push(data.payload);
    chrome.storage.local.set({ pendingCollections: pending });
  });

  // Also try to send to content script for toast notification
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'SHOW_TOAST', message: '已收集到 AnimStudio' }).catch(() => {});
  }
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // URL fetch for scraper (extension has no CORS restrictions)
  if (message.type === 'FETCH_URL') {
    fetch(message.url)
      .then(resp => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp.text();
      })
      .then(html => sendResponse({ html }))
      .catch(err => sendResponse({ error: err.message }));
    return true; // async response
  }

  if (message.type === 'GRAB_PAGE') {
    // Content script sends full page content
    chrome.storage.local.get(['pendingCollections'], (result) => {
      const pending = result.pendingCollections || [];
      pending.push({
        type: 'page',
        text: message.payload.text,
        title: message.payload.title,
        url: message.payload.url,
        images: message.payload.images,
        timestamp: Date.now(),
      });
      chrome.storage.local.set({ pendingCollections: pending });
      sendResponse({ success: true });
    });
    return true; // async response
  }

  if (message.type === 'GRAB_AI_CONVERSATION') {
    chrome.storage.local.get(['pendingCollections'], (result) => {
      const pending = result.pendingCollections || [];
      pending.push({
        type: 'conversation',
        messages: message.payload.messages,
        source: message.payload.source,
        url: message.payload.url,
        timestamp: Date.now(),
      });
      chrome.storage.local.set({ pendingCollections: pending });
      sendResponse({ success: true });
    });
    return true;
  }
});
