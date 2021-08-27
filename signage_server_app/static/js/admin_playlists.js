var playlists = {};
var displays = [];
var content = [];

var editPlaylistId = null;
var editTrackId = null;
var trackContentItem = null;
var publishPlaylistId = null;
var publishDisplayItem = null;
var areYouSureItemId = null;

// Used in Typeahead string matching
var substringMatcher = function(objs) {
  return function findMatches(q, cb) {
    var matches, substrRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(objs, function(i, obj) {
      if (substrRegex.test(obj['name'])) {
        matches.push(obj);
      }
    });

    cb(matches);
  };
};

// Code for managing the alert message at the top of the page
function setAlertMessage(message, alertType, autoHide=true) {
  $('#alertBox').removeClass("alert-warning-custom");
  $('#alertBox').removeClass("alert-success-custom");
  $('#alertBox').removeClass("alert-danger-custom");
  $('#alertBox').empty();
  switch (alertType) {
    case "warning":
      $('#alertBox').addClass("alert-warning-custom");
      $('#alertBox').append(message);
      break;
    case "success":
      $('#alertBox').addClass("alert-success-custom");
      $('#alertBox').append(message);
      break;
    case "error":
      $('#alertBox').addClass("alert-danger-custom");
      $('#alertBox').append(message);
      break;
  }
  $('#alertBox').slideDown("fast");
  if (autoHide) {
    setTimeout(function(){$('#alertBox').slideUp("slow")}, 5000);
  }
}

// Formats the buttons for each row in the table
function formatButtons(dataId) {
  var html = '<div class="btn-group">';
  // Edit
  html += '<span data-toggle="modal" data-target="#playlistModal" data-id="' + dataId + '">';
  html += '<button type="button" class="btn btn-light" data-type="editPlaylist" data-id="' + dataId + '" data-toggle="tooltip" data-placement="top" title="Edit Playlist">';
  html += '<img src="/static/icons/edit.svg" alt="Edit" class="row-icon"></button></span>';
  // View
  html += '<button type="button" class="btn btn-light" data-type="previewPlaylist" data-id="' + dataId + '" data-toggle="tooltip" data-placement="top" title="Preview Playlist">';
  html += '<img src="/static/icons/eye.svg" alt="View" class="row-icon"></button>';
  // Publish
  html += '<span data-toggle="modal" data-target="#playlistPublishModal" data-id="' + dataId + '">';
  html += '<button type="button" class="btn btn-light" data-type="publishPlaylist" data-id="' + dataId + '" data-toggle="tooltip" data-placement="top" title="Publish Playlist">';
  html += '<img src="/static/icons/publish.svg" alt="Publish" class="row-icon"></button></span>';
  // Delete
  html += '<span data-toggle="modal" data-target="#areYouSureModal" data-id="' + dataId + '">';
  html += '<button type="button" class="btn btn-light" data-type="deletePlaylist" data-id="' + dataId + '" data-toggle="tooltip" data-placement="top" title="Delete Playlist">';
  html += '<img src="/static/icons/delete.svg" alt="Delete" class="row-icon"></button></span>';
  //
  html += '</div>';
  return html;
}

