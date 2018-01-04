var samples;
(function (samples) {
    var BenchmarkController = (function () {
        function BenchmarkController($scope, NgTableParams) {
            this._countSchema = [];
            this._prc = [];
            this.wait = false;
            this.format = "shapefile";
            this.fromatList = [
                "GeoJSON", "esriJSON", "shapefile"
            ];
            this._scope = $scope;
            this._ngTableParams = NgTableParams;
            var worker = new jisX0410.meshWorker('./jisX0410/index.js');
            this._woker = worker;
            this._meshUtil = new jisX0410.meshUtil();
            this._setup();
        }
        BenchmarkController.prototype._setup = function () {
            this.wait = true;
            this._prc = [];
            this._countSchema = [];
            var util = this._meshUtil;
            var meshes = this._meshUtil.meshSchemes;
            for (var i = 0; i < meshes.length; i++) {
                var m = meshes[i];
                var count = util.calcMeshCount(m);
                this._countSchema.push({ count: count, schema: m });
                this._prc.push({ count: count, time: undefined, onetime: undefined });
            }
            this.tableParams = new this._ngTableParams({}, {
                dataset: this._prc,
                counts: []
            });
            this._countSchema.reverse();
            this._measure();
        };
        BenchmarkController.prototype._measure = function () {
            var _this = this;
            if (this._countSchema.length < 1) {
                this.wait = false;
                this._scope.$apply();
                return;
            }
            var latlon = [35, 135];
            var item = this._countSchema.pop();
            var start_ms = new Date().getTime();
            var worker = this._woker;
            worker.postMessage({
                operation: "point",
                format: this.format,
                shape: latlon,
                schemaLable: item.schema.label,
                maxSchemaLabel: undefined
            }, function (msg) {
                var elapsed_ms = new Date().getTime() - start_ms;
                var prc;
                if (msg.features) {
                    delete msg.features;
                }
                else {
                    var shp = msg;
                    delete shp.shp;
                    delete shp.shx;
                    delete shp.dbf;
                    delete shp.prj;
                }
                for (var i = 0; i < _this._prc.length; i++) {
                    var checkPrc = _this._prc[i];
                    if (item.count === checkPrc.count) {
                        prc = checkPrc;
                        break;
                    }
                }
                var elapsed = elapsed_ms;
                var unit = 'ミリ秒';
                if (1 < elapsed_ms / 1000 / 60) {
                    elapsed = (elapsed_ms / 1000 / 60);
                    elapsed = Math.round(elapsed * 100) / 100;
                    unit = '分';
                }
                else if (1 < elapsed_ms / 1000) {
                    elapsed = elapsed_ms / 1000;
                    elapsed = Math.round(elapsed * 100) / 100;
                    unit = '秒';
                }
                prc.time = elapsed + unit;
                prc.onetime = Math.round((elapsed_ms * 1000 / item.count) * 100) / 100 + "µs";
                _this._scope.$apply();
                _this._measure();
            });
        };
        return BenchmarkController;
    }());
    samples.BenchmarkController = BenchmarkController;
})(samples || (samples = {}));
var benchmarkApp = angular.module('App', ['ngTable']);
var mapAppCtrl = benchmarkApp.controller('BenchmarkController', ['$scope', 'NgTableParams', samples.BenchmarkController]);
//# sourceMappingURL=benchmark.js.map