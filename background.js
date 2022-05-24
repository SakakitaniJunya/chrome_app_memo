let colors = '#3aa757';

//アプリケーションの初期化
chrome.runtime.onInstalled.addListener(() => {
  let keyName;
  let keys = {};
  for (let i = 1; i <= 6; i++) {
    checkValue = i;
    keyName = 'key' + `${checkValue}`;
    console.log("keyname : " + keyName);
    //eval("const " + keyName + " = '';");
    //chrome.storage.sync.set({ [keyName] : keyName }) ;
    chrome.storage.sync.set({ [keyName] : "" }) ;
  };
  //chrome.storage.sync.set({ keyName }) ;
  chrome.storage.sync.set({ colors: "" });

  //ラジオボタンのチェック項目の保存
  //chrome.storage.sync.set({'checkedValue': 1});

});