// Called on page load to get the table data and initialize Datatable
function getTable(refresh) {
  $.getJSON("/api/playlists", function(response) {
    $.each(response.items, function(i, item) {
      playlists[String(item.id)] = item;
    });
    if (refresh) {
      $('#playlistsTable').DataTable().destroy();
    }
    var table = $("#playlistsTable").DataTable({
      data: response.items,
      rowId: "id",
      buttons: [
        {
          text: "+ Add Playlist",
          className: "btn-primary-custom",
          action: function ( e, dt, node, config ) {
            $('#playlistModal').modal("show");
            editPlaylistId = null; // make sure this is null for a new playlist
          }
        }
      ],
      columns: [
        {
          title: "ID",
          data: "id",
          visible: false
        },
        {
          title: 'Preview',
          data: 'tracks',
          orderable: false,
          responsivePriority: 3,
          render: function(data) {
            data.sort(function(a, b) { return a.seq - b.seq });
            var html = '<div class="container" style="width: 107px;"><div class="row" style="background-color: #000000">';
            for ( var i=0; i<4; i++ ) {
              if ( i == 2 ){
                html += '</div><div class="row" style="background-color: #000000">';
              }
              if ( i < data.length) {
                html += '<div class="col playlist-thumb-div"><img src="' + data[i].track.thumb + '" alt="Thumbnail" class="playlist-thumb" data-type="previewPlaylist"></div>';
              } else {
                html += '<div class="col playlist-thumb-div"><img src="/static/black.png" alt="Thumbnail" class="playlist-thumb" data-type="previewPlaylist"></div>';
              }
            }
            html += '</div></div>';
            return html;
          },
          createdCell: function (td, cellData, rowData, row, col) {
            $(td).css('text-align', 'center');
          }
        },
        {
          title: "Name",
          data: "name",
          responsivePriority: 1
        },
        {
          title: "Type",
          data: "type",
          responsivePriority: 4,
          render: function(data) {
            return data.charAt(0).toUpperCase() + data.slice(1);
          }
        },
        {
          title: "Tracks",
          data: "tracks",
          responsivePriority: 5,
          render: function(data) {
            return data.length;
          }
        },
        {
          title: "Shuffle",
          data: "random",
          responsivePriority: 6,
          render: function(data) {
            if (data) {
              return '<img src="/static/icons/check.svg" alt="True" class="row-icon" style="padding-left: 20px;">';
            } else {
              return '<img src="/static/icons/times.svg" alt="True" class="row-icon" style="padding-left: 20px;">';
            }
          }
        },
        {
          title: "Options",
          data: "id",
          width: "170px",
          responsivePriority: 2,
          orderable: false,
          render: function(data) {
            return formatButtons(data);
          },
          createdCell: function(td, cellData, rowData, row, col) {
            $(td).attr("nowrap","nowrap");
            $(td).attr("style","text-align: right;");
          }
        }
      ],
      scrollY: "50vh",
      scrollCollapse: true,
      paging: false,
      responsive: {
        details: false
      }
    });
    table.buttons().container().prependTo( $('#playlistsTable_wrapper').find("div").first().find("div").first() );
    table.buttons().container().find("button").removeClass("btn-secondary");
  });
}

// Get the displays to use in the Typeahead during publish
function getDisplays() {
  $.getJSON("/api/displays", function(data) {
    displays = data.items;
  });
}

// Get the content to use in the Typeahead during track adding
function getContent() {
  $.getJSON("/api/content", function(data) {
    content = data.items;
  });
}

// Initialize Typehead using display data
function initPublishTypeahead() {
  $('.publish-typeahead').typeahead({
    hint: true,
    highlight: true,
    minLength: 0
  },
  {
    name: 'displays',
    display: 'name',
    source: substringMatcher(displays),
    templates: {
      suggestion: function(obj) {
        if (obj['active']) {
          return '<div><strong>' + obj['name'] + '</strong> – Active</div>';
        } else {
          return '<div><strong>' + obj['name'] + '</strong> – Not Active</div>';
        }
      }
    }
  });
}

// Initialize Typehead using content data
function initTrackTypeahead() {
  $('.track-typeahead').typeahead({
    hint: true,
    highlight: true,
    minLength: 0
  },
  {
    name: 'content',
    display: 'name',
    source: substringMatcher(content),
    templates: {
      suggestion: function(obj) { return '<div><strong>' + obj['name'] + '</strong> – ' + obj['type'] + '</div>'; }
    }
  });
}

// Page Load
$(document).ready(function() {
  var page = window.location.pathname.split("/").slice(-1)[0];
  $('.nav-link[data-page="' + page + '"]').addClass('active');
  getTable(false);
  getDisplays();
  getContent();
});


// Add New Playlist or Edit Existing

function clearPlaylistModal() {
  editPlaylistId = null;
  $('#playlistName').val("");
  $('#playlistRandom').prop("checked", false);
  $('#playlistTracksTable').DataTable().destroy();
  $('#playlistModalSave').attr("disabled", true);
}

