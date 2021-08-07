const dotenv = require('dotenv');
const db = require('./config/database');

process.on('uncaughtException', (err) => {
  console.log('uncaught exception!! shutting down');
  console.log(err.name, err.message);
  process.exit(1);
});

db.authenticate()
  .then(() => console.log('db connection successfully'))
  .catch((err) => console.log(err));

dotenv.config({ path: './config.env' });
const app = require('./app');

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!! shutting down');
  server.close(() => {
    process.exit(1);
  });
});
