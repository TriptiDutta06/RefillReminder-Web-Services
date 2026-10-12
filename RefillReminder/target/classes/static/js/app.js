/**
 * 🌸 RefillReminder - Frontend Application Logic
 * Communicates with the real Spring Boot REST API at /api/refills
 * All data is persisted in MongoDB (refillreminder.refills)
 */

// API Base URL
const API_BASE = '/api/refills';

// Application State
let refillsData = [];
let activeTab = 'all';
let deleteTargetId = null;

// DOM Elements
const statsTotalEl = document.getElementById('stat-total');
const statsRunningLowEl = document.getElementById('stat-running-low');
const statsDueSoonEl = document.getElementById('stat-due-soon');
const statsRefilledEl = document.getElementById('stat-refilled');
const refillsContainer = document.getElementById('refills-grid');
const countBadge = document.getElementById('items-count-badge');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const priorityFilter = document.getElementById('priority-filter');
const statusFilter = document.getElementById('status-filter');
const tabPills = document.querySelectorAll('.tab-pill');

// Modals
const refillModal = document.getElementById('refill-modal');
const modalTitle = document.getElementById('modal-title');
const refillForm = document.getElementById('refill-form');
const deleteModal = document.getElementById('delete-modal');
const deleteItemNameEl = document.getElementById('delete-item-name');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  loadRefills();
  loadDbStatus();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Search input with debounce
  let searchTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const term = e.target.value.trim();
      if (term) {
        performSearch(term);
      } else {
        loadRefills();
      }
    }, 300);
  });

  // Filters
  categoryFilter.addEventListener('change', applyCurrentFilters);
  priorityFilter.addEventListener('change', applyCurrentFilters);
  statusFilter.addEventListener('change', applyCurrentFilters);

  // Tabs
  tabPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      tabPills.forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      activeTab = e.target.dataset.tab;
      handleTabSwitch(activeTab);
    });
  });

  // Modal open buttons
  document.getElementById('open-add-btn').addEventListener('click', openAddModal);
  document.getElementById('open-add-empty-btn')?.addEventListener('click', openAddModal);

  // Modal close buttons
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  // Close modal on background click
  window.addEventListener('click', (e) => {
    if (e.target === refillModal || e.target === deleteModal) {
      closeAllModals();
    }
  });

  // Form Submit (POST or PUT)
  refillForm.addEventListener('submit', handleFormSubmit);

  // Confirm Delete
  confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
}

/**
 * Fetch MongoDB database status (document count)
 */
async function loadDbStatus() {
  const dbDocCount = document.getElementById('db-doc-count');
  const dbStatusIcon = document.getElementById('db-status-icon');
  const dbStatusTitle = document.getElementById('db-status-title');

  try {
    const response = await fetch(`${API_BASE}/count`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    dbDocCount.textContent = data.count;
    dbStatusIcon.textContent = '🟢';
    dbStatusTitle.textContent = 'MongoDB Connected';
  } catch (error) {
    console.error('Error fetching DB status:', error);
    dbDocCount.textContent = '—';
    dbStatusIcon.textContent = '🔴';
    dbStatusTitle.textContent = 'MongoDB Disconnected';
  }
}

/**
 * 1. GET /api/refills - Fetch all refills from MongoDB
 */
async function loadRefills() {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    refillsData = data;
    updateDashboardStats(data);
    renderCards(data);
    loadDbStatus(); // refresh document count
  } catch (error) {
    console.error('Error fetching refills:', error);
    showToast('Failed to load refills from server', 'error');
  }
}

/**
 * 2. GET /api/refills/upcoming - Fetch upcoming approaching items
 */