function clearTrackModal() {
  editTrackId = null;
  trackContentItem = null;
  $('#trackName').val("");
  $('#trackDuration').val("");
  $('.track-typeahead').typeahead("destroy");
  $('#trackModalSave').attr("disabled", true);
}

// Formats the buttons for each row in the table
function formatTrackButtons(dataId) {
  var html = '<div class="btn-group">';
  // Edit
  html += '<span data-toggle="modal" data-target="#trackModal" data-id="' + dataId + '">';
  html += '<button type="button" class="btn btn-light" data-type="editTrack" data-id="' + dataId + '" data-toggle="tooltip" data-placement="top" title="Edit Track">';
  html += '<img src="/static/icons/edit.svg" alt="Edit" class="row-icon"></button></span>';
  // Delete
  html += '<button type="button" class="btn btn-light" data-type="deleteTrack" data-id="' + dataId + '" data-toggle="tooltip" data-placement="top" title="Delete Track">';
  html += '<img src="/static/icons/delete.svg" alt="Delete" class="row-icon"></button>';
  //
  html += '</div>';
  return html;
}

function getTracksTable(refresh) {
  if (refresh) {
    $('#playlistTracksTable').DataTable().destroy();
  }
  var tableData = [];
  if (editPlaylistId != null) {
    tableData = playlists[editPlaylistId].tracks;
  }
  var table = $('#playlistTracksTable').DataTable({
    data: tableData,
    rowId: "seq",
    rowReorder: {
      dataSrc: "seq"
    },
    buttons: [
      {
        text: "+ Add Track",
        className: "btn-primary-custom",
        action: function ( e, dt, node, config ) {
          $('#trackModal').modal("show");
          $('#trackDuration').val("10"); // Default duration
        }
      }
    ],
    columns: [
      {
        title: "Sequence",
        data: "seq",
        visible: false
      },
      {
        title: "Order",
        data: "seq",
        width: "50px",
        responsivePriority: 1,
        render: function(data) {
          return '<img src="/static/icons/dots.svg" alt="Drag" class="row-icon">';
        },
        createdCell: function (td, cellData, rowData, row, col) {
          $(td).css('text-align', 'center');
          $(td).css('cursor', 'grab');
        }
      },
      {
        title: 'Preview',
        data: "track.thumb",
        orderable: false,
        responsivePriority: 5,
        render: function(data) {
          return '<img src="' + data + '" alt="Thumbnail" class="thumbnail">';
        },
        createdCell: function (td, cellData, rowData, row, col) {
          $(td).css('text-align', 'center');
        }
      },
      {
        title: "Name",
        data: "track.name",
        orderable: false,
        responsivePriority: 2
      },
      {
        title: "Type",
        data: "track.type",
        orderable: false,
        responsivePriority: 6,
        render: function(data) {
          return data.charAt(0).toUpperCase() + data.slice(1);
        }
      },
      {
        title: "Duration",
        data: "duration",
        orderable: false,
        responsivePriority: 4,
        render: function(data) {
          // Format integer (seconds) as "HH:MM:SS"
          return String(Math.floor(data/3600)).padStart(2, '0') + ":" + String(Math.floor(data/60)).padStart(2, '0') + ":" + String(data%60).padStart(2, '0');
        }
      },
      {
        title: "Options",
        data: "seq",
        width: "90px",
        responsivePriority: 3,
        orderable: false,
        render: function(data) {
          return formatTrackButtons(data);
        },
        createdCell: function(td, cellData, rowData, row, col) {
          $(td).attr("nowrap","nowrap");
          $(td).attr("style","text-align: right;");
        }
      }
    ],
    scrollY: "50vh",
    scrollCollapse: true,
    paging: false,
    responsive: {
      details: false
    }
  });
  table.buttons().container().prependTo( $('#playlistTracksTable_wrapper').find("div").first().find("div").first() );
  table.buttons().container().find("button").removeClass("btn-secondary");
}

