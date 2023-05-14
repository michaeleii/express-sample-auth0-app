let chat = document.getElementById("chatForm");
let chatInput = document.getElementById("chatInput");
let sender = document.getElementById("sender");
let messageContainer = document.getElementById("messageContainer");

pubnub.subscribe({
  channels: ["chatroom-1"],
});

// pubnub.fetchMessages(
//   {
//     channels: ["chatroom-1"],
//     count: 5,
//   },
//   function (status, response) {
//     // handle status, response
//     console.log(response);
//     response.channels["chatroom-1"].forEach((message) => {
//       createMessage(message.message.text, message.message.sender);
//     });
//   }
// );

// add listener
const listener = {
  status: (statusEvent) => {
    if (statusEvent.category === "PNConnectedCategory") {
      console.log("Connected");
    }
  },
  message: ({ message }) => {
    createMessage(message);
  },
};
pubnub.addListener(listener);

const createMessage = ({ text, sender, timestamp }) => {
  const messageElement = `
    <div class="message">
    <div class="message-info">
    <div class="message-sender">${sender}</div>
    <div class="message-time">${new Date(timestamp).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    )}</div>
        </div>
        <div class="message-text">${text}</div>
    </div>
 `;
  messageContainer.innerHTML += messageElement;
};

const publishMessage = async (message) => {
  // With the right payload, you can publish a message, add a reaction to a message,
  // send a push notification, or send a small payload called a signal.
  const publishPayload = {
    channel: "chatroom-1",
    message: {
      text: message,
      sender: sender.value,
      timestamp: Date.now(),
    },
  };
  await pubnub.publish(publishPayload);
};

chat.addEventListener("submit", async (e) => {
  e.preventDefault();
  let message = chatInput.value;
  await publishMessage(message);
  document.getElementById("chatInput").value = "";
});
