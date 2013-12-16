
var assert = require('assert');
var spreadsheets = require('google-spreadsheets');
var Table = require('..');


describe('google-spreadsheets-table', function () {
  this.timeout(0);

  var username = 'node.sheets.test.100@gmail.com';
  var password = 'helloHELLO123';
  var key = '0ApywX_tWC_56dDRRMGlGc3JfLWRZaWtWYXFGckhua0E';

  function load (callback) {
    var self = this;
    spreadsheets()
      .login(username, password)
      .key(key)
      .open(function (err, spreadsheet) {
        if (err) return callback(err);
        if (!spreadsheet) return callback ('Couldnt find spreadsheet.');
        var worksheets = spreadsheet.worksheets;
        var worksheet = spreadsheet.select(worksheets[0].id);
        callback(null, worksheet);
      });
  }

  function get (worksheet, row, column, callback) {
    worksheet.query()
      .cell(row, column)
      .get(function (err, cells) {
        if (err) return callback(err);
        return callback(null, cells[0].value);
      });
  }

  function reset (worksheet, state, callback) {
    // reset the table
    var update = worksheet.update();
    for (var r = 0; r < state.length; r += 1) {
      for (var c = 0; c < state[r].length; c += 1) {
        update.cell(r+1, c+1, state[r][c]);
      }
    }
    update.send(callback);
  }

  before(function () {
    this.state =  [
      ['Id', 'Name', 'Email', null],
      ['a', 'Ilya Volodarsky', 'ilya@segment.io', null],
      ['b', 'Calvin French-Owen', 'calvin@segment.io', null],
      ['c', 'Peter Reinhardt', 'peter@segment.io', null],
      ['d', 'Ian Storm Taylor', 'ian@segment.io', null],
      [null, null, null, null],
      [null, null, null, null]
    ];
  });

  before(function (done) {
    var self = this;
    load(function (err, worksheet) {
      if (err) return done(err);
      reset(worksheet, self.state, function (err) {
        if (err) return done(err);
        load(function (err, worksheet) {
          if (err) return done(err);
          self.worksheet = worksheet;
          done();
        });
      });
    });
  });

  it('should be able to override existing values', function (done) {
    var self = this;
    var table = Table(this.worksheet);
    var name;
    for (var i = 0; i < 100; i += 1) {
      name = 'Ilya Volodarsky ' + i;
      table.set('a', { name: name });
    }

    table.waitForLoad(function () { // wait until spreadsheet loaded
       table.flush(function () { // so that sets take effect
         var row = table.row('a');
         var column = table.column('name');
         get(self.worksheet, row, column, function (err, value) {
           if (err) return done(err);
           assert(value === name);
           done();
         });
       });
     });
  });

  it('should be able to add columns', function (done) {
    var self = this;
    var table = Table(this.worksheet);
    table.set('a', { position : 1 });
    table.set('b', { position : 2 });
    table.set('c', { position : 3 });
    table.set('d', { position : 4 });
    table.waitForLoad(function () { // wait until spreadsheet loaded
      table.flush(function () { // so that sets take effect
        var row = table.row('d');
        var column = table.column('position');
        get(self.worksheet, row, column, function (err, value) {
          if (err) return done(err);
          assert(value === 4);
          done();
        });
      });
    });
  });

  it('should be able to add rows', function (done) {
    var self = this;
    var table = Table(this.worksheet);
    table.set('e', {
      id: 'e',
      name: 'Gordon Hearthrob',
      email: 'gordon@papyrushealth.com',
      position: 5
    });
    table.waitForLoad(function () { // wait until spreadsheet loaded
      table.flush(function () { // so that sets take effect
        var row = table.row('e');
        var column = table.column('name');
        get(self.worksheet, row, column, function (err, value) {
          if (err) return done(err);
          assert(value === 'Gordon Hearthrob');
          done();
        });
      });
    });
  });
});