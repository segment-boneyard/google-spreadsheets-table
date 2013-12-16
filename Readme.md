
# google-spreadsheets-table

  A cached Google Spreadsheets table over [segmentio/google-spreadsheets](/segmentio/google-spreadsheets).

## Install

    $ npm install segmentio/google-spreadsheets-table

## Example

### Initialize the Sheet

```js
var Table = require('google-spreadsheets-table');

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

### Full Example

```js
var spreadsheets = require('google-spreadsheets');
var Table = require('google-spreadsheets-table');

spreadsheets
  .login('username', 'password')
  .key('0AvP3ixW_RotVdHdnWDZvUHhnWWhHQy0xZFViN3hUSmc')
  .open(function (err, spreadsheet) {
    var worksheets = spreadsheet.worksheets;
    var worksheet = spreadsheet.select(worksheets[0].id);
    var table = Table(worksheet);
  });
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