const dotenv = require('dotenv');
const { sequelize } = require('./models');

process.on('uncaughtException', (err) => {
  console.log('uncaught exception!! shutting down');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const port = process.env.PORT || 3000;
const server = app.listen(port, async () => {
  try {
    console.log(`app running on port ${port}...`);
    await sequelize.authenticate();
    console.log('db connected');
  } catch (err) {
    console.log(err);
  }
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!! shutting down');
  server.close(() => {
    process.exit(1);
  });
});
