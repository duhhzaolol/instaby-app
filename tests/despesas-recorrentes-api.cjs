const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'..');
const req=require('module').createRequire(repo+'/package.json'),ts=req('typescript');
const cache=new Map();
let state,writes,transactions,allowed=true;
function reset(changes={}) {
  state={despesas:[{id:'despesa',descricao:'Internet',valor:129.90,tipo:'fixa',categoriaFinanceira:'despesa_fixa',categoria:'Internet',status:'pendente',recorrente:false,origemRecorrenteId:null,data:new Date('2026-09-01T00:00:00Z'),vencimento:new Date('2026-09-20T03:00:00Z'),dataPagamento:null,...changes}],pagamentos:[]};
  writes=0;transactions=0;allowed=true;
}
const prisma={$transaction:async(fn,options)=>{
  transactions++;assert.equal(options.isolationLevel,'Serializable');const db=structuredClone(state);
  const result=await fn({
    despesa:{
      findUnique:async({where})=>{const row=db.despesas.find(d=>d.id===where.id);return row?{...row,pagamentos:db.pagamentos.filter(p=>p.despesaId===row.id)}:null;},
      update:async({where,data})=>{writes++;const row=db.despesas.find(d=>d.id===where.id);Object.assign(row,data);return structuredClone(row);},
      create:async({data})=>{writes++;const row={id:'nova',...data};db.despesas.push(row);return structuredClone(row);},
    },
    pagamento:{create:async({data})=>{writes++;const row={id:'p-novo',...data};db.pagamentos.push(row);return row;}},
  });
  state=db;return result;
}};
const mocks={
  '@/lib/prisma':{prisma},
  '@/lib/permissoes':{exigirPermissaoApi:async()=>allowed?{usuario:{id:'mock'}}:{erro:new Response('{}',{status:403})}},
};
function load(rel){if(cache.has(rel))return cache.get(rel);const mod={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(repo,rel),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;new Function('require','module','exports',code)(id=>id in mocks?mocks[id]:id.startsWith('@/')?load(id.slice(2)+'.ts'):req(id),mod,mod.exports);cache.set(rel,mod.exports);return mod.exports;}
const patch=load('app/api/despesas/[id]/route.ts').PATCH,post=load('app/api/despesas/route.ts').POST;
const request=body=>({json:async()=>body}),params={params:{id:'despesa'}};
let passed=0;
async function test(name,fn){reset();await fn();passed++;console.log('PASS '+name);}
(async()=>{
  await test('Ativa modelo parcial preservando competência, vencimento, valor e baixa existente',async()=>{
    state.pagamentos=[{id:'parcial',despesaId:'despesa',valor:29.90,data:new Date('2026-09-10T14:00:00Z')}];const before=structuredClone(state);
    const response=await patch(request({recorrente:true}),params);assert.equal(response.status,200);assert.equal(state.despesas[0].recorrente,true);assert.deepEqual(state.pagamentos,before.pagamentos);assert.deepEqual({...state.despesas[0],recorrente:false},before.despesas[0]);assert.equal(writes,1);
  });
  await test('Desativa modelo parcial sem apagar despesa ou pagamento',async()=>{
    state.despesas[0].recorrente=true;state.pagamentos=[{id:'parcial',despesaId:'despesa',valor:29.90,data:new Date('2026-09-10T14:00:00Z')}];const before=structuredClone(state);
    const response=await patch(request({recorrente:false}),params);assert.equal(response.status,200);assert.equal(state.despesas[0].recorrente,false);assert.deepEqual(state.pagamentos,before.pagamentos);assert.equal(state.despesas[0].status,'pendente');assert.equal(state.despesas[0].valor,129.90);assert.equal(writes,1);
  });
  await test('Ativar pago legado materializa somente pagamento antigo com data original',async()=>{
    state.despesas[0].status='pago';state.despesas[0].dataPagamento=new Date('2026-09-10T00:00:00Z');
    const response=await patch(request({recorrente:true}),params);assert.equal(response.status,200);assert.equal(state.despesas[0].status,'pago');assert.equal(state.pagamentos.length,1);assert.equal(state.pagamentos[0].valor,129.90);assert.equal(state.pagamentos[0].data.toISOString(),'2026-09-10T03:00:00.000Z');
    const second=await patch(request({recorrente:false}),params);assert.equal(second.status,200);assert.equal(state.pagamentos.length,1);assert.equal(state.despesas[0].recorrente,false);
  });
  await test('Alterar recorrência de pago com baixa não registra dinheiro novamente',async()=>{
    state.despesas[0].status='pago';state.pagamentos=[{id:'p-original',despesaId:'despesa',valor:129.90,data:new Date('2026-09-20T13:00:00Z')}];const before=structuredClone(state.pagamentos);
    assert.equal((await patch(request({recorrente:true}),params)).status,200);assert.deepEqual(state.pagamentos,before);assert.equal(writes,1);
  });
  await test('Filho parcial não vira modelo: conflito antes de qualquer escrita',async()=>{
    state.despesas[0].origemRecorrenteId='modelo-original';state.pagamentos=[{id:'p-original',despesaId:'despesa',valor:29.90,data:new Date('2026-09-20T13:00:00Z')}];const before=structuredClone(state);
    const response=await patch(request({recorrente:true,valor:140}),params);assert.equal(response.status,409);assert((await response.json()).erro.includes('conta original'));assert.equal(writes,0);assert.deepEqual(state,before);
  });
  await test('Filho pago legado é bloqueado antes até de materializar baixa antiga',async()=>{
    state.despesas[0].origemRecorrenteId='modelo-original';state.despesas[0].status='pago';const before=structuredClone(state);
    assert.equal((await patch(request({recorrente:true}),params)).status,409);assert.equal(writes,0);assert.deepEqual(state,before);
  });
  await test('Filho continua editável sem ativar nova recorrência ou mexer no modelo',async()=>{
    state.despesas[0].origemRecorrenteId='modelo-original';const response=await patch(request({descricao:'Internet de setembro',valor:130}),params);assert.equal(response.status,200);assert.equal(state.despesas[0].descricao,'Internet de setembro');assert.equal(state.despesas[0].origemRecorrenteId,'modelo-original');assert.equal(state.despesas[0].recorrente,false);
  });
  await test('API rejeita recorrência não booleana antes de abrir transação',async()=>{
    for(const recorrente of ['true',1,null,{}])assert.equal((await patch(request({recorrente}),params)).status,400);assert.equal(transactions,0);assert.equal(writes,0);
  });
  await test('POST com categoria operacional e sem tipo grava fixa, sem inventar recorrência',async()=>{
    const response=await post(request({descricao:'Internet',valor:129.90,categoriaFinanceira:'despesa_fixa',status:'pendente',data:'2026-10-01'}));assert.equal(response.status,201);assert.equal(state.despesas[1].tipo,'fixa');assert.equal(state.despesas[1].categoriaFinanceira,'despesa_fixa');assert.equal(state.despesas[1].recorrente,false);assert.equal(state.pagamentos.length,0);
  });
  await test('POST e PATCH respeitam categoria explícita acima do tipo antigo',async()=>{
    const response=await post(request({descricao:'Papel',valor:10,categoriaFinanceira:'despesa_variavel',tipo:'fixa',status:'pendente'}));assert.equal(response.status,201);assert.equal(state.despesas[1].tipo,'flexivel');
    assert.equal((await patch(request({categoriaFinanceira:'despesa_fixa',tipo:'flexivel'}),params)).status,200);assert.equal(state.despesas[0].tipo,'fixa');
  });
  await test('Gravações seguem protegidas por permissão financeira',async()=>{
    allowed=false;assert.equal((await patch(request({recorrente:true}),params)).status,403);assert.equal((await post(request({descricao:'Internet',valor:10}))).status,403);assert.equal(transactions,0);assert.equal(writes,0);
  });
  console.log(`RESULT ${passed} verificações transacionais/API sem banco real.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
