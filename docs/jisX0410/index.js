var jisX0410;
(function (jisX0410) {
    /** メッシュ定義の管理クラス */
    var meshSchema = /** @class */ (function () {
        /**
         * コンストラクタ
         * @param parent  親メッシュ定義
         * @param splitCount 分割数
         */
        function meshSchema(parent, splitCount) {
            if (parent === void 0) { parent = undefined; }
            if (splitCount === void 0) { splitCount = undefined; }
            this.parent = parent;
            this.splitCount = splitCount;
            if (parent) {
                this.widthDD = parent.widthDD / splitCount;
                this.heightDD = parent.heightDD / splitCount;
            } //end if
        } //end method
        /**
         * 標準的なメッシュ定義の返却
         */
        meshSchema.createStandardMesh = function () {
            //1次メッシュコード生成用のコード
            var mesh1_getCode = function (latlon) {
                var r = Math.round(Math.floor(latlon[0] * 15.0 / 10.0));
                var c = Math.round(Math.floor(latlon[1] - 100.0));
                //メッシュコード
                var code = String(r) + String(c);
                var lat = r / 15.0 * 10.0;
                var lon = c + 100.0;
                return { meshCode: code, lat: lat, lon: lon };
            };
            //2-3次メッシュコード生成用のコード
            var mesh2_3_getCode = function (latlon) {
                var thisObj = this;
                return meshSchema._getCodeBase(thisObj, latlon, function (preMeshInfo, r, c) {
                    var thisObj = this;
                    return preMeshInfo.meshCode + thisObj.splitString + String(r) + String(c);
                });
            };
            //3-6次メッシュコードと5倍地域メッシュの生成用コード
            var mesh4_6_getCode = function (latlon) {
                var thisObj = this;
                return meshSchema._getCodeBase(thisObj, latlon, function (preMeshInfo, r, c) {
                    var thisObj = this;
                    var code = r < 1 ? String(c + 1) : String(c + 1 + 2);
                    code = preMeshInfo.meshCode + thisObj.splitString + code;
                    return code;
                });
            };
            //2倍地域メッシュの生成コード
            var mesh3_2_getCode = function (latlon) {
                var thisObj = this;
                return meshSchema._getCodeBase(thisObj, latlon, function (preMeshInfo, r, c) {
                    var thisObj = this;
                    var MESH_ID = ["0", "2", "4", "6", "8"];
                    var code = MESH_ID[r] + MESH_ID[c] + '5';
                    code = preMeshInfo.meshCode + thisObj.splitString + code;
                    return code;
                });
            };
            //10分の1・20分の1細分区画のメッシュコード生成コード ( 明確な規定がなさそうので適当にRCを文字化 )
            var mesh7_8_getCode = function (latlon) {
                var thisObj = this;
                return meshSchema._getCodeBase(thisObj, latlon, function (preMeshInfo, r, c) {
                    var thisObj = this;
                    //文字列化して0埋め
                    var code = ('00' + String(r)).slice(-2) + thisObj.splitString + ('00' + String(c)).slice(-2);
                    code = preMeshInfo.meshCode + thisObj.splitString + code;
                    return code;
                });
            };
            var mesh1 = new meshSchema();
            mesh1.label = "第1次地域区画(約80km四方)";
            mesh1.widthDD = 1;
            mesh1.heightDD = 2 / 3;
            mesh1.getMeshCode = mesh1_getCode.bind(mesh1);
            var mesh2 = new meshSchema(mesh1, 8);
            mesh2.label = "第2次地域区画(約10km四方)";
            mesh2.splitString = "-";
            mesh2.getMeshCode = mesh2_3_getCode.bind(mesh2);
            var mesh3_5 = new meshSchema(mesh2, 2);
            mesh3_5.label = "5倍地域メッシュ(約5km四方)";
            mesh3_5.splitString = "-";
            mesh3_5.getMeshCode = mesh4_6_getCode.bind(mesh3_5);
            var mesh3_2 = new meshSchema(mesh2, 5);
            mesh3_2.label = "2倍地域メッシュ(約2km四方)";
            mesh3_2.splitString = "-";
            mesh3_2.getMeshCode = mesh3_2_getCode.bind(mesh3_2);
            var mesh3 = new meshSchema(mesh2, 10);
            mesh3.label = "基準地域メッシュ(約1km四方)";
            mesh3.splitString = "-";
            mesh3.getMeshCode = mesh2_3_getCode.bind(mesh3);
            var mesh4 = new meshSchema(mesh3, 2);
            mesh4.label = "2分の1地域メッシュ(約500m四方)";
            mesh4.splitString = "-";
            mesh4.getMeshCode = mesh4_6_getCode.bind(mesh4);
            var mesh5 = new meshSchema(mesh4, 2);
            mesh5.label = "4分の1地域メッシュ(約250m四方)";
            mesh5.splitString = "-";
            mesh5.getMeshCode = mesh4_6_getCode.bind(mesh5);
            var mesh6 = new meshSchema(mesh5, 2);
            mesh6.label = "8分の1地域メッシュ(約125m四方)";
            mesh6.splitString = "-";
            mesh6.getMeshCode = mesh4_6_getCode.bind(mesh6);
            var mesh7 = new meshSchema(mesh3, 10);
            mesh7.label = "10分の1 細分区画(約100m四方)";
            mesh7.splitString = "_";
            mesh7.getMeshCode = mesh7_8_getCode.bind(mesh7);
            var mesh8 = new meshSchema(mesh3, 20);
            mesh8.label = "20分の1 細分区画(約50m四方)";
            mesh8.splitString = "_";
            mesh8.getMeshCode = mesh7_8_getCode.bind(mesh8);
            //定義の返却
            return [
                // 0   1      2        3        4      5      6      7      8      9
                mesh1, mesh2, mesh3_5, mesh3_2, mesh3, mesh4, mesh5, mesh6, mesh7, mesh8
            ];
        }; //end mehtod
        /**
         * メッシュコード取得用の標準処理定義
         * @param thisObj メッシュスキーマ
         * @param latlon 緯度経度
         * @param getCoods メッシュコード取得処理
         * @returns メッシュ情報
         */
        meshSchema._getCodeBase = function (thisObj, latlon, getCoods) {
            var preMeshInfo = thisObj.parent.getMeshCode(latlon);
            var r = Math.floor((latlon[0] - preMeshInfo.lat) / thisObj.heightDD);
            var c = Math.floor((latlon[1] - preMeshInfo.lon) / thisObj.widthDD);
            var code = getCoods.bind(thisObj)(preMeshInfo, r, c);
            var lat = preMeshInfo.lat + (r * thisObj.heightDD);
            var lon = preMeshInfo.lon + (c * thisObj.widthDD);
            return { meshCode: code, lat: lat, lon: lon };
        }; //end method
        return meshSchema;
    }()); //end class
    jisX0410.meshSchema = meshSchema;
})(jisX0410 || (jisX0410 = {})); //end namespace
/// <reference path="meshSchema.ts" />import { json } from "../node_modules/@types/body-parser/index";
var jisX0410;
/// <reference path="meshSchema.ts" />import { json } from "../node_modules/@types/body-parser/index";
(function (jisX0410) {
    /**
     * メッシュ管理クラス
     */
    var meshUtil = /** @class */ (function () {
        /** コンストラクタ */
        function meshUtil() {
            /** メッシュ情報定義 */
            this.meshSchemes = jisX0410.meshSchema.createStandardMesh();
        } //end method
        /**
         *
         * @param extent
         * @param schema
         */
        meshUtil.prototype.calcMeshCountFromExtent = function (extent, schema) {
            //左下隅のメッシュを取得して左下隅座標を書き換え
            var leftLower = this._getMeshInfoFromBl([extent.ymin, extent.xmin], schema);
            var minXY = leftLower.coords[0];
            var widthDD = Math.sqrt(Math.pow(extent.xmax - minXY[0], 2));
            var heightDD = Math.sqrt(Math.pow(extent.ymax - minXY[1], 2));
            var cols = Math.ceil(widthDD / schema.widthDD);
            var rows = Math.ceil(heightDD / schema.heightDD);
            return cols * rows;
        }; //end method
        /**
         * ４隅座標分 指定メッシュの作成
         * @param extent 4隅座標(矩形)
         * @param schema メッシュ構造
         * @returns GeoJsonFeature Array
         */
        meshUtil.prototype.createGeoJsonFromExtent = function (extent, schema) {
            //左下隅のメッシュを取得して左下隅座標を書き換え
            var leftLower = this._getMeshInfoFromBl([extent.ymin, extent.xmin], schema);
            var minXY = leftLower.coords[0];
            var widthDD = Math.sqrt(Math.pow(extent.xmax - minXY[0], 2));
            var heightDD = Math.sqrt(Math.pow(extent.ymax - minXY[1], 2));
            var cols = Math.ceil(widthDD / schema.widthDD);
            var rows = Math.ceil(heightDD / schema.heightDD);
            if (cols < 1)
                cols = 1;
            if (rows < 1)
                rows = 1;
            var results = Array.from(new Array(rows * cols)).map(function (val, index) {
                //行列を計算
                var r = Math.floor(index / cols);
                var c = index % cols;
                var x = (minXY[0] + schema.widthDD / 2) + (c * schema.widthDD);
                var y = (minXY[1] + schema.heightDD / 2) + (r * schema.heightDD);
                //計算した緯度経度からメッシュ情報を取得
                var info = this._getMeshInfoFromBl([y, x], schema);
                return this._toGeoJson(info);
            }.bind(this)); //end array map
            return results;
        }; //end method
        /**
         * ４隅座標分 指定メッシュの作成
         * @param extent 4隅座標(矩形)
         * @param schema メッシュ構造
         * @returns GeoJsonFeature Array
         */
        meshUtil.prototype.createEsriJsonFromExtent = function (extent, schema) {
            //左下隅のメッシュを取得して左下隅座標を書き換え
            var leftLower = this._getMeshInfoFromBl([extent.ymin, extent.xmin], schema);
            var minXY = leftLower.coords[0];
            var widthDD = Math.sqrt(Math.pow(extent.xmax - minXY[0], 2));
            var heightDD = Math.sqrt(Math.pow(extent.ymax - minXY[1], 2));
            var cols = Math.ceil(widthDD / schema.widthDD);
            var rows = Math.ceil(heightDD / schema.heightDD);
            if (cols < 1)
                cols = 1;
            if (rows < 1)
                rows = 1;
            var results = Array.from(new Array(rows * cols)).map(function (val, index) {
                //行列を計算
                var r = Math.floor(index / cols);
                var c = index % cols;
                var x = (minXY[0] + schema.widthDD / 2) + (c * schema.widthDD);
                var y = (minXY[1] + schema.heightDD / 2) + (r * schema.heightDD);
                //計算した緯度経度からメッシュ情報を取得
                var info = this._getMeshInfoFromBl([y, x], schema);
                return this._toEsriJson(info);
            }.bind(this)); //end array map
            return results;
        }; //end method
        /**
         * ４隅座標分 指定メッシュの作成
         * @param extent 4隅座標(矩形)
         * @param schema メッシュ構造
         * @returns GeoJsonFeature Array
         */
        meshUtil.prototype.createShpFromExtent = function (extent, schema, shpOpt) {
            if (shpOpt === void 0) { shpOpt = undefined; }
            //左下隅のメッシュを取得して左下隅座標を書き換え
            var leftLower = this._getMeshInfoFromBl([extent.ymin, extent.xmin], schema);
            var minXY = leftLower.coords[0];
            var widthDD = Math.sqrt(Math.pow(extent.xmax - minXY[0], 2));
            var heightDD = Math.sqrt(Math.pow(extent.ymax - minXY[1], 2));
            var cols = Math.ceil(widthDD / schema.widthDD);
            var rows = Math.ceil(heightDD / schema.heightDD);
            if (cols < 1)
                cols = 1;
            if (rows < 1)
                rows = 1;
            var results = Array.from(new Array(rows * cols)).map(function (val, index) {
                //行列を計算
                var r = Math.floor(index / cols);
                var c = index % cols;
                var x = (minXY[0] + schema.widthDD / 2) + (c * schema.widthDD);
                var y = (minXY[1] + schema.heightDD / 2) + (r * schema.heightDD);
                //計算した緯度経度からメッシュ情報を取得
                var info = this._getMeshInfoFromBl([y, x], schema);
                return {
                    "geometry": info.coords,
                    "meshCode": info.meshInfo.meshCode
                };
            }.bind(this)); //end array map
            //SHPの返却
            return new jisX0410.shpFile(results, shpOpt);
        }; //end method
        /**
         * メッシュ件数の計算
         * @param schema 作成するメッシュ構造
         * @param maxSchema 上位メッシュ構造
         * @returns 件数
         */
        meshUtil.prototype.calcMeshCount = function (schema, maxSchema) {
            if (maxSchema === void 0) { maxSchema = undefined; }
            //分割数をリセット
            this._divCount = 1;
            var roots = this._getRootsMeshSchema(schema, maxSchema);
            return this._divCount * this._divCount;
        }; //end method
        /**
         * GeoJSON Feature配列の返却
         * @param latlon 作成地点(緯度経度)
         * @param schema メッシュ構造
         * @param maxSchema 作成上限メッシュ構造(省略可)
         * @returns GeoJSON Feature配列
         */
        meshUtil.prototype.createGeoJSON = function (latlon, schema, maxSchema) {
            if (maxSchema === void 0) { maxSchema = undefined; }
            //分割数をリセット
            this._divCount = 1;
            var roots = this._getRootsMeshSchema(schema, maxSchema);
            //親情報を得ておく
            var rootsInfo = roots.getMeshCode(latlon);
            var divCount = this._divCount;
            //分割数分配列を作成 
            //例(3次メッシュ): 10等分 * 8等分 * 1 (1次メッシュ=(根)))
            //1次メッシュ1個は80*80の行列=6400メッシュ
            var features = Array.from(new Array(this._divCount * this._divCount)).map(function (val, index) {
                var coordsInfo = this._getMeshInfo(schema, rootsInfo, index, divCount);
                return this._toGeoJson(coordsInfo);
            }.bind(this)); //end array map
            return features;
        }; //end method
        /**
         * ESRI JSON定義の返却
         * @param latlon 作成地点(緯度経度)
         * @param schema メッシュ構造
         * @param maxSchema 作成上限メッシュ構造(省略可)
         * @returns ESRI JSON定義 配列
         */
        meshUtil.prototype.createEsriJSON = function (latlon, schema, maxSchema) {
            if (maxSchema === void 0) { maxSchema = undefined; }
            //分割数をリセット
            this._divCount = 1;
            var roots = this._getRootsMeshSchema(schema, maxSchema);
            //親情報を得ておく
            var rootsInfo = roots.getMeshCode(latlon);
            var divCount = this._divCount;
            //分割数分配列を作成 
            //例(3次メッシュ): 10等分 * 8等分 * 1 (1次メッシュ=(根)))
            //1次メッシュ1個は80*80の行列=6400メッシュ
            var features = Array.from(new Array(this._divCount * this._divCount)).map(function (val, index) {
                var coordsInfo = this._getMeshInfo(schema, rootsInfo, index, divCount);
                //esri feature定義
                return this._toEsriJson(coordsInfo);
            }.bind(this)); //end array map
            return features;
        }; //end method
        /**
         * shapefileの作成
         * @param latlon 作成地点(緯度経度)
         * @param schema メッシュ構造
         * @param maxSchema 作成上限メッシュ構造(省略可)
         * @param shpOpt 作成オプション
         * @returns shapefile
         */
        meshUtil.prototype.createShp = function (latlon, schema, maxSchema, shpOpt) {
            if (maxSchema === void 0) { maxSchema = undefined; }
            if (shpOpt === void 0) { shpOpt = undefined; }
            //分割数をリセット
            this._divCount = 1;
            var roots = this._getRootsMeshSchema(schema, maxSchema);
            //親情報を得ておく
            var rootsInfo = roots.getMeshCode(latlon);
            var divCount = this._divCount;
            //分割数分配列を作成 
            //例(3次メッシュ): 10等分 * 8等分 * 1 (1次メッシュ=(根)))
            //1次メッシュ1個は80*80の行列=6400メッシュ
            var features = Array.from(new Array(this._divCount * this._divCount)).map(function (val, index) {
                var coordsInfo = this._getMeshInfo(schema, rootsInfo, index, divCount);
                return {
                    "geometry": coordsInfo.coords,
                    "meshCode": coordsInfo.meshInfo.meshCode
                };
            }.bind(this)); //end array map
            //SHPの返却
            return new jisX0410.shpFile(features, shpOpt);
        }; //end method
        /**
         * GeoJSONフィーチャ配列を文字列バイナリ化
         * @param features GeoJSON Feature Array
         * @returns ArrayBuffer
         */
        meshUtil.prototype.geoJsonToStringBuffer = function (features) {
            var headerString = '{ "type": "FeatureCollection", "features":[';
            var footerString = ']}';
            return this._jsonToArrayBuffer(features, headerString, footerString);
        }; //end method
        /**
         * esri JSON フィーチャ配列を文字列バイナリ化
         * @param features esri JSON Feature Array
         * @returns ArrayBuffer
         */
        meshUtil.prototype.esriJsonToStringBuffer = function (features) {
            var headerString = '{ "displayFieldName" : "meshCode", "fieldAliases": { "meshCode" : "meshCode" }, "fields" : [{ "name" : "meshCode", "type" : "esriFieldTypeString", "alias" : "meshCode", "length" : 15}], "features":[';
            var footerString = ']}';
            return this._jsonToArrayBuffer(features, headerString, footerString);
        }; //end method
        /**
         * GeoJSONないしesriJSONのフィーチャ配列を文字列バイナリ化
         * @param features フィーチャ配列
         * @param headerString ヘッダ文字列
         * @param footerString フッタ文字列
         * @returns 文字列バイナリ
         */
        meshUtil.prototype._jsonToArrayBuffer = function (features, headerString, footerString) {
            var meshCount = features.length;
            //let recordLength = JSON.stringify(features[0]).length;
            //可変長なのでしょうがなくサイズ計算
            var totalRecords = 0;
            for (var i = 0; i < meshCount; i++) {
                var record = JSON.stringify(features[i]);
                totalRecords += record.length;
            }
            //区切り文字分足す。
            totalRecords += meshCount - 1;
            var jsonBuffer = new ArrayBuffer(headerString.length + footerString.length + totalRecords);
            var headerView = new DataView(jsonBuffer, 0, headerString.length);
            for (var writeByte_1 = 0; writeByte_1 < headerString.length; writeByte_1++) {
                headerView.setUint8(writeByte_1, headerString.charCodeAt(writeByte_1));
            } //end loop
            var recordView = new DataView(jsonBuffer, headerString.length, totalRecords);
            var recordsStart = 0;
            for (var i = 0; i < meshCount; i++) {
                var record = JSON.stringify(features[i]);
                for (var writeByte = 0; writeByte < record.length; writeByte++) {
                    recordView.setUint8(recordsStart + writeByte, record.charCodeAt(writeByte));
                } //end loop
                recordsStart += record.length;
                //最終でなければ区切り文字を足す
                if (i + 1 !== meshCount) {
                    recordView.setUint8(recordsStart, ",".charCodeAt(0));
                    recordsStart += 1;
                }
            } //emd loop record
            var footerView = new DataView(jsonBuffer, jsonBuffer.byteLength - footerString.length, footerString.length);
            for (var writeByte = 0; writeByte < footerString.length; writeByte++) {
                footerView.setUint8(writeByte, footerString.charCodeAt(writeByte));
            } //end loop
            return jsonBuffer;
        };
        /**
         * インデックスと分割数からメッシュ情報を取得する
         * @param schema 取得するメッシュの定義
         * @param rootsInfo 親スキーマ定義
         * @param index インデックス
         * @param divCount 分割数
         * @returns メッシュ情報
         */
        meshUtil.prototype._getMeshInfo = function (schema, rootsInfo, index, divCount) {
            //行列を計算
            var r = Math.floor(index / divCount);
            var c = index % divCount;
            //緯度経度中心を求めておく
            var clat = rootsInfo.lat + (r * schema.heightDD) + (schema.heightDD / 2.0);
            var clon = rootsInfo.lon + (c * schema.widthDD) + (schema.widthDD / 2.0);
            //メッシュコード取得
            return this._getMeshInfoFromBl([clat, clon], schema);
        }; //end method
        /**
         * 緯度経度からメッシュ情報の取得
         * @param latlon 緯度経度
         * @param schema メッシュ構造
         * @returns メッシュ情報
         */
        meshUtil.prototype._getMeshInfoFromBl = function (latlon, schema) {
            //メッシュコード取得
            var meshInfo = schema.getMeshCode(latlon);
            // 時計回りでまわしておく
            var coords = [
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
        };
        /**
         * 根のメッシュスキーマを取得
         * @param schema メッシュスキーマ
         * @param maxSchema 親がこれならここまでとなる定義
         * @returns 指定した親スキーマ (無指定時は1次メッシュ)
         */
        meshUtil.prototype._getRootsMeshSchema = function (schema, maxSchema) {
            //親がいなければ根っこ
            if (!schema.parent && maxSchema === undefined)
                return schema;
            //最大作成がセットされている場合 ラベルが同一なら戻す
            if (maxSchema !== undefined && maxSchema.label === schema.label)
                return schema;
            //分割数をカウント
            this._divCount = this._divCount * schema.splitCount;
            //親がいる場合は再帰呼び出し
            return this._getRootsMeshSchema(schema.parent, maxSchema);
        }; //end method
        /**
         * GeoJSON Featureの作成
         * @param mesh メッシュ情報
         * @returns GeoJsonFeature
         */
        meshUtil.prototype._toGeoJson = function (mesh) {
            return { "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [mesh.coords]
                },
                "properties": {
                    "meshCode": mesh.meshInfo.meshCode
                }
            };
        }; //end method
        /**
         * EsriJSON Featureの作成
         * @param mesh メッシュ情報
         * @returns EsriJsonFeatureの作成
         */
        meshUtil.prototype._toEsriJson = function (mesh) {
            //esri feature定義
            return {
                "geometry": { "rings": [mesh.coords] },
                "attributes": {
                    "meshCode": mesh.meshInfo.meshCode
                }
            };
        };
        return meshUtil;
    }()); //end class
    jisX0410.meshUtil = meshUtil;
})(jisX0410 || (jisX0410 = {})); //end namespace
var jisX0410;
(function (jisX0410) {
    /** JGD2KのESRI WKT */
    var JGD2K = 'GEOGCS["JGD2000",DATUM["D_Japanese Geodetic Datum 2000",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.017453292519943295]]';
    /** メッシュ用 shapefile作成クラス */
    var shpFile = /** @class */ (function () {
        /**
         * コンストラクタ
         * @param mesh 作成メッシュ定義
         * @param options 作成オプション
         */
        function shpFile(mesh, options) {
            if (options === void 0) { options = { shp: true, shx: true, dbf: true, prj: true }; }
            //クラス変数にセット
            this._mesh = mesh;
            this._meshLength = mesh.length;
            //shpないしshxを作成する際は範囲計算
            if (options.shp || options.shx) {
                //最大範囲の計算
                this._calcMeshExtent();
            } //end if
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
        } //end method
        /**
         * shapefile生成前のサイズ計算
         * @param meshCount メッシュ件数
         * @returns shapefileのバイトサイズ
         */
        shpFile.calcShpFileBytes = function (meshCount) {
            //---------- shp -------------
            // ヘッダ－:100  レコード:136 (情報:56/ポイント配列:16*5=80 5は頂点数)
            //レコード情報はポリゴンパート数で変動
            var shpLength = 100 + (136 * meshCount);
            //---------- shx -------------
            //レコード情報136-8の128
            var SHX_RECORD_CONTENT_LENGTH = 128 / 2;
            // ヘッダ100とレコード数 * 8
            var shxLenght = 100 + (8 * meshCount);
            //---------- dbf -------------
            //20文字のメッシュコード固定で考える。
            var FIELD_LENGTH = 20;
            // 32 * フィールド数 + 1
            var FIELD_DESC_LENGTH = 32 * 1 + 1;
            //本来はフィールドの全長だが1フィールドで
            var BYTES_PER_RECORD = 1 + FIELD_LENGTH;
            //データ総長 レコード数×フィールドの長さ
            var dataLength = BYTES_PER_RECORD * meshCount + 1;
            //ヘッダー+カラム説明+
            var dbfLenght = 32 + FIELD_DESC_LENGTH + dataLength;
            return {
                shpLength: shpLength,
                shxLenght: shxLenght,
                dbfLenght: dbfLenght
            };
        }; //end method
        /** SHPファイル生成処理 */
        shpFile.prototype._createShpBuffer = function () {
            //メッシュ定義受け取り
            var mesh = this._mesh;
            var meshLenght = this._meshLength;
            // ヘッダ－:100  レコード:136 (情報:56/ポイント配列:16*5=80 5は頂点数)
            //レコード情報はポリゴンパート数で変動
            var bufferLenght = 100 + (136 * meshLenght);
            var shpBuffer = new ArrayBuffer(bufferLenght);
            //先頭100がヘッダ
            var shpHeaderView = new DataView(shpBuffer, 0, 100);
            //定型
            shpHeaderView.setInt32(0, 9994);
            shpHeaderView.setInt32(28, 1000, true);
            //最大長 shp file length in 16 bit words
            shpHeaderView.setInt32(24, bufferLenght / 2);
            //形状指定 : 1=point 3=polyline 5=polygon
            shpHeaderView.setInt32(32, 5, true);
            //最大範囲を指定
            var fullExt = this.fullExtent;
            shpHeaderView.setFloat64(36, fullExt.xmin, true);
            shpHeaderView.setFloat64(44, fullExt.ymin, true);
            shpHeaderView.setFloat64(52, fullExt.xmax, true);
            shpHeaderView.setFloat64(60, fullExt.ymax, true);
            //各レコード
            mesh.map(function (meshItem, index) {
                var RECORD_LENGTH = 8 + 44 + 4 * 1; //4*パート数 56
                //レコード情報136-8の128
                var RECORD_CONTENT_LENGTH = 128 / 2;
                var offset = 100 + (136 * index); //レコード数離す
                var shpRecordInfo = new DataView(shpBuffer, offset, RECORD_LENGTH);
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
                var pointsArray = new DataView(shpBuffer, offset + RECORD_LENGTH, 80);
                //5頂点で回す
                for (var ptIndex = 0; ptIndex < 5; ptIndex++) {
                    var pt = meshItem.geometry[ptIndex];
                    //XY座標値のセット
                    pointsArray.setFloat64(ptIndex * 16, pt[0], true);
                    pointsArray.setFloat64(ptIndex * 16 + 8, pt[1], true);
                } //end loop
            });
            this.shp = shpBuffer;
        }; //end method
        /** shxインデックスファイル */
        shpFile.prototype._createInx = function () {
            var mesh = this._mesh;
            var meshLenght = this._meshLength;
            var fullExtent = this.fullExtent;
            //レコード情報136-8の128
            var RECORD_CONTENT_LENGTH = 128 / 2;
            // ヘッダ100とレコード数 * 8
            var shxBuffer = new ArrayBuffer(100 + 8 * meshLenght);
            var shxHeaderView = new DataView(shxBuffer, 0, 100);
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
            shxHeaderView.setInt32(24, (50 + meshLenght * 4));
            var shxDataView = new DataView(shxBuffer, 100, 8 * meshLenght);
            mesh.map(function (val, index) {
                //let shxDataView = new DataView(shxBuffer, 100 + 8 * index, 8);
                //開始位置はindex * 8
                var start = index * 8;
                //ヘッダー100
                //レコード:136 (情報:56/ポイント配列:16*5=80 5は頂点数)
                shxDataView.setInt32(start, (100 + 136 * index) / 2);
                shxDataView.setInt32(start + 4, RECORD_CONTENT_LENGTH);
            });
            this.shx = shxBuffer;
            //return shxBuffer;
        };
        /** DBFファイルの作成 */
        shpFile.prototype._createDbf = function () {
            var mesh = this._mesh;
            var meshLenght = this._meshLength;
            // 20文字のメッシュコード固定で考える。
            var FIELD_LENGTH = 20;
            // 32 * フィールド数 + 1
            var FIELD_DESC_LENGTH = 32 * 1 + 1;
            //本来はフィールドの全長だが1フィールドで
            var BYTES_PER_RECORD = 1 + FIELD_LENGTH;
            //データ総長 レコード数×フィールドの長さ
            var dataLength = BYTES_PER_RECORD * meshLenght + 1;
            //ヘッダー+カラム説明+
            var dbfBufferLength = 32 + FIELD_DESC_LENGTH + dataLength;
            //DBFのバイト配列
            var dbfBuffer = new ArrayBuffer(dbfBufferLength);
            //----------- ヘッダー情報の書き込み -------
            var dbfHeaderView = new DataView(dbfBuffer, 0, 32);
            dbfHeaderView.setUint8(0, 3); // File Signature: DBF - UNSIGNED
            //更新日時
            var nowDate = new Date();
            dbfHeaderView.setUint8(1, nowDate.getFullYear() - 1900); // UNSIGNED
            dbfHeaderView.setUint8(2, nowDate.getMonth()); // UNSIGNED
            dbfHeaderView.setUint8(3, nowDate.getDate()); // UNSIGNED
            //レコード数
            dbfHeaderView.setUint32(4, meshLenght, true); // LITTLE ENDIAN, UNSIGNED
            //ヘッダーの長さとフィールド説明の長さがヘッダの総長
            dbfHeaderView.setUint16(8, FIELD_DESC_LENGTH + 32, true);
            //レコード長
            dbfHeaderView.setUint16(10, BYTES_PER_RECORD, true);
            //----------- ヘッダー情報の書き込み ここまで -------
            //----------- フィールド説明情報の書き込み -------
            var dbfFieldDescView = new DataView(dbfBuffer, 32, FIELD_DESC_LENGTH);
            var FILED_NAME = "MESH_CD";
            //フィールド名称は 32ずつ
            //文字をセットしてく
            for (var i = 0; i < FILED_NAME.length; i++) {
                dbfFieldDescView.setInt8(i, FILED_NAME.charCodeAt(i));
            }
            // カラム名は10が最大
            //11に型情報 C=67 はString
            dbfFieldDescView.setInt8(11, 67);
            //フィールド長
            dbfFieldDescView.setInt8(16, FIELD_LENGTH);
            //フィールドの説明の終端 13=改行コード
            dbfFieldDescView.setInt8(FIELD_DESC_LENGTH - 1, 13);
            //----------- フィールド説明情報の書き込み ここまで -------
            //以下レコード情報の書き込み
            var dbfDataView = new DataView(dbfBuffer, 32 + FIELD_DESC_LENGTH, dataLength);
            mesh.map(function (value, index) {
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
        }; //end method
        /**
         * 作成するメッシュの最大範囲を計算
         */
        shpFile.prototype._calcMeshExtent = function () {
            var mesh = this._mesh;
            var meshLenght = this._meshLength;
            // 5点の頂点の対角
            /*  1 2
             *  0 3
             * 0地点に4が地点
             */
            var xmin = mesh[0].geometry[0][0];
            var ymin = mesh[0].geometry[0][1];
            var xmax = mesh[meshLenght - 1].geometry[2][0];
            var ymax = mesh[meshLenght - 1].geometry[2][1];
            this.fullExtent = { xmin: xmin, ymin: ymin, xmax: xmax, ymax: ymax };
        }; //end method
        return shpFile;
    }()); //end class
    jisX0410.shpFile = shpFile;
})(jisX0410 || (jisX0410 = {})); //end method
var jisX0410;
(function (jisX0410) {
    /** メッシュ作成用ワーカ */
    var meshWorker = /** @class */ (function () {
        /**
         * コンストラクタ
         * @param url Worker.jsのURL
         */
        function meshWorker(url) {
            /** コールバック処理の辞書 */
            this._callbacks = {};
            var worker = new Worker(url);
            //メッセージイベントをセット
            worker.addEventListener('message', this._onMessage.bind(this), false);
            this._woker = worker;
        } //end method
        /**
         * ワーカの処理実行
         * @param msg 処理命令
         * @param callback 処理完了時の実行
         */
        meshWorker.prototype.postMessage = function (msg, callback) {
            msg._system = Date.now();
            this._callbacks[msg._system] = callback;
            //this._woker.postMessage( JSON.stringify(msg) );
            this._woker.postMessage(msg);
        }; //end method
        /**
         * ワーカからのメッセージ返却時
         * @param event イベント
         */
        meshWorker.prototype._onMessage = function (event) {
            var result = event.data;
            var callback = this._callbacks[result._system];
            delete this._callbacks[result._system];
            callback(result);
        }; //end method
        return meshWorker;
    }()); //end class
    jisX0410.meshWorker = meshWorker;
})(jisX0410 || (jisX0410 = {})); //end namespace
//ブラウザ上でなければWebWorkerとして動作する準備をする
if (typeof addEventListener !== 'undefined') {
    addEventListener('message', function (event) {
        //event.data
        //let message = <jisX0410.IMessage> JSON.parse(event.data);
        var message = event.data;
        var meshUtil = new jisX0410.meshUtil();
        var schema;
        var maxSchema;
        //シリアル化のため既定のスキーマ以外は現状受け取り不可
        for (var i = 0; i < meshUtil.meshSchemes.length; i++) {
            if (message.schemaLable === meshUtil.meshSchemes[i].label) {
                schema = meshUtil.meshSchemes[i];
            } //end if
            if (message.maxSchemaLabel &&
                message.maxSchemaLabel === meshUtil.meshSchemes[i].label) {
                maxSchema = meshUtil.meshSchemes[i];
            }
        } //end loop
        if (message.operation === "point") {
            var latlon = message.shape;
            switch (message.format) {
                case "GeoJSON":
                    var geofeatures = meshUtil.createGeoJSON(latlon, schema, maxSchema);
                    var geobuffer = meshUtil.geoJsonToStringBuffer(geofeatures);
                    message.features = geobuffer;
                    postMessage(message, [geobuffer]);
                    //postMessage( JSON.stringify(message) );
                    break;
                case "esriJSON":
                    var esrifeatures = meshUtil.createEsriJSON(latlon, schema, maxSchema);
                    var esribuffer = meshUtil.esriJsonToStringBuffer(esrifeatures);
                    message.features = esribuffer;
                    postMessage(message, [esribuffer]);
                    //postMessage( JSON.stringify(message) );
                    break;
                case "shapefile":
                    var shp = meshUtil.createShp(latlon, schema, maxSchema);
                    message.prj = shp.prj;
                    message.shp = shp.shp;
                    message.shx = shp.shx;
                    message.dbf = shp.dbf;
                    postMessage(message, [shp.shp, shp.shx, shp.dbf]);
                    //postMessage(JSON.stringify(message), [shp.shp,shp.shx,shp.dbf]);
                    break;
            } //end switch 
        }
        else if (message.operation === "extent") {
            var extent = message.shape;
            switch (message.format) {
                case "GeoJSON":
                    var geofeatures = meshUtil.createGeoJsonFromExtent(extent, schema);
                    var geobuffer = meshUtil.geoJsonToStringBuffer(geofeatures);
                    message.features = geobuffer;
                    postMessage(message, [geobuffer]);
                    //postMessage( JSON.stringify(message) );
                    break;
                case "esriJSON":
                    var esrifeatures = meshUtil.createEsriJsonFromExtent(extent, schema);
                    var esribuffer = meshUtil.esriJsonToStringBuffer(esrifeatures);
                    message.features = esribuffer;
                    postMessage(message, [esribuffer]);
                    //postMessage( JSON.stringify(message) );
                    break;
                case "shapefile":
                    var shp = meshUtil.createShpFromExtent(extent, schema);
                    message.prj = shp.prj;
                    message.shp = shp.shp;
                    message.shx = shp.shx;
                    message.dbf = shp.dbf;
                    postMessage(message, [shp.shp, shp.shx, shp.dbf]);
                    //postMessage( JSON.stringify(message), [shp.shp,shp.shx,shp.dbf]);
                    break;
            } //end switch 
        } //end if
        //postMessage("");    
    }, false);
}
/*
 * サーバ/クライアント切り替え定義
 * 多少イレギュラーだが module.exportsでサーバ側でも読み込み可能にしておく。
 * クライアントでの使用がメインの想定なのでモジュール定義はせずおく
 */
var jisX0410;
/*
 * サーバ/クライアント切り替え定義
 * 多少イレギュラーだが module.exportsでサーバ側でも読み込み可能にしておく。
 * クライアントでの使用がメインの想定なのでモジュール定義はせずおく
 */
(function (jisX0410) {
    //if (typeof window === 'undefined'){
    //if ((<any>global).window !== global) {
    if (typeof module !== 'undefined') {
        module.exports = jisX0410;
    } //end if
})(jisX0410 || (jisX0410 = {})); //end namespace
//# sourceMappingURL=index.js.map