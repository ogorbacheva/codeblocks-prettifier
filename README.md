# codeblocks-prettifier

Note: Only codeblocks with russian comments are supported. If examples in codeblocks have comments in english, the correct work of this module is not guaranteed.

- beautify-js-code.js - Formats all codeblocks in dita files.
- code-analizer.js - Validates each js-example.

# Example

The following example demonstrates the `beautify-js-code.js` result. For clarity, just one codeblock is shown (not all dita file).

Input:

```
<codeblock code-lang="javascript" xml:space="preserve">
// Создание GeoQueryResult из массива геообъектов. var objects = [        new ymaps.Placemark([34, 56]),           ]ymaps.geoQuery(objects).addToMap(myMap);
</codeblock>
```
Output:

```
<codeblock code-lang="javascript" xml:space="preserve">
// Создание GeoQueryResult из массива геообъектов.
var objects = [
        new ymaps.Placemark([34, 56]),
        new ymaps.Rectangle([[34, 56], [36, 57]])
    ];
ymaps.geoQuery(objects).addToMap(myMap);
</codeblock>
```

# Usage

## beautify-js-code.js

In console:

```
node beautify-js-code.js 'path-to-dita-files' 'path-to-out' ['justCheck']
```

- 'path-to-dita-files' — Path to the directory that contains dita files with broken codebloks.
- 'path-to-out' — Path to the output directory. where dita files with formatted codeblocks will

Example:

```
node beautify-js-code.js 'examples/broken-codeblocks/' 'examples/fixed-codeblocks/'
```