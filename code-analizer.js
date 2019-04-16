/**
 * Created by ogorbacheva on 02.03.19.
 *
 * node beautify-js-code.js 'path-to-dir-with-js-files'
 *
 * Пример: node code-analizer.js 'reference_codeblocks/'
 */

var fs = require('fs'),
    recursive = require('recursive-readdir'),
    dir = process.argv[2],
    esprima = require('esprima'),
    brokenExampleFiles = '/Users/ogorbacheva/Documents/my-scripts/broken-code.json';
    broken_code = [];

var readFiles = function (dir, broken_code) {
    recursive(dir, function (err, files) {
        var file;
        var fileName;
        var data;
        if (!err) {
            for (var i in files) {
                file = files[i];
                if (/\.js/.test(file)) {
                    var match = file.match(/reference_codeblocks\/([-~a-z_.]+?_[\d]+\.js)/i);
                    if (match) {
                        fileName = match[1];
                    }
                    data = fs.readFileSync(file, 'utf8');
                    data = data.replace(/&gt;\s?(=?)/g, '>$1');
                    data = data.replace(/&lt;\s?(=?)/g, '<$1');
                    data = data.replace(/&amp;/g, '&');

                   // console.log("Файл: " + fileName);
                    // console.log(data);
                    try {
                        esprima.parse(data, {
                            jsx: true
                        });
                    } catch (e) {
                        broken_code.push({
                            "fileName": fileName
                        });
                        fs.writeFileSync(brokenExampleFiles, fileName.toString() + "\n", {
                            encoding: 'utf8',
                            flag: 'a+'
                        });
                    }
                }
            }
        }
    });
}

readFiles(dir, broken_code);
