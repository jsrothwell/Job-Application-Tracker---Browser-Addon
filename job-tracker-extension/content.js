// Content script for job application tracking
(function() {
  'use strict';

  const siteConfigs = {
    'linkedin.com': {
      companySelector: '.job-details-jobs-unified-top-card__company-name, .topcard__org-name-link, .jobs-unified-top-card__company-name a',
      titleSelector: '.job-details-jobs-unified-top-card__job-title, .topcard__title, .jobs-unified-top-card__job-title',
      locationSelector: '.job-details-jobs-unified-top-card__bullet, .topcard__flavor--bullet, .jobs-unified-top-card__bullet',
      descriptionSelector: '.jobs-description, .jobs-description-content__text'
    },
    'indeed.com': {
      companySelector: '[data-company-name="true"], .jobsearch-InlineCompanyRating-companyHeader a',
      titleSelector: '.jobsearch-JobInfoHeader-title, h1.jobsearch-JobInfoHeader-title',
      locationSelector: '.jobsearch-JobInfoHeader-subtitle div',
      descriptionSelector: '#jobDescriptionText, .jobsearch-jobDescriptionText'
    },
    'glassdoor.com': {
      companySelector: '[data-test="employerName"], .employer-name',
      titleSelector: '[data-test="jobTitle"], .job-title',
      locationSelector: '[data-test="location"], .job-location',
      descriptionSelector: '.jobDescriptionContent, .desc'
    },
    'monster.com': {
      companySelector: '.company-name, [data-test-id="companyName"]',
      titleSelector: '.job-title, h1[data-test-id="jobTitle"]',
      locationSelector: '.location, [data-test-id="location"]',
      descriptionSelector: '.job-description'
    },
    'ziprecruiter.com': {
      companySelector: '.hiring_company_text, [data-test="companyName"]',
      titleSelector: '.job_title, h1.job-title',
      locationSelector: '.location, .job-location',
      descriptionSelector: '.job-description'
    },
    'dice.com': {
      companySelector: '.employer, [data-cy="companyNameLink"]',
      titleSelector: '.jobTitle, h1[data-cy="jobTitle"]',
      locationSelector: '.location, [data-cy="location"]',
      descriptionSelector: '.job-description'
    },
    'lever.co': {
      companySelector: '.company-name, .main-header-text',
      titleSelector: '.posting-headline h2',
      locationSelector: '.location, .posting-categories .location',
      descriptionSelector: '.content'
    },
    'ashbyhq.com': {
      companySelector: '.ashby-job-posting-heading__company-name',
      titleSelector: '.ashby-job-posting-heading__title',
      locationSelector: '.ashby-job-posting-info-item',
      descriptionSelector: '.ashby-job-posting-description'
    },
    'greenhouse.io': {
      companySelector: '#header .company-name',
      titleSelector: '.app-title, h1.app-title',
      locationSelector: '.location',
      descriptionSelector: '#content'
    }
  };

  let currentJobData = null;
  let floatingButton = null;

  function getCurrentSiteConfig() {
    const hostname = window.location.hostname;
    for (const [site, config] of Object.entries(siteConfigs)) {
      if (hostname.includes(site)) {
        return config;
      }
    }
    return null;
  }

  function extractText(selector) {
    const element = document.querySelector(selector);
    return element ? element.textContent.trim() : null;
  }

  function extractJobData() {
    const config = getCurrentSiteConfig();
    if (!config) return null;

    const companyName = extractText(config.companySelector);
    const jobTitle = extractText(config.titleSelector);
    const location = extractText(config.locationSelector);
    const description = extractText(config.descriptionSelector);

    if (!companyName || !jobTitle) return null;

    return {
      id: generateJobId(companyName, jobTitle),
      companyName,
      jobTitle,
      location: location || 'Location not specified',
      description: description ? description.substring(0, 500) : '',
      url: window.location.href,
      source: window.location.hostname,
      dateFound: new Date().toISOString(),
      status: 'Not Applied'
    };
  }

  function generateJobId(company, title) {
    const str = `${company}-${title}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return str.substring(0, 100);
  }

  function createFloatingButton() {
    if (floatingButton) return;

    floatingButton = document.createElement('div');
    floatingButton.id = 'job-tracker-floating-btn';
    floatingButton.innerHTML = `
      <div class="job-tracker-btn-content">
        <span class="job-tracker-icon">📋</span>
        <span class="job-tracker-text">Track Job</span>
      </div>
      <div class="job-tracker-status" style="display: none;"></div>
    `;
    
    document.body.appendChild(floatingButton);

    floatingButton.addEventListener('click', handleFloatingButtonClick);
    
    checkIfJobTracked();
  }

  async function checkIfJobTracked() {
    if (!currentJobData) return;

    try {
      const result = await chrome.storage.local.get(['applications']);
      const applications = result.applications || [];
      const existing = applications.find(app => app.id === currentJobData.id);

      const statusDiv = floatingButton.querySelector('.job-tracker-status');
      const btnContent = floatingButton.querySelector('.job-tracker-btn-content');

      if (existing) {
        floatingButton.classList.add('tracked');
        statusDiv.textContent = `Status: ${existing.status}`;
        statusDiv.style.display = 'block';
        btnContent.querySelector('.job-tracker-text').textContent = 'Update Status';
        floatingButton.title = `Already tracked - ${existing.status}`;
      } else {
        floatingButton.classList.remove('tracked');
        statusDiv.style.display = 'none';
        btnContent.querySelector('.job-tracker-text').textContent = 'Track Job';
        floatingButton.title = 'Save this job to your tracker';
      }
    } catch (error) {
      console.error('Error checking job status:', error);
    }
  }

  async function handleFloatingButtonClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!currentJobData) {
      showNotification('Unable to extract job data', 'error');
      return;
    }

    // Check if already tracked
    const result = await chrome.storage.local.get(['applications']);
    const applications = result.applications || [];
    const existing = applications.find(app => app.id === currentJobData.id);

    if (existing) {
      // Show status update modal
      showStatusModal(existing);
    } else {
      // Save new job
      await saveJob(currentJobData);
    }
  }

  function showStatusModal(job) {
    const modal = document.createElement('div');
    modal.id = 'job-tracker-modal';
    modal.innerHTML = `
      <div class="job-tracker-modal-content">
        <div class="job-tracker-modal-header">
          <h3>Update Application Status</h3>
          <button class="job-tracker-close">&times;</button>
        </div>
        <div class="job-tracker-modal-body">
          <p><strong>${job.jobTitle}</strong> at <strong>${job.companyName}</strong></p>
          <div class="job-tracker-form">
            <label>Status:</label>
            <select id="job-tracker-status-select">
              <option value="Not Applied" ${job.status === 'Not Applied' ? 'selected' : ''}>Not Applied</option>
              <option value="Applied" ${job.status === 'Applied' ? 'selected' : ''}>Applied</option>
              <option value="Screening" ${job.status === 'Screening' ? 'selected' : ''}>Screening</option>
              <option value="Interview Scheduled" ${job.status === 'Interview Scheduled' ? 'selected' : ''}>Interview Scheduled</option>
              <option value="Interviewed" ${job.status === 'Interviewed' ? 'selected' : ''}>Interviewed</option>
              <option value="Offer Received" ${job.status === 'Offer Received' ? 'selected' : ''}>Offer Received</option>
              <option value="Accepted" ${job.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
              <option value="Rejected" ${job.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
              <option value="Withdrew" ${job.status === 'Withdrew' ? 'selected' : ''}>Withdrew</option>
            </select>
            
            <label>Notes:</label>
            <textarea id="job-tracker-notes" placeholder="Add notes about this application...">${job.notes || ''}</textarea>
            
            <label>Follow-up Date:</label>
            <input type="date" id="job-tracker-followup" value="${job.followUpDate || ''}">
          </div>
          <div class="job-tracker-modal-actions">
            <button id="job-tracker-save" class="btn-primary">Update</button>
            <button id="job-tracker-delete" class="btn-danger">Delete</button>
            <button id="job-tracker-cancel" class="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.job-tracker-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#job-tracker-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#job-tracker-save').addEventListener('click', async () => {
      const status = modal.querySelector('#job-tracker-status-select').value;
      const notes = modal.querySelector('#job-tracker-notes').value;
      const followUpDate = modal.querySelector('#job-tracker-followup').value;
      
      await updateJob(job.id, { status, notes, followUpDate });
      modal.remove();
    });
    modal.querySelector('#job-tracker-delete').addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this job from your tracker?')) {
        await deleteJob(job.id);
        modal.remove();
      }
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  async function saveJob(jobData) {
    try {
      const result = await chrome.storage.local.get(['applications']);
      const applications = result.applications || [];
      
      const newJob = {
        ...jobData,
        status: 'Not Applied',
        dateAdded: new Date().toISOString(),
        notes: '',
        followUpDate: null
      };

      applications.push(newJob);
      await chrome.storage.local.set({ applications });

      showNotification('Job saved to tracker!', 'success');
      checkIfJobTracked();

      // Notify background
      chrome.runtime.sendMessage({
        type: 'JOB_SAVED',
        data: newJob
      });
    } catch (error) {
      console.error('Error saving job:', error);
      showNotification('Failed to save job', 'error');
    }
  }

  async function updateJob(jobId, updates) {
    try {
      const result = await chrome.storage.local.get(['applications']);
      const applications = result.applications || [];
      
      const index = applications.findIndex(app => app.id === jobId);
      if (index !== -1) {
        applications[index] = {
          ...applications[index],
          ...updates,
          lastUpdated: new Date().toISOString()
        };
        
        await chrome.storage.local.set({ applications });
        showNotification('Job updated!', 'success');
        checkIfJobTracked();
      }
    } catch (error) {
      console.error('Error updating job:', error);
      showNotification('Failed to update job', 'error');
    }
  }

  async function deleteJob(jobId) {
    try {
      const result = await chrome.storage.local.get(['applications']);
      let applications = result.applications || [];
      
      applications = applications.filter(app => app.id !== jobId);
      await chrome.storage.local.set({ applications });
      
      showNotification('Job removed from tracker', 'success');
      checkIfJobTracked();
    } catch (error) {
      console.error('Error deleting job:', error);
      showNotification('Failed to delete job', 'error');
    }
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `job-tracker-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function initialize() {
    currentJobData = extractJobData();
    
    if (currentJobData) {
      createFloatingButton();
    }
  }

  // Initialize
  setTimeout(initialize, 1500);

  // Watch for URL changes (SPAs)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      if (floatingButton) floatingButton.remove();
      floatingButton = null;
      setTimeout(initialize, 1500);
    }
  }).observe(document, { subtree: true, childList: true });

})();
