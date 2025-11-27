// Background service worker for job tracker
let applications = [];

// Load applications on startup
chrome.runtime.onStartup.addListener(loadApplications);
chrome.runtime.onInstalled.addListener(loadApplications);

async function loadApplications() {
  const result = await chrome.storage.local.get(['applications']);
  applications = result.applications || [];
  setupFollowUpAlarms();
}

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'JOB_SAVED') {
    handleJobSaved(message.data);
  } else if (message.type === 'GET_APPLICATIONS') {
    sendResponse({ applications });
  } else if (message.type === 'GET_STATS') {
    sendResponse({ stats: getStats() });
  }
});

function handleJobSaved(job) {
  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Job Saved!',
    message: `${job.jobTitle} at ${job.companyName}`,
    priority: 1
  });
}

// Setup alarms for follow-up reminders
async function setupFollowUpAlarms() {
  const result = await chrome.storage.local.get(['applications']);
  const apps = result.applications || [];
  
  // Clear existing alarms
  const alarms = await chrome.alarms.getAll();
  alarms.forEach(alarm => {
    if (alarm.name.startsWith('followup-')) {
      chrome.alarms.clear(alarm.name);
    }
  });

  // Create new alarms for jobs with follow-up dates
  apps.forEach(app => {
    if (app.followUpDate && app.status !== 'Rejected' && app.status !== 'Withdrew' && app.status !== 'Accepted') {
      const followUpTime = new Date(app.followUpDate).getTime();
      const now = Date.now();
      
      if (followUpTime > now) {
        chrome.alarms.create(`followup-${app.id}`, {
          when: followUpTime
        });
      }
    }
  });
}

// Handle alarm notifications
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('followup-')) {
    const jobId = alarm.name.replace('followup-', '');
    const result = await chrome.storage.local.get(['applications']);
    const apps = result.applications || [];
    const job = apps.find(app => app.id === jobId);
    
    if (job) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Follow-up Reminder',
        message: `Time to follow up on: ${job.jobTitle} at ${job.companyName}`,
        priority: 2,
        requireInteraction: true
      });
    }
  }
});

// Listen for storage changes to update alarms
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.applications) {
    applications = changes.applications.newValue || [];
    setupFollowUpAlarms();
  }
});

// Get statistics
function getStats() {
  const stats = {
    total: applications.length,
    notApplied: 0,
    applied: 0,
    screening: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    withdrew: 0,
    accepted: 0
  };

  applications.forEach(app => {
    switch (app.status) {
      case 'Not Applied':
        stats.notApplied++;
        break;
      case 'Applied':
        stats.applied++;
        break;
      case 'Screening':
        stats.screening++;
        break;
      case 'Interview Scheduled':
      case 'Interviewed':
        stats.interview++;
        break;
      case 'Offer Received':
        stats.offer++;
        break;
      case 'Rejected':
        stats.rejected++;
        break;
      case 'Withdrew':
        stats.withdrew++;
        break;
      case 'Accepted':
        stats.accepted++;
        break;
    }
  });

  return stats;
}

// Export data functionality
async function exportApplications() {
  const result = await chrome.storage.local.get(['applications']);
  const apps = result.applications || [];
  
  const csv = convertToCSV(apps);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const date = new Date().toISOString().split('T')[0];
  chrome.downloads.download({
    url: url,
    filename: `job-applications-${date}.csv`,
    saveAs: true
  });
}

function convertToCSV(applications) {
  const headers = ['Company', 'Job Title', 'Location', 'Status', 'Date Found', 'Date Applied', 'Follow-up Date', 'URL', 'Notes'];
  const rows = applications.map(app => [
    app.companyName,
    app.jobTitle,
    app.location,
    app.status,
    app.dateFound,
    app.dateApplied || '',
    app.followUpDate || '',
    app.url,
    (app.notes || '').replace(/"/g, '""')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

// Listen for export requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXPORT_APPLICATIONS') {
    exportApplications();
  }
});
