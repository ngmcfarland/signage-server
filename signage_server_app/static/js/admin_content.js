var content = {};
var displays = [];

var acceptedFiles = ["image/png", "image/jpeg", "image/gif", "image/webp", "video/mp4", "video/webm", "video/quicktime"];
var _URL = window.URL || window.webkitURL;
var maxDimension = 3840; // 4K

var editContentId = null;
var publishContentId = null;
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
  html += '<span data-toggle="modal" data-target="#contentModal" data-id="' + dataId + '">';
  html += '<button type="button" class="btn btn-light" data-type="editContent" data-id="' + dataId + '" data-toggle="tooltip" data-placement="top" title="Edit Content">';
  html += '<img src="/static/icons/edit.svg" alt="Edit" class="row-icon"></button></span>';
  // View
  html += '<button type="button" class="btn btn-light" data-type="previewContent" data-id="' + dataId + '" data-toggle="tooltip" data-placement="top" title="Preview Content">';
  html += '<img src="/static/icons/eye.svg" alt="View" class="row-icon"></button>';
  // Publish
  html += '<span data-toggle="modal" data-target="#contentPublishModal" data-id="' + dataId + '">';
  html += '<button type="button" class="btn btn-light" data-type="publishContent" data-id="' + dataId + '" data-toggle="tooltip" data-placement="top" title="Publish Content">';
  html += '<img src="/static/icons/publish.svg" alt="Publish" class="row-icon"></button></span>';
  // Delete
  html += '<span data-toggle="modal" data-target="#areYouSureModal" data-id="' + dataId + '">';
  html += '<button type="button" class="btn btn-light" data-type="deleteContent" data-id="' + dataId + '" data-toggle="tooltip" data-placement="top" title="Delete Content">';
  html += '<img src="/static/icons/delete.svg" alt="Delete" class="row-icon"></button></span>';
  //
  html += '</div>';
  return html;
}

