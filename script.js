// ========================================================
// ⚡ SHRI MARUTI FASHION - CUSTOMER ENGINE CORE (PART 1)
// ========================================================
const API_BASE = "https://shrimaruti-backend.onrender.com";
let cart = [];
let currentProduct = null;
let allProducts = [];
let isLoggedIn = false; 
let userPhone = "";
let currentQuantities = {};

// DOM Elements Initialization
let authModal, productDetailModal, cartModal, addressModal, successModal, trackOrderModal;

document.addEventListener("DOMContentLoaded", async () => {
    // Sync Modals
    authModal = document.getElementById('authModal');
    productDetailModal = document.getElementById('productDetailModal');
    cartModal = document.getElementById('cartModal');
    addressModal = document.getElementById('addressModal');
    successModal = document.getElementById('successModal');
    trackOrderModal = document.getElementById('trackOrderModal');

    // Fetch and Load Core Database Products
    try {
        const response = await fetch(`${API_BASE}/api/products`);
        allProducts = await response.json();
        renderProducts('All'); 
    } catch (error) { 
        console.error("Server connection error:", error); 
    }

    // Fetch Dynamic Banner For Customers & Editor
    try {
        const bannerRes = await fetch(`${API_BASE}/api/banner`);
        if (bannerRes.ok) {
            const bannerData = await bannerRes.json();
            const heroSection = document.querySelector('.hero-banner');
            const heroText = document.querySelector('.hero-banner h1');
            
            if (heroSection && heroText) {
                if (bannerData.heading !== undefined) heroText.innerText = bannerData.heading;
                if (bannerData.textColor) heroText.style.color = bannerData.textColor;
                if (bannerData.bgColor) heroSection.style.backgroundColor = bannerData.bgColor;
                
                if (bannerData.image && bannerData.image.length > 100) {
                    heroSection.style.background = `url('${bannerData.image}') center/cover no-repeat`;
                }
            }
        }
    } catch (err) { console.error("Banner fetch error:", err); }
              
    // Category Tabs Logic
    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", (e) => {
            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            
            const selectedCategory = e.target.getAttribute('data-category');
            document.querySelectorAll(`.tab[data-category="${selectedCategory}"]`).forEach(t => t.classList.add("active"));
            
            renderProducts(selectedCategory);
            
            const sidebarElement = document.getElementById('sidebar');
            if(sidebarElement) sidebarElement.classList.remove('active');
        });
    });

    attachNavigationTriggers();
});

function attachNavigationTriggers() {
    const menuToggle = document.getElementById('menuToggle'); 
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('closeBtn');

    if (menuToggle && sidebar) menuToggle.addEventListener('click', () => sidebar.classList.add('active'));
    if (closeBtn && sidebar) closeBtn.addEventListener('click', () => sidebar.classList.remove('active'));

    document.querySelectorAll('.bottom-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.innerText;
            if (action.includes('SORT')) document.getElementById('sortModal').style.display = 'flex';
            if (action.includes('FILTER')) document.getElementById('filterModal').style.display = 'flex';
        });
    });

    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        if (li.innerText.includes('Track Orders')) {
            li.addEventListener('click', () => {
                if (sidebar) sidebar.classList.remove('active');
                if (trackOrderModal) {
                    trackOrderModal.style.display = 'flex';
                    document.getElementById('findOrderSection').style.display = 'block';
                    document.getElementById('orderDetailsSection').style.display = 'none';
                }
            });
        }
    });
}

// ==========================================
// 1. PRODUCTS RENDERING MULTI-GRID ALGORITHM (MALL VIBE)
// ==========================================
function renderProducts(category) {
    const container = document.getElementById('dynamicStoreFrontContainer');
    if (!container) return;

    // View Clear state controller
    container.innerHTML = "";

    // Specific category selected route navigation loop
    if (category !== 'All') {
        let displayProducts = allProducts.filter(p => p.category === category);
        buildCategoryRowBlock(category, displayProducts, container);
        return;
    }

    // Default Home view: Extracts all available dynamic grids across database entries
    let categories = [...new Set(allProducts.map(p => p.category || 'General'))];
    
    // Sort trending fields to always load on top row sequence
    categories.sort((a, b) => {
        if(a.toUpperCase().includes("TRENDING")) return -1;
        if(b.toUpperCase().includes("TRENDING")) return 1;
        return 0;
    });

    categories.forEach(catName => {
        let displayProducts = allProducts.filter(p => p.category === catName);
        if (displayProducts.length > 0) {
            buildCategoryRowBlock(catName, displayProducts, container);
        }
    });
}

