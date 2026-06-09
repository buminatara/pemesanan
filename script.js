/* =========================================================================
   CANTEEN DIGITAL SYSTEM - JAVASCRIPT STATE & LOGIC
   ========================================================================= */

// --- Initial Menu Data Seed (Matching menu_database.txt) ---
const SEED_MENUS = [
    { id: 101, name: "Nasi Goreng Kantin 1", price: 15000, stock: 8, stallId: 1 },
    { id: 102, name: "Mie Goreng Spesial", price: 12000, stock: 13, stallId: 1 },
    { id: 103, name: "Nasi Putih Anget", price: 4000, stock: 29, stallId: 1 },
    { id: 201, name: "Ayam Geprek Bawang", price: 18000, stock: 3, stallId: 2 },
    { id: 202, name: "Ayam Bakar Madu", price: 20000, stock: 5, stallId: 2 },
    { id: 203, name: "Tahu Goreng Penyet", price: 2000, stock: 16, stallId: 2 },
    { id: 301, name: "Es Teh Manis Jumbo", price: 4000, stock: 47, stallId: 3 },
    { id: 302, name: "Jus Alpukat Creamy", price: 10000, stock: 12, stallId: 3 },
    { id: 303, name: "Es Jeruk Segar", price: 5000, stock: 15, stallId: 3 },
    { id: 204, name: "Ayam Crispy Saus Keju", price: 19000, stock: 9, stallId: 2 }
];

// --- App State ---
let menus = [];
let cart = [];
let receipts = [];
let activeRole = 'buyer'; // 'buyer', 'seller', 'history'
let activeFilterStall = 'all'; // 'all', '1', '2', '3'
let activeSellerStall = 1; // 1, 2, 3
let activeReceiptId = null; // Currently viewed receipt in history tab

// =========================================================================
// APPLICATION INITIALIZATION
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Load menus from LocalStorage or seed defaults
    const localMenus = localStorage.getItem("canteen_menus");
    if (localMenus) {
        menus = JSON.parse(localMenus);
    } else {
        menus = [...SEED_MENUS];
        saveMenusToStorage();
    }

    // 2. Load receipts from LocalStorage
    const localReceipts = localStorage.getItem("canteen_receipts");
    if (localReceipts) {
        receipts = JSON.parse(localReceipts);
    } else {
        receipts = [];
        saveReceiptsToStorage();
    }

    // 3. Render UI components
    renderStorefront();
    renderCart();
    renderSellerPanel();
    renderGlobalReceiptsHistory();

    // 4. Listen to modal escape press
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMenuModal();
            closeInvoiceModal();
        }
    });
});

// --- State Saver Helpers ---
function saveMenusToStorage() {
    localStorage.setItem("canteen_menus", JSON.stringify(menus));
}

function saveReceiptsToStorage() {
    localStorage.setItem("canteen_receipts", JSON.stringify(receipts));
}

// =========================================================================
// VIEW SWITCHER LOGIC
// =========================================================================
function switchView(role) {
    activeRole = role;

    // Switch active buttons in nav
    document.querySelectorAll('.role-selector .role-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (role === 'buyer') {
        document.getElementById('btn-role-buyer').classList.add('active');
    } else if (role === 'seller') {
        document.getElementById('btn-role-seller').classList.add('active');
        renderSellerPanel(); // Refresh content
    } else if (role === 'history') {
        document.getElementById('btn-role-history').classList.add('active');
        renderGlobalReceiptsHistory(); // Refresh content
    }

    // Switch active view panel with smooth transition
    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetView = document.getElementById(`view-${role}`);
    targetView.classList.add('active');

    showToast(`Beralih ke ${role === 'buyer' ? 'Mode Pembeli' : role === 'seller' ? 'Panel Ibu Kantin' : 'Riwayat Transaksi'}`, 'info');
}

