
/*
 * サーバ/クライアント切り替え定義
 * 多少イレギュラーだが module.exportsでサーバ側でも読み込み可能にしておく。
 * クライアントでの使用がメインの想定なのでモジュール定義はせずおく
 */

namespace jisX0410
{
  declare var module : any;
  //if (typeof window === 'undefined'){
  //if ((<any>global).window !== global) {
  if (typeof module !== 'undefined'){
    module.exports = jisX0410;
  }//end if
}//end namespace