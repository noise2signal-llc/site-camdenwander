var bitmapBg = (function() {
  var canvas = document.getElementById('bitmap-bg');
  var ctx = canvas.getContext('2d');
  var img = new Image();
  var imgData = null;
  var originalData = null;
  var animationId = null;
  var startTime = null;

  var PERIOD = 20000;
  var MIN_VALUE = 0x00;
  var MAX_VALUE = 0x88;
  var AMPLITUDE = (MAX_VALUE - MIN_VALUE) / 2;
  var MIDPOINT = MIN_VALUE + AMPLITUDE;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      window.innerHeight
    );
  }

  function loadImage(src) {
    img.onload = function() {
      captureOriginalData();
      resizeCanvas();
      startAnimation();
    };
    img.src = src;
  }

  function captureOriginalData() {
    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    var tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0);
    originalData = tempCtx.getImageData(0, 0, img.width, img.height);
  }

  function getColorAtTime(t) {
    var phase = (t % PERIOD) / PERIOD * 2 * Math.PI;

    var r = Math.round(MIDPOINT + AMPLITUDE * Math.cos(phase));
    var g = Math.round(MIDPOINT + AMPLITUDE * Math.acos(Math.cos(phase)) / Math.PI * 2 - AMPLITUDE);
    var b = Math.round(MIDPOINT + AMPLITUDE * Math.sin(phase));

    r = Math.max(MIN_VALUE, Math.min(MAX_VALUE, r));
    g = Math.max(MIN_VALUE, Math.min(MAX_VALUE, g));
    b = Math.max(MIN_VALUE, Math.min(MAX_VALUE, b));

    return { r: r, g: g, b: b };
  }

  function applyColorToImageData(color) {
    var width = originalData.width;
    var height = originalData.height;
    var data = new Uint8ClampedArray(originalData.data);

    for (var i = 0; i < data.length; i += 4) {
      var alpha = data[i + 3];
      if (alpha > 0) {
        data[i] = color.r;
        data[i + 1] = color.g;
        data[i + 2] = color.b;
      }
    }

    return new ImageData(data, width, height);
  }

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    var elapsed = timestamp - startTime;

    var color = getColorAtTime(elapsed);
    var coloredData = applyColorToImageData(color);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var scale = 2;
    var drawWidth = originalData.width * scale;
    var drawHeight = originalData.height * scale;
    var x = (canvas.width - drawWidth) / 2;
    var y = (canvas.height - drawHeight) / 2;

    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalData.width;
    tempCanvas.height = originalData.height;
    var tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(coloredData, 0, 0);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, x, y, drawWidth, drawHeight);

    animationId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    startTime = null;
    animationId = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', function() {
    resizeCanvas();
  });

  return {
    init: function(src) {
      loadImage(src);
    }
  };
})();

bitmapBg.init('img/pathological-defensive-pessimism.gif');
