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
                // Text Apply
                if (bannerData.heading !== undefined) heroText.innerText = bannerData.heading;
                
                // Colors Apply
                if (bannerData.textColor) heroText.style.color = bannerData.textColor;
                if (bannerData.bgColor) heroSection.style.backgroundColor = bannerData.bgColor;
                
                // Image Apply (Agar image hai, toh color hide ho jayega)
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
            const matchingTabs = document.querySelectorAll(`.tab[data-category="${selectedCategory}"]`);
            matchingTabs.forEach(t => t.classList.add("active"));
            
            renderProducts(selectedCategory);
            
            const sidebarElement = document.getElementById('sidebar');
            if(sidebarElement) sidebarElement.classList.remove('active');
        });
    });

    // Sidebar & Bottom Nav Triggers
    attachNavigationTriggers();
});

function attachNavigationTriggers() {
    const menuToggle = document.getElementById('menuToggle'); // Hamburger icon
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('closeBtn');

    if (menuToggle && sidebar) menuToggle.addEventListener('click', () => sidebar.classList.add('active'));
    if (closeBtn && sidebar) closeBtn.addEventListener('click', () => sidebar.classList.remove('active'));

    // Sorting & Filtering Open Click Config
    document.querySelectorAll('.bottom-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.innerText;
            if (action.includes('SORT')) document.getElementById('sortModal').style.display = 'flex';
            if (action.includes('FILTER')) document.getElementById('filterModal').style.display = 'flex';
        });
    });

    // Track Orders Sidebar Hook
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
// 1. PRODUCTS RENDERING ALGORITHM
// ==========================================
function renderProducts(category) {
    let displayProducts = category === 'All' ? allProducts : allProducts.filter(p => p.category === category);
    renderCustomArray(displayProducts);
}

function renderCustomArray(array) {
    const liveGrid = document.getElementById('liveProductsGrid');
    const newArrivalsGrid = document.getElementById('newArrivalsGrid'); 
    if (!liveGrid) return;
    
    liveGrid.innerHTML = "";
    if (newArrivalsGrid) newArrivalsGrid.innerHTML = "";
    
    if (array.length === 0) {
        liveGrid.innerHTML = "<p style='padding:20px; font-weight:bold; color:#ff3f6c;'>No products found matching this filter.</p>";
        return;
    }
    
    let htmlContent = "";
    array.forEach(product => {
        const oldPrice = Math.floor(product.price * 1.3);
        const discountTag = product.discount || "10% OFF"; 
        
        // --- SMART STOCK CHECKER ---
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
    
    liveGrid.innerHTML = htmlContent;
    if (newArrivalsGrid) newArrivalsGrid.innerHTML = htmlContent; 
    
    setTimeout(attachProductClickEvent, 200);
}

// ==========================================
// 2. PRODUCT DETAILS & REAL REVIEWS MODAL
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

            // Real Reviews
            const reviewsDiv = document.getElementById('realReviewsList');
            reviewsDiv.innerHTML = "";
            if (currentProduct.reviews && currentProduct.reviews.length > 0) {
                currentProduct.reviews.forEach(r => {
                    reviewsDiv.innerHTML += `<div style="border-bottom:1px solid #ddd; padding:8px 0; color:black;"><strong>${r.user}</strong>: ${r.text}</div>`;
                });
            } else {
                reviewsDiv.innerHTML = "<p style='color:gray; font-size:14px;'>No reviews yet. Be the first to review!</p>";
            }

            productDetailModal.style.display = 'flex';
        });
    });
}

const closeDetailBtn = document.getElementById('closeDetailBtn');
if(closeDetailBtn) closeDetailBtn.addEventListener('click', () => productDetailModal.style.display = 'none');

// Review Submission
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
        if(reviewsDiv.innerHTML.includes("No reviews yet")) reviewsDiv.innerHTML = "";
        reviewsDiv.innerHTML += `<div style="border-bottom:1px solid #ddd; padding:8px 0; color:black;"><strong>${userPhone}</strong>: ${text}</div>`;
    } catch (e) { 
        alert("Failed to post review"); 
    }
});

// ==========================================
// 3. AUTHENTICATION & PROFILE
// ==========================================
const phoneInput = document.getElementById('phoneInput');
const termsCheck = document.getElementById('termsCheck');
const authContinueBtn = document.getElementById('authContinueBtn');

document.getElementById('profileBtn').addEventListener('click', () => {
    if (isLoggedIn) alert(`Logged in as +91 ${userPhone}`);
    else authModal.style.display = 'flex';
});

function validateAuthForm() {
    if (termsCheck.checked && phoneInput.value.length >= 10) authContinueBtn.classList.add('active');
    else authContinueBtn.classList.remove('active');
}

