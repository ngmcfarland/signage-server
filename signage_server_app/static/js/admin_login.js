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


$('#loginForm').submit(function(e) {
  e.preventDefault();
  var form = $(this);
  var url = form.attr('action');

  $.ajax({
    type: "POST",
    url: url,
    data: form.serialize(), // serializes the form's elements.
    success: function(data) {
      console.log(data);
      if (data.status == "SUCCESS") {
        window.location.replace(data.endpoint);
      } else {
        setAlertMessage(data.message, "error");
        $('#pwd').val("");
        $('#pwd').focus();
      }
    }
  });
});


$(document).ready(function() {
  $('#pwd').focus();
});