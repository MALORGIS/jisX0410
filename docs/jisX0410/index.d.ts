declare namespace jisX0410 {
    /** メッシュ情報定義 */
    interface IMeshInfo {
        /** メッシュコード */
        meshCode: string;
        /** 緯度 */
        lat: number;
        /** 経度 */
        lon: number;
    }
    /** メッシュ定義の管理クラス */
    class meshSchema {
        /** 緯度差 */
        widthDD: number;
        /** 経度差 */
        heightDD: number;
        /** 分割数 */
        splitCount: number;
        /** 親メッシュ定義 */
        parent: meshSchema;
        /** 説明用のラベル */
        label: string;
        /** メッシュコードの分割文字列 */
        splitString: string;
        /** メッシュコード取得関数 */
        getMeshCode: (latlon: [number, number]) => IMeshInfo;
        /**
         * コンストラクタ
         * @param parent  親メッシュ定義
         * @param splitCount 分割数
         */
        constructor(parent?: meshSchema, splitCount?: number);
        /**
         * 標準的なメッシュ定義の返却
         */
        static createStandardMesh(): Array<meshSchema>;
        /**
         * メッシュコード取得用の標準処理定義
         * @param thisObj メッシュスキーマ
         * @param latlon 緯度経度
         * @param getCoods メッシュコード取得処理
         * @returns メッシュ情報
         */
        private static _getCodeBase(thisObj, latlon, getCoods);
    }
}
declare namespace jisX0410 {
    /** 出力するGeoJsonの簡単な定義 */
    interface IGeoJsonFeature {
        type: string;
        geometry: {
            type: string;
            coordinates: Array<[number, number][]>;
        };
        properties: {
            meshCode: string;
        };
    }
    /** 出力するEsriJsonの簡単な定義 */
    interface IEsriJsonFeature {
        geometry: {
            rings: Array<[number, number][]>;
        };
        attributes: {
            meshCode: string;
        };
    }
    /**
     * メッシュ管理クラス
     */
    class meshUtil {
        /** メッシュ情報定義 */
        meshSchemes: Array<meshSchema>;
        /** 分割数 */
        private _divCount;
        /** コンストラクタ */
        constructor();
        /**
         *
         * @param extent
         * @param schema
         */
        calcMeshCountFromExtent(extent: IExtent, schema: meshSchema): number;
        /**
         * ４隅座標分 指定メッシュの作成
         * @param extent 4隅座標(矩形)
         * @param schema メッシュ構造
         * @returns GeoJsonFeature Array
         */
        createGeoJsonFromExtent(extent: IExtent, schema: meshSchema): Array<IGeoJsonFeature>;
        /**
         * ４隅座標分 指定メッシュの作成
         * @param extent 4隅座標(矩形)
         * @param schema メッシュ構造
         * @returns GeoJsonFeature Array
         */
        createEsriJsonFromExtent(extent: IExtent, schema: meshSchema): Array<IEsriJsonFeature>;
        /**
         * ４隅座標分 指定メッシュの作成
         * @param extent 4隅座標(矩形)
         * @param schema メッシュ構造
         * @returns GeoJsonFeature Array
         */
        createShpFromExtent(extent: IExtent, schema: meshSchema, shpOpt?: IShpCreateOption): shpFile;
        /**
         * メッシュ件数の計算
         * @param schema 作成するメッシュ構造
         * @param maxSchema 上位メッシュ構造
         * @returns 件数
         */
        calcMeshCount(schema: meshSchema, maxSchema?: meshSchema): number;
        /**
         * GeoJSON Feature配列の返却
         * @param latlon 作成地点(緯度経度)
         * @param schema メッシュ構造
         * @param maxSchema 作成上限メッシュ構造(省略可)
         * @returns GeoJSON Feature配列
         */
        createGeoJSON(latlon: [number, number], schema: meshSchema, maxSchema?: meshSchema): Array<IGeoJsonFeature>;
        /**
         * ESRI JSON定義の返却
         * @param latlon 作成地点(緯度経度)
         * @param schema メッシュ構造
         * @param maxSchema 作成上限メッシュ構造(省略可)
         * @returns ESRI JSON定義 配列
         */
        createEsriJSON(latlon: [number, number], schema: meshSchema, maxSchema?: meshSchema): Array<IEsriJsonFeature>;
        /**
         * shapefileの作成
         * @param latlon 作成地点(緯度経度)
         * @param schema メッシュ構造
         * @param maxSchema 作成上限メッシュ構造(省略可)
         * @param shpOpt 作成オプション
         * @returns shapefile
         */
        createShp(latlon: [number, number], schema: meshSchema, maxSchema?: meshSchema, shpOpt?: IShpCreateOption): shpFile;
        /**
         * GeoJSONフィーチャ配列を文字列バイナリ化
         * @param features GeoJSON Feature Array
         * @returns ArrayBuffer
         */
        geoJsonToStringBuffer(features: Array<IGeoJsonFeature>): ArrayBuffer;
        /**
         * esri JSON フィーチャ配列を文字列バイナリ化
         * @param features esri JSON Feature Array
         * @returns ArrayBuffer
         */
        esriJsonToStringBuffer(features: Array<IEsriJsonFeature>): ArrayBuffer;
        /**
         * GeoJSONないしesriJSONのフィーチャ配列を文字列バイナリ化
         * @param features フィーチャ配列
         * @param headerString ヘッダ文字列
         * @param footerString フッタ文字列
         * @returns 文字列バイナリ
         */
        private _jsonToArrayBuffer(features, headerString, footerString);
        /**
         * インデックスと分割数からメッシュ情報を取得する
         * @param schema 取得するメッシュの定義
         * @param rootsInfo 親スキーマ定義
         * @param index インデックス
         * @param divCount 分割数
         * @returns メッシュ情報
         */
        private _getMeshInfo(schema, rootsInfo, index, divCount);
        /**
         * 緯度経度からメッシュ情報の取得
         * @param latlon 緯度経度
         * @param schema メッシュ構造
         * @returns メッシュ情報
         */
        private _getMeshInfoFromBl(latlon, schema);
        /**
         * 根のメッシュスキーマを取得
         * @param schema メッシュスキーマ
         * @param maxSchema 親がこれならここまでとなる定義
         * @returns 指定した親スキーマ (無指定時は1次メッシュ)
         */
        private _getRootsMeshSchema(schema, maxSchema);
        /**
         * GeoJSON Featureの作成
         * @param mesh メッシュ情報
         * @returns GeoJsonFeature
         */
        private _toGeoJson(mesh);
        /**
         * EsriJSON Featureの作成
         * @param mesh メッシュ情報
         * @returns EsriJsonFeatureの作成
         */
        private _toEsriJson(mesh);
    }
}
declare namespace jisX0410 {
    /** 4隅座標の保持定義 */
    interface IExtent {
        xmin: number;
        ymin: number;
        xmax: number;
        ymax: number;
    }
    /** Shapeの作成オプション */
    interface IShpCreateOption {
        /** shpファイルを作成するか否か */
        shp: boolean;
        /** shxファイルを作成するか否か */
        shx: boolean;
        /** dbfファイルを作成するか否か */
        dbf: boolean;
        /** prjファイルを作成するか否か */
        prj: boolean;
    }
    /** shpの作成用メッシュ定義 */
    interface IShpMesh {
        geometry: Array<[number, number]>;
        meshCode: string;
    }
    /** メッシュ用 shapefile作成クラス */
    class shpFile {
        /**
         * shapefile生成前のサイズ計算
         * @param meshCount メッシュ件数
         * @returns shapefileのバイトサイズ
         */
        static calcShpFileBytes(meshCount: number): {
            shpLength: number;
            shxLenght: number;
            dbfLenght: number;
        };
        /** 作成するメッシュ定義の保持用 */
        private _mesh;
        /** 作成するメッシュの個数 */
        private _meshLength;
        /** ファイルの最大範囲 */
        fullExtent: IExtent;
        /** shpファイル */
        shp: ArrayBuffer;
        /** shxファイル */
        shx: ArrayBuffer;
        /** dbfファイル */
        dbf: ArrayBuffer;
        /** prjファイル(テキスト内容) */
        prj: string;
        /**
         * コンストラクタ
         * @param mesh 作成メッシュ定義
         * @param options 作成オプション
         */
        constructor(mesh: Array<IShpMesh>, options?: IShpCreateOption);
        /** SHPファイル生成処理 */
        private _createShpBuffer();
        /** shxインデックスファイル */
        private _createInx();
        /** DBFファイルの作成 */
        private _createDbf();
        /**
         * 作成するメッシュの最大範囲を計算
         */
        private _calcMeshExtent();
    }
}
declare namespace jisX0410 {
    interface IMessage {
        operation: "point" | "extent";
        format: "GeoJSON" | "esriJSON" | "shapefile";
        shape: [number, number] | IExtent;
        schemaLable: string;
        maxSchemaLabel: string;
    }
    interface IJSONResult {
        features: ArrayBuffer;
    }
    interface IShpResult {
        shp: ArrayBuffer;
        shx: ArrayBuffer;
        dbf: ArrayBuffer;
        prj: string;
    }
    /** メッシュ作成用ワーカ */
    class meshWorker {
        /** ワーカの保持 */
        private _woker;
        /** コールバック処理の辞書 */
        private _callbacks;
        /**
         * コンストラクタ
         * @param url Worker.jsのURL
         */
        constructor(url: string);
        /**
         * ワーカの処理実行
         * @param msg 処理命令
         * @param callback 処理完了時の実行
         */
        postMessage(msg: IMessage, callback: (msg: IJSONResult | IShpResult) => void): void;
        /**
         * ワーカからのメッセージ返却時
         * @param event イベント
         */
        private _onMessage(event);
    }
}
declare namespace jisX0410 {
}