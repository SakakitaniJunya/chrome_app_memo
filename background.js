let color = '#3aa757';

//アプリケーションの初期化
chrome.runtime.onInstalled.addListener(() => {
  // let keyName;
  // for (let i = 1; i <= 6; i++) {
  //   checkValue = i;
  //   keyName = 'key' + `${checkValue}`;
  //   console.log("keyname : " + keyName);
  //   chrome.storage.local.set({keyName: checkValue}, function(){});
  // };




  //ラジオボタンのチェック項目の保存
  chrome.storage.sync.set({'checkedValue': 1});
});
