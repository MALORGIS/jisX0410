/// <reference path="../../jisX0410/index.d.ts" />


namespace samples {

  /** 地図ページのコントロール */
  export class MapPageController {

    /** angular scope */
    private _scope: angular.IScope;
    /** メッシュ作成用 WebWorker */
    private _worker:jisX0410.MeshWorker;
    /** メッシュ作成用ユーティリティクラス */
    private _meshUtil: jisX0410.MeshUtil;

    /** Leaflet Mapコントローラ */
    private _map:L.Map;

    /** 地点でのメッシュ作成時の表示用レイヤ */
    private _pointLayer: L.GeoJSON;
    /** 地点でのメッシュ作成時の表示用レイヤ */
    private _pointLblLayer: L.Marker;
    /** 範囲でのメッシュ作成時の表示用レイヤ */
    private _extentLayer: L.FeatureGroup;
    /** 範囲でのメッシュ作成時の範囲指定コントロール */
    private _draw: L.Control;

    /** 範囲指定時に件数による制限制御をおこなうかどうか */
    private _checkCount:boolean = true;

    /** 処理実行中=TRUE */
    public wait:boolean = false;

    /** 現在の処理(地点での作成か範囲での作成か) */
    public operation: "point" | "extent" = "point";

    /** 作成するメッシュ構造 */
    public selectedSchema: jisX0410.MeshSchema;
    /** 作成可能なメッシュ構造一覧 */
    public schemaList: Array<jisX0410.MeshSchema>;
    /** 制限とするメッシュ構造 */
    public selectedMaxSchema:jisX0410.MeshSchema;
    /** 制限とするメッシュ構造一覧 (作成するメッシュ構造の親) */
    public maxSchemaList: Array<jisX0410.MeshSchema> = [];

    /** メッシュコード値の入力用 */
    public meshCodeText: string;

    /** 作成するメッシュデータのファイル形式 */
    public format: "GeoJSON" | "esriJSON" | "shapefile" = "GeoJSON";
    /** 作成可能なファイル形式の一覧 */
    public fromatList: Array<"GeoJSON" | "esriJSON" | "shapefile"> = [
      "GeoJSON" , "esriJSON" , "shapefile"
    ];

    /**
     * コンストラクタ
     * @param Angularスコープ
     */
    constructor($scope: angular.IScope) {
      this._scope = $scope;

      let worker = new jisX0410.MeshWorker('./jisX0410/index.js');
      this._worker = worker;

      this._meshUtil = new jisX0410.MeshUtil();
      this.schemaList = this._meshUtil.meshSchemes;
      this.selectedSchema = this._meshUtil.meshSchemes[4];
      //設定スキーマの親をセット
      this.onChangeSchema();

      //マップの初期化処理
      let map = new L.Map('map',{
        zoomControl: false
      });
      L.control.zoom({
        position:'topright'
      }).addTo(map);

      this._map = map;
      //地図移動時のイベントを登録
      map.on('moveend', this._onMapMoveEnd.bind(this));

      (new GSILayer(GSILayerType.pale)).addTo(map);
      map.setView([35.0,135], 5);
      
      //編集レイヤの初期化
      let editableLayers = new L.FeatureGroup();
      map.addLayer(editableLayers);
      this._extentLayer = editableLayers;

      let options = {
        position: 'topright',
        draw: {
          polyline:false,
          polygon: false,
          marker: false,
          circle: false, // Turns off this drawing tool
          circlemarker:false,
          rectangle: {
            shapeOptions: {
              clickable: false
            }
          }
        },
        edit: {
          featureGroup: editableLayers, //REQUIRED!!
          edit: false,
          remove: false
        }
      };
      //一応日本語化
      (<any>L).drawLocal.draw.toolbar.buttons.rectangle = '範囲を地図上で指定';
      (<any>L).drawLocal.draw.handlers.rectangle.tooltip.start = 'ドラッグで範囲を指定.';
      (<any>L).drawLocal.draw.handlers.simpleshape.tooltip.end = 'マウスを離して描画終了.';

      // L.Control.Drawはimport前提として動作する様なので。
      let drawControl: L.Control = new (<any>L.Control).Draw(options);
      //map.addControl(drawControl);
      this._draw = drawControl;
      
      map.on( (<any>L).Draw.Event.CREATED, (e:any) => {
        let type = e.layerType,
            layer = e.layer;
        editableLayers.clearLayers();
        editableLayers.addLayer(layer);
        //反映
        this._scope.$apply();

      });

      L.control.scale({ imperial:false }).addTo(map);

    }//end method

