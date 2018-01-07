/// <reference path="meshSchema.ts" />import { json } from "../node_modules/@types/body-parser/index";



namespace jisX0410
{
  /** 出力するGeoJsonの簡単な定義 */
  export interface IGeoJsonFeature
  {
    type: string,

    geometry: {
      type: string,
      coordinates:Array<[number, number][]>
    },
    properties: {
      meshCode: string
    }
  }//end interface

  /** 出力するEsriJsonの簡単な定義 */
  export interface IEsriJsonFeature
  {
    geometry: { rings: Array<[number, number][]> };
    attributes: {meshCode: string};
  }//end interface


  /** メッシュ情報保持用 */
  interface IMesh
   {
    meshInfo:IMeshInfo,

    coords:Array<[number, number]>
  }


  /**
   * メッシュ管理クラス
   */
  export class meshUtil
  {
    /** メッシュ情報定義 */
    public meshSchemes: Array<meshSchema> = meshSchema.createStandardMesh();

    /** 分割数 */
    private _divCount: number;

    /** コンストラクタ */
    public constructor()
    {
    }//end method

    /**
     * 
     * @param extent 
     * @param schema 
     */
    public calcMeshCountFromExtent(extent:IExtent, schema:meshSchema)
      : number {
      //左下隅のメッシュを取得して左下隅座標を書き換え
      let leftLower = this._getMeshInfoFromBl([extent.ymin,extent.xmin], schema);
      let minXY = leftLower.coords[0];

      let widthDD = Math.sqrt(Math.pow(extent.xmax-minXY[0],2));
      let heightDD = Math.sqrt(Math.pow(extent.ymax -minXY[1],2));

      let cols = Math.ceil(widthDD / schema.widthDD);
      let rows = Math.ceil(heightDD / schema.heightDD);
      
      return cols * rows;
    }//end method

    /**
     * ４隅座標分 指定メッシュの作成
     * @param extent 4隅座標(矩形)
     * @param schema メッシュ構造
     * @returns GeoJsonFeature Array
     */
    public createGeoJsonFromExtent(extent:IExtent, schema:meshSchema)
      : Array<IGeoJsonFeature> {
      
      //左下隅のメッシュを取得して左下隅座標を書き換え
      let leftLower = this._getMeshInfoFromBl([extent.ymin,extent.xmin], schema);
      let minXY = leftLower.coords[0];

      let widthDD = Math.sqrt(Math.pow(extent.xmax-minXY[0],2));
      let heightDD = Math.sqrt(Math.pow(extent.ymax -minXY[1],2));

      let cols = Math.ceil(widthDD / schema.widthDD);
      let rows = Math.ceil(heightDD / schema.heightDD);
      if (cols <1)
        cols = 1;
      if (rows <1)
        rows = 1;
      
      let results = new Array(rows * cols);
      for (let index=0; index < rows*cols; index++){
        //行列を計算
        let r = Math.floor(index / cols);
        let c = index % cols;

        let x = (minXY[0] + schema.widthDD/2) + (c * schema.widthDD);
        let y = (minXY[1] + schema.heightDD/2) + (r * schema.heightDD);
        //計算した緯度経度からメッシュ情報を取得
        let info:IMesh = this._getMeshInfoFromBl([y,x], schema);
        results[index] = this._toGeoJson(info);
      }//end index loop

      return results;
    }//end method

    
    /**
     * ４隅座標分 指定メッシュの作成
     * @param extent 4隅座標(矩形)
     * @param schema メッシュ構造
     * @returns GeoJsonFeature Array
     */
    public createEsriJsonFromExtent(extent:IExtent, schema:meshSchema)
      : Array<IEsriJsonFeature> {
      
      //左下隅のメッシュを取得して左下隅座標を書き換え
      let leftLower = this._getMeshInfoFromBl([extent.ymin,extent.xmin], schema);
      let minXY = leftLower.coords[0];

      let widthDD = Math.sqrt(Math.pow(extent.xmax-minXY[0],2));
      let heightDD = Math.sqrt(Math.pow(extent.ymax -minXY[1],2));

      let cols = Math.ceil(widthDD / schema.widthDD);
      let rows = Math.ceil(heightDD / schema.heightDD);
      if (cols <1)
        cols = 1;
      if (rows <1)
        rows = 1;
      
      let results = new Array(rows * cols);
      for (let index=0; index < rows*cols; index++){
        //行列を計算
        let r = Math.floor(index / cols);
        let c = index % cols;

        let x = (minXY[0] + schema.widthDD/2) + (c * schema.widthDD);
        let y = (minXY[1] + schema.heightDD/2) + (r * schema.heightDD);
        //計算した緯度経度からメッシュ情報を取得
        let info:IMesh = this._getMeshInfoFromBl([y,x], schema);
        results[index] = this._toEsriJson(info);
      }//end loop index
      
      return results;
    }//end method

