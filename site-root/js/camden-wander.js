var hls = null;
var audio = document.getElementById('player');
var playPauseBtn = document.getElementById('play-pause-btn');
var playPauseBtnSvgText = document.getElementById('player-text');
var timeline = document.getElementById('timeline');
var timelinePlayed = document.getElementById('timeline-played');

var PLAY_ICON = '\u25B6';   // ▶
var PAUSE_ICON = '\u23F8';  // ⏸
var INFO_ICON = 'i';
var CLOSE_ICON = '\u00D7';  // ×

var currentTrackData = null;
var tracks = null;

// Web Audio API for bass frequency analysis
var audioContext = null;
var analyser = null;
var dataArray = null;
var audioSource = null;

function initAudioAnalysis() {
  if (audioContext) return;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  audioSource = audioContext.createMediaElementSource(audio);
  audioSource.connect(analyser);
  analyser.connect(audioContext.destination);

  dataArray = new Uint8Array(analyser.frequencyBinCount);
}

// Export audio state for WebGL animation
window.camdenAudio = {
  isPlaying: function() {
    return audio && !audio.paused;
  },
  getBassIntensity: function() {
    if (!analyser || audio.paused) return 0;

    analyser.getByteFrequencyData(dataArray);
    var sum = 0;
    for (var i = 4; i <= 6; i++) {
      sum += dataArray[i];
    }
    return (sum / 3) / 255;
  }
};

function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  var mins = Math.floor(seconds / 60);
  var secs = Math.floor(seconds % 60);
  return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function measureSvgTextWidth(text, selector) {
  var tempAnchor = document.createElement('a');
  tempAnchor.className = selector.replace('.', '');
  tempAnchor.style.visibility = 'hidden';
  tempAnchor.style.position = 'absolute';

  var tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  var tempText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  tempText.textContent = text;

  tempSvg.appendChild(tempText);
  tempAnchor.appendChild(tempSvg);
  document.body.appendChild(tempAnchor);

  var computedStyle = window.getComputedStyle(tempText);
  var fontSize = computedStyle.fontSize;
  var fontFamily = computedStyle.fontFamily;
  var fontWeight = computedStyle.fontWeight;

  document.body.removeChild(tempAnchor);

  var canvas = new OffscreenCanvas(1, 1);
  var ctx = canvas.getContext('2d');
  ctx.font = fontWeight + ' ' + fontSize + ' ' + fontFamily;
  var metrics = ctx.measureText(text);
  return metrics.width;
}

function createInfoPanel(trackData) {
  var panel = document.createElement('div');
  panel.className = 'info-panel';
  panel.style.display = 'none';

  var content = '';
  if (trackData.info.date_recorded) content += 'Date: ' + trackData.info.date_recorded + '\n';
  if (trackData.info.venue) content += 'Venue: ' + trackData.info.venue + '\n';
  if (trackData.info.duration) content += 'Duration: ' + trackData.info.duration + '\n';
  if (trackData.info.style) content += 'Style: ' + trackData.info.style;

  var infoText = measureSvgTextWidth(content.split('\n')[0], '.info-panel-text');
  var panelWidth = infoText + 200;

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', panelWidth);
  svg.setAttribute('height', '100');

  var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', '20,100 80,0 ' + panelWidth + ',0 ' + (panelWidth - 80) + ',100');
  polygon.setAttribute('class', 'info-panel-bg');

  var closeBtn = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  closeBtn.setAttribute('x', panelWidth - 20);
  closeBtn.setAttribute('y', 20);
  closeBtn.setAttribute('class', 'info-panel-close');
  closeBtn.textContent = CLOSE_ICON;
  closeBtn.style.cursor = 'pointer';

  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    panel.style.display = 'none';
  });

  svg.appendChild(polygon);

  var lines = content.split('\n');
  lines.forEach(function(line, idx) {
    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '84');
    text.setAttribute('y', 30 + (idx * 18));
    text.setAttribute('class', 'info-panel-text');
    text.textContent = line;
    svg.appendChild(text);
  });

  svg.appendChild(closeBtn);
  panel.appendChild(svg);

  return panel;
}

function buildTrackItem(trackData, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var trackWrapper = document.createElement('div');
  trackWrapper.className = 'track-wrapper';

  var anchor = document.createElement('a');
  anchor.className = 'track-item';
  anchor.setAttribute('data-src', trackData.hls_path);
  anchor.setAttribute('data-id', trackData.id);

  var titleText = trackData.title;
  var svgTextWidth = measureSvgTextWidth(titleText, '.track-item-text');
  var iconWidth = 60;
  var svgTrapezoidWidth = svgTextWidth + iconWidth + 168;

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', svgTrapezoidWidth);
  svg.setAttribute('height', 30);

  var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', '20,30 80,0 ' + svgTrapezoidWidth + ',0 ' + (svgTrapezoidWidth - 80) + ',30');
  polygon.setAttribute('class', 'track-item-bg');

  var infoIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  infoIcon.setAttribute('x', '84');
  infoIcon.setAttribute('y', '20');
  infoIcon.setAttribute('class', 'track-info-icon');
  infoIcon.textContent = INFO_ICON;

  var playIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  playIcon.setAttribute('x', '110');
  playIcon.setAttribute('y', '20');
  playIcon.setAttribute('class', 'track-play-icon');
  playIcon.textContent = PLAY_ICON;

  var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', 84 + iconWidth);
  text.setAttribute('y', '20');
  text.setAttribute('class', 'track-item-text');
  text.setAttribute('text-anchor', 'start');
  text.textContent = titleText;

  svg.appendChild(polygon);
  svg.appendChild(infoIcon);
  svg.appendChild(playIcon);
  svg.appendChild(text);
  anchor.appendChild(svg);

  var infoPanel = createInfoPanel(trackData);

  infoIcon.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    infoPanel.style.display = infoPanel.style.display === 'none' ? 'block' : 'none';
  });

  playIcon.addEventListener('click', function(e) {
    e.preventDefault();
    handleTrackClick(trackData, anchor, playIcon);
  });

  trackWrapper.appendChild(anchor);
  trackWrapper.appendChild(infoPanel);
  container.appendChild(trackWrapper);
}