    /** 作成メッシュ構造が変化した際 */
    public onChangeSchema(): void {
      //一旦リセット
      this.maxSchemaList = [];
      this._setMaxSchema(this.selectedSchema.parent);

      //セットされていれば最上位の親を指定
      if (0 < this.maxSchemaList.length)
        this.selectedMaxSchema = this.maxSchemaList[ this.maxSchemaList.length -1 ];

      //地点指定時に描画されている上位メッシュ範囲を再描画
      this._onMapMoveEnd();

    }//end method

    /** 地点/範囲の変更 */
    public onChangeOperation():void {

      //範囲指定に変更
      if (this.operation === "extent"){
        //マップに描画コントロールをセット
        this._draw.addTo(this._map);

        //地点描画の範囲を削除
        if (this._pointLayer)
          this._pointLayer.remove();
        if (this._pointLblLayer)
          this._pointLblLayer.remove();

        //範囲が無ければ設定する
        let layers = this._extentLayer.getLayers();
        if (!layers || layers.length < 1){
          let bounds = this._map.getBounds();
          bounds = bounds.pad(-0.3);

          //bounds = bounds.pad(0.8);
          this._extentLayer.addLayer(L.rectangle(bounds));
        }//end if
      } else {
        //地点指定の場合は描画コントロールを外す
        this._draw.remove();
        //範囲もクリア
        this._extentLayer.clearLayers();
        //地図中心で再描画
        this._onMapMoveEnd();

      }//end if

    }//end method

    /**
     * メッシュ件数のカウント
     * @returns メッシュ件数
     */
    public calcMeshCount(): number {
      //地点で作成時
      if (this.operation === "point"){
        return this._meshUtil.calcMeshCount(this.selectedSchema, this.selectedMaxSchema);
      //範囲で作成時
      } else if (this.operation === "extent"){
        let bounds = this._extentLayer.getBounds();
        let sw = bounds.getSouthWest();
        let ne = bounds.getNorthEast();
        let extent: jisX0410.IExtent = { xmin: sw.lng, ymin: sw.lat, xmax:ne.lng, ymax:ne.lat };
        return this._meshUtil.calcMeshCountFromExtent(extent, this.selectedSchema);
      }
      return 0;
    }

    /** 件数確認を飛ばして実行 */
    public skipCheckCount():void{
      this._checkCount = false;
      this.create();
    }//end method

    /** 分割作成 */
    public splitCreate(): void {
      //待機状態をセット
      this.wait = true;

      let util = this._meshUtil;
      //範囲計算
      let bounds = this._extentLayer.getBounds();
      let sw = bounds.getSouthWest();
      let ne = bounds.getNorthEast();
      let createArea = { xmin: sw.lng, ymin: sw.lat, xmax:ne.lng, ymax:ne.lat };

      //一次メッシュを作る
      let data = util.createGeoJsonFromExtent(createArea, util.meshSchemes[0]);

      //地点表示用レイヤに入れる
      if (this._pointLayer)
        this._pointLayer.remove();

      let geoJson = L.geoJSON(<any>data, {
        onEachFeature: function (feature, layer) {    
          layer.bindPopup(feature.properties.meshCode);
        }
      }).addTo(this._map);
      this._pointLayer = geoJson;
      const mesh1 = [3036,3622,3623,3624,3631,3641,3653,3724,3725,3741,3823,3824,3831,3841,3926,3927,3928,3942,4027,4028,4040,4042,4128,4129,4142,4229,4230,4328,4329,4429,4440,4529,4530,4531,4540,4629,4630,4631,4728,4729,4730,4731,4739,4740,4828,4829,4830,4831,4839,4928,4929,4930,4931,4932,4933,4934,4939,5029,5030,5031,5032,5033,5034,5035,5036,5038,5039,5129,5130,5131,5132,5133,5134,5135,5136,5137,5138,5139,5229,5231,5232,5233,5234,5235,5236,5237,5238,5239,5240,5332,5333,5334,5335,5336,5337,5338,5339,5340,5432,5433,5435,5436,5437,5438,5439,5440,5531,5536,5537,5538,5539,5540,5541,5636,5637,5638,5639,5640,5641,5738,5739,5740,5741,5839,5840,5841,5939,5940,5941,5942,6039,6040,6041,6139,6140,6141,6239,6240,6241,6243,6339,6340,6341,6342,6343,6439,6440,6441,6442,6443,6444,6445,6540,6541,6542,6543,6544,6545,6546,6641,6642,6643,6644,6645,6646,6647,6741,6742,6747,6748,6840,6841,6842,6847,6848];
      geoJson.eachLayer( (layer:L.Polygon) => {
        //メッシュコード
        let meshCd = parseInt(<string>layer.getPopup().getContent());
        //無ければ削る
        if (mesh1.indexOf(meshCd) < 0){
          geoJson.removeLayer(layer);
          layer.remove();
        }
      });

      //処理実行開始
      this._splitPrc();
    }//end method

