document.addEventListener("DOMContentLoaded", function(){
  //RadioButton
  const Radio = document.getElementById("RadioButton");


  Radio.addEventListener('change', async() => {

      let checkValue = 0;
      let checkedValue = 1;
      let text = '';
      let newKeyName = '';
      let oldKeyName = '';

      console.log('start');

      //1. 入力・選択した値取得
      //選択されたラジオボタン取得


      //--以下非同期が必要な処理
      //2. 選択されていた値取得
      const getOldRadioBtn = () => {

      }

      //3. 選択されていた番号に情報を格納
      const setValue = () => {

      }
      //4. 選択された番号の保存情報を取得する
      const getOldValue = () => {

      }
      //4. 選択された番号に入力値をセット
      const setNewValue = () => {

      }

      chrome.storage.sync.get(["checkedValue"], async (value) => {
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
        textElement = document.getElementById("text");
        text = textElement.value
        console.log('テキストに入力された情報 : ' + text.value);
        //4. 入力値を登録
        console.log(checkedValue);
        oldKeyName = 'key' + `${checkedValue}`;
        console.log(oldKeyName);

        //こいつが遅い
        await chrome.storage.sync.set({[oldKeyName] : text}, async(value) => {
          console.log("登録情報" + value);
        });

        //5. 選択されたラジオの情報を取得
        newKeyName = 'key' + `${checkValue}`;
        await console.log('セットしたいキー' + newKeyName);



        await chrome.storage.sync.get([newKeyName], (value)=> {
          console.log("これをテキストボックスにセットしたら完了：" + value.newKeyName + "格納したキー:" + value);
          //6. 選択したテキストをセット
          //ここがうまく行っていない
          document.getElementById("text").value = value.newKeyName;
        });

          //7. 選択したラジオを登録
         await chrome.storage.sync.set({'checkedValue': checkValue });



      });


      // storage.syncの場合
      await chrome.storage.sync.get(null, ((data) => {console.log(data)}));


    });


});