$('#playlistsTable').on('click', '[data-type="editPlaylist"]', function(e) {
  editPlaylistId = $(this).data('id');
  $('#playlistName').val(playlists[editPlaylistId]['name']);
  $('#playlistRandom').prop("checked", playlists[editPlaylistId]['random']);
  $('#playlistModalSave').attr("disabled", false);
});

$('#playlistTracksTable').on('click', '[data-type="editTrack"]', function(e) {
  editTrackId = $(this).data('id');
  var trackObj = null;
  $.each(playlists[editPlaylistId].tracks, function(i, item) {
    if (item.seq == editTrackId) {
      trackObj = item;
      return false; // break
    }
  });
  $('#trackName').val(trackObj.track.name);
  $('#trackDuration').val(trackObj.duration);
  $('#trackModalSave').attr("disabled", false);
});

$('#playlistName').on('input', function() {
  if ($('#playlistName').val().length > 0) {
    $('#playlistModalSave').attr("disabled", false);
  } else {
    $('#playlistModalSave').attr("disabled", true);
  }
});

$('#playlistModal').on('shown.bs.modal', function() {
  $('#playlistName').focus();
  getTracksTable(false);
});

$('#playlistModalClose').on('click', function(e) {
  clearPlaylistModal();
});

$('#playlistModalX').on('click', function(e) {
  clearPlaylistModal();
});

$('#trackModal').on('shown.bs.modal', function() {
  initTrackTypeahead();
  $('#trackName').focus();
});

$('#trackModalClose').on('click', function(e) {
  clearTrackModal();
});

$('#trackModalX').on('click', function(e) {
  clearTrackModal();
});

$('.track-typeahead').on('typeahead:selected', function(evt, item) {
  $('#trackModalSave').attr("disabled", false);
  trackContentItem = item;
  if (trackContentItem.type == "video") {
    $('#trackDuration').val(trackContentItem.duration);
  }
});

$('#trackModalSave').on('click', function(e) {
  var table = $('#playlistTracksTable').DataTable();
  var duration = parseInt($('#trackDuration').val());
  if (editTrackId != null) {
    // Update edited track
    var rowData = table.row('#' + editTrackId).data();
    if (trackContentItem != null) {
      // Update content item
      rowData.track = trackContentItem;
    }
    rowData.duration = duration;
    table.row('#' + editTrackId).data(rowData).draw();
  } else {
    // Add new track
    var maxId = Math.max(...table.rows().ids().map(x=>+x).toArray());
    var newId = 0;
    if (maxId != -Infinity) newId = maxId + 1;
    var rowData = {
      seq: newId,
      duration: duration,
      track: trackContentItem
    }
    table.row.add(rowData).draw();
  }
  clearTrackModal();
  $('#trackModal').modal("hide");
});

$('#playlistTracksTable').on('click', '[data-type="deleteTrack"]', function(e) {
  var deleteTrackId = $(this).data('id');
  var table = $('#playlistTracksTable').DataTable();
  table.row('#' + deleteTrackId).remove().draw();
});

$('#playlistModalSave').on('click', function(e) {
  var table = $('#playlistTracksTable').DataTable();
  if (editPlaylistId != null) {
    // Edit existing playlist
    var playlist = playlists[editPlaylistId];
    playlist.name = $('#playlistName').val();
    playlist.random = $('#playlistRandom').prop("checked");
    playlist.tracks = table.data().toArray();
    $.ajax({
      type: "PUT",
      url: "/api/playlists/" + editPlaylistId,
      contentType: "application/json",
      data: JSON.stringify(playlist),
      success: function(result) {
        if (result.status == "SUCCESS") {
        setAlertMessage("<strong>Success!</strong> Edited playlist: '" + playlist['name'] + "'", "success");
        } else {
          setAlertMessage("<strong>Error!</strong> Failed to edit playlist.", "error");
        }
        clearPlaylistModal();
        getTable(true);
      }
    });
  } else {
    // POST new playlist
    var playlist = {
      name: $('#playlistName').val(),
      random: $('#playlistRandom').prop("checked"),
      type: "playlist",
      tracks: table.data().toArray()
    }
    $.ajax({
      type: "POST",
      url: "/api/playlists",
      contentType: "application/json",
      data: JSON.stringify(playlist),
      success: function(result) {
        if (result.status == "SUCCESS") {
        setAlertMessage("<strong>Success!</strong> Added new playlist: '" + playlist['name'] + "'", "success");
        } else {
          setAlertMessage("<strong>Error!</strong> Failed to add new playlist.", "error");
        }
        clearPlaylistModal();
        getTable(true);
      }
    });
  }
});


