document.addEventListener("DOMContentLoaded", function(){
  //RadioButton
  const Radio = document.getElementById("RadioButton");
  Radio.addEventListener('change', () => {

    //document.addEventListener('change', () => {

      let checkValue = 0;
      let checkedValue = 1;
      let text = '';
      let newKeyName = '';
      let oldKeyName = '';

      console.log('start');

      //1. 選択されていた値取得
      chrome.storage.sync.get(["checkedValue"], (value) => {
        console.log('checkedValue : ' + value.checkedValue);
        checkedValue = value.checkedValue;
      });

      //2. テェックされているラジオボタンの値を取得
      const Radio = document.getElementsByName("radio1");
      const len = Radio.length;

      for (let i = 0; i < len; i++) {
        if(Radio.item(i).checked) {
          checkValue = Radio.item(i).value;
          console.log('チェックした値 : ' + checkValue);
        }
      }

      //3. テキストの入力値を取得
      text = document.getElementById("text");
      console.log('テキストに入力された情報 : ' + text.value);

      //4. 入力値を登録
      console.log(checkedValue);
      oldKeyName = 'key' + `${checkedValue}`;

      let keyName = 'key' + `${checkedValue}`;
      chrome.storage.sync.set({oldKeyName : text});


      //5. 選択されたラジオの情報を取得
      newKeyName = 'key' + `${checkValue}`;
      chrome.storage.sync.get([newKeyName], (value)=> {
        console.log("これをテキストボックスにセットしたら完了：" + value);
        //6. 選択したテキストをセット
        document.getElementById("text").value = value;
      });

      //7. 選択したラジオを登録
      chrome.storage.sync.set({ 'checkedValue': checkValue });
      chrome.storage.sync.set({'checkedValue': 1});
    });
});
