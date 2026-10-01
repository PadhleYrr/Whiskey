/**
 * haramball-loader.js  —  v2
 *
 * FIX 1 : Replaces "haramball" / "haramball.in" in titles & descriptions
 *          with "UnrealSportsHub" / "UnrealSportsHub.in"
 *
 * FIX 2 : Product cards link to ./product.html?handle=…&store=haramball
 *          so the correct product page opens (not the hardcoded AC Milan one)
 *
 * FIX 3 : Reads data-collection on the grid element and filters products
 *          by keyword-matching against that league/category.
 *          e.g.  data-collection="premier-league"  →  only Premier League kits
 *
 * Supported data-collection values:
 *   premier-league | laliga | bundesliga | serie-a | ligue1 | new-season | international | all (default)
 */
(function () {
  'use strict';

  var HARAMBALL  = 'https://haramball.in';
  var SECTION_ID = 'haramball-products-section';
  var GRID_ID    = 'haramball-product-grid';

  /* ─── FIX 1: brand-name sanitiser ───────────────────────────────────────── */

  var BRAND_RULES = [
    [/haramball\.in/gi,  'UnrealSportsHub.in'],
    [/haramball/gi,      'UnrealSportsHub'],
  ];

  function sanitize(str) {
    if (!str) return '';
    return BRAND_RULES.reduce(function (s, rule) {
      return s.replace(rule[0], rule[1]);
    }, String(str));
  }

  /* ─── FIX 3: collection → keyword map ───────────────────────────────────── */

  var COLLECTION_KEYWORDS = {
    'premier-league': [
      'premier league', 'premier', 'epl',
      'man utd', 'man united', 'manchester united', 'manchester city',
      'arsenal', 'chelsea', 'liverpool', 'tottenham', 'spurs',
      'west ham', 'everton', 'newcastle', 'aston villa', 'brighton',
    ],
    'laliga': [
      'la liga', 'laliga', 'liga',
      'real madrid', 'barcelona', 'barca', 'atletico', 'atletico madrid',
      'sevilla', 'villarreal', 'real sociedad', 'real betis',
    ],
    'bundesliga': [
      'bundesliga', 'bundes',
      'bayern', 'dortmund', 'bvb', 'borussia',
      'leverkusen', 'rb leipzig', 'schalke', 'hoffenheim',
    ],
    'serie-a': [
      'serie a', 'serie-a', 'serie',
      'ac milan', 'milan', 'juventus', 'inter milan', 'inter',
      'roma', 'napoli', 'lazio', 'fiorentina', 'atalanta',
    ],
    'ligue1': [
      'ligue 1', 'ligue1', 'ligue',
      'psg', 'paris saint-germain', 'paris',
      'marseille', 'lyon', 'monaco', 'nice', 'rennes',
    ],
    'new-season': [
      '26/27', '25/26', '24/25',
      '2026', '2025', '2024',
      'new season', 'season kit', 'new arrivals',
    ],
    'international': [
      'world cup', 'international', 'national',
      'argentina', 'brazil', 'france', 'england', 'portugal',
      'spain', 'germany', 'italy', 'india', 'netherlands',
      'belgium', 'croatia', 'euro', 'copa',
    ],
  };

  function matchesCollection(p, colKey) {
    if (!colKey || colKey === 'all') return true;
    var kws = COLLECTION_KEYWORDS[colKey];
    if (!kws) return true;               // unknown key → show everything

    var haystack = [
      p.title        || '',
      p.product_type || '',
      Array.isArray(p.tags)
        ? p.tags.join(' ')
        : (typeof p.tags === 'string' ? p.tags : ''),
    ].join(' ').toLowerCase();

    return kws.some(function (kw) {
      return haystack.indexOf(kw.toLowerCase()) !== -1;
    });
  }

  /* ─── helpers ────────────────────────────────────────────────────────────── */

  function rs(n) {
    return '₹' + Number(n).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  function imgUrl(src, w) {
    if (!src) return '';
    var u = ('https:' + src).replace(/^https:https:/, 'https:');
    return u + (u.indexOf('?') > -1 ? '&' : '?') + 'width=' + w;
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ─── card builder ───────────────────────────────────────────────────────── */

  function buildCard(p) {
    var variants      = p.variants || [];
    var prices        = variants.map(function (v) { return parseFloat(v.price) || 0; }).filter(Boolean);
    var comparePrices = variants.map(function (v) { return parseFloat(v.compare_at_price) || 0; }).filter(Boolean);
    var anyAvailable  = variants.some(function (v) { return v.available; });

    var price   = prices.length        ? Math.min.apply(null, prices)        : 0;
    var compare = comparePrices.length ? Math.max.apply(null, comparePrices) : 0;
    var onSale  = compare > price && price > 0;
    var pct     = onSale ? Math.round((compare - price) / compare * 100) : 0;

    var img1  = p.images && p.images[0] ? p.images[0].src : '';
    var img2  = p.images && p.images[1] ? p.images[1].src : '';

    /* FIX 1 — clean brand name from title */
    var title = sanitize(p.title);

    /* FIX 2 — link to own product.html, NOT directly to haramball.in */
    var href  = './product.html?handle=' + encodeURIComponent(p.handle) + '&store=haramball';

    /* badges */
    var badgeHtml = '';
    if (onSale)        badgeHtml += '<span class="badge badge--onsale flex items-center gap-1d5 font-medium leading-none rounded-full">Save ' + pct + '%</span>';
    if (!anyAvailable) badgeHtml += '<span class="badge badge--soldout flex items-center gap-1d5 font-medium leading-none rounded-full">Sold Out</span>';

    /* price block */
    var priceHtml = onSale
      ? '<div class="price price--show-badge price--on-sale"><div class="price__sale">' +
          '<span class="price-item price-item--sale price-item--last">' + rs(price) + '</span>' +
          '<s class="price-item price-item--regular">' + rs(compare) + '</s>' +
        '</div></div>'
      : '<div class="price"><div class="price__regular">' +
          '<span class="price-item price-item--regular">' + rs(price) + '</span>' +
        '</div></div>';

    /* hover second image */
    var tplHtml = img2
      ? '<template>' +
          '<div class="media media--height w-full h-full overflow-hidden"><img src="' + esc(imgUrl(img1, 540)) + '" alt="' + esc(title) + '" loading="lazy"></div>' +
          '<div class="media media--height w-full h-full overflow-hidden"><img src="' + esc(imgUrl(img2, 540)) + '" alt="' + esc(title) + '" loading="lazy"></div>' +
        '</template>' +
        '<secondary-media class="product-card__carousel block absolute top-0 left-0 w-full h-full hidden md:block" selected-index="0"></secondary-media>'
      : '';

    return (
      '<div class="card product-card product-card--standard flex flex-col leading-none relative">' +
        '<div class="product-card__media relative h-auto">' +
          '<a class="block relative media media--square" href="' + href + '">' +
            tplHtml +
            '<img src="'    + esc(imgUrl(img1, 626)) + '"' +
               ' alt="'    + esc(title) + '"' +
               ' loading="lazy"' +
               ' srcset="' + esc(imgUrl(img1, 180)) + ' 180w, ' +
                             esc(imgUrl(img1, 360)) + ' 360w, ' +
                             esc(imgUrl(img1, 540)) + ' 540w, ' +
                             esc(imgUrl(img1, 720)) + ' 720w"' +
               ' width="626" height="626">' +
          '</a>' +
          (badgeHtml ? '<div class="badges z-2 absolute grid gap-3 pointer-events-none">' + badgeHtml + '</div>' : '') +
          '<div class="quick-add flex justify-end md:justify-center absolute w-full z-1 pointer-events-none">' +
            '<a href="' + href + '"' +
               ' class="button button--primary pointer-events-auto md:opacity-0"' +
               ' style="text-decoration:none;">Choose Options</a>' +
          '</div>' +
        '</div>' +
        '<div class="product-card__content grow flex flex-col justify-start text-center w-full">' +
          '<div class="product-card__details flex flex-col lg:flex-row items-baseline gap-2 w-full">' +
            '<div class="product-card__price">' + priceHtml + '</div>' +
            '<a class="product-card__title reversed-link text-base-xl font-medium leading-tight"' +
               ' href="' + href + '">' + esc(title) + '</a>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ─── skeleton placeholders ──────────────────────────────────────────────── */

  function buildSkeleton(n) {
    var html = '';
    for (var i = 0; i < n; i++) {
      html +=
        '<div class="card product-card product-card--standard flex flex-col leading-none relative" aria-hidden="true">' +
          '<div class="product-card__media relative h-auto">' +
            '<div class="block relative media media--square" style="background:rgba(0,0,0,.06);border-radius:4px;"></div>' +
          '</div>' +
          '<div class="product-card__content grow flex flex-col justify-start text-center w-full" style="padding:12px 8px;gap:8px;">' +
            '<div style="height:13px;background:rgba(0,0,0,.06);border-radius:4px;width:50%;margin:0 auto;"></div>' +
            '<div style="height:11px;background:rgba(0,0,0,.06);border-radius:4px;width:75%;margin:0 auto;"></div>' +
          '</div>' +
        '</div>';
    }
    return html;
  }

  /* ─── fetch (limit=250 so collection filtering has enough products) ───────── */

  function fetchPage(page) {
    return fetch(HARAMBALL + '/products.json?limit=250&page=' + page, {
      headers: { Accept: 'application/json' },
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) { return d.products || []; });
  }

  /* ─── sessionStorage cache ───────────────────────────────────────────────── */
  /*
   * After fetching all products we store them in sessionStorage keyed by handle.
   * product-loader.js reads this cache when ?store=haramball is in the URL,
   * so it never needs to make a second cross-origin request — it already has
   * the data. This is what makes the correct product open every time.
   */
  var CACHE_KEY = 'haramball_products';

  function cacheProducts(products) {
    try {
      var map = {};
      products.forEach(function (p) { map[p.handle] = p; });
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(map));
    } catch (e) { /* sessionStorage full or unavailable — silently ignore */ }
  }

  /* ─── render ─────────────────────────────────────────────────────────────── */

  function render(allProducts, grid, limit, colKey) {
    /* FIX 3 — filter by collection keyword */
    var filtered = allProducts.filter(function (p) {
      return matchesCollection(p, colKey);
    });

    if (!filtered.length) {
      var section = document.getElementById(SECTION_ID);
      if (section) section.style.display = 'none';
      return;
    }

    grid.innerHTML = filtered.slice(0, limit).map(buildCard).join('');
  }

  /* ─── init ───────────────────────────────────────────────────────────────── */

  function init() {
    var section = document.getElementById(SECTION_ID);
    if (!section) return;
    var grid = document.getElementById(GRID_ID);
    if (!grid) return;

    var limit  = parseInt(grid.dataset.limit, 10) || 8;
    var colKey = grid.dataset.collection || 'all';

    grid.innerHTML = buildSkeleton(Math.min(limit, 4));

    fetchPage(1)
      .then(function (products) {
        if (!products.length) { section.style.display = 'none'; return; }
        /* cache ALL products so product-loader.js can read them on the next page */
        cacheProducts(products);
        render(products, grid, limit, colKey);
      })
      .catch(function (err) {
        console.warn('[haramball-loader]', err);
        section.style.display = 'none';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