    /**
     * ４隅座標分 指定メッシュの作成
     * @param extent 4隅座標(矩形)
     * @param schema メッシュ構造
     * @returns GeoJsonFeature Array
     */
    public createShpFromExtent(extent:IExtent, schema:meshSchema,shpOpt:IShpCreateOption = undefined)
    : shpFile {
      
      //左下隅のメッシュを取得して左下隅座標を書き換え
      let leftLower = this._getMeshInfoFromBl([extent.ymin,extent.xmin], schema);
      let minXY = leftLower.coords[0];

      let widthDD = Math.sqrt(Math.pow(extent.xmax-minXY[0],2));
      let heightDD = Math.sqrt(Math.pow(extent.ymax -minXY[1],2));

      let cols = Math.ceil(widthDD / schema.widthDD);
      let rows = Math.ceil(heightDD / schema.heightDD);
      if (cols <1)
        cols = 1;
      if (rows <1)
        rows = 1;
      
      let results = new Array(rows * cols);
      for (let index=0; index < rows*cols; index++){
        //行列を計算
        let r = Math.floor(index / cols);
        let c = index % cols;

        let x = (minXY[0] + schema.widthDD/2) + (c * schema.widthDD);
        let y = (minXY[1] + schema.heightDD/2) + (r * schema.heightDD);
        //計算した緯度経度からメッシュ情報を取得
        let info:IMesh = this._getMeshInfoFromBl([y,x], schema);
        results[index] = { 
          "geometry": info.coords,
          "meshCode": info.meshInfo.meshCode
        };
      }//end loop index
      
      //SHPの返却
      return new shpFile(results, shpOpt);
    }//end method
    

    /**
     * メッシュ件数の計算
     * @param schema 作成するメッシュ構造
     * @param maxSchema 上位メッシュ構造
     * @returns 件数
     */
    public calcMeshCount(schema: meshSchema,
                         maxSchema:meshSchema = undefined): number{
      //分割数をリセット
      this._divCount = 1;
      let roots = this._getRootsMeshSchema(schema, maxSchema);

      return this._divCount * this._divCount;
    }//end method

    /**
     * GeoJSON Feature配列の返却
     * @param latlon 作成地点(緯度経度)
     * @param schema メッシュ構造
     * @param maxSchema 作成上限メッシュ構造(省略可)
     * @returns GeoJSON Feature配列
     */
    public createGeoJSON(latlon:[number, number],
                         schema:meshSchema,
                         maxSchema:meshSchema = undefined)
      : Array<IGeoJsonFeature>
    {
      //分割数をリセット
      this._divCount = 1;
      let roots = this._getRootsMeshSchema(schema, maxSchema);

      //親情報を得ておく
      var rootsInfo = roots.getMeshCode(latlon);
      var divCount = this._divCount;

      //分割数分配列を作成 
      //例(3次メッシュ): 10等分 * 8等分 * 1 (1次メッシュ=(根)))
      //1次メッシュ1個は80*80の行列=6400メッシュ
      let features = new Array(this._divCount * this._divCount);
      for (let index=0; index< this._divCount * this._divCount; index++){

        let coordsInfo:IMesh = this._getMeshInfo(schema, rootsInfo, index, divCount);
        features[index] = this._toGeoJson(coordsInfo);
      };

      return <Array<IGeoJsonFeature>>features;
    }//end method