// =========================================================================
// PRODUCTS UTILS & RENDERERS (BUYER MODE)
// =========================================================================
function getFoodEmoji(name) {
    const lower = name.toLowerCase();
    if (lower.includes("nasi goreng")) return "🍛";
    if (lower.includes("mie goreng")) return "🍜";
    if (lower.includes("nasi putih")) return "🍚";
    if (lower.includes("geprek")) return "🍗";
    if (lower.includes("bakar")) return "🍗";
    if (lower.includes("crispy")) return "🍗";
    if (lower.includes("ayam")) return "🐔";
    if (lower.includes("tahu")) return "🧆";
    if (lower.includes("teh")) return "🍹";
    if (lower.includes("alpukat")) return "🥑";
    if (lower.includes("jeruk")) return "🍊";
    if (lower.includes("jus") || lower.includes("es")) return "🥤";
    return "🍽️";
}

function renderStorefront() {
    const container = document.getElementById("menu-cards-container");
    container.innerHTML = "";

    const searchQuery = document.getElementById("search-input").value.toLowerCase();

    // Filter menus based on search query and stall choice
    const filtered = menus.filter(item => {
        const matchesStall = activeFilterStall === 'all' || item.stallId.toString() === activeFilterStall;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery) || item.id.toString().includes(searchQuery);
        return matchesStall && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-message" style="grid-column: 1 / -1; padding: 4rem 0;">
                <i class="fa-solid fa-cookie-bite" style="font-size: 3rem; opacity: 0.3;"></i>
                <p>Menu tidak ditemukan.<br>Silakan ganti kata kunci pencarian atau filter stall.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(item => {
        // Find if this item is in the cart to check temporary stock
        const cartItem = cart.find(c => c.id === item.id);
        const tempStock = cartItem ? item.stock : item.stock; 
        // Note: We decrease stock immediately in menus state when adding to cart, 
        // so menus[index].stock is already reflecting the available stock.

        const card = document.createElement("div");
        card.className = "menu-card";
        
        // Custom accent border color based on Stall
        let colorTheme = "var(--primary)";
        let stallLabel = "Makanan Utama";
        if (item.stallId === 2) {
            colorTheme = "var(--secondary)";
            stallLabel = "Ayam & Gorengan";
        } else if (item.stallId === 3) {
            colorTheme = "var(--accent)";
            stallLabel = "Minuman & Jus";
        }
        card.style.setProperty("--card-accent", colorTheme);

        card.innerHTML = `
            <div class="card-header-info">
                <span class="stall-badge stall-${item.stallId}">${stallLabel}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono)">ID: ${item.id}</span>
            </div>
            <div class="menu-icon-wrapper">${getFoodEmoji(item.name)}</div>
            <div>
                <h3 class="menu-title">${item.name}</h3>
                <div class="menu-meta">
                    <span class="menu-price">Rp ${formatNumber(item.price)}</span>
                    <span class="menu-stock ${item.stock === 0 ? 'empty' : item.stock <= 3 ? 'warning' : ''}">
                        Stok: ${item.stock === 0 ? 'Habis' : item.stock}
                    </span>
                </div>
            </div>
            <div class="order-controls">
                <button class="order-btn-qt" ${item.stock <= 0 ? 'disabled' : ''} onclick="addToCart(${item.id})">
                    <i class="fa-solid fa-cart-plus"></i> Pesan
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterMenus() {
    renderStorefront();
}

function setStallFilter(stallId) {
    activeFilterStall = stallId;
    
    // Toggle active filter button classes
    document.querySelectorAll('#stall-filters .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`#stall-filters .filter-btn[data-stall="${stallId}"]`).classList.add('active');

    renderStorefront();
}

// =========================================================================
// CART MANAGEMENT LOGIC
// =========================================================================
function addToCart(menuId) {
    const menuIndex = menus.findIndex(m => m.id === menuId);
    if (menuIndex === -1) return;

    const item = menus[menuIndex];

    if (item.stock <= 0) {
        showToast("Stok menu ini sudah habis!", "error");
        return;
    }

    // Deduct stock temporarily in memory
    item.stock -= 1;

    // Check if already in cart
    const cartIndex = cart.findIndex(c => c.id === menuId);
    if (cartIndex !== -1) {
        cart[cartIndex].quantity += 1;
        cart[cartIndex].totalCost = cart[cartIndex].quantity * cart[cartIndex].pricePerUnit;
    } else {
        cart.push({
            id: item.id,
            itemName: item.name,
            quantity: 1,
            pricePerUnit: item.price,
            totalCost: item.price,
            stallId: item.stallId
        });
    }

    showToast(`Menambahkan 1 ${item.name} ke keranjang`, "success");
    
    renderStorefront();
    renderCart();
}

function modifyCartQty(menuId, change) {
    const cartIndex = cart.findIndex(c => c.id === menuId);
    if (cartIndex === -1) return;

    const menuIndex = menus.findIndex(m => m.id === menuId);
    if (menuIndex === -1) return;

    const cartItem = cart[cartIndex];
    const item = menus[menuIndex];

    if (change > 0) {
        // Adding more
        if (item.stock <= 0) {
            showToast("Stok sudah tidak mencukupi!", "error");
            return;
        }
        item.stock -= 1;
        cartItem.quantity += 1;
    } else {
        // Subtracting
        item.stock += 1;
        cartItem.quantity -= 1;
    }

    cartItem.totalCost = cartItem.quantity * cartItem.pricePerUnit;

    // Remove if quantity becomes 0
    if (cartItem.quantity <= 0) {
        cart.splice(cartIndex, 1);
        showToast(`Mengeluarkan ${cartItem.itemName} dari keranjang`, "info");
    }

    renderStorefront();
    renderCart();
}

function clearCartAndRestoreStock() {
    if (cart.length === 0) return;

    // Restore stock for all items
    cart.forEach(cartItem => {
        const menuIndex = menus.findIndex(m => m.id === cartItem.id);
        if (menuIndex !== -1) {
            menus[menuIndex].stock += cartItem.quantity;
        }
    });

    cart = [];
    showToast("Keranjang dibatalkan, stok dikembalikan", "warning");

    renderStorefront();
    renderCart();
}

function renderCart() {
    const container = document.getElementById("cart-items-container");
    container.innerHTML = "";

    const cartCountEl = document.getElementById("cart-count");
    const checkoutBtn = document.getElementById("checkout-action-btn");

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-message">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Keranjang Anda kosong.<br>Silakan pilih menu di samping.</p>
            </div>
        `;
        cartCountEl.textContent = "0";
        checkoutBtn.disabled = true;

        document.getElementById("cart-subtotal").textContent = "Rp 0";
        document.getElementById("row-discount").style.display = "none";
        document.getElementById("promo-banner").style.display = "none";
        document.getElementById("cart-tax").textContent = "Rp 0";
        document.getElementById("cart-grandtotal").textContent = "Rp 0";
        return;
    }

    let totalQty = 0;
    let subtotal = 0;

    cart.forEach(item => {
        totalQty += item.quantity;
        subtotal += item.totalCost;

        const cartItemEl = document.createElement("div");
        cartItemEl.className = "cart-item";
        
        let stallName = "Stall 1 - Makanan Utama";
        if (item.stallId === 2) stallName = "Stall 2 - Ayam & Gorengan";
        if (item.stallId === 3) stallName = "Stall 3 - Minuman & Jus";

        cartItemEl.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name" title="${item.itemName}">${item.itemName}</div>
                <div class="cart-item-stall">${stallName}</div>
                <div class="cart-item-price">Rp ${formatNumber(item.pricePerUnit)} / porsi</div>
            </div>
            <div class="cart-item-actions">
                <div class="qty-controls">
                    <button class="qty-btn" onclick="modifyCartQty(${item.id}, -1)">-</button>
                    <div class="qty-val">${item.quantity}</div>
                    <button class="qty-btn" onclick="modifyCartQty(${item.id}, 1)">+</button>
                </div>
                <div class="cart-item-total">Rp ${formatNumber(item.totalCost)}</div>
            </div>
        `;
        container.appendChild(cartItemEl);
    });

    cartCountEl.textContent = totalQty;
    checkoutBtn.disabled = false;

    // Apply Promo Discount flat Rp 5.000 if Subtotal >= Rp 50.000 (Matching C++ code)
    let discount = 0;
    const banner = document.getElementById("promo-banner");
    const rowDisc = document.getElementById("row-discount");
    
    if (subtotal >= 50000) {
        discount = 5000;
        banner.style.display = "flex";
        rowDisc.style.display = "flex";
        document.getElementById("cart-discount").textContent = `-Rp ${formatNumber(discount)}`;
    } else {
        banner.style.display = "none";
        rowDisc.style.display = "none";
    }

    // 10% PPN tax calculation
    const tax = subtotal * 0.10;
    const grandTotal = subtotal - discount + tax;

    document.getElementById("cart-subtotal").textContent = `Rp ${formatNumber(subtotal)}`;
    document.getElementById("cart-tax").textContent = `Rp ${formatNumber(tax)}`;
    document.getElementById("cart-grandtotal").textContent = `Rp ${formatNumber(grandTotal)}`;
}

// =========================================================================
// CHECKOUT & RECEIPT PRINTER LOGIC
// =========================================================================
function checkoutCart() {
    if (cart.length === 0) return;

    // 1. Permanently commit stock modifications
    saveMenusToStorage();

    // 2. Generate Receipt Data structure
    const trxId = "TRX-" + Date.now().toString().slice(-8);
    const dateObj = new Date();
    const dateFormatted = dateObj.toLocaleDateString('id-ID', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const timeFormatted = dateObj.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit'
    });

    let subtotal = 0;
    cart.forEach(o => subtotal += o.totalCost);

    const discount = subtotal >= 50000 ? 5000 : 0;
    const tax = subtotal * 0.10;
    const total = subtotal - discount + tax;

    const receipt = {
        id: trxId,
        date: dateFormatted,
        time: timeFormatted,
        items: [...cart],
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total: total
    };

    // 3. Save receipt globally
    receipts.push(receipt);
    saveReceiptsToStorage();

    // 4. Render Invoice Modal view with paper theme
    renderPaperReceipt(receipt, "invoice-receipt-wrapper");

    // 5. Open Modal
    document.getElementById("invoice-modal").classList.add("active");

    // 6. Reset Cart (Stock is already locked-in)
    cart = [];
    renderCart();
    renderStorefront();
    renderSellerPanel();

    showToast("Checkout berhasil! Struk telah dicetak.", "success");
}

