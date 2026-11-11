const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function boot(serverTheme,storage,key='cbr.theme.1') {
 const source=fs.readFileSync('templates/components/theme_bootstrap.html','utf8').replace('<script>','').replace('</script>','').replace('{{ theme_storage_key|tojson }}',JSON.stringify(key)).replace('{{ initial_theme|tojson }}',JSON.stringify(serverTheme));
 const root={dataset:{},style:{}},meta={content:''};
 const document={documentElement:root,body:null,querySelector:()=>meta};
 const context={window:{},document,localStorage:storage};vm.runInNewContext(source,context);return{api:context.window.cbrTheme,root,meta,document};
}
test('cached selection is applied before body exists and survives a delayed server save',()=>{
 const stored=new Map([['cbr.theme.1','light']]);const storage={getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v)};
 const {api,root,meta,document}=boot('dark',storage);
 assert.equal(root.dataset.theme,'light');assert.equal(root.style.backgroundColor,'#f0f4f8');assert.equal(meta.content,'#f0f4f8');
 let light=false;document.body={classList:{toggle:(_,value)=>{light=value;}}};api.apply(api.current());assert.equal(light,true);
 api.apply('dark',true);assert.equal(stored.get('cbr.theme.1'),'dark');assert.equal(light,false);
});
test('server preference works when browser storage is blocked',()=>{
 const {api,root}=boot('light',{getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}});
 assert.equal(root.dataset.theme,'light');assert.doesNotThrow(()=>api.apply('dark',true));assert.equal(api.current(),'dark');
});
test('preferences are scoped to the signed-in account',()=>{
 const storage={getItem:k=>k==='cbr.theme.1'?'light':null};
 assert.equal(boot('dark',storage,'cbr.theme.2').api.current(),'dark');
});
