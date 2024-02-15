document.addEventListener('DOMContentLoaded', function() {
    displayOrdersFromLocalStorage();
    updateSummaryTile();
    updateProductSales();
    addSubmitOrderEventListener();
});

function addSubmitOrderEventListener() {
    const submitOrderButton = document.getElementById('submit-order');
    if (submitOrderButton) {
        submitOrderButton.addEventListener('click', submitOrder);
    }
}

function addToOrder(event) {
    if (event.target.classList.contains('menu-item')) {
        const itemName = event.target.getAttribute('data-name');
        const itemPrice = parseFloat(event.target.getAttribute('data-price'));
        const orderList = document.getElementById('order-list');

        const listItem = document.createElement('div');
        listItem.textContent = itemName + ' - ' + itemPrice + '€';

        const deleteButton = document.createElement('span');
        deleteButton.textContent = '❌';
        deleteButton.classList.add('delete-icon');
        deleteButton.onclick = function() {
            listItem.remove();
            updateTotalPrice(-itemPrice);
        };

        listItem.appendChild(deleteButton);
        orderList.appendChild(listItem);

        updateTotalPrice(itemPrice);
    }
}

function updateTotalPrice(price) {
    const totalPriceElement = document.getElementById('total-price');
    let currentTotalPrice = parseFloat(totalPriceElement.textContent.replace('Gesamtpreis: ', '').replace('€', ''));
    currentTotalPrice += price;
    totalPriceElement.textContent = currentTotalPrice.toFixed(2) + '€';
}

function submitOrder() {
    const orderList = document.getElementById('order-list');
    const totalOrderPrice = document.getElementById('total-price').textContent;
    const items = Array.from(orderList.children).map(item => item.textContent);

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

    const bestellungenList = document.getElementById('bestellungen-list');
    if (bestellungenList) {
        bestellungenList.insertBefore(newOrder, bestellungenList.firstChild);
    }

    orderList.innerHTML = '';

    const totalPriceElement = document.getElementById('total-price');
    totalPriceElement.textContent = 'Gesamtpreis: 0€';

    saveOrderToLocalStorage(newOrder.innerHTML);
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

    if (!totalOrdersElement || !totalAmountElement) {
        console.error('Total orders or total amount element not found.');
        return;
    }

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
            if (!isNaN(price)) {
                totalAmount += price;
            }
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