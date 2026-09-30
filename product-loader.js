(function () {
  const STORE = 'https://jerseycrest.shop';
  const handle = new URLSearchParams(window.location.search).get('handle');
  if (!handle) return;

  fetch(STORE + '/products/' + handle + '.json')
    .then(r => r.json())
    .then(function (data) {
      var p = data.product;
      if (!p) return;
      applyProduct(p);
    })
    .catch(function (e) { console.error('[loader] fetch failed', e); });

  function applyProduct(p) { window._liveProduct = p;
    var price    = p.price_min / 100;
    var compare  = p.compare_at_price_min / 100;

    /* ── title ── */
    document.title = p.title + ' – Unreal Sports';
    document.querySelectorAll('h1').forEach(function (el) {
      if (el.textContent.trim().length > 2) el.textContent = p.title;
    });
    document.querySelectorAll('.product__title').forEach(function (el) {
      el.textContent = p.title;
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

    /* ── images ── */
    if (p.images && p.images.length) {
      var src = 'https:' + p.images[0].src.replace(/^https?:/, '');
      document.querySelectorAll(
        '.product__media img, .product-single__photo img, [data-product-featured-image], .product__media-item img'
      ).forEach(function (img) { img.src = src; img.srcset = src; });

      /* gallery thumbnails */
      if (p.images.length > 1) {
        document.querySelectorAll('.product__media-list .product__media-item img').forEach(function (img, i) {
          if (p.images[i]) {
            var s = 'https:' + p.images[i].src.replace(/^https?:/, '');
            img.src = s; img.srcset = s;
          }
        });
      }
    }

    /* ── fix form actions → jerseycrest.shop ── */
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
  }

  var currentVariantId = null;

  function setVariant(id) {
    currentVariantId = id;
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

/* ── BUTTON OVERRIDE — fires after applyProduct sets currentVariantId ── */
document.addEventListener('DOMContentLoaded', function () {
  var STORE = 'https://jerseycrest.shop';

  /* intercept add-to-cart form submit */
  document.querySelectorAll(
    'form[data-type="add-to-cart-form"], form.product-form'
  ).forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var vid = document.querySelector('input[name="id"]');
      if (!vid || !vid.value) { alert('Please select a size'); return; }
      window.location.href = STORE + '/cart/' + vid.value + ':1';
    });
  });

  /* kill the frozen shopify-accelerated-checkout skeleton
     and replace with a real Buy Now that works */
  var accelWrap = document.querySelector('[data-shopify="payment-button"], .shopify-payment-button');
  if (accelWrap) {
    var buyBtn = document.createElement('button');
    buyBtn.type = 'button';
    buyBtn.textContent = 'Buy it now';
    buyBtn.style.cssText = [
      'width:100%',
      'height:60px',
      'background:#000',
      'color:#fff',
      'border:none',
      'border-radius:60px',
      'font-size:14px',
      'font-weight:600',
      'letter-spacing:.05em',
      'cursor:pointer',
      'margin-top:8px',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'gap:10px'
    ].join(';');

    /* payment icons row */
    var icons = document.createElement('span');
    icons.innerHTML = [
      '<img src="https://jerseycrest.shop/cdn/shop/t/11/assets/gpay.svg" height="20" style="vertical-align:middle" onerror="this.style.display=\'none\'">',
      '<img src="https://jerseycrest.shop/cdn/shop/t/11/assets/phonepe.svg" height="20" style="vertical-align:middle" onerror="this.style.display=\'none\'">',
      '<img src="https://jerseycrest.shop/cdn/shop/t/11/assets/paytm.svg" height="20" style="vertical-align:middle" onerror="this.style.display=\'none\'">'
    ].join('');
    buyBtn.appendChild(icons);

    buyBtn.addEventListener('click', function () {
      var vid = document.querySelector('input[name="id"]');
      if (!vid || !vid.value) { alert('Please select a size'); return; }
      window.location.href = STORE + '/cart/' + vid.value + ':1?channel=buy_now';
    });

    accelWrap.innerHTML = '';
    accelWrap.appendChild(buyBtn);
  }
});

/* ── sync to jc_cart so mini-cart count updates ── */
document.addEventListener('DOMContentLoaded', function () {
  var STORE = 'https://jerseycrest.shop';
  var handle = new URLSearchParams(window.location.search).get('handle');

  /* override add-to-cart form to save variantId then redirect */
  document.querySelectorAll('form[data-type="add-to-cart-form"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var vid = document.querySelector('input[name="id"]');
      if (!vid || !vid.value) { alert('Please select a size'); return; }

      /* save to jc_cart with variantId for cart page */
      if (window.JC && window._liveProduct) {
        var p = window._liveProduct;
        var v = p.variants.find(function (x) { return String(x.id) === String(vid.value); });
        var size = v ? v.title : '';
        window.JC.addToCart(handle, p.title, p.price_min, p.images[0] ? p.images[0].src : '', size, vid.value);
      }

      window.location.href = STORE + '/cart/' + vid.value + ':1';
    }, true);
  });
});
