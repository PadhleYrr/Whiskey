(function () {
  /* ── store selection: supports ?store=haramball for Haramball.in products ── */
  var _params      = new URLSearchParams(window.location.search);
  var _storeParam  = _params.get('store');
  var IS_HARAMBALL = _storeParam === 'haramball';
  const STORE      = IS_HARAMBALL ? 'https://haramball.in' : 'https://jerseycrest.shop';

  /* FIX 1 — sanitise haramball brand names out of titles / descriptions */
  var _BRAND_RULES = [
    [/haramball\.in/gi, 'UnrealSportsHub.in'],
    [/haramball/gi,     'UnrealSportsHub'],
  ];
  function sanitize(str) {
    if (!str || !IS_HARAMBALL) return str;
    return _BRAND_RULES.reduce(function (s, r) { return s.replace(r[0], r[1]); }, String(str));
  }

  const handle = _params.get('handle');
  if (!handle) return;



  function normalise(p) {
    var prices = p.variants.map(function (v) { return parseFloat(v.price) * 100; });
    var comps  = p.variants.map(function (v) { return parseFloat(v.compare_at_price) * 100 || 0; });
    if (p.price_min == null || isNaN(p.price_min)) p.price_min = Math.min.apply(null, prices);
    if (p.compare_at_price_min == null || isNaN(p.compare_at_price_min)) p.compare_at_price_min = Math.max.apply(null, comps);
  }

  function applyProduct(p) {
    window._liveProduct = p;
    var price   = p.price_min / 100;
    var compare = p.compare_at_price_min / 100;

    /* FIX 1 — clean brand name from title before writing to DOM */
    var displayTitle = sanitize(p.title);

    /* ── title ── */
    document.title = displayTitle + ' – Unreal Sports';
    document.querySelectorAll('h1').forEach(function (el) {
      if (el.textContent.trim().length > 2) el.textContent = displayTitle;
    });
    document.querySelectorAll('.product__title').forEach(function (el) {
      el.textContent = displayTitle;
    });

    /* ── price ── */
    document.querySelectorAll('.price-item--sale, .price-item--regular').forEach(function (el) {
      if (el.classList.contains('price-item--sale') || !el.closest('.price__regular')) {
        el.textContent = '₹' + price;
      }
    });
    document.querySelectorAll('.price__regular .price-item--regular').forEach(function (el) {
      if (compare > price) el.textContent = '₹' + compare;
    });

    /* ── images: rebuild main gallery + thumbnails from this product's images ── */
    if (p.images && p.images.length) buildGallery(p);

    /* ── fix form actions ── */
    document.querySelectorAll('form[action="/cart/add"], form[action*="cart/add"]').forEach(function (f) {
      f.action = STORE + '/cart/add';
    });

    syncCheckout(p);
    syncPrices(p);
    syncSticky(p, p.variants[0]);
    buildRelated(p);

    /* sizes are NOT touched here — paintPicker() owns size availability */
  }

  function rs(n) {
    return 'Rs. ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  var OLD_TITLE = 'Ac Milan 2006-07 Away Kaka full sleeves retro';

  /* main price block + every leftover hard-coded AC Milan label */
  function syncPrices(p) {
    var price = p.price_min / 100, compare = p.compare_at_price_min / 100;
    document.querySelectorAll('.price').forEach(function (box) {
      var cur = box.querySelector('.price__regular'), old = box.querySelector('.price__sale');
      if (cur) cur.textContent = rs(price);
      if (old) {
        if (compare > price) { old.textContent = rs(compare); old.style.display = ''; }
        else old.style.display = 'none';
      }
    });
    document.querySelectorAll('[aria-label*="Ac Milan 2006-07 Away Kaka"]').forEach(function (el) {
      el.setAttribute('aria-label', el.getAttribute('aria-label').replace(OLD_TITLE, p.title));
    });
  }

  /* sticky "add to cart" popup that appears while scrolling */
  function syncSticky(p, variant) {
    var bar = document.querySelector('product-sticky-form');
    if (!bar) return;
    var t = bar.querySelector('p.text-base');
    if (t) t.textContent = p.title;
    var opt = bar.querySelector('[data-sticky-product-options]');
    if (opt && variant) opt.textContent = variant.title;
    var img = bar.querySelector('[data-sticky-product-media] img');
    if (img && p.images && p.images[0]) {
      img.src = imgUrl(p.images[0].src, 240);
      img.srcset = srcset(p.images[0].src, [120, 160, 240]);
      img.alt = p.title;
    }
  }

  /* ── "You may also like": related products from site_data.json ── */
  function buildRelated(p) {
    var host = document.querySelector('product-recommendations.related-products');
    /* hide the empty "Frequently Bought Together" shell */
    var fbt = document.querySelector('product-recommendations.complementary-products');
    if (fbt) fbt.style.display = 'none';
    if (!host) return;

    fetch('./site_data.json').then(function (r) { return r.json(); }).then(function (d) {
      var all = (d.products || []).filter(function (x) { return x.handle !== p.handle; });
      var generic = { best: 1, sellers: 1, new: 1, season: 1, kits: 1, kit: 1, jerseys: 1, jersey: 1, embroidery: 1,
                      the: 1, and: 1, edition: 1, sleeves: 1, half: 1, full: 1, retro: 1, home: 1, away: 1 };
      function words(t) {
        return (t || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function (w) {
          return w.length > 2 && !generic[w] && !/^\d+$/.test(w);
        });
      }
      var pw = words(p.title);
      var pcols = {};
      /* find this product in site data to reuse its collections */
      var self = (d.products || []).find(function (x) { return x.handle === p.handle; });
      if (self) (self.collections || []).forEach(function (c) { pcols[c.handle] = 1; });
      var skipCols = { 'best-sellers': 1, 'new-season-kits': 1, 'all': 1, 'frontpage': 1 };

      var scored = all.map(function (x) {
        var sc = 0;
        var xw = words(x.title);
        pw.forEach(function (w) { if (xw.indexOf(w) > -1) sc += 3; });          /* same team / player */
        (x.collections || []).forEach(function (c) { if (pcols[c.handle] && !skipCols[c.handle]) sc += 2; });
        if (x.product_type && x.product_type === p.product_type) sc += 1;
        return { x: x, sc: sc };
      });
      scored.sort(function (a, b) { return b.sc - a.sc; });
      var picks = scored.slice(0, 8).map(function (o) { return o.x; });
      if (!picks.length) return;

      var cards = picks.map(function (x) {
        var v = (x.variants && x.variants[0]) || {};
        var price = parseFloat(x.price || v.price) || 0;
        var comp = parseFloat(v.compare_at_price) || 0;
        var pct = comp > price ? Math.round((comp - price) / comp * 100) : 0;
        var img = x.images && x.images[0] ? x.images[0] : '';
        var href = './product.html?handle=' + encodeURIComponent(x.handle);
        return '<a href="' + href + '" style="flex:0 0 68%;max-width:300px;scroll-snap-align:start;text-decoration:none;color:inherit;display:block;position:relative;">' +
          '<div style="position:relative;aspect-ratio:1/1;overflow:hidden;background:#f2f2f2;">' +
            '<img src="' + img + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">' +
            (pct ? '<span style="position:absolute;top:12px;left:12px;background:#c8102e;color:#fff;font-size:13px;font-weight:600;padding:6px 14px;border-radius:30px;">Save ' + pct + '%</span>' : '') +
            '<span style="position:absolute;right:12px;bottom:12px;width:44px;height:44px;border-radius:50%;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;">🛒</span>' +
          '</div>' +
          '<div style="text-align:center;padding:12px 4px;">' +
            '<div style="font-size:16px;font-weight:700;line-height:1.3;">' + x.title + '</div>' +
            '<div style="margin-top:6px;font-size:15px;">' + rs(price) + '</div>' +
            (comp > price ? '<div style="font-size:14px;color:#c8102e;text-decoration:line-through;font-weight:600;">' + rs(comp) + '</div>' : '') +
          '</div></a>';
      }).join('');

      host.innerHTML =
        '<div class="section section--padding" style="padding:40px 20px;">' +
          '<h2 style="font-size:clamp(32px,7vw,52px);font-weight:800;letter-spacing:-.03em;margin:0 0 24px;">You may also like</h2>' +
          '<div style="display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px;-webkit-overflow-scrolling:touch;">' +
          cards + '</div></div>';
    }).catch(function (e) { console.error('[loader] related failed', e); });
  }


  function imgUrl(src, w) {
    var u = 'https:' + src.replace(/^https?:/, '');
    return u + (u.indexOf('?') > -1 ? '&' : '?') + 'width=' + w;
  }
  function srcset(src, widths) {
    return widths.map(function (w) { return imgUrl(src, w) + ' ' + w + 'w'; }).join(', ');
  }

  function buildGallery(p) {
    var imgs = p.images;

    /* desktop big preview (first image) */
    document.querySelectorAll('.product__preview .product__media img').forEach(function (img) {
      img.src = imgUrl(imgs[0].src, 800);
      img.srcset = srcset(imgs[0].src, [300, 500, 800]);
      img.alt = p.title;
    });

    /* big slider list: clone first item once per image */
    var list = document.querySelector('.product__media-list');
    if (list) {
      var tpl = list.querySelector('.product__media');
      if (tpl) {
        var frag = document.createDocumentFragment();
        imgs.forEach(function (im, i) {
          var el = tpl.cloneNode(true);
          el.setAttribute('data-media-id', im.id);
          if (i === 0) el.classList.add('xl:hidden'); /* xl already shows preview */
          else el.classList.remove('xl:hidden');
          var img = el.querySelector('img');
          if (img) {
            img.src = imgUrl(im.src, 800);
            img.srcset = srcset(im.src, [300, 500, 800]);
            img.alt = p.title;
            img.loading = i === 0 ? 'eager' : 'lazy';
          }
          var b = el.querySelector('button[aria-label]');
          if (b) b.setAttribute('aria-label', 'Open media ' + (i + 1) + ' in modal');
          frag.appendChild(el);
        });
        list.innerHTML = '';
        list.appendChild(frag);
      }
    }

    /* thumbnails (these were the hard-coded AC Milan images) */
    var dots = document.querySelector('.product__thumbnails-list');
    if (dots) {
      var ttpl = dots.querySelector('.product__thumbnail');
      if (ttpl) {
        var tf = document.createDocumentFragment();
        imgs.forEach(function (im, i) {
          var t = ttpl.cloneNode(true);
          t.setAttribute('data-media-id', im.id);
          t.setAttribute('aria-label', 'Go to item ' + (i + 1));
          t.setAttribute('aria-current', i === 0 ? 'true' : 'false');
          var img = t.querySelector('img');
          if (img) {
            img.src = imgUrl(im.src, 200);
            img.srcset = srcset(im.src, [100, 200, 300]);
            img.alt = p.title;
            img.removeAttribute('data-src');
          }
          tf.appendChild(t);
        });
        dots.innerHTML = '';
        dots.appendChild(tf);
      }
    }

    /* fallback: clicking a thumbnail scrolls to / shows the matching big image */
    document.querySelectorAll('.product__thumbnail').forEach(function (t, i) {
      t.addEventListener('click', function () {
        document.querySelectorAll('.product__thumbnail').forEach(function (x) {
          x.setAttribute('aria-current', x === t ? 'true' : 'false');
        });
        var target = document.querySelectorAll('.product__media-list .product__media')[i];
        if (target && target.scrollIntoView) {
          target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        }
      });
    });
  }

  var currentVariantId = null;

  function setVariant(id) {
    currentVariantId = id;
    var lp = window._liveProduct;
    if (lp) {
      var vv = lp.variants.find(function (x) { return String(x.id) === String(id); });
      var so = document.querySelector('[data-sticky-product-options]');
      if (so && vv) so.textContent = vv.title;
    }
    document.querySelectorAll('input[name="id"]').forEach(function (inp) {
      inp.value = id;
      inp.removeAttribute('disabled');
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
   * STOCK MODEL (v4)
   * ────────────────
   * 1. BASELINE (instant, no live network needed):
   *      haramball → the sessionStorage cache written by haramball-loader.js
   *      jerseycrest → the same-origin site_data.json snapshot
   *    The picker is drawn from this straight away.
   * 2. LIVE (authoritative): /products/<handle>.json from the source store.
   *    When it answers, its per-size availability replaces the baseline.
   * 3. If the live request fails, the baseline stays. A network error never
   *    locks sizes that the baseline shows as available.
   * Locking everything only happens when there is no data at all yet
   * ('checking') or when there is no baseline and live also failed ('failed').
   * ══════════════════════════════════════════════════════════════════════ */
  var LIVE_TIMEOUT_MS = 8000;
  var CACHE_KEY       = 'haramball_products';
  var pageFilled      = false;   /* title/images/price written from some product */
  var liveDone        = false;   /* live stock has been applied */

  function fetchLiveProduct(store) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var timer = setTimeout(function () {
        if (!settled) { settled = true; reject(new Error('live stock request timed out')); }
      }, LIVE_TIMEOUT_MS);
      fetch(store + '/products/' + encodeURIComponent(handle) + '.js', {
        headers: { Accept: 'application/json' }
      })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (d) {
          var p = d && d.product ? d.product : d;   /* .js returns the product unwrapped */
          if (!p || !Array.isArray(p.variants) || !p.variants.length) throw new Error('product has no variants');
          if (!settled) { settled = true; clearTimeout(timer); resolve(fromJs(p)); }
        })
        .catch(function (e) {
          if (!settled) { settled = true; clearTimeout(timer); reject(e); }
        });
    });
  }

  function readHaramballCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      var map = raw ? JSON.parse(raw) : null;
      return map && map[handle] ? map[handle] : null;
    } catch (e) { return null; }
  }

  function writeHaramballCache(p) {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      var map = raw ? JSON.parse(raw) : {};
      map[handle] = p;
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(map));
    } catch (e) { /* storage unavailable — non-fatal */ }
  }

  /* site_data.json stores images as plain URLs; the gallery expects {id, src} */
  function fromSnapshot(hit) {
    return {
      handle: hit.handle,
      title: hit.title,
      price_min: null,
      compare_at_price_min: null,
      images: (hit.images || []).map(function (src, i) {
        return { id: i + 1, src: typeof src === 'string' ? src : (src && src.src) || '' };
      }),
      variants: (hit.variants || []).map(function (v) {
        return {
          id: v.id, title: v.title, option1: v.option1,
          available: v.available === true,
          price: v.price, compare_at_price: v.compare_at_price
        };
      })
    };
  }

  /* .js endpoint: prices in cents, images as URLs -> page shape (rupees, {id, src}) */
  function fromJs(d) {
    function rupees(c) {
      var n = Number(c);
      return isFinite(n) && n > 0 ? (n / 100).toFixed(2) : null;
    }
    return {
      handle: d.handle,
      title: d.title,
      price_min: null,
      compare_at_price_min: null,
      images: (d.images || []).map(function (src, i) {
        return { id: i + 1, src: typeof src === 'string' ? src : (src && src.src) || '' };
      }),
      variants: (d.variants || []).map(function (v) {
        return {
          id: v.id, title: v.title, option1: v.option1,
          available: v.available === true,
          price: rupees(v.price) || '0',
          compare_at_price: rupees(v.compare_at_price)
        };
      })
    };
  }

  function logLiveStock(p) {
    try {
      console.info('[product-loader] live stock for ' + handle + ': ' +
        p.variants.map(function (v) {
          return (v.option1 || v.title) + '=' + (v.available ? 'in stock' : 'out of stock');
        }).join(', '));
    } catch (e) { /* logging only */ }
  }

  /* Draw the page once, from whichever product arrives first */
  function fillPage(p) {
    normalise(p);
    applyProduct(p);
    pageFilled = true;
  }

  function applyBaseline(p) {
    if (liveDone || pageFilled || !p || !Array.isArray(p.variants) || !p.variants.length) return;
    fillPage(p);
    paintPicker(p, 'baseline');
  }

  function applyLive(live) {
    liveDone = true;
    logLiveStock(live);
    if (!pageFilled) {
      fillPage(live);
    } else {
      var cur = window._liveProduct;
      var av = {};
      live.variants.forEach(function (v) { av[String(v.id)] = v.available === true; });
      cur.variants.forEach(function (v) { v.available = av[String(v.id)] === true; });
      syncCheckout(cur);
    }
    paintPicker(window._liveProduct, 'live');
    if (IS_HARAMBALL) writeHaramballCache(window._liveProduct);
  }

  function startFlow() {
    /* 1. baseline */
    if (IS_HARAMBALL) {
      applyBaseline(readHaramballCache());
    } else {
      fetch('./site_data.json')
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var hit = (d.products || []).filter(function (x) { return x.handle === handle; })[0];
          if (hit) applyBaseline(fromSnapshot(hit));
        })
        .catch(function (e) { console.warn('[product-loader] snapshot unavailable', e); });
    }
    if (!pageFilled) paintPicker(null, 'checking');

    /* 2. live */
    fetchLiveProduct(STORE)
      .then(applyLive)
      .catch(function (e) {
        console.warn('[product-loader] live stock check failed; keeping baseline', e);
        if (!pageFilled) paintPicker(null, 'failed');
      });
  }

  /* ── size picker: the static #jc-size-picker that customers actually see ── */
  var SIZE_PICKER_ID = 'jc-size-picker';

  function ensurePickerStyles() {
    if (document.getElementById('jc-stock-style')) return;
    var s = document.createElement('style');
    s.id = 'jc-stock-style';
    s.textContent =
      '.jc-size-btn.jc-unavailable{color:#b5b5b5 !important;border-color:#e2e2e2 !important;' +
        'background:#fafafa !important;text-decoration:line-through;cursor:not-allowed !important;}' +
      '.jc-size-btn.jc-checking{opacity:.45 !important;cursor:wait !important;}';
    document.head.appendChild(s);
  }

  function sizeKey(v) {
    return String((v && (v.option1 || v.title)) || '').trim().toLowerCase();
  }

  function setBtnState(btn, state) {
    /* state: 'available' | 'unavailable' | 'checking' */
    btn.classList.toggle('jc-unavailable', state === 'unavailable');
    btn.classList.toggle('jc-checking', state === 'checking');
    if (state === 'available') {
      btn.disabled = false;
      btn.style.cursor = 'pointer';
      btn.removeAttribute('title');
      return;
    }
    btn.disabled = true;
    btn.classList.remove('jc-selected');
    btn.setAttribute('aria-checked', 'false');
    btn.title = state === 'checking' ? 'Checking stock…' : 'Not available in this size';
  }

  /*
   * paintPicker(p, mode)
   *   p    – product whose variants are the live source of truth (or null)
   *   mode – 'checking' | 'live' | 'failed'
   * Matches each static button to a variant by data-variant-id, then by size
   * label. Sizes with no matching live variant are locked and crossed out.
   * On a match the button's data-variant-id is rewritten to this store's
   * variant id, so the purchase path (resolveOwnVariant) gets the right one.
   */
  function paintPicker(p, mode) {
    var picker = document.getElementById(SIZE_PICKER_ID);
    if (!picker) return;
    ensurePickerStyles();

    var variants = (p && p.variants) || [];
    var byId = {}, bySize = {};
    variants.forEach(function (v) {
      byId[String(v.id)] = v;
      var k = sizeKey(v);
      if (k && !bySize.hasOwnProperty(k)) bySize[k] = v;
    });

    picker.querySelectorAll('.jc-size-btn').forEach(function (btn) {
      if (mode === 'checking' || mode === 'failed') {
        setBtnState(btn, mode === 'checking' ? 'checking' : 'unavailable');
        return;
      }
      var label = String(btn.textContent || '').trim().toLowerCase();
      var v = byId[String(btn.getAttribute('data-variant-id') || '')] || bySize[label] || null;
      if (v) btn.setAttribute('data-variant-id', String(v.id));
      setBtnState(btn, (v && v.available === true) ? 'available' : 'unavailable');
    });

    /* keep the theme's hidden radios consistent so its own price/image logic agrees */
    var nativePicker = document.querySelector('variant-picker');
    if (nativePicker) {
      nativePicker.querySelectorAll('input[type="radio"]').forEach(function (radio) {
        var v = bySize[String(radio.value || '').trim().toLowerCase()];
        radio.disabled = !((mode === 'live' || mode === 'baseline') && v && v.available === true);
      });
    }

    /* status line under the sizes */
    var note = document.getElementById('jc-stock-note');
    if (!note) {
      note = document.createElement('p');
      note.id = 'jc-stock-note';
      note.style.cssText = 'font-size:13px;font-weight:600;margin:8px 0 0;';
      picker.appendChild(note);
    }
    var msg = mode === 'checking' ? 'Checking size availability…'
            : mode === 'failed'   ? 'We could not confirm stock for this product right now. Please refresh the page.'
            : '';
    note.textContent = msg;
    note.style.color = mode === 'failed' ? '#e6332a' : '#666';
    note.style.display = msg ? '' : 'none';
  }

  /* checkout-side ids: default to the first available variant of the current data */
  function syncCheckout(p) {
    var accel = document.querySelector('shopify-accelerated-checkout');
    if (accel) {
      accel.setAttribute('variant-params', JSON.stringify(p.variants.map(function (v) {
        return { id: v.id, requiresShipping: true };
      })));
    }
    var installId = document.querySelector('form.installment input[name="id"]');
    var firstV = p.variants.find(function (v) { return v.available === true; }) || p.variants[0];
    if (installId && firstV) installId.value = firstV.id;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startFlow);
  else startFlow();

})();

