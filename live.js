const SHOPIFY_BASE = 'https://jerseycrest.shop';
const MARGIN = 1.30;
const POLL_MS = 30000;

function price(p) {
  return Math.round(parseFloat(p) * MARGIN * 100) / 100;
}

async function api(url) {
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function inr(n) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function normalizeProduct(p) {
  const variants = (p.variants || []).map(v => ({
    id: v.id,
    title: v.title,
    original: parseFloat(v.price),
    yours: price(v.price),
    compare: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
    in_stock: v.available,
    option1: v.option1,
    option2: v.option2,
    option3: v.option3,
    sku: v.sku || '',
  }));
  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    type: p.product_type || '',
    vendor: p.vendor || '',
    tags: p.tags || [],
    description: p.body_html || '',
    url: `${SHOPIFY_BASE}/products/${p.handle}`,
    cover: p.images?.[0]?.src || '',
    images: (p.images || []).map(i => ({ src: i.src, alt: i.alt || p.title })),
    variants,
    in_stock: variants.some(v => v.in_stock),
    min_price: Math.min(...variants.map(v => v.original)),
    min_yours: Math.min(...variants.map(v => v.yours)),
    updated_at: p.updated_at || '',
  };
}

function normalizeCollection(c) {
  return {
    id: c.id,
    title: c.title,
    handle: c.handle,
    image: c.image?.src || null,
    url: `${SHOPIFY_BASE}/collections/${c.handle}`,
  };
}

async function fetchAllProducts() {
  const all = [];
  let page = 1;
  while (true) {
    const data = await api(`${SHOPIFY_BASE}/products.json?limit=250&page=${page}`);
    const batch = data.products || [];
    if (!batch.length) break;
    batch.forEach(p => all.push(normalizeProduct(p)));
    if (batch.length < 250) break;
    page++;
  }
  return all;
}

async function fetchAllCollections() {
  const all = [];
  let page = 1;
  while (true) {
    const data = await api(`${SHOPIFY_BASE}/collections.json?limit=250&page=${page}`);
    const batch = data.collections || [];
    if (!batch.length) break;
    batch.forEach(c => all.push(normalizeCollection(c)));
    if (batch.length < 250) break;
    page++;
  }
  return all;
}

async function fetchCollectionProducts(handle) {
  const all = [];
  let page = 1;
  while (true) {
    const data = await api(`${SHOPIFY_BASE}/collections/${handle}/products.json?limit=250&page=${page}`);
    const batch = data.products || [];
    if (!batch.length) break;
    batch.forEach(p => all.push(normalizeProduct(p)));
    if (batch.length < 250) break;
    page++;
  }
  return all;
}

const Store = {
  products: [],
  collections: [],
  byHandle: {},
  listeners: {},

  on(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  },

  emit(event, data) {
    (this.listeners[event] || []).forEach(fn => fn(data));
  },

  set(products, collections) {
    const prevIds = new Set(this.products.map(p => p.id));
    this.products = products;
    this.collections = collections;
    this.byHandle = {};
    products.forEach(p => this.byHandle[p.handle] = p);
    const newOnes = products.filter(p => !prevIds.has(p.id));
    if (newOnes.length && prevIds.size > 0) {
      this.emit('new_products', newOnes);
    }
    this.emit('updated', { products, collections });
  },

  filter({ collection, inStock, maxPrice, minPrice, sort } = {}) {
    let result = collection
      ? this.products.filter(p => p.tags.includes(collection) || p.type === collection)
      : [...this.products];
    if (inStock) result = result.filter(p => p.in_stock);
    if (minPrice) result = result.filter(p => p.min_yours >= minPrice);
    if (maxPrice) result = result.filter(p => p.min_yours <= maxPrice);
    if (sort === 'price_asc') result.sort((a, b) => a.min_yours - b.min_yours);
    if (sort === 'price_desc') result.sort((a, b) => b.min_yours - a.min_yours);
    if (sort === 'newest') result.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    if (sort === 'title') result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  },

  search(query) {
    const q = query.toLowerCase();
    return this.products.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      p.type.toLowerCase().includes(q)
    );
  }
};

