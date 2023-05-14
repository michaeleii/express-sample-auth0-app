let chat = document.getElementById("chatForm");
let chatInput = document.getElementById("chatInput");
let msgSender = document.getElementById("sender");
let messageContainer = document.getElementById("messageContainer");
let feedback = document.getElementById("feedback");

pubnub.subscribe({
  channels: ["chatroom-1"],
});

pubnub.fetchMessages(
  {
    channels: ["chatroom-1"],
    count: 5,
  },
  function (status, response) {
    response.channels["chatroom-1"].forEach(({ message }) => {
      createMessage(message);
    });
  }
);

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
  signal: ({ message }) => {
    if (message.sender === msgSender.value) return;
    if (message.typing) {
      feedback.innerHTML = `<p><em>${message.sender} is typing a message...</em></p>`;
    } else {
      feedback.innerHTML = "";
    }
  },
};
pubnub.addListener(listener);

const createMessage = ({ text, sender, timestamp }) => {
  const messageElement =
    sender !== msgSender.value
      ? `
      <div class="message message-right">
          <div class="message-text">${text}</div>
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
      </div>
  `
      : ` <div class="message">
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
          <div class="message-text sender">${text}</div>
      </div>`;
  messageContainer.innerHTML += messageElement;
};

const publishMessage = async (message) => {
  // With the right payload, you can publish a message, add a reaction to a message,
  // send a push notification, or send a small payload called a signal.
  const publishPayload = {
    channel: "chatroom-1",
    message: {
      text: message,
      sender: msgSender.value,
      timestamp: Date.now(),
    },
  };
  await pubnub.publish(publishPayload);
};

chat.addEventListener("submit", async (e) => {
  e.preventDefault();
  let message = chatInput.value;
  await pubnub.signal({
    channel: "chatroom-1",
    message: {
      sender: msgSender.value,
      typing: false,
    },
  });
  await publishMessage(message);
  chatInput.value = "";
});

let isTyping = false; // Track the typing state
let typingTimeout; // Store the reference to the timeout

chatInput.addEventListener("keydown", async (e) => {
  if (e.key === "Backspace" || e.key === "Delete") {
    // User removed the message they were typing
    clearTimeout(typingTimeout);
    isTyping = false;

    await pubnub.signal({
      channel: "chatroom-1",
      message: {
        sender: msgSender.value,
        typing: false,
      },
    });
  } else {
    // User is typing a message
    if (!isTyping) {
      await pubnub.signal({
        channel: "chatroom-1",
        message: {
          sender: msgSender.value,
          typing: true,
        },
      });
    }

    isTyping = true;

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(async () => {
      await pubnub.signal({
        channel: "chatroom-1",
        message: {
          sender: msgSender.value,
          typing: false,
        },
      });
      isTyping = false;
    }, 1000);
  }
});
