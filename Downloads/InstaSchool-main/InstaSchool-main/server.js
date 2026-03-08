const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Serve the static files from the Expo 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Ensure dynamic routing works by sending all requests to index.html
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
