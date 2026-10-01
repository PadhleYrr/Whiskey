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

  if (IS_HARAMBALL) {
    /*
     * Haramball product flow
     * ─────────────────────
     * haramball-loader.js already fetched ALL haramball products and stored
     * them in sessionStorage under the key 'haramball_products'.
     * We read from that cache first — this means zero extra network requests
     * and the exact product the user clicked always loads correctly.
     * If the cache is somehow empty (e.g. user bookmarked the URL directly),
     * we fall back to fetching the individual product from haramball.in.
     */
    var _loaded = false;

    try {
      var _raw   = sessionStorage.getItem('haramball_products');
      var _cache = _raw ? JSON.parse(_raw) : null;
      if (_cache && _cache[handle]) {
        var _p = _cache[handle];
        normalise(_p);
        applyProduct(_p);
        _loaded = true;
      }
    } catch (e) { /* sessionStorage unavailable */ }

    if (!_loaded) {
      /* fallback: direct fetch from haramball.in */
      fetch('https://haramball.in/products/' + encodeURIComponent(handle) + '.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var p = data.product;
          if (!p) return;
          normalise(p);
          applyProduct(p);
        })
        .catch(function (e) { console.error('[haramball loader] fetch failed', e); });
    }

  } else {
    /* Own store (jerseycrest.shop) — original behaviour */
    fetch(STORE + '/products/' + handle + '.json')
      .then(r => r.json())
      .then(function (data) {
        var p = data.product;
        if (!p) return;
        normalise(p);
        applyProduct(p);
      })
      .catch(function (e) { console.error('[loader] fetch failed', e); });
  }

  function normalise(p) {
    var prices = p.variants.map(function (v) { return parseFloat(v.price) * 100; });
    var comps  = p.variants.map(function (v) { return parseFloat(v.compare_at_price) * 100 || 0; });
    if (p.price_min == null || isNaN(p.price_min)) p.price_min = Math.min.apply(null, prices);
    if (p.compare_at_price_min == null || isNaN(p.compare_at_price_min)) p.compare_at_price_min = Math.max.apply(null, comps);
  }

  function applyProduct(p) { window._liveProduct = p;
    var price    = p.price_min / 100;
    var compare  = p.compare_at_price_min / 100;

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

    /* ── build variant picker ── */
    buildPicker(p);

    /* ── fix shopify-accelerated-checkout variant-params ── */
    var accel = document.querySelector('shopify-accelerated-checkout');
    if (accel) {
      var vp = p.variants.map(function (v) {
        return { id: v.id, requiresShipping: true };
      });
      accel.setAttribute('variant-params', JSON.stringify(vp));
    }

    /* ── update installment form hidden id too ── */
    var installId = document.querySelector('form.installment input[name="id"]');
    var firstV = p.variants.find(function (v) { return v.available; }) || p.variants[0];
    if (installId && firstV) installId.value = firstV.id;

    syncPrices(p);
    syncSticky(p, firstV);
    buildRelated(p);
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

  function buildPicker(p) {
    /* try to find existing fieldset */
    var fieldset = document.querySelector(
      'fieldset.product-form__input, .product-form__input--pill, .variant-input-wrap'
    );

    /* build button group */
    var group = document.createElement('div');
    group.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;';

    p.variants.forEach(function (v) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = v.title;
      btn.dataset.variantId = v.id;
      btn.disabled = !v.available;
      btn.style.cssText =
        'min-width:52px;height:52px;padding:0 14px;border:2px solid ' +
        (v.available ? '#000' : '#ddd') +
        ';border-radius:6px;background:#fff;cursor:' +
        (v.available ? 'pointer' : 'not-allowed') +
        ';font-size:14px;font-weight:500;color:' +
        (v.available ? '#000' : '#bbb') + ';' +
        (!v.available ? 'text-decoration:line-through;' : '');

      btn.addEventListener('click', function () {
        if (!v.available) return;
        group.querySelectorAll('button').forEach(function (b) {
          b.style.background = '#fff';
          b.style.color = '#000';
          b.style.borderColor = '#000';
        });
        btn.style.background = '#000';
        btn.style.color = '#fff';
        btn.style.borderColor = '#000';
        setVariant(v.id);
      });
      group.appendChild(btn);
    });

    /* header */
    var header = document.createElement('div');
    header.style.cssText = 'font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;';
    header.textContent = 'Size';

    var wrapper = document.createElement('div');
    wrapper.id = 'live-variant-picker';
    wrapper.appendChild(header);
    wrapper.appendChild(group);

    if (fieldset) {
      fieldset.replaceWith(wrapper);
    } else {
      var form = document.querySelector('form[data-type="add-to-cart-form"], form.product-form');
      if (form) {
        var btns = form.querySelector('.product-form__buttons');
        if (btns) form.insertBefore(wrapper, btns);
        else form.prepend(wrapper);
      }
    }

    /* auto-select first available */
    var first = p.variants.find(function (v) { return v.available; }) || p.variants[0];
    if (first) {
      var firstBtn = group.querySelector('[data-variant-id="' + first.id + '"]');
      if (firstBtn) {
        firstBtn.style.background = '#000';
        firstBtn.style.color = '#fff';
      }
      setVariant(first.id);
    }
  }
})();

/* ── ADD TO CART (stays on page) + BUY NOW (goes to checkout) ── */
document.addEventListener('DOMContentLoaded', function () {
  var _p2       = new URLSearchParams(window.location.search);
  var _isHaram  = _p2.get('store') === 'haramball';
  var STORE     = _isHaram ? 'https://haramball.in' : 'https://jerseycrest.shop';
  var handle    = _p2.get('handle');

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
        /* Haramball product → redirect to haramball.in cart */
        window.location.href = 'https://haramball.in/cart/' + id + ':1';
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
      /* For haramball products, always go to haramball.in checkout */
      var checkoutBase = _isHaram ? 'https://haramball.in' : STORE;
      window.location.href = checkoutBase + '/cart/' + id + ':1?channel=buy_now';
    });
    accelWrap.innerHTML = '';
    accelWrap.appendChild(buyBtn);
  }
});
