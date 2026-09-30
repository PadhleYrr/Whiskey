/* ─── UnrealSportsHub Live Router ─── */
const BASE = 'https://jerseycrest.shop';

/* ── 1. LINK REWRITER ── */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (!href || href.startsWith('#') || href.startsWith('mailto')) return;

  let path = href;
  if (href.startsWith('//')) path = 'https:' + href;
  path = path
    .replace('https://jerseycrest.shop', '')
    .replace('http://jerseycrest.shop', '');

  // HOME
  if (path === '/' || path === './index.html') {
    e.preventDefault();
    window.location.href = './index.html';
    return;
  }

  // PRODUCT
  const prodMatch = path.match(/\/products\/([^?#/]+)/);
  if (prodMatch) {
    e.preventDefault();
    window.location.href = `./product.html?handle=${prodMatch[1]}`;
    return;
  }

  // CART
  if (path.startsWith('/cart')) {
    e.preventDefault();
    window.location.href = './cart.html';
    return;
  }

  // SEARCH
  if (path.startsWith('/search')) {
    e.preventDefault();
    const q = path.includes('?q=') ? path.split('?q=')[1] : '';
    window.location.href = `./search.html${q ? '?q=' + q : ''}`;
    return;
  }

  // STATIC PAGES
  if (path.includes('/pages/contact')) {
    e.preventDefault(); window.location.href = './contact.html'; return;
  }
  if (path.includes('/pages/customer-reviews') || path.includes('customer-reviews')) {
    e.preventDefault(); window.location.href = './reviews.html'; return;
  }

  // COLLECTIONS
  if (path.startsWith('/collections')) {
    e.preventDefault();
    const colSlug = path.split('/collections/')[1]?.split(/[?#/]/)[0] || '';

    const localMap = {
    'premier-league':            './premier-league.html',
    'premier-league-26-27':      './premier-league.html',
    'la-liga':                   './laliga.html',
    'la-liga-2026':              './laliga.html',
    'bundesliga':                './bundesliga.html',
    'serie-a':                   './serie-a.html',
    'ligue-1':                   './ligue1.html',
    'ligue1':                    './ligue1.html',
    'international-jerseys':     './international.html',
    'new-season-kits':           './new-season.html',
    'all':                       './collections.html',
    'all-products':              './collections.html',
    '':                          './collections.html',
    'full-sleeves-jerseys':      './collections.html?collection=full-sleeves-jerseys',
    'half-sleeve-jerseys':       './collections.html?collection=half-sleeve-jerseys',
    'retro-jerseys':             './collections.html?collection=retro-jerseys',
    'best-sellers':              './collections.html?collection=best-sellers',
    'special-edition':           './collections.html?collection=special-edition',
    '2026-world-cup':            './collections.html?collection=2026-world-cup',
    'ac-milan-jerseys':          './collections.html?collection=ac-milan-jerseys',
    'argentina-jerseys':         './collections.html?collection=argentina-jerseys',
    'fc-barcelona-jerseys':      './collections.html?collection=fc-barcelona-jerseys',
    'germany-jerseys':           './collections.html?collection=germany-jerseys',
    'manchester-united-jerseys': './collections.html?collection=manchester-united-jerseys',
    'real-madrid-jerseys':       './collections.html?collection=real-madrid-jerseys',
    'f1-jerseys':                './collections.html?collection=f1-jerseys',
  };

    if (localMap[colSlug]) {
      window.location.href = localMap[colSlug];
    } else {
      // club or category collection — filter page
      window.location.href = `./collections.html?collection=${colSlug}`;
    }
    return;
  }
}, true);

/* ── 2. DATA LOADER ── */
let _data = null;

async function loadData() {
  if (_data) return _data;
  try {
    const r = await fetch('./site_data.json');
    _data = await r.json();
  } catch {
    _data = { products: [], collections: [] };
  }
  return _data;
}

async function loadProducts() {
  const d = await loadData();
  return d.products || [];
}

/* ── 3. COLLECTIONS PAGE ── show collection cards OR filtered products ── */
async function initCollectionsPage() {
  const params = new URLSearchParams(window.location.search);
  const col    = params.get('collection');
  const data   = await loadData();

  if (col) {
    const title = col.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const h1 = document.querySelector('h1, .collection-hero__title, .page-title');
    if (h1) h1.textContent = title;
    const filtered = data.products.filter(p =>
      (p.collections || []).some(c => c.handle === col)
    );
    renderProductGrid(filtered, document.querySelector(
      '#ProductGridContainer motion-list, #ProductGridContainer, motion-list.card-grid'
    ));
    return;
  }

  const container = document.querySelector(
    '#ProductGridContainer motion-list, #ProductGridContainer, motion-list.card-grid'
  );
  if (!container) return;

  container.innerHTML = '<p style="padding:2rem;text-align:center;color:#999">Loading…</p>';

  const skip = new Set(['frontpage','all-products']);
  let cols = [];
  try {
    const r = await fetch('https://jerseycrest.shop/collections.json?limit=250');
    cols = (await r.json()).collections.filter(c => !skip.has(c.handle));
  } catch(e) { container.innerHTML = ''; return; }

  // fetch first product image per collection in parallel
  const imgs = await Promise.all(cols.map(async c => {
    try {
      const r = await fetch('https://jerseycrest.shop/collections/' + c.handle + '/products.json?limit=1');
      const src = (await r.json()).products?.[0]?.images?.[0]?.src || '';
      return { h: c.handle, src: src.startsWith('//') ? 'https:' + src : src };
    } catch(e) { return { h: c.handle, src: '' }; }
  }));
  const imgMap = {};
  imgs.forEach(i => { if (i.src) imgMap[i.h] = i.src; });

  container.innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px">' +
    cols.map(c => {
      const src = imgMap[c.handle] || '';
      return '<a href="./collections.html?collection=' + c.handle + '" style="text-decoration:none;color:inherit;background:#f5f5f5;border-radius:8px;overflow:hidden;display:block">' +
        (src ? '<img src="' + src + '" alt="' + c.title + '" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover"/>'
             : '<div style="width:100%;aspect-ratio:1;background:#e0e0e0;display:flex;align-items:center;justify-content:center;font-size:13px;color:#999">' + c.title + '</div>') +
        '<div style="padding:10px;text-align:center"><p style="font-size:13px;font-weight:700;margin:0;text-transform:uppercase;line-height:1.3">' + c.title + '</p></div>' +
        '</a>';
    }).join('') + '</div>';
}

/* ── 4. PRODUCT GRID RENDERER ── */
function renderProductGrid(products, container) {
  if (!container) return;
  // find the motion-list inside ProductGridContainer if we got the wrapper
  const grid = container.querySelector('motion-list') || container;

  if (!products.length) {
    grid.innerHTML = `<p style="padding:2rem;color:#666;grid-column:1/-1;text-align:center">No products found.</p>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    const img    = p.images?.[0] || '';
    const price  = p.variants?.[0]?.price || p.price || '0';
    const compare = p.variants?.[0]?.compare_at_price || null;
    const badge  = !p.any_in_stock
      ? `<div class="badges z-2 absolute grid gap-3 pointer-events-none"><span class="badge flex items-center gap-1d5 font-medium leading-none rounded-full" style="background:#333;color:#fff;padding:4px 8px;font-size:11px">Sold Out</span></div>`
      : (compare && parseFloat(compare) > parseFloat(price)
        ? `<div class="badges z-2 absolute grid gap-3 pointer-events-none"><span class="badge badge--onsale flex items-center gap-1d5 font-medium leading-none rounded-full">Sale</span></div>`
        : '');
    return `
      <div class="card product-card product-card--standard flex flex-col leading-none relative">
        <div class="product-card__media relative h-auto">
          ${badge}
          <a class="block relative media media--square" href="./product.html?handle=${p.handle}">
            <img src="${img}" alt="${p.title}"
              style="width:100%;height:100%;object-fit:cover"
              loading="lazy"
              onerror="this.src=''"/>
          </a>
        </div>
        <div class="product-card__content grow flex flex-col justify-start text-center w-full">
          <div class="product-card__details flex flex-col items-baseline gap-2 w-full">
            <a class="product-card__title reversed-link text-base-xl font-medium leading-tight"
               href="./product.html?handle=${p.handle}">${p.title}</a>
            <div class="price">
              <span class="price__current">Rs. ${parseFloat(price).toFixed(2)}</span>
              ${compare ? `<s class="price__compare" style="color:#999;font-size:12px;margin-left:6px">Rs. ${parseFloat(compare).toFixed(2)}</s>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

/* ── 5. LEAGUE/CATEGORY COLLECTION PAGES ── */
async function initLeaguePage() {
  // figure out which collection this page is for by filename
  const page = window.location.pathname.split('/').pop();
  const fileToCollection = {
    'premier-league.html': 'premier-league-26-27',
    'laliga.html':         'la-liga-2026',
    'bundesliga.html':     'bundesliga',
    'serie-a.html':        'serie-a',
    'ligue1.html':         'ligue-1',
    'international.html':  'international-jerseys',
    'new-season.html':     'new-season-kits',
  };

  const colHandle = fileToCollection[page];
  if (!colHandle) return;

  const data     = await loadData();
  const filtered = data.products.filter(p =>
    (p.collections || []).some(c => c.handle === colHandle)
  );

  const container = document.querySelector(
    '#ProductGridContainer motion-list, #ProductGridContainer, motion-list.card-grid'
  );
  renderProductGrid(filtered, container);
}

/* ── 6. SEARCH ── */
function scoreProduct(p, q) {
  const title = (p.title || '').toLowerCase();
  const tags  = (Array.isArray(p.tags) ? p.tags.join(' ') : p.tags || '').toLowerCase();
  const ql    = q.toLowerCase();
  if (title.includes(ql)) return 3;
  if (tags.includes(ql))  return 2;
  const words = ql.split(/\s+/).filter(Boolean);
  if (words.every(w => title.includes(w))) return 2;
  if (words.some(w => title.includes(w)))  return 1;
  return 0;
}

function renderSuggestions(results, box) {
  box.innerHTML = '';
  if (!results.length) { box.style.display = 'none'; return; }
  results.slice(0, 6).forEach(p => {
    const img   = p.images?.[0] || '';
    const price = p.variants?.[0]?.price || p.price || '';
    const div   = document.createElement('div');
    div.className = 'jc-suggest-item';
    div.innerHTML = `
      <img src="${img}" onerror="this.style.display='none'"/>
      <div class="jc-suggest-info">
        <span class="jc-suggest-title">${p.title}</span>
        <span class="jc-suggest-price">Rs. ${parseFloat(price).toFixed(2)}</span>
      </div>`;
    div.addEventListener('mousedown', () => {
      window.location.href = `./product.html?handle=${p.handle}`;
    });
    box.appendChild(div);
  });
  box.style.display = 'block';
}

function buildSuggestBox(input) {
  const old = document.getElementById('jc-suggest-box');
  if (old) old.remove();
  const box = document.createElement('div');
  box.id = 'jc-suggest-box';
  box.style.cssText = `position:fixed;z-index:99999;background:#fff;border:1px solid #ddd;
    border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,.15);
    max-height:380px;overflow-y:auto;display:none;`;
  document.body.appendChild(box);
  function pos() {
    const r = input.getBoundingClientRect();
    box.style.top   = r.bottom + 'px';
    box.style.left  = r.left + 'px';
    box.style.width = Math.max(r.width, 280) + 'px';
  }
  pos();
  window.addEventListener('scroll', pos, true);
  window.addEventListener('resize', pos);
  return box;
}

async function initSearch() {
  const inputs = document.querySelectorAll(
    'input[type=search],input[name=q],input[placeholder*="earch" i],.search-modal__input'
  );
  if (!inputs.length) return;

  if (!document.getElementById('jc-ss')) {
    const s = document.createElement('style');
    s.id = 'jc-ss';
    s.textContent = `
      .jc-suggest-item{display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;border-bottom:1px solid #f0f0f0}
      .jc-suggest-item:hover{background:#f7f7f7}
      .jc-suggest-item img{width:48px;height:48px;object-fit:cover;border-radius:4px;flex-shrink:0}
      .jc-suggest-info{display:flex;flex-direction:column;gap:3px}
      .jc-suggest-title{font-size:13px;font-weight:500;color:#111;line-height:1.3}
      .jc-suggest-price{font-size:12px;color:#c00;font-weight:600}`;
    document.head.appendChild(s);
  }

  inputs.forEach(input => {
    const box = buildSuggestBox(input);
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length < 2) { box.style.display = 'none'; return; }
      timer = setTimeout(async () => {
        const products = await loadProducts();
        const results  = products
          .map(p => ({ p, score: scoreProduct(p, q) }))
          .filter(x => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(x => x.p);
        renderSuggestions(results, box);
      }, 200);
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        box.style.display = 'none';
        const q = input.value.trim();
        if (q) window.location.href = `./search.html?q=${encodeURIComponent(q)}`;
        e.preventDefault();
      }
      if (e.key === 'Escape') box.style.display = 'none';
    });
    document.addEventListener('click', e => {
      if (!box.contains(e.target) && e.target !== input) box.style.display = 'none';
    });
  });
}

async function initSearchPage() {
  const q = new URLSearchParams(window.location.search).get('q') || '';
  document.querySelectorAll('input[name=q],input[type=search]').forEach(i => i.value = q);
  if (!q) return;
  const products = await loadProducts();
  const results  = products
    .map(p => ({ p, score: scoreProduct(p, q) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.p);
  renderProductGrid(results, document.querySelector(
    '.product-grid,.collection-grid,ul.grid,#product-grid,main ul,.grid'
  ));
}

/* ── 7. CART ── */
function getCart()   { try { return JSON.parse(localStorage.getItem('jc_cart')||'[]'); } catch { return []; } }
function saveCart(c) { localStorage.setItem('jc_cart', JSON.stringify(c)); }

function updateCartCount() {
  const n = getCart().reduce((s,i) => s+(i.qty||1), 0);
  document.querySelectorAll('.cart-count,[data-cart-count],.cart__count').forEach(el => {
    el.textContent = n;
  });
}

window.JC = {
  addToCart(handle, title, price, image, size) {
    const cart = getCart();
    const key  = `${handle}__${size}`;
    const ex   = cart.find(i => i.key === key);
    if (ex) ex.qty++; else cart.push({ key, handle, title, price, image, size, qty:1 });
    saveCart(cart); updateCartCount();
    const btn = document.querySelector('[data-add-to-cart],.product-form__submit');
    if (btn) { const o = btn.textContent; btn.textContent = '✓ Added!'; setTimeout(()=>btn.textContent=o,1500); }
  },
  getCart, saveCart,
};

function initCartPage() {
  const cart = getCart();
  const wrap = document.querySelector('.cart__items,#MainContent,main');
  if (!wrap || !cart.length) return;
  const total = cart.reduce((s,i) => s+parseFloat(i.price)*i.qty, 0);
  wrap.innerHTML = `
    <div style="max-width:720px;margin:2rem auto;padding:0 1rem;font-family:inherit">
      <h1 style="font-size:1.5rem;margin-bottom:1.5rem;font-weight:600">Your cart</h1>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:2px solid #eee;font-size:13px;color:#666">
          <th style="text-align:left;padding:8px 0">Product</th>
          <th style="text-align:center">Size</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Price</th>
          <th></th>
        </tr></thead>
        <tbody>
          ${cart.map((item,idx) => `
            <tr style="border-bottom:1px solid #f0f0f0">
              <td style="padding:14px 0;display:flex;align-items:center;gap:12px">
                <img src="${item.image}" style="width:64px;height:64px;object-fit:cover;border-radius:4px;flex-shrink:0"/>
                <a href="./product.html?handle=${item.handle}" style="font-size:13px;color:#111;text-decoration:none">${item.title}</a>
              </td>
              <td style="text-align:center;font-size:13px">${item.size||'—'}</td>
              <td style="text-align:center">
                <button onclick="JC._qty(${idx},-1)" style="border:1px solid #ddd;background:#fff;width:26px;height:26px;cursor:pointer;border-radius:2px">−</button>
                <span style="margin:0 6px;font-size:13px">${item.qty}</span>
                <button onclick="JC._qty(${idx},1)"  style="border:1px solid #ddd;background:#fff;width:26px;height:26px;cursor:pointer;border-radius:2px">+</button>
              </td>
              <td style="text-align:right;font-size:13px;font-weight:600">Rs. ${(parseFloat(item.price)*item.qty).toFixed(2)}</td>
              <td><button onclick="JC._rm(${idx})" style="border:none;background:none;color:#999;cursor:pointer;font-size:22px">×</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div style="text-align:right;margin-top:2rem;padding-top:1rem;border-top:2px solid #eee">
        <p style="font-size:16px;font-weight:600;margin-bottom:1rem">Total: Rs. ${total.toFixed(2)}</p>
        <a href="https://jerseycrest.shop/cart" target="_blank"
           style="display:inline-block;background:#111;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:500">
          Checkout →
        </a>
      </div>
    </div>`;
  JC._qty = (idx,d) => { const c=getCart(); c[idx].qty=Math.max(1,c[idx].qty+d); saveCart(c); initCartPage(); };
  JC._rm  = idx => { const c=getCart(); c.splice(idx,1); saveCart(c); location.reload(); };
}

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', async () => {
  updateCartCount();
  initSearch();

  const page = window.location.pathname.split('/').pop();
  const search = window.location.search;

  if (page === 'collections.html') initCollectionsPage();
  else if (['premier-league.html','laliga.html','bundesliga.html',
            'serie-a.html','ligue1.html','international.html','new-season.html'].includes(page))
    initLeaguePage();
  else if (page === 'search.html') initSearchPage();
  else if (page === 'cart.html')   initCartPage();

  loadData();
});

/* ── FEATURED COLLECTION TABS FIX ── */
(function initFeaturedTabs() {
  const TAB_MAP = {
    'NEW SEASON KITS':      'new-season-kits',
    'Premier League 26/27': 'premier-league-26-27',
    'La Liga 26/27':        'la-liga-2026',
    'RETRO JERSEYS':        'retro-jerseys',
    'BEST SELLERS':         'best-sellers',
    'SPECIAL EDITION':      'special-edition',
    '2026 WORLD CUP':       '2026-world-cup',
    'HALF SLEEVE JERSEYS':  'half-sleeve-jerseys',
    'FULL SLEEVES JERSEYS': 'full-sleeves-jerseys',
    'Argentina Jerseys':    'argentina-jerseys',
    'AC Milan Jerseys':     'ac-milan-jerseys',
    'Real Madrid Jerseys':  'real-madrid-jerseys',
    'FC Barcelona Jerseys': 'fc-barcelona-jerseys',
  };

  function makeCard(p) {
    const img = p.images?.[0]?.src || '';
    const price = p.variants?.[0]?.price || '';
    const compare = p.variants?.[0]?.compare_at_price;
    const pct = (compare && price && compare > price)
      ? Math.round((1 - price / compare) * 100) : 0;
    return `
      <a href="./product.html?handle=${p.handle}"
         style="position:relative;text-decoration:none;color:inherit;display:flex;
                flex-direction:column;background:#fff;border-radius:8px;
                overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1)">
        ${pct > 0 ? `<span style="position:absolute;top:0;left:0;background:#e00;
          color:#fff;font-size:10px;font-weight:700;padding:2px 7px;
          border-radius:0 0 6px 0;z-index:1">Save ${pct}%</span>` : ''}
        <img src="${img}" alt="${p.title}" loading="lazy"
             style="width:100%;aspect-ratio:3/4;object-fit:cover">
        <div style="padding:8px 6px">
          <div style="font-size:12px;font-weight:600;line-height:1.3;
                      margin-bottom:4px">${p.title}</div>
          <span style="font-weight:700;font-size:13px">Rs. ${price}</span>
          ${compare ? `<span style="text-decoration:line-through;color:#999;
            font-size:11px;margin-left:5px">Rs. ${compare}</span>` : ''}
        </div>
      </a>`;
  }

  async function loadTab(btn) {
    const tabText = btn.querySelector('.btn-text')?.textContent?.trim();
    const handle  = TAB_MAP[tabText];
    const panelId = btn.getAttribute('aria-controls');
    const panel   = panelId && document.getElementById(panelId);
    if (!panel || !handle) return;

    panel.innerHTML = '<div style="padding:3rem;text-align:center;color:#999">Loading…</div>';
    panel.removeAttribute('hidden');
    panel.style.display = '';

    try {
      const r = await fetch(
        `https://jerseycrest.shop/collections/${handle}/products.json?limit=8`
      );
      const { products } = await r.json();
      if (!products?.length) {
        panel.innerHTML = '<p style="padding:2rem;text-align:center">No products</p>';
        return;
      }
      panel.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;
                    gap:12px;padding:12px;position:relative">
          ${products.map(makeCard).join('')}
        </div>
        <div style="text-align:center;padding:12px 0 8px">
          <a href="./collections.html?collection=${handle}"
             style="display:inline-block;padding:10px 32px;background:#000;
                    color:#fff;border-radius:24px;font-weight:600;
                    text-decoration:none;font-size:14px">View All</a>
        </div>`;
    } catch(e) {
      panel.innerHTML =
        '<p style="padding:2rem;text-align:center;color:#c00">Failed to load</p>';
    }
  }

  function clearNullPanels() {
    document.querySelectorAll('[id^="TabPanel-"]').forEach(panel => {
      if (panel.textContent.trim() === 'null')
        panel.innerHTML = '';
    });
  }

  function attachTabs() {
    clearNullPanels();
    document.querySelectorAll('.tab__item').forEach(btn => {
      if (btn.dataset.jcBound) return;
      btn.dataset.jcBound = '1';
      btn.addEventListener('click', () => loadTab(btn));
    });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', attachTabs)
    : attachTabs();
})();

/* ── COLLECTION CARD IMAGE LOADER ── */
(function initCollectionImages() {
  async function run() {
    try {
      const r = await fetch('https://jerseycrest.shop/collections.json?limit=250');
      const { collections } = await r.json();
      const byHandle = {}, byTitle = {};
      collections.forEach(c => {
        if (c.image?.src) {
          byHandle[c.handle] = c.image.src;
          byTitle[c.title.toLowerCase().trim()] = c.image.src;
        }
      });

      document.querySelectorAll('a[href*="/collections/"]').forEach(link => {
        const href   = link.getAttribute('href') || '';
        const handle = (href.match(/\/collections\/([^/?#]+)/) || [])[1];
        const img    = link.querySelector('img');
        if (!img) return;
        const broken =
          !img.getAttribute('src') ||
          img.getAttribute('src').startsWith('data:') ||
          img.naturalWidth === 0;
        const titleKey = link.textContent.trim().toLowerCase();
        const src =
          (handle && byHandle[handle]) ||
          byTitle[titleKey];
        if (src) {
          img.setAttribute('src', src);
          img.style.objectFit = 'cover';
          img.style.width     = '100%';
          img.style.height    = '100%';
        }
      });
    } catch(e) { console.warn('collection images:', e); }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', run)
    : run();
  window.addEventListener('load', run);
})();

/* ── FEATURED COLLECTION TABS FIX ── */
(function initFeaturedTabs() {
  const TAB_MAP = {
    'NEW SEASON KITS':      'new-season-kits',
    'Premier League 26/27': 'premier-league-26-27',
    'La Liga 26/27':        'la-liga-2026',
    'RETRO JERSEYS':        'retro-jerseys',
    'BEST SELLERS':         'best-sellers',
    'SPECIAL EDITION':      'special-edition',
    '2026 WORLD CUP':       '2026-world-cup',
    'HALF SLEEVE JERSEYS':  'half-sleeve-jerseys',
    'FULL SLEEVES JERSEYS': 'full-sleeves-jerseys',
    'Argentina Jerseys':    'argentina-jerseys',
    'AC Milan Jerseys':     'ac-milan-jerseys',
    'Real Madrid Jerseys':  'real-madrid-jerseys',
    'FC Barcelona Jerseys': 'fc-barcelona-jerseys',
  };

  function makeCard(p) {
    const img = p.images?.[0]?.src || '';
    const price = p.variants?.[0]?.price || '';
    const compare = p.variants?.[0]?.compare_at_price;
    const pct = (compare && price && compare > price)
      ? Math.round((1 - price / compare) * 100) : 0;
    return `
      <a href="./product.html?handle=${p.handle}"
         style="position:relative;text-decoration:none;color:inherit;display:flex;
                flex-direction:column;background:#fff;border-radius:8px;
                overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1)">
        ${pct > 0 ? `<span style="position:absolute;top:0;left:0;background:#e00;
          color:#fff;font-size:10px;font-weight:700;padding:2px 7px;
          border-radius:0 0 6px 0;z-index:1">Save ${pct}%</span>` : ''}
        <img src="${img}" alt="${p.title}" loading="lazy"
             style="width:100%;aspect-ratio:3/4;object-fit:cover">
        <div style="padding:8px 6px">
          <div style="font-size:12px;font-weight:600;line-height:1.3;
                      margin-bottom:4px">${p.title}</div>
          <span style="font-weight:700;font-size:13px">Rs. ${price}</span>
          ${compare ? `<span style="text-decoration:line-through;color:#999;
            font-size:11px;margin-left:5px">Rs. ${compare}</span>` : ''}
        </div>
      </a>`;
  }

  async function loadTab(btn) {
    const tabText = btn.querySelector('.btn-text')?.textContent?.trim();
    const handle  = TAB_MAP[tabText];
    const panelId = btn.getAttribute('aria-controls');
    const panel   = panelId && document.getElementById(panelId);
    if (!panel || !handle) return;

    panel.innerHTML = '<div style="padding:3rem;text-align:center;color:#999">Loading…</div>';
    panel.removeAttribute('hidden');
    panel.style.display = '';

    try {
      const r = await fetch(
        `https://jerseycrest.shop/collections/${handle}/products.json?limit=8`
      );
      const { products } = await r.json();
      if (!products?.length) {
        panel.innerHTML = '<p style="padding:2rem;text-align:center">No products</p>';
        return;
      }
      panel.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;
                    gap:12px;padding:12px;position:relative">
          ${products.map(makeCard).join('')}
        </div>
        <div style="text-align:center;padding:12px 0 8px">
          <a href="./collections.html?collection=${handle}"
             style="display:inline-block;padding:10px 32px;background:#000;
                    color:#fff;border-radius:24px;font-weight:600;
                    text-decoration:none;font-size:14px">View All</a>
        </div>`;
    } catch(e) {
      panel.innerHTML =
        '<p style="padding:2rem;text-align:center;color:#c00">Failed to load</p>';
    }
  }

  function clearNullPanels() {
    document.querySelectorAll('[id^="TabPanel-"]').forEach(panel => {
      if (panel.textContent.trim() === 'null')
        panel.innerHTML = '';
    });
  }

  function attachTabs() {
    clearNullPanels();
    document.querySelectorAll('.tab__item').forEach(btn => {
      if (btn.dataset.jcBound) return;
      btn.dataset.jcBound = '1';
      btn.addEventListener('click', () => loadTab(btn));
    });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', attachTabs)
    : attachTabs();
})();

/* ── COLLECTION CARD IMAGE LOADER ── */
(function initCollectionImages() {
  async function run() {
    try {
      const r = await fetch('https://jerseycrest.shop/collections.json?limit=250');
      const { collections } = await r.json();
      const byHandle = {}, byTitle = {};
      collections.forEach(c => {
        if (c.image?.src) {
          byHandle[c.handle] = c.image.src;
          byTitle[c.title.toLowerCase().trim()] = c.image.src;
        }
      });

      document.querySelectorAll('a[href*="/collections/"]').forEach(link => {
        const href   = link.getAttribute('href') || '';
        const handle = (href.match(/\/collections\/([^/?#]+)/) || [])[1];
        const img    = link.querySelector('img');
        if (!img) return;
        const broken =
          !img.getAttribute('src') ||
          img.getAttribute('src').startsWith('data:') ||
          img.naturalWidth === 0;
        const titleKey = link.textContent.trim().toLowerCase();
        const src =
          (handle && byHandle[handle]) ||
          byTitle[titleKey];
        if (src) {
          img.setAttribute('src', src);
          img.style.objectFit = 'cover';
          img.style.width     = '100%';
          img.style.height    = '100%';
        }
      });
    } catch(e) { console.warn('collection images:', e); }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', run)
    : run();
  window.addEventListener('load', run);
})();

/* ── COLLECTION IMAGES FROM HOME PAGE (local assets) ── */
(function fixCollectionImagesFromHome() {
  async function run() {
    try {
      const r   = await fetch('./index.html');
      const html = await r.text();
      const doc  = new DOMParser().parseFromString(html, 'text/html');

      const imgMap = {};
      doc.querySelectorAll('a[href*="/collections/"]').forEach(link => {
        const href   = link.getAttribute('href') || '';
        const handle = (href.match(/\/collections\/([^/?#]+)/) || [])[1];
        const img    = link.querySelector('img');
        if (!handle || !img) return;
        const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        if (src && !src.includes('no-image') && !src.includes('placeholder') &&
            !src.toLowerCase().includes('jc') && handle !== 'all' && handle !== '') {
          imgMap[handle] = src;
        }
      });

      if (!Object.keys(imgMap).length) return;

      document.querySelectorAll('a[href*="/collections/"]').forEach(link => {
        const href   = link.getAttribute('href') || '';
        const handle = (href.match(/\/collections\/([^/?#]+)/) || [])[1];
        const img    = link.querySelector('img');
        if (!handle || !img || !imgMap[handle]) return;
        img.setAttribute('src', imgMap[handle]);
        img.style.objectFit  = 'cover';
        img.style.width      = '100%';
        img.style.height     = '100%';
      });

    } catch(e) { console.warn('collectionImagesFromHome:', e); }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', run)
    : run();
  window.addEventListener('load', run);
})();

/* ── COLLECTION IMAGES V2 (media-card__link, no bad filter) ── */
(function fixCollectionImagesV2() {
  async function run() {
    try {
      const r    = await fetch('./index.html');
      const html = await r.text();
      const doc  = new DOMParser().parseFromString(html, 'text/html');

      const imgMap = {};
      doc.querySelectorAll('a.media-card__link[href*="/collections/"]').forEach(link => {
        const href   = link.getAttribute('href') || '';
        const handle = (href.match(/\/collections\/([^/?#]+)/) || [])[1];
        const img    = link.querySelector('img');
        if (!handle || !img) return;
        let src = img.getAttribute('src') || '';
        if (!src) return;
        if (src.startsWith('//')) src = 'https:' + src;
        imgMap[handle] = src;
      });

      if (!Object.keys(imgMap).length) return;

      document.querySelectorAll('a[href*="/collections/"]').forEach(link => {
        const href   = link.getAttribute('href') || '';
        const handle = (href.match(/\/collections\/([^/?#]+)/) || [])[1];
        const img    = link.querySelector('img');
        if (!handle || !img || !imgMap[handle]) return;
        img.setAttribute('src', imgMap[handle]);
        img.style.objectFit = 'cover';
        img.style.width     = '100%';
        img.style.height    = '100%';
      });

    } catch(e) { console.warn('collectionImagesV2:', e); }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', run)
    : run();
  window.addEventListener('load', run);
})();