// Preview Playlist

$('#playlistsTable').on('click', '[data-type="previewPlaylist"]', function(e) {
  var itemId = $(this).data('id');
  var win = window.open('/playlists/' + itemId, '_blank');
  if (win) {
      //Browser has allowed it to be opened
      win.focus();
  } else {
      //Browser has blocked it
      alert('Please allow popups for this website');
  }
});


// Publish Playlist

function clearPublishPlaylistModal() {
  publishPlaylistId = null;
  publishDisplayItem = null;
  $("#playlistPublishDisplayName").val('');
  $('.publish-typeahead').typeahead("destroy");
  $('#playlistPublishModalSave').attr("disabled", true);
}

$('#playlistsTable').on('click', '[data-type="publishPlaylist"]', function(e) {
  publishPlaylistId = $(this).data('id');
  initPublishTypeahead();
});

$('#playlistPublishModal').on('shown.bs.modal', function() {
  $('#playlistPublishDisplayName').focus();
});

$('#playlistPublishModalClose').on('click', function(e) {
  clearPublishPlaylistModal();
});

$('#playlistPublishModalX').on('click', function(e) {
  clearPublishPlaylistModal();
});

$('.publish-typeahead').on('typeahead:selected', function(evt, item) {
  $('#playlistPublishModalSave').attr("disabled", false);
  publishDisplayItem = item;
});

$('#playlistPublishModalSave').on('click', function(e) {
  var now = new Date();
  publishDisplayItem['showing'] = playlists[publishPlaylistId];
  publishDisplayItem['updated'] = now.toISOString();
  $.ajax({
    type: "PUT",
    url: "/api/displays/" + publishDisplayItem['id'],
    contentType: "application/json",
    data: JSON.stringify(publishDisplayItem),
    success: function(result) {
      if (result.status == "SUCCESS") {
        setAlertMessage("<strong>Success!</strong> Now displaying '" + playlists[publishPlaylistId]['name'] + "' on display '" + publishDisplayItem['name'] + "'", "success");
      } else {
        setAlertMessage("<strong>Error!</strong> Could not update playlist on display.", "error");
      }
      clearPublishPlaylistModal();
    }
  });
});


// Delete Playlist

function clearAreYouSureModal() {
  $("#areYouSureMessage").text("");
  $("#areYouSureModalConfirm").text("");
  areYouSureItemId = null;
}

$('#playlistsTable').on('click', '[data-type="deletePlaylist"]', function(e) {
  $("#areYouSureMessage").text("Do you want to delete this playlist? This cannot be undone.");
  $("#areYouSureModalConfirm").text("Delete");
  areYouSureItemId = $(this).data('id');
});

$('#areYouSureModalClose').on('click', function(e) {
  clearAreYouSureModal();
});

$('#areYouSureModalX').on('click', function(e) {
  clearAreYouSureModal();
});

$('#areYouSureModalConfirm').on('click', function(e) {
  console.log("Item ID: " + areYouSureItemId);
  $.ajax({
    type: "DELETE",
    url: "/api/playlists/" + areYouSureItemId,
    success: function(result) {
      console.log("Success");
      var table = $('#playlistsTable').DataTable();
      table.row("#" + areYouSureItemId).remove().draw();
      setAlertMessage("<strong>Success!</strong> Playlist has been deleted.", "success");
      clearAreYouSureModal();
    },
    error: function(result) {
      console.log("Failed!");
      console.log(result);
      setAlertMessage("<strong>Error!</strong> Could not delete playlist.", "error");
    }
  });
});