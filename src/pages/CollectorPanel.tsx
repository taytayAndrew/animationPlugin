import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../store/ProjectContext';
import { v4 as uuid } from 'uuid';
import { Download, Trash2, Globe, MessageSquare, X, RefreshCw, Link2, Loader, Image as ImageIcon } from 'lucide-react';
import type { ConversationSnippet, ReferenceItem } from '../types';
import './CollectorPanel.css';

// ============ URL Scraper ============

interface ScrapedPage {
    title: string;
    text: string;
    images: string[];
    url: string;
}

async function scrapePage(url: string): Promise<ScrapedPage> {
    let html: string;

    // In extension mode, background script can fetch without CORS
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        html = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ type: 'FETCH_URL', url }, (resp: { html?: string; error?: string }) => {
                if (resp?.html) resolve(resp.html);
                else reject(new Error(resp?.error || '抓取失败'));
            });
        });
    } else {
        // Web mode: use CORS proxy
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const resp = await fetch(proxyUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        html = await resp.text();
    }

    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove scripts, styles, nav, footer, ads
    doc.querySelectorAll('script, style, nav, footer, header, iframe, [role="navigation"], [role="banner"], .ad, .ads, .sidebar').forEach(el => el.remove());

    const title = doc.querySelector('title')?.textContent?.trim() || '';

    // Extract main text
    const mainEl = doc.querySelector('article') || doc.querySelector('main') || doc.querySelector('.content') || doc.body;
    const text = mainEl?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 15000) || '';

    // Extract images (absolute URLs)
    const images: string[] = [];
    doc.querySelectorAll('img').forEach(img => {
        let src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        if (!src) return;
        // Resolve relative URLs
        try {
            src = new URL(src, url).href;
        } catch { return; }
        // Filter out tiny icons/trackers
        const w = parseInt(img.getAttribute('width') || '0');
        const h = parseInt(img.getAttribute('height') || '0');
        if ((w > 0 && w < 50) || (h > 0 && h < 50)) return;
        if (src.includes('pixel') || src.includes('tracker') || src.includes('1x1')) return;
        if (!images.includes(src)) images.push(src);
    });

    return { title, text, images: images.slice(0, 30), url };
}

// ============ Types ============

interface CollectedItem {
    type?: string;
    text?: string;
    title?: string;
    url?: string;
    pageUrl?: string;
    pageTitle?: string;
    imageUrl?: string;
    linkUrl?: string;
    images?: string[];
    messages?: { role: string; content: string }[];
    source?: string;
    timestamp: number;
}

// ============ Component ============

