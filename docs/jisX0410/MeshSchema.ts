namespace jisX0410
{
  /** メッシュ情報定義 */
  export interface IMeshInfo
  {
    /** メッシュコード */
    meshCode: string;
    /** 緯度 */
    latMs: number;
    /** 経度 */
    lonMs: number;
  }//end class

  /** メッシュ定義の管理クラス */
  export class MeshSchema
  {
    public static readonly MILLISECOND = 3600000;

    /** 経度差ミリ秒 */
    public widthMs: number;
    /** 緯度差ミリ秒 */
    public heightMs: number;


    /** 分割数 */
    public splitCount: number;
    /** 親メッシュ定義 */
    public parent: MeshSchema;
    /** 説明用のラベル */
    public label: string;
    /** メッシュコードの分割文字列 */
    public splitString:string;

    /** 区切り文字を除いたメッシュコードの文字列長 */
    public meshCodeLength: number;

    /** メッシュコード取得関数 */
    public getMeshCode: (latlon:[number,number]) => IMeshInfo;

    /** メッシュコード文字列からメッシュ情報取得 */
    public meshCode2MeshInfo: (meshCode: string) => IMeshInfo;

    /**
     * コンストラクタ
     * @param parent  親メッシュ定義
     * @param splitCount 分割数
     */
    public constructor(parent: MeshSchema = undefined, splitCount:number = undefined)
    {
      this.parent = parent;
      this.splitCount = splitCount;

      if (parent){
        this.widthMs = parent.widthMs / splitCount;
        this.heightMs = parent.heightMs / splitCount;
      }//end if
    }//end method

    /**
     * 標準的なメッシュ定義の返却
     */
    public static createStandardMesh() : Array<MeshSchema> {

      //1次メッシュコード生成用のコード
      let mesh1_getCode: (latlon:[number,number]) => IMeshInfo  = 
      function(latlon: [number, number]): IMeshInfo{
        let r = Math.round(Math.floor(latlon[0] * 1.5));
        let c = Math.round(Math.floor(latlon[1] - 100.0));

        //メッシュコード
        let code = String(r) + String(c);
        let lat = (r * MeshSchema.MILLISECOND) / 1.5;//ミリ秒単位
        let lon = (c + 100.0) * 3600000 ;//ミリ秒単位
        return { meshCode: code, latMs: lat, lonMs:lon };
      };
      //2-3次メッシュコード生成用のコード
      let mesh2_3_getCode :(latlon:[number,number]) => IMeshInfo =
      function(latlon: [number, number]): IMeshInfo{
        let thisObj = (<MeshSchema>this);

        return MeshSchema._getCodeBase(thisObj, latlon, function(preMeshInfo:IMeshInfo, r:number,c:number){
          let thisObj = (<MeshSchema>this);
          return preMeshInfo.meshCode + thisObj.splitString + String(r) + String(c);
        });
      };
      //4-6次メッシュコードと5倍地域メッシュの生成用コード
      let mesh4_6_getCode :(latlon:[number, number]) => IMeshInfo =
      function(latlon: [number, number]): IMeshInfo{
        let thisObj = (<MeshSchema>this);
        return MeshSchema._getCodeBase(thisObj, latlon, function(preMeshInfo:IMeshInfo, r:number,c:number){
          let thisObj = (<MeshSchema>this);
          let code = r < 1 ? String(c + 1) : String(c + 1 + 2);
          code = preMeshInfo.meshCode + thisObj.splitString + code;
          return code;
        });
      };
      //2倍地域メッシュの生成コード
      let mesh3_2_getCode:(latlon:[number, number]) => IMeshInfo =
      function(latlon: [number, number]): IMeshInfo{
        let thisObj = (<MeshSchema>this);
        return MeshSchema._getCodeBase(thisObj, latlon, function(preMeshInfo:IMeshInfo, r:number,c:number){
          let thisObj = (<MeshSchema>this);
          const MESH_ID = ["0","2","4","6","8"];
          let code = MESH_ID[r] + MESH_ID[c] + '5';
          code = preMeshInfo.meshCode + thisObj.splitString + code;
          return  code;
        });
      };
      //10分の1・20分の1細分区画のメッシュコード生成コード ( 明確な規定がなさそうので適当にRCを文字化 )
      let mesh7_8_getCode:(latlon:[number, number]) => IMeshInfo =
      function(latlon: [number, number]): IMeshInfo{
        let thisObj = (<MeshSchema>this);
        return MeshSchema._getCodeBase(thisObj, latlon, function(preMeshInfo:IMeshInfo, r:number,c:number){
          let thisObj = (<MeshSchema>this);
          //文字列化して0埋め
          let code = ('00' + String(r)).slice(-2) + thisObj.splitString + ('00' + String(c)).slice(-2);
          code = preMeshInfo.meshCode + thisObj.splitString + code;
          return  code;
        });
      };

      //1次メッシュコードからメッシュ情報
      let mesh1cd2mesh: (meshCode:string) => IMeshInfo = 
      function(meshCode: string): IMeshInfo {
        //区切り文字を可能な限り排除
        meshCode = meshCode.replace(/[-_.\s]/g, "");
        if (meshCode.length !== 4)
          throw Error("Invalid mesh code.");
        
        let r = parseInt( meshCode.slice(0,2) );
        let c = parseInt( meshCode.slice(2,4) );

        let lat = (r * MeshSchema.MILLISECOND) / 1.5;
        let lon = (c + 100.0) * MeshSchema.MILLISECOND;
        return { meshCode: meshCode, latMs: lat, lonMs:lon };
      };
      //2次 3次メッシュコードからメッシュ情報
      let mesh2_3cd2mesh: (meshCode:string) => IMeshInfo =
      function(meshCode: string): IMeshInfo {
        
        let thisObj = <MeshSchema>this;
        //区切り文字を可能な限り排除
        meshCode = meshCode.replace(/[-_.\s]/g, "");
        if (meshCode.length !== thisObj.meshCodeLength)
          throw Error("Invalid mesh code.");
        
        var preInfo = thisObj.parent.meshCode2MeshInfo(meshCode.slice(0,thisObj.meshCodeLength - 2));

        let r = parseInt( meshCode.slice(meshCode.length - 2, meshCode.length - 1) );
        let c = parseInt( meshCode.slice(meshCode.length - 1, meshCode.length) );

        return {
          meshCode: preInfo.meshCode + thisObj.splitString + String(r) + String(c),
          latMs: preInfo.latMs + (thisObj.heightMs * r),
          lonMs: preInfo.lonMs + (thisObj.widthMs * c)
        };
      };
      //4次から6次(と5倍)メッシュコードからメッシュ情報
      let mesh4_6cd2mesh: (meshCode:string) => IMeshInfo =
      function(meshCode: string): IMeshInfo {
        let thisObj = <MeshSchema>this;
        //区切り文字を可能な限り排除
        meshCode = meshCode.replace(/[-_.\s]/g, "");
        if (meshCode.length !== thisObj.meshCodeLength)
          throw Error("Invalid mesh code.");
        
        var preInfo = thisObj.parent.meshCode2MeshInfo(meshCode.slice(0,thisObj.meshCodeLength - 1));
        
        let r:number,c:number;
        let cd = parseInt(meshCode.slice(meshCode.length-1, meshCode.length));
        //1 2は南
        if (cd < 3){
          r = 0;
        } else {
          r = 1;
        }//end if
        //2 4は東
        if (cd % 2 == 0){
          c = 1;
        } else {
          c = 0;
        }//end if
        
        return {
          meshCode: preInfo.meshCode + thisObj.splitString + cd,
          latMs: preInfo.latMs + (thisObj.heightMs * r),
          lonMs: preInfo.lonMs + (thisObj.widthMs * c)
        };
      };//end method
      //2倍地域メッシュ
      let mesh3_2cd2mesh: (meshCode:string) => IMeshInfo =
      function(meshCode: string): IMeshInfo {
        let thisObj = <MeshSchema>this;
        //区切り文字を可能な限り排除
        meshCode = meshCode.replace(/[-_.\s]/g, "");
        if (meshCode.length !== thisObj.meshCodeLength)
          throw Error("Invalid mesh code.");
        //末尾の5を落とす
        let cd = meshCode.slice(0, meshCode.length -1);
        
        var preInfo = thisObj.parent.meshCode2MeshInfo( cd.slice(0, cd.length - 2));
        let r = parseInt( meshCode.slice( cd.length - 2,  cd.length - 1) );
        let c = parseInt( meshCode.slice( cd.length - 1,  cd.length) );

        let code = String(r) + String(c) + '5';
        r = r / 2;
        c = c / 2;

        return {
          meshCode: preInfo.meshCode + thisObj.splitString + code,
          latMs: preInfo.latMs + (thisObj.heightMs * r),
          lonMs: preInfo.lonMs + (thisObj.widthMs * c)
        };
      };




      let mesh1 = new MeshSchema();
      mesh1.label = "第1次地域区画(約80km四方)";
      mesh1.widthMs = 1 * MeshSchema.MILLISECOND;
      mesh1.heightMs = MeshSchema.MILLISECOND * (40 / 60);
      mesh1.meshCodeLength = 4;
      mesh1.getMeshCode = mesh1_getCode.bind(mesh1);
      mesh1.meshCode2MeshInfo = mesh1cd2mesh.bind(mesh1);

      let mesh2 = new MeshSchema(mesh1, 8);
      mesh2.label = "第2次地域区画(約10km四方)";
      mesh2.splitString = "-";
      mesh2.meshCodeLength = 6;
      mesh2.getMeshCode = mesh2_3_getCode.bind(mesh2);
      mesh2.meshCode2MeshInfo = mesh2_3cd2mesh.bind(mesh2);

      let mesh3_5 = new MeshSchema(mesh2, 2);
      mesh3_5.label = "5倍地域メッシュ(約5km四方)";
      mesh3_5.splitString = "-";
      mesh3_5.meshCodeLength = 7;
      mesh3_5.getMeshCode = mesh4_6_getCode.bind(mesh3_5);
      mesh3_5.meshCode2MeshInfo = mesh4_6cd2mesh.bind(mesh3_5);

      let mesh3_2 = new MeshSchema(mesh2, 5);
      mesh3_2.label = "2倍地域メッシュ(約2km四方)";
      mesh3_2.splitString = "-";
      mesh3_2.meshCodeLength = 9;
      mesh3_2.getMeshCode = mesh3_2_getCode.bind(mesh3_2);
      mesh3_2.meshCode2MeshInfo = mesh3_2cd2mesh.bind(mesh3_2);
      
      let mesh3 = new MeshSchema(mesh2, 10);
      mesh3.label = "基準地域メッシュ(約1km四方)";
      mesh3.splitString = "-";
      mesh3.meshCodeLength = 8;
      mesh3.getMeshCode = mesh2_3_getCode.bind(mesh3);
      mesh3.meshCode2MeshInfo = mesh2_3cd2mesh.bind(mesh3);

      let mesh4 = new MeshSchema(mesh3, 2);
      mesh4.label = "2分の1地域メッシュ(約500m四方)";
      mesh4.splitString = "-";
      mesh4.meshCodeLength = 9;
      mesh4.getMeshCode = mesh4_6_getCode.bind(mesh4);
      mesh4.meshCode2MeshInfo = mesh4_6cd2mesh.bind(mesh4);

      let mesh5 = new MeshSchema(mesh4, 2);
      mesh5.label = "4分の1地域メッシュ(約250m四方)";
      mesh5.splitString = "-";
      mesh5.meshCodeLength = 10;
      mesh5.getMeshCode = mesh4_6_getCode.bind(mesh5);
      mesh5.meshCode2MeshInfo = mesh4_6cd2mesh.bind(mesh5);

      let mesh6 = new MeshSchema(mesh5, 2);
      mesh6.label = "8分の1地域メッシュ(約125m四方)";
      mesh6.splitString = "-";
      mesh6.meshCodeLength = 11;
      mesh6.getMeshCode = mesh4_6_getCode.bind(mesh6);
      mesh6.meshCode2MeshInfo = mesh4_6cd2mesh.bind(mesh6);

      let mesh7 = new MeshSchema(mesh3, 10);
      mesh7.label = "10分の1 細分区画(約100m四方)";
      mesh7.splitString = "_";
      mesh7.getMeshCode = mesh7_8_getCode.bind(mesh7);

      let mesh8 = new MeshSchema(mesh3, 20);
      mesh8.label = "20分の1 細分区画(約50m四方)";
      mesh8.splitString = "_";
      mesh8.getMeshCode = mesh7_8_getCode.bind(mesh8);

      //定義の返却
      return [
        // 0   1      2        3        4      5      6      7      8      9
        mesh1, mesh2, mesh3_5, mesh3_2, mesh3, mesh4, mesh5, mesh6, mesh7, mesh8
      ];

    }//end method


    /**
     * メッシュコード取得用の標準処理定義
     * @param thisObj メッシュスキーマ
     * @param latlon 緯度経度
     * @param getCoords メッシュコード取得処理
     * @returns メッシュ情報
     */
    private static _getCodeBase(thisObj:MeshSchema , latlon:[number,number] ,getCoords: (preMeshInfo:IMeshInfo, r:number, c:number)=> string): IMeshInfo {

      let preMeshInfo = thisObj.parent.getMeshCode(latlon);

      let latMs = latlon[0] * MeshSchema.MILLISECOND;
      let lonMs = latlon[1] * MeshSchema.MILLISECOND;

      let r:number = Math.floor((latMs- preMeshInfo.latMs) / thisObj.heightMs);
      let c:number = Math.floor((lonMs - preMeshInfo.lonMs) / thisObj.widthMs);
      let code:string = getCoords.bind(thisObj)(preMeshInfo,r,c);

      let lat:number = preMeshInfo.latMs + (r * thisObj.heightMs);
      let lon:number = preMeshInfo.lonMs + (c * thisObj.widthMs);
      
      return { meshCode: code, latMs:lat, lonMs:lon };
    }//end method
  }//end class




}//end namespace