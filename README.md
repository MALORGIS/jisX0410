## 概要(Overview)  
This is a library that handles lat/long grid data for Japan.
I write in Japanese because this lib cannot be used outside of Japan.

Javascriptで地域メッシュを扱うためのライブラリです。  
現状は余り膨大な件数を扱う想定はしていません。

| ブラウザ | 件数      | 所要時間  | 1レコードあたりの処理時間 |
|----------|-----------|-----------|---------------------------|
| Firefox  | 25,600    | 205ミリ秒 | 8.0µs                     |
| Edge     | 25,600    | 167ミリ秒 | 6.52µs                    |
| Chrome   | 25,600    | 270ミリ秒 | 10.55µs                   |
| IE11     | 25,600    | 308ミリ秒 | 12.03µs                   |
| Firefox  | 2,560,000 | 58.67秒   | 22.92µs                   |
| Edge     | 2,560,000 | 1.35分    | 31.57µs                   |
| Chrome   | 2,560,000 | 38.3秒    | 14.96µs                   |
| IE11     | 2,560,000 | メモリ不足 | メモリ不足                |

## 開発
Windows環境にて開発しております。  
開発環境を用意する場合、nodeとvscodeをインストールしてください。  
vscodeに「Debugger for Chrome」を追加してください。  
デバッグ用にChromeも必要ですがvscodeで他のブラウザを使用する場合はlaunch.jsonを書き換えてください。  
  
Typescriptで記述している為、Typescriptをインストールしてください。  
`npm install -g typescript`  
  
テストの実施に必要なパッケージ  
`npm install -g mocha istanbul remap-istanbul`  
  
クローン後 
`npm i`  
`npm run build`  ※vscode内からも実施可能  
`npm test`  ※必須ではない  
上記コマンドを実行し、vscodeでフォルダを開いてデバッグにて[Server/Client]を実行するとデバッグ可能です。  



