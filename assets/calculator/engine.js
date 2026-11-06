import { formulas } from './formulas.js';
export const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n || 0);
export const isInput = f => !['Total','Html','Line','Group','section','page-break'].includes(f.type);
export function initialValues(model){
  return Object.fromEntries(model.fields.filter(isInput).map(f=>{
    const d=f.default;
    const value=f.options ? (d ? Number(f.options[Number(String(d).split('_')[1])]?.optionValue || 0):0) : f.type==='Text Area'?'':Number(d || 0);
    return [f.alias,value];
  }));
}
function matches(c,value,field){
  if(c.key==='any')return value!==0 && value!=='';
  let target=c.value;
  if(target==='' && field?.options && Number.isInteger(Number(c.key)))target=field.options[Number(c.key)]?.optionValue;
  if(c.condition==='contains'){
    const checks=c.checkedValues || [];
    return checks.length ? checks.some(x=>Number(x.value ?? x.optionValue ?? x)===Number(value) || Number(field?.options?.[Number(x)]?.optionValue)===Number(value)):value!==0;
  }
  const n=Number(value), t=Number(target);
  switch(c.condition){case '==':return n===t;case '!=':return n!==t;case '>=':return n>=t;case '<=':return n<=t;case '>':return n>t;case '<':return n<t;default:return false;}
}
export function conditionMatches(action,value,field){
  return action.conditions.reduce((result,c,i)=>{
    const next=matches(c,value,field);
    return i===0?next:c.logicalOperator==='&&'?result && next:result || next;
  },false);
}
export function calculate(model,raw,changed){
  const fields=Object.fromEntries(model.fields.map(f=>[f.alias,f]));
  // Package presets only change when the package itself changes, not when editing its add-ons.
  for(const r of model.conditions){
    if(r.optionsFrom!==changed)continue;
    for(const a of r.condition){
      if(a.action==='select_option' && conditionMatches(a,raw[r.optionsFrom],fields[r.optionsFrom])){
        raw[r.optionsTo]=Number(fields[r.optionsTo]?.options?.[Number(a.setVal)]?.optionValue || 0);
      }
    }
  }
  let visible=Object.fromEntries(model.fields.map(f=>[f.alias,!f.hidden]));
  const values={};
  for(let pass=0;pass<4;pass++){
    for(const f of model.fields){
      if(!isInput(f))continue;
      values[f.alias]=visible[f.alias]? (f.type==='Text Area'?0:Number(raw[f.alias]||0)*(f.type==='Quantity' && f.multiply?Number(f.unit||1):1)):0;
    }
    const next={...visible};
    const groups={};
    for(const r of model.conditions){
      for(const a of r.condition){
        if(!['show','hide'].includes(a.action))continue;
        (groups[r.optionsTo]??=[]).push({a,match:conditionMatches(a,values[r.optionsFrom],fields[r.optionsFrom])});
      }
    }
    for(const [id,actions] of Object.entries(groups)){
      const show=actions.filter(x=>x.a.action==='show');
      next[id]=show.length?show.some(x=>x.match):!fields[id]?.hidden;
      if(actions.some(x=>x.a.action==='hide' && x.match))next[id]=false;
    }
    visible=next;
  }
  // Evaluate formulas by dependency instead of relying on their archived display order.
  const totals={},active=new Set();
  const v=new Proxy(values,{get(target,id){
    if(id in formulas){
      if(id in totals)return totals[id];
      if(active.has(id))throw Error('Circular pricing formula: '+id);
      active.add(id);let n=Number(formulas[id](v))||0;
      // Original subtotal forgot coffee although it offered a paid coffee add-on.
      if(id==='total_field_id_83')n+=v.total_field_id_56;
      active.delete(id);totals[id]=Number.isFinite(n)?n:0;return totals[id];
    }
    return target[id]||0;
  }});
  for(const id of Object.keys(formulas))void v[id];
  // Signs here mirror how components enter the source subtotal (not their unsigned helper values).
  const componentIds=[6,16,17,20,23,24,30,31,49,32,40,65,39,25,55,41,42,43,56,67,57,72,75,78,79,70];
  const lines=componentIds.map(id=>{
    const key='total_field_id_'+id;let value=totals[key]||0;
    if([49,65].includes(id))value=-value;
    if(id===31 && Number(raw.radio_field_id_7)!==1)value=0;
    return {id:key,label:fields[key].label,value};
  }).filter(x=>Math.abs(x.value)>0.000001);
  return {visible,values,totals,lines};
}