    /**
     * ESRI JSON定義の返却
     * @param latlon 作成地点(緯度経度)
     * @param schema メッシュ構造
     * @param maxSchema 作成上限メッシュ構造(省略可)
     * @returns ESRI JSON定義 配列
     */
    public createEsriJSON(latlon:[number, number], 
                          schema:meshSchema,
                          maxSchema:meshSchema = undefined) 
      : Array<IEsriJsonFeature>
    {
      //分割数をリセット
      this._divCount = 1;
      let roots = this._getRootsMeshSchema(schema, maxSchema);

      //親情報を得ておく
      var rootsInfo = roots.getMeshCode(latlon);
      var divCount = this._divCount;

      //分割数分配列を作成 
      //例(3次メッシュ): 10等分 * 8等分 * 1 (1次メッシュ=(根)))
      //1次メッシュ1個は80*80の行列=6400メッシュ
      let features = new Array(this._divCount * this._divCount);
      for (let index=0; index< this._divCount * this._divCount; index++){
        
        let coordsInfo:IMesh = this._getMeshInfo(schema, rootsInfo, index, divCount);
        //esri feature定義
        features[index] = this._toEsriJson(coordsInfo);
      }//end loop index

      return <Array<IEsriJsonFeature>>features;
    }//end method

    /**
     * shapefileの作成
     * @param latlon 作成地点(緯度経度)
     * @param schema メッシュ構造
     * @param maxSchema 作成上限メッシュ構造(省略可)
     * @param shpOpt 作成オプション
     * @returns shapefile
     */
    public createShp(latlon:[number, number], 
                     schema:meshSchema, 
                     maxSchema:meshSchema = undefined,
                     shpOpt:IShpCreateOption = undefined) 
      :shpFile
    {
      //分割数をリセット
      this._divCount = 1;
      let roots = this._getRootsMeshSchema(schema, maxSchema);

      //親情報を得ておく
      var rootsInfo = roots.getMeshCode(latlon);
      var divCount = this._divCount;

      //分割数分配列を作成 
      //例(3次メッシュ): 10等分 * 8等分 * 1 (1次メッシュ=(根)))
      //1次メッシュ1個は80*80の行列=6400メッシュ
      let features = new Array(this._divCount * this._divCount);
      for (let index=0; index< this._divCount * this._divCount; index++){
        let coordsInfo:IMesh = this._getMeshInfo(schema, rootsInfo, index, divCount);
        features[index] = { 
          "geometry": coordsInfo.coords,
          "meshCode": coordsInfo.meshInfo.meshCode
        };
      };

      //SHPの返却
      return new shpFile(features, shpOpt);
    }//end method

    /**
     * GeoJSONフィーチャ配列を文字列バイナリ化
     * @param features GeoJSON Feature Array
     * @returns ArrayBuffer
     */
    public geoJsonToStringBuffer(features: Array<IGeoJsonFeature>): ArrayBuffer{
      let headerString = '{ "type": "FeatureCollection", "features":[';
      let footerString = ']}';

      return this._jsonToArrayBuffer(features, headerString, footerString);
    }//end method

    /**
     * esri JSON フィーチャ配列を文字列バイナリ化
     * @param features esri JSON Feature Array
     * @returns ArrayBuffer
     */
    public esriJsonToStringBuffer(features: Array<IEsriJsonFeature>): ArrayBuffer{
      let headerString = '{ "displayFieldName" : "meshCode", "fieldAliases": { "meshCode" : "meshCode" }, "fields" : [{ "name" : "meshCode", "type" : "esriFieldTypeString", "alias" : "meshCode", "length" : 15}], "features":[';
      let footerString = ']}';

      return this._jsonToArrayBuffer(features, headerString, footerString);
    }//end method
    
    /**
     * GeoJSONないしesriJSONのフィーチャ配列を文字列バイナリ化
     * @param features フィーチャ配列
     * @param headerString ヘッダ文字列
     * @param footerString フッタ文字列
     * @returns 文字列バイナリ
     */
    private _jsonToArrayBuffer(features: Array<any>, headerString:string, footerString:string){

      let meshCount = features.length;
      //let recordLength = JSON.stringify(features[0]).length;
      //可変長なのでしょうがなくサイズ計算
      let totalRecords = 0;
      for (let i=0; i< meshCount; i++){
        let record = JSON.stringify(features[i]);
        totalRecords += record.length;
      }
      //区切り文字分足す。
      totalRecords += meshCount - 1;

      let jsonBuffer = new ArrayBuffer(headerString.length + footerString.length + totalRecords);
      let headerView = new DataView(jsonBuffer, 0, headerString.length);

      for (let writeByte = 0; writeByte < headerString.length; writeByte++) {
        headerView.setUint8(writeByte, headerString.charCodeAt(writeByte));
      }//end loop
      let recordView = new DataView(jsonBuffer, headerString.length, totalRecords);

      let recordsStart = 0;
      for (let i=0; i< meshCount; i++){
        
        let record = JSON.stringify(features[i]);
        for (var writeByte = 0; writeByte < record.length; writeByte++) {
          recordView.setUint8(recordsStart + writeByte, record.charCodeAt(writeByte));
        }//end loop
        recordsStart += record.length;
        //最終でなければ区切り文字を足す
        if (i + 1 !== meshCount){
          recordView.setUint8(recordsStart, ",".charCodeAt(0))
          recordsStart += 1;
        }
      }//emd loop record

      let footerView = new DataView(jsonBuffer, jsonBuffer.byteLength - footerString.length, footerString.length);
      for (var writeByte = 0; writeByte < footerString.length; writeByte++) {
        footerView.setUint8(writeByte, footerString.charCodeAt(writeByte));
      }//end loop

      return jsonBuffer;
    }