function buildCategoryRowBlock(catName, productsArray, mainTargetContainer) {
    let emoji = "✨";
    const upperCat = catName.toUpperCase();
    if (upperCat.includes("COSMETIC")) emoji = "💄";
    else if (upperCat.includes("HOSIERY")) emoji = "🧦";
    else if (upperCat.includes("MEN")) emoji = "👨";
    else if (upperCat.includes("TRENDING")) emoji = "🔥";
    else if (upperCat.includes("WOMEN")) emoji = "👗";

    const titleHeader = document.createElement('h2');
    titleHeader.className = "section-title";
    titleHeader.style.cssText = "font-size:24px; margin-top: 35px; font-weight:800; color:#12121a; letter-spacing:0.5px; border-left: 5px solid #ff3f6c; padding-left: 12px; margin-bottom: 15px;";
    titleHeader.innerHTML = `${emoji} ${catName.toUpperCase()}`;

    const productsGridDiv = document.createElement('div');
    productsGridDiv.className = "products-grid";
    
    mainTargetContainer.appendChild(titleHeader);
    mainTargetContainer.appendChild(productsGridDiv);

    renderCustomArray(productsArray, productsGridDiv);
}

function renderCustomArray(array, targetGridElement) {
    if (array.length === 0) {
        targetGridElement.innerHTML = "<p style='padding:20px; font-weight:bold; color:#ff3f6c;'>No products found matching this filter.</p>";
        return;
    }
    
    let htmlContent = "";
    array.forEach(product => {
        const oldPrice = Math.floor(product.price * 1.3);
        const discountTag = product.discount || "10% OFF"; 
        let actualStock = (product.stock !== undefined && product.stock !== null) ? Number(product.stock) : 10;
        
        if (!currentQuantities[product._id]) currentQuantities[product._id] = 1;
        
        let stockHtml = "";
        if (actualStock > 0) {
            stockHtml = `
                <div style="display: flex; justify-content: center; align-items: center; gap: 12px; margin: 10px 0;">
                    <button onclick="event.stopPropagation(); updateQty('${product._id}', -1, ${actualStock})" style="background:#2a2a35; color:white; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:16px;">-</button>
                    <span class="qty-display-${product._id}" style="font-weight:bold; font-size:16px; color:#333;">${currentQuantities[product._id]}</span>
                    <button onclick="event.stopPropagation(); updateQty('${product._id}', 1, ${actualStock})" style="background:#2a2a35; color:white; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:16px;">+</button>
                </div>
                <button class="btn-primary" onclick="event.stopPropagation(); addSmartToCart('${product._id}')" style="width:100%; background:#ff3f6c; color:white; padding:10px; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">Add to Bag</button>
            `;
        } else {
            stockHtml = `
                <div style="margin: 10px 0; color: #ff3f6c; font-weight: 800; letter-spacing: 1px; padding: 6px; text-align:center;">🔴 SOLD OUT</div>
                <button class="btn-primary" disabled style="width:100%; background:#444; color:#888; padding:10px; border:none; border-radius:5px; cursor:not-allowed; font-weight:bold;" onclick="event.stopPropagation();">Out of Stock</button>
            `;
        }

        htmlContent += `
            <div class="product-card" data-full='${JSON.stringify(product).replace(/'/g, "&#39;")}' style="position:relative; cursor:pointer;">
                <div class="discount-badge" style="position:absolute; top:10px; left:10px; background:#ff3f6c; color:white; padding:4px 8px; font-size:12px; font-weight:bold; border-radius:4px; z-index:10;">${discountTag}</div>
                <div class="product-img-wrapper"><img src="${product.image}" class="product-img" style="width: 100%; height:220px; object-fit: cover;"></div>
                <div class="product-details" style="padding: 12px;">
                    <div class="product-title brand-name" style="font-weight:bold; color: black; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.title}</div>
                    <div class="product-price price-row" style="margin-top:5px; font-weight:bold; color: #ff3f6c;">
                        ₹${product.price} <span style="text-decoration:line-through; color:gray; font-size:14px; margin-left:8px;">₹${oldPrice}</span>
                    </div>
                    ${stockHtml}
                </div>
            </div>
        `;
    });
    
    targetGridElement.innerHTML = htmlContent;
    setTimeout(attachProductClickEvent, 200);
}