// Called on page load to get the table data and initialize Datatable
function getTable(refresh) {
  $.getJSON("/api/content", function(response) {
    $.each(response.items, function(i, item) {
      content[String(item.id)] = item;
    });
    if (refresh) {
      $('#contentTable').DataTable().destroy();
    }
    var table = $("#contentTable").DataTable({
      data: response.items,
      rowId: "id",
      buttons: [
        {
          text: "+ Add Content",
          className: "btn-primary-custom",
          action: function ( e, dt, node, config ) {
            $('#contentModal').modal("show");
            editContentId = null; // make sure this is null for a new content
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
          title: "Preview",
          data: "thumb",
          orderable: false,
          responsivePriority: 3,
          render: function(data) {
            return '<img src="' + data + '" alt="Thumbnail" class="thumbnail" data-type="previewContent">';
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
          title: "Resolution",
          data: "resolution",
          responsivePriority: 5
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
    table.buttons().container().prependTo( $('#contentTable_wrapper').find("div").first().find("div").first() );
    table.buttons().container().find("button").removeClass("btn-secondary");
  });
}

// Get the displays to use in the Typeahead during publish
function getDisplays() {
  $.getJSON("/api/displays", function(data) {
    displays = data.items;
  });
}

// Initialize Typehead using display data
function initTypeahead() {
  $('.typeahead').typeahead({
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

// Page Load
$(document).ready(function() {
  var page = window.location.pathname.split("/").slice(-1)[0];
  $('.nav-link[data-page="' + page + '"]').addClass('active');
  getTable(false);
  getDisplays();
});


// Add New Content or Edit Existing

function clearContentModal() {
  editContentId = null;
  $('#contentName').val("");
  $('#contentUpload').val("");
  $('#contentUploadText').text("");
}

$('#contentTable').on('click', '[data-type="editContent"]', function(e) {
  editContentId = $(this).data('id');
  $('#contentName').val(content[editContentId]['name']);
  $('#contentModalSave').attr("disabled", false);
});

$('#contentModal').on('shown.bs.modal', function() {
  $('#contentName').focus();
});

$('#contentName').on('input', function() {
  if ($('#contentName').val().length > 0) {
    $('#contentModalSave').attr("disabled", false);
  } else {
    $('#contentModalSave').attr("disabled", true);
  }
});

$('#contentUpload').on('change', function() {
  var file, img;
  if ((file = this.files[0])) {
    console.log("File Type: " + file.type);
    if (!acceptedFiles.includes(file.type)) {
      // Invalid file type
      $('#contentUploadText').text("Invalid file type. Acceptable types:\nJPEG, PNG, GIF, WEBP, MP4, MOV, WEBM");
      $('#contentModalSave').attr("disabled", true);
    } else {
      $('#contentUploadText').text("");
      if (file.type.split('/')[0] == "image") {
        // Check to make sure image is not too large
        img = new Image();
        img.src = _URL.createObjectURL(file);
        img.onload = function () {
          console.log("File Dimensions: " + img.width + "x" + img.height);
          if (this.width > maxDimension || this.height > maxDimension) {
            // Content dimensions too big
            $('#contentUploadText').text("Image resolution can't be more than 3840x2160 (actual: " + this.width + "x" + this.height + ")");
            $('#contentModalSave').attr("disabled", true);
          } else {
            // Everything is good
            $('#contentUploadText').text("");
            $('#contentModalSave').attr("disabled", false);
          }
        };
      } else {
        // Don't have a way of checking resolution of videos in Javascript
        $('#contentUploadText').text("");
        $('#contentModalSave').attr("disabled", false);
      }
    }
  }
});

$('#contentModalSave').on('click', function(e) {
  if ($('#contentUpload')[0].files[0]) {
    // File is present
    var content_type = false;
    var content_object = new FormData();
    content_object.append("file", $('#contentUpload')[0].files[0]);
    content_object.append("name", $('#contentName').val());
  } else {
    // File is not present
    var content_type = "application/json";
    var temp_object = content[editContentId];
    temp_object['name'] = $('#contentName').val();
    var content_object = JSON.stringify(temp_object);
  }
  if (editContentId == null) {
    // POST new content
    $.ajax({
      type: "POST",
      url: "/api/content",
      contentType: content_type,
      processData: false,
      data: content_object,
      success: function(result) {
        if (result.status == "SUCCESS") {
          setAlertMessage("<strong>Success!</strong> '" + $('#contentName').val() + "' has been added.", "success");
        } else {
          setAlertMessage("<strong>Error!</strong> Failed to add new content.", "error");
        }
        clearContentModal();
        getTable(true);
      }
    });
    // Large uploads can take a few seconds across a network, so set this warning message
    setAlertMessage("<strong>Upload in Progress!</strong> Please don't leave this window until upload complete.", "warning", false);
  } else {
    // PUT updated content
    $.ajax({
      type: "PUT",
      url: "/api/content/" + editContentId,
      contentType: content_type,
      processData: false,
      data: content_object,
      success: function(result) {
        if (result.status == "SUCCESS") {
          setAlertMessage("<strong>Success!</strong> '" + $('#contentName').val() + "' has been updated.", "success");
        } else {
          setAlertMessage("<strong>Error!</strong> Failed to update content.", "error");
        }
        clearContentModal();
        getTable(true);
      }
    });
    // Large uploads can take a few seconds across a network, so set this warning message
    setAlertMessage("<strong>Upload in Progress!</strong> Please don't leave this window until upload complete.", "warning", false);
  }
});


// Preview Content

$('#contentTable').on('click', '[data-type="previewContent"]', function(e) {
  var itemId = $(this).data('id');
  var win = window.open('/content/' + itemId, '_blank');
  if (win) {
      //Browser has allowed it to be opened
      win.focus();
  } else {
      //Browser has blocked it
      alert('Please allow popups for this website');
  }
});


// Publish Content

function clearPublishContentModal() {
  publishContentId = null;
  publishDisplayItem = null;
  $("#contentPublishDisplayName").val('');
  $('.typeahead').typeahead("destroy");
  $('#contentPublishModalSave').attr("disabled", true);
}

$('#contentTable').on('click', '[data-type="publishContent"]', function(e) {
  publishContentId = $(this).data('id');
  initTypeahead();
});

$('#contentPublishModal').on('shown.bs.modal', function() {
  $('#contentPublishDisplayName').focus();
});

$('#contentPublishModalClose').on('click', function(e) {
  clearPublishContentModal();
});

$('#contentPublishModalX').on('click', function(e) {
  clearPublishContentModal();
});

$('.typeahead').on('typeahead:selected', function(evt, item) {
  $('#contentPublishModalSave').attr("disabled", false);
  publishDisplayItem = item;
});

$('#contentPublishModalSave').on('click', function(e) {
  var now = new Date();
  publishDisplayItem['showing'] = content[publishContentId];
  publishDisplayItem['updated'] = now.toISOString();
  $.ajax({
    type: "PUT",
    url: "/api/displays/" + publishDisplayItem['id'],
    contentType: "application/json",
    data: JSON.stringify(publishDisplayItem),
    success: function(result) {
      if (result.status == "SUCCESS") {
        setAlertMessage("<strong>Success!</strong> Now displaying '" + content[publishContentId]['name'] + "' on display '" + publishDisplayItem['name'] + "'", "success");
      } else {
        setAlertMessage("<strong>Error!</strong> Could not update content on display.", "error");
      }
      clearPublishContentModal();
    }
  });
});


// Delete Content

function clearAreYouSureModal() {
  $("#areYouSureMessage").text("");
  $("#areYouSureModalConfirm").text("");
  areYouSureItemId = null;
}

$('#contentTable').on('click', '[data-type="deleteContent"]', function(e) {
  $("#areYouSureMessage").text("Do you want to delete this content? This cannot be undone.");
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
    url: "/api/content/" + areYouSureItemId,
    success: function(result) {
      console.log("Success");
      var table = $('#contentTable').DataTable();
      table.row("#" + areYouSureItemId).remove().draw();
      setAlertMessage("<strong>Success!</strong> Content has been deleted.", "success");
      clearAreYouSureModal();
    },
    error: function(result) {
      console.log("Failed!");
      console.log(result);
      setAlertMessage("<strong>Error!</strong> Could not delete content.", "error");
    }
  });
});