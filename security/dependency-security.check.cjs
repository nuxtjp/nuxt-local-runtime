const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createRequire } = require('node:module');
const { generateKeyPairSync, sign, privateEncrypt, constants } = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
function dependency(name, version) {
  const { installedDependencies } = require('./resolved-dependency.cjs');
  const matches = installedDependencies(process.cwd(), name, version);
  assert.equal(matches.length, 1, 'Expected one active locked dependency implementation');
  return createRequire(matches[0])(name);
}
const braces = dependency('braces', '3.0.3');
const forge = dependency('node-forge', '1.4.0');
test('brace compilation, expansion and stringification retain ordinary behavior', () => {
  assert.equal(braces.compile('src/{a,b}.vue'), 'src/(a|b).vue');
  assert.deepEqual(braces.expand('src/{a,b}.vue'), ['src/a.vue', 'src/b.vue']);
  assert.equal(braces.stringify(braces.parse('src/{a,b}.vue')), 'src/{a,b}.vue');
  assert.equal(braces.compile('src/\\{a,b\\}.vue'), 'src/{a,b}.vue');
});
test('deep brace, parenthesis and caller AST inputs reject before stack exhaustion', () => {
  for (const pattern of ['{'.repeat(6000) + 'a,b' + '}'.repeat(6000), '('.repeat(6000) + 'x' + ')'.repeat(6000), '{'.repeat(6000) + 'x']) {
    for (const fn of [braces.compile, braces.expand, braces.stringify, braces.parse]) assert.throws(() => fn(pattern), SyntaxError);
  }
  let ast = { type: 'text', value: 'x' };
  for (let i = 0; i < 6000; i++) ast = { type: 'root', nodes: [ast] };
  for (const fn of [braces.compile, braces.expand, braces.stringify]) assert.throws(() => fn(ast), SyntaxError);
  const cyclic = { type: 'root', nodes: [] }; cyclic.nodes.push(cyclic);
  assert.throws(() => braces.compile(cyclic), SyntaxError);
});
test('RSA verifier accepts standard signatures and rejects extra or malformed DigestAlgorithm elements', () => {
  const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const publicKey = forge.pki.publicKeyFromPem(keys.publicKey.export({ type: 'spki', format: 'pem' }));
  const data = Buffer.from('never-issued security regression fixture');
  const md = forge.md.sha256.create(); md.update(data.toString('binary'));
  const digest = md.digest().getBytes();
  assert.equal(publicKey.verify(digest, sign('sha256', data, keys.privateKey).toString('binary')), true);
  const a = forge.asn1;
  const oid = () => a.create(a.Class.UNIVERSAL, a.Type.OID, false, a.oidToDer(forge.oids.sha256).getBytes());
  const nil = value => a.create(a.Class.UNIVERSAL, a.Type.NULL, false, value);
  for (const parameters of [[oid(), nil(''), oid()], [oid(), a.create(a.Class.UNIVERSAL, a.Type.SEQUENCE, true, [oid()])], [oid(), nil('x')]]) {
    const info = a.create(a.Class.UNIVERSAL, a.Type.SEQUENCE, true, [a.create(a.Class.UNIVERSAL, a.Type.SEQUENCE, true, parameters), a.create(a.Class.UNIVERSAL, a.Type.OCTETSTRING, false, digest)]);
    const encoded = Buffer.from(a.toDer(info).getBytes(), 'binary');
    const signature = privateEncrypt({ key: keys.privateKey, padding: constants.RSA_PKCS1_PADDING }, encoded).toString('binary');
    let accepted = false;
    try { accepted = publicKey.verify(digest, signature); } catch { /* Rejection is the expected result for a malformed signature. */ }
    assert.equal(accepted, false, 'Malformed algorithm must not verify');
  }
});

test('active dependency graph uses every required upstream security version', () => {
  const policy = JSON.parse(fs.readFileSync(path.join(__dirname, 'dependency-versions.json'), 'utf8'));
  const { installedDependencies } = require('./resolved-dependency.cjs');
  for (const [name, version] of Object.entries(policy.overrides)) {
    const matches = installedDependencies(process.cwd(), name);
    assert.ok(matches.length > 0, 'Required dependency is absent: ' + name);
    for (const manifest of matches) assert.equal(JSON.parse(fs.readFileSync(manifest, 'utf8')).version, version, name);
  }
});
