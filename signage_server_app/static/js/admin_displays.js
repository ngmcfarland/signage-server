var displays = {};
var content = [];

var editDisplayId = null;
var publishDisplayId = null;
var publishContentItem = null;
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
  html += '<span data-toggle="modal" data-target="#displayModal" data-id="' + dataId + '">';
  html += '<button type="button" class="btn btn-light" data-type="editDisplay" data-id="' + dataId + '" data-toggle="tooltip" data-placement="top" title="Edit Display">';
  html += '<img src="/static/icons/edit.svg" alt="Edit" class="row-icon"></button></span>';
  // View
  html += '<button type="button" class="btn btn-light" data-type="viewLiveDisplay" data-id="' + dataId + '" data-toggle="tooltip" data-placement="top" title="View Live Display">';
  html += '<img src="/static/icons/eye.svg" alt="View" class="row-icon"></button>';
  // Publish
  html += '<span data-toggle="modal" data-target="#displayPublishModal" data-id="' + dataId + '">';
  html += '<button type="button" class="btn btn-light" data-type="publishDisplay" data-id="' + dataId + '" data-toggle="tooltip" data-placement="top" title="Publish to Display">';
  html += '<img src="/static/icons/publish.svg" alt="Publish" class="row-icon"></button></span>';
  // Delete
  html += '<span data-toggle="modal" data-target="#areYouSureModal" data-id="' + dataId + '">';
  html += '<button type="button" class="btn btn-light" data-type="deleteDisplay" data-id="' + dataId + '" data-toggle="tooltip" data-placement="top" title="Delete Display">';
  html += '<img src="/static/icons/delete.svg" alt="Delete" class="row-icon"></button></span>';
  //
  html += '</div>';
  return html;
}

