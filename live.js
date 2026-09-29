/* ─── JerseyCrest Live Router ─── */
const BASE = 'https://jerseycrest.shop';

/* ── 1. LINK REWRITER ── intercept all clicks */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href) return;

  // product links
  const prodMatch = href.match(/\/products\/([^?#/]+)/);
  if (prodMatch) {
    e.preventDefault();
    window.location.href = `./product.html?handle=${prodMatch[1]}`;
    return;
  }

  // cart
  if (href.includes('/cart')) {
    e.preventDefault();
    window.location.href = './cart.html';
    return;
  }

  // search
  if (href.includes('/search')) {
    e.preventDefault();
    window.location.href = './search.html';
    return;
  }

  // collection links — map to local pages
  const colMap = {
    'premier-league':       './premier-league.html',
    'la-liga':              './laliga.html',
    'bundesliga':           './bundesliga.html',
    'serie-a':              './serie-a.html',
    'ligue-1':              './ligue1.html',
    'international-jerseys':'./international.html',
    'new-season-kits':      './new-season.html',
    'all':                  './collections.html',
  };
  const colMatch = href.match(/\/collections\/([^?#/]+)/);
  if (colMatch && colMap[colMatch[1]]) {
    e.preventDefault();
    window.location.href = colMap[colMatch[1]];
    return;
  }
});

/* ── 2. SEARCH ENGINE ── */
let _allProducts = null;

async function loadProducts() {
  if (_allProducts) return _allProducts;
  try {
    // try local site_data.json first
    const r = await fetch('./site_data.json');
    const d = await r.json();
    _allProducts = d.products || [];
  } catch {
    // fallback: live API
    const pages = [];
    let page = 1;
    while (true) {
      const r = await fetch(`${BASE}/products.json?limit=250&page=${page}`);
      const d = await r.json();
      if (!d.products || !d.products.length) break;
      pages.push(...d.products);
      if (d.products.length < 250) break;
      page++;
    }
    _allProducts = pages;
  }
  return _allProducts;
}

function scoreProduct(p, q) {
  const title = (p.title || '').toLowerCase();
  const tags  = (p.tags || []).join(' ').toLowerCase();
  const type  = (p.product_type || '').toLowerCase();
  const ql    = q.toLowerCase();
  if (title.includes(ql)) return 3;
  if (tags.includes(ql))  return 2;
  if (type.includes(ql))  return 1;
  // word-by-word
  const words = ql.split(/\s+/).filter(Boolean);
  if (words.every(w => title.includes(w))) return 2;
  if (words.some(w => title.includes(w)))  return 1;
  return 0;
}

function renderSuggestions(results, box) {
  box.innerHTML = '';
  if (!results.length) {
    box.style.display = 'none';
    return;
  }
  results.slice(0, 6).forEach(p => {
    const img   = (p.images && p.images[0]) ? p.images[0].src || p.images[0] : '';
    const price = p.variants ? p.variants[0].price : (p.price || '');
    const handle= p.handle || p.url?.split('/products/')[1] || '';
    const div   = document.createElement('div');
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
  const box = document.createElement('div');
  box.id = 'jc-suggest-box';
  box.style.cssText = `
    position:absolute;z-index:9999;background:#fff;border:1px solid #ddd;
    border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,.12);
    width:${input.offsetWidth || 320}px;max-height:360px;overflow-y:auto;
    top:${input.offsetTop + input.offsetHeight}px;
    left:${input.offsetLeft}px;display:none;`;
  input.parentElement.style.position = 'relative';
  input.parentElement.appendChild(box);
  return box;
}

async function initSearch() {
  // find ALL search inputs on the page
  const inputs = document.querySelectorAll(
    'input[type=search], input[name=q], input[placeholder*="earch" i], .search-input'
  );
  if (!inputs.length) return;

  // inject suggestion styles
  if (!document.getElementById('jc-search-style')) {
    const s = document.createElement('style');
    s.id = 'jc-search-style';
    s.textContent = `
      .jc-suggest-item {
        display:flex;align-items:center;gap:10px;padding:8px 12px;
        cursor:pointer;border-bottom:1px solid #f0f0f0;
      }
      .jc-suggest-item:hover { background:#f7f7f7; }
      .jc-suggest-item img { width:44px;height:44px;object-fit:cover;border-radius:4px;flex-shrink:0; }
      .jc-suggest-info { display:flex;flex-direction:column;gap:2px; }
      .jc-suggest-title { font-size:13px;font-weight:500;color:#111; }
      .jc-suggest-price { font-size:12px;color:#c00; }
      .jc-no-results { padding:12px;color:#666;font-size:13px; }
    `;
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
      }, 220);
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        box.style.display = 'none';
        const q = input.value.trim();
        if (q) window.location.href = `./search.html?q=${encodeURIComponent(q)}`;
      }
    });

    document.addEventListener('click', e => {
      if (!box.contains(e.target) && e.target !== input) box.style.display = 'none';
    });
  });
}