    /** 分割実行 */
    private _splitPrc(){

      let layers = this._pointLayer.getLayers();
      if (!layers || layers.length < 1){
        //待機を解除
        this._pointLayer.remove();
        this.wait = false;

        this._scope.$apply();
        return;
      }
      let layer = <L.Polygon>layers.pop();
      //メッシュコード
      let meshCd = <string>layer.getPopup().getContent();
      //中心
      let center = layer.getBounds().getCenter();

      //作成開始
      this._worker.postMessage(<jisX0410.IMessage>{
        operation: "point",
        //format: "GeoJSON",
        format: this.format,
        shape: [center.lat, center.lng],
        schemaLabel : this.selectedSchema.label,
        maxSchemaLabel: this.selectedMaxSchema ? this.selectedMaxSchema.label : undefined
      }, (evt: jisX0410.IJSONResult | jisX0410.IShpResult) =>{
          
        let dt = new Date();
        let year = dt.getFullYear();//年
        let month = dt.getMonth()+1;//月 1月が0、12月が11。そのため+1をする。 
        var date = dt.getDate();//日
        let nameBase:string = `${this.format.toLowerCase()}${year}${('00' + month).slice(-2)}${('00' + date).slice(-2)}-${meshCd}`;

        if (this.format === "GeoJSON"){
          let data = (<jisX0410.IJSONResult>evt).features;
          this._download( data, 'geojson', nameBase );

        } else if (this.format === "esriJSON"){
          let data = (<jisX0410.IJSONResult>evt).features;
          this._download( data, 'esrijson', nameBase );

        } else {
          let data = <jisX0410.IShpResult>evt;
          this._download(data.shp, "shp", nameBase);
          this._download(data.shx, "shx", nameBase);
          this._download(data.dbf, "dbf", nameBase);
          this._download(data.prj, "prj", nameBase);
        }
        
        //レイヤを削除
        this._pointLayer.removeLayer(layer);
        layer.remove();
        //再帰実行
        this._splitPrc();

      } );

    }

    /**
     * 作成処理
     */
    public create(): void {

      //2,560,000 2百56万件以上なら分割処理を確認
      if (this._checkCount && 2560000 < this.calcMeshCount()){
        (<any>$('#MyModal')).modal({});
        return;
      }
      //件数確認をonにする
      this._checkCount = true;

      //待機にセット
      this.wait = true;
      let createArea:[number, number] | jisX0410.IExtent;
      if (this.operation === "point"){
        let center = this._map.getCenter();
        createArea = [center.lat, center.lng];
      } else {
        let bounds = this._extentLayer.getBounds();
        let sw = bounds.getSouthWest();
        let ne = bounds.getNorthEast();
        createArea = { xmin: sw.lng, ymin: sw.lat, xmax:ne.lng, ymax:ne.lat };
      }

      this._worker.postMessage(<jisX0410.IMessage>{
        operation: this.operation,
        //format: "GeoJSON",
        format: this.format,
        shape: createArea,
        schemaLabel : this.selectedSchema.label,
        maxSchemaLabel: this.selectedMaxSchema ? this.selectedMaxSchema.label : undefined
      }, (evt: jisX0410.IJSONResult | jisX0410.IShpResult) =>{
          
        let dt = new Date();
        let year = dt.getFullYear();//年
        let month = dt.getMonth()+1;//月 1月が0、12月が11。そのため+1をする。 
        var date = dt.getDate();//日
        let nameBase:string = `${this.format.toLowerCase()}${year}${('00' + month).slice(-2)}${('00' + date).slice(-2)}`;

        //待機を解除
        this.wait = false;
        this._scope.$apply();

        if (this.format === "GeoJSON"){
          let data = (<jisX0410.IJSONResult>evt).features;
          this._download( data, 'geojson', nameBase );

        } else if (this.format === "esriJSON"){
          let data = (<jisX0410.IJSONResult>evt).features;
          this._download( data, 'esrijson', nameBase );

        } else {
          let data = <jisX0410.IShpResult>evt;
          this._download(data.shp, "shp", nameBase);
          this._download(data.shx, "shx", nameBase);
          this._download(data.dbf, "dbf", nameBase);
          this._download(data.prj, "prj", nameBase);
        }

      } );

    }//end method

