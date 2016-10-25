const superagent = require('superagent');
const superagentCharset = require('superagent-charset');
const iconvLite = require('iconv-lite'); // 是一个进行编码转换的模块（node 默认编码 utf-8）。需要 decode 的编码必须是 Buffer 类型。
const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const http = require('http');

const config = require('./config/entry.config.js');
const fileEdit = require('./common/file.edit.js');

// 写入路径
const text_dir = config.staticFileDir;
const img_dir = config.staticImagesDir;

superagentCharset(superagent);

/**
 * 获取股票基本信息主函数
 * @param stockId 股票ID
 */
function fetchStock(stockId) {
    var url = 'http://hq.sinajs.cn/list=sh' + stockId;
    console.info('爬取网址：', url);
    // superagent.get(url)
    //     .charset('gbk')
    //     .end(function (err, sres) {
    //         if (err) {
    //             console.error('获取股票信息失败：',err);
    //             return;
    //         }
    //         console.info('获取股票信息成功', sres);
    //         // var $ = cheerio.load(res.text);
    //         // var stock_info = $('pre').text();
    //         // console.info('信息如下:', stock_info);
    //     })

    http.get(url, (res) => {
        var html = '';
        var chunks = [];
        res.on('data', function (chunk) {
            html += chunk;
            chunks.push(chunk);
        });

        res.on('end', function () {
            // [使用 iconv-lite 解决编码问题](http://www.cnblogs.com/zichi/p/5157887.html)
            var decodeHtml = iconvLite.decode(Buffer.concat(chunks), 'gb2312');
            console.log('获取信息:', decodeHtml);
            saveStockMs(stockId, decodeHtml);
        })
    })
}

/**
 * 解析从网页爬取的股票信息然后存储到本地文件
 * @param stockId 股票 ID
 * @param html 爬取的股票信息
 * 格式为
 * var hq_str_sh601006="大秦铁路,6.970,6.930,6.850,6.970,6.810,6.830,6.840,39109131,268562569.000,149600,6.830,359828,6.820,987200,6.810,1358300,6.800,162400,6.790,10000,6.840,31900,6.850,89800,6.860,132300,6.870,284900,6.880,2016-10-25,14:24:59,00";
 */
function saveStockMs(stockId, html) {
    var reg = /="(.*)";/;
    var regMap = reg.exec(html);
    var stockMs = regMap[1].split(',');
    var map = ['股票名字', '今日开盘价', '昨日开盘价', '当前价格', '今日最高价', '今日最低价', '竞买价，即“买一”报价', '竞卖价，即“卖一”报价', '成交的股票数，由于股票交易以一百股为基本单位，所以在使用时，通常把该值除以一百', '成交金额，单位为“元”，为了一目了然，通常以“万元”为成交金额的单位，所以通常把该值除以一万', '“买一”申请4695股，即47手', '“买一”报价', '“买二”申请xx股', '“买二”报价', '“买三”申请xx股', '“买三”报价', '“买四”申请xx股', '“买四”报价', '“买五”申请xx股', '“买五”报价', '“卖一”申请xx股', '“卖一”报价','“卖二”申请xx股', '“卖二”报价','“卖三”申请xx股', '“卖三”报价','“卖四”申请xx股', '“卖四”报价','“卖五”申请xx股', '“卖五”报价', '日期', '时间'];

    var stockMapMs = {};
    stockMs.forEach(function(e, i) {
        if (i >= map.length) {
            stockMapMs['未知参数(索引：' + i + ')'] = e;
        } else {
            stockMapMs[map[i]] = e;
        }
    })
    console.info('正则解析完成');
    var fileName = text_dir + '/股票_' + stockMapMs['股票名字'] + '_' + stockId;
    fileEdit.saveFile(fileName, JSON.stringify(stockMapMs), 'json', 'rewrite');
}

/**
 * 爬取上证指数信息主函数
 * @param id 上证指数ID
 */
function fetchExponent(id) {
    var url = 'http://hq.sinajs.cn/list=s_sh';
    request({
        url: url + id,
        encoding: null
    }, function (err, sres, body) {
        var html = iconvLite.decode(body, 'gb2312');
        console.info('获取上证指数[', id, ']:', html);
        saveExponentMs(id, html);
    });
}
/**
 * 对爬取的上证指数数据进行解析和存储
 * @param id 上证指数ID
 * @param html 爬取的数据
 */
function saveExponentMs(id, html) {
    var reg = /="(.*)";/;
    var regMap = reg.exec(html);
    var exponentMs = regMap[1].split(',');
    var map = ['指数名称','当前点数','当前价格','涨跌率','成交量（手）','成交额（万元）'];
    var exponentMapMs = {};
    exponentMs.forEach(function (e, i) {
        if (i >= map.length) {
            exponentMapMs['未知参数(索引：' + i + ')'] = e;
        } else {
            exponentMapMs[map[i]] = e;
        }
    })
    var fileName = text_dir + '/上证指数_' + exponentMapMs['指数名称'] + '_' + id;
    fileEdit.saveFile(fileName, JSON.stringify(exponentMapMs), 'json', 'rewrite');
}


/**
 * 根据图片地址获取图片并存储到本地
 * @param url 图片url
 * @param title 图片名称
 */
function fetchSaveImg(url, title) {
    request.head(url, function (err, res, body) {
        if (err) {
            console.error('获取图片失败[', title, ']:', err);
            return;
        }
        console.info('获取图片成功', title);
    });
    request(url).pipe(fs.createWriteStream(img_dir + '/' + title));
}


function fetchStockLineImg(id, type) {
    var paramType = 'daily';
    switch(type) {
        case 'day':
            paramType = 'daily';
            break;
        case 'week':
            paramType = 'weekly';
            break;
        case 'month':
            paramType = 'monthly';
            break;
        case 'minute':
            paramType = 'min';
            break;
        default:
            paramType = 'daily';
    }

    var url = `http://image.sinajs.cn/newchart/${paramType}/n/sh${id}.gif`;
    console.info('获取走势图[', id, '][', type, ']:', url);
    var title = `${id}_${paramType}_走势图.gif`
    fetchSaveImg(url, title);
}

// 获取某只股票信息
fetchStock('601006');
// 获取上证指数信息
fetchExponent('000001');
// 获取分时K线图
fetchStockLineImg('000001', 'minute');
// 获取日K线图
fetchStockLineImg('000001', 'day');
// 获取周K线图
fetchStockLineImg('000001', 'week');
// 获取月K线图
fetchStockLineImg('000002', 'month');