const Renderer = {
  productCard(p) {
    const badge = !p.in_stock
      ? '<span class="jc-badge sold-out">Sold Out</span>'
      : p.variants.some(v => v.compare && v.compare > v.original)
        ? '<span class="jc-badge sale">Sale</span>'
        : '';
    return `
      <div class="jc-product-card" data-handle="${p.handle}" onclick="JC.openProduct('${p.handle}')">
        <div class="jc-img-wrap">
          <img src="${p.cover}" alt="${p.title}" loading="lazy"/>
          ${badge}
        </div>
        <div class="jc-card-info">
          <p class="jc-card-title">${p.title}</p>
          <p class="jc-card-price">${inr(p.min_yours)}</p>
        </div>
      </div>`;
  },

  grid(products, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = products.length
      ? products.map(p => this.productCard(p)).join('')
      : '<p class="jc-no-results">No products found.</p>';
  },

  modal(p) {
    const existing = document.getElementById('jc-modal');
    if (existing) existing.remove();
    const sizes = [...new Set(p.variants.map(v => v.option1).filter(Boolean))];
    const el = document.createElement('div');
    el.id = 'jc-modal';
    el.innerHTML = `
      <div class="jc-overlay" onclick="JC.closeModal()"></div>
      <div class="jc-modal-box">
        <button class="jc-close" onclick="JC.closeModal()">✕</button>
        <div class="jc-modal-inner">
          <div class="jc-modal-imgs">
            <img id="jc-main-img" src="${p.cover}" alt="${p.title}"/>
            <div class="jc-thumbs">
              ${p.images.slice(0,5).map((img,i) =>
                `<img src="${img.src}" class="jc-thumb ${i===0?'active':''}"
                  onclick="document.getElementById('jc-main-img').src='${img.src}';
                  document.querySelectorAll('.jc-thumb').forEach(t=>t.classList.remove('active'));
                  this.classList.add('active')"/>`
              ).join('')}
            </div>
          </div>
          <div class="jc-modal-info">
            <h2>${p.title}</h2>
            <p class="jc-modal-price">${inr(p.min_yours)}</p>
            ${sizes.length ? `
              <p class="jc-size-label">Size</p>
              <div class="jc-size-btns">
                ${sizes.map(s =>
                  `<button class="jc-size-btn" onclick="JC.selectSize(this,'${p.handle}','${s}')">${s}</button>`
                ).join('')}
              </div>` : ''}
            <button class="jc-atc" onclick="JC.addToCart('${p.handle}')">Add to Cart</button>
            <div class="jc-desc">${p.description}</div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el);
    document.body.style.overflow = 'hidden';
  },

  collections(collections, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = collections.map(c => `
      <div class="jc-col-card" onclick="JC.loadCollection('${c.handle}')">
        ${c.image ? `<img src="${c.image}" alt="${c.title}" loading="lazy"/>` : ''}
        <p>${c.title}</p>
      </div>`).join('');
  }
};

const Cart = {
  items: JSON.parse(localStorage.getItem('jc_cart') || '[]'),

  save() {
    localStorage.setItem('jc_cart', JSON.stringify(this.items));
    this.badge();
    Store.emit('cart_updated', this.items);
  },

  add(product, variantId) {
    const variant = product.variants.find(v => v.id === variantId) || product.variants[0];
    const existing = this.items.find(i => i.variant_id === variant.id);
    if (existing) existing.qty++;
    else this.items.push({
      variant_id: variant.id,
      product_id: product.id,
      handle: product.handle,
      title: product.title,
      variant_title: variant.title,
      price: variant.yours,
      image: product.cover,
      qty: 1,
    });
    this.save();
    JC.toast(`${product.title} added to cart`);
  },

  remove(variantId) {
    this.items = this.items.filter(i => i.variant_id !== variantId);
    this.save();
  },

  total() {
    return this.items.reduce((s, i) => s + i.price * i.qty, 0);
  },

  badge() {
    const el = document.getElementById('jc-cart-badge');
    if (el) el.textContent = this.items.reduce((s, i) => s + i.qty, 0);
  }
};

const Poller = {
  timer: null,
  async sync() {
    try {
      const [products, collections] = await Promise.all([
        fetchAllProducts(),
        fetchAllCollections(),
      ]);
      Store.set(products, collections);
      console.log(`[JC] ${products.length} products synced`);
    } catch(e) {
      console.warn('[JC] sync error:', e.message);
    }
  },
  start() {
    this.sync();
    this.timer = setInterval(() => this.sync(), POLL_MS);
  }
};

