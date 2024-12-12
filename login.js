// login.js
document.querySelector('form').addEventListener('submit', function(event) {
    const email = document.querySelector('input[name="email"]').value;
    const password = document.querySelector('input[name="password"]').value;

    if (!email || !password) {
        event.preventDefault();
        alert("Please enter both email and password.");
    }
});