function renderPaperReceipt(receipt, containerId) {
    const wrapper = document.getElementById(containerId);
    wrapper.innerHTML = "";

    const receiptDiv = document.createElement("div");
    receiptDiv.className = "receipt-wrapper";

    let itemsRows = "";
    receipt.items.forEach(item => {
        itemsRows += `
            <tr>
                <td>
                    <strong>${item.itemName}</strong><br>
                    ${item.quantity} x Rp ${formatNumber(item.pricePerUnit)}
                </td>
                <td class="text-right" style="vertical-align: bottom;">
                    Rp ${formatNumber(item.totalCost)}
                </td>
            </tr>
        `;
    });

    let discountRow = "";
    if (receipt.discount > 0) {
        discountRow = `
            <div class="receipt-info-row">
                <span>Diskon Promo:</span>
                <span>-Rp ${formatNumber(receipt.discount)}</span>
            </div>
        `;
    }

    receiptDiv.innerHTML = `
        <div class="receipt-title">Kantin Sekolah</div>
        <div class="receipt-subtitle">Kota Administrasi UAS | Telp: (021) 555-KNTN</div>
        
        <div class="receipt-divider"></div>
        
        <div class="receipt-info-row">
            <span>No Struk:</span>
            <span>${receipt.id}</span>
        </div>
        <div class="receipt-info-row">
            <span>Tanggal:</span>
            <span>${receipt.date}</span>
        </div>
        <div class="receipt-info-row">
            <span>Waktu:</span>
            <span>${receipt.time} WIB</span>
        </div>
        
        <div class="receipt-divider"></div>
        
        <table class="receipt-table">
            <thead>
                <tr>
                    <th style="width: 65%;">Item</th>
                    <th style="width: 35%; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRows}
            </tbody>
        </table>
        
        <div class="receipt-divider"></div>
        
        <div class="receipt-info-row">
            <span>Subtotal:</span>
            <span>Rp ${formatNumber(receipt.subtotal)}</span>
        </div>
        ${discountRow}
        <div class="receipt-info-row">
            <span>PPN (10%):</span>
            <span>Rp ${formatNumber(receipt.tax)}</span>
        </div>
        
        <div class="receipt-divider"></div>
        
        <div class="receipt-info-row" style="font-weight: 700; font-size: 0.95rem;">
            <span>TOTAL BAYAR:</span>
            <span>Rp ${formatNumber(receipt.total)}</span>
        </div>
        
        <div class="receipt-divider"></div>
        <div class="receipt-footer-msg">
            * Terima kasih sudah berbelanja! *<br>
            Harap simpan struk ini sebagai bukti pembayaran.
        </div>
    `;

    wrapper.appendChild(receiptDiv);

    // Set globally active receipt id for download logic
    activeReceiptId = receipt.id;
}

