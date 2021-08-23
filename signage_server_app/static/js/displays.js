$(document).ready(function() {
  $.getJSON("/api/displays", function(response) {
    var html = '';
    $.each(response.items, function(i, item) {
      if (item.active) {
        html += '<div class="row button-row text-center"><div class="col text-center">';
        html += '<a role="button" class="btn btn-primary-custom" href="/displays/' + item.id + '"><span><h5>';
        html += item.name + '</h5></span></a></div></div>';
      }
    });
    $('#buttonCard').append(html);
  });
});