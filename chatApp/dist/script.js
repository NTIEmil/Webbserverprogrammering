const socket = io();

$(() => {
  $("#send").click(() => {
    let message = { name: $("#name").val(), message: $("#message").val() };
    postMessage(message);
    $("#message").val("");
  });
  getMessages();
});

socket.on("message", addMessage);

function addMessage(message) {
  $("#messages").prepend(`<h4>${message.name}</h4><p>${message.message}</p>`);
}

function getMessages() {
  $.get("http://localhost:3000/messages", (data) => {
    data.forEach(addMessage);
  });
}

function postMessage(message) {
  $.post("http://localhost:3000/messages", message);
}
