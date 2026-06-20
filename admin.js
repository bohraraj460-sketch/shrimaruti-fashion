const API_BASE = "https://shrimaruti-backend.onrender.com";
let adminProducts = []; 
let adminOrders = [];

document.addEventListener("DOMContentLoaded", () => {
    fetchProducts();
    fetchOrders(); 
});

// ==========================================
// --- PRODUCTS LOGIC ---
// ==========================================
async function fetchProducts() {
    try {
        const res = await fetch(`${API_BASE}/api/products`);
        adminProducts = await res.json(); 
        renderProductTable();
        const totalProductsElement = document.getElementById('totalProducts');
        if(totalProductsElement) totalProductsElement.innerText = adminProducts.length;
    } catch (err) {
        console.error("Error fetching products:", err);
    }
}

const addProductForm = document.getElementById('addProductForm');
if(addProductForm) {
    addProductForm.onsubmit = async (e) => {
        e.preventDefault(); 
        const submitBtn = document.querySelector('.btn-submit-product');
        if(submitBtn) {
            submitBtn.innerText = "Injecting..."; 
            submitBtn.disabled = true;
        }

        const formData = new FormData();
        formData.append('title', document.getElementById('prodTitle').value);
        formData.append('price', document.getElementById('prodPrice').value);
        formData.append('discount', document.getElementById('prodDiscount') ? document.getElementById('prodDiscount').value : '10% OFF'); 
        formData.append('desc', document.getElementById('prodDesc') ? document.getElementById('prodDesc').value : 'Premium Quality'); 
        formData.append('category', document.getElementById('prodCategory').value); 
        
        const stockValue = document.getElementById('prodStock') ? document.getElementById('prodStock').value : 10;
        formData.append('stock', stockValue);
        
        const imgFile = document.getElementById('prodImage').files[0];
        if(imgFile) formData.append('image', imgFile);

       try {
            const res = await fetch(`${API_BASE}/api/products`, { method: 'POST', body: formData });
            if (res.ok) {
                alert("🎉 Product Successfully Injected into Live Database!");
                addProductForm.reset(); 
                await fetchProducts(); // Force load naya product array
            } else {
                alert("❌ Server rejected the request. Status: " + res.status);
            }
        } catch (err) {
            console.error("Injection crash details:", err);
            alert("❌ Network Error: Could not connect to Render Database!");
        }

        if(submitBtn) {
            submitBtn.innerText = "Inject to Database"; 
            submitBtn.disabled = false;
        }
    };
}

