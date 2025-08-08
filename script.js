/* AMD / Intel toggle */
function showBuilds(type) {
  const amd = document.getElementById('amd-builds');
  const intel = document.getElementById('intel-builds');
  const btnAMD = document.getElementById('btn-amd');
  const btnIntel = document.getElementById('btn-intel');

  amd.style.display = (type === 'amd') ? 'grid' : 'none';
  intel.style.display = (type === 'intel') ? 'grid' : 'none';

  btnAMD.classList.toggle('active', type === 'amd');
  btnIntel.classList.toggle('active', type === 'intel');
}

/* Cart */
function addToCart(name, price) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart.push({ name, price });
  localStorage.setItem('cart', JSON.stringify(cart));
  alert(`${name} added to cart!`);
}

function loadCart() {
  const items = JSON.parse(localStorage.getItem('cart') || '[]');
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('total');

  if (!container) return;

  container.innerHTML = '';
  let total = 0;

  if (items.length === 0) {
    container.innerHTML = '<p class="empty">Your cart is empty.</p>';
  } else {
    items.forEach((it, idx) => {
      total += Number(it.price);
      const row = document.createElement('div');
      row.className = 'item';
      row.innerHTML = `
        <div class="item-name">${it.name}</div>
        <div style="display:flex; gap:10px; align-items:center;">
          <div class="item-price">$${Number(it.price).toLocaleString()}</div>
          <button onclick="removeFromCart(${idx})" title="Remove">Remove</button>
        </div>`;
      container.appendChild(row);
    });
  }

  if (totalEl) totalEl.textContent = items.length ? `Total: $${total.toLocaleString()}` : '';
}

function removeFromCart(idx) {
  const items = JSON.parse(localStorage.getItem('cart') || '[]');
  items.splice(idx, 1);
  localStorage.setItem('cart', JSON.stringify(items));
  loadCart();
}

/* Helpers */
function goCheckout() {
  // Send them to Contact page (your quote form)
  window.location.href = 'index.html';
}
