// Clicking the toolbar icon opens the side panel on that tab. Chrome also grants "activeTab" on that click,
// which is what lets the panel read the page you are looking at (and only that page).
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})
chrome.runtime.onStartup.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})