function renderProductTable() {
    const tbody = document.getElementById('productTableBody'); 
    if(!tbody) return;
    tbody.innerHTML = ""; 
    
    adminProducts.forEach(p => {
        const prodData = JSON.stringify(p).replace(/'/g, "&#39;");
        
        let stockHtml = p.stock > 0 
            ? `<span style="color:#00c853; font-weight:bold;">🟢 ${p.stock} Left in Stock</span>` 
            : `<span style="color:#ff3f6c; font-weight:bold;">🔴 Sold Out (0)</span>`;

        let soldOutBtn = p.stock > 0 
            ? `<button class="btn-action-delete" style="background:rgba(255,63,108,0.1); color:#ff3f6c; border:1px solid #ff3f6c; margin-right:8px; cursor:pointer;" onclick="markSoldOut('${p._id}')">Mark Sold Out</button>` 
            : ``;

        tbody.innerHTML += `
            <tr style="${p.stock <= 0 ? 'background: rgba(255, 63, 108, 0.05);' : ''}">
                <td>
                    <strong style="font-size:15px;">${p.title}</strong> <br>
                    <small style="margin-top:4px; display:inline-block;">${stockHtml}</small>
                </td>
                <td>${p.category || 'Cosmetics'}</td>
                <td style="color:#f7e8b0; font-weight:bold;">₹${p.price}</td>
                <td>
                    <button class="btn-action-delete" style="background:rgba(247,232,176,0.1); color:#f7e8b0; border:1px solid #f7e8b0; margin-right:8px; cursor:pointer;" onclick='openEditModal(${prodData})'>Edit</button>
                    ${soldOutBtn}
                    <button class="btn-action-delete" style="cursor:pointer;" onclick="deleteProduct('${p._id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

async function deleteProduct(id) { 
    try {
        await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' }); 
        fetchProducts(); 
    } catch (err) {
        console.error("Delete product failed:", err);
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

window.saveEditedProduct = async function() {
    const saveBtn = document.getElementById('saveEditBtn');
    if(saveBtn) { saveBtn.innerText = "Saving..."; saveBtn.disabled = true; }
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
            alert("✅ Update Successful!");
            document.getElementById('editModal').style.display = 'none';
            fetchProducts(); 
        } else {
            alert("❌ Update Failed! (Server error)");
        }
    } catch (err) { alert("❌ Error: Connection failed."); }
    if(saveBtn) { saveBtn.innerText = "Save Updates"; saveBtn.disabled = false; }
};

window.markSoldOut = async function(id) {
    if(confirm("⚠️ Kya aap is product ko turant SOLD OUT mark karna chahte hain?")) {
        try {
            const product = adminProducts.find(p => p._id === id);
            const formData = new FormData();
            formData.append('title', product.title);
            formData.append('price', product.price);
            formData.append('category', product.category || 'Cosmetics');
            formData.append('desc', product.desc || '');
            formData.append('discount', product.discount || '10% OFF');
            formData.append('stock', 0); 

            const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'PUT', body: formData });
            if(res.ok) {
                alert("🔴 Product marked as Sold Out!");
                fetchProducts(); 
            } else alert("❌ Action failed!");
        } catch (err) { alert("Server Error!"); }
    }
};

// ==========================================
// --- ORDERS TRACKING LOGIC ---
// ==========================================
async function fetchOrders() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/orders`);
        adminOrders = await res.json(); 
        renderOrdersTable();
    } catch (err) {
        console.error("Error fetching orders:", err);
    }
}

function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if(!tbody) return;
    tbody.innerHTML = "";

    adminOrders.forEach(order => {
        let badgeBg = 'rgba(255,152,0,0.1)'; 
        let badgeColor = '#ff9800';
        if (order.status === 'Delivered') { badgeBg = 'rgba(0,200,83,0.1)'; badgeColor = '#00c853'; }
        if (order.status === 'Cancelled') { badgeBg = 'rgba(255,77,77,0.1)'; badgeColor = '#ff4d4d'; }

        let cancelReasonHtml = order.cancelReason ? `<br><span style="font-size:11px; color:#ff4d4d; display:block; margin-top:4px;"><strong>Reason:</strong> ${order.cancelReason}</span>` : '';

        tbody.innerHTML += `
            <tr style="${order.status === 'Cancelled' ? 'background: rgba(255, 77, 77, 0.05);' : ''}">
                <td><strong>${order.orderId}</strong></td>
                <td>${order.customerName || 'Customer'}</td>
                <td style="color:var(--text-gold); font-weight:bold;">₹${order.total}</td>
                <td>
                    <span style="padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold; background: ${badgeBg}; color: ${badgeColor};">
                        ${order.status || 'Processing'}
                    </span>
                    ${cancelReasonHtml}
                </td>
                <td style="display: flex; gap: 8px; align-items: center;">
                    <select onchange="updateOrderStatus('${order.orderId}', this.value)" style="background:#1a1a26; color:white; border:1px solid #333; padding:5px; border-radius:4px; outline:none;">
                        <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                        <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                    <button onclick="deleteOrder('${order.orderId}')" style="background: rgba(255,77,77,0.1); color: #ff4d4d; border: 1px solid rgba(255,77,77,0.2); padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 14px;" title="Permanently Delete Order">🗑️</button>
                </td>
            </tr>
        `;
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
        else alert("❌ Status update failed!");
    } catch(err) { alert("Server Error!"); }
};

window.deleteOrder = async function(orderId) {
    const confirmDelete = confirm("⚠️ Warning: Kya aap sach mein is order ko database se permanently delete karna chahte hain?");
    if (!confirmDelete) return;

    try {
        const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("✅ Order permanently deleted from database!");
            fetchOrders(); 
        } else {
            alert("❌ Delete karne mein error aaya.");
        }
    } catch (error) {
        console.error("Delete call crash:", error);
        alert("Network error.");
    }
};