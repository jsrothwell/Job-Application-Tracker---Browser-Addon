// Popup JavaScript
(function() {
  'use strict';

  let allApplications = [];
  let filteredApplications = [];
  let currentFilter = 'all';
  let searchQuery = '';

  const elements = {
    statTotal: document.getElementById('stat-total'),
    statApplied: document.getElementById('stat-applied'),
    statInterview: document.getElementById('stat-interview'),
    statOffer: document.getElementById('stat-offer'),
    applicationsList: document.getElementById('applications-list'),
    searchInput: document.getElementById('search-input'),
    totalCount: document.getElementById('total-count'),
    exportBtn: document.getElementById('export-btn'),
    clearBtn: document.getElementById('clear-btn'),
    tabs: document.querySelectorAll('.tab')
  };

  // Initialize
  async function init() {
    await loadApplications();
    setupEventListeners();
    updateStats();
    renderApplications();
  }

  async function loadApplications() {
    try {
      const result = await chrome.storage.local.get(['applications']);
      allApplications = result.applications || [];
      filteredApplications = [...allApplications];
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  }

  function setupEventListeners() {
    // Tab filters
    elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        elements.tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.status;
        applyFilters();
      });
    });

    // Search
    elements.searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      applyFilters();
    });

    // Export
    elements.exportBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'EXPORT_APPLICATIONS' });
    });

    // Clear all
    elements.clearBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete all tracked applications? This cannot be undone.')) {
        await chrome.storage.local.set({ applications: [] });
        allApplications = [];
        filteredApplications = [];
        updateStats();
        renderApplications();
      }
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.applications) {
        allApplications = changes.applications.newValue || [];
        applyFilters();
      }
    });
  }

  function applyFilters() {
    filteredApplications = allApplications.filter(app => {
      // Status filter
      let statusMatch = true;
      if (currentFilter === 'all') {
        statusMatch = true;
      } else if (currentFilter === 'Not Applied') {
        statusMatch = app.status === 'Not Applied';
      } else if (currentFilter === 'Applied') {
        statusMatch = app.status === 'Applied' || app.status === 'Screening';
      } else if (currentFilter === 'Interview') {
        statusMatch = app.status === 'Interview Scheduled' || app.status === 'Interviewed';
      } else {
        statusMatch = app.status === currentFilter;
      }

      // Search filter
      let searchMatch = true;
      if (searchQuery) {
        searchMatch = 
          app.companyName.toLowerCase().includes(searchQuery) ||
          app.jobTitle.toLowerCase().includes(searchQuery) ||
          app.location.toLowerCase().includes(searchQuery);
      }

      return statusMatch && searchMatch;
    });

    updateStats();
    renderApplications();
  }

  function updateStats() {
    const stats = {
      total: allApplications.length,
      applied: 0,
      interview: 0,
      offer: 0
    };

    allApplications.forEach(app => {
      if (app.status === 'Applied' || app.status === 'Screening') {
        stats.applied++;
      }
      if (app.status === 'Interview Scheduled' || app.status === 'Interviewed') {
        stats.interview++;
      }
      if (app.status === 'Offer Received' || app.status === 'Accepted') {
        stats.offer++;
      }
    });

    elements.statTotal.textContent = stats.total;
    elements.statApplied.textContent = stats.applied;
    elements.statInterview.textContent = stats.interview;
    elements.statOffer.textContent = stats.offer;
    elements.totalCount.textContent = filteredApplications.length;
  }

  function renderApplications() {
    if (filteredApplications.length === 0) {
      elements.applicationsList.innerHTML = `
        <div class="empty-state">
          <p>📋 ${searchQuery ? 'No matching applications' : 'No applications yet'}</p>
          <p class="hint">${searchQuery ? 'Try a different search term' : 'Visit a job posting and click "Track Job" to get started!'}</p>
        </div>
      `;
      return;
    }

    // Sort by most recent first
    const sorted = [...filteredApplications].sort((a, b) => {
      return new Date(b.dateAdded || b.dateFound) - new Date(a.dateAdded || a.dateFound);
    });

    const html = sorted.map(app => createApplicationCard(app)).join('');
    elements.applicationsList.innerHTML = html;

    // Add click listeners
    document.querySelectorAll('.application-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('app-action-btn')) {
          const url = card.dataset.url;
          chrome.tabs.create({ url });
        }
      });
    });

    document.querySelectorAll('.app-action-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const appId = btn.dataset.id;
        
        if (action === 'delete') {
          if (confirm('Delete this application?')) {
            await deleteApplication(appId);
          }
        }
      });
    });
  }

  function createApplicationCard(app) {
    const date = formatDate(app.dateAdded || app.dateFound);
    const statusClass = app.status.replace(/\s+/g, '-');
    const statusLabel = app.status.replace(/\s+/g, '-');

    return `
      <div class="application-card status-${statusClass}" data-url="${app.url}">
        <div class="app-header">
          <div>
            <div class="app-title">${escapeHtml(app.jobTitle)}</div>
            <div class="app-company">${escapeHtml(app.companyName)}</div>
            <div class="app-location">${escapeHtml(app.location)}</div>
          </div>
          <span class="app-status ${statusLabel}">${app.status}</span>
        </div>
        ${app.notes ? `<div class="app-notes" style="font-size: 11px; color: #666; margin-top: 6px; font-style: italic;">${escapeHtml(app.notes.substring(0, 100))}${app.notes.length > 100 ? '...' : ''}</div>` : ''}
        <div class="app-meta">
          <span class="app-date">Added ${date}</span>
          <div class="app-actions">
            <button class="app-action-btn" data-action="delete" data-id="${app.id}" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }

  async function deleteApplication(appId) {
    const result = await chrome.storage.local.get(['applications']);
    let applications = result.applications || [];
    applications = applications.filter(app => app.id !== appId);
    await chrome.storage.local.set({ applications });
    
    allApplications = applications;
    applyFilters();
  }

  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize on load
  init();

})();
