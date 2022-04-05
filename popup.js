let checkValue = 1;
document.addEventListener('change', function() {

  function key_storage() {
    for (let i = 0; i < 6; i++) {
      chrome.storage.sync.set({i : ''});
      console.log("test");
    }
  }
  key_storage()
  const RadioButton = document.getElementById("RadioButton");
  const Radio = document.getElementsByName("radio1");
  let len = Radio.length;



  //テキスト取得
  let element = document.getElementById('text');


  console.log(checkValue);
  console.log(element.value);

  //情報の登録
  chrome.storage.sync.set({checkValue: element});

  //ラジオボタン番号取得
  for (let i = 0; i < len; i++) {
    if(Radio.item(i).checked){
      checkValue = Radio.item(i).value;

    }
  }
  chrome.storage.local.set({key: "aaa"}, function() {
    console.log('Value is set to ' + value);
  });

  chrome.storage.local.get(['key'], function(result) {
    console.log('Value currently is ' + result.key);
  });

  console.log(checkValue);

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

