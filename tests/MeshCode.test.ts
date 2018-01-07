
/// <reference path="../src/index.d.ts" />

/* zxymod.ts の実装に由来 */
//↓コード記述時は下記をコメント
let jisX0410 = require('../src/index.js');


import * as assert from 'power-assert';
import * as fs from "fs";
import { fail } from 'power-assert';

//import * as readline from "readline";
//import { read } from 'fs';

//コード値とラベルの辞書
let codeLabel = {
  "1": "第1次地域区画(約80km四方)",
  "2": "第2次地域区画(約10km四方)",
  "3": "基準地域メッシュ(約1km四方)",
  "4": "2分の1地域メッシュ(約500m四方)",
  "5": "4分の1地域メッシュ(約250m四方)",
  "6": "8分の1地域メッシュ(約125m四方)",
  "7": "10分の1 細分区画(約100m四方)",
  "8": "20分の1 細分区画(約50m四方)",
  "3-5": "5倍地域メッシュ(約5km四方)",
  "3-2": "2倍地域メッシュ(約2km四方)"
};

//コード値からメッシュスキーマを探索
let mcd2schema = function(mcd: string, lst: Array<jisX0410.meshSchema>): jisX0410.meshSchema {

  for (let i=0; i<lst.length; i++){
    let sc = lst[i];

    if (sc.label === codeLabel[mcd])
      return sc;

  }//end loop

};//end function

/**
 * 2点間の距離計算
 * @param src 入力座標1
 * @param dst 入力座標2
 * @returns 距離
 */
var calDist = function(src: {x:number, y:number} , 
                       dst: {x:number, y:number})
  : number {
  
    let x1 = src.x;
    let y1 = src.y;
    let x2 = dst.x;
    let y2 = dst.y;
  
  return Math.sqrt( Math.pow(x1-x2, 2) + Math.pow(y1-y2,2) )
  
};//end method

/**
 * 緯度経度をWebメルカトルに変換する
 * @param latlon 緯度経度
 * @returns Webメルカトル座標XY
 */
var toMercator = function(latlon:[number, number])
 : { x: number, y: number} {
  
  let lat = latlon[0];
  let lon = latlon[1];

  let x = lon * 20037508.34 / 180.0;
  let y = Math.log(Math.tan((90.0 + lat) * Math.PI / 360.0)) / (Math.PI / 180.0);

  y = y * 20037508.34 / 180.0;
  return { x, y };
};//end method



//試験データCSVの読み込み
let data = fs.readFileSync('./tests/grid.csv', {
  encoding: 'utf-8'
});
//console.log(data);
var lines = data.split(/\r\n/g);