/* ── ADD TO CART (stays on page) + BUY NOW (goes to checkout) ── */
document.addEventListener('DOMContentLoaded', function () {
  var _p2       = new URLSearchParams(window.location.search);
  var _isHaram  = _p2.get('store') === 'haramball';
  var STORE     = _isHaram ? 'https://haramball.in' : 'https://jerseycrest.shop';
  var handle    = _p2.get('handle');
  var OWN_STORE = 'https://jerseycrest.shop';

  /*
   * Haramball variant IDs do NOT exist on our own checkout, and
   * haramball.in/cart/<id>:1 returns 404. So for haramball products we find
   * the same product on our own store (by handle, then by title search),
   * match the chosen size, and use OUR variant id for cart / checkout.
   */
  function ownJson(url) {
    return fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function resolveOwnVariant(hVariantId) {
    var lp = window._liveProduct;
    if (!lp) return Promise.reject(new Error('no product'));
    var hv = lp.variants.find(function (x) { return String(x.id) === String(hVariantId); });
    var size = hv ? String(hv.option1 || hv.title).trim().toLowerCase() : '';

    function pick(prod) {
      var v = (prod.variants || []).find(function (x) {
        return String(x.option1 || x.title).trim().toLowerCase() === size ||
               String(x.title).trim().toLowerCase() === size;
      }) || (prod.variants || []).find(function (x) { return x.available; }) || (prod.variants || [])[0];
      if (!v) throw new Error('no variant');
      return { prod: prod, variant: v };
    }

    return ownJson(OWN_STORE + '/products/' + encodeURIComponent(lp.handle) + '.json')
      .then(function (d) { return pick(d.product); })
      .catch(function () {
        return ownJson(OWN_STORE + '/search/suggest.json?q=' + encodeURIComponent(lp.title) +
                       '&resources[type]=product&resources[limit]=1')
          .then(function (d) {
            var hit = d.resources && d.resources.results && d.resources.results.products &&
                      d.resources.results.products[0];
            if (!hit) throw new Error('not found');
            return ownJson(OWN_STORE + '/products/' + hit.handle + '.json');
          })
          .then(function (d) { return pick(d.product); });
      });
  }
  function notAvailable() {
    alert('Sorry, this item is not available for checkout right now. Please try another product.');
  }

  function selectedVariantId() {
    var vid = document.querySelector('form[data-type="add-to-cart-form"] input[name="id"], input[name="id"]');
    return vid && vid.value ? vid.value : null;
  }

  function toast(html) {
    var old = document.getElementById('jc-added-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.id = 'jc-added-toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;' +
      'background:#111;color:#fff;padding:14px 18px;border-radius:12px;font-size:14px;' +
      'box-shadow:0 8px 30px rgba(0,0,0,.3);display:flex;gap:14px;align-items:center;max-width:92vw;';
    t.innerHTML = html;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 4000);
  }

  /* ADD TO CART */
  document.querySelectorAll('form[data-type="add-to-cart-form"], form.product-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var id = selectedVariantId();
      if (!id) { alert('Please select a size'); return; }

      if (_isHaram) {
        /* Haramball product → map to our own store variant, add to our cart */
        resolveOwnVariant(id).then(function (r) {
          var p = window._liveProduct;
          if (window.JC) {
            window.JC.addToCart(r.prod.handle, p.title, p.price_min, p.images[0] ? p.images[0].src : '', r.variant.title, r.variant.id);
          }
          toast('<span>✓ Added to cart</span><a href="./cart.html" style="color:#fff;text-decoration:underline;font-weight:600">View cart</a>');
        }).catch(notAvailable);
        return;
      }

      /* Own product → add to local cart as before */
      if (window.JC && window._liveProduct) {
        var p = window._liveProduct;
        var v = p.variants.find(function (x) { return String(x.id) === String(id); });
        window.JC.addToCart(handle, p.title, p.price_min, p.images[0] ? p.images[0].src : '', v ? v.title : '', id);
      }
      toast('<span>✓ Added to cart</span><a href="./cart.html" style="color:#fff;text-decoration:underline;font-weight:600">View cart</a>');
    }, true);
  });

  /* BUY NOW: replace the frozen Shopify skeleton; only this goes to checkout */
  var accelWrap = document.querySelector('[data-shopify="payment-button"], .shopify-payment-button');
  if (accelWrap) {
    var buyBtn = document.createElement('button');
    buyBtn.type = 'button';
    buyBtn.textContent = 'Buy it now';
    buyBtn.style.cssText = 'width:100%;height:60px;background:#000;color:#fff;border:none;border-radius:60px;' +
      'font-size:14px;font-weight:600;letter-spacing:.05em;cursor:pointer;margin-top:8px;';
    buyBtn.addEventListener('click', function () {
      var id = selectedVariantId();
      if (!id) { alert('Please select a size'); return; }
      if (_isHaram) {
        /* Haramball product → checkout on OUR store with the matching variant */
        resolveOwnVariant(id).then(function (r) {
          window.location.href = OWN_STORE + '/cart/' + r.variant.id + ':1?channel=buy_now';
        }).catch(notAvailable);
        return;
      }
      window.location.href = STORE + '/cart/' + id + ':1?channel=buy_now';
    });
    accelWrap.innerHTML = '';
    accelWrap.appendChild(buyBtn);
  }
});
