// ============================================================
//  AR Traders — Main App Logic
// ============================================================

var products     = JSON.parse(localStorage.getItem('dsp_products') || '[]');
var orders       = JSON.parse(localStorage.getItem('dsp_orders')   || '[]');
var myOrders     = JSON.parse(localStorage.getItem('dsp_my_orders') || '[]');
var cart         = [];
var loggedIn = sessionStorage.getItem('dsp_admin_logged_in') === 'true';
var curCat       = 'All';
var newOrdersCount = parseInt(localStorage.getItem('dsp_new_orders') || '0');

// ---- Admin Credentials (stored in localStorage, defaults to original) ----
var adminUser = localStorage.getItem('dsp_admin_user') || 'vishav';
var adminPass = localStorage.getItem('dsp_admin_pass') || 'vishav824';

// ---- Persist ----
function save() {
  localStorage.setItem('dsp_products', JSON.stringify(products));
  localStorage.setItem('dsp_orders',   JSON.stringify(orders));
  localStorage.setItem('dsp_my_orders', JSON.stringify(myOrders));
}

// ---- Navigation ----
function showPage(p) {
  document.querySelectorAll('.page').forEach(function(x) { x.classList.remove('active'); });
  document.querySelectorAll('.nav-tab').forEach(function(x) { x.classList.remove('active'); });

  if (p === 'home') {
    document.getElementById('page-home').classList.add('active');
    var nh = document.getElementById('nav-home');
    if (nh) nh.classList.add('active');
    return;
  }

  if (p === 'admin-gate') {
    if (loggedIn) {
      document.getElementById('page-admin').classList.add('active');
    } else {
      document.getElementById('page-admin-gate').classList.add('active');
    }
    document.querySelectorAll('.nav-tab')[3].classList.add('active');
    return;
  }

  var el = document.getElementById('page-' + p);
  if (el) el.classList.add('active');

  if (p === 'store')    { document.getElementById('nav-store').classList.add('active'); renderStore(); }
  if (p === 'cart')     { renderCart(); }
  if (p === 'myorders') { document.getElementById('nav-myorders').classList.add('active'); renderMyOrders(); }
  if (p === 'admin')    { document.querySelectorAll('.nav-tab')[3].classList.add('active'); }
}

// ---- Admin Auth ----
function doLogin() {
  var u  = document.getElementById('login-user').value;
  var pw = document.getElementById('login-pass').value;
  if (u === adminUser && pw === adminPass) {
    loggedIn = true;
    sessionStorage.setItem('dsp_admin_logged_in', 'true');
    document.getElementById('login-err').style.display = 'none';
    document.getElementById('page-admin-gate').classList.remove('active');
    document.getElementById('page-admin').classList.add('active');
    // Reset new order badge when owner logs in
    newOrdersCount = 0;
    localStorage.setItem('dsp_new_orders', '0');
    updateAdminBadge();
  } else {
    document.getElementById('login-err').style.display = 'block';
  }
}

function doLogout() {
  loggedIn = false;
  sessionStorage.removeItem('dsp_admin_logged_in');
  showPage('store');
}

// ---- Admin Settings: Change Credentials ----
function resetSettingsForm() {
  document.getElementById('s-current-pass').value = '';
  document.getElementById('s-new-user').value = '';
  document.getElementById('s-new-pass').value = '';
  document.getElementById('s-confirm-pass').value = '';
  document.getElementById('s-current-err').style.display = 'none';
  document.getElementById('s-match-err').style.display = 'none';
  document.getElementById('s-success').style.display = 'none';
}