// ========================================================
// ⚡ SHRI MARUTI FASHION - CUSTOMER ENGINE CORE (PART 2)
// ========================================================

// ==========================================
// 2. PRODUCT DETAILS & REVIEWS CORE BINDING
// ==========================================
function attachProductClickEvent() {
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function() {
            currentProduct = JSON.parse(this.getAttribute('data-full'));
            
            document.getElementById('detailImg').src = currentProduct.image;
            document.getElementById('detailTitle').innerText = currentProduct.title;
            document.getElementById('detailPrice').innerText = `₹${currentProduct.price}`;
            document.getElementById('detailDescription').innerText = currentProduct.desc || "Premium Fashion Item";
            
            const modalAddBtn = document.getElementById('addToCartBtn');
            let actualStock = (currentProduct.stock !== undefined && currentProduct.stock !== null) ? Number(currentProduct.stock) : 10;
            
            if (actualStock > 0) {
                modalAddBtn.innerText = "Add to Bag";
                modalAddBtn.style.background = "#ff3f6c";
                modalAddBtn.style.cursor = "pointer";
                modalAddBtn.disabled = false;
            } else {
                modalAddBtn.innerText = "🔴 Out of Stock";
                modalAddBtn.style.background = "#444";
                modalAddBtn.style.color = "#888";
                modalAddBtn.style.cursor = "not-allowed";
                modalAddBtn.disabled = true;
            }

            const reviewsDiv = document.getElementById('realReviewsList');
            if(reviewsDiv) {
                reviewsDiv.innerHTML = "";
                if (currentProduct.reviews && currentProduct.reviews.length > 0) {
                    currentProduct.reviews.forEach(r => {
                        reviewsDiv.innerHTML += `<div style="border-bottom:1px solid #ddd; padding:8px 0; color:black;"><strong>${r.user}</strong>: ${r.text}</div>`;
                    });
                } else {
                    reviewsDiv.innerHTML = "<p style='color:gray; font-size:14px;'>No reviews yet. Be the first to review!</p>";
                }
            }
            productDetailModal.style.display = 'flex';
        });
    });
}

const closeDetailBtn = document.getElementById('closeDetailBtn');
if(closeDetailBtn) closeDetailBtn.addEventListener('click', () => productDetailModal.style.display = 'none');

document.getElementById('submitReviewBtn').addEventListener('click', async () => {
    if (!isLoggedIn) return alert("Please login to post a review.");
    const text = document.getElementById('newReviewInput').value.trim();
    if (!text) return;

    try {
        const res = await fetch(`${API_BASE}/api/products/${currentProduct._id}/reviews`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: userPhone, text: text, rating: 5 })
        });
        const updated = await res.json();
        currentProduct = updated.product; 
        document.getElementById('newReviewInput').value = "";
        
        const reviewsDiv = document.getElementById('realReviewsList');
        if(reviewsDiv) {
            if(reviewsDiv.innerHTML.includes("No reviews yet")) reviewsDiv.innerHTML = "";
            reviewsDiv.innerHTML += `<div style="border-bottom:1px solid #ddd; padding:8px 0; color:black;"><strong>${userPhone}</strong>: ${text}</div>`;
        }
    } catch (e) { alert("Failed to post review"); }
});

// ==========================================
// 3. REGISTRATION ENGINE & FORCED PROMPTS
// ==========================================
const phoneInput = document.getElementById('phoneInput');
const termsCheck = document.getElementById('termsCheck');
const authContinueBtn = document.getElementById('authContinueBtn');

document.getElementById('profileBtn').addEventListener('click', () => {
    if (isLoggedIn) alert(`Logged in as +91 ${userPhone}`);
    else authModal.style.display = 'flex';
});

function validateAuthForm() {
    if (termsCheck && phoneInput && termsCheck.checked && phoneInput.value.length >= 10) authContinueBtn.classList.add('active');
    else authContinueBtn.classList.remove('active');
}
if(termsCheck) termsCheck.addEventListener('change', validateAuthForm);
if(phoneInput) phoneInput.addEventListener('input', validateAuthForm);

authContinueBtn.addEventListener('click', () => {
    if (phoneInput.value.length < 10) return alert("Enter a valid 10-digit mobile number");
    if (!termsCheck.checked) return alert("Please accept the Terms of Use");
    
    userPhone = phoneInput.value;
    isLoggedIn = true;
    authModal.style.display = 'none';
    alert("Login Successful!");
});