//メッシュ管理クラスのテスト
describe('meshUtilTest', () => {

    //点 探索 メッシュコード値の一致確認
    it('メッシュコード一致のテスト', () => {

      //メッシュコード管理クラスを初期化
      let meshUtil = new jisX0410.meshUtil();
      
      var lineCount = 0;
      //テスト用CSVを一行ずつ回す
      for (let i=0;i<lines.length;i++){
        //一行取り出し
        let line = lines[i];
        //カンマ区切り
        let array = line.split(/,/g);

        //取得地点を拾うが後述の理由で書き換え
        let dx: number = parseFloat( array[0] );
        let dy: number = parseFloat( array[1] );
        //メッシュ種別を拾う
        let mcd: string = array[2];
        //メッシュコード値を拾う
        let meshCode: string = array[3];
        // 4隅座標(矩形)範囲を拾う
        let minLon: number = parseFloat( array[4] );
        let minLat: number = parseFloat( array[5] );
        let maxLon: number = parseFloat( array[6] );
        let maxLat: number = parseFloat( array[7] );
        /*
         *メッシュ境界地点の指定の場合、メッシュコード値がどちらを採用するかが
         *実装に大きく依存するため記録された4隅座標の中心点を探索座標値とする
         */ 
        dx = minLon + (maxLon - minLon) /2;
        dy = minLat + (maxLat - minLat) /2;

        let sc = mcd2schema(mcd, meshUtil.meshSchemes);

        let geoJ = meshUtil.createGeoJSON([dy, dx], sc, sc);
        assert.equal(geoJ.length, 1);
        
        //細分区画は、メッシュコードの規定が不明のため飛ばす
        //先頭区画は地域メッシュと同一のはず
        if (mcd !== '7' && mcd !=='8'){
          let checkmeshCd: string = geoJ[0].properties.meshCode.replace(/-/g,'').replace(/_/g,'');
          assert.equal(checkmeshCd ,meshCode);
        }

        let coords:Array<[number, number]> = geoJ[0].geometry.coordinates[0];
        //console.log(coords);

        //lat lonにreverse
        let dstMinBl = <[number, number]> coords[0].reverse();
        let dstMaxBl = <[number, number]> coords[2].reverse(); //対角の2
        
        //入力と出力をWebメルカトルに変化して距離差を計算
        let dstMinXy = toMercator(dstMinBl);
        let dstMaxXy = toMercator(dstMaxBl);

        let srcMinXy = toMercator([minLat,minLon]);
        let srcMaxXy = toMercator([maxLat,maxLon]);
        if (0.001 < calDist(srcMinXy, dstMinXy) || 
            0.001 < calDist(srcMaxXy, dstMaxXy) ){
          console.log(coords);
          console.log(line);
          console.log(geoJ[0].properties.meshCode);
          
          console.log(calDist(srcMinXy, dstMinXy));
          console.log(calDist(srcMaxXy, dstMaxXy));
        }//end if

        //とりあえず1mmより誤差が大きければエラーとする。
        assert( calDist(srcMinXy, dstMinXy) < 0.001, "距離差1mm over");
        assert( calDist(srcMaxXy, dstMaxXy) < 0.001, "距離差1mm over");

        let esriJ = meshUtil.createEsriJSON([dy, dx], sc, mcd==='1'?undefined:sc);
        //同細分区画
        if (mcd !== '7' && mcd !=='8'){
          let checkmeshCd: string = esriJ[0].attributes.meshCode.replace(/-/g,'').replace(/_/g,'');
          assert.equal(checkmeshCd ,meshCode);
        }

        lineCount++;
        //console.log(lineCount);
      };
      
      //console.log(lineCount);

      //テストデータ行数を確認
      assert.equal(lineCount, 550);
    });
    //点 探索 メッシュコード値の一致確認 ここまで


    it("メッシュ件数とshpfileサイズの一致確認",() => {
      //メッシュコード管理クラスを初期化
      let meshUtil = new jisX0410.meshUtil();

      let mesh1schema = meshUtil.meshSchemes[0];
      let mesh2schema = meshUtil.meshSchemes[1];
      let mesh35schema = meshUtil.meshSchemes[2];
      let mesh32schema = meshUtil.meshSchemes[3];
      let mesh3schema = meshUtil.meshSchemes[4];
      let mesh4schema = meshUtil.meshSchemes[5];
      let mesh5schema = meshUtil.meshSchemes[6];
      let mesh6schema = meshUtil.meshSchemes[7];
      let mesh7schema = meshUtil.meshSchemes[8];
      let mesh8schema = meshUtil.meshSchemes[9];

      /* shpesizeとshpの比較 */
      let assertShpSize = function(shpSize:any, shp:jisX0410.shpFile){
        assert.equal( shpSize.shpLength, shp.shp.byteLength );
        assert.equal( shpSize.shxLenght, shp.shx.byteLength );
        assert.equal( shpSize.dbfLenght, shp.dbf.byteLength );
      };
      let latlon: [number, number] = [36, 136];
      //1次メッシュ (1件の返却)
      let mesh1 = meshUtil.createGeoJSON(latlon, mesh1schema);
      assert.equal(mesh1.length , 1);
      assert.equal(meshUtil.calcMeshCount(mesh1schema), 1);

      //1次メッシュ (1件のサイズ計算)
      let mesh1shpSize = jisX0410.shpFile.calcShpFileBytes(1);
      let mesh1shp = meshUtil.createShp(latlon, mesh1schema);
      assertShpSize(mesh1shpSize, mesh1shp);

      //2次メッシュ ( 1次メッシュの8分割 )
      let mesh2 = meshUtil.createGeoJSON(latlon, mesh2schema);
      assert.equal(mesh2.length, 8 * 8);
      assert.equal( meshUtil.calcMeshCount(mesh2schema), 8 * 8);

      let mesh2shpSize = jisX0410.shpFile.calcShpFileBytes(8 * 8);
      let mesh2shp = meshUtil.createShp(latlon, mesh2schema);
      assertShpSize(mesh2shpSize, mesh2shp);

      //5倍地域 (2次メッシュの2分割)
      let mesh3_5 = meshUtil.createGeoJSON(latlon, mesh35schema, mesh2schema);
      assert.equal(mesh3_5.length, 2 * 2);
      assert.equal( meshUtil.calcMeshCount(mesh35schema, mesh2schema), 2 * 2);

      let mesh35shpSize = jisX0410.shpFile.calcShpFileBytes(2 * 2);
      let mesh35shp = meshUtil.createShp(latlon, mesh35schema, mesh2schema);
      assertShpSize(mesh35shpSize, mesh35shp);

      //2倍地域 (2次メッシュの5分割)
      let mesh3_2 = meshUtil.createGeoJSON(latlon, mesh32schema, mesh2schema);
      assert.equal(mesh3_2.length, 5 * 5);
      assert.equal( meshUtil.calcMeshCount(mesh32schema, mesh2schema), 5 * 5);

      let mesh32shpSize = jisX0410.shpFile.calcShpFileBytes(5 * 5);
      let mesh32shp = meshUtil.createShp(latlon, mesh32schema, mesh2schema);
      assertShpSize(mesh32shpSize, mesh32shp);

      //地域メッシュ (2次メッシュの10分割)
      let mesh3 = meshUtil.createGeoJSON(latlon, mesh3schema, mesh2schema);
      assert.equal(mesh3.length, 10 * 10);
      assert.equal( meshUtil.calcMeshCount(mesh3schema, mesh2schema), 10 * 10);

      let mesh3shpSize = jisX0410.shpFile.calcShpFileBytes(10 * 10);
      let mesh3shp = meshUtil.createShp(latlon, mesh3schema, mesh2schema);
      assertShpSize(mesh3shpSize, mesh3shp);

      //4次 3次の2分割
      let mesh4 = meshUtil.createGeoJSON(latlon, mesh4schema, mesh3schema);
      assert.equal(mesh4.length, 2 * 2);
      assert.equal( meshUtil.calcMeshCount(mesh4schema, mesh3schema), 2 * 2);

      let mesh4shpSize = jisX0410.shpFile.calcShpFileBytes(2 * 2);
      let mesh4shp = meshUtil.createShp(latlon, mesh4schema, mesh3schema);
      assertShpSize(mesh4shpSize, mesh4shp);

      //5次 4次の2分割
      let mesh5 = meshUtil.createGeoJSON(latlon, mesh5schema, mesh4schema);
      assert.equal(mesh5.length, 2 * 2);
      assert.equal( meshUtil.calcMeshCount(mesh5schema, mesh4schema), 2 * 2);

      let mesh5shpSize = jisX0410.shpFile.calcShpFileBytes(2 * 2);
      let mesh5shp = meshUtil.createShp(latlon, mesh5schema, mesh4schema);
      assertShpSize(mesh5shpSize, mesh5shp);

      //6次 5次の2分割
      let mesh6 = meshUtil.createGeoJSON(latlon, mesh6schema, mesh5schema);
      assert.equal(mesh6.length, 2 * 2);
      assert.equal( meshUtil.calcMeshCount(mesh6schema, mesh5schema), 2 * 2);

      let mesh6shpSize = jisX0410.shpFile.calcShpFileBytes(2 * 2);
      let mesh6shp = meshUtil.createShp(latlon, mesh6schema, mesh5schema);
      assertShpSize(mesh6shpSize, mesh6shp);

      // 10分の1 = 3次の10分割
      let mesh7 = meshUtil.createGeoJSON(latlon, mesh7schema, mesh3schema);
      assert.equal(mesh7.length, 10 * 10);
      assert.equal( meshUtil.calcMeshCount(mesh7schema, mesh3schema), 10 * 10);
      
      let mesh7shpSize = jisX0410.shpFile.calcShpFileBytes(10 * 10);
      let mesh7shp = meshUtil.createShp(latlon, mesh7schema, mesh3schema);
      assertShpSize(mesh7shpSize, mesh7shp);

      // 20分の1 = 3次の20分割
      let mesh8 = meshUtil.createGeoJSON(latlon, mesh8schema, mesh3schema);
      assert.equal(mesh8.length, 20 * 20);
      assert.equal( meshUtil.calcMeshCount(mesh8schema, mesh3schema), 20 * 20);

      let mesh8shpSize = jisX0410.shpFile.calcShpFileBytes(20 * 20);
      let mesh8shp = meshUtil.createShp(latlon, mesh8schema, mesh3schema);
      assertShpSize(mesh8shpSize, mesh8shp);

      //一応作成オプションの確認
      let shpOpt = {
        shp: false,
        shx: false,
        dbf: false,
        prj: false
      };
      let optMesh = meshUtil.createShp(latlon, mesh3schema, mesh2schema, shpOpt);
      assert.equal(optMesh.shp, undefined);
      assert.equal(optMesh.shx, undefined);
      assert.equal(optMesh.dbf, undefined);
      assert.equal(optMesh.prj, undefined);

      // console.log(mesh1);
      // console.log(mesh2);
      // console.log(mesh3_5);
      // console.log(mesh3_2);
      // console.log(mesh3);
      // console.log(mesh4);
      // console.log(mesh5);
      // console.log(mesh6);
      // console.log(mesh7);
      // console.log(mesh8);

    });


    it("範囲探索確認",() => {
      
      //メッシュコード管理クラスを初期化
      let meshUtil = new jisX0410.meshUtil();

      let mesh1schema = meshUtil.meshSchemes[0];
      let mesh2schema = meshUtil.meshSchemes[1];
      // let mesh35schema = meshUtil.meshSchemes[2];
      // let mesh32schema = meshUtil.meshSchemes[3];
      let mesh3schema = meshUtil.meshSchemes[4];
      let mesh4schema = meshUtil.meshSchemes[5];
      let mesh5schema = meshUtil.meshSchemes[6];
      let mesh6schema = meshUtil.meshSchemes[7];
      let mesh7schema = meshUtil.meshSchemes[8];
      let mesh8schema = meshUtil.meshSchemes[9];
      //名称とスキーマの辞書
      let nameSchema = {
        "GRID1": mesh1schema,
        "GRID2": mesh2schema,
        "GRID3": mesh3schema,
        "GRID4": mesh4schema,
        "GRID5": mesh5schema,
        "GRID6": mesh6schema,
        "GRID7": mesh7schema,
        "GRID8": mesh8schema
      };
      //試験データの読み込み
      let extentsData = fs.readFileSync('./tests/extents.csv',{
        encoding: 'utf-8'
      });
      var extents = extentsData.split(/\r\n/g);

      //テスト用CSVを一行ずつ回す
      for (let i=0;i<extents.length;i++){
        //一行取り出し
        let line = extents[i];
        if (line.length < 3)
          continue;

        //カンマ区切り
        let array = line.split(/,/g);

        let ext:jisX0410.IExtent = {
          xmin: parseFloat( array[0] ),
          ymin: parseFloat( array[1] ),
          xmax: parseFloat( array[2] ),
          ymax: parseFloat( array[3] )
        };

        //console.log(array[4]);
        let gridName = array[4];
        let schema =  nameSchema[gridName];

        let codes:Array<string> = [];
        let gridCount: number = 0;

        if (gridName !== 'GRID7' && gridName !== 'GRID8'){
          if (array[5])
            codes = array[5].split(/\|/g);
        } else {
          //細分区画は件数のみ
          gridCount = parseInt(array[5]);
        }

        //作成
        //try {
        var geoJ = meshUtil.createGeoJsonFromExtent(ext, schema);
        var esri = meshUtil.createEsriJsonFromExtent(ext,schema);
        
        //計算結果の一致確認
        let meshCount = meshUtil.calcMeshCountFromExtent(ext,schema);
        assert.equal(geoJ.length, meshCount);
        console.log(`メッシュ件数:${meshCount}`);

        //500件以下なら文字列化して再度インスタンス化可能か確認
        if (meshCount < 300)
        {
          let geoJBuffer = meshUtil.geoJsonToStringBuffer(geoJ);
          let esriBuffer = meshUtil.esriJsonToStringBuffer(esri);

          // console.log(String.fromCharCode.apply("", new Uint8Array(geoJBuffer)));
          // console.log(String.fromCharCode.apply("", new Uint8Array(esriBuffer)));

          let newGeoJ = <Array<jisX0410.IGeoJsonFeature>>JSON.parse(String.fromCharCode.apply("", new Uint8Array(geoJBuffer))).features;
          assert.equal(geoJ.length, newGeoJ.length);
          let newEsri = <Array<jisX0410.IEsriJsonFeature>>JSON.parse(String.fromCharCode.apply("", new Uint8Array(esriBuffer))).features;
          assert.equal(newEsri.length, esri.length);
        }
        //サイズ一致の確認
        var shpSize = jisX0410.shpFile.calcShpFileBytes(esri.length);
        var shp = meshUtil.createShpFromExtent(ext,schema);
        assert.equal( shpSize.shpLength, shp.shp.byteLength );
        assert.equal( shpSize.shxLenght, shp.shx.byteLength );
        assert.equal( shpSize.dbfLenght, shp.dbf.byteLength );
        
        //回すだけ回して件数一致確認
        assert.equal(geoJ.length, esri.length);
        for(let i=0;i<geoJ.length;i++){
          //メッシュコードの一致確認
          assert.equal( geoJ[i].properties.meshCode, esri[i].attributes.meshCode);
        }//end loop

        // } catch(ex){
        //   console.log(line);
        //   console.log(schema);
        //   throw ex;
        // }
        if (gridName !== 'GRID7' && gridName !== 'GRID8'){
          if (geoJ.length !== codes.length){
            console.log(line);
            console.log(codes);
          }
          //件数の一致確認
          assert.equal(geoJ.length, codes.length);
        }
        else
        {
          //件数の一致確認
          assert.equal(gridCount, geoJ.length);
        }

        if (gridName !== 'GRID7' && gridName !== 'GRID8'){
          for (let index=0;index<geoJ.length;index++){
            let checkmeshCd: string = geoJ[0].properties.meshCode.replace(/-/g,'').replace(/_/g,'');
            let res = codes.indexOf(checkmeshCd);
            if (res < 0){
              console.log(line);
              console.log(geoJ);
            }
            assert(-1 < res, 'メッシュコードが見つからない' + checkmeshCd);
          }//end geojson loop
        }//end if


      }//end loop
      //複数範囲を回すので当然遅いから伸ばしておく
    }).timeout(1000 * 60);

});
////メッシュ管理クラスのテスト ここまで