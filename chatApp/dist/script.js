$(() => {
  $("#send").click(() => {
    addMessage({ name: "Mathias", message: "Hej" });
  });

  getMessages();
});

function addMessage(message) {
  $("#messages").append(`<h4>${message.name}</h4><p>${message.message}</p>`);
}

function getMessages() {
    $.get("http://localhost:3000/messages", (data) => {
        data.forEach(addMessage);
  });
}
