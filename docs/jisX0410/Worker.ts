
namespace jisX0410
{
  export interface IMessage
  {
    operation: "point" | "extent";

    format: "GeoJSON" | "esriJSON" | "shapefile";

    shape:  [number,number] |  IExtent;

    schemaLabel: string;

    maxSchemaLabel: string;
  }//end interface

  export interface IJSONResult
  {
    features: ArrayBuffer;//Array<IGeoJsonFeature | IEsriJsonFeature>;
  }

  export interface IShpResult
  {
    shp: ArrayBuffer;
    shx: ArrayBuffer;
    dbf: ArrayBuffer;
    prj: string;
  }//end interface

  /** メッシュ作成用ワーカ */
  export class MeshWorker{
    
    /** ワーカの保持 */
    private _worker:Worker;

    /** コールバック処理の辞書 */
    private _callbacks: { [index:number]: (msg: IJSONResult | IShpResult ) => void } = {};

    /**
     * コンストラクタ
     * @param url Worker.jsのURL
     */
    constructor(url:string){

      let worker = new Worker(url); 
      //メッセージイベントをセット
      worker.addEventListener('message', this._onMessage.bind(this), false);
      this._worker = worker;
      
    }//end method

   /**
    * ワーカの処理実行
    * @param msg 処理命令 
    * @param callback 処理完了時の実行 
    */
   public postMessage(msg: IMessage, callback: (msg: IJSONResult | IShpResult ) => void){

    (<any>msg)._system = Date.now();
    this._callbacks[(<any>msg)._system] = callback;
    
    this._worker.postMessage( msg );
   }//end method

   /**
    * ワーカからのメッセージ返却時
    * @param event イベント
    */
   private _onMessage( event:MessageEvent ): void{
    
    let result = event.data;

    let callback = this._callbacks[(<any>result)._system];
    delete this._callbacks[(<any>result)._system];
    
    callback(result);

   }//end method
    
  }//end class
}//end namespace


//ブラウザ上でなければWebWorkerとして動作する準備をする
if (typeof addEventListener !== 'undefined') {
  
  addEventListener('message', (event) => {
    //event.data
    //let message = <jisX0410.IMessage> JSON.parse(event.data);
    let message = <jisX0410.IMessage> event.data;
    let MeshUtil  = new jisX0410.MeshUtil();
    let schema: jisX0410.MeshSchema;
    let maxSchema: jisX0410.MeshSchema;

    //シリアル化のため既定のスキーマ以外は現状受け取り不可
    for (let i=0; i<MeshUtil.meshSchemes.length; i++){

      if (message.schemaLabel === MeshUtil.meshSchemes[i].label){
        schema = MeshUtil.meshSchemes[i];
      }//end if
      if (message.maxSchemaLabel && 
          message.maxSchemaLabel === MeshUtil.meshSchemes[i].label){
        maxSchema = MeshUtil.meshSchemes[i];
      }

    }//end loop

    if (message.operation === "point"){
      let latlon = <[number,number]>message.shape;
      
      switch(message.format)
      {
        case "GeoJSON":
          let geofeatures = MeshUtil.createGeoJSON(latlon, schema, maxSchema);
          let geobuffer = MeshUtil.geoJsonToStringBuffer(geofeatures);
          (<any>message).features = geobuffer
          postMessage( message, [geobuffer] );
          //postMessage( JSON.stringify(message) );
        break;
        case "esriJSON":
          let esrifeatures = MeshUtil.createEsriJSON(latlon,schema, maxSchema);
          let esribuffer = MeshUtil.esriJsonToStringBuffer(esrifeatures);
          (<any>message).features = esribuffer
          postMessage( message, [esribuffer] );
          //postMessage( JSON.stringify(message) );
        break;
        case "shapefile":
          let shp = MeshUtil.createShp(latlon, schema, maxSchema);
          (<any>message).prj = shp.prj;
          (<any>message).shp = shp.shp;
          (<any>message).shx = shp.shx;
          (<any>message).dbf = shp.dbf;
          postMessage(message, [shp.shp,shp.shx,shp.dbf]);
          //postMessage(JSON.stringify(message), [shp.shp,shp.shx,shp.dbf]);
        break;
      }//end switch 
    } else if (message.operation === "extent") {
      let extent = <jisX0410.IExtent>message.shape;
      switch(message.format)
      {
        case "GeoJSON":
          let geofeatures = MeshUtil.createGeoJsonFromExtent(extent, schema);
          let geobuffer = MeshUtil.geoJsonToStringBuffer(geofeatures);
          (<any>message).features = geobuffer;
          postMessage( message, [geobuffer]);
          //postMessage( JSON.stringify(message) );
        break;
        case "esriJSON":
          let esrifeatures = MeshUtil.createEsriJsonFromExtent(extent, schema);
          let esribuffer = MeshUtil.esriJsonToStringBuffer(esrifeatures);
          (<any>message).features = esribuffer;
          postMessage( message, [esribuffer]);
          //postMessage( JSON.stringify(message) );
        break;
        case "shapefile":
          let shp = MeshUtil.createShpFromExtent(extent, schema);
          (<any>message).prj = shp.prj;
          (<any>message).shp = shp.shp;
          (<any>message).shx = shp.shx;
          (<any>message).dbf = shp.dbf;
          postMessage(message, [shp.shp,shp.shx,shp.dbf]);
          //postMessage( JSON.stringify(message), [shp.shp,shp.shx,shp.dbf]);
        break;
      }//end switch 
    }//end if
    
    //postMessage("");    
  }, false);
}
