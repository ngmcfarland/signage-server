var currentContent = null;
var playlistContent = {};
var alreadyPlayed = [];
var contentRefresh = 1000;
var errorRetry = 10000;
var fadeTime = 2000;
var displayId = null;

function updateDisplay() {
  $.getJSON("/api/displays/" + displayId, function(data) {
    var display = data.item;
    if (display.active && display.showing != null && currentContent != display.showing.id) {
      console.log("Changing content to " + display.showing.type + ": " + display.showing.name);
      currentContent = display.showing.id;
      if (display.showing.type == "playlist") {
        playlistContent = display.showing;
        var firstTrack = 0;
        var randomTracks = false;
        if ('random' in display.showing && display.showing.random) {
          firstTrack = Math.floor(Math.random() * playlistContent.tracks.length);
          alreadyPlayed.push(firstTrack);
          randomtracks = display.showing.random;
        }
        changeDisplay(playlistContent.tracks[firstTrack], playlistContent.id);
        setTimeout(function(){nextTrack(firstTrack, randomtracks);}, playlistContent.tracks[firstTrack].duration);
      } else {
        changeDisplay(display.showing, display.showing.id);
      }
    }
    setTimeout(function(){updateDisplay();}, contentRefresh);
  }).fail(function() {
    console.log("Error! Trying again...");
    setTimeout(function(){updateDisplay();}, errorRetry);
  });
};

function nextTrack(currentIndex, random) {
  var nextIndex = 0;
  if (random) {
    nextIndex = currentIndex;
    while (alreadyPlayed.includes(nextIndex)) {
      nextIndex = Math.floor(Math.random() * playlistContent.tracks.length);
    }
    alreadyPlayed.push(nextIndex);
    if (alreadyPlayed.length == playlistContent.tracks.length) {
      console.log("Resetting alreadyPlayed");
      alreadyPlayed = [nextIndex];
    }
  } else if (currentIndex != (playlistContent.tracks.length - 1)) {
    nextIndex = currentIndex + 1;
  }
  changeDisplay(playlistContent.tracks[nextIndex], playlistContent.id);
  setTimeout(function(){nextTrack(nextIndex, random);}, playlistContent.tracks[nextIndex].duration);
};

function changeDisplay(content, currentContentId) {
  if (currentContentId == currentContent) {
    console.log(content);
    if (content.type == "image") {
      // Check if there is an old video that will need to fade and be removed
      var oldVideoId = null;
      var videos = $('#display [id*="video_"]');
      if (videos.length > 0) {
        oldVideoId = videos[0].id;
      };
      // Set new background content
      $('#display').css("background-image", "url(" + content.file + ")");
      // If there was a video, fade it out and then remove it
      if (oldVideoId) $('#'+oldVideoId).fadeTo(fadeTime, 0, function() {$('#'+oldVideoId).remove()});
    } else if (content.type == "video") {
      // Check if there is an old video that will need to fade and be removed
      var oldVideoId = null;
      var videos = $('#display [id*="video_"]');
      if (videos.length > 0) {
        oldVideoId = videos[0].id;
      };
      // Create HTML for new video and append it to display DIV
      var videoId = "video_" + content.file.split('/').pop().split('.')[0].replace(/\s/g, '');
      var videoHTML = '<video class="bg-video" id="' + videoId + '" style="opacity: 0;" loop autoplay>';
      videoHTML += '<source src="' + content.file + '" type="video/mp4"></video>';
      $('#display').append(videoHTML);
      // Fade in new video and remove any background images
      $('#'+videoId).fadeTo(fadeTime, 1);
      $('#display').css("background-image", "url(/static/black.png)");
      // If there was a video before, fade it out and then remove it
      if (oldVideoId) $('#'+oldVideoId).fadeTo(fadeTime, 0, function() {$('#'+oldVideoId).remove()});
    }
  } else {
    console.log("Not doing anything.");
    // Don't do anything
  }
}


$(document).ready( function () {
  $('#display').css("transition", "background-image " + Math.floor(fadeTime/1000) + "s ease-in-out");
  $('#display').css("background-image", "url(/static/black.png)");
  displayId = $("#display").data('id');
  updateDisplay();
});