async function loadUpcomingRefills() {
  try {
    const response = await fetch(`${API_BASE}/upcoming`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    renderCards(data);
    showToast(`Loaded ${data.length} upcoming refills due soon!`, 'info');
  } catch (error) {
    console.error('Error fetching upcoming:', error);
    showToast('Failed to load upcoming refills', 'error');
  }
}

/**
 * 3. GET /api/refills/search?name=... - Search refills
 */
async function performSearch(query) {
  try {
    const response = await fetch(`${API_BASE}/search?name=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    renderCards(data);
  } catch (error) {
    console.error('Error searching refills:', error);
    showToast('Search request failed', 'error');
  }
}

/**
 * Apply dropdown filters (Category, Priority, Status)
 */
async function applyCurrentFilters() {
  const cat = categoryFilter.value;
  const prio = priorityFilter.value;
  const stat = statusFilter.value;

  const params = new URLSearchParams();
  if (cat) params.append('category', cat);
  if (prio) params.append('priority', prio);
  if (stat) params.append('status', stat);

  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    const response = await fetch(`${API_BASE}${query}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    renderCards(data);
  } catch (error) {
    console.error('Error applying filters:', error);
    showToast('Filter request failed', 'error');
  }
}

/**
 * Handle Tab switching
 */
function handleTabSwitch(tab) {
  if (tab === 'upcoming') {
    loadUpcomingRefills();
  } else if (tab === 'running-low') {
    const filtered = refillsData.filter(item => item.status === 'Running Low');
    renderCards(filtered);
  } else if (tab === 'refilled') {
    const filtered = refillsData.filter(item => item.status === 'Refilled');
    renderCards(filtered);
  } else {
    // All
    loadRefills();
  }
}

/**
 * Render cards to DOM
 */
function renderCards(items) {
  refillsContainer.innerHTML = '';
  countBadge.textContent = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;

  if (items.length === 0) {
    refillsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🌸</div>
        <h3>No refill items found</h3>
        <p>No household products match your current view or filter criteria.</p>
        <button class="btn btn-primary" onclick="openAddModal()">+ Add New Refill</button>
      </div>
    `;
    return;
  }

  items.forEach(item => {
    const card = createCardElement(item);
    refillsContainer.appendChild(card);
  });
}

/**
 * Create a single card element
 * Note: MongoDB uses String IDs, so we quote them in onclick handlers
 */
function createCardElement(item) {
  const card = document.createElement('div');
  card.className = 'refill-card';
  card.id = `refill-card-${item.id}`;

  const priorityClass = `badge-priority-${(item.priority || 'med').toLowerCase().substring(0, 4)}`;
  const statusKey = (item.status || 'needed').toLowerCase().replace(/\s+/g, '');
  const statusClass = `badge-status-${statusKey}`;

  // Calculate days remaining until next refill
  let countdownHtml = '';
  if (item.nextRefill) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(item.nextRefill);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      countdownHtml = `<span class="due-countdown urgent">(${Math.abs(diffDays)}d overdue)</span>`;
    } else if (diffDays === 0) {
      countdownHtml = `<span class="due-countdown urgent">(Due Today)</span>`;
    } else if (diffDays <= 3) {
      countdownHtml = `<span class="due-countdown urgent">(in ${diffDays} days)</span>`;
    } else {
      countdownHtml = `<span class="due-countdown normal">(in ${diffDays} days)</span>`;
    }
  }

  // Escape the ID for safe use in onclick attributes (MongoDB ObjectId is a string)
  const safeId = escapeHtml(item.id);
  const safeName = escapeHtml(item.productName);

  card.innerHTML = `
    <div>
      <div class="card-top">
        <div class="card-title-group">
          <h3>${safeName}</h3>
          <span class="card-category-chip">${escapeHtml(item.category || 'General')}</span>
        </div>
        <span class="badge ${priorityClass}">${escapeHtml(item.priority || 'Medium')}</span>
      </div>

      <div class="card-details">
        <div class="detail-row">
          <span class="detail-label">📦 Stock:</span>
          <span class="detail-value quantity-highlight">${item.quantity} ${escapeHtml(item.unit || '')}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">🔄 Status:</span>
          <span class="badge ${statusClass}">${escapeHtml(item.status || 'Needed')}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">📅 Next Refill:</span>
          <span class="detail-value">${item.nextRefill || 'Not set'} ${countdownHtml}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">🕒 Last Refilled:</span>
          <span class="detail-value">${item.lastRefilled || 'Never'}</span>
        </div>

        ${item.notes ? `<div class="card-notes">"${escapeHtml(item.notes)}"</div>` : ''}
      </div>
    </div>

    <div class="card-actions">
      <div>
        ${item.status !== 'Refilled' ? `
          <button class="btn btn-sm btn-success" onclick="markAsRefilled('${safeId}')">
            ✓ Mark Refilled
          </button>
        ` : `
          <span style="font-size: 0.8rem; color: #059669; font-weight: 600;">✨ All Stocked</span>
        `}
      </div>
      <div class="card-actions-right">
        <button class="btn btn-sm btn-secondary" onclick="openEditModal('${safeId}')">
          ✏️ Edit
        </button>
        <button class="btn btn-sm btn-danger" onclick="openDeleteModal('${safeId}', '${safeName}')">
          🗑️
        </button>
      </div>
    </div>
  `;

  return card;
}

/**
 * Update Dashboard Statistics
 */
function updateDashboardStats(items) {
  const total = items.length;
  const runningLow = items.filter(i => i.status === 'Running Low').length;
  const dueSoon = items.filter(i => i.status === 'Due Soon').length;
  const refilled = items.filter(i => i.status === 'Refilled').length;

  statsTotalEl.textContent = total;
  statsRunningLowEl.textContent = runningLow;
  statsDueSoonEl.textContent = dueSoon;
  statsRefilledEl.textContent = refilled;
}

/**
 * 4. POST /api/refills or PUT /api/refills/{id} - Handle Modal Form Submission
 * Data is saved to MongoDB via the backend
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('refill-id').value;
  const payload = {
    productName: document.getElementById('field-name').value.trim(),
    category: document.getElementById('field-category').value,
    quantity: parseFloat(document.getElementById('field-quantity').value) || 0,
    unit: document.getElementById('field-unit').value.trim(),
    priority: document.getElementById('field-priority').value,
    lastRefilled: document.getElementById('field-last-refilled').value || null,
    nextRefill: document.getElementById('field-next-refill').value || null,
    status: document.getElementById('field-status').value,
    notes: document.getElementById('field-notes').value.trim()
  };

  try {
    let response;
    if (id) {
      // PUT /api/refills/{id} → updates document in MongoDB
      response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Update failed with status ${response.status}`);
      showToast(`Updated "${payload.productName}" successfully!`, 'success');
    } else {
      // POST /api/refills → inserts new document in MongoDB
      response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Creation failed with status ${response.status}`);
      showToast(`Added "${payload.productName}" to your list!`, 'success');
    }

    closeAllModals();
    loadRefills();
  } catch (error) {
    console.error('Error saving refill:', error);
    showToast('Error saving record. Please check the form fields.', 'error');
  }
}

/**
 * 5. PATCH /api/refills/{id}/status - Quick Mark as Refilled
 */
async function markAsRefilled(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Refilled' })
    });

    if (!response.ok) throw new Error(`PATCH failed with status ${response.status}`);
    const updated = await response.json();
    showToast(`Marked "${updated.productName}" as Refilled! 🌸`, 'success');
    loadRefills();
  } catch (error) {
    console.error('Error updating status:', error);
    showToast('Failed to update status', 'error');
  }
}

/**
 * 6. DELETE /api/refills/{id} - Delete item from MongoDB
 */
async function handleConfirmDelete() {
  if (!deleteTargetId) return;

  try {
    const response = await fetch(`${API_BASE}/${deleteTargetId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error(`Delete failed with status ${response.status}`);
    const result = await response.json();
    showToast(result.message || 'Item deleted successfully', 'success');
    closeAllModals();
    loadRefills();
  } catch (error) {
    console.error('Error deleting item:', error);
    showToast('Failed to delete item', 'error');
  } finally {
    deleteTargetId = null;
  }
}

/**
 * Open Add Modal
 */
function openAddModal() {
  refillForm.reset();
  document.getElementById('refill-id').value = '';
  modalTitle.innerHTML = '🌸 Add New Household Refill';

  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('field-last-refilled').value = today;

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 14);
  document.getElementById('field-next-refill').value = nextWeek.toISOString().split('T')[0];

  refillModal.classList.add('active');
}

/**
 * Open Edit Modal (loads single record: GET /api/refills/{id})
 */
async function openEditModal(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) throw new Error(`GET record failed with status ${response.status}`);
    const item = await response.json();

    document.getElementById('refill-id').value = item.id;
    document.getElementById('field-name').value = item.productName || '';
    document.getElementById('field-category').value = item.category || 'Personal Care';
    document.getElementById('field-quantity').value = item.quantity || 1;
    document.getElementById('field-unit').value = item.unit || 'bottles';
    document.getElementById('field-priority').value = item.priority || 'Medium';
    document.getElementById('field-last-refilled').value = item.lastRefilled || '';
    document.getElementById('field-next-refill').value = item.nextRefill || '';
    document.getElementById('field-status').value = item.status || 'Needed';
    document.getElementById('field-notes').value = item.notes || '';

    modalTitle.innerHTML = `✏️ Edit Refill: ${escapeHtml(item.productName)}`;
    refillModal.classList.add('active');
  } catch (error) {
    console.error('Error loading item for edit:', error);
    showToast('Failed to load item details', 'error');
  }
}

/**
 * Open Delete Confirmation Modal
 */
function openDeleteModal(id, name) {
  deleteTargetId = id;
  deleteItemNameEl.textContent = name;
  deleteModal.classList.add('active');
}

/**
 * Close All Modals
 */
function closeAllModals() {
  refillModal.classList.remove('active');
  deleteModal.classList.remove('active');
  deleteTargetId = null;
}

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '🌸';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fade-out 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