function enforceLogin(callback) {
    if (!isLoggedIn) { authModal.style.display = 'flex'; return; }
    callback();
}

// ==========================================
// 4. BAG, DYNAMIC MATH HOOKS & FLOATING CART
// ==========================================
window.updateQty = function(productId, change, maxStock) {
    if (!currentQuantities[productId]) currentQuantities[productId] = 1;
    let newQty = currentQuantities[productId] + change;
    
    if (newQty < 1) newQty = 1;
    if (newQty > maxStock) { alert(`Only ${maxStock} items left in stock!`); newQty = maxStock; }
    
    currentQuantities[productId] = newQty;
    document.querySelectorAll(`.qty-display-${productId}`).forEach(el => el.innerText = newQty);
};

window.addSmartToCart = function(productId) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;
    const qtyToAdd = currentQuantities[productId] || 1;

    for (let i = 0; i < qtyToAdd; i++) cart.push({ ...product });
    document.getElementById('cartCount').innerText = cart.length;
    
    currentQuantities[productId] = 1;
    document.querySelectorAll(`.qty-display-${productId}`).forEach(el => el.innerText = 1);
    updateFloatingCartUI();
    alert(`🛒 ${qtyToAdd} item(s) added to your bag!`);
};

document.getElementById('addToCartBtn').addEventListener('click', () => {
    if (!currentProduct) return;
    cart.push({ ...currentProduct });
    document.getElementById('cartCount').innerText = cart.length;
    productDetailModal.style.display = 'none';
    updateFloatingCartUI();
});

function updateFloatingCartUI() {
    let fBtn = document.getElementById('floatingCartBtn');
    if (!fBtn) {
        fBtn = document.createElement('div');
        fBtn.id = 'floatingCartBtn';
        fBtn.style.cssText = "position:fixed; bottom:80px; right:20px; background:#ff3f6c; color:white; padding:15px 25px; border-radius:50px; font-weight:bold; font-size:18px; cursor:pointer; z-index:999; box-shadow: 0 4px 10px rgba(0,0,0,0.3);";
        fBtn.onclick = () => document.getElementById('viewCartBtn').click();
        document.body.appendChild(fBtn);
    }
    fBtn.innerText = `🛒 Bag (${cart.length})`;
}

