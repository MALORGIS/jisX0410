/// <reference path="BenchmarkController.ts" />

//性能測定ページのコード

let benchmarkApp = angular.module('App', ['ngTable']);

let mapAppCtrl = benchmarkApp.controller(
  'BenchmarkController', 
  ['$scope', 'NgTableParams', samples.BenchmarkController]
);
