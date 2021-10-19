const Users = require('../../config/users.json');

export function authenticate(token: string) {
  let keypair = token
    .split('.')
    .map(chnk => Buffer.from(chnk, 'base64').toString('utf-8'));
  if (keypair.length !== 2) throw new Error('Invalid Token0');

  if (Users[keypair[0]] === keypair[1])
    return Object.keys(Users)[
      Object.keys(Users).findIndex(u => u === keypair[0])
    ];
  else return null;
}

export function generateToken(user: string) {
  if (Object.keys(Users).findIndex(u => u === user) === -1)
    throw new Error('User does not exist.');
  else
    return `${Buffer.from(
      Object.keys(Users)[Object.keys(Users).findIndex(u => u === user)]
    ).toString('base64')}.${Buffer.from(Users[user]).toString('base64')}`;
}