document.getElementById('viewCartBtn').addEventListener('click', (e) => {
    e.preventDefault();
    enforceLogin(() => {
        const list = document.getElementById('cartItemsList');
        list.innerHTML = "";
        let total = 0;
        cart.forEach((item, i) => {
            total += item.price;
            list.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; font-size:16px; border-bottom:1px solid #eee; padding-bottom:10px; color:black;">
                    <span style="display:flex; align-items:center; gap:10px;"><img src="${item.image}" style="width:40px; height:40px; border-radius:4px; object-fit:cover;">${item.title}</span>
                    <span>₹${item.price} <button onclick="cart.splice(${i},1); document.getElementById('viewCartBtn').click(); document.getElementById('cartCount').innerText=cart.length; if(cart.length===0 && document.getElementById('floatingCartBtn')) document.getElementById('floatingCartBtn').remove();" style="border:none; background:none; color:red; font-size:16px; cursor:pointer; margin-left:10px; font-weight:bold;">X</button></span>
                </div>`;
        });
        document.getElementById('cartTotal').innerText = `₹${total}`;
        cartModal.style.display = 'flex';
    });
});
if(document.getElementById('closeCartBtn')) document.getElementById('closeCartBtn').addEventListener('click', () => cartModal.style.display = 'none');

// ==========================================
// 5. SERVER CHECKOUT ENGINE
// ==========================================
document.getElementById('proceedToAddressBtn').addEventListener('click', () => {
    if (cart.length === 0) return alert("Bag is empty!");
    document.getElementById('checkoutAmountDisplay').innerText = document.getElementById('cartTotal').innerText;
    cartModal.style.display = 'none';
    addressModal.style.display = 'flex';
});

window.togglePaymentView = function() {
    const val = document.getElementById('paymentMethod').value;
    document.getElementById('qrSection').style.display = (val === 'UPI') ? 'block' : 'none';
};

document.getElementById('payNowBtn').addEventListener('click', async () => {
    const totalAmt = parseInt(document.getElementById('checkoutAmountDisplay').innerText.replace('₹', ''));
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();

    if(!name || !phone || !address) return alert("Please fill out all address details!");

    try {
        document.getElementById('payNowBtn').innerText = "Processing...";
        const res = await fetch(`${API_BASE}/api/orders`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                items: cart, 
                totalAmount: totalAmt, 
                address: { name, phone, address },
                utr: document.getElementById('utrNumber') ? document.getElementById('utrNumber').value.trim() : ""
            })
        });
        const data = await res.json();
        
        cart = []; 
        document.getElementById('cartCount').innerText = '0';
        if (document.getElementById('floatingCartBtn')) document.getElementById('floatingCartBtn').remove();
        
        addressModal.style.display = 'none';
        document.getElementById('generatedOrderId').innerText = data.orderId || data._id;
        successModal.style.display = 'flex';
        document.getElementById('payNowBtn').innerText = "Place Order";
    } catch (e) { 
        alert("Server Order Error"); 
        document.getElementById('payNowBtn').innerText = "Place Order";
    }
});

window.downloadBill = function() {
    let billWindow = window.open('', '_blank');
    billWindow.document.write(`<h2>SMF Official Invoice</h2><p>Order ID: ${document.getElementById('generatedOrderId').innerText}</p><p>Total Paid: ${document.getElementById('checkoutAmountDisplay').innerText}</p>`);
    billWindow.document.close();
    setTimeout(() => { billWindow.print(); }, 500);
};

// ==========================================
// 6. PIPELINE FILTERS (SORT & BUDGET)
// ==========================================
window.applySort = function(type) {
    let sortedArray = [...allProducts];
    if (type === 'Low') sortedArray.sort((a, b) => a.price - b.price);
    if (type === 'High') sortedArray.sort((a, b) => b.price - a.price);
    
    const container = document.getElementById('dynamicStoreFrontContainer');
    if(container) {
        container.innerHTML = "";
        buildCategoryRowBlock(`SORTED: PRICE ${type}`, sortedArray, container);
    }
    document.getElementById('sortModal').style.display = 'none';
};

window.applyFilter = function() {
    const max = parseInt(document.getElementById('budgetInput').value);
    if (max) {
        const filteredArray = allProducts.filter(p => p.price <= max);
        const container = document.getElementById('dynamicStoreFrontContainer');
        if(container) {
            container.innerHTML = "";
            buildCategoryRowBlock(`FILTERED BUDGET: UNDER ₹${max}`, filteredArray, container);
        }
    }
    document.getElementById('filterModal').style.display = 'none';
};

// ==========================================
// 7. CLIENT ORDER MONITOR TRACKING LOGIC
// ==========================================
let activeTrackOrderId = null; 

window.findMyOrder = async function() {
    const orderId = document.getElementById('trackOrderIdInput').value.trim();
    if (!orderId) return alert("Please enter your Order ID.");

    try {
        const response = await fetch(`${API_BASE}/api/orders/${orderId}`);
        if (!response.ok) return alert("Order ID not found in database.");
        
        const orderData = await response.json();
        activeTrackOrderId = orderData.orderId; 

        document.getElementById('findOrderSection').style.display = 'none';
        document.getElementById('orderDetailsSection').style.display = 'block';
        document.getElementById('displayOrderStatus').innerText = orderData.status || "Processing";
        document.getElementById('displayOrderTotal').innerText = orderData.total || 0; 
    } catch (e) { alert("Tracking failed."); }
};

window.submitCancellation = async function() {
    const reason = document.getElementById('cancelReason').value;
    if (!reason) return alert("Please choose a reason for cancellation.");
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
        const response = await fetch(`${API_BASE}/api/orders/${activeTrackOrderId}/cancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason })
        });

        if (response.ok) {
            alert("Order cancelled successfully.");
            document.getElementById('displayOrderStatus').innerText = "Cancelled";
            document.getElementById('displayOrderStatus').style.color = "red";
            document.getElementById('cancelReason').style.display = 'none';
        } else { alert("Cancellation rejected."); }
    } catch (e) { alert("Network update failed."); }
};

window.closeTrackModal = function() { trackOrderModal.style.display = 'none'; };

// ==========================================
// 🎨 CANVA MODE COMPLEMENTARY LAYOUT ENGINE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'edit') activateVisualEditor();
});

