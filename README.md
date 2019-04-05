# Сodeblocks prettifier

There are the following scripts in this repository:

- **beautify-js-code.js** — Formats all codeblocks in dita files.
- **code-analizer.js** - Validates js-examples.

Both of them can be used only in console. The `npm` package is required.

Note: Only codeblocks with russian comments are supported. If examples in codeblocks have comments in english, the correct work of this module is not guaranteed.

# How it works

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

Note: information about the `code-analizer.js` will be added later.

# Usage

At first, install required libraries using `npm`. Execute the following command in console (you must be in this project folder):

``` bash
$ npm install
```

## beautify-js-code.js

In console:

```
$ node beautify-js-code.js 'path-to-dita-files' 'path-to-out'
```

- 'path-to-dita-files' — Path to the directory that contains dita files with broken codebloks.
- 'path-to-out' — Path to the output directory. where dita files with formatted codeblocks will

Example:

```
node beautify-js-code.js 'examples/codeblocks_broken/' 'examples/codeblocks_fixed/'
```