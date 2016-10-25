const fs = require('fs');
/**
 * 写入到文件
 * @param fileName  文件名称
 * @param fileContent 文件内容
 * @param dataType 文件内容格式
 * @param writeType 写入方式
 */
function saveFile(fileName, fileContent, dataType, writeType) {
    var fileEnd = dataType === 'json' ? '.json' : '.txt';
    if (writeType === 'rewrite') {
        fs.writeFile(fileName + fileEnd, fileContent, 'utf-8', function (err) {
            if (err) {
                console.error('写入文件失败[', fileName, ']:', err);
            }
        })
    }
    else {
        fs.appendFile(fileName + fileEnd, fileContent, 'utf-8', function (err) {
            if (err) {
                console.error('写入文件失败[', fileName, ']:', err);
            }
        })
    }

}

exports.saveFile = saveFile