function handleTrackClick(trackData, anchor, playIcon) {
  document.querySelectorAll('.track-active').forEach(function(el) {
    el.classList.remove('track-active');
  });

  document.querySelectorAll('.track-play-icon').forEach(function(icon) {
    icon.textContent = PLAY_ICON;
  });

  anchor.classList.add('track-active');
  playIcon.textContent = PAUSE_ICON;

  currentTrackData = trackData;
  var src = anchor.getAttribute('data-src');
  loadTrack(src);
}

function loadTrack(src) {
  if (hls) {
    hls.destroy();
  }
  hls = new Hls();
  hls.attachMedia(audio);
  hls.on(Hls.Events.MANIFEST_PARSED, function() {
    playPauseBtn.disabled = false;
    audio.play();
  });
  hls.on(Hls.Events.ERROR, function(event, data) {
    console.error('HLS error:', data.type, data.details, data.fatal ? '(fatal)' : '');
  });
  hls.loadSource(src);
}

playPauseBtn.addEventListener('click', function() {
  if (this.disabled) return;
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
});

audio.addEventListener('play', function() {
  initAudioAnalysis();
  playPauseBtnSvgText.textContent = PAUSE_ICON;
  playPauseBtn.classList.add('playing');

  var activeIcon = document.querySelector('.track-active .track-play-icon');
  if (activeIcon) activeIcon.textContent = PAUSE_ICON;
});

audio.addEventListener('pause', function() {
  playPauseBtnSvgText.textContent = PLAY_ICON;
  playPauseBtn.classList.remove('playing');

  var activeIcon = document.querySelector('.track-active .track-play-icon');
  if (activeIcon) activeIcon.textContent = PLAY_ICON;
});

audio.addEventListener('timeupdate', function() {
  if (audio.duration && !isNaN(audio.duration)) {
    var percent = (audio.currentTime / audio.duration) * 100;
    timelinePlayed.style.width = percent + '%';
    updateTimelineText();
  }
});

function updateTimelineText() {
  if (!currentTrackData || !audio.duration || isNaN(audio.duration)) {
    timelinePlayed.textContent = '';
    timeline.setAttribute('data-remaining', '');
    return;
  }

  var timeRemaining = audio.duration - audio.currentTime;
  var timePlayed = audio.currentTime;
  var trackTitle = currentTrackData.title;
  var percent = (audio.currentTime / audio.duration) * 100;

  var playedWidth = timeline.offsetWidth * (percent / 100);
  var unplayedWidth = timeline.offsetWidth - playedWidth;

  var playedText = formatTime(timePlayed);
  var remainingText = '-' + formatTime(timeRemaining);

  var titleInPlayed = percent >= 50;
  var showPlayed = playedWidth > 60;
  var showRemaining = unplayedWidth > 80;

  timelinePlayed.textContent = '';
  timeline.setAttribute('data-remaining', '');

  if (titleInPlayed) {
    if (showPlayed) {
      timelinePlayed.textContent = playedText + ' ' + trackTitle;
    }
    if (showRemaining) {
      timeline.setAttribute('data-remaining', remainingText);
    }
  } else {
    if (showPlayed) {
      timelinePlayed.textContent = playedText;
    }
    if (showRemaining) {
      timeline.setAttribute('data-remaining', trackTitle + ' ' + remainingText);
    }
  }
}

timeline.addEventListener('click', function(e) {
  if (!audio.duration || isNaN(audio.duration)) return;
  var rect = timeline.getBoundingClientRect();
  var clickX = e.clientX - rect.left;
  var percent = clickX / rect.width;
  audio.currentTime = percent * audio.duration;
});

audio.addEventListener('ended', function() {
  if (hls) {
    hls.destroy();
    hls = null;
  }
  document.querySelectorAll('.track-active').forEach(function(el) {
    el.classList.remove('track-active');
  });
  document.querySelectorAll('.track-play-icon').forEach(function(icon) {
    icon.textContent = PLAY_ICON;
  });
  playPauseBtnSvgText.textContent = PLAY_ICON;
  playPauseBtn.classList.remove('playing');
  playPauseBtn.disabled = true;
  timelinePlayed.style.width = '0%';
  currentTrackData = null;
});

// Load tracks from JSON and build track lists
fetch('tracks.json')
  .then(function(response) { return response.json(); })
  .then(function(data) {
    tracks = data;
    data.work_in_progress.forEach(function(track) {
      buildTrackItem(track, 'work-in-progress');
    });
    data.live_performances.forEach(function(track) {
      buildTrackItem(track, 'live-performances');
    });
  })
  .catch(function(error) {
    console.error('Error loading tracks:', error);
  });
