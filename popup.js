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

    for (let i = 0; i < len; i++) {
      if(Radio.item(i).checked) {
        newRadioBtn = Radio.item(i).value;
        console.log('チェックした値 : ' + newRadioBtn);
      }

    }


    const getOldRadioBtn = () => {
      chrome.storage.sync.get(["checkedValue"],  (value) => {
        console.log('checkedValue 格納してたやつ : ' + value.checkedValue);
        oldRadioBtn = value.checkedValue;
      })
    };

    const setNewRadioBtn = (newRadioBtn) => {


    }
j
    const registrateContent = (text, newRadioBtn) => {
    document.getElementById("text").value = value.newKeyName;

    }

    const getSavedContent = (oldRadioBtn) => {

    }

    try {
      const firstResult = await getOldRadioBtn()
      const secondResult = await getOldRadioBtn(firstResult)
      const thirdResult = await getOldRadioBtn(secondResult)
      const finalResult = await getOldRadioBtn(thirdResult)
      console.log(`Got the final result: ${finalResult}`);

    } catch(error) {

      console.log(`failed : ${error}`);

    }
    //test
    });

});
