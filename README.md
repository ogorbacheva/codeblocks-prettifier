# Сodeblocks Prettifier

There are the following scripts in this repository:

- **beautify-js-code.js** — Formats all the codeblocks in dita files.
- **code-analizer.js** - Validates the js-examples.

You can use these scripts only in console. **The [npm](https://nodejs.org/en/download/package-manager/) packager manager is required.**

Note: Only codeblocks with russian comments are supported. If the examples in codeblocks have english comments, the correct work of this module is not guaranteed.

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
// Добавление геообъекта на карту.
var object = new ymaps.Placemark([34, 56]);
myMap.geoObjects.add(object);
</codeblock>
```

To see more examples, you can use the folder `examples/`. It contains dita files that are broken after Matecat translation (files are taken from [Maps JSAPI reference](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/Balloon-docpage/)).

_Information about the `code-analizer.js` will be added later._

# Getting Started

At first, install the third-party libraries that are required for the scripts work. To do this, execute the following command in console (you must be in the current project folder):

``` bash
codeblocks-prettifier$ npm install
```

All the required libraries are specified in the 'package.json' file.

## Usage

**beautify-js-code.js**

In console (before starting the script, better to pray that it works correctly):

```
$ node beautify-js-code.js 'path-to-dir-with-broken-dita-files' 'path-to-out-dir'
```

- 'path-to-dir-with-broken-dita-files' — Path to the directory that contains dita files with broken codebloks.
- 'path-to-out-dir' — Path to the output directory. The dita files with fixed codeblocks will be replaced there.

Example:

```
node beautify-js-code.js 'examples/codeblocks_broken/' 'examples/codeblocks_fixed/'
```
