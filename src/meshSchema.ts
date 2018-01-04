namespace jisX0410
{
  /** メッシュ情報定義 */
  export interface IMeshInfo
  {
    /** メッシュコード */
    meshCode: string;
    /** 緯度 */
    lat: number;
    /** 経度 */
    lon: number;
  }//end class

  /** メッシュ定義の管理クラス */
  export class meshSchema
  {
    /** 緯度差 */
    public widthDD: number;
    /** 経度差 */
    public heightDD: number;
    /** 分割数 */
    public splitCount: number;
    /** 親メッシュ定義 */
    public parent: meshSchema;
    /** 説明用のラベル */
    public label: string;
    /** メッシュコードの分割文字列 */
    public splitString:string;

    /** メッシュコード取得関数 */
    public getMeshCode: (latlon:[number,number]) => IMeshInfo;

    /**
     * コンストラクタ
     * @param parent  親メッシュ定義
     * @param splitCount 分割数
     */
    public constructor(parent: meshSchema = undefined, splitCount:number = undefined)
    {
      this.parent = parent;
      this.splitCount = splitCount;

      if (parent){
        this.widthDD = parent.widthDD / splitCount;
        this.heightDD = parent.heightDD / splitCount;
      }//end if
    }//end method

    /**
     * 標準的なメッシュ定義の返却
     */
    public static createStandardMesh() : Array<meshSchema> {

      //1次メッシュコード生成用のコード
      let mesh1_getCode: (latlon:[number,number]) => IMeshInfo  = 
      function(latlon: [number, number]): IMeshInfo{
        let r = Math.round(Math.floor(latlon[0] * 15.0 / 10.0));
        let c = Math.round(Math.floor(latlon[1] - 100.0));

        //メッシュコード
        let code = String(r) + String(c);
        let lat = r / 15.0 * 10.0;
        let lon = c + 100.0;
        return { meshCode: code, lat: lat, lon:lon };
      };
      //2-3次メッシュコード生成用のコード
      let mesh2_3_getCode :(latlon:[number,number]) => IMeshInfo =
      function(latlon: [number, number]): IMeshInfo{
        let thisObj = (<meshSchema>this);

        return meshSchema._getCodeBase(thisObj, latlon, function(preMeshInfo:IMeshInfo, r:number,c:number){
          let thisObj = (<meshSchema>this);
          return preMeshInfo.meshCode + thisObj.splitString + String(r) + String(c);
        });
      };
      //3-6次メッシュコードと5倍地域メッシュの生成用コード
      let mesh4_6_getCode :(latlon:[number, number]) => IMeshInfo =
      function(latlon: [number, number]): IMeshInfo{
        let thisObj = (<meshSchema>this);
        return meshSchema._getCodeBase(thisObj, latlon, function(preMeshInfo:IMeshInfo, r:number,c:number){
          let thisObj = (<meshSchema>this);
          let code = r < 1 ? String(c + 1) : String(c + 1 + 2);
          code = preMeshInfo.meshCode + thisObj.splitString + code;
          return code;
        });
      };
      //2倍地域メッシュの生成コード
      let mesh3_2_getCode:(latlon:[number, number]) => IMeshInfo =
      function(latlon: [number, number]): IMeshInfo{
        let thisObj = (<meshSchema>this);
        return meshSchema._getCodeBase(thisObj, latlon, function(preMeshInfo:IMeshInfo, r:number,c:number){
          let thisObj = (<meshSchema>this);
          const MESH_ID = ["0","2","4","6","8"];
          let code = MESH_ID[r] + MESH_ID[c] + '5';
          code = preMeshInfo.meshCode + thisObj.splitString + code;
          return  code;
        });
      };
      //10分の1・20分の1細分区画のメッシュコード生成コード ( 明確な規定がなさそうので適当にRCを文字化 )
      let mesh7_8_getCode:(latlon:[number, number]) => IMeshInfo =
      function(latlon: [number, number]): IMeshInfo{
        let thisObj = (<meshSchema>this);
        return meshSchema._getCodeBase(thisObj, latlon, function(preMeshInfo:IMeshInfo, r:number,c:number){
          let thisObj = (<meshSchema>this);
          //文字列化して0埋め
          let code = ('00' + String(r)).slice(-2) + thisObj.splitString + ('00' + String(c)).slice(-2);
          code = preMeshInfo.meshCode + thisObj.splitString + code;
          return  code;
        });
      };

      let mesh1 = new meshSchema();
      mesh1.label = "第1次地域区画(約80km四方)";
      mesh1.widthDD = 1;
      mesh1.heightDD = 2 / 3;
      mesh1.getMeshCode = mesh1_getCode.bind(mesh1);

      let mesh2 = new meshSchema(mesh1, 8);
      mesh2.label = "第2次地域区画(約10km四方)";
      mesh2.splitString = "-";
      mesh2.getMeshCode = mesh2_3_getCode.bind(mesh2);

      let mesh3_5 = new meshSchema(mesh2, 2);
      mesh3_5.label = "5倍地域メッシュ(約5km四方)";
      mesh3_5.splitString = "-";
      mesh3_5.getMeshCode = mesh4_6_getCode.bind(mesh3_5);

      let mesh3_2 = new meshSchema(mesh2, 5);
      mesh3_2.label = "2倍地域メッシュ(約2km四方)";
      mesh3_2.splitString = "-";
      mesh3_2.getMeshCode = mesh3_2_getCode.bind(mesh3_2);
      
      let mesh3 = new meshSchema(mesh2, 10);
      mesh3.label = "基準地域メッシュ(約1km四方)";
      mesh3.splitString = "-";
      mesh3.getMeshCode = mesh2_3_getCode.bind(mesh3);

      let mesh4 = new meshSchema(mesh3, 2);
      mesh4.label = "2分の1地域メッシュ(約500m四方)";
      mesh4.splitString = "-";
      mesh4.getMeshCode = mesh4_6_getCode.bind(mesh4);

      let mesh5 = new meshSchema(mesh4, 2);
      mesh5.label = "4分の1地域メッシュ(約250m四方)";
      mesh5.splitString = "-";
      mesh5.getMeshCode = mesh4_6_getCode.bind(mesh5);

      let mesh6 = new meshSchema(mesh5, 2);
      mesh6.label = "8分の1地域メッシュ(約125m四方)";
      mesh6.splitString = "-";
      mesh6.getMeshCode = mesh4_6_getCode.bind(mesh6);

      let mesh7 = new meshSchema(mesh3, 10);
      mesh7.label = "10分の1 細分区画(約100m四方)";
      mesh7.splitString = "_";
      mesh7.getMeshCode = mesh7_8_getCode.bind(mesh7);

      let mesh8 = new meshSchema(mesh3, 20);
      mesh8.label = "20分の1 細分区画(約50m四方)";
      mesh8.splitString = "_";
      mesh8.getMeshCode = mesh7_8_getCode.bind(mesh8);

      //定義の返却
      return [
        // 0   1      2        3        4      5      6      7      8      9
        mesh1, mesh2, mesh3_5, mesh3_2, mesh3, mesh4, mesh5, mesh6, mesh7, mesh8
      ];

    }//end mehtod


    /**
     * メッシュコード取得用の標準処理定義
     * @param thisObj メッシュスキーマ
     * @param latlon 緯度経度
     * @param getCoods メッシュコード取得処理
     * @returns メッシュ情報
     */
    private static _getCodeBase(thisObj:meshSchema , latlon:[number,number] ,getCoods: (preMeshInfo:IMeshInfo, r:number, c:number)=> string): IMeshInfo {

      let preMeshInfo = thisObj.parent.getMeshCode(latlon);

      let r:number = Math.floor((latlon[0] - preMeshInfo.lat) / thisObj.heightDD);
      let c:number = Math.floor((latlon[1] - preMeshInfo.lon) / thisObj.widthDD);
      let code:string = getCoods.bind(thisObj)(preMeshInfo,r,c);

      let lat:number = preMeshInfo.lat + (r * thisObj.heightDD);
      let lon:number = preMeshInfo.lon + (c * thisObj.widthDD);
      
      return { meshCode: code, lat:lat, lon:lon };
    }//end method
  }//end class




}//end namespace