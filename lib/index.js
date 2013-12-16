
var ms = require('ms');
var Emitter = require('events').EventEmitter;
var inherit = require('util').inherits;
var debug = require('debug')('table');


/**
 * Expose table.
 */

module.exports = Table;


/**
 * Create a new worksheet table.
 *
 * @param {Worksheet} worksheet
 */

function Table (worksheet) {
  if (!(this instanceof Table)) return new Table(worksheet);
  this.worksheet = worksheet;
  this.options = {
    idColumn: 1,
    headerRow: 1,
    refreshAfter: ms('5s'),
    flushAt: 10,
    flushAfter: ms('10s')
  };

  this.loaded = false; // we havent loaded a single time
  this.rows = {};
  this.columns = {};
  this.reset();
  this.refreshTimer();
  this.flushTimer();
  this.refresh();
}


/**
 * Inherit from `Emitter`.
 */

inherit(Table, Emitter);


/**
 * Reset the refresh timer.
 */

Table.prototype.refreshTimer = function () {
  if (this.refreshTimer) clearInterval(this.refreshTimer);
  var refresh = this.refresh.bind(this);
  this.refreshTimer = setInterval(refresh, this.options.refreshAfter);
  debug('set refresh timer for %d ms.', this.options.refreshAfter);
  return this;
};


/**
 * Reset the refresh timer.
 */

Table.prototype.flushTimer = function () {
  if (this.flushTimer) clearInterval(this.flushTimer);
  var flush = this.flush.bind(this);
  this.flushTimer = setInterval(flush, this.options.flushAfter);
  debug('set flush timer for %d ms.',  this.options.flushAfter);
  return this;
};

/**
 * Resets the batch updates.
 */
Table.prototype.reset = function () {
  this.batch = this.worksheet.update();
  this.updates = {};
};


/**
 * Refreshing the table from the Google Spreadsheet servers.
 * @param {Function} callback
 * @return {Table}
 */

Table.prototype.refresh = function (callback) {
  var query = this.worksheet.query();
  var row = null;
  var column = null;

  debug('refreshing ..');

  // get the columns
  for (var c = 0; c < this.worksheet.columnCount; c += 1) {
    row = this.options.headerRow;
    column = 1 + c;
    query.cell(row, column);
  }

  // get the rows
  for (var r = 0; r < this.worksheet.rowCount; r += 1) {
    row = 1 + r;
    column = this.options.idColumn;
    query.cell(row, column);
  }

  var self = this;
  query.get(function (err, cells) {

    if (err) {
      self.emit('error', err);
      if (callback) return callback(err);
    } else {

      var index = -1;
      var cell = null;

      for (var c = 0; c < self.worksheet.columnCount; c += 1) {
        cell = cells[++index];
        if (cell.value) self.columns[cell.value.toLowerCase()] = cell.column;
      }

      for (var r = 0; r < self.worksheet.rowCount; r += 1) {
        cell = cells[++index];
        if (cell.value) self.rows[cell.value] = cell.row;
      }

      self.loaded = true;
      self.emit('refresh');
      debug('refreshed');
      if (callback) callback();
    }
  });

  return this;
};


/**
 * Wait until the table is loaded the first time.
 *
 * @param {Function} callback
 */

Table.prototype.waitForLoad = function (callback) {
  if (this.loaded) return process.nextTick(callback);
  else this.once('refresh', callback);
};


/**
 * Set the id `column`.
 *
 * @param {Number} column
 * @return {Table}
 */

Table.prototype.idColumn = function (column) {
  this.options.idColumn = column;
  return this;
};


/**
 * Set the header `row`.
 *
 * @param {Number} row
 * @return {Table}
 */

Table.prototype.headerRow = function (row) {
  this.options.headerRow = row;
  return this;
};


/**
 * Set the `flushAt` value.
 *
 * @param {Number} flushAt
 * @return {Table}
 */

Table.prototype.flushAt = function (flushAt) {
  this.options.flushAt = flushAt;
  return this;
};


/**
 * Set the `flushAfter` value.
 *
 * @param {Number} flushAfter
 * @return {Table}
 */

Table.prototype.flushAfter = function (flushAfter) {
  this.options.flushAfter = flushAfter;
  return this;
};


/**
 * Set the `refreshAfter` value.
 *
 * @param {Number} refreshAfter
 * @return {Table}
 */

Table.prototype.refreshAfter = function (refreshAfter) {
  this.options.refreshAfter = refreshAfter;
  this.refreshTimer();
  return this;
};


/**
 * Get the row index for a given row id.
 *
 * @param {String} id
 * @return {Number}
 */
Table.prototype.row = function (id) {
  return this.rows[id];
};


/**
 * Get the column index for a given column key.
 *
 * @param {String} key
 * @return {Number}
 */
Table.prototype.column = function (key) {
  return this.columns[key.toLowerCase()];
};


/**
 * Adds a row to the spreadsheet.
 * @param {String} id
 * @returns {Table}
 */

Table.prototype.addRow = function (id) {
  var lastRow = Object.keys(this.rows).length + 1;
  this.rows[id] = lastRow;
  this.worksheet.rowCount = lastRow;
  this.batch.cell(lastRow, this.options.idColumn, id);
  debug('adding new id %s to row %d', id, lastRow);
  return this;
};


/**
 * Adds a column to the table.
 *
 * @param {String} key
 * @returns {Table}
 */

Table.prototype.addColumn = function (key) {
  var lastColumn = Object.keys(this.columns).length + 1;
  this.columns[key.toLowerCase()] = lastColumn;
  this.worksheet.columnCount = lastColumn;
  this.batch.cell(this.options.headerRow, lastColumn, key);
  debug('adding column %s to column %d', key, lastColumn);
  return this;
};


/**
 * Set the `attrs` values for in the row associated with `id.`
 *
 * @param {String} id
 * @param {Object} attrs
 * @param {Function} callback
 * @returns {Table}
 */

Table.prototype.set = function (id, attrs, callback) {
  var self = this;
  this.waitForLoad(function () {
    if (!self.row(id)) self.addRow(id);
    Object.keys(attrs).forEach(function (key) {
      if (!self.column(key)) self.addColumn(key);
      self.setValue(id, key, attrs[key]);
    });
    if (callback) callback();
  });
  return this;
};


/**
 * Sets the table value for the Google Spreadsheet table.
 *
 * @param {String} id
 * @param {String} key
 * @param {String} val
 * @returns {Table}
 */
Table.prototype.setValue = function (id, key, val) {
  var row = this.row(id);
  var column = this.column(key);
  if (!this.updates[row]) this.updates[row] = {};
  this.updates[row][column] = val;
  return this;
};


/**
 * Flushes the outstanding table changes to the Google Spreadsheet.
 *
 * @param {Function} callback
 * @return {Table}
 */

Table.prototype.flush = function (callback) {
  var self = this;
  debug('flushing ..');
  var batch = this.batch;
  var updates = this.updates;
  this.reset();
  Object.keys(updates).forEach(function (row) {
    var r = parseInt(row, 10);
    Object.keys(updates[row]).forEach(function (column) {
      var c = parseInt(column, 10);
      batch.cell(r, c, updates[row][column]);
    });
  });
  batch.send(function (err) {
    if (err) {
      self.emit('error', err);
    } else {
      self.emit('flush');
    }

    debug('flushed');

    if (callback) return callback(err);
  });
  return this;
};