// ========================================================
// ⚡ SHRI MARUTI FASHION - ADMIN ENGINE CORE (PART 1)
// ========================================================
const API_BASE = "https://shrimaruti-backend.onrender.com";
let adminProducts = []; 
let adminOrders = [];

// Static directory template data packet for cleaner processing layout
let mockCustomers = [
    { name: "Bohra Raj Anilbhai", phone: "+91 98765 43210" },
    { name: "Maheshbhai Patel", phone: "+91 99041 23456" },
    { name: "Sanjay Shah", phone: "+91 88665 99887" }
];

document.addEventListener("DOMContentLoaded", () => {
    fetchProducts();
    fetchOrders(); 
    setupProductFormSubmission();
    setupLiveStoreRedirection();
});

// --- LIVE STORE WORKING PATH CONNECTOR ---
function setupLiveStoreRedirection() {
    const liveBtn = document.getElementById('liveStoreNavBtn');
    if (liveBtn) {
        liveBtn.onclick = () => {
            window.open('http://127.0.0.1:5500/index.html', '_blank');
        };
    }
}

// --- CORE DATABASE DATA PACKET FETCHERS ---
async function fetchProducts() {
    try {
        const res = await fetch(`${API_BASE}/api/products`);
        adminProducts = await res.json(); 
        renderCompactProductStrips();
        
        const totalProductsElement = document.getElementById('totalProducts');
        if(totalProductsElement) totalProductsElement.innerText = adminProducts.length;
    } catch(err) { console.error("Product fetching pipeline down:", err); }
}

