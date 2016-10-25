const path = require('path');

var toExport = {};

// 爬虫根目录 spider.js 所在目录
toExport.spiderRootDir = path.resolve(__dirname, '../');

// 爬虫存储本地文件路径
toExport.staticDir = path.resolve(toExport.spiderRootDir, './data');

toExport.staticFileDir = path.resolve(toExport.staticDir, './text');

toExport.staticImagesDir = path.resolve(toExport.staticDir, './images');

// 配置文件根目录
toExport.configDir = path.resolve(toExport.spiderRootDir, './config');

module.exports = toExport;