termsCheck.addEventListener('change', validateAuthForm);
phoneInput.addEventListener('input', validateAuthForm);

authContinueBtn.addEventListener('click', () => {
    if (phoneInput.value.length < 10) return alert("Enter a valid 10-digit mobile number");
    if (!termsCheck.checked) return alert("Please accept the Terms of Use");
    
    userPhone = phoneInput.value;
    isLoggedIn = true;
    authModal.style.display = 'none';
    alert("Login Successful!");
});

function enforceLogin(callback) {
    if (!isLoggedIn) {
        authModal.style.display = 'flex'; 
        return;
    }
    callback();
}

// ==========================================
// 4. FLOATING BAG & SMART CART
// ==========================================
window.updateQty = function(productId, change, maxStock) {
    if (!currentQuantities[productId]) currentQuantities[productId] = 1;
    let newQty = currentQuantities[productId] + change;
    
    if (newQty < 1) newQty = 1;
    if (newQty > maxStock) {
        alert(`Only ${maxStock} items left in stock!`);
        newQty = maxStock;
    }
    
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

// View Cart Details
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

document.getElementById('closeCartBtn').addEventListener('click', () => cartModal.style.display = 'none');

// ==========================================
// 5. CHECKOUT FLOW
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
// 6. SORT & FILTER
// ==========================================
window.applySort = function(type) {
    let sortedArray = [...allProducts];
    if (type === 'Low') sortedArray.sort((a, b) => a.price - b.price);
    if (type === 'High') sortedArray.sort((a, b) => b.price - a.price);
    renderCustomArray(sortedArray);
    document.getElementById('sortModal').style.display = 'none';
};

window.applyFilter = function() {
    const max = parseInt(document.getElementById('budgetInput').value);
    if (max) {
        const filteredArray = allProducts.filter(p => p.price <= max);
        renderCustomArray(filteredArray);
    }
    document.getElementById('filterModal').style.display = 'none';
};

// ==========================================
// 7. TRACK & CANCEL ORDER
// ==========================================
let activeTrackOrderId = null; 

window.findMyOrder = async function() {
    const orderId = document.getElementById('trackOrderIdInput').value.trim();
    if (!orderId) return alert("Please enter your Order ID.");

    try {
        const response = await fetch(`${API_BASE}/api/orders/${orderId}`);
        if (!response.ok) return alert("Order ID not found in database.");
        
        const orderData = await response.json();
        
        // 🎯 FIX 1: Backend ko SMF- wala exact ID hi chahiye cancel route ke liye
        activeTrackOrderId = orderData.orderId; 

        document.getElementById('findOrderSection').style.display = 'none';
        document.getElementById('orderDetailsSection').style.display = 'block';
        
        document.getElementById('displayOrderStatus').innerText = orderData.status || "Processing";
        
        // 🎯 FIX 2: Database mein amount 'total' field mein hai, undefined nahi aayega
        document.getElementById('displayOrderTotal').innerText = orderData.total || 0; 
    } catch (e) {
        alert("Tracking failed.");
    }
};

window.submitCancellation = async function() {
    const reason = document.getElementById('cancelReason').value;
    if (!reason) return alert("Please choose a reason for cancellation.");

    const confirmCancel = confirm("Are you sure you want to cancel this order?");
    if (!confirmCancel) return;

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
            
            // Optional: Dropdown aur button hide kar do taaki dubara click na ho
            document.getElementById('cancelReason').style.display = 'none';
            event.target.style.display = 'none'; 
        } else {
            alert("Cancellation rejected. Database mismatch.");
        }
    } catch (e) {
        alert("Network update failed.");
    }
};