function closeInvoiceModal() {
    document.getElementById("invoice-modal").classList.remove("active");
}

// =========================================================================
// TEXT FILE GENERATOR (Equivalent to C++ output writing to .txt files)
// =========================================================================
function generateReceiptTextFormat(receipt) {
    let text = "";
    text += "=================================================================\n";
    text += "               STRUK PEMESANAN MAKANAN KANTIN                    \n";
    text += "=================================================================\n";
    text += ` No Struk : ${receipt.id}\n`;
    text += ` Tanggal  : ${receipt.date}\n`;
    text += ` Waktu    : ${receipt.time} WIB\n`;
    text += "-----------------------------------------------------------------\n";
    text += " Nama Makanan/Minuman       Jumlah     Harga Satuan     Total    \n";
    text += "-----------------------------------------------------------------\n";
    
    receipt.items.forEach(item => {
        let nameCol = item.itemName.padEnd(26).substring(0, 26);
        let qtyCol = (item.quantity.toString() + " porsi").padEnd(11);
        let unitCol = ("Rp " + formatNumber(item.pricePerUnit)).padEnd(16);
        let totalCol = "Rp " + formatNumber(item.totalCost);
        text += ` ${nameCol} ${qtyCol} ${unitCol} ${totalCol}\n`;
    });

    text += "-----------------------------------------------------------------\n";
    text += ` Subtotal:                             Rp ${formatNumber(receipt.subtotal).padStart(12)}\n`;
    if (receipt.discount > 0) {
        text += ` Diskon Promo:                        -Rp ${formatNumber(receipt.discount).padStart(12)}\n`;
    }
    text += ` Pajak PPN (10%):                      Rp ${formatNumber(receipt.tax).padStart(12)}\n`;
    text += "=================================================================\n";
    text += ` TOTAL BAYAR:                          Rp ${formatNumber(receipt.total).padStart(12)}\n`;
    text += "=================================================================\n";
    text += "      * Terima kasih sudah berbelanja di Kantin Sekolah! *       \n\n";

    // Split Receipts logic matching `receipts_kantin_X.txt`
    for (let s = 1; s <= 3; ++s) {
        const stallItems = receipt.items.filter(item => item.stallId === s);
        if (stallItems.length > 0) {
            let sub = 0;
            stallItems.forEach(i => sub += i.totalCost);

            text += "\n";
            text += "==========================================\n";
            text += ` --- STRUK PESANAN UNTUK IBU KANTIN ${s} ---\n`;
            text += "==========================================\n";
            stallItems.forEach(item => {
                text += ` - ${item.itemName} x ${item.quantity} @ Rp ${formatNumber(item.pricePerUnit)} = Rp ${formatNumber(item.totalCost)}\n`;
            });
            text += ` Subtotal Belanja Stall ${s}: Rp ${formatNumber(sub)}\n`;
            text += "------------------------------------------\n";
        }
    }

    return text;
}

