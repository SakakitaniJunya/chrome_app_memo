let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
  for (let i = 1; i <= 6; i++) {
    checkValue = i;
    chrome.storage.local.set({ checkValue });
  };

});
