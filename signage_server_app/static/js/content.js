var fadeTime = 2000;

function changeDisplay(content) {
  console.log("Changing display to: " + content.name);
  if (content.type == "image") {
    // Check if there is an old video that will need to fade and be removed
    var oldVideoId = null;
    var videos = $('#contentPreview [id*="video_"]');
    if (videos.length > 0) {
      oldVideoId = videos[0].id;
    }
    // Set new background content
    $('#contentPreview').css("background-image", "url(" + content.file + ")");
    // If there was a video, fade it out and then remove it
    if (oldVideoId) $('#'+oldVideoId).fadeTo(fadeTime, 0, function() {$('#'+oldVideoId).remove()});
  } else if (content.type == "video") {
    // Check if there is an old video that will need to fade and be removed
    var oldVideoId = null;
    var videos = $('#contentPreview [id*="video_"]');
    if (videos.length > 0) {
      oldVideoId = videos[0].id;
    }
    // Create HTML for new video and append it to contentPreview DIV
    var videoId = "video_" + content.file.split('/').pop().split('.')[0].replace(/\s/g, '');
    var videoHTML = '<video class="bg-video" id="' + videoId + '" style="opacity: 0;" loop autoplay>';
    videoHTML += '<source src="' + content.file + '" type="video/mp4"></video>';
    $('#contentPreview').append(videoHTML);
    // Fade in new video and remove any background images
    $('#'+videoId).fadeTo(fadeTime, 1);
    $('#contentPreview').css("background-image", "url(/static/black.png)");
    // If there was a video before, fade it out and then remove it
    if (oldVideoId) $('#'+oldVideoId).fadeTo(fadeTime, 0, function() {$('#'+oldVideoId).remove()});
  }
}

$(document).ready(function() {
  $('#contentPreview').css("transition", "background-image " + Math.floor(fadeTime/1000) + "s ease-in-out");
  $('#contentPreview').css("background-image", "url(/static/black.png)");
  var id = $("#contentPreview").data('id');
  $.getJSON("/api/content/" + id, function(data) {
    changeDisplay(data.item);
  });
});