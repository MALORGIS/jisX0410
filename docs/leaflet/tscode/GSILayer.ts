
namespace samples {

  /** 地理院地図レイヤの初期化に使用するレイヤ種別 */
  export enum GSILayerType {
    std = "std",
    pale = "pale",
    seamlessphoto = "seamlessphoto",
  }

  /** 地理院地図レイヤ */
  export class GSILayer extends L.TileLayer {

    /**
     * コンストラクタ
     * @param type レイヤ種別
     */
    public constructor(type: GSILayerType){

      /** レイヤ種別と対応する定義情報 */
      let types = {
        std: { ext: 'png', min: 2, max: 18, discription: '標準地図' },
        pale: { ext: 'png', min: 2, max: 18, discription: '淡色地図' },
        seamlessphoto: { ext: 'jpg', min: 2, max: 18, discription: '写真' },
      };
  
      //レイヤ初期化情報の取得
      let layerType = types[type];
      let url = "https://cyberjapandata.gsi.go.jp/xyz/" + type + "/{z}/{x}/{y}." + layerType.ext;

      //初期化オプションを構成
      var options: L.TileLayerOptions = {
        attribution: "<a href='http://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html' target='_blank'>国土地理院</a>",
        maxZoom: layerType.max,
        minZoom: layerType.min,
        bounds: [[20, 122], [46, 155]]
      };
      //L.TileLayerのコンストラクタを実行
      super(url, options);
    }//end method
  }//end class
}//end namespace