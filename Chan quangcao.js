// ==UserScript==
// @name         TubeTune AdBlock
// @description  Chặn quảng cáo YouTube / YouTube Music, nghe khi tắt màn hình
// @version      1.7
// @match        *://music.youtube.com/*
// @match        *://m.youtube.com/*
// @match        *://www.youtube.com/*
// @run-at       document-start
// @inject-into  page
// ==/UserScript==

// TubeTune 1.7 — chạy trong trang YouTube / YouTube Music trước khi trang tải.
// Sửa ở 1.7:
//  - Trình phát màn hình khóa vẫn biến mất khi bấm Next → thêm "cầu nối" âm thanh
//    câm phát trong lúc chuyển bài để iOS không gỡ trình phát; tắt khi bài mới kêu.
// Sửa ở 1.6:
//  - Bấm Next ở màn hình khóa không còn làm trình phát biến mất: dùng hàm chuyển bài
//    gốc của YouTube, ép phát bài mới ngay khi vừa tải, giữ trạng thái "đang phát".
// Mới ở 1.5:
//  - Bỏ nút tua ±10 giây ở màn hình khóa / Control Center / ô tô, thay bằng
//    nút ⏮ Bài trước / ⏭ Bài tiếp (chỉ cần file này, không cần sửa app).
// Mới ở 1.4:
//  - Chuyển bài từ ô tô (CarPlay / Bluetooth / nút vô lăng): chống nhận lệnh trùng,
//    tự phát bài mới khi màn hình đang tắt. Cần kèm TubeTuneRemote.swift ở phía app.
// Mới ở 1.3:
//  - Thêm nút ⏮ Lùi bài / ⏭ Bài tiếp nổi trên trang khi đang phát danh sách (list=).
//  - Nút Bài trước / Bài tiếp ở màn hình khóa và Control Center hoạt động trong danh sách.
//  - Chuyển bài dùng API của trình phát YouTube (nextVideo / previousVideo),
//    nút trên giao diện chỉ là phương án dự phòng.
// Sửa ở 1.2:
//  - Không còn tắt/bật tiếng video khi bỏ qua quảng cáo.
//  - Tự đóng hộp thoại "Video đã tạm dừng. Tiếp tục xem?" và phát tiếp.
//  - Gỡ dữ liệu "Bạn vẫn đang xem chứ?" khỏi phản hồi của server.
//  - Phân biệt người dùng bấm dừng với iOS tự dừng khi khóa màn hình.
//  - Có vòng kiểm tra định kỳ để phát lại nếu iOS dừng nhạc lúc màn hình tắt.
(() => {
  if (window.__tt) return;

  const vid = () => document.querySelector('video');
  const isVideo = (el) => !!el && el.tagName === 'VIDEO';
  const now = () => Date.now();
  const isMusic = location.hostname === 'music.youtube.com';

  // ---------- 1. Gỡ dữ liệu quảng cáo + "Bạn vẫn đang xem?" khỏi phản hồi server ----------
  const AD_KEYS = [
    'adPlacements', 'playerAds', 'adSlots', 'adBreakHeartbeatParams', 'adBreakParams',
    'youThereRenderer', 'youThereData',
  ];
  const clean = (o) => {
    for (const k of AD_KEYS) if (k in o) delete o[k];
    if (Array.isArray(o.messages)) {
      o.messages = o.messages.filter((m) => !(m && (m.youThereRenderer || m.youThereData)));
    }
  };
  const prune = (o, depth) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) {
      if (depth === 0) o.forEach((x) => prune(x, 1));
      return;
    }
    clean(o);
    if (depth < 3) {
      if (o.playerResponse) prune(o.playerResponse, depth + 1);
      if (o.response) prune(o.response, depth + 1);
    }
  };

  const origParse = JSON.parse;
  JSON.parse = function (...args) {
    const r = origParse.apply(this, args);
    try { prune(r, 0); } catch (e) {}
    return r;
  };

  const origJson = Response.prototype.json;
  Response.prototype.json = function () {
    return origJson.call(this).then((r) => {
      try { prune(r, 0); } catch (e) {}
      return r;
    });
  };

  let initialPR;
  try {
    Object.defineProperty(window, 'ytInitialPlayerResponse', {
      configurable: true,
      get() { return initialPR; },
      set(v) { try { prune(v, 0); } catch (e) {} initialPR = v; },
    });
  } catch (e) {}

  // ---------- 2. Giả vờ trang luôn hiển thị (để nghe khi tắt màn hình) ----------
  const hiddenDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
  const reallyHidden = () => {
    try { return !!(hiddenDesc && hiddenDesc.get && hiddenDesc.get.call(document)); } catch (e) { return false; }
  };
  try {
    Object.defineProperty(Document.prototype, 'hidden', { configurable: true, get: () => false });
    Object.defineProperty(Document.prototype, 'webkitHidden', { configurable: true, get: () => false });
    Object.defineProperty(Document.prototype, 'visibilityState', { configurable: true, get: () => 'visible' });
  } catch (e) {}
  try { Document.prototype.hasFocus = function () { return true; }; } catch (e) {}

  // ---------- 3. Chuyển bài: tiếp theo / lùi lại ----------
  let wantPlay = false;     // người dùng đang muốn nghe
  let userPausedAt = 0;     // lúc người dùng chủ động bấm dừng
  let hiddenAt = 0;         // lúc trang thật sự bị ẩn (khóa màn hình / chuyển app)
  const userPausedRecently = () => now() - userPausedAt < 1500;

  const player = () => document.querySelector('#movie_player, .html5-video-player');
  const clickFirst = (sels) => {
    for (const s of sels) {
      const b = document.querySelector(s);
      if (b && b.getClientRects().length > 0) { b.click(); return true; }
    }
    for (const s of sels) {             // nút bị ẩn vẫn bấm được
      const b = document.querySelector(s);
      if (b) { b.click(); return true; }
    }
    return false;
  };
  const NEXT_SEL = [
    'ytmusic-player-bar .next-button', '.ytp-next-button', '.player-controls-next',
    'button[aria-label*="Next"]', 'button[aria-label*="tiếp theo"]', 'button[aria-label*="Tiếp theo"]',
  ];
  const PREV_SEL = [
    'ytmusic-player-bar .previous-button', '.ytp-prev-button', '.player-controls-prev',
    'button[aria-label*="Previous"]', 'button[aria-label*="trước"]', 'button[aria-label*="Trước"]',
  ];

  // Xe ô tô / tai nghe Bluetooth đôi khi gửi 2 lệnh liền nhau (qua WebKit và qua app)
  // → bỏ lệnh trùng trong 700ms để không nhảy 2 bài.
  let lastSkip = 0;
  const skipBusy = () => {
    if (now() - lastSkip < 700) return true;
    lastSkip = now();
    return false;
  };
  // Khi chuyển bài lúc khóa màn hình: video cũ dừng, bài mới chưa phát → iOS coi như
  // hết nhạc và GỠ trình phát khỏi màn hình khóa. Vì vậy trong ~8 giây sau khi bấm,
  // ép phát ngay khi bài mới vừa tải và giữ trạng thái "đang phát".
  let skipUntil = 0;
  let skipStart = 0;
  let sawLoad = false;      // bài mới đã bắt đầu nạp chưa
  let kickTimer = 0;
  const inSkip = () => now() < skipUntil;

  // "Cầu nối" âm thanh câm: phát một đoạn im lặng trong lúc chuyển bài để iOS
  // luôn thấy trang đang phát nhạc → KHÔNG gỡ trình phát khỏi màn hình khóa.
  let bridge = null;
  const silentUrl = () => {
    const rate = 8000, n = rate;                       // 1 giây, 16-bit mono, toàn số 0
    const buf = new ArrayBuffer(44 + n * 2);
    const d = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) d.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); d.setUint32(4, 36 + n * 2, true); w(8, 'WAVE');
    w(12, 'fmt '); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
    d.setUint32(24, rate, true); d.setUint32(28, rate * 2, true);
    d.setUint16(32, 2, true); d.setUint16(34, 16, true);
    w(36, 'data'); d.setUint32(40, n * 2, true);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  };
  const startBridge = () => {
    try {
      if (!bridge) {
        bridge = new Audio(silentUrl());
        bridge.loop = true;
        bridge.preload = 'auto';
        bridge.setAttribute('playsinline', '');
        bridge.setAttribute('x-webkit-airplay', 'deny');
      }
      bridge.play().catch(() => {});
    } catch (e) {}
  };
  const stopBridge = () => { try { if (bridge && !bridge.paused) bridge.pause(); } catch (e) {} };

  const endSkip = () => {
    skipUntil = 0;
    if (kickTimer) { clearInterval(kickTimer); kickTimer = 0; }
    stopBridge();
  };
  const kick = () => {
    // Chỉ ép phát khi bài MỚI đã nạp (tránh phát lại bài cũ); quá 3 giây thì ép luôn.
    if (!sawLoad && now() - skipStart < 3000) return;
    const v = vid();
    if (v && v.paused && !v.ended && wantPlay) v.play().catch(() => {});
  };
  const afterSkip = () => {
    skipStart = now();
    skipUntil = skipStart + 10000;
    sawLoad = false;
    startBridge();                                     // phải gọi NGAY trong lúc bấm nút
    try { navigator.mediaSession.playbackState = 'playing'; } catch (e) {}
    if (kickTimer) clearInterval(kickTimer);
    kickTimer = setInterval(() => {
      if (!inSkip()) { endSkip(); return; }
      kick();
    }, 200);
  };
  // Bài mới vừa nạp là phát luôn; bài mới đã kêu thì tắt cầu nối.
  ['loadstart', 'emptied', 'loadedmetadata', 'loadeddata', 'canplay'].forEach((t) => {
    document.addEventListener(t, (e) => {
      if (!isVideo(e.target) || !inSkip()) return;
      sawLoad = true;
      if (wantPlay) e.target.play().catch(() => {});
    }, true);
  });
  document.addEventListener('playing', (e) => {
    if (!isVideo(e.target) || !inSkip() || !sawLoad) return;
    setTimeout(() => { const v = vid(); if (v && !v.paused) endSkip(); }, 800);
  }, true);

  const doNext = () => {
    if (isMusic && clickFirst(NEXT_SEL)) return;
    const p = player();
    if (p && typeof p.nextVideo === 'function') { try { p.nextVideo(); return; } catch (e) {} }
    clickFirst(NEXT_SEL);
  };
  const doPrev = () => {
    const v = vid();
    if (v && v.currentTime > 3) { v.currentTime = 0; return; }   // đang giữa bài: về đầu bài
    if (isMusic && clickFirst(PREV_SEL)) return;
    const p = player();
    if (p && typeof p.previousVideo === 'function') { try { p.previousVideo(); return; } catch (e) {} }
    if (!clickFirst(PREV_SEL) && v) v.currentTime = 0;
  };
  // Hàm chuyển bài gốc của YouTube cho màn hình khóa (YouTube viết riêng để chạy
  // được khi khóa máy) → ưu tiên dùng, chỉ tự làm khi YouTube không có.
  let pageNext = null;
  let pagePrev = null;
  const goNext = () => {
    if (skipBusy()) return;
    userPausedAt = 0; wantPlay = true;
    afterSkip();
    if (pageNext) { try { pageNext({ action: 'nexttrack' }); return; } catch (e) {} }
    doNext();
  };
  const goPrev = () => {
    if (skipBusy()) return;
    userPausedAt = 0; wantPlay = true;
    const v = vid();
    if (v && v.currentTime > 3) { v.currentTime = 0; return; }   // giữa bài: về đầu bài
    afterSkip();
    if (pagePrev) { try { pagePrev({ action: 'previoustrack' }); return; } catch (e) {} }
    doPrev();
  };

  // ---------- 4. Nút ở màn hình khóa / Control Center ----------
  try {
    if (window.MediaSession && navigator.mediaSession) {
      const origSet = MediaSession.prototype.setActionHandler;
      const defPause = () => { const v = vid(); if (v) v.pause(); };
      const defPlay = () => { const v = vid(); if (v) v.play().catch(() => {}); };
      const defNext = () => goNext();
      const defPrev = () => goPrev();
      MediaSession.prototype.setActionHandler = function (action, handler) {
        if (action === 'pause') {
          const h = typeof handler === 'function' ? handler : defPause;
          handler = function (...a) { userPausedAt = now(); wantPlay = false; endSkip(); return h.apply(this, a); };
        } else if (action === 'play') {
          const h = typeof handler === 'function' ? handler : defPlay;
          handler = function (...a) { userPausedAt = 0; wantPlay = true; return h.apply(this, a); };
        } else if (action === 'nexttrack') {
          // Giữ hàm của YouTube để gọi bên trong; nút luôn bật kể cả khi trang gỡ.
          pageNext = typeof handler === 'function' ? handler : null;
          handler = defNext;
        } else if (action === 'previoustrack') {
          pagePrev = typeof handler === 'function' ? handler : null;
          handler = defPrev;
        } else if (action === 'seekforward' || action === 'seekbackward') {
          // Không cho trang đặt nút tua ±10s: khi có nút tua, iOS / ô tô hiện tua
          // thay cho chuyển bài. Gỡ đi thì iOS hiện ⏮ ⏭.
          handler = null;
        }
        try { return origSet.call(this, action, handler); } catch (e) {}
      };
      const S = (a, h) => { try { navigator.mediaSession.setActionHandler(a, h); } catch (e) {} };
      S('pause', defPause);
      S('play', defPlay);
      S('nexttrack', defNext);
      S('previoustrack', defPrev);
      S('seekforward', null);
      S('seekbackward', null);
    }
  } catch (e) {}

  // Cố phát lại vài lần (iOS đôi khi từ chối lần đầu).
  const resume = (v) => {
    let n = 0;
    const tryPlay = () => {
      if (!v || !wantPlay || !v.paused || v.ended || userPausedRecently()) return;
      v.play().catch(() => {});
      if (++n < 8) setTimeout(tryPlay, 400 * n);
    };
    tryPlay();
  };

  const stop = (e) => e.stopImmediatePropagation();
  const onVisibility = (e) => {
    if (reallyHidden()) {
      hiddenAt = now();
      const v = vid();
      if (v && wantPlay && v.paused && !v.ended) resume(v);
    }
    stop(e);
  };
  ['visibilitychange', 'webkitvisibilitychange'].forEach((t) => {
    window.addEventListener(t, onVisibility, true);
    document.addEventListener(t, onVisibility, true);
  });
  window.addEventListener('blur', (e) => { if (e.target === window) stop(e); }, true);
  window.addEventListener('pagehide', () => { hiddenAt = now(); }, true);

  document.addEventListener('play', (e) => {
    if (isVideo(e.target)) { wantPlay = true; userPausedAt = 0; }
  }, true);

  document.addEventListener('pause', (e) => {
    const v = e.target;
    if (!isVideo(v) || v.ended) return;            // hết bài: để trang tự chuyển bài
    if (inSkip() && wantPlay) return;              // đang chuyển bài: không coi là người dùng dừng
    if (!wantPlay || userPausedRecently()) { wantPlay = false; return; }
    setTimeout(() => {
      if (userPausedRecently()) { wantPlay = false; return; }
      const systemPause = reallyHidden() || now() - hiddenAt < 3000;
      if (!systemPause) { wantPlay = false; return; }
      resume(v);
    }, 300);
  }, true);

  // ---------- 5. Tự đóng "Video đã tạm dừng. Tiếp tục xem?" ----------
  const DIALOG_TXT = /tạm dừng|tiếp tục xem|vẫn đang (xem|nghe)|video paused|continue watching|still (watching|listening)|are you there/i;
  const DIALOG_SEL = [
    '[role="dialog"]', '[role="alertdialog"]', 'tp-yt-paper-dialog', 'ytm-dialog',
    'bottom-sheet-container', 'yt-confirm-dialog-renderer', 'ytm-confirm-dialog-renderer',
    'ytmusic-you-there-renderer', 'yt-you-there-renderer', 'ytm-you-there-renderer',
  ].join(',');
  const visible = (el) => el.getClientRects().length > 0;
  const dismissYouThere = () => {
    for (const d of document.querySelectorAll(DIALOG_SEL)) {
      if (!visible(d) || !DIALOG_TXT.test(d.textContent || '')) continue;
      const btns = [...d.querySelectorAll('button, [role="button"]')].filter(visible);
      const b = btns[btns.length - 1];
      if (!b) continue;
      b.click();
      setTimeout(() => {
        const v = vid();
        if (v && v.paused && !v.ended && !userPausedRecently()) {
          wantPlay = true;
          v.play().catch(() => {});
        }
      }, 300);
      return true;
    }
    return false;
  };
  let dlgTimer = 0;
  const startObserver = () => {
    new MutationObserver(() => {
      if (dlgTimer) return;
      dlgTimer = setTimeout(() => { dlgTimer = 0; try { dismissYouThere(); } catch (e) {} }, 300);
    }).observe(document.documentElement, { childList: true, subtree: true });
  };
  if (document.documentElement) startObserver();
  else document.addEventListener('DOMContentLoaded', startObserver);

  // ---------- 6. Ẩn khung quảng cáo + kiểu cho nút chuyển bài ----------
  const css = `
    ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, ytd-banner-promo-renderer,
    ytd-promoted-sparkles-web-renderer, ytm-promoted-sparkles-web-renderer,
    ytm-companion-ad-renderer, ytm-promoted-video-renderer, ad-slot-renderer,
    #player-ads, #masthead-ad, .ytp-ad-overlay-container, .ytp-ad-image-overlay,
    ytmusic-mealbar-promo-renderer, ytm-mealbar-promo-renderer,
    ytmusic-statement-banner-renderer, ytm-statement-banner-renderer
    { display: none !important; }

    #tt-nav {
      position: fixed; right: 12px; bottom: 90px; z-index: 2147483647;
      display: none; gap: 10px; flex-direction: row;
      -webkit-user-select: none; user-select: none;
    }
    #tt-nav.tt-show { display: flex; }
    #tt-nav button {
      width: 48px; height: 48px; border-radius: 50%; border: none; padding: 0;
      background: rgba(20,20,20,.78); color: #fff; font-size: 20px; line-height: 48px;
      box-shadow: 0 2px 8px rgba(0,0,0,.35); cursor: pointer;
      -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    }
    #tt-nav button:active { transform: scale(.92); background: rgba(255,0,0,.85); }`;
  const addStyle = () => {
    const s = document.createElement('style');
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  };
  if (document.documentElement) addStyle();
  else document.addEventListener('DOMContentLoaded', addStyle);

  // ---------- 7. Nút ⏮ / ⏭ nổi trên trang khi phát danh sách ----------
  const inList = () => /[?&]list=/.test(location.search);
  const ensureNav = () => {
    let nav = document.getElementById('tt-nav');
    if (!nav && document.body) {
      nav = document.createElement('div');
      nav.id = 'tt-nav';
      const mk = (label, title, fn) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.setAttribute('aria-label', title);
        b.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          try { fn(); } catch (err) {}
        }, true);
        ['touchstart', 'touchend', 'pointerdown', 'pointerup', 'mousedown', 'mouseup']
          .forEach((t) => b.addEventListener(t, (e) => e.stopPropagation(), true));
        return b;
      };
      nav.appendChild(mk('⏮', 'Bài trước', goPrev));
      nav.appendChild(mk('⏭', 'Bài tiếp', goNext));
      document.body.appendChild(nav);
    }
    if (nav) nav.classList.toggle('tt-show', inList() && !!vid());
  };

  // ---------- 8. Bỏ qua quảng cáo video nếu vẫn lọt (KHÔNG tắt tiếng) ----------
  let inAd = false;
  const skipAds = () => {
    const p = player();
    const v = vid();
    const adShowing = !!p &&
      (p.classList.contains('ad-showing') || p.classList.contains('ad-interrupting'));
    if (adShowing && v) {
      inAd = true;
      if (isFinite(v.duration) && v.duration > 0 && v.currentTime < v.duration - 0.2) {
        v.currentTime = Math.max(v.duration - 0.1, 0);
      }
      if (v.paused && wantPlay) v.play().catch(() => {});
    } else if (inAd) {
      inAd = false;
    }
    document
      .querySelectorAll('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, .ytp-ad-skip-button-slot button')
      .forEach((b) => b.click());
  };
  setInterval(() => { try { skipAds(); } catch (e) {} }, 250);

  // ---------- 9. Giữ phiên "đang hoạt động" + canh phát lại khi màn hình tắt ----------
  setInterval(() => {
    window._lact = now();
    window._fact = now();
    try { dismissYouThere(); } catch (e) {}
    const v = vid();
    if (v && wantPlay && v.paused && !v.ended && v.readyState > 0 &&
        !userPausedRecently() && !inSkip() && reallyHidden()) {
      v.play().catch(() => {});
    }
  }, 2000);

  // ---------- 10. API cho app (màn hình khóa, Control Center) ----------
  window.__tt = {
    play() { const v = vid(); userPausedAt = 0; wantPlay = true; if (v) v.play().catch(() => {}); },
    pause() { const v = vid(); userPausedAt = now(); wantPlay = false; endSkip(); if (v) v.pause(); },
    toggle() { const v = vid(); if (!v) return; if (v.paused) this.play(); else this.pause(); },
    next() { goNext(); },
    prev() { goPrev(); },
    seek(t) { const v = vid(); if (v) v.currentTime = t; },
  };

  // ---------- 11. Báo thông tin bài đang phát về app + cập nhật nút ----------
  setInterval(() => {
    try { ensureNav(); } catch (e) {}
    const v = vid();
    if (!v) return;
    const m = navigator.mediaSession && navigator.mediaSession.metadata;
    let art = '';
    if (m && m.artwork && m.artwork.length) art = m.artwork[m.artwork.length - 1].src;
    const title = (m && m.title) || document.title.replace(/\s*-\s*YouTube( Music)?$/, '');
    try {
      window.webkit.messageHandlers.tubetune.postMessage({
        title,
        artist: (m && m.artist) || '',
        artwork: art,
        duration: isFinite(v.duration) ? v.duration : 0,
        position: v.currentTime || 0,
        playing: !v.paused && !v.ended,
        ad: inAd,
        inList: inList(),
      });
    } catch (e) {}
  }, 1000);
})();
