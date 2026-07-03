// app.js

// Initialize Supabase
const supabaseUrl = 'https://tvfmtjwslsmfevwxbozr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Zm10andzbHNtZmV2d3hib3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwODM0MjEsImV4cCI6MjA5ODY1OTQyMX0.6Cq514dox_nYnfWrHBbi7MiDJoljig0UJlCn_yK8wkI';

// Use 'supabaseClient' to avoid conflict with global 'supabase'
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// State management
let items = [];
let currentEditId = null;
let itemToDeleteId = null;
let isLoading = false;

// DOM Elements - Sidebar & Layout
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const menuBtn = document.getElementById('menuBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const addBtnMobile = document.getElementById('addBtnMobile');

// DOM Elements - Form
const itemForm = document.getElementById('itemForm');
const sidebarFormTitle = document.getElementById('sidebarFormTitle');
const itemIdInput = document.getElementById('itemId');
const itemNameInput = document.getElementById('itemName');
const itemCategoryInput = document.getElementById('itemCategory');
const itemStockInput = document.getElementById('itemStock');
const itemBuyPriceInput = document.getElementById('itemBuyPrice');
const itemSellPriceInput = document.getElementById('itemSellPrice');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const submitBtn = itemForm.querySelector('button[type="submit"]');

// DOM Elements - Dashboard
const dashTotal = document.getElementById('dashTotal');
const dashStock = document.getElementById('dashStock');
const dashCapital = document.getElementById('dashCapital');
const dashProfit = document.getElementById('dashProfit');

// DOM Elements - Lists & Ticker
const itemTableBody = document.getElementById('itemTableBody');
const itemList = document.getElementById('itemList');
const emptyState = document.getElementById('emptyState');
const tableWrapper = document.getElementById('tableWrapper');
const tickerTrack = document.getElementById('tickerTrack');
const searchInput = document.getElementById('searchInput');

// DOM Elements - Delete Modal
const deleteModal = document.getElementById('deleteModal');
const deleteItemName = document.getElementById('deleteItemName');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Utility Functions
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
};

// Sidebar Toggle Functions
const openSidebar = () => {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('visible');
};

const closeSidebar = () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('visible');
};

menuBtn.addEventListener('click', openSidebar);
closeSidebarBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);
addBtnMobile.addEventListener('click', () => {
    resetForm();
    openSidebar();
});

// Reset Form
const resetForm = () => {
    itemForm.reset();
    currentEditId = null;
    sidebarFormTitle.innerHTML = '<span class="section-icon">＋</span> Tambah Barang';
    cancelEditBtn.classList.add('hidden');
    submitBtn.textContent = 'Simpan';
};

cancelEditBtn.addEventListener('click', resetForm);

// Dashboard Calculation
const updateDashboard = (itemsToProcess) => {
    const totalItems = itemsToProcess.length;
    let totalStock = 0;
    let totalCapital = 0;
    let totalProfit = 0;

    itemsToProcess.forEach(item => {
        totalStock += item.stock;
        totalCapital += (item.stock * item.buy_price);
        totalProfit += (item.stock * (item.sell_price - item.buy_price));
    });

    dashTotal.textContent = totalItems;
    dashStock.textContent = totalStock;
    dashCapital.textContent = formatRupiah(totalCapital);
    dashProfit.textContent = formatRupiah(totalProfit);
};

// Ticker Update
const updateTicker = (itemsToProcess) => {
    tickerTrack.innerHTML = '';
    if (itemsToProcess.length === 0) {
        tickerTrack.innerHTML = '<span class="ticker-placeholder">Belum ada barang untuk ditampilkan di ticker.</span>';
        return;
    }

    // Create multiple items to make it loop smoothly
    const tickerContent = itemsToProcess.map(item => `
        <div class="ticker-item">
            <span class="t-name">${item.name}</span>
            <span class="t-sep">•</span>
            <span class="t-stock">${item.stock} stok</span>
            <span class="t-sep">•</span>
            <span class="t-price">${formatRupiah(item.sell_price)}</span>
        </div>
    `).join('');

    // Duplicate content for infinite scrolling effect
    tickerTrack.innerHTML = tickerContent + tickerContent + tickerContent;
};

// Fetch data from Supabase
const fetchItems = async () => {
    isLoading = true;
    renderLoadingState();
    
    try {
        const { data, error } = await supabaseClient
            .from('inventory_items')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        items = data;
    } catch (error) {
        console.error('Error fetching items:', error.message);
        alert('Gagal mengambil data dari server.');
    } finally {
        isLoading = false;
        
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            const filteredItems = items.filter(item => 
                item.name.toLowerCase().includes(searchTerm)
            );
            renderAll(filteredItems);
        } else {
            renderAll(items);
        }
    }
};

const renderLoadingState = () => {
    emptyState.classList.remove('hidden');
    emptyState.querySelector('.empty-icon').textContent = '⏳';
    emptyState.querySelector('p').textContent = 'Memuat data...';
    emptyState.querySelector('.empty-sub').textContent = 'Harap tunggu sebentar.';
    tableWrapper.classList.add('hidden');
    itemList.classList.add('hidden');
};

