const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/Login-Signup").then(() => {
    console.log("Connected to mongodb");
}).catch((e) => {
    console.log("Not connected to mongodb");
})

// Define the User schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});
const User = mongoose.model('User', userSchema);

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
}));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/signup.html")
});

// Signup route
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            res.send('Username already exists!');
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.send('Signup successful! You can now <a href="/login">login</a>.');
    } catch (error) {
        res.status(500).send('An error occurred during signup.');
    }
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/login.html")
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the username exists
        const user = await User.findOne({ username });
        if (!user) {
            res.send('Invalid username or password!');
            return;
        }

        // Compare passwords
        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) {
            res.send('Invalid username or password!');
            return;
        }

        // Store user data in session
        req.session.user = user;

        res.redirect('/secret');
    } catch (error) {
        res.status(500).send('An error occurred during login.');
    }
});

// Secret page route
app.get('/secret', (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
        return;
    }

    res.send('Welcome to the secret page!');
});

// Start the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});
