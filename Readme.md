
# google-spreadsheets-table

  A cached Google Spreadsheets table.

## Install

    $ npm install segmentio/google-spreadsheets-table

## Example

### Initialize the Sheet

```js
var Table = require('google-spreadsheets');

var table = Table(worksheet)
  .headerRow(1)
  .idColumn(1)
  .flushAt(ms('10s'));
```

### Update a Cell

```js
table.set('steve1', { email: 'user@gmail.com'});
table.set('steve1' { name: 'Steve Johnson'});
```

### Flush Updates

```js
table.flush();
```

## API

### Table(worksheet)
  
  Create a cached Google Spreadsheet around a worksheet.

### .set(id, attrs, callback)

  Set the `attrs` on the spreadsheet row associated with `id`.

### .flush(callback)

  Flushes the update changes to the spreadsheet.

## License

```
WWWWWW||WWWWWW
 W W W||W W W
      ||
    ( OO )__________
     /  |           \
    /o o|    MIT     \
    \___/||_||__||_|| *
         || ||  || ||
        _||_|| _||_||
       (__|__|(__|__|
```