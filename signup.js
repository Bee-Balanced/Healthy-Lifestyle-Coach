import fs from 'fs';

export function handleSignup (req, res) {
  const {name, email, password, confirm_password } = req.body;

  // Validate that the passwords match
  if (password !== confirm_password) {
    return res.render ('signup', {error: 'Passwords do not match.'});
  }

  // Read the users.txt file and check if the email is already registered
  fs.readFile('users.txt', 'utf8', (err, data) => {
    if (err) {
      console.log(err);
      return res.send('Error reading user data');
    }
    const users = data.split('\n').map(line => {
      const [name, email, password] = line.split('/');
      return {name, email, password };
    });

    // Check if the email already exists
    const existingUser = users.find(u => u.email === email); 
    if (existingUser) {
      return res.render('signup', { error: 'Email is already registered.' });
    }

    // If the email does not exist, save the new user to the file
    const newUser = `${name}/${email}/${password}\n`;
    fs.appendFile('users.txt', newUser, (err) => {
      if (err){
        console.log(err);
        return res.send('Error saving user data');
      }
    // Redirect to login after saving the new user
     res.redirect('/login');
    });
  });
}