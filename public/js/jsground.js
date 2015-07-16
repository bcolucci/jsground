var BlocManager = function (anchor, socket) {
  var self = this;

  this.anchor = anchor;
  this.blocIndex = 0;
  this.socket = socket;
  this.focusedBlocIndex = 0;
  this.blocIndex = 0;

  this.anchor.onclick = function (e) {
    if (e.toElement.id !== self.anchor.id) {
      return;
    }
    self.addBloc();
  };
  this.socket.on('blocsExecuted', function (results) {
    self.updatePreviews(results);
  });
};

BlocManager.prototype.addBloc = function () {
  var bloc = new Bloc(this);
  bloc.attach();
  bloc.textarea.focus();
  this.focusedBlocIndex = this.blocIndex;
  this.clearEmptyBlocs();
  this.blocIndex++;
};

BlocManager.prototype.clearEmptyBlocs = function () {
  var blocs = this.anchor.querySelectorAll(':scope > .bloc-container')
    , len = blocs.length
    , i = 0;
  for (i; i < len; i++) {
    if (this.focusedBlocIndex !== blocs[i].bloc.index && blocs[i].bloc.isEmpty()) {
      blocs[i].bloc.detach();
      this.blocIndex--;
    }
  }
};

BlocManager.prototype.logClassName = function (str) {
  var firstChar = str[0];
  if (firstChar === '\'') {
    return 'string';
  } else if (firstChar === '{') {
    return 'object';
  } else if (firstChar === '[') {
    return 'array';
  } else if (str === 'undefined') {
    return 'undefined';
  }
  return 'number';
};

BlocManager.prototype.updatePreviews = function (results) {
  var previews = this.anchor.querySelectorAll(':scope > .bloc-container .preview')
    , len = previews.length;
  for (var i = 0; i < len; i++) {
    var vars = results[i].vars
      , logs = results[i].logs;
    previews[i].firstChild.innerText = null;
    previews[i].lastChild.innerText = null;
    if (vars.diff) {
      var ul = document.createElement('ul');
      previews[i].firstChild.appendChild(ul);
      for (var j in vars.diff) {
        var li = document.createElement('li')
          , span = document.createElement('span'),
          value = vars.values[vars.diff[j]];
        li.innerText = vars.diff[j];
        li.appendChild(span);
        span.innerText = value;
        span.className = this.logClassName(value);
        ul.appendChild(li);
      }
    }
    if (logs.diff) {
      var ul = document.createElement('ul');
      previews[i].lastChild.appendChild(ul);
      for (var l in logs.diff) {
        var li = document.createElement('li'),
          value = logs.values[parseInt(logs.diff[l])];
        li.innerText = value;
        li.className = this.logClassName(value);
        ul.appendChild(li);
      }
    }
  }
};

// -------------------------------------

var Bloc = function (manager) {
  var self = this;

  this.manager = manager;
  this.index = this.manager.blocIndex;
  this.container = document.createElement('div');

  this.preview = document.createElement('div');
  this.previewVars = document.createElement('div');
  this.previewLogs = document.createElement('div');
  this.preview.appendChild(this.previewVars);
  this.preview.appendChild(this.previewLogs);

  this.textarea = document.createElement('textarea');
  this.textarea.rows = 1;

  this.container.appendChild(this.textarea);
  this.container.appendChild(this.preview);

  this.container.className = 'bloc-container bloc-' + this.index;
  this.preview.className = 'preview';

  this.container.onclick = function () {
    self.manager.focusedBlocIndex = self.index;
    self.manager.clearEmptyBlocs();
  };
  this.textarea.onkeydown = function (e) {
    if (e.keyCode === 13) { // new line
      e.target.rows++;
      return;
    }
    if (e.keyCode === 8) { // remove char
      var lines = self.textarea.value.split('\n')
        .filter(function (l) {
          return l.trim().length > 0;
        });
      self.textarea.value = lines.join('\n');
      e.target.rows = lines.length;
      return;
    }
    if (e.keyCode === 32) {
      return;
    }
    self.emitChange();
  };
  this.textarea.onkeyup = function () {
    self.emitChange();
  };
  this.textarea.onfocus = function () {
    self.container.className += ' active';
    self.emitChange();
  };
  this.textarea.onblur = function () {
    self.container.className = self.container.className.replace('active', '').trim();
    self.emitChange();
  };
};

Bloc.prototype.emitChange = function () {
  var self = this;
  delay(function () {
    var blocValue = self.textarea.value.trim();
    self.manager.socket.emit('blocChanged', self.index, blocValue);
  }, 400);
};

Bloc.prototype.attach = function () {
  this.container.bloc = this;
  this.manager.anchor.appendChild(this.container);
};

Bloc.prototype.detach = function () {
  this.manager.anchor.removeChild(this.container);
};

Bloc.prototype.isEmpty = function () {
  return this.textarea.value.trim().length === 0;
};
