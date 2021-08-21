var playlistContent = {};
var slideshowContent = {};
var alreadyPlayed = [];
var fadeTime = 2000;

function nextSlide(currentIndex, random) {
  var nextIndex = 0;
  if (random) {
    nextIndex = currentIndex;
    while (alreadyPlayed.includes(nextIndex)) {
      nextIndex = Math.floor(Math.random() * slideshowContent.slides.length);
    }
    alreadyPlayed.push(nextIndex);
    if (alreadyPlayed.length == slideshowContent.slides.length) {
      console.log("Resetting alreadyPlayed");
      alreadyPlayed = [nextIndex];
    }
  } else if (currentIndex != (slideshowContent.slides.length - 1)) {
    nextIndex = currentIndex + 1;
  }
  changeDisplay(slideshowContent.slides[nextIndex]);
  setTimeout(function(){nextSlide(nextIndex, random);}, getDuration(slideshowContent.slides[nextIndex].duration));
};

function getDuration(durationStr) {
  var sections = durationStr.split(":");
  return 1000 * (parseInt(sections[0])*3600 + parseInt(sections[1])*60 + parseInt(sections[2])) - fadeTime;
}

function changeDisplay(content) {
  if (content.type == "image") {
    // Check if there is an old video that will need to fade and be removed
    var oldVideoId = null;
    var videos = $('#contentPreview [id*="video_"]');
    if (videos.length > 0) {
      oldVideoId = videos[0].id;
    };
    // Set new background content
    $('#contentPreview').css("background-image", "url(" + content.path + ")");
    // If there was a video, fade it out and then remove it
    if (oldVideoId) $('#'+oldVideoId).fadeTo(fadeTime, 0, function() {$('#'+oldVideoId).remove()});
  } else if (content.type == "video") {
    // Check if there is an old video that will need to fade and be removed
    var oldVideoId = null;
    var videos = $('#contentPreview [id*="video_"]');
    if (videos.length > 0) {
      oldVideoId = videos[0].id;
    };
    // Create HTML for new video and append it to contentPreview DIV
    var videoId = "video_" + content.path.split('/').pop().split('.')[0].replace(/\s/g, '');
    var videoHTML = '<video class="bg-video" id="' + videoId + '" style="opacity: 0;" loop autoplay>';
    videoHTML += '<source src="' + content.path + '" type="video/mp4"></video>';
    $('#contentPreview').append(videoHTML);
    // Fade in new video and remove any background images
    $('#'+videoId).fadeTo(fadeTime, 1);
    $('#contentPreview').css("background-image", "url(/static/content/default.jpg)");
    // If there was a video before, fade it out and then remove it
    if (oldVideoId) $('#'+oldVideoId).fadeTo(fadeTime, 0, function() {$('#'+oldVideoId).remove()});
  }
}

$(document).ready( function () {
  $('#contentPreview').css("transition", "background-image " + Math.floor(fadeTime/1000) + "s ease-in-out");
  $('#contentPreview').css("background-image", "url(/static/content/default.jpg)");
  var id = $("#contentPreview").data('id');
  var type = $("#contentPreview").data('type');
  if (type == "slideshow") {
    $.getJSON("/getSlideshowPreview/" + id, function(data) {
      slideshowContent = data;
      var firstSlide = 0;
      var randomSlides = false;
      if ('random' in data && data.random) {
        firstSlide = Math.floor(Math.random() * slideshowContent.slides.length);
        alreadyPlayed.push(firstSlide);
        randomSlides = data.random;
      }
      changeDisplay(slideshowContent.slides[firstSlide], slideshowContent.name);
      setTimeout(function(){nextSlide(firstSlide, randomSlides);}, getDuration(slideshowContent.slides[firstSlide].duration));
    });
  } else {
    $.getJSON("/getContentPreview/" + id, function(data) {
      changeDisplay(data);
    });
  }
});