async function fetchOrders() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/orders`);
        adminOrders = await res.json(); 
        renderCompactOrderStrips();
        renderCustomerDirectoryStrips(); // Sync directory data grid layout
    } catch(err) { console.error("Orders vector connection offline:", err); }
}

// --- VIEWPORT 1: COMPACT SINGLE-COLUMN PRODUCT STRIPS RENDERING ---
function renderCompactProductStrips() {
    const container = document.getElementById('productTableBody'); 
    if(!container) return;
    container.innerHTML = ""; 
    
    adminProducts.forEach(p => {
        const prodData = JSON.stringify(p).replace(/'/g, "&#39;");
        
        let stockIndicator = p.stock > 0 
            ? `<span style="color:#00c853; font-weight:bold;">🟢 ${p.stock} Pcs</span>` 
            : `<span style="color:#ff3f6c; font-weight:bold;">🔴 SOLD OUT</span>`;

        let soldOutActionBtn = p.stock > 0 
            ? `<button class="strip-btn" style="background:rgba(255,63,108,0.1); color:#ff3f6c; border:1px solid #ff3f6c;" onclick="markSoldOut('${p._id}')">Sold Out</button>` 
            : ``;

        const stripRow = document.createElement('div');
        stripRow.className = "compact-data-strip";
        stripRow.innerHTML = `
            <span><strong>${p.title}</strong><br><small style="margin-top:4px; display:inline-block;">${stockIndicator}</small></span>
            <span style="color:#8c8c9e; font-weight:600;">${p.category || 'Cosmetics'}</span>
            <div class="action-row-btns">
                <span style="color:#fff; font-weight:bold; margin-right:15px; font-size:14px;">₹${p.price}</span>
                <button class="strip-btn" style="background:rgba(247,232,176,0.1); color:#f7e8b0; border:1px solid #f7e8b0;" onclick='openEditModal(${prodData})'>Edit</button>
                ${soldOutActionBtn}
                <button class="strip-btn" style="background:rgba(255,77,77,0.1); color:#ff4d4d; border:1px solid rgba(255,77,77,0.2);" onclick="deleteProduct('${p._id}')">Delete</button>
            </div>
        `;
        container.appendChild(stripRow);
    });
}

// --- CRITICAL DATA DISPOSAL HOOKS ---
async function deleteProduct(id) { 
    if(confirm("❌ Purge item from database permanently?")) {
        await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' }); 
        fetchProducts(); 
    }
}

window.openEditModal = function(product) {
    document.getElementById('editProdId').value = product._id;
    document.getElementById('editProdTitle').value = product.title;
    document.getElementById('editProdPrice').value = product.price;
    document.getElementById('editProdDiscount').value = product.discount || '10% OFF';
    document.getElementById('editProdDesc').value = product.desc || '';
    document.getElementById('editProdCategory').value = product.category || 'Cosmetics';
    
    if(document.getElementById('editProdStock')) {
        document.getElementById('editProdStock').value = product.stock !== undefined ? product.stock : 10;
    }
    document.getElementById('editModal').style.display = 'flex';
};
// ========================================================
// ⚡ SHRI MARUTI FASHION - ADMIN ENGINE CORE (PART 2)
// ========================================================

window.saveEditedProduct = async function() {
    const saveBtn = document.getElementById('saveEditBtn');
    saveBtn.innerText = "Saving... ⏳"; saveBtn.disabled = true;
    try {
        const id = document.getElementById('editProdId').value;
        const formData = new FormData();
        formData.append('title', document.getElementById('editProdTitle').value);
        formData.append('price', document.getElementById('editProdPrice').value);
        formData.append('discount', document.getElementById('editProdDiscount').value); 
        formData.append('desc', document.getElementById('editProdDesc').value); 
        formData.append('category', document.getElementById('editProdCategory').value); 
        
        if(document.getElementById('editProdStock')) {
            formData.append('stock', document.getElementById('editProdStock').value);
        }
        
        const fileInput = document.getElementById('editProdImage');
        if(fileInput && fileInput.files.length > 0) formData.append('image', fileInput.files[0]);

        const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'PUT', body: formData });
        if(res.ok) {
            alert("✅ Update Successful Across Server Grid!");
            document.getElementById('editModal').style.display = 'none';
            fetchProducts(); 
        } else {
            alert("❌ Update Failed! (Server logic error)");
        }
    } catch (err) { alert("❌ Error: Connection timeout."); }
    saveBtn.innerText = "Save Updates"; saveBtn.disabled = false;
};

// --- 1-CLICK SOLD OUT OPTIMIZED PATCH ---
window.markSoldOut = async function(id) {
    if(confirm("⚠️ Is product ko live store par SOLD OUT mark kar dein?")) {
        try {
            const product = adminProducts.find(p => p._id === id);
            const formData = new FormData();
            formData.append('title', product.title);
            formData.append('price', product.price);
            formData.append('category', product.category || 'Cosmetics');
            formData.append('desc', product.desc || 'Premium Quality');
            formData.append('discount', product.discount || '10% OFF');
            formData.append('stock', 0); // Directly locked to absolute 0 units

            const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'PUT', body: formData });
            if(res.ok) {
                alert("🔴 Product status switched to OUT OF STOCK!");
                fetchProducts(); 
            } else alert("❌ Action terminated by backend.");
        } catch (err) { alert("Server Connection Crash!"); }
    }
};

// --- VIEWPORT 2: SINGLE-LINE ORDERS TRACKER RENDERING ---
function renderCompactOrderStrips() {
    const container = document.getElementById('ordersTableBody');
    if(!container) return;
    container.innerHTML = "";

    adminOrders.forEach(order => {
        let badgeBg = 'rgba(255,152,0,0.1)'; 
        let badgeColor = '#ff9800';
        if (order.status === 'Delivered') { badgeBg = 'rgba(0,200,83,0.1)'; badgeColor = '#00c853'; }
        if (order.status === 'Cancelled') { badgeBg = 'rgba(255,77,77,0.1)'; badgeColor = '#ff4d4d'; }

        let cancelReasonText = order.cancelReason ? ` | <span style="color:#ff4d4d;">Reason: ${order.cancelReason}</span>` : '';

        const stripRow = document.createElement('div');
        stripRow.className = "compact-data-strip";
        stripRow.innerHTML = `
            <span><strong>ID: ${order.orderId || order._id}</strong><br><small style="color:#8c8c9e;">Client: ${order.customerName || 'Guest Verified'}${cancelReasonText}</small></span>
            <span style="padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold; background: ${badgeBg}; color: ${badgeColor}; max-width:120px; text-align:center;">${order.status || 'Processing'}</span>
            <div class="action-row-btns">
                <span style="color:var(--text-gold); font-weight:bold; margin-right:15px;">₹${order.total}</span>
                <select onchange="updateOrderStatus('${order.orderId}', this.value)" style="background:#161622; color:white; border:1px solid #242436; padding:6px; border-radius:6px; outline:none;">
                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
                <button class="strip-btn" style="background:rgba(255,77,77,0.1); color:#ff4d4d; border:1px solid rgba(255,77,77,0.2);" onclick="deleteOrder('${order.orderId}')">🗑️</button>
            </div>
        `;
        container.appendChild(stripRow);
    });
}

window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if(res.ok) fetchOrders(); 
        else alert("❌ Status synchronization failed.");
    } catch(err) { alert("Server Endpoint Offline."); }
};

window.deleteOrder = async function(orderId) {
    if(confirm("⚠️ Warning: Kya aap sach mein is order ko database se permanently delete karna chahte hain?")) {
        try {
            const response = await fetch(`${API_BASE}/api/orders/${orderId}`, { method: 'DELETE' });
            if (response.ok) {
                alert("✅ Order permanently purged from cluster!");
                fetchOrders(); 
            } else alert("❌ Delete permission denied.");
        } catch (error) { alert("Network communication crash."); }
    }
};

// --- VIEWPORT 3: CUSTOMER PHONE DIRECTORY GENERATOR ---
function renderCustomerDirectoryStrips() {
    const container = document.getElementById('customersTableBody');
    if(!container) return;
    container.innerHTML = "";

    mockCustomers.forEach(cust => {
        const stripRow = document.createElement('div');
        stripRow.className = "compact-data-strip";
        stripRow.innerHTML = `
            <span><strong>👤 ${cust.name}</strong></span>
            <span style="color:var(--text-gold); font-weight:bold; font-size:14px;">${cust.phone}</span>
            <div class="action-row-btns">
                <button class="strip-btn" style="background:#242436; color:white;" onclick="alert('Client profile tracking active.')">View Logs</button>
            </div>
        `;
        container.appendChild(stripRow);
    });
}

// --- NEW GRID SIDEBAR DEPLOYMENT HOOK ENGINE ---
window.triggerGridDeployment = async function() {
    const targetSection = document.getElementById('gridTargetSection').value;
    const gridName = document.getElementById('newGridNameInput').value.trim();

    if(!gridName) {
        alert("🚨 Dynamic name mapping cannot be empty!");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/banner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ heading: gridName, categoryScope: targetSection, isNewGridTrigger: true })
        });
        if(response.ok) {
            alert(`🎉 Grid Row "${gridName}" completely injected into live store cluster!`);
            document.getElementById('newGridNameInput').value = "";
            document.getElementById('sidebarGridDropdown').style.display = 'none';
        }
    } catch (err) { alert("Grid sync operation timed out."); }
};

// --- NEW DEPLOY PRODUCT FORM INITIALIZATION ---
function setupProductFormSubmission() {
    const form = document.getElementById('addProductForm');
    if(!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault(); 
        const submitBtn = form.querySelector('.btn-submit-product');
        submitBtn.innerText = "Injecting Packet... ⏳"; submitBtn.disabled = true;

        const formData = new FormData();
        formData.append('title', document.getElementById('prodTitle').value);
        formData.append('price', document.getElementById('prodPrice').value);
        formData.append('discount', document.getElementById('prodDiscount').value); 
        formData.append('desc', document.getElementById('prodDesc').value); 
        formData.append('category', document.getElementById('prodCategory').value); 
        formData.append('stock', document.getElementById('prodStock').value || 10);
        
        const imgFile = document.getElementById('prodImage').files[0];
        if(imgFile) formData.append('image', imgFile);

        const res = await fetch(`${API_BASE}/api/products`, { method: 'POST', body: formData });
        if(res.ok) {
            alert("🎉 Product injected successfully!");
            form.reset(); 
            fetchProducts(); 
        } else {
            alert("❌ Database insertion rejected.");
        }
        submitBtn.innerText = "Inject to Database"; submitBtn.disabled = false;
    };
}