let plusMode = false;
let confirmCallback = null;
let confirmTitle = '';
let confirmMode = '';
let currentOrder = {};
document.addEventListener('DOMContentLoaded', function() {
    const adminBtn = document.getElementById('admin-btn');
    const adminModal = document.getElementById('admin-modal');
    const closeAdminModal = document.getElementById('close-admin-modal');
    const deleteAllBtn = document.getElementById('delete-all-orders');
    const toggleEditModeBtn = document.getElementById('toggle-edit-mode');
    const editModeStatus = document.getElementById('edit-mode-status');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmNo = document.getElementById('confirm-no');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmModalTitle = document.getElementById('confirm-modal-title');

    let editMode = getEditModeFromStorage();

    if (document.getElementById('bestellungen-list')) {
        if (editModeStatus) editModeStatus.textContent = editMode ? "aktiviert" : "deaktiviert";
        displayOrdersFromLocalStorage(editMode);
        updateSummaryTile();
        updateProductSales();
    }

    if (document.getElementById('weiter-order')) {
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
                handlePresetAmount(parseFloat(btn.getAttribute('data-amount')));
            };
        });
        let plusBtn = document.getElementById('plus-btn');
        if (!plusBtn) {
            plusBtn = document.createElement('button');
            plusBtn.id = 'plus-btn';
            plusBtn.textContent = '+';
            plusBtn.className = 'preset-btn';
            plusBtn.style.background = '#343a40';
            plusBtn.style.color = '#fff';
            plusBtn.style.fontWeight = 'bold';
            plusBtn.onclick = function() {
                plusMode = !plusMode;
                plusBtn.style.background = plusMode ? '#46c546' : '#343a40';
                plusBtn.style.color = plusMode ? '#fff' : '#fff';
            };
            document.querySelector('.preset-amounts').appendChild(plusBtn);
        }
        document.getElementById('custom-amount').oninput = calculateRueckgeld;
        document.getElementById('use-custom-amount').onclick = calculateRueckgeld;
        document.getElementById('submit-order').onclick = submitOrder;
    }
    if (adminBtn && adminModal && closeAdminModal) {
        adminBtn.onclick = (e) => {
            e.preventDefault();
            adminModal.classList.remove('hidden');
        };
        closeAdminModal.onclick = () => adminModal.classList.add('hidden');
        window.addEventListener('click', (e) => {
            if (e.target === adminModal) adminModal.classList.add('hidden');
        });
    }
    if (deleteAllBtn) {
        deleteAllBtn.onclick = () => {
            showDeleteConfirmModal('all');
        };
    }
    if (toggleEditModeBtn) {
        toggleEditModeBtn.onclick = () => {
            editMode = !editMode;
            setEditModeToStorage(editMode);
            if (editModeStatus) editModeStatus.textContent = editMode ? "aktiviert" : "deaktiviert";
            displayOrdersFromLocalStorage(editMode);
        }
    }
    if (confirmYes && confirmNo && confirmModal) {
        confirmYes.onclick = function() {
            if (confirmCallback) confirmCallback();
            confirmCallback = null;
            confirmModal.classList.add('hidden');
        }
        confirmNo.onclick = function() {
            confirmCallback = null;
            confirmModal.classList.add('hidden');
        }
        window.addEventListener('click', function(e) {
            if (e.target === confirmModal) {
                confirmCallback = null;
                confirmModal.classList.add('hidden');
            }
        });
    }
});

function handlePresetAmount(amount) {
    const input = document.getElementById('custom-amount');
    let current = parseFloat(input.value.replace(',', '.')) || 0;
    if (plusMode) {
        input.value = (current + amount).toString().replace('.', ',');
    } else {
        input.value = amount.toString();
    }
    calculateRueckgeld();
}


function addToOrder(name, price) {
    if (!currentOrder[name]) {
        currentOrder[name] = { count: 1, price: price };
    } else {
        currentOrder[name].count += 1;
    }
    renderOrderList();
}

