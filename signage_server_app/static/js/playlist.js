var playlistContent = {};
var alreadyPlayed = [];
var fadeTime = 2000;

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

function changeDisplay(content) {
  if (content.type == "image") {
    // Check if there is an old video that will need to fade and be removed
    var oldVideoId = null;
    var videos = $('#playlistPreview [id*="video_"]');
    if (videos.length > 0) {
      oldVideoId = videos[0].id;
    };
    // Set new background content
    $('#playlistPreview').css("background-image", "url(" + content.file + ")");
    // If there was a video, fade it out and then remove it
    if (oldVideoId) $('#'+oldVideoId).fadeTo(fadeTime, 0, function() {$('#'+oldVideoId).remove()});
  } else if (content.type == "video") {
    // Check if there is an old video that will need to fade and be removed
    var oldVideoId = null;
    var videos = $('#playlistPreview [id*="video_"]');
    if (videos.length > 0) {
      oldVideoId = videos[0].id;
    };
    // Create HTML for new video and append it to playlistPreview DIV
    var videoId = "video_" + content.file.split('/').pop().split('.')[0].replace(/\s/g, '');
    var videoHTML = '<video class="bg-video" id="' + videoId + '" style="opacity: 0;" loop autoplay>';
    videoHTML += '<source src="' + content.file + '" type="video/mp4"></video>';
    $('#playlistPreview').append(videoHTML);
    // Fade in new video and remove any background images
    $('#'+videoId).fadeTo(fadeTime, 1);
    $('#playlistPreview').css("background-image", "url(/static/black.png)");
    // If there was a video before, fade it out and then remove it
    if (oldVideoId) $('#'+oldVideoId).fadeTo(fadeTime, 0, function() {$('#'+oldVideoId).remove()});
  }
}

$(document).ready( function () {
  $('#playlistPreview').css("transition", "background-image " + Math.floor(fadeTime/1000) + "s ease-in-out");
  $('#playlistPreview').css("background-image", "url(/static/black.png)");
  var id = $("#playlistPreview").data('id');
  console.log("Calling '/api/playlists/" + id + "'");
  $.getJSON("/api/playlists/" + id, function(data) {
    playlistContent = data.item;
    playlistContent.tracks.sort(function(a, b) { return a.seq - b.seq });
    var firstTrack = 0;
    var randomTracks = false;
    if ('random' in playlistContent && playlistContent.random) {
      firstTrack = Math.floor(Math.random() * playlistContent.tracks.length);
      alreadyPlayed.push(firstTrack);
      randomTracks = playlistContent.random;
    }
    changeDisplay(playlistContent.tracks[firstTrack].track);
    setTimeout(function(){nextTrack(firstTrack, randomTracks);}, playlistContent.tracks[firstTrack].duration * 1000);
  });
});