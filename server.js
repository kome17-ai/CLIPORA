const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname, { extensions: ['html'] }));
app.get('/health', (req, res) => res.send('ok'));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, '0.0.0.0', () => console.log('Clipora on ' + PORT));
