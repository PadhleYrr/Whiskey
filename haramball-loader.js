/**
 * haramball-loader.js
 * Fetches live products from haramball.in (Shopify) and renders them
 * using the same product-card HTML & CSS classes as this site.
 *
 * Usage: drop the snippet below on any page where you want the section:
 *
 *   <div id="haramball-products-section" class="section section--padding">
 *     <div class="page-width relative">
 *       <div class="title-wrapper leading-none gap-4 lg:gap-8 flex flex-col
 *                   text-left md:items-end md:flex-row md:justify-between relative z-1">
 *         <div class="grid gap-4">
 *           <h2 class="heading title-md">Shop Haramball</h2>
 *         </div>
 *         <a href="https://haramball.in/collections/all" target="_blank"
 *            rel="noopener" class="button button--secondary">View All</a>
 *       </div>
 *       <div style="margin-top:24px">
 *         <motion-list id="haramball-product-grid"
 *                      class="product-grid card-grid card-grid--4 mobile:card-grid--1 grid"
 *                      data-limit="8">
 *         </motion-list>
 *       </div>
 *     </div>
 *   </div>
 *   <script src="./haramball-loader.js" defer></script>
 */

(function () {
  'use strict';

  var HARAMBALL   = 'https://haramball.in';
  var SECTION_ID  = 'haramball-products-section';
  var GRID_ID     = 'haramball-product-grid';

  /* ── helpers ──────────────────────────────────────────────────────────── */

  /** Format a number as ₹ with Indian locale (no decimals). */
  function rs(n) {
    return '₹' + Number(n).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  /**
   * Append Shopify CDN width param to an image URL.
   * Handles both http: and protocol-relative //cdn... URLs.
   */
  function imgUrl(src, w) {
    if (!src) return '';
    var u = ('https:' + src).replace(/^https:https:/, 'https:');
    return u + (u.indexOf('?') > -1 ? '&' : '?') + 'width=' + w;
  }

  /** Escape a string for safe use inside an HTML attribute. */
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ── card builder ────────────────────────────────────────────────────── */

  function buildCard(p) {
    var variants     = p.variants || [];
    var prices       = variants.map(function (v) { return parseFloat(v.price) || 0; }).filter(Boolean);
    var comparePrices= variants.map(function (v) { return parseFloat(v.compare_at_price) || 0; }).filter(Boolean);
    var anyAvailable = variants.some(function (v) { return v.available; });

    var price   = prices.length       ? Math.min.apply(null, prices)       : 0;
    var compare = comparePrices.length ? Math.max.apply(null, comparePrices): 0;
    var onSale  = compare > price && price > 0;
    var pct     = onSale ? Math.round((compare - price) / compare * 100)   : 0;

    var img1 = p.images && p.images[0] ? p.images[0].src : '';
    var img2 = p.images && p.images[1] ? p.images[1].src : '';
    var href = HARAMBALL + '/products/' + esc(p.handle);

    /* badges */
    var badgeHtml = '';
    if (onSale)       badgeHtml += '<span class="badge badge--onsale flex items-center gap-1d5 font-medium leading-none rounded-full">Save ' + pct + '%</span>';
    if (!anyAvailable) badgeHtml += '<span class="badge badge--soldout flex items-center gap-1d5 font-medium leading-none rounded-full">Sold Out</span>';

    /* price block */
    var priceHtml = onSale
      ? '<div class="price price--show-badge price--on-sale">' +
          '<div class="price__sale">' +
            '<span class="price-item price-item--sale price-item--last">' + rs(price) + '</span>' +
            '<s class="price-item price-item--regular">' + rs(compare) + '</s>' +
          '</div></div>'
      : '<div class="price">' +
          '<div class="price__regular">' +
            '<span class="price-item price-item--regular">' + rs(price) + '</span>' +
          '</div></div>';

    /* hover second image (theme's secondary-media web-component) */
    var tplHtml = img2
      ? '<template>' +
          '<div class="media media--height w-full h-full overflow-hidden">' +
            '<img src="' + esc(imgUrl(img1, 540)) + '" alt="' + esc(p.title) + '" loading="lazy">' +
          '</div>' +
          '<div class="media media--height w-full h-full overflow-hidden">' +
            '<img src="' + esc(imgUrl(img2, 540)) + '" alt="' + esc(p.title) + '" loading="lazy">' +
          '</div>' +
        '</template>' +
        '<secondary-media class="product-card__carousel block absolute top-0 left-0 w-full h-full hidden md:block" selected-index="0"></secondary-media>'
      : '';

    return (
      '<div class="card product-card product-card--standard flex flex-col leading-none relative">' +

        /* ── media ── */
        '<div class="product-card__media relative h-auto">' +
          '<a class="block relative media media--square"' +
             ' href="' + href + '" target="_blank" rel="noopener noreferrer">' +
            tplHtml +
            '<img' +
              ' src="'    + esc(imgUrl(img1, 626))  + '"' +
              ' alt="'    + esc(p.title)             + '"' +
              ' loading="lazy"' +
              ' srcset="' + esc(imgUrl(img1, 180))  + ' 180w, ' +
                            esc(imgUrl(img1, 360))  + ' 360w, ' +
                            esc(imgUrl(img1, 540))  + ' 540w, ' +
                            esc(imgUrl(img1, 720))  + ' 720w"' +
              ' width="626" height="626">' +
          '</a>' +

          /* badges */
          (badgeHtml
            ? '<div class="badges z-2 absolute grid gap-3 pointer-events-none">' + badgeHtml + '</div>'
            : '') +

          /* quick-add → "Shop Now" (external link) */
          '<div class="quick-add flex justify-end md:justify-center absolute w-full z-1 pointer-events-none">' +
            '<a href="' + href + '" target="_blank" rel="noopener noreferrer"' +
               ' class="button button--primary pointer-events-auto md:opacity-0"' +
               ' style="text-decoration:none;">' +
              'Shop on Haramball' +
            '</a>' +
          '</div>' +
        '</div>' +

        /* ── content ── */
        '<div class="product-card__content grow flex flex-col justify-start text-center w-full">' +
          '<div class="product-card__details flex flex-col lg:flex-row items-baseline gap-2 w-full">' +
            '<div class="product-card__price">' + priceHtml + '</div>' +
            '<a class="product-card__title reversed-link text-base-xl font-medium leading-tight"' +
               ' href="' + href + '" target="_blank" rel="noopener noreferrer">' +
              esc(p.title) +
            '</a>' +
          '</div>' +
        '</div>' +

      '</div>'
    );
  }

  /* ── skeleton (loading placeholders) ────────────────────────────────── */

  function buildSkeleton(count) {
    var html = '';
    for (var i = 0; i < count; i++) {
      html +=
        '<div class="card product-card product-card--standard flex flex-col leading-none relative" aria-hidden="true">' +
          '<div class="product-card__media relative h-auto">' +
            '<div class="block relative media media--square"' +
                 ' style="background:rgba(0,0,0,.06);border-radius:4px;"></div>' +
          '</div>' +
          '<div class="product-card__content grow flex flex-col justify-start text-center w-full"' +
               ' style="padding:12px 8px;gap:8px;">' +
            '<div style="height:13px;background:rgba(0,0,0,.06);border-radius:4px;width:50%;margin:0 auto;"></div>' +
            '<div style="height:11px;background:rgba(0,0,0,.06);border-radius:4px;width:75%;margin:0 auto;"></div>' +
          '</div>' +
        '</div>';
    }
    return html;
  }

  /* ── fetch from Shopify storefront API ───────────────────────────────── */

  /**
   * Fetch one page of products from haramball.in.
   * Shopify storefronts allow cross-origin requests to /products.json.
   */
  function fetchPage(page) {
    return fetch(HARAMBALL + '/products.json?limit=24&page=' + page, {
      headers: { Accept: 'application/json' }
    })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (d) { return d.products || []; });
  }

  /* ── render ──────────────────────────────────────────────────────────── */

  function render(products, grid, limit) {
    var shown = products.slice(0, limit);
    grid.innerHTML = shown.map(buildCard).join('');
  }

  /* ── init ────────────────────────────────────────────────────────────── */

  function init() {
    var section = document.getElementById(SECTION_ID);
    if (!section) return;                          // section not on this page

    var grid = document.getElementById(GRID_ID);
    if (!grid) return;

    var limit = parseInt(grid.dataset.limit, 10) || 8;

    /* show loading skeletons while fetching */
    grid.innerHTML = buildSkeleton(Math.min(limit, 4));

    fetchPage(1)
      .then(function (products) {
        if (!products.length) {
          section.style.display = 'none';
          return;
        }

        /* need more products than page 1 provided? fetch page 2 too */
        if (products.length < limit && products.length === 24) {
          return fetchPage(2).then(function (page2) {
            render(products.concat(page2), grid, limit);
          });
        }

        render(products, grid, limit);
      })
      .catch(function (err) {
        console.warn('[haramball-loader] Could not load products:', err);
        section.style.display = 'none';
      });
  }

  /* run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
