/**
 * Created by ogorbacheva on 02.03.19.
 * Скрипт делает следующее:
 *  - проходит по всем файлам справочника (*.dita) и вытаскивает кодблоки с примерами;
 *  - в примерах отделяет комментарии от кода (сомнительно работающая процедура);
 *  - форматирует пример (натравляет на полученный пример prettyfier-библиотеку);
 *  - проверяет код примера на валидность (с помощью esprima.parse);
 *  - сохраняет обратно в dita-файл.
 *
 * Запуск: node beautify-js-code.js 'path-to-dita-files' path-to-output' ['justCheck']
 * Если передать 'justCheck', то скрипт только отформатированный 1 заданный файл. Перезаписывать
 * файлы справочника он не будет. Это нужно для тестов.
 *
 * Пример запуска: node beautify-js-code.js 'reference_broken/' 'reference_fixed/'
 */


var fs = require('fs');
var recursive = require('recursive-readdir');
var dir = process.argv[2];
var outputFixedFiles = process.argv[3];
//var outputFixedFiles = '/Users/ogorbacheva/Documents/my-scripts/reference_fixed/';
var toDo = process.argv[4];
var beautify = require('js-beautify').js;
var checkOutputTest = '/Users/ogorbacheva/Documents/my-scripts/broken-code.js';
var esprima = require('esprima');
// Конфиг для форматирования кода.
var config = {
    "indent_size": "4",
    "indent_char": " ",
    "max_preserve_newlines": 20,
    "preserve_newlines": true,
    "keep_array_indentation": true,
    "break_chained_methods": true,
    "indent_scripts": "keep",
    "brace_style": "end-expand, collapse",
    "space_before_conditional": true,
    "unescape_strings": true,
    "jslint_happy": true,
    "end_with_newline": false,
    "wrap_line_length": "80",
    "indent_inner_html": true,
    "comma_first": false,
    "e4x": false,
    "space_after_anon_function": true,
    "space_after_named_function": true
};

// Если тестовый режим, то обработаем только 1 файл и результат сохраним в тестовую папку.
if (toDo == 'justCheck') {
    var data = fs.readFileSync(dir, 'utf8');
    data = parseComments(data);
    // console.log(data);
    data = beautify(data, config);
    data = fixBreakLines(data);
    fs.writeFileSync(checkOutputTest, data, {
        encoding: 'utf8',
        need_to_add_n: 'w'
    });
} else {
    // Если не тест, то запускаем все этапы.
    doAll();
}


function doAll() {
    recursive(dir, function (err, files) {
        var file;
        var fileName;
        var data;
        var className;
        var fileNameReg = new RegExp(/\/([-~a-z_.]+?\.dita)/i);
        var classNameReg = new RegExp(/([-a-z_.0-9~]+?)\.dita/i);

        if (!err) {
            for (var i in files) {
                file = files[i];

                if (/\.dita/.test(file)) {
                    // console.log("Обработка файла: " + file);
                    var match = file.match(fileNameReg);
                    if ((match !== null) && (match !== undefined)) {
                        fileName = match[1];
                        //console.log(fileName);
                        className = fileName.match(classNameReg)[1];
                        //console.log(className);
                        data = editCodeBlock(file, fileName, className);
                        writeToFile(outputFixedFiles + fileName, data);
                    }
                }
            }
        }
    });
}

