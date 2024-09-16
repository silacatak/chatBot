const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions =document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false; // user cant send another message while the cuurent one is still generating


// API configuration
const API_KEY = "AIzaSyDY5Vl8aCqdmoesgOQsK3QnRg0GVDuA7LI";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalStorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const islightMode = (localStorage.getItem("themeColor") === "light_mode");

    //apply the stored theme
    document.body.classList.toggle("light_mode", islightMode);
    toggleThemeButton.innerText = islightMode ? "dark_mode" : "light_mode";
    // restore saved chats
    chatList.innerHTML = savedChats || "";

    document.body.classList.toggle("hide-header", savedChats); 


    chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom


}
loadLocalStorageData();

// create a new message element and return it
const createmessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}


// show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordIndex = 0; 
    // setInterval her 75 ms de işlem yapmamızı söyler.içerisine yazılan işlem belirli aralıkla tekrarlanmış olur.
    const typingInterval = setInterval(() => {
        // append each word to the text element with a space
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        // if all words are displayed
        // yazma işleminin bitirilmesi eğer kelime index i ile kelime uzunluğu aynıysa yani tüm kelimeler ekrana yazıldıysa zamanlayıcı durdurulur .
        if (currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML); // save chats to local storage
        }
        chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom

    }, 75)
}

//fetch response from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {

    const textElement = incomingMessageDiv.querySelector(".text") // get the text


    //send a post request to the API with the user's message
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            })
        });

        const data = await response.json();
        //console.log(data)
        if(!response.ok) throw new Error(data.errow.message);

        // Get the API response text
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
        //console.log(apiResponse);
        // textElement.innerText = apiResponse;
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    } catch (error) {
        isResponseGenerating = false;
        //console.log(error);
        textElement.innerText = error.message;
        textElement.classList.add("error")
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
}

// show a loading animation while for the API response
const showLoadingAnimation = () => {
    const html = `
      <div class="message content">
                <img src="Midjourney Round Logo.jpeg" alt="Gemini" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">
               content_copy
            </span>
    `;

    const incomingMessageDiv = createmessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);
    typingForm.reset();//clear input field
    chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom
    generateAPIResponse(incomingMessageDiv);
}

//Copy message text to the clipboard
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done"; // show tick icon
    setTimeout(() => copyIcon.innerText = "  content_copy", 100); // revert icon after 1 second
}

const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;

    if (!userMessage || isResponseGenerating) return; // exit if there is no message

    //console.log(userMessage);
    isResponseGenerating = true;

    const html = `
    <div class="message content">
                <img src="download.jpeg" alt="User" class="avatar">
                <p class="text"></p>
            </div>
    `;

    const outgoingMessageDiv = createmessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerHTML = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset(); // clear input field
    chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom
    document.body.classList.add("hide-header"); // hide the header once chat start
    setTimeout(showLoadingAnimation, 500); // show loading animation after a delay
}

//set userMessage and hangle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion =>{
    suggestion.addEventListener("click", ()=>{
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    })
})

// Toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
    const islightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", islightMode ? "light_mode" : "dark_mode")
    toggleThemeButton.innerText = islightMode ? "dark_mode" : "light_mode";
});

deleteChatButton.addEventListener("click" , ()=>{
    if(confirm("Are you sure you want to delete all messages?")){
        localStorage.removeItem("savedChats");
        loadLocalStorageData();
    }
})

//prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
    e.preventDefault(); // sayfanın yenilenmesi engeller veya bir bağlantıya tıklarken sayfanın başka bir Url ye yönlndirmesini durdurur

    handleOutgoingChat();
})