function removeFromOrder(name) {
    if (currentOrder[name]) {
        currentOrder[name].count -= 1;
        if (currentOrder[name].count <= 0) {
            delete currentOrder[name];
        }
        renderOrderList();
    }
}

function renderOrderList() {
    const orderList = document.getElementById('order-list');
    orderList.innerHTML = '';
    let total = 0;

    Object.entries(currentOrder).forEach(([name, obj]) => {
        const { count, price } = obj;
        total += price * count;

        const listItem = document.createElement('li');
        listItem.className = 'order-list-item';

        listItem.innerHTML = `
            <span class="delete-icon" title="Entfernen">&#10060;</span>
            <span class="order-product-name">${count > 1 ? count + "x " : ""}${name}</span>
            <span class="order-product-price">${(price * count).toFixed(2)}€</span>
        `;

        listItem.querySelector('.delete-icon').onclick = function() {
            removeFromOrder(name);
        };

        orderList.appendChild(listItem);
    });

    document.getElementById('total-price').textContent = 'Gesamtpreis: ' + total.toFixed(2) + '€';
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
    calculateRueckgeld();
}

function closePaymentModal() {
    document.getElementById('payment-modal').classList.add('hidden');
    document.body.classList.remove('modal-open');
    const keypad = document.getElementById('custom-keypad');
    if (keypad) keypad.remove();
    plusMode = false;
    if (document.getElementById('plus-btn')) {
        document.getElementById('plus-btn').style.background = '#dbdbdb';
        document.getElementById('plus-btn').style.color = '#2b2b2b';
    }
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
    const rueckgeldElement = document.getElementById('rueckgeld');
    const rueckgeldText = document.getElementById('rueckgeld-text');

    if (rueckgeld > 0) {
        rueckgeldElement.textContent = rueckgeld.toFixed(2);
        rueckgeldText.textContent = "Rückgeld:";
        rueckgeldElement.style.color = "#218838";
    } else if (rueckgeld < 0) {
        rueckgeldElement.textContent = Math.abs(rueckgeld).toFixed(2);
        rueckgeldText.textContent = "Fehlbetrag:";
        rueckgeldElement.style.color = "#b71c1c";
    } else {
        rueckgeldElement.textContent = "0";
        rueckgeldText.textContent = "Rückgeld:";
        rueckgeldElement.style.color = "#222";
    }
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
    let rueckgeld = "0.00";
    let rueckgeldType = "rueckgeld";
    if (document.getElementById('rueckgeld')) {
        rueckgeld = document.getElementById('rueckgeld').textContent || "0.00";
        const rueckgeldText = document.getElementById('rueckgeld-text').textContent;
        if (rueckgeldText.includes("Fehlbetrag")) {
            rueckgeldType = "fehlbetrag";
        }
    }
    const dateTime = new Date();

    function pad2(x) { return x.toString().padStart(2, '0'); }
    const tag = pad2(dateTime.getDate());
    const monat = pad2(dateTime.getMonth() + 1);
    const jahr = dateTime.getFullYear();
    const stunde = pad2(dateTime.getHours());
    const minute = pad2(dateTime.getMinutes());
    const sekunde = pad2(dateTime.getSeconds());
    const formattedDateTime = `${tag}.${monat}.${jahr} ${stunde}:${minute}:${sekunde}`;
    let orderObj = {
        datetime: formattedDateTime,
        items: items,
        total: totalOrderPrice,
        rueckgeld: rueckgeld,
        rueckgeldType: rueckgeldType
    };
    saveOrderToLocalStorage(orderObj);
    const bestellungenList = document.getElementById('bestellungen-list');
    if (bestellungenList) {
        displayOrdersFromLocalStorage(getEditModeFromStorage());
    }
    currentOrder = {};
    renderOrderList();
    document.getElementById('total-price').textContent = 'Gesamtpreis: 0€';
    closePaymentModal();
    updateProductSales();
    updateSummaryTile();
}

