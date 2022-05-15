 ・addEventListenerは、
 HTMLは上から解釈されます。なのでjavascriptが解釈されるときにはbodyは完全に読み込まれていない状況です。
 従って、以下のようにHTMLの読み込みとパースが終わってから
、ボタンクリックのイベントを設定する

document.addEventListener("DOMContentLoaded", function(){
  //RadioButton
  const Radio = document.getElementById("RadioButton");
  Radio.addEventListener('change', () => {



 ・addEventListenerは、単一Nodeを取得できるが、複数Nodeは取得できない
 　ex)  ✖️ document.getElementsByClassName("price-input");
       ○ document.getElementsById("price-input");
  getElementsbyClassNameで取得できるのは,HTMLCollectionというオブジェクト
  HTMLCollectionは複数ノード



Branch情報
develop 最新ソース
feature_develop　動き自体はうまく行ってる
feature_debag_async
