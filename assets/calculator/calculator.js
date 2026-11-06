import {calculate,initialValues,isInput,money} from './engine.js';
const root=document.getElementById('wedding-calculator');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>root.querySelector(s);
const asset=url=>url.startsWith('/')?root.dataset.prefix+url.slice(1):url;
async function start(){
 const response=await fetch(root.dataset.model);if(!response.ok)throw Error('Model unavailable');
 const model=await response.json(),raw=initialValues(model);
 const fields=Object.fromEntries(model.fields.map(f=>[f.alias,f]));
 let result;
 const optionsForm=$('#calc-options');
 function fieldMarkup(f){
  const id=f.alias, required=f.required?' required':'',description=f.description?`<p class="calc-description" id="${id}-desc">${esc(f.description)}</p>`:'';
  if(f.type==='Total')return '';
  if(f.type==='Line')return `<hr data-field="${id}">`;
  if(f.type==='Html'){
   let html=f.htmlContent.replace(/(src|href)="(\/[^"\s]*)"/g,(_,a,u)=>`${a}="${esc(asset(u))}"`);
   return `<div class="calc-html" data-field="${id}">${html}</div>`;
  }
  let input='';
  if(f.options && f.type==='Drop Down'){
   input=`<select id="${id}" name="${id}"${required} aria-describedby="${id}-desc"><option value="">Choose…</option>${f.options.map(o=>`<option value="${o.optionValue}">${esc(o.optionText)}</option>`).join('')}</select>`;
  }else if(f.options){
   const check=['Checkbox With Image','Toggle'].includes(f.type);
   input=`<div class="calc-choices ${f.options.some(o=>o.src)?'calc-image-choices':''}">${f.options.map((o,i)=>`<label class="calc-choice"><input id="${id}-${i}" type="${check?'checkbox':'radio'}" name="${id}" value="${o.optionValue}"${required}><span>${o.src?`<img src="${esc(asset(o.src))}" alt="" loading="lazy">`:''}${esc(o.optionText)}${o.optionHint?`<small>${esc(o.optionHint)}</small>`:''}</span></label>`).join('')}</div>`;
  }else if(f.type==='Text Area'){
   const type=id==='text_field_id_87'?'email':id==='text_field_id_86'?'tel':'text';
   input=`<input id="${id}" name="${id}" type="${type}" maxlength="${f.numberOfCharacters||150}" placeholder="${esc(f.placeholder)}"${required}>`;
  }else{
   const min=f.minValue??f.min??0,max=f.maxValue??f.max??1000000;
   input=`<input id="${id}" name="${id}" type="number" inputmode="numeric" min="${min}" max="${max}" step="${f.type==='Range Button'?1:f.step||1}"${required} aria-describedby="${id}-desc">`;
  }
  return `<fieldset class="calc-field" data-field="${id}"><legend>${esc(f.label)}${f.required?' *':''}</legend>${description}${input}</fieldset>`;
 }
 optionsForm.innerHTML=model.fields.map(fieldMarkup).join('');
 function syncInputs(){
  for(const f of model.fields.filter(isInput)){
   const box=root.querySelector(`[data-field="${f.alias}"]`);
   if(!box)continue;
   box.hidden=!result.visible[f.alias];
   for(const input of box.querySelectorAll('input,select,textarea')){
    input.disabled=box.hidden;
    if(['radio','checkbox'].includes(input.type))input.checked=Number(raw[f.alias])===Number(input.value);
    else if(document.activeElement!==input)input.value=raw[f.alias]|| (f.type==='Quantity'||f.type==='Range Button'?0:'');
   }
  }
  for(const box of optionsForm.querySelectorAll('.calc-html,hr'))box.hidden=!result.visible[box.dataset.field];
 }
 function update(changed){
  // Enforce the stated minimum guests, so a below-minimum wedding cannot appear artificially cheap.
  const minimum=Number(raw.dropDown_field_id_0)===6?150:Number(raw.dropDown_field_id_0)===5?100:50;
  for(const id of ['range_field_id_13','range_field_id_14','range_field_id_15']){
   if(Number(raw[id])<minimum)raw[id]=minimum;
   const input=optionsForm.elements.namedItem(id);input.min=minimum;
  }
  result=calculate(model,raw,changed);syncInputs();
  $('#calc-lines').innerHTML=result.lines.map(l=>`<div class="calc-price"><span>${esc(l.label)}</span><strong>${money(l.value)}</strong></div>`).join('');
  $('#calc-totals').innerHTML=[83,84,85].map(id=>`<div class="calc-price ${id===85?'calc-grand':''}"><span>${esc(fields['total_field_id_'+id].label)}</span><strong>${money(result.totals['total_field_id_'+id])}</strong></div>`).join('');
 }
 optionsForm.addEventListener('submit',e=>e.preventDefault());
 optionsForm.addEventListener('change',e=>{
  const f=fields[e.target.name];if(!f)return;
  raw[f.alias]=f.type==='Text Area'?e.target.value:e.target.type==='checkbox'?(e.target.checked?Number(e.target.value):0):Number(e.target.value);
  update(f.alias);
 });
 optionsForm.addEventListener('input',e=>{
  const f=fields[e.target.name];if(!f || !['Quantity','Range Button'].includes(f.type))return;
  // Update price while typing; range validation is enforced on blur and before sharing.
  raw[f.alias]=Math.max(Number(e.target.min),Math.min(Number(e.target.max),Number(e.target.value)||0));
  update(f.alias);
 });
 function validate(){
  if(!raw.radio_with_img_field_id_12 || !raw.radio_field_id_7){
   $('#calc-send-status').textContent='Please choose a venue and VIP package before sharing your quote.';
   const id=!raw.radio_with_img_field_id_12?'radio_with_img_field_id_12':'radio_field_id_7';
   root.querySelector(`[data-field="${id}"]`).scrollIntoView({behavior:'smooth',block:'center'});return false;
  }
  return optionsForm.reportValidity();
 }
 const form=$('#calc-quote-form');
 form.innerHTML=model.formFields.map(f=>{
  const a=f.attributes,id='quote-'+f.id,req=a.required==='1'?' required':'';
  if(f.type==='checkbox')return `<label>${esc(a.label)} *<select name="${esc(a.label)}" id="${id}"${req}>${a.options.map(o=>`<option>${esc(o.optionText.trim())}</option>`).join('')}</select></label>`;
  if(f.type==='textarea')return `<label>${esc(a.label)}<textarea name="${esc(a.label)}" id="${id}" maxlength="400" rows="4"></textarea></label>`;
  const type=f.type==='email'?'email':f.type==='phone'?'tel':f.id==='9'||f.id==='10'?'date':'text';
  return `<label>${esc(a.label)}${req?' *':''}<input type="${type}" name="${esc(a.label)}" id="${id}" maxlength="150"${req}></label>`;
 }).join('')+'<div class="calc-honey" aria-hidden="true"><label>Leave this empty<input name="_honey" tabindex="-1" autocomplete="off"></label></div><button class="btn gold" type="submit">Send</button>';
 function selections(){
  return model.fields.filter(f=>isInput(f)&&result.visible[f.alias]).map(f=>{
   const val=raw[f.alias];let text;
   if(f.options)text=f.options.find(o=>Number(o.optionValue)===Number(val))?.optionText||'Not selected';
   else text=String(val || (f.type==='Text Area'?'Not provided':0));
   return `${f.label}: ${text}`;
  });
 }
 function quoteText(){
  return ['YOUR CUSTOM WEDDING QUOTE*','Celebrations on the River','',...selections(),'','ITEMIZED ESTIMATE',...result.lines.map(l=>`${l.label} ${money(l.value)}`),'',...[83,84,85].map(id=>`${fields['total_field_id_'+id].label}: ${money(result.totals['total_field_id_'+id])}`),'','Estimate only. Availability and final pricing must be confirmed with Celebrations. Not a reservation.'].join('\n');
 }
 $('#calc-share').addEventListener('click',()=>{
  if(!validate())return;
  $('#calc-share-panel').hidden=false;
  $('#quote-1').value=raw.text_field_id_29;
  $('#quote-2').value=raw.text_field_id_87;
  $('#quote-3').value=raw.text_field_id_86;
  $('#calc-share-panel').scrollIntoView({behavior:'smooth'});$('#quote-1').focus({preventScroll:true});
 });
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(!validate()||!form.reportValidity())return;
  const fd=new FormData(form);if(fd.get('_honey'))return;
  const payload=Object.fromEntries(fd);delete payload._honey;
  payload._subject='New Custom Wedding Quote — Celebrations on the River';
  payload._replyto=payload.Email;payload._template='table';
  payload['Selections and itemized quote']=quoteText();
  const button=form.querySelector('button');button.disabled=true;
  $('#calc-send-status').textContent='Sending your custom quote…';
  try{
   const r=await fetch(root.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
   const body=await r.json();if(!r.ok || !(body.success===true || body.success==='true'))throw Error('Not accepted');
   $('#calc-send-status').textContent='Success! Your Custom Quote Has Been Sent';
   // Keep the estimate, but prevent accidental repeat sends until the user edits the quote form.
   form.addEventListener('input',()=>{button.disabled=false;},{once:true});
  }catch{
   $('#calc-send-status').textContent='Your quote could not be sent. Please try again, or print/save your quote and contact Celebrations. No successful delivery was confirmed.';button.disabled=false;
  }
 });
 $('#calc-pdf').addEventListener('click',()=>{
  if(!validate())return;
  const contact=Object.entries(Object.fromEntries(new FormData(form))).filter(([k,v])=>k!=='_honey'&&v).map(([k,v])=>`${k}: ${v}`).join('\n');
  $('#calc-print').innerHTML='<h1>Your Custom Wedding Quote</h1><pre>'+esc(quoteText()+'\n\n'+contact)+'</pre>';
  window.print();
 });
 update();$('#calc-loading').hidden=true;$('.calc-layout').hidden=false;
}
if(root)start().catch(e=>{
 $('#calc-loading').textContent='The quote calculator could not load. Please refresh or contact Celebrations for a quote.';
 console.error('Wedding calculator:',e);
});
