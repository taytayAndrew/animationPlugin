// AnimStudio Content Script
// Injected into all pages for: AI conversation grabbing, page content grabbing, toast notifications

(function () {
  'use strict';

  // ============ Toast Notification ============
  function showToast(message) {
    const existing = document.getElementById('animstudio-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'animstudio-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed', bottom: '24px', right: '24px', zIndex: '999999',
      background: '#7C5CFC', color: '#fff', padding: '10px 20px',
      borderRadius: '8px', fontSize: '14px', fontFamily: 'system-ui, sans-serif',
      boxShadow: '0 4px 20px rgba(124,92,252,0.4)', transition: 'opacity 0.3s',
      opacity: '1',
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2500);
  }

  // ============ AI Conversation Detection ============
  const AI_SITES = {
    'chat.deepseek.com': {
      messageSelector: '.ds-markdown--block, .ds-markdown',
      roleSelector: (el) => {
        const parent = el.closest('[class*="message"]') || el.parentElement;
        return parent?.querySelector('[class*="avatar"]')?.textContent?.trim() || 
               (parent?.classList?.toString().includes('user') ? 'user' : 'assistant');
      },
      name: 'DeepSeek',
    },
    'kimi.moonshot.cn': {
      messageSelector: '[class*="message-content"], [class*="chat-message"]',
      roleSelector: (el) => {
        const parent = el.closest('[class*="message"]');
        return parent?.classList?.toString().includes('user') ? 'user' : 'assistant';
      },
      name: 'Kimi',
    },
    'www.doubao.com': {
      messageSelector: '[class*="message-content"], [class*="chat-message"]',
      roleSelector: (el) => {
        const parent = el.closest('[class*="message"]');
        return parent?.classList?.toString().includes('user') ? 'user' : 'assistant';
      },
      name: '豆包',
    },
    'chatgpt.com': {
      messageSelector: '[data-message-author-role] .markdown',
      roleSelector: (el) => {
        const msg = el.closest('[data-message-author-role]');
        return msg?.getAttribute('data-message-author-role') || 'assistant';
      },
      name: 'ChatGPT',
    },
  };

  function detectAISite() {
    const host = window.location.hostname;
    for (const [domain, config] of Object.entries(AI_SITES)) {
      if (host.includes(domain)) return config;
    }
    return null;
  }

  function grabConversation(mode) {
    const site = detectAISite();
    if (!site) {
      showToast('当前页面不是支持的 AI 对话网站');
      return null;
    }

    const elements = document.querySelectorAll(site.messageSelector);
    const messages = [];

    elements.forEach((el) => {
      const role = site.roleSelector(el);
      const content = el.textContent?.trim();
      if (content) {
        messages.push({ role: role === 'user' ? 'user' : 'assistant', content });
      }
    });

    if (messages.length === 0) {
      showToast('未检测到对话内容');
      return null;
    }

    return {
      messages,
      source: site.name,
      url: window.location.href,
    };
  }

  // ============ Page Content Grabbing ============
  function grabPageContent() {
    const title = document.title;
    const url = window.location.href;

    // Get main text content (try article, main, or body)
    const mainEl = document.querySelector('article') || document.querySelector('main') || document.body;
    const text = mainEl?.innerText?.slice(0, 10000) || '';

    // Get images
    const images = [];
    document.querySelectorAll('img').forEach((img) => {
      if (img.src && img.naturalWidth > 100 && img.naturalHeight > 100) {
        images.push(img.src);
      }
    });

    return { title, url, text: text.slice(0, 10000), images: images.slice(0, 20) };
  }

  // ============ Message Listener ============
  chrome.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
    if (message.type === 'SHOW_TOAST') {
      showToast(message.message);
    }

    if (message.type === 'REQUEST_GRAB_PAGE') {
      const data = grabPageContent();
      chrome.runtime.sendMessage({ type: 'GRAB_PAGE', payload: data }, (resp) => {
        showToast('页面内容已抓取');
        sendResponse(resp);
      });
      return true;
    }

    if (message.type === 'REQUEST_GRAB_CONVERSATION') {
      const mode = message.mode || 'full'; // full | selective
      const data = grabConversation(mode);
      if (data) {
        if (mode === 'selective') {
          // Return messages for user to select in popup
          sendResponse({ success: true, data });
        } else {
          // Full mode: send all to storage
          chrome.runtime.sendMessage({ type: 'GRAB_AI_CONVERSATION', payload: data }, (resp) => {
            showToast(`已抓取 ${data.messages.length} 条对话 (${data.source})`);
            sendResponse(resp);
          });
        }
      } else {
        sendResponse({ success: false });
      }
      return true;
    }
  });

  // ============ Floating Action Button (on AI sites) ============
  const site = detectAISite();
  if (site) {
    const fab = document.createElement('div');
    fab.id = 'animstudio-fab';
    fab.innerHTML = '🎬';
    fab.title = `AnimStudio - 抓取${site.name}对话`;
    Object.assign(fab.style, {
      position: 'fixed', bottom: '80px', right: '24px', zIndex: '999998',
      width: '44px', height: '44px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #7C5CFC, #FF6B9D)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '20px', cursor: 'pointer',
      boxShadow: '0 4px 16px rgba(124,92,252,0.5)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    });
    fab.addEventListener('mouseenter', () => { fab.style.transform = 'scale(1.1)'; });
    fab.addEventListener('mouseleave', () => { fab.style.transform = 'scale(1)'; });
    fab.addEventListener('click', () => {
      const data = grabConversation('full');
      if (data) {
        chrome.runtime.sendMessage({ type: 'GRAB_AI_CONVERSATION', payload: data }, () => {
          showToast(`已抓取 ${data.messages.length} 条对话 (${data.source})`);
        });
      }
    });
    document.body.appendChild(fab);
  }
})();
