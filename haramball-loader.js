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

  /* same price format the jerseycrest storefront uses: "Rs. 1,299.00" */
  function rs(n) {
    return 'Rs. ' + Number(n).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  /* Card = the exact jerseycrest product-card markup (captured from the storefront
     collection page), with this product's image, title, link, price and badge filled in. */
  var CARD_TEMPLATE = "<div class=\"card product-card product-card--standard flex flex-col leading-none relative\"><div class=\"product-card__media relative h-auto\">\n          {{BADGES}}\n{{MEDIA}}<div class=\"quick-add flex justify-end md:justify-center absolute w-full z-1 pointer-events-none\"><a href=\"{{HREF}}\" class=\"button button--primary pointer-events-auto md:opacity-0\" style=\"text-decoration:none\">\n                    <span class=\"btn-fill\" data-fill></span>\n                    <span class=\"btn-text\"><svg class=\"icon icon-cart icon-sm md:hidden\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" role=\"presentation\">\n          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M1 1h.5v0c.226 0 .339 0 .44.007a3 3 0 0 1 2.62 1.976c.034.095.065.204.127.42l.17.597m0 0 1.817 6.358c.475 1.664.713 2.496 1.198 3.114a4 4 0 0 0 1.633 1.231c.727.297 1.592.297 3.322.297h2.285c1.75 0 2.626 0 3.359-.302a4 4 0 0 0 1.64-1.253c.484-.627.715-1.472 1.175-3.161l.06-.221c.563-2.061.844-3.092.605-3.906a3 3 0 0 0-1.308-1.713C19.92 4 18.853 4 16.716 4H4.857ZM12 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z\"></path>\n        </svg><span class=\"hidden md:block\">Choose options</span>\n                    </span>\n                  </a></div></div><div class=\"product-card__content grow flex flex-col justify-start text-center w-full\"><div class=\"product-card__details flex flex-col lg:flex-row items-baseline gap-2 w-full\">\n        <p class=\"grow\">\n          {{TITLE_LINK}}\n        </p>\n        \n        {{PRICEWRAP}}</div>\n      </div></div></div>";
  
  function mediaHtml(href, img1, img2, title) {
    var m = '<a class="block relative media media--square" href="' + href + '" aria-hidden="true" tabindex="-1">';
    if (img2) {
      m += '<template>' +
        '<div class="media media--height w-full h-full overflow-hidden"><img src="' + esc(imgUrl(img1, 626)) + '" alt="' + esc(title) + '" width="626" height="939" loading="lazy" is="lazy-image"></div>' +
        '<div class="media media--height w-full h-full overflow-hidden"><img src="' + esc(imgUrl(img2, 626)) + '" alt="' + esc(title) + '" width="626" height="939" loading="lazy" is="lazy-image"></div>' +
        '</template>' +
        '<secondary-media class="product-card__carousel block absolute top-0 left-0 w-full h-full hidden md:block" selected-index="0"></secondary-media>';
    }
    m += '<img src="' + esc(imgUrl(img1, 626)) + '" alt="' + esc(title) + '" srcset="' +
      esc(imgUrl(img1, 180)) + ' 180w, ' + esc(imgUrl(img1, 360)) + ' 360w, ' + esc(imgUrl(img1, 540)) + ' 540w" ' +
      'width="626" height="939" loading="eager">';
    return m + '</a>';
  }

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
    var title = sanitize(p.title).replace(/\s*\|\s*UnrealSports\w*(\.\w+)?\s*$/i, '').trim();
    var href  = './product.html?handle=' + encodeURIComponent(p.handle) + '&store=haramball';

    var badges = '';
    if (onSale) {
      badges = '<div class="badges z-2 absolute grid gap-3 pointer-events-none"><span class="badge badge--onsale flex items-center gap-1d5 font-medium leading-none rounded-full">Save ' + pct + '%</span></div>';
    } else if (!anyAvailable) {
      badges = '<div class="badges z-2 absolute grid gap-3 pointer-events-none"><span class="badge badge--soldout flex items-center gap-1d5 font-medium leading-none rounded-full">Sold out</span></div>';
    }

    var priceHtml = onSale
      ? '<div class="price price--on-sale flex flex-wrap lg:flex-col lg:items-end gap-2 md:gap-1d5"\n><span class="sr-only">Sale price</span><span class="price__regular whitespace-nowrap">' + rs(price) + '</span><span class="sr-only">Regular price</span>\n    <span class="price__sale inline-flex items-center h-auto relative">' + rs(compare) + '</span></div>'
      : '<div class="price flex flex-wrap lg:flex-col lg:items-end gap-2 md:gap-1d5"\n><span class="price__regular whitespace-nowrap">' + rs(price) + '</span></div>';

    var titleLink = '<a class="product-card__title reversed-link text-base-xl font-medium leading-tight" href="' + href + '">' + esc(title) + '</a>';

    return CARD_TEMPLATE
      .split('{{BADGES}}').join(badges)
      .split('{{MEDIA}}').join(mediaHtml(href, img1, img2, title))
      .split('{{PRICEWRAP}}').join('<div class="flex flex-col gap-2">' + priceHtml + '</div>')
      .split('{{TITLE_LINK}}').join(titleLink)
      .split('{{HREF}}').join(href);
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

  /* all-products page: jerseycrest grid on the left, haramball on the right, 50/50 */
  function splitBesideCollection(section) {
    var host = document.getElementById('ProductGridContainer');
    if (!host || !section || !host.parentNode) return;
    if (!document.getElementById('jc-split-style')) {
      var st = document.createElement('style');
      st.id = 'jc-split-style';
      st.textContent =
        '.jc-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;align-items:start;width:100%;}' +
        '.jc-split__col{min-width:0;}' +
        '.jc-split .card-grid--4{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}' +
        '.jc-split__section{padding-top:0 !important;padding-bottom:0 !important;}' +
        '.jc-split__section .page-width{padding-left:0 !important;padding-right:0 !important;max-width:none !important;}' +
        '@media (max-width:767px){' +
          '.jc-split{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;}' +
          '.jc-split .card-grid--4{grid-template-columns:minmax(0,1fr) !important;}' +
        '}';
      document.head.appendChild(st);
    }
    var row = document.createElement('div');
    row.className = 'jc-split';
    var left = document.createElement('div');
    var right = document.createElement('div');
    left.className = 'jc-split__col';
    right.className = 'jc-split__col';
    host.parentNode.insertBefore(row, host);
    row.appendChild(left);
    row.appendChild(right);
    left.appendChild(host);
    section.classList.add('jc-split__section');
    right.appendChild(section);
  }

  /* all pages of the catalog (250 per page), so a 200+ product store is complete */
  function fetchAll() {
    var all = [];
    function next(page) {
      return fetchPage(page).then(function (batch) {
        all = all.concat(batch);
        if (batch.length === 250 && page < 10) return next(page + 1);
        return all;
      });
    }
    return next(1);
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

    /* show the first batch, then reveal more on each click until everything is shown */
    var showAll = grid.dataset.show === 'all';
    var step  = showAll ? filtered.length : Math.max(limit, 12);
    var shown = 0;
    grid.innerHTML = '';

    var btn = document.getElementById(GRID_ID + '-more');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = GRID_ID + '-more';
      btn.className = 'button button--secondary';
      btn.style.cssText = 'display:block;margin:32px auto 0;';
      grid.parentNode.insertBefore(btn, grid.nextSibling);
    }

    function showMore() {
      var next = filtered.slice(shown, shown + step);
      shown += next.length;
      grid.insertAdjacentHTML('beforeend', next.map(buildCard).join(''));
      var left = filtered.length - shown;
      btn.style.display = left > 0 ? '' : 'none';
      btn.textContent = 'Show more (' + left + ' left)';
    }
    btn.onclick = showMore;
    showMore();
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

    if (grid.dataset.split === '1') {
      splitBesideCollection(section);
    }

    fetchAll()
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
