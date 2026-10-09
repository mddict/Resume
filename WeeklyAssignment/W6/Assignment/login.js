

window.onload = loginLoad;

function loginLoad() {
    
}

function checkLogin(event) {

    if (event) {
        event.preventDefault();
    }

    const users = [{username: "admin", password: "123456"}];

    if (storedUsername && storedPassword) {
        
    }

    if (users.length === 0) {
        alert("ไม่พบข้อมูลผู้ใช้ในระบบ กรุณาลงทะเบียนที่หน้า Register ก่อน");
        window.location.href = "register.html";
        return false;
    }

    let isLoginSuccess = false;

    if (isLoginSuccess) {
        alert("Login success! ยินดีต้อนรับเข้าสู่ระบบ");
        return true;
    } else {
        alert("Username หรือ password ไม่ถูกต้อง");
        return false;
    }
}