function downloadReceiptAsTxt() {
    if (!activeReceiptId) return;
    const receipt = receipts.find(r => r.id === activeReceiptId);
    if (!receipt) return;

    const textContent = generateReceiptTextFormat(receipt);
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `receipt_${receipt.id}.txt`;
    link.click();
    
    showToast("Struk (.txt) berhasil diunduh!", "success");
}

// =========================================================================
// IBU KANTIN (SELLER MODE LOGIC)
// =========================================================================
function switchSellerStall(stallId) {
    activeSellerStall = stallId;

    // Toggle active buttons in stall tab bar
    document.querySelectorAll('.stall-tab-bar .stall-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });

    const targetTab = document.querySelector(`.stall-tab-bar .stall-tab-btn[data-stall="${stallId}"]`);
    targetTab.classList.add('active');
    targetTab.setAttribute('aria-selected', 'true');

    // Update Title
    const subtitle = stallId === 1 ? 'Makanan Utama' : stallId === 2 ? 'Ayam & Gorengan' : 'Minuman & Jus';
    document.getElementById('seller-stall-title').textContent = `Daftar Menu - Ibu Kantin ${stallId} (${subtitle})`;

    renderSellerPanel();
}

function renderSellerPanel() {
    const tableBody = document.getElementById("seller-menu-rows");
    tableBody.innerHTML = "";

    // 1. Filter menus for current stall
    const stallMenus = menus.filter(m => m.stallId === activeSellerStall);

    // 2. Sort by ID ascending (matching C++ sort algorithm)
    stallMenus.sort((a, b) => a.id - b.id);

    if (stallMenus.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">
                    Belum ada menu di stall ini. Silakan tambah menu baru.
                </td>
            </tr>
        `;
    } else {
        stallMenus.forEach(item => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="cell-id">${item.id}</td>
                <td>
                    <span style="font-size: 1.25rem; margin-right: 0.5rem;">${getFoodEmoji(item.name)}</span>
                    <strong>${item.name}</strong>
                </td>
                <td class="cell-price">Rp ${formatNumber(item.price)}</td>
                <td>
                    <span class="menu-stock ${item.stock === 0 ? 'empty' : item.stock <= 3 ? 'warning' : ''}">
                        ${item.stock} porsi
                    </span>
                </td>
                <td style="text-align: right;">
                    <button class="action-icon-btn edit" onclick="openEditMenuModal(${item.id})" title="Edit Stok & Harga">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="action-icon-btn delete" onclick="deleteMenuItem(${item.id})" title="Hapus Menu">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // 3. Update summary statistics
    document.getElementById("stat-menu-count").textContent = stallMenus.length;
    
    let totalStock = 0;
    stallMenus.forEach(m => totalStock += m.stock);
    document.getElementById("stat-stock-count").textContent = totalStock;

    // Calculate receipts for this vendor stall specifically
    const stallReceiptsCount = receipts.filter(receipt => 
        receipt.items.some(item => item.stallId === activeSellerStall)
    ).length;
    document.getElementById("stat-receipt-count").textContent = stallReceiptsCount;

    // 4. Render stall receipts / orders log
    renderStallReceiptsLog();
}

function renderStallReceiptsLog() {
    const container = document.getElementById("stall-receipts-container");
    container.innerHTML = "";

    // Filter receipts that contain items from this stall
    const stallReceipts = receipts.filter(receipt => 
        receipt.items.some(item => item.stallId === activeSellerStall)
    );

    // Reverse to show newest first
    stallReceipts.reverse();

    if (stallReceipts.length === 0) {
        container.innerHTML = `<div class="empty-stub-message">Belum ada struk masuk untuk Stall ${activeSellerStall}.</div>`;
        return;
    }

    stallReceipts.forEach(receipt => {
        const stub = document.createElement("div");
        stub.className = "receipt-card-stub";
        stub.onclick = () => {
            switchView('history');
            viewHistoryReceipt(receipt.id);
        };

        // Filter items only belonging to this stall for rendering summary in the badge
        const stallItems = receipt.items.filter(item => item.stallId === activeSellerStall);
        let itemsSummary = "";
        let stallSubtotal = 0;

        stallItems.forEach(item => {
            itemsSummary += `<div> - ${item.itemName} x ${item.quantity}</div>`;
            stallSubtotal += item.totalCost;
        });

        stub.innerHTML = `
            <div class="receipt-stub-header">
                <span>${receipt.id}</span>
                <span>${receipt.time}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin: 0.25rem 0;">
                ${itemsSummary}
            </div>
            <div class="receipt-stub-total">
                <div class="d-flex justify-between">
                    <span>Subtotal Stall:</span>
                    <span>Rp ${formatNumber(stallSubtotal)}</span>
                </div>
            </div>
        `;
        container.appendChild(stub);
    });
}

// =========================================================================
// ADD/EDIT MENU FORM MODAL LOGIC
// =========================================================================
function openAddMenuModal() {
    document.getElementById("modal-title").textContent = `Tambah Menu Baru - Stall ${activeSellerStall}`;
    document.getElementById("form-action-mode").value = "add";
    
    // Auto-generate menu ID suggestion based on stall
    // Stall 1: 100+, Stall 2: 200+, Stall 3: 300+
    const prefix = activeSellerStall * 100;
    const sameStallMenus = menus.filter(m => m.stallId === activeSellerStall);
    let nextId = prefix + 1;
    if (sameStallMenus.length > 0) {
        const maxId = Math.max(...sameStallMenus.map(m => m.id));
        nextId = maxId + 1;
    }
    
    document.getElementById("menu-id").value = nextId;
    document.getElementById("menu-id").disabled = false;
    document.getElementById("menu-name").value = "";
    document.getElementById("menu-name").disabled = false;
    document.getElementById("menu-price").value = "";
    document.getElementById("menu-stock").value = "";

    document.getElementById("menu-modal").classList.add("active");
}

function openEditMenuModal(menuId) {
    const item = menus.find(m => m.id === menuId);
    if (!item) return;

    document.getElementById("modal-title").textContent = `Edit Menu #${item.id}`;
    document.getElementById("form-action-mode").value = "edit";
    
    document.getElementById("menu-id").value = item.id;
    document.getElementById("menu-id").disabled = true; // Cannot edit ID
    document.getElementById("menu-name").value = item.name;
    document.getElementById("menu-name").disabled = true; // Cannot edit Name (following matching pointer logic)
    
    document.getElementById("menu-price").value = item.price;
    document.getElementById("menu-stock").value = item.stock;

    document.getElementById("menu-modal").classList.add("active");
}

function closeMenuModal() {
    document.getElementById("menu-modal").classList.remove("active");
}

function saveMenuForm(e) {
    e.preventDefault();

    const mode = document.getElementById("form-action-mode").value;
    const id = parseInt(document.getElementById("menu-id").value);
    const name = document.getElementById("menu-name").value.trim();
    const price = parseFloat(document.getElementById("menu-price").value);
    const stock = parseInt(document.getElementById("menu-stock").value);

    // Validation
    if (isNaN(id) || id <= 0) {
        showToast("ID Menu tidak valid!", "error");
        return;
    }
    if (!name) {
        showToast("Nama menu tidak boleh kosong!", "error");
        return;
    }
    if (isNaN(price) || price < 0) {
        showToast("Harga tidak boleh bernilai negatif!", "error");
        return;
    }
    if (isNaN(stock) || stock < 0) {
        showToast("Stok tidak boleh bernilai negatif!", "error");
        return;
    }

    if (mode === "add") {
        // Unique ID check
        if (menus.some(m => m.id === id)) {
            showToast("Gagal: ID Menu sudah terpakai!", "error");
            return;
        }
        // Unique Name check
        if (menus.some(m => m.name.toLowerCase() === name.toLowerCase())) {
            showToast("Gagal: Nama menu ini sudah terdaftar!", "error");
            return;
        }

        // Add
        menus.push({
            id: id,
            name: name,
            price: price,
            stock: stock,
            stallId: activeSellerStall
        });

        showToast(`Menu "${name}" berhasil terdaftar!`, "success");
    } else {
        // Edit Mode
        const index = menus.findIndex(m => m.id === id);
        if (index === -1) {
            showToast("Menu tidak ditemukan!", "error");
            return;
        }

        menus[index].price = price;
        menus[index].stock = stock;

        showToast(`Menu "${menus[index].name}" diperbarui!`, "success");
    }

    // Save and Refresh
    saveMenusToStorage();
    closeMenuModal();
    renderSellerPanel();
    renderStorefront();
}

function deleteMenuItem(menuId) {
    const item = menus.find(m => m.id === menuId);
    if (!item) return;

    if (confirm(`Apakah Anda yakin ingin menghapus menu "${item.name}" secara permanen?`)) {
        menus = menus.filter(m => m.id !== menuId);
        saveMenusToStorage();
        renderSellerPanel();
        renderStorefront();
        showToast(`Menu "${item.name}" dihapus permanen`, "info");
    }
}

// =========================================================================
// GLOBAL RECEIPTS HISTORY TAB LOGIC
// =========================================================================
function renderGlobalReceiptsHistory() {
    const logListContainer = document.getElementById("global-receipts-log");
    logListContainer.innerHTML = "";

    if (receipts.length === 0) {
        logListContainer.innerHTML = `<div class="empty-stub-message">Belum ada transaksi tersimpan.</div>`;
        document.getElementById("receipt-paper-container").innerHTML = `
            <div class="empty-stub-message" style="margin-top: 8rem;">
                <i class="fa-solid fa-receipt" style="font-size: 3rem; opacity: 0.2; margin-bottom: 1rem; display: block;"></i>
                Pilih salah satu struk di sebelah kiri untuk melihat detail struk.
            </div>
        `;
        return;
    }

    // Sort newest first
    const sorted = [...receipts].reverse();

    sorted.forEach(receipt => {
        const div = document.createElement("div");
        div.className = `receipt-log-item ${activeReceiptId === receipt.id ? 'active' : ''}`;
        div.onclick = () => viewHistoryReceipt(receipt.id);

        div.innerHTML = `
            <div class="d-flex justify-between" style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.2rem;">
                <span>${receipt.id}</span>
                <span>Rp ${formatNumber(receipt.total)}</span>
            </div>
            <div class="d-flex justify-between" style="font-size: 0.75rem; color: var(--text-muted);">
                <span>${receipt.date}</span>
                <span>${receipt.time}</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                ${receipt.items.length} jenis item
            </div>
        `;
        logListContainer.appendChild(div);
    });

    // Render active receipt if present
    if (activeReceiptId) {
        const activeRec = receipts.find(r => r.id === activeReceiptId);
        if (activeRec) {
            renderPaperReceiptInHistory(activeRec);
        }
    }
}

function viewHistoryReceipt(receiptId) {
    activeReceiptId = receiptId;
    
    // Update active highlight classes
    document.querySelectorAll('.receipts-log-list .receipt-log-item').forEach(item => {
        item.classList.remove('active');
    });

    // Re-render list
    renderGlobalReceiptsHistory();
}

function renderPaperReceiptInHistory(receipt) {
    const container = document.getElementById("receipt-paper-container");
    container.innerHTML = "";

    const card = document.createElement("div");
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "center";
    card.style.width = "100%";

    // Render receipt inside
    const receiptWrap = document.createElement("div");
    receiptWrap.id = "history-receipt-wrapper-inner";
    card.appendChild(receiptWrap);

    // Download controls
    const controls = document.createElement("div");
    controls.className = "receipt-buttons";
    controls.style.marginTop = "2rem";
    controls.innerHTML = `
        <button class="btn-primary" onclick="downloadReceiptAsTxt()">
            <i class="fa-solid fa-download"></i> Unduh Struk (.txt)
        </button>
    `;
    card.appendChild(controls);

    container.appendChild(card);

    // Actually draw it
    renderPaperReceipt(receipt, "history-receipt-wrapper-inner");
}

// =========================================================================
// GENERAL UTILITY FUNCTIONS
// =========================================================================
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let icon = "fa-circle-check";
    if (type === "error") icon = "fa-circle-exclamation";
    if (type === "warning") icon = "fa-triangle-exclamation";
    if (type === "info") icon = "fa-circle-info";

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div>${message}</div>
    `;

    container.appendChild(toast);

    // Automatically remove after 3.5 seconds
    setTimeout(() => {
        toast.style.animation = "fadeIn 0.3s reverse forwards";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3200);
}
