var currentContent = null;
var playlistContent = {};
var alreadyPlayed = [];
var contentRefresh = 1000;
var errorRetry = 10000;
var displayId = null;
var lastUpdated = new Date();

function updateDisplay() {
  $.getJSON("/api/displays/" + displayId, function(data) {
    var display = data.item;
    var displayUpdated = new Date(display.updated);
    if (display.active && display.showing != null && (currentContent != display.showing.id || displayUpdated > lastUpdated)) {
      console.log("Changing content to " + display.showing.type + ": " + display.showing.name);
      currentContent = display.showing.id;
      lastUpdated = new Date();
      if (display.showing.type == "playlist") {
        playlistContent = display.showing;
        playlistContent.tracks.sort(function(a, b) { return a.seq - b.seq });
        var firstTrack = 0;
        var randomTracks = false;
        if ('random' in playlistContent && playlistContent.random) {
          firstTrack = Math.floor(Math.random() * playlistContent.tracks.length);
          alreadyPlayed.push(firstTrack);
          randomTracks = playlistContent.random;
        }
        changeDisplay(playlistContent.tracks[firstTrack].track, playlistContent.id, display.fadeTime);
        setTimeout(function(){nextTrack(firstTrack, randomTracks);}, playlistContent.tracks[firstTrack].duration * 1000);
      } else {
        changeDisplay(display.showing, display.showing.id, display.fadeTime);
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
  changeDisplay(playlistContent.tracks[nextIndex].track, playlistContent.id);
  setTimeout(function(){nextTrack(nextIndex, random);}, playlistContent.tracks[nextIndex].duration * 1000);
};

function changeDisplay(content, currentContentId, fadeTime) {
  if (currentContentId == currentContent) {
    console.log(content);
    console.log("Fade Time: " + fadeTime);
    // Check if there is an old video that will need to fade and be removed
    var oldVideoId = null;
    var videos = $('#display [id*="video_"]');
    if (videos.length > 0) {
      oldVideoId = videos[0].id;
    };
    // Check if there is an old YouTube video that will need to fade and be removed
    var oldYoutubeId = null;
    var youtubes = $('#display [id*="youtube_"]');
    if (youtubes.length > 0) {
      oldYoutubeId = youtubes[0].id;
    };
    if (content.type == "image") {
      // Set new background content
      $('#display').css("background-image", "url(" + content.file + ")");
    } else if (content.type == "video") {
      // Create HTML for new video and append it to display DIV
      var videoId = "video_" + content.file.split('/').pop().split('.')[0].replace(/\s/g, '');
      var videoHTML = '<video class="bg-video" id="' + videoId + '" style="opacity: 0;" loop autoplay>';
      videoHTML += '<source src="' + content.file + '" type="video/mp4"></video>';
      $('#display').append(videoHTML);
      // Fade in new video and remove any background images
      $('#'+videoId).fadeTo(fadeTime, 1);
      $('#display').css("background-image", "url(/static/black.png)");
    } else if (content.type == "youtube") {
      // Create HTML for embedded YouTube video and append it to display DIV
      var youtubeId = "youtube_" + content.id;
      var youtubeHTML = '<iframe id="' + youtubeId + '" title="YouTube video player" frameborder="0"';
      youtubeHTML += 'height="100%" width="100%" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"';
      youtubeHTML += 'src="' + content.file + '?controls=0&autoplay=1" allowfullscreen></iframe>';
      $('#display').append(youtubeHTML);
      // Fade in new video and remove any background images
      $('#'+youtubeId).fadeTo(fadeTime, 1);
      $('#display').css("background-image", "url(/static/black.png)");
    }
    // If there was a video before, fade it out and then remove it
    if (oldVideoId) $('#'+oldVideoId).fadeTo(fadeTime, 0, function() {$('#'+oldVideoId).remove()});
    // If there was a YouTube video before, fade it out and then remove it
    if (oldYoutubeId) $('#'+oldYoutubeId).fadeTo(fadeTime, 0, function() {$('#'+oldYoutubeId).remove()});
  } else {
    console.log("Not doing anything.");
    // Don't do anything
  }
}


$(document).ready( function () {
  $('#display').css("transition", "background-image " + Math.floor(2) + "s ease-in-out");
  $('#display').css("background-image", "url(/static/black.png)");
  displayId = $("#display").data('id');
  updateDisplay();
});