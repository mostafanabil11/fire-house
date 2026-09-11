#!/usr/bin/env node
/**
 * Creates (or promotes) the restaurant's admin account.
 *
 * Run it once per deployment, by hand:
 *
 *   npm run create:admin
 *
 * The password is typed into this prompt and never appears in a command line,
 * a shell history file, an environment variable or this repository. If the
 * email already exists the account is promoted to admin and its password left
 * alone, so this is safe to re-run.
 */

const path = require('path');
const readline = require('readline');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Same precedence the app uses: .env.local wins over .env.
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MIN_PASSWORD_LENGTH = 12;

function ask(question, { hidden = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise(resolve => {
    if (!hidden) {
      rl.question(question, answer => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    // Suppress the echo so a shoulder-surfer (or a screen share) does not see
    // the password being typed.
    process.stdout.write(question);
    const onData = char => {
      if (['\n', '\r', ''].includes(char.toString())) return;
      rl.output.write('\x1B[2K\x1B[200D' + question + '*'.repeat(rl.line.length));
    };
    rl.input.on('data', onData);

    rl.question('', answer => {
      rl.input.off('data', onData);
      rl.close();
      process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set — check Backend/.env or Backend/.env.local');
    process.exit(1);
  }

  const email = (await ask('Admin email: ')).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('That is not a valid email address.');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const users = client.db().collection('users');

  const existing = await users.findOne({ email });

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`\n${email} is already an admin. Nothing to do.`);
    } else {
      await users.updateOne({ _id: existing._id }, { $set: { role: 'admin' } });
      console.log(`\nPromoted ${email} to admin. Their existing password still works.`);
    }
    await client.close();
    return;
  }

  const firstName = (await ask('First name: ')) || 'Restaurant';
  const lastName = (await ask('Last name: ')) || 'Owner';
  const password = await ask('Password: ', { hidden: true });

  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`\nPassword must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    await client.close();
    process.exit(1);
  }

  const confirm = await ask('Confirm password: ', { hidden: true });
  if (password !== confirm) {
    console.error('\nThose passwords do not match.');
    await client.close();
    process.exit(1);
  }

  await users.insertOne({
    email,
    password: await bcrypt.hash(password, 12),
    firstName,
    lastName,
    role: 'admin',
    // Pre-verified: this account is created by whoever owns the database, so
    // there is no address to prove ownership of, and an admin locked out
    // waiting for an email is a bad first five minutes.
    isEmailVerified: true,
    emailVerificationOtp: null,
    otpExpiresAt: null,
    loginAttempts: 0,
    lastLoginAttempt: null,
    lockedUntil: null,
    authProvider: 'local',
    refreshTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`\nCreated admin ${email}. Sign in at /login, then open /admin.`);
  await client.close();
}

main().catch(err => {
  console.error(`Could not create the admin account: ${err.message}`);
  process.exit(1);
});
