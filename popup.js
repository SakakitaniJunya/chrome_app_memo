document.addEventListener("DOMContentLoaded", function(){
  //ラジオボタン取得
  const Radio = document.getElementById("RadioButton");


  Radio.addEventListener('change', async () => {

    //変数宣言
    let newRadioBtn = 0; //前回選択した
    let oldRadioBtn = 1; //選択したラジオボタン
    let text = '';       //登録したテキスト内容
    let newKeyName = ''; //登録内容を保存するkey
    let oldKeyName = ''; //登録内容を記録するkey

    console.log('start');
    const Radio = document.getElementsByName("radio1");
    const len = Radio.length; //ラジオボタンの数
    textElement = document.getElementById("text");
    text = textElement.value

    for (let i = 0; i < len; i++) {
      if(Radio.item(i).checked) {
        newRadioBtn = Radio.item(i).value;
        console.log('チェックした値 : ' + newRadioBtn);
        newKeyName = 'key' + `${newRadioBtn}`;
      }

    }


    const getOldRadioBtn = () => {
      chrome.storage.sync.get(["checkedValue"],  (value) => {
        console.log('checkedValue 格納してたやつ : ' + value.checkedValue);
        oldRadioBtn = value.checkedValue;
        oldKeyName = 'key' + `${oldRadioBtn}`;
        console.log('順ばん1 ' );
      })
    };

    const setNewRadioBtn = (newRadioBtn) => {
      chrome.storage.sync.set({["checkedValue"]: newRadioBtn});
    };

    const registContent = (oldKeyName, text) => {
      chrome.storage.sync.set({ [oldKeyName] : text} );
      console.log('順ばん2 ' );
    };


    function getSavedContent(newKeyName) {
      chrome.storage.sync.get([newKeyName], (value) => {
        document.getElementById("text").value = value[newKeyName];
      });

    };




    const test = () => {
      chrome.storage.sync.get(null, ((data) => {console.log(data)}));
      console.log('最後');
    }

    new Promise(resolve => {
      getOldRadioBtn();
      resolve();
  })
      .then(() => {
          return new Promise(resolve => {
            setNewRadioBtn(newRadioBtn);
            resolve();
          });
      })
      .then(() => {
          return new Promise(resolve => {
              registContent(oldKeyName, text);
              resolve();
          });
      })
     .then(() => {
          return new Promise(resolve => {
             getSavedContent(newKeyName);
             resolve();
          });
      })
        .then(() => {
        test();
        });
    });

});
