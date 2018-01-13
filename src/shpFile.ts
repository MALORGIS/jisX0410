
namespace jisX0410
{
  /** 4隅座標の保持定義 */
  export interface IExtent {
    xmin:number;
    ymin:number;
    xmax:number;
    ymax:number;
  }
  /** Shapeの作成オプション */
  export interface IShpCreateOption
  {
    /** shpファイルを作成するか否か */
    shp:boolean;
    /** shxファイルを作成するか否か */
    shx:boolean;
    /** dbfファイルを作成するか否か */
    dbf:boolean;
    /** prjファイルを作成するか否か */
    prj:boolean;
  }

  /** shpの作成用メッシュ定義 */
  export interface IShpMesh
  {
    geometry:Array<[number,number]>;
    meshCode:string;
  }

  /** JGD2KのESRI WKT */
  const JGD2K:string = 'GEOGCS["JGD2000",DATUM["D_Japanese Geodetic Datum 2000",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.017453292519943295]]';

  /** メッシュ用 shapefile作成クラス */
  export class shpFile
  {

    /**
     * shapefile生成前のサイズ計算
     * @param meshCount メッシュ件数
     * @returns shapefileのバイトサイズ
     */
    public static calcShpFileBytes(meshCount:number):{
      shpLength: number,
      shxLength: number,
      dbfLength: number
    }
    {
      //---------- shp -------------
      // ヘッダ－:100  レコード:136 (情報:56/ポイント配列:16*5=80 5は頂点数)
      //レコード情報はポリゴンパート数で変動
      let shpLength = 100 + (136 * meshCount);

      //---------- shx -------------
      //レコード情報136-8の128
      const SHX_RECORD_CONTENT_LENGTH = 128 / 2;
      // ヘッダ100とレコード数 * 8
      let shxLength =100 + (8 * meshCount);

      //---------- dbf -------------
      //20文字のメッシュコード固定で考える。
      const FIELD_LENGTH =20;
      
      // 32 * フィールド数 + 1
      const FIELD_DESC_LENGTH = 32 * 1 + 1;
      //本来はフィールドの全長だが1フィールドで
      const BYTES_PER_RECORD = 1 + FIELD_LENGTH;
      //データ総長 レコード数×フィールドの長さ
      let dataLength = BYTES_PER_RECORD * meshCount + 1;
      //ヘッダー+カラム説明+
      let dbfLength = 32 + FIELD_DESC_LENGTH + dataLength;

      return {
        shpLength: shpLength,
        shxLength: shxLength,
        dbfLength: dbfLength
      };
    }//end method


    /** 作成するメッシュ定義の保持用 */
    private _mesh:Array<IShpMesh>;

    /** 作成するメッシュの個数 */
    private _meshLength:number;

    /** ファイルの最大範囲 */
    public fullExtent:IExtent;

    /** shpファイル */
    public shp:ArrayBuffer;

    /** shxファイル */
    public shx:ArrayBuffer;

    /** dbfファイル */
    public dbf:ArrayBuffer;

    /** prjファイル(テキスト内容) */
    public prj:string;

    /**
     * コンストラクタ
     * @param mesh 作成メッシュ定義
     * @param options 作成オプション
     */
    public constructor(mesh:Array<IShpMesh>, options:IShpCreateOption = {shp:true,shx:true,dbf:true,prj:true})
    {
      //クラス変数にセット
      this._mesh = mesh;
      this._meshLength = mesh.length;

      //shpないしshxを作成する際は範囲計算
      if (options.shp || options.shx)
      {
        //最大範囲の計算
        this._calcMeshExtent();
      }//end if

      //shpファイルの作成
      if (options.shp)
        this._createShpBuffer();
      
      //shxファイルの作成
      if (options.shx)
        this._createInx();
      
      //dbfファイルの作成
      if (options.dbf)
        this._createDbf();
      
      //prjファイルの作成
      if (options.prj)
        this.prj = JGD2K;
    }//end method

