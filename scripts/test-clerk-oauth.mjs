import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);

const source = readFileSync(new URL('../src/lib/clerkOAuth.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});

const module = { exports: {} };
vm.runInNewContext(outputText, { module, exports: module.exports, require }, { filename: 'clerkOAuth.cjs' });

const { CLERK_OAUTH_REDIRECT_OPTIONS, startClerkOAuth } = module.exports;
const normalize = (value) => JSON.parse(JSON.stringify(value));

async function run(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

await run('Clerk OAuth uses the expected redirect options', () => {
  assert.deepEqual(normalize(CLERK_OAUTH_REDIRECT_OPTIONS), {
    redirectUrl: '/sso-callback',
    redirectUrlComplete: '/perform',
    continueSignIn: true,
    continueSignUp: true,
  });
});

await run('Google sign-in calls Clerk authenticateWithRedirect', async () => {
  const calls = [];
  await startClerkOAuth({
    authenticateWithRedirect: async (params) => {
      calls.push(params);
    },
  }, 'oauth_google');

  assert.deepEqual(normalize(calls), [{
    strategy: 'oauth_google',
    redirectUrl: '/sso-callback',
    redirectUrlComplete: '/perform',
    continueSignIn: true,
    continueSignUp: true,
  }]);
});

await run('Apple sign-in calls Clerk authenticateWithRedirect', async () => {
  const calls = [];
  await startClerkOAuth({
    authenticateWithRedirect: async (params) => {
      calls.push(params);
    },
  }, 'oauth_apple');

  assert.deepEqual(normalize(calls), [{
    strategy: 'oauth_apple',
    redirectUrl: '/sso-callback',
    redirectUrlComplete: '/perform',
    continueSignIn: true,
    continueSignUp: true,
  }]);
});

await run('OAuth reports a clear error when Clerk sign-in is not ready', async () => {
  await assert.rejects(
    () => startClerkOAuth(null, 'oauth_google'),
    /Sign-in is still loading/,
  );
});

console.log('All Clerk OAuth unit tests passed.');
