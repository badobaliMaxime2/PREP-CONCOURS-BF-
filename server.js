const express = require('express');
const app = express();
app.use(express.json());
app.use('/api/admin', require('./admin'));
app.use('/admin', express.static('public/admin'));
app.listen(process.env.PORT || 3000, () => console.log('Serveur prêt'));
