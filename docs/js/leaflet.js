var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var samples;
(function (samples) {
    var GSILayerType;
    (function (GSILayerType) {
        GSILayerType["std"] = "std";
        GSILayerType["pale"] = "pale";
        GSILayerType["seamlessphoto"] = "seamlessphoto";
    })(GSILayerType = samples.GSILayerType || (samples.GSILayerType = {}));
    var GSILayer = (function (_super) {
        __extends(GSILayer, _super);
        function GSILayer(type) {
            var _this = this;
            var types = {
                std: { ext: 'png', min: 2, max: 18, discription: '標準地図' },
                pale: { ext: 'png', min: 2, max: 18, discription: '淡色地図' },
                seamlessphoto: { ext: 'jpg', min: 2, max: 18, discription: '写真' },
            };
            var layerType = types[type];
            var url = "https://cyberjapandata.gsi.go.jp/xyz/" + type + "/{z}/{x}/{y}." + layerType.ext;
            var options = {
                attribution: "<a href='http://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html' target='_blank'>国土地理院</a>",
                maxZoom: layerType.max,
                minZoom: layerType.min,
                bounds: [[20, 122], [46, 155]]
            };
            _this = _super.call(this, url, options) || this;
            return _this;
        }
        return GSILayer;
    }(L.TileLayer));
    samples.GSILayer = GSILayer;
})(samples || (samples = {}));
var samples;
(function (samples) {
    var MapPageController = (function () {
        function MapPageController($scope) {
            var _this = this;
            this._checkCount = true;
            this.wait = false;
            this.operation = "point";
            this.maxSchemaList = [];
            this.format = "GeoJSON";
            this.fromatList = [
                "GeoJSON", "esriJSON", "shapefile"
            ];
            this._scope = $scope;
            var worker = new jisX0410.MeshWorker('./jisX0410/index.js');
            this._worker = worker;
            this._meshUtil = new jisX0410.MeshUtil();
            this.schemaList = this._meshUtil.meshSchemes;
            this.selectedSchema = this._meshUtil.meshSchemes[4];
            this.onChangeSchema();
            var map = new L.Map('map', {
                zoomControl: false
            });
            L.control.zoom({
                position: 'topright'
            }).addTo(map);
            this._map = map;
            map.on('moveend', this._onMapMoveEnd.bind(this));
            (new samples.GSILayer(samples.GSILayerType.pale)).addTo(map);
            map.setView([35.0, 135], 5);
            var editableLayers = new L.FeatureGroup();
            map.addLayer(editableLayers);
            this._extentLayer = editableLayers;
            var options = {
                position: 'topright',
                draw: {
                    polyline: false,
                    polygon: false,
                    marker: false,
                    circle: false,
                    circlemarker: false,
                    rectangle: {
                        shapeOptions: {
                            clickable: false
                        }
                    }
                },
                edit: {
                    featureGroup: editableLayers,
                    edit: false,
                    remove: false
                }
            };
            L.drawLocal.draw.toolbar.buttons.rectangle = '範囲を地図上で指定';
            L.drawLocal.draw.handlers.rectangle.tooltip.start = 'ドラッグで範囲を指定.';
            L.drawLocal.draw.handlers.simpleshape.tooltip.end = 'マウスを離して描画終了.';
            var drawControl = new L.Control.Draw(options);
            this._draw = drawControl;
            map.on(L.Draw.Event.CREATED, function (e) {
                var type = e.layerType, layer = e.layer;
                editableLayers.clearLayers();
                editableLayers.addLayer(layer);
                _this._scope.$apply();
            });
            L.control.scale({ imperial: false }).addTo(map);
        }
        MapPageController.prototype.onChangeSchema = function () {
            this.maxSchemaList = [];
            this._setMaxSchema(this.selectedSchema.parent);
            if (0 < this.maxSchemaList.length)
                this.selectedMaxSchema = this.maxSchemaList[this.maxSchemaList.length - 1];
            this._onMapMoveEnd();
        };
        MapPageController.prototype.onChangeOperation = function () {
            if (this.operation === "extent") {
                this._draw.addTo(this._map);
                if (this._pointLayer)
                    this._pointLayer.remove();
                if (this._pointLblLayer)
                    this._pointLblLayer.remove();
                var layers = this._extentLayer.getLayers();
                if (!layers || layers.length < 1) {
                    var bounds = this._map.getBounds();
                    bounds = bounds.pad(-0.3);
                    this._extentLayer.addLayer(L.rectangle(bounds));
                }
            }
            else {
                this._draw.remove();
                this._extentLayer.clearLayers();
                this._onMapMoveEnd();
            }
        };
        MapPageController.prototype.calcMeshCount = function () {
            if (this.operation === "point") {
                return this._meshUtil.calcMeshCount(this.selectedSchema, this.selectedMaxSchema);
            }
            else if (this.operation === "extent") {
                var bounds = this._extentLayer.getBounds();
                var sw = bounds.getSouthWest();
                var ne = bounds.getNorthEast();
                var extent = { xmin: sw.lng, ymin: sw.lat, xmax: ne.lng, ymax: ne.lat };
                return this._meshUtil.calcMeshCountFromExtent(extent, this.selectedSchema);
            }
            return 0;
        };
        MapPageController.prototype.skipCheckCount = function () {
            this._checkCount = false;
            this.create();
        };
        MapPageController.prototype.splitCreate = function () {
            this.wait = true;
            var util = this._meshUtil;
            var bounds = this._extentLayer.getBounds();
            var sw = bounds.getSouthWest();
            var ne = bounds.getNorthEast();
            var createArea = { xmin: sw.lng, ymin: sw.lat, xmax: ne.lng, ymax: ne.lat };
            var data = util.createGeoJsonFromExtent(createArea, util.meshSchemes[0]);
            if (this._pointLayer)
                this._pointLayer.remove();
            var geoJson = L.geoJSON(data, {
                onEachFeature: function (feature, layer) {
                    layer.bindPopup(feature.properties.meshCode);
                }
            }).addTo(this._map);
            this._pointLayer = geoJson;
            var mesh1 = [3036, 3622, 3623, 3624, 3631, 3641, 3653, 3724, 3725, 3741, 3823, 3824, 3831, 3841, 3926, 3927, 3928, 3942, 4027, 4028, 4040, 4042, 4128, 4129, 4142, 4229, 4230, 4328, 4329, 4429, 4440, 4529, 4530, 4531, 4540, 4629, 4630, 4631, 4728, 4729, 4730, 4731, 4739, 4740, 4828, 4829, 4830, 4831, 4839, 4928, 4929, 4930, 4931, 4932, 4933, 4934, 4939, 5029, 5030, 5031, 5032, 5033, 5034, 5035, 5036, 5038, 5039, 5129, 5130, 5131, 5132, 5133, 5134, 5135, 5136, 5137, 5138, 5139, 5229, 5231, 5232, 5233, 5234, 5235, 5236, 5237, 5238, 5239, 5240, 5332, 5333, 5334, 5335, 5336, 5337, 5338, 5339, 5340, 5432, 5433, 5435, 5436, 5437, 5438, 5439, 5440, 5531, 5536, 5537, 5538, 5539, 5540, 5541, 5636, 5637, 5638, 5639, 5640, 5641, 5738, 5739, 5740, 5741, 5839, 5840, 5841, 5939, 5940, 5941, 5942, 6039, 6040, 6041, 6139, 6140, 6141, 6239, 6240, 6241, 6243, 6339, 6340, 6341, 6342, 6343, 6439, 6440, 6441, 6442, 6443, 6444, 6445, 6540, 6541, 6542, 6543, 6544, 6545, 6546, 6641, 6642, 6643, 6644, 6645, 6646, 6647, 6741, 6742, 6747, 6748, 6840, 6841, 6842, 6847, 6848];
            geoJson.eachLayer(function (layer) {
                var meshCd = parseInt(layer.getPopup().getContent());
                if (mesh1.indexOf(meshCd) < 0) {
                    geoJson.removeLayer(layer);
                    layer.remove();
                }
            });
            this._splitPrc();
        };
        MapPageController.prototype._splitPrc = function () {
            var _this = this;
            var layers = this._pointLayer.getLayers();
            if (!layers || layers.length < 1) {
                this._pointLayer.remove();
                this.wait = false;
                this._scope.$apply();
                return;
            }
            var layer = layers.pop();
            var meshCd = layer.getPopup().getContent();
            var center = layer.getBounds().getCenter();
            this._worker.postMessage({
                operation: "point",
                format: this.format,
                shape: [center.lat, center.lng],
                schemaLabel: this.selectedSchema.label,
                maxSchemaLabel: this.selectedMaxSchema ? this.selectedMaxSchema.label : undefined
            }, function (evt) {
                var dt = new Date();
                var year = dt.getFullYear();
                var month = dt.getMonth() + 1;
                var date = dt.getDate();
                var nameBase = "" + _this.format.toLowerCase() + year + ('00' + month).slice(-2) + ('00' + date).slice(-2) + "-" + meshCd;
                if (_this.format === "GeoJSON") {
                    var data = evt.features;
                    _this._download(data, 'geojson', nameBase);
                }
                else if (_this.format === "esriJSON") {
                    var data = evt.features;
                    _this._download(data, 'esrijson', nameBase);
                }
                else {
                    var data = evt;
                    _this._download(data.shp, "shp", nameBase);
                    _this._download(data.shx, "shx", nameBase);
                    _this._download(data.dbf, "dbf", nameBase);
                    _this._download(data.prj, "prj", nameBase);
                }
                _this._pointLayer.removeLayer(layer);
                layer.remove();
                _this._splitPrc();
            });
        };
        MapPageController.prototype.create = function () {
            var _this = this;
            if (this._checkCount && 2560000 < this.calcMeshCount()) {
                $('#MyModal').modal({});
                return;
            }
            this._checkCount = true;
            this.wait = true;
            var createArea;
            if (this.operation === "point") {
                var center = this._map.getCenter();
                createArea = [center.lat, center.lng];
            }
            else {
                var bounds = this._extentLayer.getBounds();
                var sw = bounds.getSouthWest();
                var ne = bounds.getNorthEast();
                createArea = { xmin: sw.lng, ymin: sw.lat, xmax: ne.lng, ymax: ne.lat };
            }
            this._worker.postMessage({
                operation: this.operation,
                format: this.format,
                shape: createArea,
                schemaLabel: this.selectedSchema.label,
                maxSchemaLabel: this.selectedMaxSchema ? this.selectedMaxSchema.label : undefined
            }, function (evt) {
                var dt = new Date();
                var year = dt.getFullYear();
                var month = dt.getMonth() + 1;
                var date = dt.getDate();
                var nameBase = "" + _this.format.toLowerCase() + year + ('00' + month).slice(-2) + ('00' + date).slice(-2);
                _this.wait = false;
                _this._scope.$apply();
                if (_this.format === "GeoJSON") {
                    var data = evt.features;
                    _this._download(data, 'geojson', nameBase);
                }
                else if (_this.format === "esriJSON") {
                    var data = evt.features;
                    _this._download(data, 'esrijson', nameBase);
                }
                else {
                    var data = evt;
                    _this._download(data.shp, "shp", nameBase);
                    _this._download(data.shx, "shx", nameBase);
                    _this._download(data.dbf, "dbf", nameBase);
                    _this._download(data.prj, "prj", nameBase);
                }
            });
        };
        MapPageController.prototype.canMoveMeshCode = function () {
            var meshCode = this.meshCodeText;
            if (meshCode && meshCode.trim().replace(/\s/g, "").length < 1) {
                return false;
            }
            return true;
        };
        MapPageController.prototype.moveMeshCode = function () {
            if (!this.canMoveMeshCode())
                return;
            var meshCode = this.meshCodeText;
            var sc = this._meshUtil.meshCode2Schema(meshCode);
            if (!sc)
                return;
            var info = sc.meshCode2MeshInfo(meshCode);
            var lon = info.lonMs + sc.widthMs / 2.0;
            var lat = info.latMs + sc.heightMs / 2.0;
            lon = lon / jisX0410.MeshSchema.MILLISECOND;
            lat = lat / jisX0410.MeshSchema.MILLISECOND;
            var map = this._map;
            map.setView([lat, lon], map.getZoom());
        };
        MapPageController.prototype._onMapMoveEnd = function () {
            if (this.operation !== "point" || !this._map)
                return;
            var center = this._map.getCenter();
            var latlon = [center.lat, center.lng];
            var util = this._meshUtil;
            var schema = this.selectedMaxSchema;
            if (!schema)
                schema = this.selectedSchema;
            var features = util.createGeoJSON(latlon, schema, schema);
            var data = {
                "type": "FeatureCollection",
                "features": features
            };
            if (this._pointLayer)
                this._pointLayer.remove();
            var geoJson = L.geoJSON(data, {
                onEachFeature: function (feature, layer) {
                    layer.bindPopup(feature.properties.meshCode);
                }
            }).addTo(this._map);
            this._pointLayer = geoJson;
            if (this._pointLblLayer)
                this._pointLblLayer.remove();
            var marker = new L.Marker(geoJson.getBounds().getCenter(), {
                icon: new L.DivIcon({
                    html: "<span style=\"text-align: center;\">" + features[0].properties.meshCode + "</span>"
                })
            });
            this._pointLblLayer = marker;
            marker.addTo(this._map);
        };
        MapPageController.prototype._setMaxSchema = function (schema) {
            if (schema)
                this.maxSchemaList.push(schema);
            if (schema && schema.parent)
                this._setMaxSchema(schema.parent);
        };
        MapPageController.prototype._download = function (data, ext, name) {
            var blobData;
            if (typeof data === 'string') {
                var cType = "text/plain";
                blobData = new Blob([data], { type: cType });
            }
            else {
                blobData = new Blob([data], { type: 'application/' + ext });
            }
            if (window.navigator.msSaveBlob) {
                window.navigator.msSaveBlob(blobData, name + ext);
            }
            else if (window.URL.createObjectURL) {
                var link_1 = document.createElement("a");
                window.document.body.appendChild(link_1);
                link_1.href = window.URL.createObjectURL(blobData);
                link_1.download = name + "." + ext;
                link_1.click();
                window.setTimeout(function () {
                    window.document.body.removeChild(link_1);
                }, 1000 * 60 * 5);
            }
            else {
                var reader_1 = new FileReader();
                reader_1.onload = function () {
                    var link = document.createElement("a");
                    window.document.body.appendChild(link);
                    link.href = reader_1.result;
                    link.download = name + "." + ext;
                    link.click();
                    window.setTimeout(function () {
                        window.document.body.removeChild(link);
                    }, 1000 * 60 * 5);
                };
                reader_1.readAsDataURL(blobData);
            }
        };
        return MapPageController;
    }());
    samples.MapPageController = MapPageController;
})(samples || (samples = {}));
var leafletApp = angular.module('App', []);
var mapAppCtrl = leafletApp.controller('MapPageController', ['$scope', samples.MapPageController]);
//# sourceMappingURL=leaflet.js.map