function saveAdminCredentials() {
  var currentPass = document.getElementById('s-current-pass').value.trim();
  var newUser     = document.getElementById('s-new-user').value.trim();
  var newPass     = document.getElementById('s-new-pass').value;
  var confirmPass = document.getElementById('s-confirm-pass').value;

  // Hide previous messages
  document.getElementById('s-current-err').style.display = 'none';
  document.getElementById('s-match-err').style.display = 'none';
  document.getElementById('s-success').style.display = 'none';

  // Validate current password
  if (currentPass !== adminPass) {
    document.getElementById('s-current-err').style.display = 'block';
    return;
  }

  // Validate new password match (only if new password provided)
  if (newPass !== '' && newPass !== confirmPass) {
    document.getElementById('s-match-err').style.display = 'block';
    return;
  }

  // Apply changes
  if (newUser !== '') {
    adminUser = newUser;
    localStorage.setItem('dsp_admin_user', adminUser);
  }
  if (newPass !== '') {
    adminPass = newPass;
    localStorage.setItem('dsp_admin_pass', adminPass);
  }

  // Show success and auto-logout so admin re-authenticates with new credentials
  document.getElementById('s-success').style.display = 'block';
  setTimeout(function() {
    doLogout();
  }, 2000);
}

// ---- Admin new order badge ----
function updateAdminBadge() {
  var badge = document.getElementById('admin-order-badge');
  if (!badge) return;
  if (newOrdersCount > 0) {
    badge.textContent = newOrdersCount;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

// ---- Admin Sub-tabs ----
function switchATab(t, btn) {
  document.querySelectorAll('.atab').forEach(function(x)    { x.classList.remove('active'); });
  document.querySelectorAll('.asection').forEach(function(x){ x.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById('asec-' + t).classList.add('active');
  if (t === 'manage') renderAdminProducts();
  if (t === 'orders') renderOrders();
  if (t === 'settings') resetSettingsForm();
}

// ---- Image Upload ----
function handleImg(inp) {
  var file = inp.files[0];
  if (!file) return;
  var r = new FileReader();
  r.onload = function(e) {
    var prev = document.getElementById('img-preview');
    prev.src = e.target.result;
    prev.style.display = 'block';
    document.getElementById('upload-hint').style.display = 'none';
  };
  r.readAsDataURL(file);
}

// ---- Add Product ----
function addProduct() {
  var name  = document.getElementById('p-name').value.trim();
  var price = document.getElementById('p-price').value.trim();
  var unit  = document.getElementById('p-unit').value.trim();
  var cat   = document.getElementById('p-cat').value;
  var desc  = document.getElementById('p-desc').value.trim();
  var tags  = document.getElementById('p-tags').value.trim();
  var prev  = document.getElementById('img-preview');
  var img   = (prev && prev.style.display !== 'none') ? prev.src : '';

  if (!name || !price) { alert('Please enter the product name and price!'); return; }

  var p = { id: Date.now(), name: name, price: price, unit: unit, cat: cat, desc: desc, tags: tags, img: img, addedAt: Date.now() };
  products.unshift(p);
  save();

  var m = document.getElementById('add-msg');
  m.style.display = 'block';
  setTimeout(function() { m.style.display = 'none'; }, 2500);

  ['p-name','p-price','p-unit','p-desc','p-tags'].forEach(function(id) { document.getElementById(id).value = ''; });
  document.getElementById('p-cat').value = '';
  prev.src = ''; prev.style.display = 'none';
  document.getElementById('upload-hint').style.display = 'block';
  document.getElementById('img-input').value = '';
}

// ---- Delete Product ----
function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  products = products.filter(function(x) { return x.id !== id; });
  save();
  renderAdminProducts();
}

// ---- Render Admin Products ----
function renderAdminProducts() {
  var g  = document.getElementById('admin-pgrid');
  var em = document.getElementById('admin-empty');
  if (!products.length) { g.innerHTML = ''; em.style.display = 'block'; return; }
  em.style.display = 'none';
  g.innerHTML = products.map(function(p) {
    var n = isNew(p);
    return '<div class="pcard">'
      + (n ? '<span class="new-badge">New</span>' : '')
      + (p.img ? '<img src="' + p.img + '" alt="' + esc(p.name) + '">' : '<div class="img-placeholder"><i class="ti ti-photo" style="font-size:28px;color:#9FE1CB"></i></div>')
      + '<div class="pcard-body">'
      + '<p class="pcard-name">' + esc(p.name) + '</p>'
      + '<p class="pcard-price">' + esc(p.price) + '</p>'
      + (p.unit ? '<p style="font-size:11px;color:#888">' + esc(p.unit) + '</p>' : '')
      + '<button class="btn-del" onclick="deleteProduct(' + p.id + ')"><i class="ti ti-trash"></i> Delete</button>'
      + '</div></div>';
  }).join('');
}

// ---- Store Rendering ----
function isNew(p) { return (Date.now() - p.addedAt) < 2 * 24 * 60 * 60 * 1000; }
function setCat(c) { curCat = c; renderStore(); }

function renderStore() {
  var allCats = ['All'].concat([...new Set(products.map(function(p) { return p.cat; }).filter(Boolean))]);
  document.getElementById('cats').innerHTML = allCats.map(function(c) {
    return '<button class="cat-btn' + (c === curCat ? ' active' : '') + '" onclick="setCat(\'' + c + '\')">' + esc(c) + '</button>';
  }).join('');

  var filtered = curCat === 'All' ? products : products.filter(function(p) { return p.cat === curCat; });
  var g  = document.getElementById('store-grid');
  var em = document.getElementById('store-empty');

  if (!filtered.length) { g.innerHTML = ''; em.style.display = 'block'; }
  else {
    em.style.display = 'none';
    g.innerHTML = filtered.map(function(p) {
      var n = isNew(p);
      var tagHtml = '';
      if (p.tags) {
        tagHtml = '<p style="margin-top:5px">' + p.tags.split(',').map(function(t) {
          return t.trim() ? '<span style="display:inline-block;background:#e8f5f0;color:#1B6B5A;padding:2px 6px;border-radius:10px;font-size:10px;margin-right:3px">' + esc(t.trim()) + '</span>' : '';
        }).join('') + '</p>';
      }
      return '<div class="scard" onclick="addToCart(' + p.id + ')">'
        + (n ? '<span class="new-badge">New</span>' : '')
        + (p.img ? '<img src="' + p.img + '" alt="' + esc(p.name) + '">' : '<div class="img-placeholder"><i class="ti ti-package" style="font-size:28px;color:#9FE1CB"></i></div>')
        + '<div class="scard-body">'
        + '<p class="scard-name">' + esc(p.name) + '</p>'
        + (p.unit ? '<p class="scard-unit">' + esc(p.unit) + '</p>' : '')
        + '<p class="scard-price">' + esc(p.price) + '</p>'
        + tagHtml
        + '<button class="btn-add"><i class="ti ti-shopping-bag"></i> Buy</button>'
        + '</div></div>';
    }).join('');
  }

  var newPs = products.filter(isNew);
  var ns = document.getElementById('new-arrivals-section');
  if (newPs.length) {
    ns.innerHTML = '<div class="new-arrivals"><h3>✨ New Arrivals</h3><div class="na-scroll">'
      + newPs.map(function(p) {
        return '<div class="na-chip">'
          + (p.img ? '<img src="' + p.img + '" alt="' + esc(p.name) + '">' : '<i class="ti ti-package" style="font-size:18px"></i>')
          + esc(p.name) + '</div>';
      }).join('') + '</div></div>';
  } else {
    ns.innerHTML = '';
  }
}

// ============================================================
//  NEW FLOW: Buy → Review Page → Cart/Checkout → Confirmed
// ============================================================

function addToCart(id) {
  var p = products.find(function(x) { return x.id === id; });
  if (!p) return;
  var ex = cart.find(function(x) { return x.id === id; });
  if (ex) ex.qty++;
  else cart.push({ id: id, qty: 1 });
  updateCartCount();

  // Show review page instead of just adding silently
  showReviewPage(id);
}

function showReviewPage(lastAddedId) {
  document.querySelectorAll('.page').forEach(function(x) { x.classList.remove('active'); });
  document.querySelectorAll('.nav-tab').forEach(function(x) { x.classList.remove('active'); });

  var page = document.getElementById('page-review');
  page.classList.add('active');

  var total = 0;
  var rows = cart.map(function(item) {
    var p = products.find(function(x) { return x.id === item.id; });
    if (!p) return '';
    var priceNum = parseFloat((p.price || '0').replace(/[^\d.]/g, '')) || 0;
    total += priceNum * item.qty;
    var isHighlighted = (item.id === lastAddedId) ? ' review-item-new' : '';
    return '<div class="review-item' + isHighlighted + '">'
      + (p.img ? '<img src="' + p.img + '" alt="' + esc(p.name) + '" class="review-item-img">' : '<div class="review-item-img review-item-placeholder"><i class="ti ti-package"></i></div>')
      + '<div class="review-item-info">'
      + '<p class="review-item-name">' + esc(p.name) + '</p>'
      + '<p class="review-item-price">' + esc(p.price) + (p.unit ? ' · ' + esc(p.unit) : '') + '</p>'
      + '</div>'
      + '<div class="review-qty">'
      + '<button class="qty-btn" onclick="reviewChangeQty(' + item.id + ',-1)">−</button>'
      + '<span class="qty-val">' + item.qty + '</span>'
      + '<button class="qty-btn" onclick="reviewChangeQty(' + item.id + ',1)">+</button>'
      + '</div>'
      + '</div>';
  }).join('');

  document.getElementById('review-items').innerHTML = rows;
  document.getElementById('review-total').textContent = '₹' + Math.round(total);
}

function reviewChangeQty(id, d) {
  var item = cart.find(function(x) { return x.id === id; });
  if (!item) return;
  item.qty += d;
  if (item.qty <= 0) cart = cart.filter(function(x) { return x.id !== id; });
  updateCartCount();
  if (!cart.length) { showPage('store'); return; }
  showReviewPage(null);
}

function goToCheckout() {
  // Show checkout inside cart page
  document.querySelectorAll('.page').forEach(function(x) { x.classList.remove('active'); });
  document.getElementById('page-cart').classList.add('active');
  renderCart();
}

function updateCartCount() {
  var t = cart.reduce(function(a, x) { return a + x.qty; }, 0);
  document.getElementById('cart-count').textContent = t;
}

function changeQty(id, d) {
  var item = cart.find(function(x) { return x.id === id; });
  if (!item) return;
  item.qty += d;
  if (item.qty <= 0) cart = cart.filter(function(x) { return x.id !== id; });
  updateCartCount();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(function(x) { return x.id !== id; });
  updateCartCount();
  renderCart();
}

function renderCart() {
  var ci = document.getElementById('cart-items');
  var ce = document.getElementById('cart-empty');
  var cf = document.getElementById('checkout-form');
  var os = document.getElementById('order-success');
  if (os) os.style.display = 'none';

  if (!cart.length) { ci.innerHTML = ''; ce.style.display = 'block'; cf.style.display = 'none'; return; }
  ce.style.display = 'none'; cf.style.display = 'block';

  var total = 0;
  ci.innerHTML = cart.map(function(item) {
    var p = products.find(function(x) { return x.id === item.id; });
    if (!p) return '';
    var priceNum = parseFloat((p.price || '0').replace(/[^\d.]/g, '')) || 0;
    total += priceNum * item.qty;
    return '<div class="cart-item">'
      + (p.img ? '<img src="' + p.img + '" alt="' + esc(p.name) + '">' : '<div style="width:50px;height:50px;border-radius:8px;background:#e8f5f0;display:flex;align-items:center;justify-content:center"><i class="ti ti-package" style="color:#1B6B5A"></i></div>')
      + '<div class="cart-info">'
      + '<p class="cart-name">' + esc(p.name) + '</p>'
      + '<p class="cart-price">' + esc(p.price) + '</p>'
      + '<div class="qty-box">'
      + '<button class="qty-btn" onclick="changeQty(' + item.id + ',-1)">−</button>'
      + '<span class="qty-val">' + item.qty + '</span>'
      + '<button class="qty-btn" onclick="changeQty(' + item.id + ',1)">+</button>'
      + '<button class="btn-rm" onclick="removeFromCart(' + item.id + ')">Remove</button>'
      + '</div></div></div>';
  }).join('');

  document.getElementById('cart-total-val').textContent = '₹' + Math.round(total);
}

// ---- Place Order → show confirmed page ----
function placeOrder() {
  var name  = document.getElementById('cust-name').value.trim();
  var phone = document.getElementById('cust-phone').value.trim();
  var addr  = document.getElementById('cust-address').value.trim();
  if (!name || !phone) { alert('Please enter your name and phone number!'); return; }
  if (!addr) { alert('Please enter your delivery address!'); return; }

  var items = cart.map(function(ci) {
    var p = products.find(function(x) { return x.id === ci.id; });
    return { name: p ? p.name : '?', qty: ci.qty, price: p ? p.price : '' };
  });
  var total = items.reduce(function(a, i) {
    return a + (parseFloat((i.price || '0').replace(/[^\d.]/g, '')) || 0) * i.qty;
  }, 0);

  var o = {
    id: Date.now(), customer: name, phone: phone, address: addr,
    items: items, total: '₹' + Math.round(total),
    date: new Date().toLocaleString('en-IN'),
    isNew: true
  };
  orders.unshift(o);
  myOrders.unshift(o);

  // Update my orders badge
  updateMyOrdersBadge();

  // Notify owner
  newOrdersCount++;
  localStorage.setItem('dsp_new_orders', newOrdersCount.toString());
  updateAdminBadge();

  save();
  cart = [];
  updateCartCount();
  ['cust-name','cust-phone','cust-address'].forEach(function(id) { document.getElementById(id).value = ''; });

  // Show confirmed page
  showConfirmedPage(o);
}

function showConfirmedPage(order) {
  document.querySelectorAll('.page').forEach(function(x) { x.classList.remove('active'); });
  document.querySelectorAll('.nav-tab').forEach(function(x) { x.classList.remove('active'); });
  document.getElementById('page-confirmed').classList.add('active');

  var itemsList = order.items.map(function(it) {
    return '<div class="confirmed-item"><span>' + esc(it.name) + ' × ' + it.qty + '</span><span>' + esc(it.price) + '</span></div>';
  }).join('');

  document.getElementById('confirmed-body').innerHTML =
    '<div class="confirmed-items-box">' + itemsList + '</div>'
    + '<div class="confirmed-total"><span>Total</span><span>' + esc(order.total) + '</span></div>'
    + '<div class="confirmed-address"><i class="ti ti-map-pin"></i> ' + esc(order.address) + '</div>';
}

// ---- Render Orders ----
function renderOrders() {
  var ol = document.getElementById('orders-list');
  var oe = document.getElementById('orders-empty');
  if (!orders.length) { ol.innerHTML = ''; oe.style.display = 'block'; return; }
  oe.style.display = 'none';
  ol.innerHTML = orders.map(function(o, i) {
    return '<div class="order-card' + (o.isNew ? ' order-card-new' : '') + '">'
      + '<div class="order-head"><span class="order-id">Order #' + (orders.length - i) + '</span><span class="order-date">' + o.date + '</span></div>'
      + (o.isNew ? '<span class="order-new-badge">🔔 New Order</span>' : '')
      + '<p class="order-cust"><i class="ti ti-user"></i> ' + esc(o.customer) + '</p>'
      + '<p class="order-phone"><i class="ti ti-phone"></i> ' + esc(o.phone) + '</p>'
      + (o.address ? '<p class="order-addr"><i class="ti ti-map-pin"></i> ' + esc(o.address) + '</p>' : '')
      + '<div class="order-items">'
      + o.items.map(function(it) {
        return '<div class="order-item"><span>' + esc(it.name) + ' × ' + it.qty + '</span><span>' + esc(it.price) + '</span></div>';
      }).join('')
      + '</div>'
      + '<div class="order-total"><span>Total</span><span>' + esc(o.total) + '</span></div>'
      + '<button class="btn-call" onclick="callCustomer(\'' + o.phone + '\',\'' + esc(o.customer) + '\',this)"><i class="ti ti-phone-call"></i> Call ' + esc(o.customer) + ' to Confirm</button>'
      + '<button class="btn-del-admin-order" onclick="deleteAdminOrder(' + o.id + ')"><i class="ti ti-trash"></i> Delete Order</button>'
      + '</div>';
  }).join('');
}

function callCustomer(phone, name, btn) {
  if (confirm('Call ' + name + ' at ' + phone + '?')) {
    window.open('tel:' + phone);
    // Mark as seen
    var card = btn.closest('.order-card');
    if (card) { card.classList.remove('order-card-new'); }
    orders.forEach(function(o) { if (o.phone === phone) o.isNew = false; });
    save();
  }
}

function deleteAdminOrder(id) {
  if (!confirm('Are you sure you want to delete this order?')) return;
  orders = orders.filter(function(x) { return x.id !== id; });
  save();
  renderOrders();
}
function updateMyOrdersBadge() {
  var badge = document.getElementById('my-orders-badge');
  if (!badge) return;
  if (myOrders.length > 0) {
    badge.textContent = myOrders.length;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

// ---- Render My Orders ----
function renderMyOrders() {
  var ol = document.getElementById('myorders-list');
  var oe = document.getElementById('myorders-empty');
  if (!myOrders.length) { ol.innerHTML = ''; oe.style.display = 'block'; return; }
  oe.style.display = 'none';
  ol.innerHTML = myOrders.map(function(o, i) {
    var itemsHtml = o.items.map(function(it) {
      return '<div class="myorder-item"><span>' + esc(it.name) + ' \u00d7 ' + it.qty + '</span><span>' + esc(it.price) + '</span></div>';
    }).join('');
    return '<div class="myorder-card" id="myorder-' + o.id + '">'
      + '<div class="myorder-head">'
      + '<div>'
      + '<span class="myorder-num">Order #' + (myOrders.length - i) + '</span>'
      + '<span class="myorder-date">' + o.date + '</span>'
      + '</div>'
      + '<button class="btn-del-order" onclick="deleteMyOrder(' + o.id + ')"><i class="ti ti-trash"></i> Cancel</button>'
      + '</div>'
      + '<p class="myorder-addr"><i class="ti ti-map-pin"></i> ' + esc(o.address) + '</p>'
      + '<div class="myorder-items">' + itemsHtml + '</div>'
      + '<div class="myorder-total"><span>Total</span><span>' + esc(o.total) + '</span></div>'
      + '<div class="myorder-status"><i class="ti ti-clock"></i> Waiting for confirmation call</div>'
      + '</div>';
  }).join('');
}

// ---- Delete My Order ----
function deleteMyOrder(id) {
  if (!confirm('Are you sure you want to cancel this order?')) return;
  myOrders = myOrders.filter(function(x) { return x.id !== id; });
  // Also remove from admin orders list
  orders = orders.filter(function(x) { return x.id !== id; });
  save();
  updateMyOrdersBadge();
  renderMyOrders();
}

// ---- Utility ----
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---- Init ----
renderStore();
updateAdminBadge();
updateMyOrdersBadge();
