(function () {
  var STORE = 'https://jerseycrest.shop';

  function getCart() {
    try { return JSON.parse(localStorage.getItem('jc_cart') || '[]'); } catch { return []; }
  }
  function saveCart(c) { localStorage.setItem('jc_cart', JSON.stringify(c)); }

  /* ── render cart items into the page ── */
  function renderCart() {
    var cart = getCart();

    /* total count badge */
    var count = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    document.querySelectorAll('.cart-count, [data-cart-count], .cart-item-count').forEach(function (el) {
      el.textContent = count;
    });

    /* find item container */
    var container = document.querySelector(
      '.cart__items, #CartItems, .cart-items, [data-cart-items]'
    );
    if (!container) return;

    if (!cart.length) {
      container.innerHTML = '<p style="padding:24px;text-align:center;color:#888">Your cart is empty</p>';
      /* hide totals / checkout */
      document.querySelectorAll('.cart__footer, .cart__totals, .cart__checkout-button, [name="checkout"]').forEach(function (el) {
        el.style.display = 'none';
      });
      return;
    }

    container.innerHTML = cart.map(function (item, idx) {
      var img = item.image ? ('https:' + item.image.replace(/^https?:/, '')) : '';
      var price = (item.price / 100).toFixed(0);
      return [
        '<div class="cart-item" style="display:flex;gap:16px;padding:16px 0;border-bottom:1px solid #eee;" data-idx="' + idx + '">',
          '<img src="' + img + '" style="width:80px;height:80px;object-fit:cover;border-radius:6px;" onerror="this.style.display=\'none\'">',
          '<div style="flex:1;min-width:0;">',
            '<a href="./product.html?handle=' + item.handle + '" style="font-size:13px;color:#111;text-decoration:none;font-weight:500;">' + item.title + '</a>',
            '<div style="font-size:12px;color:#666;margin-top:2px;">Size: ' + item.size + '</div>',
            '<div style="font-size:13px;font-weight:600;margin-top:4px;">₹' + price + '</div>',
            '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;">',
              '<button onclick="window.cartDecrement(' + idx + ')" style="width:28px;height:28px;border:1px solid #ddd;background:#fff;border-radius:4px;font-size:16px;cursor:pointer;">−</button>',
              '<span style="font-size:14px;min-width:20px;text-align:center;">' + item.qty + '</span>',
              '<button onclick="window.cartIncrement(' + idx + ')" style="width:28px;height:28px;border:1px solid #ddd;background:#fff;border-radius:4px;font-size:16px;cursor:pointer;">+</button>',
              '<button onclick="window.cartRemove(' + idx + ')" style="margin-left:8px;font-size:11px;color:#999;background:none;border:none;cursor:pointer;text-decoration:underline;">Remove</button>',
            '</div>',
          '</div>',
          '<div style="font-size:13px;font-weight:600;white-space:nowrap;">₹' + (price * item.qty) + '</div>',
        '</div>'
      ].join('');
    }).join('');

    /* update subtotal */
    var total = cart.reduce(function (s, i) { return s + (i.price / 100) * i.qty; }, 0);
    document.querySelectorAll('.totals__subtotal-value, .cart-subtotal, [data-cart-total]').forEach(function (el) {
      el.textContent = '₹' + total.toFixed(0);
    });
  }

  /* ── mutation controls ── */
  window.cartDecrement = function (idx) {
    var c = getCart();
    if (!c[idx]) return;
    c[idx].qty--;
    if (c[idx].qty <= 0) c.splice(idx, 1);
    saveCart(c);
    renderCart();
  };
  window.cartIncrement = function (idx) {
    var c = getCart();
    if (!c[idx]) return;
    c[idx].qty++;
    saveCart(c);
    renderCart();
  };
  window.cartRemove = function (idx) {
    var c = getCart();
    c.splice(idx, 1);
    saveCart(c);
    renderCart();
  };

  /* ── checkout button → jerseycrest.shop cart URL ── */
  function wireCheckout() {
    /* find ALL checkout triggers — Shopify button, fastrr button, drawer button */
    var selectors = [
      'button[name="checkout"]',
      '.cart__checkout-button',
      '.button--checkout',
      '#CartDrawer button[name="checkout"]',
      '.drawer__footer-buttons button[name="checkout"]',
      '.sr-headless-checkout',
      '[id*="fastrr"], [class*="fastrr"]'
    ];
    var btns = document.querySelectorAll(selectors.join(','));

    btns.forEach(function (btn) {
      /* clone to strip old listeners */
      var clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
      clone.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        goCheckout();
      });
    });

    /* also intercept the drawer form submit */
    document.querySelectorAll('form[action="/cart"], form[action*="/cart"]').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        if (e.submitter && e.submitter.name === 'checkout') {
          e.preventDefault();
          goCheckout();
        }
      });
    });
  }

  function goCheckout() {
    var cart = getCart();
    if (!cart.length) { alert('Your cart is empty'); return; }

    /* build /cart/VID:QTY,VID:QTY URL — Shopify accepts this and adds to cart then shows checkout */
    var pairs = cart.map(function (item) {
      return item.variantId + ':' + item.qty;
    }).join(',');

    window.location.href = STORE + '/cart/' + pairs + '?checkout=true';
  }

  /* ── expose goCheckout globally so BUY NOW in cart sidebar also works ── */
  window.goCheckout = goCheckout;

  /* ── init ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { renderCart(); wireCheckout(); });
  } else {
    renderCart();
    wireCheckout();
  }
})();
