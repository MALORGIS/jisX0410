/// <reference path="MapPageController.ts" />

//地図ページの処理
let leafletApp = angular.module('App', []);

let mapAppCtrl = leafletApp.controller(
  'MapPageController', 
  ['$scope', samples.MapPageController]
);
