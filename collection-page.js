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

  function tileHtml(c) {
    var img = c.img
      ? '<img src="' + c.img + '" alt="' + c.title + '" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover"/>'
      : '<div style="width:100%;aspect-ratio:1;background:#e0e0e0;display:flex;align-items:center;justify-content:center;font-size:13px;color:#999">' + c.title + '</div>';
    return '<a href="./collection.html?store=' + c.store + '&collection=' + encodeURIComponent(c.handle) + '"' +
      ' style="text-decoration:none;color:inherit;background:#f5f5f5;border-radius:8px;overflow:hidden;display:block">' +
      img +
      '<div style="padding:10px;text-align:center">' +
        '<p style="font-size:13px;font-weight:700;margin:0;text-transform:uppercase;line-height:1.3;overflow-wrap:anywhere;">' + c.title + '</p>' +
        '<p style="font-size:11px;margin:4px 0 0;color:#888;text-transform:uppercase;letter-spacing:.05em;overflow-wrap:anywhere;">' + STORES[c.store].label + '</p>' +
      '</div></a>';
  }

  /* the theme gives this grid 4 columns; a tile grid inside one column is squeezed.
     Use the full width instead, with its own responsive tile grid. */
  function fullWidth(g) {
    g.className = '';
    g.style.cssText = 'display:block;width:100%;';
  }

  function renderTiles(g) {
    setText(/^Products$/, 'Collections');
    fullWidth(g);
    g.innerHTML = '<p style="padding:2rem;text-align:center;color:#999">Loading…</p>';

    var lists = Object.keys(STORES).map(function (name) {
      return getJSON(STORES[name].base + '/collections.json?limit=250')
        .then(function (d) {
          return (d.collections || []).filter(function (c) { return !SKIP[c.handle]; })
            .map(function (c) { return { store: name, handle: c.handle, title: c.title }; });
        })
        .catch(function (e) { console.warn('[collections] ' + name, e); return []; });
    });

    Promise.all(lists).then(function (groups) {
      var cols = [].concat.apply([], groups);
      return Promise.all(cols.map(function (c) {
        return getJSON(STORES[c.store].base + '/collections/' + encodeURIComponent(c.handle) + '/products.json?limit=1')
          .then(function (d) {
            var p = (d.products || [])[0];
            c.count = p ? 1 : 0;
            var src = p && p.images && p.images[0] ? p.images[0].src : '';
            c.img = src.indexOf('//') === 0 ? 'https:' + src : src;
            return c;
          })
          .catch(function () { c.count = 0; return c; });
      }));
    }).then(function (cols) {
      cols = cols.filter(function (c) { return c.count > 0; });
      g.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:16px;width:100%;padding:12px 0 24px;">' +
        cols.map(tileHtml).join('') + '</div>';
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