function saveOrderToLocalStorage(orderObj) {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(orderObj);
    localStorage.setItem('orders', JSON.stringify(orders));
}

function displayOrdersFromLocalStorage(editMode = false) {
    const bestellungenList = document.getElementById('bestellungen-list');
    if (!bestellungenList) return;
    bestellungenList.innerHTML = "";
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    for (let i = orders.length - 1; i >= 0; i--) {
        const order = orders[i];
        const orderDiv = document.createElement('div');
        orderDiv.classList.add('order');
        if (editMode) orderDiv.classList.add('edit-mode');
        if (order && typeof order === "object" && Array.isArray(order.items)) {
            let rueckgeldInfo = "";
            if (order.rueckgeldType === "fehlbetrag" && parseFloat(order.rueckgeld) > 0) {
                rueckgeldInfo = `<p style="color:#b71c1c;font-weight:normal;margin-top:6px;">Fehlbetrag: <b>${parseFloat(order.rueckgeld).toFixed(2)}€</b></p>`;
            } else if (order.rueckgeldType === "rueckgeld" && parseFloat(order.rueckgeld) > 0) {
                rueckgeldInfo = `<p style="color:#337e29;font-weight:normal;margin-top:6px;">Rückgeld: <b>${parseFloat(order.rueckgeld).toFixed(2)}€</b></p>`;
            }
            const itemsHTML = order.items.map(item => {
                const match = item.match(/^(.+?)\s*-\s*([0-9.,]+)€$/);
                if (match) {
                    return `<li><span>${match[1]}</span><span style="font-weight:600;">${match[2]}€</span></li>`;
                }
                return `<li>${item}</li>`;
            }).join('');
            orderDiv.innerHTML = `
                <h3>Bestellung <span style="font-weight:400;color:#888;font-size:.97em">(${order.datetime})</span></h3>
                <ul>${itemsHTML}</ul>
                <div class="order-total">${order.total}</div>
                ${order.rueckgeldType === "fehlbetrag" && parseFloat(order.rueckgeld) > 0
                    ? `<div class="order-rueckgeld order-fehlbetrag">Fehlbetrag: ${parseFloat(order.rueckgeld).toFixed(2)}€</div>`
                    : order.rueckgeldType === "rueckgeld" && parseFloat(order.rueckgeld) > 0
                    ? `<div class="order-rueckgeld">Rückgeld: ${parseFloat(order.rueckgeld).toFixed(2)}€</div>`
                    : ""
                }
            `;
        } else {
            orderDiv.innerHTML = order;
        }
        if (editMode) {
            const delBtn = document.createElement('button');
            delBtn.className = "delete-order-btn";
            delBtn.innerHTML = "&times;";
            delBtn.title = "Bestellung löschen";
            delBtn.onclick = () => showDeleteConfirmModal(i);
            orderDiv.prepend(delBtn);
        }
        bestellungenList.appendChild(orderDiv);
    }
}

function updateSummaryTile() {
    const totalOrdersElement = document.getElementById('total-orders');
    const totalAmountElement = document.getElementById('total-amount');
    if (!totalOrdersElement || !totalAmountElement) return;
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const totalOrders = orders.length;
    let totalAmount = 0;
    orders.forEach(order => {
        if (order && typeof order === "object" && Array.isArray(order.items)) {
            order.items.forEach(itemText => {
                const priceString = itemText.substring(itemText.lastIndexOf('-') + 1).replace('€', '').trim();
                const price = parseFloat(priceString.replace(/[^\d.,-]/g, '').replace(',', '.'));
                if (!isNaN(price)) totalAmount += price;
            });
        } else if (typeof order === "string") {
            const matches = order.match(/(\d+(?:[.,]\d+)?)€/g);
            if (matches) {
                matches.forEach(m => {
                    const price = parseFloat(m.replace('€', '').replace(',', '.'));
                    if (!isNaN(price)) totalAmount += price;
                });
            }
        }
    });
    totalOrdersElement.textContent = `Anzahl der Bestellungen: ${totalOrders}`;
    totalAmountElement.textContent = `Gesamtbetrag: ${totalAmount.toFixed(2)}€`;
}