/* ── 3. SEARCH PAGE — render results ── */
async function initSearchPage() {
  const params = new URLSearchParams(window.location.search);
  const q      = params.get('q') || '';
  if (!q) return;

  // fill the search box value
  document.querySelectorAll('input[name=q], input[type=search]').forEach(i => i.value = q);

  const products = await loadProducts();
  const results  = products
    .map(p => ({ p, score: scoreProduct(p, q) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.p);

  // find the results container — Shopify search page uses #MainContent or .search-results
  const container = document.querySelector(
    '#MainContent .grid, #MainContent ul, .search-results, .product-grid, main'
  );
  if (!container) return;

  if (!results.length) {
    container.innerHTML = `<p style="padding:2rem;color:#666">No results for "<strong>${q}</strong>"</p>`;
    return;
  }

  container.innerHTML = results.map(p => {
    const img    = (p.images && p.images[0]) ? p.images[0].src || p.images[0] : '';
    const price  = p.variants ? p.variants[0].price : (p.price || '');
    const handle = p.handle || p.url?.split('/products/')[1] || '';
    return `
      <div style="display:inline-block;width:200px;margin:10px;vertical-align:top;text-align:center">
        <a href="./product.html?handle=${handle}">
          <img src="${img}" style="width:100%;height:200px;object-fit:cover;border-radius:6px" />
          <p style="font-size:13px;margin:6px 0">${p.title}</p>
          <p style="font-size:13px;color:#c00;font-weight:600">Rs. ${parseFloat(price).toFixed(2)}</p>
        </a>
      </div>`;
  }).join('');
}

/* ── 4. CART ── localStorage cart */
function getCart() {
  try { return JSON.parse(localStorage.getItem('jc_cart') || '[]'); } catch { return []; }
}
function saveCart(c) { localStorage.setItem('jc_cart', JSON.stringify(c)); }

function updateCartCount() {
  const count = getCart().reduce((s, i) => s + (i.qty || 1), 0);
  document.querySelectorAll('.cart-count, [data-cart-count], a[href*="/cart"] span').forEach(el => {
    el.textContent = count;
  });
}

window.JC = {
  addToCart(handle, title, price, image, size) {
    const cart = getCart();
    const key  = `${handle}__${size}`;
    const existing = cart.find(i => i.key === key);
    if (existing) { existing.qty++; }
    else { cart.push({ key, handle, title, price, image, size, qty: 1 }); }
    saveCart(cart);
    updateCartCount();
    // flash feedback
    const btn = document.querySelector('[data-add-to-cart]');
    if (btn) { btn.textContent = 'Added!'; setTimeout(() => btn.textContent = 'Add to cart', 1500); }
  },
  getCart,
  saveCart,
};

/* ── 5. CART PAGE — render items ── */
function initCartPage() {
  const container = document.querySelector('#MainContent, main');
  if (!container) return;
  const cart = getCart();

  if (!cart.length) {
    // page already shows empty state — leave it
    return;
  }

  const total = cart.reduce((s, i) => s + parseFloat(i.price) * i.qty, 0);

  container.innerHTML = `
    <div style="max-width:700px;margin:2rem auto;padding:0 1rem">
      <h1 style="font-size:1.5rem;margin-bottom:1.5rem">Your cart</h1>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:2px solid #eee">
          <th style="text-align:left;padding:8px">Item</th>
          <th>Size</th><th>Qty</th><th>Price</th><th></th>
        </tr></thead>
        <tbody>
          ${cart.map((item, idx) => `
            <tr style="border-bottom:1px solid #f0f0f0">
              <td style="padding:12px 8px;display:flex;align-items:center;gap:10px">
                <img src="${item.image}" style="width:60px;height:60px;object-fit:cover;border-radius:4px"/>
                <a href="./product.html?handle=${item.handle}" style="font-size:13px">${item.title}</a>
              </td>
              <td style="text-align:center">${item.size || '—'}</td>
              <td style="text-align:center">
                <button onclick="JC._changeQty(${idx},-1)" style="border:none;background:none;font-size:16px;cursor:pointer">−</button>
                ${item.qty}
                <button onclick="JC._changeQty(${idx},1)"  style="border:none;background:none;font-size:16px;cursor:pointer">+</button>
              </td>
              <td style="text-align:center">Rs. ${(parseFloat(item.price)*item.qty).toFixed(2)}</td>
              <td><button onclick="JC._removeItem(${idx})" style="border:none;background:none;color:#c00;cursor:pointer;font-size:18px">×</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div style="text-align:right;margin-top:1.5rem">
        <strong style="font-size:1.1rem">Total: Rs. ${total.toFixed(2)}</strong><br><br>
        <a href="https://jerseycrest.shop/cart" target="_blank"
           style="background:#111;color:#fff;padding:12px 28px;border-radius:4px;text-decoration:none;font-size:14px">
          Checkout on JerseyCrest
        </a>
      </div>
    </div>`;

  JC._changeQty = (idx, delta) => {
    const cart = getCart();
    cart[idx].qty = Math.max(1, cart[idx].qty + delta);
    saveCart(cart); initCartPage();
  };
  JC._removeItem = idx => {
    const cart = getCart();
    cart.splice(idx, 1);
    saveCart(cart); location.reload();
  };
}

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', async () => {
  updateCartCount();
  initSearch();

  const path = window.location.pathname;
  if (path.includes('search.html')) initSearchPage();
  if (path.includes('cart.html'))   initCartPage();

  // preload products quietly for fast suggestions
  loadProducts();
});
