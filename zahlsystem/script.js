document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.product-tile').forEach(tile => {
        tile.addEventListener('click', function() {
            const name = tile.getAttribute('data-name');
            const price = parseFloat(tile.getAttribute('data-price'));
            addToOrder(name, price);
        });
    });

    document.getElementById('weiter-order').addEventListener('click', openPaymentModal);

    document.getElementById('close-modal').onclick = closePaymentModal;
    window.onclick = e => {
        if (e.target === document.getElementById('payment-modal')) closePaymentModal();
    };

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.onclick = function() {
            setCustomAmount(btn.getAttribute('data-amount'));
        };
    });

    document.getElementById('custom-amount').oninput = calculateRueckgeld;
    document.getElementById('use-custom-amount').onclick = calculateRueckgeld;

    document.getElementById('submit-order').onclick = submitOrder;

    if (document.getElementById('bestellungen-list')) {
        displayOrdersFromLocalStorage();
        updateSummaryTile();
        updateProductSales();
    }
});

function addToOrder(name, price) {
    const orderList = document.getElementById('order-list');
    const listItem = document.createElement('li');
    listItem.className = 'order-list-item';
    listItem.innerHTML = `
        <span class="delete-icon" title="Entfernen">&#10060;</span>
        <span class="order-product-name">${name}</span>
        <span class="order-product-price">${price}€</span>
    `;
    listItem.querySelector('.delete-icon').onclick = function() {
        updateTotalPrice(-price);
        listItem.remove();
    };
    orderList.appendChild(listItem);
    updateTotalPrice(price);
}

function updateTotalPrice(price) {
    const totalPriceElement = document.getElementById('total-price');
    let current = parseFloat(totalPriceElement.textContent.replace('Gesamtpreis: ', '').replace('€', '')) || 0;
    current += price;
    totalPriceElement.textContent = 'Gesamtpreis: ' + current.toFixed(2) + '€';
}

function openPaymentModal() {
    const modal = document.getElementById('payment-modal');
    document.body.classList.add('modal-open');
    const total = parseFloat(document.getElementById('total-price').textContent.replace('Gesamtpreis: ', '').replace('€', '')) || 0;
    document.getElementById('betrag-modal').textContent = total.toFixed(2);
    setCustomAmount('');
    document.getElementById('rueckgeld').textContent = '0';
    modal.classList.remove('hidden');
    setupCustomKeypad();
}

function closePaymentModal() {
    document.getElementById('payment-modal').classList.add('hidden');
    document.body.classList.remove('modal-open');
    const keypad = document.getElementById('custom-keypad');
    if (keypad) keypad.remove();
}

function setCustomAmount(val) {
    document.getElementById('custom-amount').value = val;
    calculateRueckgeld();
}

function calculateRueckgeld() {
    const total = parseFloat(document.getElementById('betrag-modal').textContent) || 0;
    const input = document.getElementById('custom-amount').value.replace(',', '.');
    const gezahlt = parseFloat(input) || 0;
    let rueckgeld = gezahlt - total;
    document.getElementById('rueckgeld').textContent = rueckgeld > 0 ? rueckgeld.toFixed(2) : '0';
}

function setupCustomKeypad() {
    if (document.getElementById('custom-keypad')) return;
    const customKeypad = document.createElement('div');
    customKeypad.id = "custom-keypad";
    customKeypad.className = "keypad";
    customKeypad.innerHTML = `
        <button>1</button><button>2</button><button>3</button>
        <button>4</button><button>5</button><button>6</button>
        <button>7</button><button>8</button><button>9</button>
        <button>0</button><button>.</button>
        <button id="keypad-clear">⌫</button>
    `;
    const inputParent = document.getElementById('custom-amount').parentNode;
    inputParent.appendChild(customKeypad);
    customKeypad.querySelectorAll('button').forEach(btn => {
        btn.onclick = function() {
            const input = document.getElementById('custom-amount');
            if (btn.id === "keypad-clear") {
                input.value = '';
            } else {
                input.value += btn.textContent;
            }
            calculateRueckgeld();
        };
    });
}

function submitOrder() {
    const orderList = document.getElementById('order-list');
    const totalOrderPrice = document.getElementById('total-price').textContent;
    const items = Array.from(orderList.children).map(item =>
        item.querySelector('.order-product-name').textContent + ' - ' + item.querySelector('.order-product-price').textContent
    );
    if (items.length === 0) return closePaymentModal();
    const newOrder = document.createElement('div');
    newOrder.classList.add('order');
    const dateTime = new Date();
    const formattedDateTime = `${dateTime.toLocaleDateString()} ${dateTime.toLocaleTimeString()}`;
    newOrder.innerHTML = `
        <h3>Bestellung (${formattedDateTime})</h3>
        <ul>
            ${items.map(item => `<li>${item}</li>`).join('')}
        </ul>
        <p><strong>Gesamtpreis:</strong> ${totalOrderPrice}</p>
    `;
    saveOrderToLocalStorage(newOrder.innerHTML);
    const bestellungenList = document.getElementById('bestellungen-list');
    if (bestellungenList) {
        bestellungenList.insertBefore(newOrder, bestellungenList.firstChild);
    }
    orderList.innerHTML = '';
    document.getElementById('total-price').textContent = 'Gesamtpreis: 0€';
    closePaymentModal();
    updateProductSales();
    updateSummaryTile();
}

function saveOrderToLocalStorage(orderHTML) {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(orderHTML);
    localStorage.setItem('orders', JSON.stringify(orders));
}

function displayOrdersFromLocalStorage() {
    const bestellungenList = document.getElementById('bestellungen-list');
    if (!bestellungenList) return;
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    for (let i = orders.length - 1; i >= 0; i--) {
        const orderHTML = orders[i];
        const newOrder = document.createElement('div');
        newOrder.classList.add('order');
        newOrder.innerHTML = orderHTML;
        bestellungenList.appendChild(newOrder);
    }
}

function updateSummaryTile() {
    const totalOrdersElement = document.getElementById('total-orders');
    const totalAmountElement = document.getElementById('total-amount');
    if (!totalOrdersElement || !totalAmountElement) return;
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const totalOrders = orders.length;
    let totalAmount = 0;
    orders.forEach(orderHTML => {
        const order = document.createElement('div');
        order.innerHTML = orderHTML;
        const orderItems = order.querySelectorAll('ul li');
        orderItems.forEach(item => {
            const itemText = item.textContent;
            const priceString = itemText.substring(itemText.lastIndexOf('•') + 1).trim();
            const price = parseFloat(priceString.replace(/[^\d.]/g, ''));
            if (!isNaN(price)) totalAmount += price;
        });
    });
    totalOrdersElement.textContent = `Anzahl der Bestellungen: ${totalOrders}`;
    totalAmountElement.textContent = `Gesamtbetrag: ${totalAmount.toFixed(2)}€`;
}

function updateProductSales() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const productSales = {};
    orders.forEach(orderHTML => {
        const order = document.createElement('div');
        order.innerHTML = orderHTML;
        const orderItems = order.querySelectorAll('ul li');
        orderItems.forEach(item => {
            const itemName = item.textContent.split(' - ')[0].trim();
            if (productSales[itemName]) {
                productSales[itemName]++;
            } else {
                productSales[itemName] = 1;
            }
        });
    });
    const productSalesList = document.getElementById('product-sales-list');
    if (!productSalesList) return;
    productSalesList.innerHTML = '';
    for (const productName in productSales) {
        const listItem = document.createElement('li');
        listItem.textContent = `${productName}: ${productSales[productName]}`;
        productSalesList.appendChild(listItem);
    }
}