    /**
     * メッシュコード値入力で移動可能か
     * @returns 移動可否
     */
    public canMoveMeshCode():boolean {
      let meshCode = this.meshCodeText;
      if (meshCode && meshCode.trim().replace(/\s/g,"").length < 1){
        return false;
      }
      return true;
    }//end method

    /** メッシュコード値の入力地点に移動 */
    public moveMeshCode():void {

      if (!this.canMoveMeshCode())
        return;

      let meshCode = this.meshCodeText;
      let sc = this._meshUtil.meshCode2Schema(meshCode);
      if (!sc)
        return;
      let info = sc.meshCode2MeshInfo(meshCode);
      let lon = info.lonMs + sc.widthMs / 2.0;
      let lat = info.latMs + sc.heightMs / 2.0;
      lon = lon / jisX0410.MeshSchema.MILLISECOND;
      lat = lat / jisX0410.MeshSchema.MILLISECOND;

      let map = this._map;
      map.setView([lat, lon], map.getZoom());
      
    }//end method

    /** 地図の移動終了時 */
    private _onMapMoveEnd(){
      //地点指定でなければ戻す
      if (this.operation !== "point" || !this._map)
        return;

      //中心座標を取る
      let center = this._map.getCenter();
      let latlon: [number, number] = [center.lat, center.lng];

      //制限するメッシュ構造を取得
      let util = this._meshUtil;
      let schema = this.selectedMaxSchema;
      if (!schema)
        schema = this.selectedSchema
      
      //GeoJSONを作成
      let features = util.createGeoJSON(latlon, schema, schema);
      var data ={
        "type": "FeatureCollection",
        "features": features
      };

      //すでに地図表示されているものを削除
      if (this._pointLayer)
        this._pointLayer.remove();

      //新たに地図表示
      let geoJson = L.geoJSON(<any>data, {
        onEachFeature: function (feature, layer) {    
          layer.bindPopup(feature.properties.meshCode);
        }
      }).addTo(this._map);

      this._pointLayer = geoJson;

      //一応 DIVで地図上にメッシュコードを表示
      if (this._pointLblLayer)
        this._pointLblLayer.remove();
      
      let marker = new L.Marker(geoJson.getBounds().getCenter(), {
        icon: new L.DivIcon({
            //className: 'my-div-icon',
            html: `<span style="text-align: center;">${features[0].properties.meshCode}</span>`
        })
      });
      this._pointLblLayer  =marker;
      marker.addTo(this._map);

    }//end method


    /**
     * 親スキーマの登録
     * @param schema セットする親スキーマ
     */
    private _setMaxSchema(schema:jisX0410.MeshSchema): void{
      if (schema)
        this.maxSchemaList.push(schema);
      //あれば再帰呼び出し
      if (schema && schema.parent)
        this._setMaxSchema(schema.parent);
    }//end method

    /**
     * ブラウザダウンロード処理
     * @param data ダウンロードさせるデータ
     * @param ext 拡張子
     * @param name ファイル名称
     */
    private _download(data:ArrayBuffer | string, ext:string, name:string):void{

      let blobData:Blob;

      //文字ならtextデータとして処理
      if (typeof data === 'string'){
        let cType = "text/plain";

        blobData = new Blob([data], {type: cType});
      } else {
        blobData = new Blob([data], {type: 'application/' + ext});
      }//end if

      //Microsoft系なら専用メソッドを使用
      if (window.navigator.msSaveBlob) {
        // IEとEdge
        window.navigator.msSaveBlob(blobData, name + ext);

      //他のブラウザはLINK作成とクリック処理
      } else if (window.URL.createObjectURL) {

        let link = document.createElement("a");
        window.document.body.appendChild(link);
        link.href = window.URL.createObjectURL(blobData);
        link.download = name + "." + ext;
        link.click();
        window.setTimeout( () => {
          window.document.body.removeChild(link);
        }, 1000 * 60 * 5);

      } else {

        let reader = new FileReader();
        reader.onload = () => {
          
          let link = document.createElement("a");
          window.document.body.appendChild(link);
          link.href = <string>reader.result;
          link.download = name + "." + ext;
          link.click();
          window.setTimeout( () => {
            window.document.body.removeChild(link);
          }, 1000 * 60 * 5);

        };
        reader.readAsDataURL(blobData);

      }//end uf

    }//end method


  }//end class






}//end namespace