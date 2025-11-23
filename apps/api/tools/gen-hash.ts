import * as bcrypt from 'bcrypt';
import * as readline from 'node:readline';

const SALT_ROUNDS = 10; // Must match the value used in lib/auth.ts:hashPassword()
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Promisified function to read user input from the terminal
 */
function readInput(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

async function generateHashScript() {
  console.log('\n--- 🔑 Hash Generator ---');
  console.log(`Salt Rounds: ${SALT_ROUNDS}`);
  console.log('-------------------------------');
  
  // 1. パスワードの入力を受け付ける
  const password = await readInput('Enter password to hash: ');
  
  if (!password) {
    console.log('Input cannot be empty. Exiting.');
    rl.close();
    return;
  }

  try {
    // 2. ハッシュ化を実行
    console.log('Hashing...');
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    
    // 3. 結果を表示
    console.log('-------------------------------');
    console.log('✅ Generated Hash (Copy this for seed.ts or DB):');
    console.log(hashed);
    console.log('-------------------------------');

  } catch (error) {
    console.error('An error occurred during hashing:', error);
  } finally {
    rl.close();
  }
}

generateHashScript();