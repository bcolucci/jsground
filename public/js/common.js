var delay = (function () {
  var mutex = null;
  return function (fn, delay) {
    clearTimeout(mutex);
    mutex = setTimeout(fn, delay);
  };
})();
