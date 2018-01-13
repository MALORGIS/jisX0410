/// <reference path="../../jisX0410/index.d.ts" />

namespace samples {

  /** 性能測定ページのコントロール */
  export class BenchmarkController {

    /** angular scope */
    private _scope: angular.IScope;

    /** NgTableParams */
    private _ngTableParams:any;

    /** メッシュ作成用 WebWorker */
    private _worker:jisX0410.meshWorker;

    /** メッシュ作成用ユーティリティクラス */
    private _meshUtil: jisX0410.meshUtil;

    /** 件数とメッシュ構造 */
    private _countSchema: Array<{ count:number,schema:jisX0410.meshSchema }> = [];

    /** テーブル表示用レコード */
    private _prc: Array<{count:number, time:string, onetime:string}> = [];
    
    /** テーブル表示実体 */
    public tableParams:any;

    /** 処理実行中=TRUE */
    public wait:boolean = false;

    /** 計測フォーマット */
    public format: "GeoJSON" | "esriJSON" | "shapefile" = "shapefile";
    
    /** フォーマットのリスト */
    public fromatList: Array<"GeoJSON" | "esriJSON" | "shapefile"> = [
      "GeoJSON" , "esriJSON" , "shapefile"
    ];

    /**
     * コンストラクタ
     * @param Angularスコープ
     * @param NgTableParams
     */
    constructor($scope: angular.IScope, NgTableParams:any) {
      this._scope = $scope;
      this._ngTableParams = NgTableParams;

      let worker = new jisX0410.meshWorker('./jisX0410/index.js');
      this._worker = worker;

      this._meshUtil = new jisX0410.meshUtil();
      
      //処理の実行
      this._setup();
    }//end method

    /** 計測処理の準備と実行 */
    private _setup():void{
      this.wait=true;
      this._prc=[];
      this._countSchema=[];

      let util =  this._meshUtil;
      let meshes = this._meshUtil.meshSchemes;
      //メッシュ構造単位で回す
      for(let i=0;i<meshes.length;i++){
        let m = meshes[i];
        //件数のカウント
        let count = util.calcMeshCount(m);
        //処理用にためる
        this._countSchema.push({count:count,schema:m});
        this._prc.push({count:count,time:undefined,onetime:undefined});
      }//end for
      
      //ひとまず初期化
      this.tableParams = new this._ngTableParams({}, { 
        dataset: this._prc,
        counts: []
      });

      //反転しておく
      this._countSchema.reverse();
      //計測
      this._measure();
    }//end method

    /** 計測処理 */
    private _measure(){
      if(this._countSchema.length <1){
        this.wait=false;
        this._scope.$apply();
        return;
      }

      const latlon:[number,number] = [35,135];
      //末尾のデータをけして処理する
      let item = this._countSchema.pop();
      //開始時間
      let start_ms = new Date().getTime();
      
      //ワーカにメッセージ送信
      let worker = this._worker;
      worker.postMessage({  
        operation:"point",
        format:this.format,
        shape:latlon,
        schemaLabel:item.schema.label,
        maxSchemaLabel: undefined
      }, (msg)=>{
        //経過時間を計測
        let elapsed_ms = new Date().getTime() - start_ms;
        let prc:{count:number, time:string, onetime:string};

        //返却されたものを念のため消しておく
        if ((<jisX0410.IJSONResult>msg).features){
          delete (<jisX0410.IJSONResult>msg).features;
        } else {
          let shp = <jisX0410.IShpResult>msg;
          delete shp.shp;
          delete shp.shx;
          delete shp.dbf;
          delete shp.prj;
        }

        //件数一致でテーブル表示用レコードの取り出し
        for(let i=0;i<this._prc.length;i++){
          let checkPrc =this._prc[i];
          if (item.count === checkPrc.count){
            prc = checkPrc;
            break;
          }//end if
        }//end loop
        //経過時間をテーブル表示用に整える
        let  elapsed = elapsed_ms;
        let unit = 'ミリ秒';
        if (1 < elapsed_ms / 1000 /60){
          elapsed = (elapsed_ms / 1000 / 60)
          elapsed = Math.round(elapsed*100)/100;
          unit = '分'
        } else if (1 < elapsed_ms / 1000){
          //桁丸め
          elapsed = elapsed_ms / 1000;
          elapsed = Math.round(elapsed*100)/100;
          unit = '秒';
        }//end if
        //テーブル表示用レコードにセット
        prc.time = elapsed + unit;
        prc.onetime = Math.round( (elapsed_ms *1000 / item.count)*100)/100 +"µs";

        //反映
        this._scope.$apply();

        //再帰呼び出し(先頭でpopして処理対象を減らしているので)
        this._measure();
      });
    }


  }//end class






}//end namespace