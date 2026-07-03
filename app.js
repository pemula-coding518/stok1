// app.js

// Initialize Supabase
const supabaseUrl = 'https://tvfmtjwslsmfevwxbozr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Zm10andzbHNtZmV2d3hib3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwODM0MjEsImV4cCI6MjA5ODY1OTQyMX0.6Cq514dox_nYnfWrHBbi7MiDJoljig0UJlCn_yK8wkI';

// Gunakan nama 'supabaseClient' agar tidak bentrok dengan global 'supabase' dari CDN
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// State management
let items = [];
let currentEditId = null;
let itemToDeleteId = null;
let isLoading = false;

// DOM Elements
const itemList = document.getElementById('itemList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');

// Modals
const itemModal = document.getElementById('itemModal');
const deleteModal = document.getElementById('deleteModal');

// Form elements
const itemForm = document.getElementById('itemForm');
const modalTitle = document.getElementById('modalTitle');
const itemIdInput = document.getElementById('itemId');
const itemNameInput = document.getElementById('itemName');
const itemCategoryInput = document.getElementById('itemCategory');
const itemStockInput = document.getElementById('itemStock');
const itemBuyPriceInput = document.getElementById('itemBuyPrice');
const itemSellPriceInput = document.getElementById('itemSellPrice');

// Buttons
const addBtn = document.getElementById('addBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
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

// Fetch data from Supabase
const fetchItems = async () => {
    isLoading = true;
    renderItems(); // Show loading state
    
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
        
        // Apply search filter if active
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            const filteredItems = items.filter(item => 
                item.name.toLowerCase().includes(searchTerm)
            );
            renderItems(filteredItems);
        } else {
            renderItems(items);
        }
    }
};

// Render Functions
const renderItems = (itemsToRender = items) => {
    itemList.innerHTML = '';
    
    if (isLoading) {
        emptyState.classList.remove('hidden');
        emptyState.querySelector('.empty-icon').textContent = '⏳';
        emptyState.querySelector('p').textContent = 'Memuat data...';
        emptyState.querySelector('.empty-sub').textContent = 'Harap tunggu sebentar.';
        return;
    }
    
    if (itemsToRender.length === 0) {
        emptyState.classList.remove('hidden');
        emptyState.querySelector('.empty-icon').textContent = '📦';
        emptyState.querySelector('p').textContent = 'Belum ada barang.';
        emptyState.querySelector('.empty-sub').textContent = 'Ketuk tombol + untuk menambah.';
    } else {
        emptyState.classList.add('hidden');
        
        itemsToRender.forEach(item => {
            const isLowStock = parseInt(item.stock) <= 5;
            
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
                    <button type="button" class="btn-icon edit" onclick="openEditModal('${item.id}')" aria-label="Edit Item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button type="button" class="btn-icon delete" onclick="openDeleteModal('${item.id}', '${item.name}')" aria-label="Hapus Item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            `;
            itemList.appendChild(card);
        });
    }
};

// Modal Functions
const openModal = () => {
    itemModal.classList.remove('hidden');
    setTimeout(() => itemNameInput.focus(), 100);
};

const closeModal = () => {
    itemModal.classList.add('hidden');
    itemForm.reset();
    currentEditId = null;
    modalTitle.textContent = 'Tambah Barang';
    
    // Reset buttons state
    const submitBtn = itemForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Simpan';
    submitBtn.disabled = false;
};

window.openEditModal = (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    currentEditId = item.id;
    modalTitle.textContent = 'Edit Barang';
    
    itemNameInput.value = item.name;
    itemCategoryInput.value = item.category;
    itemStockInput.value = item.stock;
    itemBuyPriceInput.value = item.buy_price;
    itemSellPriceInput.value = item.sell_price;
    
    openModal();
};

window.openDeleteModal = (id, name) => {
    itemToDeleteId = id;
    document.getElementById('deleteItemName').textContent = name;
    deleteModal.classList.remove('hidden');
};

const closeDeleteModal = () => {
    deleteModal.classList.add('hidden');
    itemToDeleteId = null;
    
    confirmDeleteBtn.textContent = 'Hapus';
    confirmDeleteBtn.disabled = false;
};

// Event Listeners
addBtn.addEventListener('click', () => {
    itemForm.reset();
    currentEditId = null;
    modalTitle.textContent = 'Tambah Barang';
    openModal();
});

closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);

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
            
            // Re-fetch items to ensure sync
            await fetchItems();
            closeDeleteModal();
            
        } catch (error) {
            console.error('Error deleting item:', error.message);
            alert('Gagal menghapus barang.');
            confirmDeleteBtn.textContent = 'Hapus';
            confirmDeleteBtn.disabled = false;
        }
    }
});

// Close modal when clicking outside
itemModal.addEventListener('click', (e) => {
    if (e.target === itemModal) closeModal();
});

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
});

// Form Submission
itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = itemForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Menyimpan...';
    submitBtn.disabled = true;
    
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
        
        await fetchItems(); // Refresh data from server
        closeModal();
    } catch (error) {
        console.error('Error saving item:', error.message);
        alert('Gagal menyimpan barang.');
        submitBtn.textContent = 'Simpan';
        submitBtn.disabled = false;
    }
});

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm)
    );
    renderItems(filteredItems);
});

// Initial render & fetch
document.addEventListener('DOMContentLoaded', () => {
    fetchItems();
});
