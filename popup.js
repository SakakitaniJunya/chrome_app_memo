
//変数宣言
let checkValue = '1';
const storage = chrome.storage.sync;

document.addEventListener('click', () => {

// storage.syncの場合
chrome.storage.sync.get(null, ((data) => {console.log(data)}));

  const RadioButton = document.getElementById("RadioButton");
  const Radio = document.getElementsByName("radio1");
  let len = Radio.length;

  //テキスト取得
  let element = document.getElementById('text');

  console.log(element.value);
  console.log(checkValue);

  //情報の登録
  chrome.storage.sync.set({[checkValue]: element.value}, function(result) {
    console.log(result);
    console.log('Value is set to ' + ':' + result);
  });

  for (let i = 0; i < len; i++) {
    if(Radio.item(i).checked){
      checkValue = Radio.item(i).value;
      // chrome.storage.sync.get(checkValue, ({ result }) => {
      //   console.log('Value currently is ' + result);
      // })
      chrome.storage.sync.get({'value': element.value}, function() {
        console.log('Settings saved');
    });
    }
  }




  //console.log(checkValue);

  //  //select
  //  chrome.stroage.sync.get(1, ({result}) => {
  //    //document.getElementById('text') = result.key;
  //    console.log('Value currently is ' + result.key);
  //  });





  // chrome.storage.sync.get(['key'], function(result) {
  //   console.log('Value currently is ' + result.key);
  // });

  // console.log('222');
  // console.log(RadioButton.value);

});