// Called on page load to get the table data and initialize Datatable
function getTable(refresh) {
  $.getJSON("/api/displays", function(response) {
    $.each(response.items, function(i, item) {
      displays[String(item.id)] = item;
    });
    if (refresh) {
      $('#displaysTable').DataTable().destroy();
    }
    var table = $("#displaysTable").DataTable({
      data: response.items,
      rowId: "id",
      buttons: [
        {
          text: "+ Add Display",
          className: "btn-primary-custom",
          action: function ( e, dt, node, config ) {
            $('#displayActive').prop("checked", true); // New displays should be active by default
            $('#displayModal').modal("show");
            editDisplayId = null; // make sure this is null for a new display
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
          title: "Name",
          data: "name",
          responsivePriority: 1
        },
        {
          title: "Active",
          data: "active",
          responsivePriority: 3,
          render: function(data) {
            if (data) {
              return '<img src="/static/icons/check.svg" alt="True" class="row-icon" style="padding-left: 20px;">';
            } else {
              return '<img src="/static/icons/times.svg" alt="True" class="row-icon" style="padding-left: 20px;">';
            }
          }
        },
        {
          title: "Currently Showing",
          data: "showing",
          responsivePriority: 5,
          render: function(data) {
            if (data == null) {
              return "None";
            } else {
              return data.name + " (" + data.type + ")";
            }
          }
        },
        {
          title: "Preview",
          data: "showing",
          orderable: false,
          responsivePriority: 4,
          render: function(data) {
            if (data == null) {
              return "None";
            } else if (data.type == "playlist") {
              data.tracks.sort(function(a, b) { return a.seq - b.seq });
              var html = '<div class="container" style="width: 107px;"><div class="row" style="background-color: #000000">';
              for ( var i=0; i<4; i++ ) {
                if ( i == 2 ){
                  html += '</div><div class="row" style="background-color: #000000">';
                }
                if ( i < data.tracks.length) {
                  html += '<div class="col playlist-thumb-div"><img src="' + data.tracks[i].track.thumb + '" alt="Thumbnail" class="playlist-thumb" data-type="previewPlaylist"></div>';
                } else {
                  html += '<div class="col playlist-thumb-div"><img src="/static/black.png" alt="Thumbnail" class="playlist-thumb" data-type="previewPlaylist"></div>';
                }
              }
              html += '</div></div>';
              return html;
            } else {
              return '<img src="' + data.thumb + '" alt="Thumbnail" class="thumbnail" data-type="viewLiveDisplay">';
            }
          },
          createdCell: function (td, cellData, rowData, row, col) {
            $(td).css('text-align', 'center');
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
    table.buttons().container().prependTo( $('#displaysTable_wrapper').find("div").first().find("div").first() );
    table.buttons().container().find("button").removeClass("btn-secondary");
  });
}

// Get the content to use in the Typeahead during publish
function getContent() {
  $.getJSON("/api/content", function(data) {
    content = content.concat(data.items);
  });
  $.getJSON("/api/playlists", function(data) {
    content = content.concat(data.items);
  });
}

// Initialize Typehead using content data
function initTypeahead() {
  $('.typeahead').typeahead({
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

// Page load
$(document).ready(function() {
  var page = window.location.pathname.split("/").slice(-1)[0];
  $('.nav-link[data-page="' + page + '"]').addClass('active');
  getTable(false);
  getContent();
});


// Add New Display or Edit Existing

function clearDisplayModal() {
  editDisplayId = null;
  $('#displayName').val("");
  $('#displayFadeTime').val("");
  $('#displayActive').prop("checked", false);
}

$('#displaysTable').on('click', '[data-type="editDisplay"]', function(e) {
  editDisplayId = $(this).data('id');
  $('#displayName').val(displays[editDisplayId]['name']);
  $('#displayFadeTime').val(displays[editDisplayId]['fade_time']);
  $('#displayActive').prop("checked", displays[editDisplayId]['active']);
  $('#displayModalSave').attr("disabled", false);
});

$('#displayModal').on('shown.bs.modal', function() {
  $('#displayName').focus();
});

$('#displayName').on('input', function() {
  if ($('#displayName').val().length > 0) {
    $('#displayModalSave').attr("disabled", false);
  } else {
    $('#displayModalSave').attr("disabled", true);
  }
});

$('#displayModalSave').on('click', function(e) {
  var now = new Date();
  var display = {
    "name": $('#displayName').val(),
    "active": $('#displayActive').is(":checked"),
    "fadeTime": parseInt($('#displayFadeTime').val()),
    "updated": now.toISOString(),
    "showing": null
  }
  if (editDisplayId == null) {
    // POST a new display
    $.ajax({
      type: "POST",
      url: "/api/displays",
      contentType: "application/json",
      data: JSON.stringify(display),
      success: function(result) {
        if (result.status == "SUCCESS") {
          setAlertMessage("<strong>Success!</strong> '" + display['name'] + "' has been added.", "success");
        } else {
          setAlertMessage("<strong>Error!</strong> Failed to add new display.", "error");
        }
        clearDisplayModal();
        getTable(true);
      }
    });
  } else {
    // PUT an updated display
    display['showing'] = displays[editDisplayId]['showing'];
    $.ajax({
      type: "PUT",
      url: "/api/displays/" + editDisplayId,
      contentType: "application/json",
      data: JSON.stringify(display),
      success: function(result) {
        if (result.status == "SUCCESS") {
          setAlertMessage("<strong>Success!</strong> '" + display['name'] + "' has been updated.", "success");
        } else {
          setAlertMessage("<strong>Error!</strong> Failed to update display.", "error");
        }
        clearDisplayModal();
        getTable(true);
      }
    })
  }
});


// View Live Display

$('#displaysTable').on('click', '[data-type="viewLiveDisplay"]', function(e) {
  var itemId = $(this).data('id');
  var win = window.open('/displays/' + itemId, '_blank');
  if (win) {
      //Browser has allowed it to be opened
      win.focus();
  } else {
      //Browser has blocked it
      alert('Please allow popups for this website');
  }
});


// Publish to Display

function clearPublishDisplayModal() {
  publishDisplayId = null;
  publishContentItem = null;
  $("#displayPublishContentName").val('');
  $('.typeahead').typeahead("destroy");
  $('#displayPublishModalSave').attr("disabled", true);
}

$('#displaysTable').on('click', '[data-type="publishDisplay"]', function(e) {
  publishDisplayId = $(this).data('id');
  initTypeahead();
});

$('#displayPublishModal').on('shown.bs.modal', function() {
  $('#displayPublishContentName').focus();
});

$('#displayPublishModalClose').on('click', function(e) {
  clearPublishDisplayModal();
});

$('#displayPublishModalX').on('click', function(e) {
  clearPublishDisplayModal();
});

$('.typeahead').on('typeahead:selected', function(evt, item) {
  $('#displayPublishModalSave').attr("disabled", false);
  publishContentItem = item;
});

$('#displayPublishModalSave').on('click', function(e) {
  var now = new Date();
  displays[publishDisplayId]['showing'] = publishContentItem;
  displays[publishDisplayId]['updated'] = now.toISOString();
  $.ajax({
    type: "PUT",
    url: "/api/displays/" + publishDisplayId,
    contentType: "application/json",
    data: JSON.stringify(displays[publishDisplayId]),
    success: function(result) {
      if (result.status == "SUCCESS") {
        setAlertMessage("<strong>Success!</strong> Now displaying '" + publishContentItem['name'] + "' on display '" + displays[publishDisplayId]['name'] + "'", "success");
      } else {
        setAlertMessage("<strong>Error!</strong> Could not update content on display.", "error");
      }
      clearPublishDisplayModal();
      getTable(true);
    }
  });
});


// Delete Display

function clearAreYouSureModal() {
  $("#areYouSureMessage").text("");
  $("#areYouSureModalConfirm").text("");
  areYouSureItemId = null;
}

$('#displaysTable').on('click', '[data-type="deleteDisplay"]', function(e) {
  $("#areYouSureMessage").text("Do you want to delete this display? This cannot be undone.");
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
    url: "/api/displays/" + areYouSureItemId,
    success: function(result) {
      console.log("Success");
      var table = $('#displaysTable').DataTable();
      table.row("#" + areYouSureItemId).remove().draw();
      setAlertMessage("<strong>Success!</strong> Display has been deleted.", "success");
      clearAreYouSureModal();
    },
    error: function(result) {
      console.log("Failed!");
      console.log(result);
      setAlertMessage("<strong>Error!</strong> Could not delete display.", "error");
    }
  });
});