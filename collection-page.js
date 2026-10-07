/* collection.html — collection catalog for both stores.
   /collection.html            → tiles for every collection (jerseycrest + haramball)
   /collection.html?store=X&collection=H → that collection's products on this page
   Uses window.jcBuildCard (haramball-loader.js) so cards match the jerseycrest card. */
(function () {
  var STORES = {
    jerseycrest: { base: 'https://jerseycrest.shop', label: 'Jerseycrest' },
    haramball:   { base: 'https://haramball.in',     label: 'Haramball' }
  };
  var SKIP = { 'frontpage': 1, 'all-products': 1, 'all': 1 };

  var params = new URLSearchParams(window.location.search);
  var col    = params.get('collection');
  var store  = STORES[params.get('store')] ? params.get('store') : 'jerseycrest';

  function getJSON(url) {
    return fetch(url, { headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function grid() {
    return document.querySelector('#ProductGridContainer motion-list') || document.querySelector('#ProductGridContainer');
  }

  function setText(match, text) {
    /* replace the text of leaf elements whose text matches (heading, breadcrumb, count) */
    document.querySelectorAll('*').forEach(function (el) {
      if (el.children.length === 0 && match.test(el.textContent.trim())) el.textContent = text;
    });
  }

  function titleFromHandle(h) {
    return h.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  /* Homepage "Shop by category" banner images (copied from index.html), keyed by collection handle.
     These are the store's own collection banners, not product photos. */
  var BANNERS = {
    'la-liga-2026':         '//jerseycrest.shop/cdn/shop/files/images.jpg?v=1784756657',
    'premier-league-26-27': '//jerseycrest.shop/cdn/shop/files/ChatGPT_Image_May_28_2026_05_45_13_AM.webp?v=1780482492',
    'retro-jerseys':        '//jerseycrest.shop/cdn/shop/files/WhatsApp_Image_2026-05-27_at_4.42.27_AM.webp?v=1780482492',
    'full-sleeves-jerseys': '//jerseycrest.shop/cdn/shop/files/Iconic_Classic_Greatness___Inspired_by_the_LFC_classic_Candy_home_shirt_worn_when_Liverpool__jpg.webp?v=1780482492'
  };
  /* homepage order first */
  var FIRST = ['la-liga-2026', 'premier-league-26-27', 'retro-jerseys', 'full-sleeves-jerseys'];

  function absUrl(u) {
    if (!u) return '';
    return u.indexOf('//') === 0 ? 'https:' + u : u;
  }
  function sized(u, w) {
    u = absUrl(u);
    if (!u) return '';
    if (u.indexOf('cdn.shopify.com') === -1 && u.indexOf('/cdn/shop/') === -1) return u;
    return u + (u.indexOf('?') === -1 ? '?' : '&') + 'width=' + w;
  }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  /* same look as the homepage media-card tiles: portrait banner, centred uppercase title, count */
  function injectTileStyles() {
    if (document.getElementById('cp-tile-styles')) return;
    var st = document.createElement('style');
    st.id = 'cp-tile-styles';
    st.textContent =
      '.cp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:100%;padding:12px 0 24px}' +
      '@media(min-width:768px){.cp-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}}' +
      '@media(min-width:1100px){.cp-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}' +
      '.cp-card{display:block;background:#f5f5f5;overflow:hidden;text-decoration:none;color:inherit}' +
      '.cp-card .cp-media{position:relative;overflow:hidden;aspect-ratio:4/5;background:#e8e8e8}' +
      '.cp-card .cp-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s}' +
      '.cp-card:hover .cp-media img{transform:scale(1.04)}' +
      '.cp-card .cp-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:13px;color:#999;text-align:center;padding:8px}' +
      '.cp-card .cp-content{padding:8px 4px;text-align:center}' +
      '.cp-card .cp-title{font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;font-weight:700;line-height:1.3;overflow-wrap:anywhere}' +
      '.cp-card .cp-count{font-size:.65rem;font-weight:500;vertical-align:super;margin-left:3px}' +
      '.cp-card .cp-store{display:block;font-size:.6rem;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-top:2px}';
    document.head.appendChild(st);
  }

  function tileHtml(c) {
    var src = sized(c.img, 720);
    var media = src
      ? '<img src="' + esc(src) + '" alt="' + esc(c.title) + '" loading="lazy"/>'
      : '<div class="cp-ph">' + esc(c.title) + '</div>';
    return '<a class="cp-card" href="./collection.html?store=' + c.store + '&collection=' + encodeURIComponent(c.handle) + '" aria-label="' + esc(c.title) + '">' +
      '<div class="cp-media">' + media + '</div>' +
      '<div class="cp-content"><span class="cp-title">' + esc(c.title) +
        (c.count ? '<small class="cp-count">' + c.count + '</small>' : '') + '</span>' +
        (c.store !== 'jerseycrest' ? '<span class="cp-store">' + STORES[c.store].label + '</span>' : '') +
      '</div></a>';
  }

  /* the theme gives this grid 4 columns; use the full width with our own 2-column (mobile) tile grid */
  function fullWidth(g) {
    g.className = '';
    g.style.cssText = 'display:block;width:100%;';
  }

  function renderTiles(g) {
    setText(/^Products$/, 'Collections');
    injectTileStyles();
    fullWidth(g);
    g.innerHTML = '<p style="padding:2rem;text-align:center;color:#999">Loading…</p>';

    var lists = Object.keys(STORES).map(function (name) {
      return getJSON(STORES[name].base + '/collections.json?limit=250')
        .then(function (d) {
          return (d.collections || []).filter(function (c) { return !SKIP[c.handle]; })
            .map(function (c) {
              /* the collection's own banner image first; homepage banner map overrides for the 4 featured ones */
              var own = c.image && c.image.src ? c.image.src : '';
              var img = (name === 'jerseycrest' && BANNERS[c.handle]) || own;
              return { store: name, handle: c.handle, title: c.title, img: absUrl(img) };
            });
        })
        .catch(function (e) { console.warn('[collections] ' + name, e); return []; });
    });

    Promise.all(lists).then(function (groups) {
      var cols = [].concat.apply([], groups);
      return Promise.all(cols.map(function (c) {
        return getJSON(STORES[c.store].base + '/collections/' + encodeURIComponent(c.handle) + '/products.json?limit=250')
          .then(function (d) {
            var ps = d.products || [];
            c.count = ps.length;
            /* only fall back to a product photo when the collection has no banner of its own */
            if (!c.img && ps[0] && ps[0].images && ps[0].images[0]) c.img = absUrl(ps[0].images[0].src);
            return c;
          })
          .catch(function () { c.count = 0; return c; });
      }));
    }).then(function (cols) {
      cols = cols.filter(function (c) { return c.count > 0; });
      cols.sort(function (a, b) {
        var ia = a.store === 'jerseycrest' ? FIRST.indexOf(a.handle) : -1;
        var ib = b.store === 'jerseycrest' ? FIRST.indexOf(b.handle) : -1;
        if (ia === -1) ia = 99; if (ib === -1) ib = 99;
        if (a.store !== b.store && ia === ib) return a.store === 'jerseycrest' ? -1 : 1;
        return ia - ib;
      });
      g.innerHTML = '<div class="cp-grid">' + cols.map(tileHtml).join('') + '</div>';
      setText(/^\d+ products$/, '');
    });
  }

  function renderCollection(g) {
    var s = STORES[store];
    var title = titleFromHandle(col);
    setText(/^Products$/, title);
    g.className = 'card-grid card-grid--4 mobile:card-grid--2 grid relative';
    g.style.cssText = '';
    g.innerHTML = '<p style="padding:2rem;text-align:center;color:#999">Loading…</p>';

    getJSON(s.base + '/collections/' + encodeURIComponent(col) + '/products.json?limit=250')
      .then(function (d) {
        var products = d.products || [];
        g.innerHTML = products.map(function (p) { return window.jcBuildCard(p, store); }).join('');
        setText(/^\d+ products$/, products.length + ' products');
      })
      .catch(function (e) {
        console.warn('[collection] could not load', e);
        g.innerHTML = '<p style="padding:2rem;text-align:center;color:#999">Could not load this collection.</p>';
      });
  }

  function run() {
    var g = grid();
    if (!g) return;
    var pag = document.querySelector('#ProductGridContainer .pagination');
    if (pag) pag.remove();
    if (col) renderCollection(g); else renderTiles(g);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
