let pc = 0;

window.onload = function() {
    document.getElementById("top").innerHTML = "Forum";
    document.getElementById("postBtn").onclick = postFunction;
    document.getElementById("clearBtn").onclick = clearFunction;
};

function postFunction() {
    let messageInput = document.getElementById("message");
    let textValue = messageInput.value;

    if (textValue.trim() === "") {
        alert("Please enter a message before posting.");
        return;
    }

    pc++;

    if (pc === 1) {
        document.getElementById("topic").innerHTML = textValue;
    } else if (pc === 2) {
        document.getElementById("reply1").innerHTML = textValue;
    } else if (pc === 3) {
        document.getElementById("reply2").innerHTML = textValue;
    } else {
        alert("Maximum post limit reached. Please click Clear to start over.");
    }

    messageInput.value = "";
}

function clearFunction() {
    document.getElementById("topic").innerHTML = "";
    document.getElementById("reply1").innerHTML = "";
    document.getElementById("reply2").innerHTML = "";
    document.getElementById("message").value = "";
    postCount = 0;
}