    /**
     * インデックスと分割数からメッシュ情報を取得する
     * @param schema 取得するメッシュの定義
     * @param rootsInfo 親スキーマ定義
     * @param index インデックス
     * @param divCount 分割数
     * @returns メッシュ情報
     */
    private _getMeshInfo(
      schema:meshSchema, 
      rootsInfo:IMeshInfo,
      index:number,
      divCount:number): IMesh
    {
      //行列を計算
      let r = Math.floor(index / divCount);
      let c = index % divCount;
      //緯度経度中心を求めておく
      let clat = rootsInfo.lat + (r * schema.heightDD) + (schema.heightDD / 2.0);
      let clon = rootsInfo.lon + (c * schema.widthDD)  + (schema.widthDD / 2.0);
      //メッシュコード取得
      return this._getMeshInfoFromBl([clat,clon],schema)
    }//end method

    /**
     * 緯度経度からメッシュ情報の取得
     * @param latlon 緯度経度
     * @param schema メッシュ構造
     * @returns メッシュ情報
     */
    private _getMeshInfoFromBl(latlon:[number,number], schema:meshSchema): IMesh {
      //メッシュコード取得
      var meshInfo = schema.getMeshCode(latlon);
      
      // 時計回りでまわしておく
      let coords:Array<[number, number]> = [
        [meshInfo.lon, meshInfo.lat], [meshInfo.lon, meshInfo.lat + schema.heightDD], 
          [meshInfo.lon + schema.widthDD, meshInfo.lat + schema.heightDD], [meshInfo.lon + schema.widthDD, meshInfo.lat],
        [meshInfo.lon, meshInfo.lat] 
      ];
      //反時計回り時
      //coords.reverse();
      return {
        meshInfo: meshInfo,
        coords: coords
      };
    }

    /**
     * 根のメッシュスキーマを取得
     * @param schema メッシュスキーマ 
     * @param maxSchema 親がこれならここまでとなる定義
     * @returns 指定した親スキーマ (無指定時は1次メッシュ)
     */
    private _getRootsMeshSchema(schema:meshSchema, maxSchema:meshSchema): meshSchema
    {
      //親がいなければ根っこ
      if (!schema.parent && maxSchema === undefined)
        return schema;
      //最大作成がセットされている場合 ラベルが同一なら戻す
      if (maxSchema !== undefined && maxSchema.label === schema.label)
        return schema;

      //分割数をカウント
      this._divCount =  this._divCount * schema.splitCount;
      //親がいる場合は再帰呼び出し
      return this._getRootsMeshSchema(schema.parent, maxSchema);
    }//end method

    /**
     * GeoJSON Featureの作成
     * @param mesh メッシュ情報
     * @returns GeoJsonFeature
     */
    private _toGeoJson(mesh:IMesh):IGeoJsonFeature {

      return { "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [mesh.coords]
      },
      "properties": {
        "meshCode": mesh.meshInfo.meshCode
        }
      };
    }//end method

    /**
     * EsriJSON Featureの作成
     * @param mesh メッシュ情報
     * @returns EsriJsonFeatureの作成
     */
    private _toEsriJson(mesh:IMesh):IEsriJsonFeature {

      //esri feature定義
      return <IEsriJsonFeature>{ 
        "geometry": { "rings": [mesh.coords] },
        "attributes": {
          "meshCode": mesh.meshInfo.meshCode
        }
      };
    }

  }//end class

}//end namespace