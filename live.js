/* ─── JerseyCrest Live Router ─── */
const BASE = 'https://jerseycrest.shop';

/* ── 1. LINK REWRITER ── */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto')) return;

  // normalize — make everything a full path string
  let path = href;
  if (href.startsWith('//')) path = 'https:' + href;
  // strip domain if present
  path = path
    .replace('https://jerseycrest.shop', '')
    .replace('http://jerseycrest.shop', '');

  // ── HOME ──
  if (path === '/' || path === '' || path.includes('jerseycrest.shop/') && path.split('/').length <= 4 && !path.includes('collections') && !path.includes('products') && !path.includes('cart') && !path.includes('search')) {
    e.preventDefault();
    window.location.href = './index.html';
    return;
  }

  // ── PRODUCT ──
  const prodMatch = path.match(/\/products\/([^?#/]+)/);
  if (prodMatch) {
    e.preventDefault();
    window.location.href = `./product.html?handle=${prodMatch[1]}`;
    return;
  }

  // ── CART ──
  if (path.startsWith('/cart')) {
    e.preventDefault();
    window.location.href = './cart.html';
    return;
  }

  // ── SEARCH ──
  if (path.startsWith('/search')) {
    e.preventDefault();
    const q = path.includes('?q=') ? path.split('?q=')[1] : '';
    window.location.href = `./search.html${q ? '?q=' + q : ''}`;
    return;
  }

  // ── COLLECTIONS ──
  if (path.startsWith('/collections')) {
    e.preventDefault();
    const colSlug = path.split('/collections/')[1]?.split(/[?#/]/)[0] || '';

    // local pages we have
    const localMap = {
      'premier-league':           './premier-league.html',
      'premier-league-26-27':     './premier-league.html',
      'la-liga':                  './laliga.html',
      'la-liga-2026':             './laliga.html',
      'bundesliga':               './bundesliga.html',
      'serie-a':                  './serie-a.html',
      'ligue-1':                  './ligue1.html',
      'international-jerseys':    './international.html',
      'new-season-kits':          './new-season.html',
      'all':                      './collections.html',
      'all-products':             './collections.html',
      '':                         './collections.html',
    };

    if (localMap[colSlug]) {
      window.location.href = localMap[colSlug];
      return;
    }

    // no local page — go to collections.html with filter param
    // live.js will filter products by collection tag
    window.location.href = `./collections.html?collection=${colSlug}`;
    return;
  }
});

/* ── 2. COLLECTION FILTER (for club/category pages) ── */
async function initCollectionFilter() {
  const params = new URLSearchParams(window.location.search);
  const col    = params.get('collection');
  if (!col) return;

  // update page title
  const h1 = document.querySelector('h1, .collection-hero__title, .page-title');
  if (h1) h1.textContent = col.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const products = await loadProducts();

  // filter by collection handle or tag match
  const filtered = products.filter(p => {
    const inCol = (p.collections || []).some(c =>
      c.handle === col || c.handle?.includes(col.split('-')[0])
    );
    const inTags = (p.tags || []).some(t =>
      t.toLowerCase().includes(col.replace(/-/g, ' ').split(' ')[0].toLowerCase())
    );
    return inCol || inTags;
  });

  renderProductGrid(filtered);
}

/* ── 3. PRODUCT GRID RENDERER ── */
function renderProductGrid(products) {
  // find the product grid container
  const container = document.querySelector(
    '.product-grid, .collection-grid, ul.grid, .grid--4-col-desktop, #product-grid, main ul'
  );
  if (!container) return;

  if (!products.length) {
    container.innerHTML = `<p style="padding:2rem;color:#666;grid-column:1/-1">No products found.</p>`;
    return;
  }

  container.innerHTML = products.map(p => {
    const img    = (p.images && p.images[0]) ? (p.images[0].src || p.images[0]) : '';
    const price  = p.variants ? p.variants[0]?.price : (p.price || '0');
    const handle = p.handle || '';
    const badge  = !p.any_in_stock ? '<span style="position:absolute;top:8px;left:8px;background:#333;color:#fff;font-size:10px;padding:2px 6px;border-radius:2px">Sold Out</span>' : '';
    return `
      <li class="grid__item">
        <div class="card-wrapper" style="position:relative">
          ${badge}
          <a href="./product.html?handle=${handle}" style="text-decoration:none;color:inherit">
            <div style="aspect-ratio:1;overflow:hidden;border-radius:6px;background:#f5f5f5">
              <img src="${img}" alt="${p.title}"
                style="width:100%;height:100%;object-fit:cover"
                loading="lazy"
                onerror="this.src='./assets/placeholder.png'"/>
            </div>
            <div style="padding:8px 4px">
              <p style="font-size:13px;margin:4px 0;font-weight:500;line-height:1.3">${p.title}</p>
              <p style="font-size:13px;color:#c00;font-weight:600;margin:2px 0">
                Rs. ${parseFloat(price).toFixed(2)}
              </p>
            </div>
          </a>
        </div>
      </li>`;
  }).join('');
}

/* ── 4. SEARCH ENGINE ── */
let _allProducts = null;

async function loadProducts() {
  if (_allProducts) return _allProducts;
  try {
    const r = await fetch('./site_data.json');
    const d = await r.json();
    _allProducts = d.products || [];
  } catch {
    const pages = [];
    let page = 1;
    while (true) {
      try {
        const r = await fetch(`${BASE}/products.json?limit=250&page=${page}`);
        const d = await r.json();
        if (!d.products?.length) break;
        pages.push(...d.products);
        if (d.products.length < 250) break;
        page++;
      } catch { break; }
    }
    _allProducts = pages;
  }
  return _allProducts;
}

function scoreProduct(p, q) {
  const title = (p.title || '').toLowerCase();
  const tags  = (Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '')).toLowerCase();
  const type  = (p.product_type || '').toLowerCase();
  const ql    = q.toLowerCase();
  if (title.includes(ql)) return 3;
  if (tags.includes(ql) || type.includes(ql)) return 2;
  const words = ql.split(/\s+/).filter(Boolean);
  if (words.every(w => title.includes(w))) return 2;
  if (words.some(w => title.includes(w)))  return 1;
  return 0;
}

function renderSuggestions(results, box) {
  box.innerHTML = '';
  if (!results.length) { box.style.display = 'none'; return; }
  results.slice(0, 6).forEach(p => {
    const img    = (p.images && p.images[0]) ? (p.images[0].src || p.images[0]) : '';
    const price  = p.variants ? p.variants[0]?.price : (p.price || '');
    const handle = p.handle || '';
    const div    = document.createElement('div');
    div.className = 'jc-suggest-item';
    div.innerHTML = `
      <img src="${img}" onerror="this.style.display='none'" />
      <div class="jc-suggest-info">
        <span class="jc-suggest-title">${p.title}</span>
        <span class="jc-suggest-price">Rs. ${parseFloat(price).toFixed(2)}</span>
      </div>`;
    div.addEventListener('mousedown', () => {
      window.location.href = `./product.html?handle=${handle}`;
    });
    box.appendChild(div);
  });
  box.style.display = 'block';
}

function buildSuggestBox(input) {
  const existing = document.getElementById('jc-suggest-box');
  if (existing) existing.remove();
  const box = document.createElement('div');
  box.id = 'jc-suggest-box';
  box.style.cssText = `
    position:absolute;z-index:99999;background:#fff;border:1px solid #ddd;
    border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,.15);
    width:${Math.max(input.offsetWidth, 280)}px;
    max-height:380px;overflow-y:auto;display:none;`;
  document.body.appendChild(box);
  function reposition() {
    const r = input.getBoundingClientRect();
    box.style.top  = (r.bottom + window.scrollY) + 'px';
    box.style.left = (r.left   + window.scrollX) + 'px';
    box.style.width = Math.max(input.offsetWidth, 280) + 'px';
  }
  reposition();
  window.addEventListener('scroll', reposition);
  window.addEventListener('resize', reposition);
  return box;
}

async function initSearch() {
  const inputs = document.querySelectorAll(
    'input[type=search], input[name=q], input[placeholder*="earch" i], .search-modal__input, .search-form__input'
  );
  if (!inputs.length) return;

  if (!document.getElementById('jc-search-style')) {
    const s = document.createElement('style');
    s.id = 'jc-search-style';
    s.textContent = `
      #jc-suggest-box { font-family: inherit; }
      .jc-suggest-item {
        display:flex;align-items:center;gap:10px;padding:10px 12px;
        cursor:pointer;border-bottom:1px solid #f0f0f0;
      }
      .jc-suggest-item:hover { background:#f7f7f7; }
      .jc-suggest-item img { width:48px;height:48px;object-fit:cover;border-radius:4px;flex-shrink:0; }
      .jc-suggest-info { display:flex;flex-direction:column;gap:3px; }
      .jc-suggest-title { font-size:13px;font-weight:500;color:#111;line-height:1.3; }
      .jc-suggest-price { font-size:12px;color:#c00;font-weight:600; }
    `;
    document.head.appendChild(s);
  }

  inputs.forEach(input => {
    const box = buildSuggestBox(input);
    let timer;

    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 2) box.style.display = 'block';
    });

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

/* ── 5. SEARCH PAGE ── */
async function initSearchPage() {
  const params = new URLSearchParams(window.location.search);
  const q      = params.get('q') || '';
  document.querySelectorAll('input[name=q], input[type=search]').forEach(i => i.value = q);
  if (!q) return;

  const products = await loadProducts();
  const results  = products
    .map(p => ({ p, score: scoreProduct(p, q) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.p);

  renderProductGrid(results);

  // update result count
  const count = document.querySelector('.search-results-count, .results-count');
  if (count) count.textContent = `${results.length} results for "${q}"`;
}

/* ── 6. CART ── */
function getCart()      { try { return JSON.parse(localStorage.getItem('jc_cart') || '[]'); } catch { return []; } }
function saveCart(c)    { localStorage.setItem('jc_cart', JSON.stringify(c)); }

function updateCartCount() {
  const count = getCart().reduce((s, i) => s + (i.qty || 1), 0);
  document.querySelectorAll(
    '.cart-count, [data-cart-count], .cart-link .count, header a[href*="cart"] .count, .cart__count'
  ).forEach(el => { el.textContent = count; el.style.display = count ? '' : 'none'; });
}

window.JC = {
  addToCart(handle, title, price, image, size) {
    const cart = getCart();
    const key  = `${handle}__${size}`;
    const ex   = cart.find(i => i.key === key);
    if (ex) { ex.qty++; } else { cart.push({ key, handle, title, price, image, size, qty: 1 }); }
    saveCart(cart);
    updateCartCount();
    const btn = document.querySelector('[data-add-to-cart], .product-form__submit');
    if (btn) { const orig = btn.textContent; btn.textContent = '✓ Added!'; setTimeout(() => btn.textContent = orig, 1500); }
  },
  getCart, saveCart,
};

function initCartPage() {
  const cart  = getCart();
  const wrap  = document.querySelector('.cart__items, #MainContent, main');
  if (!wrap || !cart.length) return;

  const total = cart.reduce((s, i) => s + parseFloat(i.price) * i.qty, 0);

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
          ${cart.map((item, idx) => `
            <tr style="border-bottom:1px solid #f0f0f0">
              <td style="padding:14px 0;display:flex;align-items:center;gap:12px">
                <img src="${item.image}" style="width:64px;height:64px;object-fit:cover;border-radius:4px;flex-shrink:0"/>
                <a href="./product.html?handle=${item.handle}" style="font-size:13px;color:#111;text-decoration:none">${item.title}</a>
              </td>
              <td style="text-align:center;font-size:13px">${item.size || '—'}</td>
              <td style="text-align:center">
                <button onclick="JC._qty(${idx},-1)" style="border:1px solid #ddd;background:#fff;width:24px;height:24px;cursor:pointer;border-radius:2px">−</button>
                <span style="margin:0 6px;font-size:13px">${item.qty}</span>
                <button onclick="JC._qty(${idx},1)"  style="border:1px solid #ddd;background:#fff;width:24px;height:24px;cursor:pointer;border-radius:2px">+</button>
              </td>
              <td style="text-align:right;font-size:13px;font-weight:600">Rs. ${(parseFloat(item.price)*item.qty).toFixed(2)}</td>
              <td style="text-align:right">
                <button onclick="JC._rm(${idx})" style="border:none;background:none;color:#999;cursor:pointer;font-size:20px;line-height:1">×</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div style="text-align:right;margin-top:2rem;padding-top:1rem;border-top:2px solid #eee">
        <p style="font-size:16px;font-weight:600;margin-bottom:1rem">Total: Rs. ${total.toFixed(2)}</p>
        <a href="https://jerseycrest.shop/cart" target="_blank"
           style="display:inline-block;background:#111;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:.5px">
          Checkout →
        </a>
      </div>
    </div>`;

  JC._qty = (idx, d) => {
    const c = getCart(); c[idx].qty = Math.max(1, c[idx].qty + d);
    saveCart(c); initCartPage();
  };
  JC._rm = idx => {
    const c = getCart(); c.splice(idx, 1); saveCart(c); location.reload();
  };
}

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', async () => {
  updateCartCount();
  initSearch();
  initCollectionFilter();

  const p = window.location.pathname + window.location.search;
  if (p.includes('search.html'))  initSearchPage();
  if (p.includes('cart.html'))    initCartPage();

  loadProducts(); // preload silently
});

/* ── CONTACT + REVIEWS PATCH ── */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (href.includes('/pages/contact') || href.includes('contact-us')) {
    e.preventDefault();
    window.location.href = './contact.html';
  }
  if (href.includes('/pages/customer-reviews') || href.includes('customer-reviews')) {
    e.preventDefault();
    window.location.href = './reviews.html';
  }
}, true);