    /** SHPファイル生成処理 */
    private _createShpBuffer():void
    {
      //メッシュ定義受け取り
      let mesh = this._mesh;
      let meshLength = this._meshLength;

      // ヘッダ－:100  レコード:136 (情報:56/ポイント配列:16*5=80 5は頂点数)
      //レコード情報はポリゴンパート数で変動
      let bufferLength = 100 + (136 * meshLength);
      let shpBuffer = new ArrayBuffer(bufferLength);
      
      //先頭100がヘッダ
      var shpHeaderView = new DataView(shpBuffer, 0, 100);
      
      //定型
      shpHeaderView.setInt32(0, 9994);
      shpHeaderView.setInt32(28, 1000, true);

      //最大長 shp file length in 16 bit words
      shpHeaderView.setInt32(24, bufferLength / 2);
    
      //形状指定 : 1=point 3=polyline 5=polygon
		  shpHeaderView.setInt32(32, 5, true);
    
      //最大範囲を指定
      let fullExt = this.fullExtent;
      shpHeaderView.setFloat64(36, fullExt.xmin, true);
      shpHeaderView.setFloat64(44, fullExt.ymin, true);
      shpHeaderView.setFloat64(52, fullExt.xmax, true);
      shpHeaderView.setFloat64(60, fullExt.ymax, true);

      //各レコード
      mesh.map(function(meshItem, index:number){
        const RECORD_LENGTH = 8 + 44 + 4 * 1;//4*パート数 56
        //レコード情報136-8の128
        const RECORD_CONTENT_LENGTH = 128 / 2;

        let offset = 100 + (136 * index);//レコード数離す
        let shpRecordInfo = new DataView(shpBuffer, offset, RECORD_LENGTH);
        //レコードのIDを付与
        shpRecordInfo.setInt32(0, index);
        //レコード情報136-8の128
        shpRecordInfo.setInt32(4, RECORD_CONTENT_LENGTH);
        //図形形状 5=polygon
        shpRecordInfo.setInt32(8, 5, true);

        /*  1 2
         *  0 3
         * 0地点に4が地点*/
        
        //4隅座標 xmin,ymin,xmax,ymax
        shpRecordInfo.setFloat64(12, meshItem.geometry[0][0], true);
        shpRecordInfo.setFloat64(20, meshItem.geometry[0][1], true);
        shpRecordInfo.setFloat64(28, meshItem.geometry[2][0], true);
        shpRecordInfo.setFloat64(36, meshItem.geometry[2][1], true);

        //パート数
        shpRecordInfo.setInt32(44, 1, true);
        //ポイント数
        shpRecordInfo.setInt32(48, 5, true);

        //52からpart index * 4 パート数
        shpRecordInfo.setInt32(52, 0, true);
        //ポイント 16 * 5 = 80
        let pointsArray = new DataView(shpBuffer, offset + RECORD_LENGTH, 80);
        //5頂点で回す
        for (let ptIndex = 0; ptIndex < 5; ptIndex++){
          let pt = meshItem.geometry[ptIndex];
          //XY座標値のセット
          pointsArray.setFloat64(ptIndex * 16, pt[0], true); 
          pointsArray.setFloat64(ptIndex * 16 + 8, pt[1], true); 
        }//end loop

      });

      this.shp =  shpBuffer;
    }//end method

    /** shxインデックスファイル */
    private _createInx():void {

      let mesh = this._mesh;
      let meshLength = this._meshLength;
      let fullExtent = this.fullExtent;

      //レコード情報136-8の128
      const RECORD_CONTENT_LENGTH = 128 / 2;
      // ヘッダ100とレコード数 * 8
      let shxBuffer = new ArrayBuffer(100 + 8 * meshLength);

      let shxHeaderView = new DataView(shxBuffer, 0, 100);
      //定型
      shxHeaderView.setInt32(0, 9994);
      shxHeaderView.setInt32(28, 1000, true);
      //形状指定 : 1=point 3=polyline 5=polygon
      shxHeaderView.setInt32(32, 5, true);

      //最大範囲をセット
      shxHeaderView.setFloat64(36, fullExtent.xmin, true);
      shxHeaderView.setFloat64(44, fullExtent.ymin, true);
      shxHeaderView.setFloat64(52, fullExtent.xmax, true);
      shxHeaderView.setFloat64(60, fullExtent.ymax, true);
      //レコード数をセット
      shxHeaderView.setInt32(24, (50 + meshLength * 4));

      let shxDataView = new DataView(shxBuffer, 100, 8 * meshLength);

     mesh.map(
      function(val:any,index:number){
        
        //let shxDataView = new DataView(shxBuffer, 100 + 8 * index, 8);
        //開始位置はindex * 8
        let start = index * 8;
        //ヘッダー100
        //レコード:136 (情報:56/ポイント配列:16*5=80 5は頂点数)
        shxDataView.setInt32(start, (100 + 136 * index) / 2);
        shxDataView.setInt32(start + 4, RECORD_CONTENT_LENGTH);
      });
      
      this.shx = shxBuffer;
      //return shxBuffer;
    }

