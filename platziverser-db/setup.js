const debug = require('debug')('platziverse:db:setup');
const db = require('./index');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { bgRed } = require('chalk');

const promp = inquirer.createPromptModule();

async function setUp() {
  const answer = await promp({
    type: 'confirm',
    name: 'setup',
    message: 'This will destry your database, are you sure?',
  });
  if (!answer.setup) {
    return console.log('Nothing happened :)');
  }

  const config = {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'platzi',
    password: process.env.DB_PASS || 'platzi',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: (s) => debug(s),
    setup: true,
  };

  await db(config).catch(handleFatalError);
  console.log(chalk.bgGreenBright.black('Success'));
  process.exit(0);
}

function handleFatalError(err) {
  console.error(bgRed.white(err.message));
  console.error(err.stack);
  process.exit(1);
}

setUp();