export default function CollectorPanel() {
    const { currentProject, updateProject } = useProject();
    const [items, setItems] = useState<CollectedItem[]>([]);
    const [selectedConvMsgs, setSelectedConvMsgs] = useState<Record<number, Set<number>>>({});

    // URL Scraper state
    const [scrapeUrl, setScrapeUrl] = useState('');
    const [scraping, setScraping] = useState(false);
    const [scrapeError, setScrapeError] = useState('');
    const [scraped, setScraped] = useState<ScrapedPage | null>(null);
    const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());

    const loadItems = useCallback(() => {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.get(['pendingCollections'], (result: { pendingCollections?: CollectedItem[] }) => {
                setItems(result.pendingCollections || []);
            });
        }
    }, []);

    useEffect(() => { loadItems(); }, [loadItems]);

    if (!currentProject) return null;

    // === URL Scraper ===
    const handleScrape = async () => {
        let url = scrapeUrl.trim();
        if (!url) return;
        if (!url.startsWith('http')) url = 'https://' + url;
        setScraping(true);
        setScrapeError('');
        setScraped(null);
        setSelectedImages(new Set());
        try {
            const result = await scrapePage(url);
            setScraped(result);
        } catch (e: unknown) {
            setScrapeError(e instanceof Error ? e.message : '抓取失败，请检查网址是否正确');
        }
        setScraping(false);
    };

    const importScraped = () => {
        if (!scraped) return;
        const ref: ReferenceItem = {
            id: uuid(),
            title: scraped.title || '网页抓取',
            url: scraped.url,
            image: selectedImages.size > 0
                ? scraped.images[Array.from(selectedImages)[0]]
                : scraped.images[0] || '',
            aspect: '其他',
            notes: scraped.text.slice(0, 2000),
            tags: [],
        };
        updateProject({
            ...currentProject,
            references: [...currentProject.references, ref],
        });
        setScraped(null);
        setScrapeUrl('');
    };

    const toggleScrapeImage = (idx: number) => {
        setSelectedImages(prev => {
            const s = new Set(prev);
            if (s.has(idx)) s.delete(idx); else s.add(idx);
            return s;
        });
    };

    // === Extension collected items ===
    const clearItem = (index: number) => {
        const next = items.filter((_, i) => i !== index);
        setItems(next);
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.set({ pendingCollections: next });
        }
    };

    const clearAll = () => {
        setItems([]);
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.set({ pendingCollections: [] });
        }
    };

    const importAsReference = (item: CollectedItem) => {
        const ref: ReferenceItem = {
            id: uuid(),
            title: item.pageTitle || item.title || '网页收集',
            url: item.pageUrl || item.url || item.linkUrl || '',
            image: item.imageUrl || '',
            aspect: '其他',
            notes: item.text || '',
            tags: [],
        };
        updateProject({
            ...currentProject,
            references: [...currentProject.references, ref],
        });
    };

    const importConversation = (itemIndex: number, item: CollectedItem, mode: 'full' | 'selected') => {
        if (!item.messages) return;
        const selected = selectedConvMsgs[itemIndex];
        const msgs = mode === 'full'
            ? item.messages
            : item.messages.filter((_, i) => selected?.has(i));

        const snippets: ConversationSnippet[] = msgs.map(m => ({
            id: uuid(),
            role: m.role as 'user' | 'assistant',
            content: m.content,
            source: item.source || '未知',
            capturedAt: item.timestamp,
        }));

        const pipeline = [...currentProject.pipeline];
        if (pipeline.length > 0) {
            pipeline[0] = {
                ...pipeline[0],
                linkedConversations: [...pipeline[0].linkedConversations, ...snippets],
            };
        }
        updateProject({ ...currentProject, pipeline });
    };

    const toggleConvMsg = (itemIndex: number, msgIndex: number) => {
        setSelectedConvMsgs(prev => {
            const copy = { ...prev };
            if (!copy[itemIndex]) copy[itemIndex] = new Set();
            const s = new Set(copy[itemIndex]);
            if (s.has(msgIndex)) s.delete(msgIndex); else s.add(msgIndex);
            copy[itemIndex] = s;
            return copy;
        });
    };

    const isExtension = typeof chrome !== 'undefined' && !!chrome.storage?.local;

    return (
        <div className="collector-panel">

            {/* === URL Scraper === */}
            <div className="scraper-section glass-card">
                <div className="scraper-header">
                    <Link2 size={16} />
                    <span className="scraper-title">网页抓取</span>
                </div>
                <div className="scraper-input-row">
                    <input
                        className="input scraper-url-input"
                        placeholder="输入网址，如 https://example.com/article"
                        value={scrapeUrl}
                        onChange={e => setScrapeUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleScrape()}
                    />
                    <button className="btn btn-primary" onClick={handleScrape} disabled={scraping || !scrapeUrl.trim()}>
                        {scraping ? <><Loader size={14} className="spin" /> 抓取中...</> : <><Globe size={14} /> 抓取</>}
                    </button>
                </div>
                {scrapeError && <div className="scraper-error">⚠️ {scrapeError}</div>}

                {scraped && (
                    <div className="scraped-result">
                        <div className="scraped-header">
                            <h4 className="scraped-title">{scraped.title || '(无标题)'}</h4>
                            <a className="scraped-url" href={scraped.url} target="_blank" rel="noreferrer">{scraped.url}</a>
                        </div>

                        <div className="scraped-text-preview">
                            <span className="scraped-label">正文预览（{scraped.text.length} 字）</span>
                            <p className="scraped-text">{scraped.text.slice(0, 500)}{scraped.text.length > 500 ? '...' : ''}</p>
                        </div>

                        {scraped.images.length > 0 && (
                            <div className="scraped-images">
                                <span className="scraped-label">
                                    <ImageIcon size={12} /> 发现 {scraped.images.length} 张图片（点击选择）
                                </span>
                                <div className="scraped-image-grid">
                                    {scraped.images.map((src, i) => (
                                        <div key={i}
                                            className={`scraped-image-item ${selectedImages.has(i) ? 'selected' : ''}`}
                                            onClick={() => toggleScrapeImage(i)}>
                                            <img src={src} alt="" loading="lazy"
                                                onError={e => (e.currentTarget.style.display = 'none')} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="scraped-actions">
                            <button className="btn btn-primary" onClick={importScraped}>
                                <Download size={14} /> 导入到参考库
                            </button>
                            <button className="btn btn-ghost" onClick={() => setScraped(null)}>
                                取消
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* === Extension collected items === */}
            {isExtension && (
                <>
                    <div className="collector-toolbar">
                        <span className="collector-count">{items.length} 条待导入（扩展收集）</span>
                        <div className="collector-actions">
                            <button className="btn btn-ghost btn-sm" onClick={loadItems}>
                                <RefreshCw size={12} /> 刷新
                            </button>
                            {items.length > 0 && (
                                <button className="btn btn-ghost btn-sm" onClick={clearAll}>
                                    <Trash2 size={12} /> 清空
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="collector-list">
                        {items.map((item, idx) => (
                            <div key={idx} className="collector-item glass-card">
                                {item.type === 'conversation' ? (
                                    <div className="conv-item">
                                        <div className="conv-header">
                                            <MessageSquare size={14} />
                                            <span className="conv-source">{item.source}</span>
                                            <span className="conv-count">{item.messages?.length} 条消息</span>
                                            <div className="conv-actions">
                                                <button className="btn btn-primary btn-sm"
                                                    onClick={() => { importConversation(idx, item, 'full'); clearItem(idx); }}>
                                                    全部导入
                                                </button>
                                                <button className="btn btn-ghost btn-sm"
                                                    onClick={() => { importConversation(idx, item, 'selected'); clearItem(idx); }}>
                                                    导入选中
                                                </button>
                                                <button className="btn-icon" onClick={() => clearItem(idx)}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="conv-messages">
                                            {item.messages?.map((msg, mi) => (
                                                <label key={mi} className={`conv-msg ${msg.role}`}>
                                                    <input type="checkbox"
                                                        checked={selectedConvMsgs[idx]?.has(mi) || false}
                                                        onChange={() => toggleConvMsg(idx, mi)} />
                                                    <span className="conv-role">{msg.role === 'user' ? '你' : 'AI'}</span>
                                                    <span className="conv-text">{msg.content.slice(0, 200)}{msg.content.length > 200 ? '...' : ''}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="web-item">
                                        <div className="web-header">
                                            <Globe size={14} />
                                            <span className="web-title">{item.pageTitle || item.title || '网页内容'}</span>
                                            <div className="web-actions">
                                                <button className="btn btn-primary btn-sm"
                                                    onClick={() => { importAsReference(item); clearItem(idx); }}>
                                                    <Download size={12} /> 导入参考库
                                                </button>
                                                <button className="btn-icon" onClick={() => clearItem(idx)}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        {item.text && <p className="web-text">{item.text.slice(0, 300)}</p>}
                                        {item.imageUrl && <img src={item.imageUrl} alt="" className="web-preview-img" />}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
