# Job Application Tracker - Browser Extension

Never lose track of your job applications again! This powerful browser extension helps you save job postings, track application status, set follow-up reminders, and avoid duplicate applications.

## Features

### 🎯 Core Features
- **One-Click Tracking**: Save any job posting with a single click on the floating button
- **Duplicate Detection**: Automatically warns you if you've already applied to a job
- **Status Management**: Track applications through your entire job search pipeline
- **Follow-up Reminders**: Set dates to follow up and get browser notifications
- **Rich Dashboard**: View all applications with filtering, search, and statistics
- **Export Data**: Export your application history to CSV for analysis

### 📊 Application Statuses
- Not Applied (Saved for later)
- Applied
- Screening
- Interview Scheduled
- Interviewed
- Offer Received
- Accepted
- Rejected
- Withdrew

### 🔔 Smart Features
- **Automatic extraction** of company name, job title, location, and description
- **Browser notifications** for follow-up reminders
- **Search functionality** to quickly find specific applications
- **Statistics dashboard** showing your application pipeline
- **Notes field** for each application to track important details

### 🌐 Supported Job Sites
- LinkedIn Jobs
- Indeed
- Glassdoor
- Monster
- ZipRecruiter
- Dice
- Lever.co
- Ashby HQ
- Greenhouse

## Installation

### Chrome Installation

1. Download and extract the extension files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `job-tracker-extension` folder
6. The extension is now active!

### Firefox Installation

1. Download and extract the extension files
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select the `manifest.json` file in the extension folder
5. The extension is now active!

**Note**: In Firefox, temporary extensions are removed when you close the browser.

## How to Use

### Tracking a Job

1. **Visit any job posting** on a supported site
2. **Look for the floating button** in the bottom-right corner that says "Track Job"
3. **Click the button** to save the job to your tracker
4. The button will change to show "Update Status" if the job is already tracked

### Managing Applications

1. **Click the extension icon** in your browser toolbar
2. **View your dashboard** with all tracked applications
3. **Filter by status** using the tabs (All, Saved, Applied, Interview)
4. **Search** for specific jobs or companies
5. **Click any card** to reopen that job posting
6. **Use the actions** to update or delete applications

### Updating Status

1. Visit a job you've already tracked (or open from dashboard)
2. Click "Update Status" on the floating button
3. A modal will appear where you can:
   - Change the application status
   - Add or update notes
   - Set a follow-up reminder date
   - Delete the application

### Setting Follow-up Reminders

1. When updating a job, set a "Follow-up Date"
2. On that date, you'll receive a browser notification
3. The notification will remind you to follow up on that application
4. Click the notification to be taken to the extension

### Exporting Data

1. Click the extension icon to open the dashboard
2. Click the "💾 Export" button
3. Your applications will be exported as a CSV file
4. Open in Excel, Google Sheets, or any spreadsheet program

## File Structure

```
job-tracker-extension/
├── manifest.json           # Extension configuration
├── background.js           # Background service worker (notifications, alarms)
├── content.js             # Content script (detects jobs, floating button)
├── content-styles.css     # Styles for floating button and modal
├── popup.html             # Dashboard UI
├── popup.js               # Dashboard logic
├── popup-styles.css       # Dashboard styles
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

## Dashboard Features

### Statistics Cards
- **Total Jobs**: All tracked applications
- **Applied**: Jobs you've applied to or are in screening
- **Interviews**: Interview scheduled or completed
- **Offers**: Offers received or accepted

### Filter Tabs
- **All**: View all tracked jobs
- **Saved**: Jobs you've saved but haven't applied to yet
- **Applied**: Jobs you've applied to
- **Interview**: Jobs in the interview stage

### Actions
- **💾 Export**: Download all data as CSV
- **🗑️ Clear**: Delete all tracked applications (with confirmation)

### Search
Type to filter by company name, job title, or location in real-time

## Data Storage

All data is stored locally in your browser using Chrome's storage API:
- **No cloud sync** (data stays on your device)
- **No account required**
- **Complete privacy**
- **No external servers**

## Tips for Best Results

### Organizing Your Job Search

1. **Save jobs immediately**: When you find an interesting job, save it right away
2. **Update regularly**: Change status as you progress through the pipeline
3. **Add notes**: Record important details about each application
4. **Set reminders**: Use follow-up dates to stay organized
5. **Export weekly**: Keep a backup of your data

### Using Statuses Effectively

- **Not Applied**: Jobs you're considering but haven't applied to yet
- **Applied**: Use this as soon as you submit your application
- **Screening**: When your resume is being reviewed
- **Interview Scheduled**: As soon as you book an interview
- **Interviewed**: After completing the interview
- **Offer Received**: When you receive an offer
- **Accepted/Rejected/Withdrew**: For final outcomes

### Setting Follow-up Reminders

- After applying: Set reminder for 1-2 weeks later
- After interview: Set reminder for 3-5 days later
- After offer: Set reminder for decision deadline
- For slow responses: Set reminder to check in

## Troubleshooting

### Floating button not appearing
- Make sure you're on a supported job site
- Wait 2-3 seconds for the page to fully load
- Try refreshing the page
- Check that the extension is enabled

### Can't update a job
- Make sure you're on the same job posting URL
- Try clicking the extension icon and updating from the dashboard
- Check browser console for errors (F12)

### Follow-up notifications not working
- Make sure notifications are enabled for your browser
- Check that the extension has notification permissions
- Verify the follow-up date is in the future

### Data not syncing between devices
- This extension stores data locally only
- No cross-device sync is available
- Export your data to transfer between devices

### Export not working
- Check that downloads are enabled in your browser
- Make sure you have write permissions to your downloads folder
- Try a different browser if issues persist

## Privacy & Security

✅ **What we do:**
- Store all data locally on your device
- Extract publicly visible job information
- Show browser notifications (with permission)

❌ **What we DON'T do:**
- Upload your data to any server
- Track your browsing activity
- Share data with third parties
- Require account creation
- Access personal information

## Limitations

- Data is stored locally (no cloud backup)
- Firefox temporary installation requires reload on restart
- Some job sites may update their HTML structure, requiring extension updates
- Maximum storage is browser-dependent (usually 5-10MB)
- Notifications require browser permission

## Future Enhancements

Planned features:
- 📧 Email reminders in addition to browser notifications
- 📈 Analytics and success rate tracking
- 🔄 Cloud sync option (optional)
- 📱 Mobile companion app
- 🤖 AI-powered application insights
- 📅 Calendar integration
- 🔗 LinkedIn profile linking
- 📊 Salary tracking and analysis

## Contributing

Want to improve this extension? Here's how:

### Adding Support for New Job Sites

Edit the `siteConfigs` object in `content.js`:

```javascript
'newsite.com': {
  companySelector: '.company-class',
  titleSelector: '.title-class',
  locationSelector: '.location-class',
  descriptionSelector: '.description-class'
}
```

### Adding New Statuses

1. Update the status dropdown in `content.js`
2. Add corresponding CSS in `popup-styles.css`
3. Update statistics calculation in `popup.js`

## Version History

**v1.0.0** (Current)
- Initial release
- Support for 9 major job sites
- Full application tracking pipeline
- Follow-up reminders
- CSV export
- Dashboard with statistics

## Support

If you encounter issues:
1. Check the Troubleshooting section
2. Verify all files are present
3. Check browser console for errors
4. Ensure you're using a supported browser version
5. Try disabling and re-enabling the extension

## License

This extension is provided as-is for personal use.

---

**Made with ❤️ for job seekers who want to stay organized and never miss an opportunity!**

Track smarter, apply better, land your dream job! 🎯