function editCodeBlock(file, fileName, className) {
    //console.log("Обработка файла: " + fileName);
    var data;
    var codeblockExample = new RegExp(/(<b>[Примеры:]*[<>\/a-z\s"'=0-9.]+?<codeblock[-"=:'a-z0-9\s]+?>)([—–\p{L}\p{C}\p{S}\p{Z}\p{N}\p{P}\p{M}=$^&~`\\\/]+?)<\/codeblock>/, 'iug');

    data = fs.readFileSync(file, 'utf8');
    data = data.replace(codeblockExample, function (str, gr1, gr2, offset) {
        var new_codeblock;

        gr2 = prettify(gr2, fileName);

        new_codeblock = gr1 + gr2 + "</codeblock>";
        // console.log(className, offset);
        writeToFile('/Users/ogorbacheva/Documents/my-scripts/reference_codeblocks/' + className + "_" + offset + ".js", gr2);

        return new_codeblock;
    });

    // console.log("Число обработанных кодблоков: " + codeblockCount);
    return data;
}

function prettify(codeblock, fileName) {
    // console.log(codeblock);
    codeblock = parseComments(codeblock);
    codeblock = fixBreakLines(codeblock);
    codeblock = beautify(codeblock, config);

    // Повторно обработаем код, так как beautify добавляет лишние пробелы (например, в &lt;).
    codeblock = fixBreakLines(codeblock);

    return codeblock;
}

// Функция разбивает однострочные комментарии по строчкам.
function parseComments(data) {
    var needToResolve = []; // Сюда будем складывать те примеры, в которых непонятно как бить комментарии.
    var commentsCount = 0;

    var POINTS = '-*-';
    var twoPOINTS = '-**-';
    var threePOINTS = '-***-';
    var gt = 'GT';
    var lt = 'LT';
    var amp = 'AMP'

    //var codeSegment = new RegExp(/^[-#\sa-z0-9().~&\[\]\\:'"\{\},_!?]+[-\[\]_()&\{\};=+<>*'"~:]+[-?!#,\/a-z0-9\[\]()&\{\};=+<>\\*\s\t'"~:a-z;.№_\p{S}]*(['"][\s]*[а-яё]*[\sа-яё:;.,0-9]*|)[-?!#,\/a-z0-9\[\]()&\{\};=+<>\\*\s\t'"~:.№_\p{S}]*?(\.|\n|$)/, 'iu');
    var codeSegment = new RegExp(/^[-#\sa-z0-9().~&\[\]\\:'"\{\},_!?]+?[-\[\]_()&\{\};=+<>*'"~:]+[-?!#,\/a-z0-9\[\]()&\{\};=+<>\\*\s\t'"~:a-z;._\p{S}\p{P}]*(['"][\s]*[-\sа-яёА-ЯЁ:;.,0-9№]*[а-яёА-ЯЁ]+[\sа-яё:;.,0-9№]*|)[-?!#,\/a-zа-яёА-Яё0-9\[\]()&\{\};=+<>\\*\s\t'"~:.№_\p{S}]*?(\.|\n|$)/iu);
    var startAsMethod = new RegExp(/^[a-z_]+\([-a-z0-9#\/\[\]_()&\{\};=+<>*\s'"~,:\\]+/, 'i');
    var startAsMethodButWithSpace = new RegExp(/^\s*[a-z_]+\([-a-z0-9#\/\[\]_()&\{\};=+<>*\s'"~,:\\]+/, 'i');
    var startAsDeclaration = new RegExp(/^\s*[0-9a-z_:]+\s[a-z='"\s(){}\[\]0-9,]+/, 'i');

    var englishWordWithPoint = new RegExp(/^[a-z]+[0-9a-z]*\.$/, 'i');
    var englishWordWithSpaceAndPoint = new RegExp(/^\s+[a-z]+[0-9a-z]*\.$/, 'i');
    var englishWordWithBreakLine = new RegExp(/^[a-z]+,?\n?$/, 'i');

    var startWithEnglishThenRussian = new RegExp(/^[\s\/]*[-a-z._()]+\s[а-яё]+[-–—()"',*!№#$%+|`~?«»:;\p{C}\p{N}\p{M}\p{Z}\p{L}]*?\.?(\.|\n|$)/, 'iu'); // тут есть длинное, среднее и маленькое тире.
    var startWithRussian = new RegExp(/^[\s\/]*[а-яёА-ЯЁ]+/i);
    var startWithSpaceAndPoint = new RegExp(/^\s+\./, 'i');
    var startWithQuote = new RegExp(/^\s?\\?['"]/);

    var rusEn = new RegExp(/([а-яё])(\s{2,}|)([a-z])/i);
    var partOfLink = new RegExp(/\/[-a-z\/.]+\.?($|\n|\.)/i);

    var endWithRussianWord = new RegExp(/^[-–\s\/'"(0-9*a-z<>\/,«»а-яё{}|\[\]]*[а-яёА-ЯЁ]+[-–—=+*'"(),:_;{}|«»0-9\p{M},а-яёА-ЯЁ*a-z\s<>.\/]*[а-яёА-ЯЁ]+[-0-9\s'"«»(,)*.:]*\s*\.?(\.|\n|$)/iu);
    // https://regex101.com/r/VMxCiP/2
    var endWithEnglishWord = new RegExp(/^[-–—{}|\/\p{C}\p{N}\p{M}\p{Z},;'"а-яёА-ЯЁa-z()<>#:«»\s0-9\[\]]+[а-яё]+[-–—\/\p{C}\p{N}\p{M}\p{Z},;|{}'"«»a-zа-яёА-ЯЁ()#:<>\/0-9]*[a-z]+[-\s'"«»<>\/a-z()*.,0-9]*\s*\.?(\.|\n|$)/iu);

    var endWithSlashAndEnglishWord = new RegExp(/^\/\/\s?[a-z0-9.]*[a-z]+[a-z0-9.]*\.?(\.|\n|$)/, 'iu');
    var notEndOfSentence = new RegExp(/[a-zа-яё]+[-–—()"',*!№#$%+«»|`~?:;\p{C}\p{N}\p{L}\p{M}\p{Z}]*?\s\.?(\.|\n|$)/, 'iu');
    var endWithBracket = new RegExp(/[-a-zа-я0-9,\s]+\).$/i);
    var endWithEqual = new RegExp(/[-a-zа-я0-9]\s?[=<>]\s?[0-9]+[0-9.,)]*?$/i);
    var endWithEqualWord = new RegExp(/[а-я]+[-'"«»,A-Za-zа-яё0-9\s]+=\s?['"«»]?[a-z]+[a-z0-9.,)]*?\.?($|\.|\n)/, 'iu');
    var endWithColonWord = new RegExp(/[а-яА-ЯЁ]+[-'",A-Za-zа-яё0-9\s]+:\s?[a-z]+[a-z0-9.,)]*?\.?($|\.|\n)/, 'iu');
    var endWithQuote = new RegExp(/['"«][-–—\/a-zа-яё0-9,]+[-–—\/a-zа-яё0-9,\s]*?\.?($|\n|\.)/i);

    var justRussianSegment = new RegExp(/^\/\/\s*[а-яё\s,]*[а-яё]+[а-яё\s,]*[а-яё]\.$/ui);
    // К англ. более жесткие правила.
    var justEnglishSegment = new RegExp(/^\/\/\s*[A-Z][A-Za-z\s,]*[A-Za-z]+\s[A-Za-z\s,]*[A-Za-z]\.$/u); // обязательно с пробелами, так как есть отдельная регулярка на слово с точкой.


    var comparison = new RegExp(/[a-zа-яё]+\s?[LTG]+\s?[0-9]+./ui);

    var englishThenBracketThenRussian = new RegExp(/[a-z]\(['"][а-я]/ui);

    var emptySegment = new RegExp(/^\s*\n?$/);
    var numberWithSpacesSegment = new RegExp(/^[\/\s]+[0-9]+[.,0-9\s]*$/);
    var justNumberSegment = new RegExp(/^[0-9]+[.,0-9]*$/);

    var newLineWords = new RegExp(/^(ymaps|map|myMap|myGeoObjects)/);
    var notNewLineWords = new RegExp(/^(events|geoObjects|options|properties|state)\./);

    var pointsSegment = new RegExp(/^\s?\/\/\s*-\*\*\*-\s*\.?$/);
    var pointsAndSpaceSegment = new RegExp(/^\s{2,}\.$/);


    //console.log(data);

    // Добавляем перенос строки перед каждым //. При этом, исключаем ссылки (//st.yandex.ru).
    data = data.replace(/([^\n])(\/\/[^a-z])/ig, function (match, gr1, gr2) {
        return gr1 + "\n" + gr2;
    });

    // console.log(data);
    data = data.replace(/&gt;/igu, gt);
    data = data.replace(/&lt;/igu, lt);
    data = data.replace(/&amp;/igu, amp);

    // Разбиваем весь файл на отдельные //-блоки и обрабатываем их отдельно. https://regex101.com/r/3JDLjh/1
    data = data.replace(/\/\/[\s]?[\s\p{C}\p{S}\p{M}\p{Z}\p{N}\p{P}\p{L}<>+$=№~]+?([\n\r]|$)/igu, function (match) {
        var result_block = [],
            result,
            comment_segments = [];

       // Препроцессинг:
        // 1. Убираем троеточия.
        // 1.
        // 3. Убираем две точки подряд. Например: (placemark1, ..)
        // 4. Временно убираем в комментариях точки в кавычках ('image.png').
        // 5. Заменяет точки в скобках на плейсхолдер (чтобы не разбивать сегмент).
        // 6. Заменяем : и ; в таких случаях: "// Открываем балун в центре карты:balloon.open()".
        // 7. В ссылках, которые стоят в комментариях, заменяем все точки на плейсхолдеры.
        // 8-10. Заменяем заискейпленные симполы &gt; lt;
        // Заменяем все точки в <xref ..> на плейсхолдеры.
        // Заменяем все точки между числами. Например: 56.34
        match = match.replace(/[^\/]\s\.\.\.\s/igu, threePOINTS);
        match = match.replace(/\/\/\s?\.\.\.\s?/igu, "// " + threePOINTS + "\n");
        match = match.replace(/\.\./igu, twoPOINTS);
        match = match.replace(/\([а-яё0-9\s'".,:;]*[a-яё]+[а-яё0-9\s'".,:;]*?\)/igu, function (str) {
            str = str.replace(/\./g, POINTS);
            return str;
        });
        match = match.replace(/(['"][a-z0-9/_\-]+?)\.([a-z0-9/_\-]+?['"])/, '$1' + POINTS + '$2');
        match = match.replace(/([а-яё]+)(;|:)(\s?[_a-z()])/ig, '$1.$3');
        match = match.replace(/(https?)?:?\/\/[a-z\/._\-0-9%]+(\s|$|\.)/gi, function (str) {
            str = str.replace(/\./g, POINTS);
            return str;
        });
        match = match.replace(/<xref[-\sa-z:.#0-9"'=_]+>[<keyword>]*[-\sa-z.]+<\/[\/a-z"'\s]+>/igu, function (str) {
            str = str.replace(/\./g, POINTS);
            return str;
        });
        match = match.replace(/([0-9])\.([0-9])/igu, '$1' + POINTS + '$2');


  //
        comment_segments = match.split('.');

        for (var i in comment_segments) {
            if (i != comment_segments.length - 1) {
                // Добавляем в конец каждого сегмента точку (которая исчезла после сплита).
                comment_segments[i] = comment_segments[i] + '.';
                //console.log(comment_segments[i])
            }
        }


        // console.log("Сегмент: ");
       // console.log(comment_segments);

        for (var k = 0; k < comment_segments.length; k++) {
            if ((comment_segments[k] != "") && (comment_segments[k] != "\n")) {
                //console.log(comment_segments[k]);
                // =========== Текущий сегмент - это полностью русский текст. ===========
                if (justRussianSegment.test(comment_segments[k])) {
                   // console.log("````` " + comment_segments[k]);
                    if ( (startWithRussian.test(comment_segments[k + 1])) || (startWithEnglishThenRussian.test(comment_segments[k + 1])) ) {
                        result_block.push(comment_segments[k] + "\n//");
                    }
                    else if (codeSegment.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k] + "\n");
                    }
                    // Если следующий сегмент начинается с любого символа, кроме пробела.
                    else if (/^[^\s]/.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k] + "\n");
                    }

                    else if (englishWordWithPoint.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k] + "\n");
                    }

                    else if (startWithSpaceAndPoint.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k] + "\n");
                    }
                    else if (englishWordWithSpaceAndPoint.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k] + "\n");
                    }
                    else if (endWithEqualWord.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k] + "\n//");
                    }
                    else if (startWithQuote.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k] + "\n//");
                    }

                    else if ((comment_segments[k + 1] === undefined) || (emptySegment.test(comment_segments[k + 1]))) {
                        // console.log("!= " + comment_segments[k]);
                        result_block.push(comment_segments[k] + "\n");
                    }
                    else {
                        console.log("Здесь мы не поняли: "+ comment_segments[k]);
                        result_block.push(comment_segments[k]);
                    }
                }
                // =========== Текущий сегмент заканчивается русским текстом (но могут встречаться и англ. буквы в предложении). ===========
                // При этом не должно встречаться таких конструкций: geocode("Москва").
                else if ((endWithRussianWord.test(comment_segments[k])) && !(englishThenBracketThenRussian.test(comment_segments[k]))) {
                    //console.log("RUS " + comment_segments[k]);
                    // Если текущий сегмент заканчивается русским словом и после него больше нет сегментов.
                    // Пример: Создание карты.
                    //         И далее идет следующий комментарий.
                    if ((comment_segments[k + 1] === undefined) || (emptySegment.test(comment_segments[k + 1]))) {
                        // console.log("!= " + comment_segments[k]);
                        result_block.push(comment_segments[k] + "\n");
                    }
                    // Если следующий сегмент начинается с русского символа.
                    // Примеры: Создание карты. Пусть карта будет в отдельном окне
                    //          Создание карты Map. Пусть карта будет в отдельном окне
                    else if (startWithRussian.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k]);
                    }
                    // Если текущий сегмент заканчивается русским словом, а следующий начинается с английского слова,
                    // за которым идет русский текст.
                    // Пример: Создание карты. Map - это базовый класс.
                    else if (startWithEnglishThenRussian.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k]);
                    }
                    // Если текущий сегмент заканчивается русским словом, а следующий - это код.
                    // Пример: Создание карты.var map;
                    else if (codeSegment.test(comment_segments[k + 1])) {
                        //console.log("+++++++++ " + (comment_segments[k]));
                        // Если код начинается с кавычек.
                        if (startWithQuote.test(comment_segments[k + 1])) {
                            //console.log("88888888888 " + (comment_segments[k]));
                            result_block.push(comment_segments[k]);
                        }
                        // =============Текущий сегмент - не конец предложения. ===========
                        else if (notEndOfSentence.test(comment_segments[k])) {
                            //    console.log(":-O " + comment_segments[k]);
                            result_block.push(comment_segments[k]);
                        }

                        else {
                            //console.log("!!!" + comment_segments[k + 1]);
                            result_block.push(comment_segments[k] + "\n");
                        }
                    }
                    // Если текущий сегмент заканчивается русским словом, а следующий сегмент начинается с английского слова с точкой.
                    // Пример: Создание карты.ymaps.map...
                    // Пример: Создание карты. ymaps.map...
                    else if ((englishWordWithSpaceAndPoint.test(comment_segments[k + 1])) || (englishWordWithPoint.test(comment_segments[k + 1]))) {
                        result_block.push(comment_segments[k] + "\n");
                    }

                    // Если начинается с русского текста.
                    else if (startWithRussian.test(comment_segments[k])) {
                        result_block.push(comment_segments[k] + "\n");
                    }
                    else if (pointsAndSpaceSegment.test(comment_segments[k + 1])) {
                        // console.log(comment_segments[k])
                        result_block.push(comment_segments[k] + "\n");
                    }
                    else {
                        console.log("\nНепонятно что это такое: " + comment_segments[k])
                        result_block.push(comment_segments[k]);
                    }
                }


                // ==================================================================
                // Если текущий сегмент - целиком англ. текст.
                else if (justEnglishSegment.test(comment_segments[k])) {
                    console.log("Внимание! Тут нужно проверить #$% " + comment_segments[k]);
                    result_block.push(comment_segments[k] + "\n");
                }


                // ==================================================================
                // Если текущий сегмент начинется с // и англ. слова
                else if (endWithSlashAndEnglishWord.test(comment_segments[k])) {
                   // console.log(":::::::::::: " + comment_segments[k]);
                    result_block.push(comment_segments[k]);
                }

                // ============ Текущий сегмент заканчивается английским словом
                // (но имеется в сегменте русский текст).
                // Если встречаются идущие подряд пробелы, полагаем, что это код.===========
                else if ((endWithEnglishWord.test(comment_segments[k])) && !(/\s{2,}/.test(comment_segments[k])) &&
                    !(englishThenBracketThenRussian.test(comment_segments[k]))) {
                    //console.log("!!!------" + comment_segments[k]);
                    // Если текущий сегмент заканчивается английским словом и после него больше нет сегментов.
                    // Пример: Создание карты Map.
                    //         // И далее идет следующий комментарий.
                    if ((comment_segments[k + 1] === undefined) || (emptySegment.test(comment_segments[k + 1]))) {
                        //console.log("@@@@@" + comment_segments[k]);
                        result_block.push(comment_segments[k] + "\n");
                    }
                    else if (rusEn.test(comment_segments[k])) {
                        comment_segments[k] = comment_segments[k].replace(rusEn, '$1.\n$2$3');
                        result_block.push(comment_segments[k]);
                    }

                    // Если следующий сегмент - часть ссылки.
                    else if (partOfLink.test(comment_segments[k + 1])) {
                       // console.log("BUU " + comment_segments[k]);
                        result_block.push(comment_segments[k]);
                    }
                    // Если текущий сегмент заканчивается скобкой с точкой (предполагаем, что это пояснение).
                    // При этом следующий сегмент не должен начинаться с русского текста.
                    else if (endWithBracket.test(comment_segments[k]) && (!startWithRussian.test(comment_segments[k + 1]))) {
                        //console.log("%%% " + comment_segments[k]);
                        result_block.push(comment_segments[k] + "\n");
                    }
                    // Если текущий сегмент заканчивается скобкой с точкой (предполагаем, что это пояснение).
                    // При этом следующий сегмент должен начинаться с русского текста.
                    else if (endWithBracket.test(comment_segments[k]) && (startWithRussian.test(comment_segments[k + 1]))) {
                       //  console.log("AAAAA" + comment_segments[k]);
                        result_block.push(comment_segments[k]);
                    }
                    // Если текущий сегмент заканчивается английским словом, а следующий начинается с русского слова.
                    // Пример: Создание карты Map. Это базовый класс.
                    else if (startWithRussian.test(comment_segments[k + 1])) {
                        //console.log("BUU " + comment_segments[k]);
                        result_block.push(comment_segments[k]);
                    }
                    // Если текущий сегмент заканчивается английским словом, а следующий начинается с английского слова, но затем идут
                    // русские слова.
                    // Пример: Создание карты Map. Map - это базовый класс.
                    else if (startWithEnglishThenRussian.test(comment_segments[k + 1])) {
                       //  console.log("BUU " + comment_segments[k]);
                        result_block.push(comment_segments[k]);
                    }

                    // Если текущий сегмент заканчивается английским словом, а следующий - это код.
                    // Пример: Создание карты Map.var map;
                    else if (codeSegment.test(comment_segments[k + 1])) {
                        //console.log("(((((((((((( " + comment_segments[k]);
                        // Если предыдущий сегмент - // и англ. слово.
                        if (endWithSlashAndEnglishWord.test(comment_segments[k - 1])) {
                           // console.log("§§§§§§§§§§§ " + comment_segments[k]);
                            if (startAsMethod.test(comment_segments[k + 1])) {
                                result_block.push(comment_segments[k]);
                            }
                            else if (startAsMethodButWithSpace.test(comment_segments[k + 1])) {
                                result_block.push(comment_segments[k] + "\n");
                            }
                            else if (startAsDeclaration.test(comment_segments[k + 1])) {
                                 //console.log("_-_-_-_-_ " + comment_segments[k]);
                                result_block.push(comment_segments[k] + "\n");
                            } else {
                                result_block.push(comment_segments[k]);
                            }
                        }
                        // Если следующий сегмент - это метод.
                        else if (startAsMethod.test(comment_segments[k + 1])) {
                            if ((comment_segments[k + 2] === undefined) || (emptySegment.test(comment_segments[k + 2])) ) {
                                console.log("Внимание, требуется проверка кода!" + comment_segments[k]);
                                result_block.push(comment_segments[k] + "\n");
                            } else {
                                //console.log(" +=+ " + comment_segments[k + 1]);
                                result_block.push(comment_segments[k]);
                            }
                        }

                        else if (startAsMethodButWithSpace.test(comment_segments[k + 1])) {
                            //console.log(" ?///// " + comment_segments[k + 1]);
                            result_block.push(comment_segments[k] + "\n");
                        }

                        else if (startAsDeclaration.test(comment_segments[k + 1])) {
                            // console.log(comment_segments[k]);
                            result_block.push(comment_segments[k] + "\n");
                        }
                        else if (startWithSpaceAndPoint.test(comment_segments[k + 1])) {
                            // console.log(comment_segments[k]);
                            result_block.push(comment_segments[k] + "\n");
                        }
                        // Если сегмент заканчивается кавычкой.
                        else if (/['"]\.$/.test(comment_segments[k])) {
                            result_block.push(comment_segments[k] + "\n");
                        }

                        else {
                            result_block.push(comment_segments[k]);
                        }
                    }

                    else if (englishWordWithSpaceAndPoint.test(comment_segments[k + 1])) {
                        //console.log("------- " + comment_segments[k]);
                        result_block.push(comment_segments[k] + "\n");
                    }

                    // Если текущий сегмент заканчивается английским словом, а следующий начинается с английского слова с точкой.
                    // Примеры: Создание карты Map.map.geoObjects...
                    // Примеры: Отображение списка ListBox.collection.Item.map.geoObjects...
                    else if (englishWordWithPoint.test(comment_segments[k + 1])) {
                       // console.log("+_+_ " + comment_segments[k]);

                        // Пробуем сделать проверку на зарезервированные слова.
                        // Если следующий сегмент начинается с зарезервированного слова, то разбиваем коммент.
                        if (newLineWords.test(comment_segments[k + 1])) {
                            //console.log("****** " + comment_segments[k]);
                            result_block.push(comment_segments[k] + "\n");
                        }
                        // Если следующий сегмент начинается со слова, которое предположительно не может начинаться с новой строки.
                        else if (notNewLineWords.test(comment_segments[k + 1])) {
                            result_block.push(comment_segments[k]);
                        }
                        // Если через 1 сегмент начинается со слова, которое предположительно должно начинаться с новой строки.
                        else if (!newLineWords.test(comment_segments[k + 1]) && (newLineWords.test(comment_segments[k + 2]))) {
                            // console.log(comment_segments[k]);
                            result_block.push(comment_segments[k]);
                        }

                        // Пример: // Выбрать кластеры с id GT 100.
                        else if (comparison.test(comment_segments[k])) {
                            //console.log("^^^^##### " + comment_segments[k]);
                            if (codeSegment.test(comment_segments[k + 1])) {
                               // console.log("****** " + comment_segments[k]);
                                result_block.push(comment_segments[k] + "\n");
                            }

                            else if (englishWordWithPoint.test(comment_segments[k + 1])) {
                                // console.log(comment_segments[k]);
                                result_block.push(comment_segments[k] + "\n");
                            }
                            else {
                                result_block.push(comment_segments[k]);
                            }

                        }
                        // Если через 1 сегмент начинается со слова, которое предположительно НЕ должно начинаться с новой строки.
                        else if (!newLineWords.test(comment_segments[k + 1]) && (notNewLineWords.test(comment_segments[k + 2]))) {
                            // console.log(comment_segments[k]);
                            result_block.push(comment_segments[k]);
                        }
                        // Если следующий сегмент -  английское слово с точкой и этот сегмент последний.
                        else if ((englishWordWithPoint.test(comment_segments[k + 1]) && ((comment_segments[k + 2] === undefined) || (emptySegment.test(comment_segments[k + 2]))))) {
                            result_block.push(comment_segments[k]);
                        }
                        // Если следующие сегменты -  английское слово с переносом строки (например, 'get\n').
                        else if ((englishWordWithBreakLine.test(comment_segments[k + 1]) || (englishWordWithBreakLine.test(comment_segments[k + 2])))) {
                            result_block.push(comment_segments[k]);
                        }

                        else if (englishWordWithPoint.test(comment_segments[k + 1]) || (codeSegment.test(comment_segments[k + 2]) && startAsDeclaration.test(comment_segments[k + 2]))) {
                            result_block.push(comment_segments[k]);
                        }
                        else if (englishWordWithPoint.test(comment_segments[k + 1]) || (codeSegment.test(comment_segments[k + 2]) && startAsMethod.test(comment_segments[k + 2]))) {
                            // console.log(comment_segments[k])
                            result_block.push(comment_segments[k] + "\n");
                        }
                        // Ну иначе разбиваем.
                        else {
                            // console.log(comment_segments[k])
                            result_block.push(comment_segments[k]);
                        }
                        needToResolve.push(match);
                    }
                    else if (pointsAndSpaceSegment.test(comment_segments[k + 1])) {
                        // console.log(comment_segments[k])
                        result_block.push(comment_segments[k] + "\n");
                    }

                    else {
                        console.log("И тут не смогли определить, что это " + comment_segments[k]);
                        result_block.push(comment_segments[k]);
                    }


                }

                // Пример: Для HTC Desire, Samsung Galaxy S II и других устройств с devicePixelRatio = map.
                // Пример: Для HTC Desire, Samsung Galaxy S II и других устройств с devicePixelRatio = map.properties
                else if (endWithEqualWord.test(comment_segments[k])) {
                    // console.log("$$$$$$$$$ "+ comment_segments[k]);
                    // Если след. сегмент - это слово с точкой.
                    if (englishWordWithPoint.test(comment_segments[k + 1])) {
                        if (newLineWords.test(comment_segments[k + 1])) {
                            result_block.push(comment_segments[k] + "\n");
                        }
                    }
                    // Если следующий сегмент начинается с англ. слова с точкой и которое предположительно не может начинаться с новой строки.
                    else if (notNewLineWords.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k]);
                    }
                    // Если это последний сегмент.
                    else if (emptySegment.test(comment_segments[k + 1])) {
                        // console.log(comment_segments[k])
                        result_block.push(comment_segments[k] + "\n");
                    }
                    else if (endWithQuote.test(comment_segments[k + 1])) {
                        // console.log("``````````  " + comment_segments[k]);
                        result_block.push(comment_segments[k]);
                    }
                    else {
                        console.log("Снова не удалось определить " + comment_segments[k]);
                        result_block.push(comment_segments[k]);
                    }
                }

                // Пример: Опция должна быть задана через CSS option: abuse.
                else if (endWithColonWord.test(comment_segments[k])) {
                    //console.log("|||||||||  " + comment_segments[k]);
                    // Если след. сегмент - это слово с точкой.
                    if (englishWordWithPoint.test(comment_segments[k + 1])) {
                        if (newLineWords.test(comment_segments[k + 1])) {
                            result_block.push(comment_segments[k] + "\n");
                        }
                    }
                    // Если следующий сегмент начинается с англ. слова с точкой и которое предположительно не может начинаться с новой строки.
                    else if (notNewLineWords.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k]);
                    }
                    // Если это последний сегмент.
                    else if (emptySegment.test(comment_segments[k + 1])) {
                        // console.log(comment_segments[k])
                        result_block.push(comment_segments[k] + "\n");
                    }
                    else if (endWithQuote.test(comment_segments[k + 1])) {
                        // console.log("``````````  " + comment_segments[k]);
                        result_block.push(comment_segments[k]);
                    }
                    else {
                        console.log("Снова не удалось определить " + comment_segments[k]);
                        result_block.push(comment_segments[k]);
                    }
                }

                // Если текущий сегмент - это англ. слово с точкой.
                // Например: ymaps.
                else if (englishWordWithPoint.test(comment_segments[k])) {
                    //console.log("~~~ " + comment_segments[k]);
                    // Если текущий сегмент - это слово с новой строки.
                    if (newLineWords.test(comment_segments[k])) {
                        result_block.push(comment_segments[k]);
                    }
                    // Если след. сегмент - это слово с новой строки.
                    else if (newLineWords.test(comment_segments[k + 1])) {
                        // console.log(comment_segments[k])
                        result_block.push(comment_segments[k] + "\n");
                    }
                    // Если это последний сегмент.
                    else if (emptySegment.test(comment_segments[k + 1])) {
                        // console.log(comment_segments[k])
                        result_block.push(comment_segments[k] + "\n");
                    }
                    // Если следующий сегмент начинается с англ. слова с точкой и которое предположительно не может начинаться с новой строки.
                    else if (notNewLineWords.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k]);
                    }
                    // Если след. сегмент - это англ. слово с точкой и перед ним пробелы.
                    else if (englishWordWithSpaceAndPoint.test(comment_segments[k + 1])) {
                        // console.log("^^^^^^ " + comment_segments[k]);
                        result_block.push(comment_segments[k] + "\n");
                    }
                    // Если текущий сегмент - это англ. слово с точкой, а следующий сегмент - это код;
                    else if (codeSegment.test(comment_segments[k + 1])) {
                        //console.log("***** " + comment_segments[k])
                        // Если след. сегмент - это код, а предыдущий закончился русским комментарием.
                        if (endWithRussianWord.test(comment_segments[k - 1])) {
                            result_block.push(comment_segments[k]);
                        }
                        // Если след. сегмент - это метод.
                        else if (startAsMethod.test(comment_segments[k + 1])) {
                            result_block.push(comment_segments[k]);
                        }

                        else if (startAsMethodButWithSpace.test(comment_segments[k + 1])) {
                            result_block.push(comment_segments[k] + "\n");
                        }
                        // Если след. сегмент - это код и предыдущий - тоже код.
                        else if (codeSegment.test(comment_segments[k - 1])) {
                            //console.log("!!!=== " + comment_segments[k]);
                            result_block.push(comment_segments[k]);
                        }
                        // Если след. сегмент - это код и объявление переменных.
                        else if (startAsDeclaration.test(comment_segments[k + 1])) {
                            // console.log("!!!=== " + comment_segments[k]);
                            result_block.push(comment_segments[k] + "\n");
                        }
                        else {
                            result_block.push(comment_segments[k]);
                        }
                    }
                    else {
                        result_block.push(comment_segments[k]);
                    }
                    // needToResolve.push(match);

                }


                // ============ Текущий сегмент - это многоточие. ===========
                else if (pointsSegment.test(comment_segments[k])) {
                    // console.log("...............  " + comment_segments[k]);
                    result_block.push(comment_segments[k] + "\n");
                }

                // ============ Текущий сегмент заканчивается кавычкой и текстом. ===========
                else if (endWithQuote.test(comment_segments[k])) {
                    // console.log("±±±±±±±±±  " + comment_segments[k]);
                    result_block.push(comment_segments[k]);
                }


                // ============= Текущий сегмент заканчивается равенством ( // Бла бла count = 3. =============
                else if (endWithEqual.test(comment_segments[k])) {
                     console.log("ЗА РАВЕНСТВО! " + comment_segments[k]);
                    // Если следующий сегмент начинается и заканчивается цифрой, подразумеваем, что это один сегмент.
                    if (justNumberSegment.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k]);
                    }

                    else if (/^[0-9]+\s[('"]?[а-яё]/iu) {

                    }

                    // Если след. сегмент - это русский комментарий или заканчивается русским текстом.
                    else if ( (justRussianSegment.test(comment_segments[k + 1])) || (endWithRussianWord.test(comment_segments[k + 1])) ) {
                        result_block.push(comment_segments[k]);
                    }
                    // Если следующий сегмент - это часть кода.
                    else if (codeSegment.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k] + "\n");
                    }
                    // Если следующий сегмент - это только англ. слово с точкой (без пробелов).
                    else if  (englishWordWithPoint.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k] + "\n");
                    }
                    else {
                        result_block.push(comment_segments[k]);
                    }
                }

                // ============ Текущий сегмент - это только число с пробелами. ===========
                else if (numberWithSpacesSegment.test(comment_segments[k])) {
                    // console.log("Number! " + comment_segments[k]);
                    if (numberWithSpacesSegment.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k]);
                    }

                    else if (codeSegment.test(comment_segments[k + 1])) {
                        result_block.push(comment_segments[k] + "\n");
                    } else {
                        //console.log("Number! " + comment_segments[k]);
                        result_block.push(comment_segments[k]);
                    }
                }

                // ============ Текущий сегмент - это только число (без пробелов). ===========
                else if (justNumberSegment.test(comment_segments[k])) {
                    //  console.log("Just number " + comment_segments[k]);
                    if (endWithEqual.test(comment_segments[k - 1])) {
                        // console.log("%%% " + comment_segments[k - 1]);
                        // Если следующий сегмент - это тоже цифра с точкой.
                        if (endWithEqual.test(comment_segments[k + 1])) {
                            //  console.log("_____ " + comment_segments[k + 1]);
                            result_block.push(comment_segments[k]);
                        } else if (codeSegment.test(comment_segments[k + 1])) {
                            //console.log("!!===!! " + comment_segments[k + 1]);
                            result_block.push(comment_segments[k]);
                        }
                        else {
                            // console.log("=!==== " + comment_segments[k + 1]);
                            result_block.push(comment_segments[k] + "\n");
                        }

                    } else if (codeSegment.test(comment_segments[k + 1])) {
                        if (codeSegment.test(comment_segments[k - 1])) {
                            //console.log("!!===!! " + comment_segments[k + 1]);
                            result_block.push(comment_segments[k]);
                        } else {
                            result_block.push(comment_segments[k]);
                        }
                    }

                    else {
                        result_block.push(comment_segments[k] + "\n");
                    }
                }

                // Если текущий сегмент - это англ. слово с точкой и перед ним пробелы.
                else if (englishWordWithSpaceAndPoint.test(comment_segments[k])) {
                    //console.log("______ word " + comment_segments[k]);
                    result_block.push(comment_segments[k]);
                }

                // =============Текущий сегмент - это код. ===========
                else if (codeSegment.test(comment_segments[k])) {
                  // console.log(">>>>>>> " + comment_segments[k]);
                    if ((comment_segments[k + 1] === undefined) || (emptySegment.test(comment_segments[k + 1]))) {
                        // console.log("!= " + comment_segments[k]);
                        result_block.push(comment_segments[k] + "\n");
                    } else {
                        result_block.push(comment_segments[k]);
                    }

                }

                // =============Текущий сегмент - часть ссылки.
                else if (partOfLink.test(comment_segments[k])) {
                    result_block.push(comment_segments[k]);
                }

                // Непонятно, что это.
                else {
                    // Последняя попытка разбить комментарий.
                    // Если это "нечто" начинается с //, а далее идет русский текст,
                    // то полагаем, что это единичный комментарий.
                    if (/^\/\/\s?[а-яё]+.*$/iu.test(comment_segments[k])) {
                        result_block.push(comment_segments[k] + "\n");
                    }
                    // Если это такого рода коммент: // #FFFF00.
                    else if (/^\/\/\s?[#A-Z0-9'"]+\s*\.?$/.test(comment_segments[k])) {
                       // console.log("////// " + comment_segments[k]);
                        if (codeSegment.test(comment_segments[k + 1])) {
                           if (startAsMethodButWithSpace.test(comment_segments[k + 1])) {
                              //  console.log("&&&&&& " + comment_segments[k]);
                               result_block.push(comment_segments[k] + "\n");
                           }
                           else if (startAsMethod.test(comment_segments[k + 1])) {
                                result_block.push(comment_segments[k]);
                           }
                           else if (startAsDeclaration.test(comment_segments[k + 1])) {
                               result_block.push(comment_segments[k] + "\n");
                           }
                           else {
                               result_block.push(comment_segments[k]);
                           }
                        } else {
                            result_block.push(comment_segments[k]);
                        }
                    }

                    // Пример: // });
                    else if (/\/\/\s*[\[{}\];\(\)]+\s*$/.test(comment_segments[k])) {
                        comment_segments[k] = comment_segments[k].replace(/\/\/(\s*[\[{}];\(\)]+\s*)$/, '$1');
                        result_block.push(comment_segments[k]);
                    }
                    else {
                       console.log("Это непонятно что: " + comment_segments[k]);
                        result_block.push(comment_segments[k]);
                    }
                }
            }
        }
        // console.log("Результат: ");
       //  console.log(result_block);

        result = result_block.join('');
        return result;

    });

    // console.log("Количество комментариев: " + commentsCount);
    // console.log(data);
    return data;
}

// Постпроцессинг кода.
// 1. Обратно меняем '// .' на  '// ...';
// 2. Удаляем лишние переносы строк.
// 3. Заменяет -*- на точку.
function fixBreakLines(data) {
   // console.log(data);
    data = data.replace(/\/\/\s?\.(\n?)/g, '// ...$1');
    data = data.replace(/\n\s*\n/g, function (str) {
        return '\n';
    });

    data = data.replace(/(\\n){2,}/g, function (str) {
        return '\n';
    });
    data = data.replace(/-\s?\*-/g, '.');
    //data = data.replace(/(\s{4,})/g, '\n');
    // data = data.replace(/;/g, ';\n');
    data = data.replace(/-\s?\*\s?\*\s?-/g, '..');
    data = data.replace(/-\s?\*\s?\*\s?\*\s?-/g, '...');

    data = data.replace(/GT/g, '&gt;');
    data = data.replace(/LT/g, '&lt;');
    data = data.replace(/&lt; =/g, '&lt;=');
    data = data.replace(/&gt; =/g, '&gt;=');
    data = data.replace(/AMP/g, '&amp;');

    data = data.replace(/&\sgt;/g, '&gt;');
    data = data.replace(/&\slt;/g, '&lt;');
    data = data.replace(/&\samp;/g, '&amp;');
    data = data.replace(/&amp;\s&amp;/g, '&amp;&amp;');

    data = data.replace(/&lt;\s(\/)?\s([a-z]+)\s?&gt;/ig, '&lt;$1$2&gt;');
    data = data.replace(/(["'])\s\/\s&gt;/g, '$1/&gt;');
    data = data.replace(/(["'])\n&gt;/g, '$1&gt;');
    data = data.replace(/src\s=[\s\n]+(["'])/g, 'src=$1');

    data = data.replace(/&lt;([-=a-z\s\/'";0-9\n]+?)[\r\n]?&gt;/ig,  function (str, gr1) {
        gr1 = gr1.replace(/([a-z"])\s-\s([a-z"])/gi, '$1-$2');
        gr1 = gr1.replace(/\n/g, ' ');
        gr1 = gr1.replace(/([a-z])\s=\s(["'][a-z])/gi, '$1=$2');
        return "&lt;" + gr1  + "&gt;";
    });
    // <div id=..>
    data = data.replace(/&lt;([a-z\s="'\n:;0-9]+?)([g&lt;]*)\/([a-z]+)&gt;/ig,  function (str, gr1, gr2, gr3) {

        gr1 = gr1.replace(/([a-z"])\s-\s([a-z"])/gi, '$1-$2');
        gr1 = gr1.replace(/\n/g, ' ');
        gr1 = gr1.replace(/([a-z])\s=\s(["'][a-z])/gi, '$1=$2');
        return "&lt;" + gr1  + gr2 + gr3 + "&gt;";
    });

    //data = data.replace(/(\/\/\s?[=\s\p{C}\p{N}\p{M}\p{Z}\p{L}\p{P}]*?)[\n\\n]{2,}/gi, '$1\n//');
    return data;
}

function writeToFile(where, data) {
    //console.log(where);
    fs.writeFileSync(where, data, {
        encoding: 'utf8',
        flag: 'w'
    });
}



