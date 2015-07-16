var util = require('util')
  , vm = require('vm')
  , _ = require('lodash');

var inspectInDepth = function (v) {
  return util.inspect(v, {depth: null});
};

var createSandbox = function () {
  var sandbox = {};
  sandbox.util = util;
  sandbox.console = {
    logs: []
  };
  sandbox.console.log = function () {
    for (var i in arguments)
      sandbox.console.logs.push(inspectInDepth(arguments[i]));
  };
  return sandbox;
};

var execInContext = function (script, context) {
  try {
    vm.runInContext(script, context);
  } catch (e) {
    //console.error('execError', script);
  }
};

var resultObj = function () {
  var rowProto = {values: null, diff: null};
  return {
    logs: _.clone(rowProto)
    , vars: _.clone(rowProto)
    , parseResult: null
  };
};

module.exports = function (jsparser) {

  this.blocs = [];
  this.jsparser = jsparser;

  this.execute = function (index) {

    var results = []
      , i = 0;
    for (i; i <= index; i++) {

      results[i] = resultObj();

      //try {
      //  results[i].parseResult = this.jsparser.parse(this.blocs[i]).elements;
      //} catch (e) {
      //  console.error('parseError', e);
      //  results[i].parseResult = [];
      //}
      //1console.log(inspectInDepth(results[i].parseResult));

      var j = 0
        , sandbox = createSandbox()
        , context = vm.createContext(sandbox);

      for (j; j < i; j++)
        execInContext(this.blocs[j], context);

      var previousSandbox = _.cloneDeep(sandbox);
      execInContext(this.blocs[i], context);

      results[i].vars.diff = _.difference(_.keys(sandbox), _.keys(previousSandbox));

      results[i].logs.values = sandbox.console.logs;
      results[i].logs.diff = _.difference(_.keys(sandbox.console.logs), _.keys(previousSandbox.console.logs));

      delete sandbox.console;

      for (var k in sandbox) {
        if (!sandbox.hasOwnProperty(k)) continue;
        sandbox[k] = inspectInDepth(sandbox[k]);
      }

      results[i].vars.values = sandbox;
    }

    return results;
  };
};