window.closeTrackModal = function() {
    trackOrderModal.style.display = 'none';
};
// ==========================================
// 🎨 LIVE VISUAL CUSTOMIZER (CANVA MODE - STEP 1)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'edit') {
        activateVisualEditor();
    }
});
function activateVisualEditor() {
    console.log("🎨 Premium Editor Loaded!");

    // 1. Premium Shopify-Style Floating Panel
    const toolbar = document.createElement('div');
    toolbar.style.cssText = "position:fixed; top:20px; right:20px; width:320px; background:rgba(18,18,26,0.90); backdrop-filter:blur(15px); color:white; padding:20px; border-radius:12px; z-index:9999; box-shadow: 0 10px 40px rgba(0,0,0,0.6); border: 1px solid rgba(255, 255, 255, 0.1); font-family:sans-serif;";
    
    toolbar.innerHTML = `
        <h3 style="margin-top:0; border-bottom:1px solid #333; padding-bottom:15px; color:#ff3f6c; font-size:18px; display:flex; justify-content:space-between;">
            <span>🎨 Site Editor</span>
            <span style="font-size:12px; background:#00c853; color:white; padding:3px 8px; border-radius:10px;">Live</span>
        </h3>
        
        <div style="margin-bottom:15px;">
            <label style="display:block; font-size:13px; margin-bottom:5px; color:#bbb;">Banner Heading</label>
            <input type="text" id="editBannerText" style="width:100%; padding:10px; border-radius:6px; border:1px solid #444; background:#2a2a35; color:white; font-size:14px;" placeholder="Type banner text...">
        </div>

        <div style="margin-bottom:15px; display:flex; gap:15px;">
            <div style="flex:1;">
                <label style="display:block; font-size:13px; margin-bottom:5px; color:#bbb;">Text Color</label>
                <input type="color" id="editTextColor" value="#ffffff" style="width:100%; height:40px; border:none; cursor:pointer; border-radius:6px; background:none;">
            </div>
            <div style="flex:1;">
                <label style="display:block; font-size:13px; margin-bottom:5px; color:#bbb;">BG Color</label>
                <input type="color" id="editBgColor" value="#ff3f6c" style="width:100%; height:40px; border:none; cursor:pointer; border-radius:6px; background:none;">
            </div>
        </div>

        <div style="margin-bottom:25px;">
            <label style="display:block; font-size:13px; margin-bottom:5px; color:#bbb;">Upload Background Image</label>
            <input type="file" id="editBgImage" accept="image/*" style="width:100%; font-size:12px; color:#aaa; background:#2a2a35; padding:8px; border-radius:6px; border:1px solid #444;">
        </div>

        <button id="saveDesignBtn" style="width:100%; background:linear-gradient(45deg, #00c853, #009624); color:white; border:none; padding:12px; border-radius:6px; font-weight:bold; cursor:pointer; margin-bottom:12px; font-size:15px; transition:0.3s;">💾 Save Changes</button>
        <button onclick="window.location.href='index.html'" style="width:100%; background:#444; color:white; border:none; padding:12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:14px; transition:0.3s;">🚪 Exit Editor</button>
    `;
    document.body.appendChild(toolbar);

    // 2. Select Elements to Edit
    const heroSection = document.querySelector('.hero-banner');
    const heroText = document.querySelector('.hero-banner h1');
    
    // 3. Connect Panel Controls to Live UI
    const textInput = document.getElementById('editBannerText');
    const textColorInput = document.getElementById('editTextColor');
    const bgColorInput = document.getElementById('editBgColor');
    const bgImageInput = document.getElementById('editBgImage');

    if (heroText && heroSection) {
        // Pre-fill text box
        textInput.value = heroText.innerText;

        // Visual Indicator that area is editable
        heroSection.style.border = "3px dashed rgba(255, 63, 108, 0.5)";
        heroSection.style.boxSizing = "border-box";

        // Live Event Listeners (Magic Happens Here)
        textInput.addEventListener('input', (e) => heroText.innerText = e.target.value);
        textColorInput.addEventListener('input', (e) => heroText.style.color = e.target.value);
        bgColorInput.addEventListener('input', (e) => {
            heroSection.style.backgroundImage = "none"; // Clear image if color is selected
            heroSection.style.backgroundColor = e.target.value;
        });
        
        bgImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    heroSection.style.background = `url('${event.target.result}') center/cover no-repeat`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

   // 4. THE REAL SAVE LOGIC
    let currentBase64Image = null; // Image data hold karne ke liye variable
    
    bgImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                currentBase64Image = event.target.result; // Base64 string save ki
                heroSection.style.background = `url('${currentBase64Image}') center/cover no-repeat`;
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('saveDesignBtn').addEventListener('click', async () => {
        const saveBtn = document.getElementById('saveDesignBtn');
        saveBtn.innerText = "Saving Design... ⏳";
        saveBtn.disabled = true;

        const payload = {
            heading: textInput.value, // Blank hai toh blank bhejega
            textColor: textColorInput.value,
            bgColor: bgColorInput.value
        };

        if (currentBase64Image) {
            payload.image = currentBase64Image;
        }

        try {
            const response = await fetch(`${API_BASE}/api/banner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                saveBtn.style.background = "#000000";
                saveBtn.innerText = "✅ Saved Successfully!";
                setTimeout(() => {
                    saveBtn.style.background = "linear-gradient(45deg, #00c853, #009624)";
                    saveBtn.innerText = "💾 Save Changes";
                }, 2000);
            } else {
                alert("❌ Save failed. Backend error.");
            }
        } catch (err) {
            console.error("Save Error:", err);
        } finally {
            saveBtn.disabled = false;
        }
    });
}