const renderAll = (itemsToRender) => {
    updateDashboard(itemsToRender);
    updateTicker(itemsToRender);
    
    itemTableBody.innerHTML = '';
    itemList.innerHTML = '';

    if (itemsToRender.length === 0) {
        emptyState.classList.remove('hidden');
        emptyState.querySelector('.empty-icon').textContent = '📦';
        emptyState.querySelector('p').textContent = 'Belum ada barang.';
        emptyState.querySelector('.empty-sub').textContent = 'Gunakan form di sidebar untuk menambahkan barang baru.';
        tableWrapper.classList.add('hidden');
        // Keep mobile item list hidden (already empty)
    } else {
        emptyState.classList.add('hidden');
        tableWrapper.classList.remove('hidden');
        // Note: item-list is shown via media query on mobile, we just populate it
        
        itemsToRender.forEach(item => {
            const isLowStock = parseInt(item.stock) <= 5;
            const profitPerUnit = item.sell_price - item.buy_price;

            // --- Desktop Table Row ---
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span class="table-name">${item.name}</span>
                    <span class="table-category">${item.category}</span>
                </td>
                <td class="num"><span class="table-stock-badge ${isLowStock ? 'low' : ''}">${item.stock}</span></td>
                <td class="num">${formatRupiah(item.buy_price)}</td>
                <td class="num">${formatRupiah(item.sell_price)}</td>
                <td class="num profit-value">${formatRupiah(profitPerUnit)}</td>
                <td class="act">
                    <div class="table-actions">
                        <button class="btn-icon edit" onclick="openEditMode('${item.id}')" aria-label="Edit Item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-icon delete" onclick="openDeleteModal('${item.id}', '${item.name}')" aria-label="Hapus Item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </td>
            `;
            itemTableBody.appendChild(tr);

            // --- Mobile Card ---
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-header">
                    <div>
                        <h3 class="item-name">${item.name}</h3>
                        <span class="item-category">${item.category}</span>
                    </div>
                    <div class="item-stock ${isLowStock ? 'stock-low' : ''}">
                        ${item.stock} Stok
                    </div>
                </div>
                
                <div class="item-prices">
                    <div class="price-box">
                        <span class="price-label">Harga Beli</span>
                        <span class="price-value">${formatRupiah(item.buy_price)}</span>
                    </div>
                    <div class="price-box">
                        <span class="price-label">Harga Jual</span>
                        <span class="price-value sell-price">${formatRupiah(item.sell_price)}</span>
                    </div>
                </div>
                
                <div class="item-actions">
                    <button type="button" class="btn-icon edit" onclick="openEditMode('${item.id}')" aria-label="Edit Item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button type="button" class="btn-icon delete" onclick="openDeleteModal('${item.id}', '${item.name}')" aria-label="Hapus Item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            `;
            itemList.appendChild(card);
        });
    }
};

window.openEditMode = (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    currentEditId = item.id;
    sidebarFormTitle.innerHTML = '<span class="section-icon">✎</span> Edit Barang';
    cancelEditBtn.classList.remove('hidden');
    
    itemNameInput.value = item.name;
    itemCategoryInput.value = item.category;
    itemStockInput.value = item.stock;
    itemBuyPriceInput.value = item.buy_price;
    itemSellPriceInput.value = item.sell_price;
    
    openSidebar();
    
    // Smooth scroll to top of sidebar so user sees the form
    sidebar.scrollTo({ top: 0, behavior: 'smooth' });
};

// Form Submission
itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    submitBtn.textContent = 'Menyimpan...';
    submitBtn.disabled = true;
    cancelEditBtn.disabled = true;
    
    const itemData = {
        name: itemNameInput.value,
        category: itemCategoryInput.value,
        stock: parseInt(itemStockInput.value),
        buy_price: parseFloat(itemBuyPriceInput.value),
        sell_price: parseFloat(itemSellPriceInput.value)
    };
    
    try {
        if (currentEditId) {
            // Update
            const { error } = await supabaseClient
                .from('inventory_items')
                .update(itemData)
                .eq('id', currentEditId);
                
            if (error) throw error;
        } else {
            // Create
            const { error } = await supabaseClient
                .from('inventory_items')
                .insert([itemData]);
                
            if (error) throw error;
        }
        
        resetForm();
        if (window.innerWidth <= 768) {
            closeSidebar(); // Auto-close on mobile after save
        }
        await fetchItems(); // Refresh data from server
    } catch (error) {
        console.error('Error saving item:', error.message);
        alert('Gagal menyimpan barang.');
    } finally {
        submitBtn.textContent = 'Simpan';
        submitBtn.disabled = false;
        cancelEditBtn.disabled = false;
    }
});

// Delete Modal Functions
window.openDeleteModal = (id, name) => {
    itemToDeleteId = id;
    deleteItemName.textContent = name;
    deleteModal.classList.remove('hidden');
};

const closeDeleteModalFunc = () => {
    deleteModal.classList.add('hidden');
    itemToDeleteId = null;
    confirmDeleteBtn.textContent = 'Hapus';
    confirmDeleteBtn.disabled = false;
};

cancelDeleteBtn.addEventListener('click', closeDeleteModalFunc);
deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModalFunc();
});

confirmDeleteBtn.addEventListener('click', async () => {
    if (itemToDeleteId) {
        try {
            confirmDeleteBtn.textContent = 'Menghapus...';
            confirmDeleteBtn.disabled = true;
            
            const { error } = await supabaseClient
                .from('inventory_items')
                .delete()
                .eq('id', itemToDeleteId);
                
            if (error) throw error;
            
            await fetchItems();
            closeDeleteModalFunc();
        } catch (error) {
            console.error('Error deleting item:', error.message);
            alert('Gagal menghapus barang.');
            confirmDeleteBtn.textContent = 'Hapus';
            confirmDeleteBtn.disabled = false;
        }
    }
});

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm)
    );
    renderAll(filteredItems);
});

// Initial fetch
document.addEventListener('DOMContentLoaded', () => {
    fetchItems();
});
