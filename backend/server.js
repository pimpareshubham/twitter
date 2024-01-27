const express = require('express');
const PORT = 5000;
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const { MONGODB_URL } = require('./config')

global.__basedir = __dirname;
mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', () => {
    console.log("DB connected");
})
mongoose.connection.on('error', (error) => {
    console.log("Some error while connecting to DB");
})

require('./models/user_model');
require('./models/post_model');

app.use(cors(
  {
    origin: ["https://twitter-fe-delta.vercel.app"],
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true
  }
));

app.use(express.json());

app.use(require('./routes/user_route'));
app.use(require('./routes/post_route'));
app.use(require('./routes/file_route'));

app.listen(PORT, () => {
    console.log("Server started");
});
