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
        console.log('checkedValue 格納してたやつ : ' + value.checkedValue);
        checkedValue = value.checkedValue;
           //2. テェックされているラジオボタンの値を取得
        const Radio = document.getElementsByName("radio1");
        const len = Radio.length;

        const radioCheck = () => {

        for (let i = 0; i < len; i++) {
          if(Radio.item(i).checked) {
            checkValue = Radio.item(i).value;
            console.log('チェックした値 : ' + checkValue);
          }
          }
        }

        radioCheck();
        //3. テキストの入力値を取得
        text = document.getElementById("text");
        console.log('テキストに入力された情報 : ' + text.value);
        //4. 入力値を登録
        console.log(checkedValue);
        oldKeyName = 'key' + `${checkedValue}`;
        console.log(oldKeyName);
        chrome.storage.sync.set({[oldKeyName] : text.value}, (value) => {
          console.log("登録情報" + value);
        });



        //5. 選択されたラジオの情報を取得
        newKeyName = 'key' + `${checkValue}`;
        console.log('セットしたいキー' + newKeyName);
        chrome.storage.sync.get("key2", (value)=> {
          console.log("これをテキストボックスにセットしたら完了：" + value.newKeyName + "格納したキー:" + value.key);
          //6. 選択したテキストをセット
          document.getElementById("text").value = value.newKeyName;

          //7. 選択したラジオを登録
          chrome.storage.sync.set({'checkedValue': checkValue });


      });

      });







    // storage.syncの場合
    chrome.storage.sync.get(null, ((data) => {console.log(data)}));


    });
});
