document.addEventListener("DOMContentLoaded", function(){
  //RadioButton
  const Radio = document.getElementById("RadioButton");


  Radio.addEventListener('change', () => {

      let checkValue = 0;
      let checkedValue = 1;
      let text = '';
      let newKeyName = '';
      let oldKeyName = '';

      console.log('start');

      //1. 入力・選択した値取得
      //選択されたラジオボタン取得
      const Radio = document.getElementsByName("radio1");
      const len = Radio.length;

      for (let i = 0; i < len; i++) {
        if(Radio.item(i).checked) {
          checkValue = Radio.item(i).value;
          console.log('チェックした値 : ' + checkValue);
        }
      }
      //3. テキストの入力値を取得
      textElement = document.getElementById("text");
      text = textElement.value
      console.log('テキストに入力された情報 : ' + text);

      //5. 選択されたラジオの情報を取得
      newKeyName = 'key' + `${checkValue}`;
      console.log('newkey' + newKeyName);

      //--以下非同期が必要な処理
      //2. 選択されていた値取得
      const getOldRadioBtn = () => {
        chrome.storage.sync.get(["checkedValue"], (value) => {
          console.log('checkedValue 格納してたやつ1 : ' + value.checkedValue);
          checkedValue = value.checkedValue;
             //2. テェックされているラジオボタンの値を取得
           oldKeyName = 'key' + `${checkedValue}`;

        })
        return Promise.resolve(1);
      }
      //3. 選択されていた番号に情報を格納
      const setValue = () => {
        //chrome.storage.sync.set({ [keyName] : keyName }) ;
        chrome.storage.sync.set({ [oldKeyName] : oldKeyName} );
        //   , () => {
        console.log('oldkeyname:2 ' + `${oldKeyName}` + `${text}` );
        // });
        return Promise.resolve(1)
      }
      //4. 選択された番号の保存情報を取得する
      const getOldValue = () => {
        chrome.storage.sync.set({'checkedValue': checkValue });
        return Promise.resolve(1)
      }
      //5. 選択された番号に入力値をセット
      const setNewValue = () => {
        console.log(newKeyName);
        chrome.storage.sync.get([newKeyName], (value) => {
          console.log("これをテキストボックスにセットしたら完了：" + value[newKeyName] + "格納したキー:" + value);
          //6. 選択したテキストをセット

          document.getElementById("text").value = value[newKeyName];
        });
        return Promise.resolve(1)
      }

      //7. storage.syncの場合
      const test = () => {
        chrome.storage.sync.get(null, ((data) => {console.log(data)}));
        console.log('最後');
        return Promise.resolve(1)
      }

      test();

      (async() => {
        await setLocalStorage({result1: 1, result2: 2});

        let result1 = await getOlgRadioBtn("CheckedValue");
        let result2 = await setValue(oldKeyName);

        function getOldRadioBtn(value) {
          return new Promise( (result) => {
            chrome.storage.sync.set([value] ,() => resolve)
          })
        }

        //2. テェックされているラジオボタンの値を取得

        oldKeyName = 'key' + `${checkedValue}`;
        chrome.storage.sync.set({ [oldKeyName] : oldKeyName} );
      });
  });

});