const style = document.createElement('style');
style.textContent = `
  .jc-overlay { position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9998; }
  .jc-modal-box {
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    background:#fff;border-radius:12px;z-index:9999;
    width:min(92vw,900px);max-height:90vh;overflow-y:auto;padding:24px;
  }
  .jc-close { position:absolute;top:12px;right:16px;background:none;border:none;font-size:20px;cursor:pointer; }
  .jc-modal-inner { display:flex;gap:24px;flex-wrap:wrap; }
  .jc-modal-imgs { flex:1;min-width:260px; }
  .jc-modal-imgs #jc-main-img { width:100%;border-radius:8px;object-fit:cover; }
  .jc-thumbs { display:flex;gap:6px;margin-top:8px;flex-wrap:wrap; }
  .jc-thumb { width:58px;height:58px;object-fit:cover;border-radius:4px;cursor:pointer;border:2px solid transparent; }
  .jc-thumb.active,.jc-thumb:hover { border-color:#111; }
  .jc-modal-info { flex:1;min-width:240px; }
  .jc-modal-info h2 { font-size:20px;margin-bottom:8px; }
  .jc-modal-price { font-size:22px;font-weight:700;margin-bottom:16px; }
  .jc-size-label { font-weight:600;margin-bottom:6px; }
  .jc-size-btns { display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px; }
  .jc-size-btn { padding:6px 14px;border:1px solid #ccc;border-radius:4px;cursor:pointer;background:#fff;transition:all .2s; }
  .jc-size-btn.active,.jc-size-btn:hover { background:#111;color:#fff;border-color:#111; }
  .jc-atc { width:100%;padding:14px;background:#111;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;margin-bottom:16px; }
  .jc-atc:hover { opacity:.85; }
  .jc-desc { font-size:13px;color:#555;line-height:1.6; }
  .jc-badge { position:absolute;top:8px;left:8px;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase; }
  .jc-badge.sale { background:#e00;color:#fff; }
  .jc-badge.sold-out { background:#888;color:#fff; }
  .jc-no-results { text-align:center;padding:40px;color:#888; }
  .jc-toast { position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(20px);background:#111;color:#fff;padding:12px 24px;border-radius:8px;opacity:0;transition:all .3s;z-index:99999;font-size:14px;white-space:nowrap; }
  .jc-toast.show { opacity:1;transform:translateX(-50%) translateY(0); }
`;
document.head.appendChild(style);

window.JC = {
  store: Store,
  cart: Cart,
  _sel: {},

  init() {
    Poller.start();
    Cart.badge();
    Store.on('new_products', p => this.toast(`${p.length} new product(s) just added!`));
  },

  openProduct(handle) {
    const p = Store.byHandle[handle];
    if (p) Renderer.modal(p);
  },

  closeModal() {
    const m = document.getElementById('jc-modal');
    if (m) m.remove();
    document.body.style.overflow = '';
  },

  selectSize(btn, handle, size) {
    document.querySelectorAll('.jc-size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const p = Store.byHandle[handle];
    const v = p?.variants.find(v => v.option1 === size);
    if (v) this._sel[handle] = v.id;
  },

  addToCart(handle) {
    const p = Store.byHandle[handle];
    if (!p) return;
    Cart.add(p, this._sel[handle] || p.variants[0]?.id);
  },

  async loadCollection(handle) {
    const products = await fetchCollectionProducts(handle);
    Renderer.grid(products, 'jc-product-grid');
  },

  renderGrid(containerId, opts = {}) {
    Store.on('updated', () => Renderer.grid(Store.filter(opts), containerId));
  },

  renderCollections(containerId) {
    Store.on('updated', ({ collections }) => Renderer.collections(collections, containerId));
  },

  search(q) { return Store.search(q); },

  toast(msg) {
    const t = document.createElement('div');
    t.className = 'jc-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
  },

  on: (e, fn) => Store.on(e, fn),
};

document.addEventListener('DOMContentLoaded', () => JC.init());

// ── PRODUCT LINK → product.html ───────────────────────────
document.addEventListener('click', function(e) {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const path = new URL(a.href, location.href).pathname;
  const match = path.match(/\/products\/([^/?#]+)/);
  if (match) {
    e.preventDefault();
    e.stopImmediatePropagation();
    window.location.href = `./product.html?handle=${match[1]}`;
  }
}, true);
