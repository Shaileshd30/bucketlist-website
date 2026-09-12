export const currencies=['INR','USD','EUR','GBP','AED','SGD','AUD','THB','NPR'];
export const categories=['TRANSPORT','HOTEL','MEALS','GUIDE','PERMITS','ACTIVITY','MARKETING','MISCELLANEOUS'];
export type FinanceRow={id:string;[key:string]:string|number|boolean|null};
export type FinanceData={vendors:FinanceRow[];accounts:FinanceRow[];contracts:FinanceRow[];payments:FinanceRow[];expenses:FinanceRow[];sources:FinanceRow[];audit:FinanceRow[]};
export const emptyFinance:FinanceData={vendors:[],accounts:[],contracts:[],payments:[],expenses:[],sources:[],audit:[]};
export const str=(v:unknown)=>v==null?'':String(v);
export function contractTotals(c:FinanceRow,payments:FinanceRow[]){
 const valid=payments.filter(p=>p.contract_id===c.id&&!p.void_reason);
 const paid=valid.reduce((s,p)=>s+Math.round(Number(p.amount)*100),0)/100;
 const paidInr=valid.reduce((s,p)=>s+Math.round(Number(p.amount_inr)*100),0)/100;
 const remaining=Math.max(0,Math.round((Number(c.contract_amount)-paid)*100)/100);
 const estimate=Math.round(remaining*Number(c.planning_fx_rate)*100)/100;
 return {paid,paidInr,remaining,estimate,cost:paidInr+estimate};
}
export function accountTotals(a:FinanceRow,d:FinanceData){
 const source=d.sources.find(s=>s.id===a.reference_id&&s.account_type===a.account_type);
 const contracts=d.contracts.filter(c=>c.account_id===a.id).map(c=>contractTotals(c,d.payments));
 const expenses=d.expenses.filter(e=>e.account_id===a.id&&!e.void_reason).reduce((s,e)=>s+Math.round(Number(e.amount_inr)*100),0)/100;
 const cost=contracts.reduce((s,c)=>s+c.cost,expenses),balance=contracts.reduce((s,c)=>s+c.estimate,0),revenue=Number(source?.revenue||0);
 return {revenue,cost,balance,profit:revenue-cost,review:!source||Boolean(source.review)};
}
