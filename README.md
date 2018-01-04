## 概要(Overview)  
This is a library that handles lat/long grid data for Japan.
I write in Japanese because this lib cannot be used outside of Japan.

Javascriptで地域メッシュを扱うためのライブラリです。  
現状は余り膨大な件数を扱う想定はしておらず、IEには対応していません。

| ブラウザ | 件数      | 所要時間  | 1レコードあたりの処理時間 |
|----------|-----------|-----------|---------------------------|
| Firefox  | 25,600    | 184ミリ秒 | 7.19µs                    |
| Edge     | 25,600    | 167ミリ秒 | 6.52µs                    |
| Chrome   | 25,600    | 236ミリ秒 | 9.22µs                    |
| Firefox  | 2,560,000 | 1.26分    | 29.64µs                   |
| Edge     | 2,560,000 | 1.35分    | 31.57µs                   |
| Chrome   | 2,560,000 | 43.79秒   | 17.11µs                   |

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



