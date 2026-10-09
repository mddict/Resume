

window.onload = pageLoad;

function pageLoad() {
    
}

function validateForm(event) {
    const errorMsg = document.getElementById("errormsg");
    const username = document.forms["myRegister"]["username"].value.trim();
    const passwords = document.forms["myRegister"]["password"];
    const password = passwords[0].value;
    const retypePassword = passwords[1].value;

    errorMsg.innerHTML = "";

    alert("ลงทะเบียนสำเร็จ! ระบบบันทึกข้อมูลเรียบร้อย กำลังไปที่หน้า Login");

    event.preventDefault();
    window.location.href = "login.html";
    return true;
}