function updateProductSales() {
    const productSalesList = document.getElementById('product-sales-list');
    if (!productSalesList) return;

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const productSales = {};

    orders.forEach(order => {
        if (order && typeof order === "object" && Array.isArray(order.items)) {
            order.items.forEach(itemText => {
                const match = itemText.match(/^(\d+)x\s+(.+?)\s*-/);
                if (match) {
                    const count = parseInt(match[1], 10);
                    const product = match[2].trim();
                    productSales[product] = (productSales[product] || 0) + count;
                } else {
                    const fallbackMatch = itemText.match(/^(.+?)\s*-/);
                    if (fallbackMatch) {
                        const product = fallbackMatch[1].trim();
                        productSales[product] = (productSales[product] || 0) + 1;
                    }
                }
            });
        } else if (typeof order === "string") {
            const matches = order.match(/<li>([^<]*)<\/li>/g);
            if (matches) {
                matches.forEach(m => {
                    const itemText = m.replace(/<li>|<\/li>/g, '');
                    const match = itemText.match(/^(\d+)x\s+(.+?)\s*-/);
                    if (match) {
                        const count = parseInt(match[1], 10);
                        const product = match[2].trim();
                        productSales[product] = (productSales[product] || 0) + count;
                    } else {
                        const fallbackMatch = itemText.match(/^(.+?)\s*-/);
                        if (fallbackMatch) {
                            const product = fallbackMatch[1].trim();
                            productSales[product] = (productSales[product] || 0) + 1;
                        }
                    }
                });
            }
        }
    });
    productSalesList.innerHTML = '';

    const sortedSales = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1]);

    for (const [productName, count] of sortedSales) {
        const listItem = document.createElement('li');
        listItem.textContent = `${count}x ${productName}`;
        productSalesList.appendChild(listItem);
    }
}

function setEditModeToStorage(val) {
    localStorage.setItem('editMode', val ? '1' : '0');
}

function getEditModeFromStorage() {
    return localStorage.getItem('editMode') === '1';
}

function showDeleteConfirmModal(orderIndex) {
    const confirmModal = document.getElementById('confirm-modal');
    confirmModal.classList.remove('hidden');
    confirmCallback = function() {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.splice(orderIndex, 1);
        localStorage.setItem('orders', JSON.stringify(orders));
        displayOrdersFromLocalStorage(getEditModeFromStorage());
        updateProductSales();
        updateSummaryTile();
        confirmModal.classList.add('hidden');
    };
}

function showDeleteConfirmModal(indexOrAll) {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));

    const confirmModal = document.getElementById('confirm-modal');
    const confirmModalTitle = document.getElementById('confirm-modal-title');
    confirmModal.classList.remove('hidden');
    confirmModal.focus();

    if (indexOrAll === 'all') {
        confirmModalTitle.textContent = "Wirklich ALLE Bestellungen unwiderruflich löschen?";
        confirmCallback = function() {
            localStorage.removeItem('orders');
            displayOrdersFromLocalStorage(getEditModeFromStorage());
            updateProductSales();
            updateSummaryTile();
            document.getElementById('admin-modal').classList.add('hidden');
        };
    } else {
        confirmModalTitle.textContent = "Wirklich löschen?";
        confirmCallback = function() {
            const orders = JSON.parse(localStorage.getItem('orders')) || [];
            orders.splice(indexOrAll, 1);
            localStorage.setItem('orders', JSON.stringify(orders));
            displayOrdersFromLocalStorage(getEditModeFromStorage());
            updateProductSales();
            updateSummaryTile();
        };
    }
}