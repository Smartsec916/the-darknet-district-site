document.addEventListener('DOMContentLoaded', function () {
  // Create chat elements
  const floatingChat = document.createElement('div');
  floatingChat.className = 'floating-chat';

  const chatToggle = document.createElement('div');
  chatToggle.className = 'chat-toggle';
  chatToggle.textContent = 'Chat with Iris';

  const chatWindow = document.createElement('div');
  chatWindow.className = 'chat-window';

  // Create and set up Iris header
  const irisHeader = document.createElement('div');
  irisHeader.className = 'iris-header';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';

  const status = document.createElement('span');
  status.className = 'status-indicator';
  status.textContent = 'Online';

  // Append header elements
  irisHeader.appendChild(avatar);
  irisHeader.appendChild(status);
  chatWindow.appendChild(irisHeader);

  // Create messages container
  const chatMessages = document.createElement('div');
  chatMessages.className = 'chat-messages';
  chatWindow.appendChild(chatMessages);

  // Create input container
  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-container';
  inputContainer.style.display = 'flex';
  inputContainer.style.padding = '10px';
  inputContainer.style.gap = '10px';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type your message...';

  const sendButton = document.createElement('button');
  sendButton.className = 'enter-button';
  sendButton.textContent = '↵';

  // Append input elements
  inputContainer.appendChild(input);
  inputContainer.appendChild(sendButton);
  chatWindow.appendChild(inputContainer);

  // Build final structure
  floatingChat.appendChild(chatWindow);
  floatingChat.appendChild(chatToggle);
  document.body.appendChild(floatingChat);

  // Add initial greeting
  const greeting = document.createElement('div');
  greeting.className = 'message iris';
  greeting.textContent = '';
  chatMessages.appendChild(greeting);

  const returningUser = localStorage.getItem("hasVisitedIris");
  if (returningUser) {
    const currentMood = localStorage.getItem("irisMood") || "neutral";
    const moodReturnMessages = {
      neutral: ["Welcome back to the District.", "Back again. Let's pick up where we left off."],
      sarcastic: ["Wow, it's you again. What an honor.", "Didn't expect to see you so soon. Or at all."],
      serious: ["You're back. Good. We have work to do.", "Return acknowledged. Proceed with purpose."],
      flirty: ["Back again? You must like me.", "Couldn't stay away, huh?"],
      cold: ["You've returned. Don't waste time.", "Back. Let's skip the pleasantries."]
    };

    const messageOptions = moodReturnMessages[currentMood] || moodReturnMessages.neutral;
    const message = messageOptions[Math.floor(Math.random() * messageOptions.length)];
    typeMessage(greeting, message);
  } else {
    localStorage.setItem("hasVisitedIris", "true");
    getResponse("hello").then(response => {
      typeMessage(greeting, response);
    });
  }

  // Chat toggle functionality
  let isOpen = false;

  function toggleChat() {
    isOpen = !isOpen;
    chatWindow.style.display = isOpen ? 'block' : 'none';
    if (isOpen) {
      setTimeout(() => {
        chatWindow.classList.add('active');
        input.focus();
      }, 0);
    } else {
      chatWindow.classList.remove('active');
    }
  }

  function typeMessage(element, text) {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        element.textContent += text[i];
        chatMessages.scrollTop = chatMessages.scrollHeight;
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);
  }

  function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function handleSend() {
    const message = input.value.trim();
    if (message) {
      addMessage(message, 'user');
      input.value = '';

      setTimeout(async () => {
        const response = await getResponse(message);
        const irisDiv = document.createElement('div');
        irisDiv.className = 'message iris';
        chatMessages.appendChild(irisDiv);
        typeMessage(irisDiv, response);
      }, 500);
    }
  }

  chatToggle.addEventListener('click', toggleChat);
  sendButton.addEventListener('click', handleSend);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  });
});