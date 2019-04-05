# Сodeblocks prettifier

There are the following scripts in this repository:

- [beautify-js-code.js](#how-to-beautify-js) - Formats all codeblocks in dita files.
- code-analizer.js - Validates js-examples.

Both of these scripts can be used only in console. The `npm` package installer required.

Note: Only codeblocks with russian comments are supported. If examples in codeblocks have comments in english, the correct work of this module is not guaranteed.

# Example

The following examples demonstrate how the scripts work. For clarity, just one codeblock is shown in each example (not entire dita file).

**beautify-js-code.js**

Input:

```
<codeblock code-lang="javascript" xml:space="preserve">
// Добавление геообъекта на карту.var object = new ymaps.Placemark([34, 56]);myMap.geoObjects.add(object);
</codeblock>
```

Output:

```
<codeblock code-lang="javascript" xml:space="preserve">
<codeblock code-lang="javascript" xml:space="preserve">
// Добавление геообъекта на карту.
var object = new ymaps.Placemark([34, 56]);
myMap.geoObjects.add(object);
</codeblock>
```

To see more examples, you can use the folder `examples/`. It contains dita files that were broken after translation ([Maps API reference](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/Balloon-docpage/)).

**code-analizer.js**

Input:

```
// Добавление геообъекта на карту в цикле.
for (var i in objects) {
   myMap.geoObjects.add(objects[i]);
```

Output:

As output the script creates one file that contains non-valid example. In example above the square bracket is missing.

```
Check file - "File-name.js"
```

# Usage

Firstly, install required library using npm. Execute the following command in console (you must be in this project folder):

``` bash
$ npm install
```

## beautify-js-code.js {#how-to-beautify-js}

In console:

```
$ node beautify-js-code.js 'path-to-dita-files' 'path-to-out' ['justCheck']
```

- 'path-to-dita-files' — Path to the directory that contains dita files with broken codebloks.
- 'path-to-out' — Path to the output directory. where dita files with formatted codeblocks will

Example:

```
node beautify-js-code.js 'examples/broken-codeblocks/' 'examples/fixed-codeblocks/'
```