function activateVisualEditor() {
    console.log("🎨 Premium Editor Loaded!");
    const toolbar = document.createElement('div');
    toolbar.style.cssText = "position:fixed; top:20px; right:20px; width:320px; background:rgba(18,18,26,0.95); backdrop-filter:blur(15px); color:white; padding:20px; border-radius:12px; z-index:9999; box-shadow: 0 10px 40px rgba(0,0,0,0.6); border: 1px solid rgba(255, 255, 255, 0.1); font-family:sans-serif;";
    
    toolbar.innerHTML = `
        <h3 style="margin-top:0; border-bottom:1px solid #333; padding-bottom:15px; color:#ff3f6c; font-size:18px; display:flex; justify-content:space-between;">
            <span>🎨 Site Editor</span>
            <span style="font-size:12px; background:#00c853; color:white; padding:3px 8px; border-radius:10px;">Live</span>
        </h3>
        <div style="margin-bottom:15px;">
            <label style="display:block; font-size:13px; margin-bottom:5px; color:#bbb;">Banner Heading</label>
            <input type="text" id="editBannerText" style="width:100%; padding:10px; border-radius:6px; border:1px solid #444; background:#2a2a35; color:white; font-size:14px;">
        </div>
        <div style="margin-bottom:15px; display:flex; gap:15px;">
            <div style="flex:1;">
                <label style="display:block; font-size:13px; margin-bottom:5px; color:#bbb;">Text Color</label>
                <input type="color" id="editTextColor" value="#ffffff" style="width:100%; height:40px; border:none; cursor:pointer;">
            </div>
            <div style="flex:1;">
                <label style="display:block; font-size:13px; margin-bottom:5px; color:#bbb;">BG Color</label>
                <input type="color" id="editBgColor" value="#ff3f6c" style="width:100%; height:40px; border:none; cursor:pointer;">
            </div>
        </div>
        <div style="margin-bottom:25px;">
            <label style="display:block; font-size:13px; margin-bottom:5px; color:#bbb;">Upload Background Image</label>
            <input type="file" id="editBgImage" accept="image/*" style="width:100%; font-size:12px; color:#aaa; background:#2a2a35; padding:8px; border-radius:6px;">
        </div>
        <button id="saveDesignBtn" style="width:100%; background:linear-gradient(45deg, #00c853, #009624); color:white; border:none; padding:12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:15px;">💾 Save Changes</button>
    `;
    document.body.appendChild(toolbar);

    const heroSection = document.querySelector('.hero-banner');
    const heroText = document.querySelector('.hero-banner h1');
    const textInput = document.getElementById('editBannerText');
    const textColorInput = document.getElementById('editTextColor');
    const bgColorInput = document.getElementById('editBgColor');
    const bgImageInput = document.getElementById('editBgImage');

    if (heroText && heroSection) {
        textInput.value = heroText.innerText;
        heroSection.style.border = "3px dashed #ff3f6c";
        
        textInput.addEventListener('input', (e) => heroText.innerText = e.target.value);
        textColorInput.addEventListener('input', (e) => heroText.style.color = e.target.value);
        bgColorInput.addEventListener('input', (e) => {
            heroSection.style.backgroundImage = "none";
            heroSection.style.backgroundColor = e.target.value;
        });
    }

    let currentBase64Image = null;
    if (bgImageInput) {
        bgImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    currentBase64Image = event.target.result; 
                    if (heroSection) heroSection.style.background = `url('${currentBase64Image}') center/cover no-repeat`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    document.getElementById('saveDesignBtn').addEventListener('click', async () => {
        const saveBtn = document.getElementById('saveDesignBtn');
        saveBtn.innerText = "Saving Design... ⏳"; saveBtn.disabled = true;

        const payload = { heading: textInput.value, textColor: textColorInput.value, bgColor: bgColorInput.value };
        if (currentBase64Image) payload.image = currentBase64Image;

        try {
            const response = await fetch(`${API_BASE}/api/banner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                window.showPremiumToast("✅ Saved Successfully!");
                saveBtn.innerText = "💾 Save Changes";
            }
        } catch (err) { console.error(err); }
        finally { saveBtn.disabled = false; }
    });
}

// PREMIUM TOAST SYSTEM OVERRIDE
window.showPremiumToast = function(message) {
    let toast = document.getElementById('premiumToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'premiumToast';
        toast.style.cssText = "position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#282c3f; color:#fff; padding:12px 25px; border-radius:30px; font-weight:600; font-size:14px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; display:none;";
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2500);
};

window.alert = function(msg) { window.showPremiumToast(msg); };