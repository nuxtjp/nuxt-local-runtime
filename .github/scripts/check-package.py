import pathlib,tarfile,json,hashlib,re,sys
p=pathlib.Path(sys.argv[1]);source=pathlib.Path(__file__).resolve().parents[2]
with tarfile.open(p,'r:gz') as archive:
 members=archive.getmembers();assert all(m.isfile() or m.isdir() for m in members)
 assert all(m.name.startswith('package/') and '..' not in pathlib.PurePosixPath(m.name).parts for m in members)
 files={m.name.removeprefix('package/'):archive.extractfile(m).read() for m in members if m.isfile()}
m=json.loads(files['package.json']);assert m['name']=='@nuxtjp/local-runtime' and m['version']=='0.1.0'
assert m['license']=='Apache-2.0';assert m['repository']['url']=='git+https://github.com/nuxtjp/nuxt-local-runtime.git'
assert m['publishConfig']=={'access':'public','registry':'https://registry.npmjs.org','provenance':True}
assert set(m['exports'])=={'.','./client','./guards','./types','./schema'}
for key,value in m['exports'].items():
 for target in value.values() if isinstance(value,dict) else [value]:assert target.removeprefix('./') in files,(key,target)
for section in ['dependencies','peerDependencies','optionalDependencies']:
 for name,version in m.get(section,{}).items():assert not re.match(r'file:|workspace:|link:|https?:|git',version),(name,version)
for name in ['LICENSE','NOTICE','LICENSE-PREVIOUS','src/runtime/shared/types.ts','schemas/local-runtime-v1.schema.json']:
 assert files[name]==(source/name).read_bytes(),name
assert not any(x.startswith(('.github/','playground/','test/')) or x.endswith(('.map','.tgz')) for x in files)
assert all(x.startswith(('dist/','schemas/','src/runtime/shared/types.ts')) or x in ['package.json','README.md','LICENSE','NOTICE','LICENSE-PREVIOUS'] for x in files)
pattern=rb'ghp_[A-Za-z0-9]{20,}|npm_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|/home/[^/\s]+/|[A-Z]:\\Users\\|https://[^ /]+:[^ /]+@'
assert not any(re.search(pattern,v) for v in files.values()),'bounded credential/path scan failed'
print(json.dumps({'name':m['name'],'version':m['version'],'files':len(files),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'licenses_schema_raw_types':'identical to source','bounded_scan':'pass; not a complete confidentiality proof'},indent=2))
