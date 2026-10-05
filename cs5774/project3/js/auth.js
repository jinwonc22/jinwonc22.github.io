// PLACEHOLDER FOR FORM VALIDATION, test "account is "admin" and "password"
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("login-form").addEventListener("submit", function (e) {
        e.preventDefault();

        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        if (username === "admin" && password === "password") {
            alert("Sign in successful!");
        }
        else {
            alert("Invalid username or password.");
        }
    });
});