    /** DBFファイルの作成 */
    private _createDbf():void {
      let mesh = this._mesh;
      let meshLength = this._meshLength;

      // 20文字のメッシュコード固定で考える。
      const FIELD_LENGTH = 20;

      // 32 * フィールド数 + 1
      const FIELD_DESC_LENGTH = 32 * 1 + 1;
      //本来はフィールドの全長だが1フィールドで
      const BYTES_PER_RECORD = 1 + FIELD_LENGTH;
      //データ総長 レコード数×フィールドの長さ
      let dataLength = BYTES_PER_RECORD * meshLength + 1;
      //ヘッダー+カラム説明+
      let dbfBufferLength = 32 + FIELD_DESC_LENGTH + dataLength;

      //DBFのバイト配列
      var dbfBuffer = new ArrayBuffer(dbfBufferLength);
      //----------- ヘッダー情報の書き込み -------
      var dbfHeaderView = new DataView(dbfBuffer, 0, 32);

      dbfHeaderView.setUint8(0, 3) // File Signature: DBF - UNSIGNED
      //更新日時
      var nowDate = new Date();
      dbfHeaderView.setUint8(1, nowDate.getFullYear() - 1900); // UNSIGNED
      dbfHeaderView.setUint8(2, nowDate.getMonth()); // UNSIGNED
      dbfHeaderView.setUint8(3, nowDate.getDate()); // UNSIGNED
      //レコード数
      dbfHeaderView.setUint32(4, meshLength, true); // LITTLE ENDIAN, UNSIGNED
      //ヘッダーの長さとフィールド説明の長さがヘッダの総長
      dbfHeaderView.setUint16(8, FIELD_DESC_LENGTH + 32, true);
      //レコード長
      dbfHeaderView.setUint16(10, BYTES_PER_RECORD, true)
      //----------- ヘッダー情報の書き込み ここまで -------

      //----------- フィールド説明情報の書き込み -------
      var dbfFieldDescView = new DataView(dbfBuffer, 32, FIELD_DESC_LENGTH);
      
      const FILED_NAME = "MESH_CD";
      
      //フィールド名称は 32ずつ
      //文字をセットしてく
      for (let i = 0; i < FILED_NAME.length; i++) {
        dbfFieldDescView.setInt8(i, FILED_NAME.charCodeAt(i));
      }
      // カラム名は10が最大
      //11に型情報 C=67 はString
      dbfFieldDescView.setInt8(11, 67);
      //フィールド長
      dbfFieldDescView.setInt8(16, FIELD_LENGTH);

      //フィールドの説明の終端 13=改行コード
      dbfFieldDescView.setInt8(FIELD_DESC_LENGTH - 1, 13)
      //----------- フィールド説明情報の書き込み ここまで -------

      //以下レコード情報の書き込み
      var dbfDataView = new DataView(dbfBuffer, 32 + FIELD_DESC_LENGTH, dataLength);

      mesh.map(function(value,index){

        var recordsStart = index * (BYTES_PER_RECORD);
        dbfDataView.setUint8(recordsStart, 32);
        recordsStart++;

        for (var writeByte = 0; writeByte < FIELD_LENGTH; writeByte++) {
          dbfDataView.setUint8(recordsStart, value.meshCode.charCodeAt(writeByte));
          recordsStart++;
        }
      });
      //終端コード
      dbfDataView.setUint8(dataLength - 1, 26);

      this.dbf = dbfBuffer;
      //return dbfBuffer;
    }//end method

    /**
     * 作成するメッシュの最大範囲を計算
     */
    private _calcMeshExtent(): void{
      let mesh = this._mesh;
      let meshLength = this._meshLength;
      
      // 5点の頂点の対角
       
      /*  1 2
       *  0 3
       * 0地点に4が地点
       */

      let xmin = mesh[0].geometry[0][0];
      let ymin = mesh[0].geometry[0][1];
      let xmax = mesh[meshLength-1].geometry[2][0];
      let ymax = mesh[meshLength-1].geometry[2][1];

      this.fullExtent = {xmin:xmin, ymin:ymin,xmax:xmax,ymax:ymax};
    }//end method

  }//end class

}//end method