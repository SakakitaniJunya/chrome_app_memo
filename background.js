let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('Default background color set to %cgreen', `color: ${color}`);

  for (let i = 1; i <= 6; i++) {
    checkValue = i;
    chrome.storage.local.set({checkValue: checkValue});
  };

});
