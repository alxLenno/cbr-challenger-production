// A small vector PDF writer for the evaluation sheet. No popup or print dialog.
async function downloadEvaluationPDF(html, filename) {
  const frame=document.createElement('iframe');
  frame.setAttribute('aria-hidden','true');
  frame.style.cssText='position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;visibility:hidden';
  document.body.append(frame);
  try {
    const doc=frame.contentDocument;
    doc.open();doc.write(`<!doctype html><html><head><style>html,body{margin:0;padding:0;background:white}</style></head><body>${html}</body></html>`);doc.close();
    await doc.fonts.ready;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const pageHeight=1123, scale=595.28/794;
    const pages=[[]];
    const ascii=value=>String(value).replace(/[–—]/g,'-').replace(/…/g,'...').replace(/[^\x20-\x7e]/g,'?');
    const escape=value=>ascii(value).replace(/([\\()])/g,'\\$1');
    const num=value=>Number(value).toFixed(2);
    let offset=0;
    const shifts=[];
    [...doc.querySelectorAll('.er-card-entry,.er-summary')].forEach(block=>{
      const r=block.getBoundingClientRect();
      if(r.height<pageHeight-40&&Math.floor((r.top+offset)/pageHeight)!==Math.floor((r.bottom+offset)/pageHeight))offset=(Math.floor((r.top+offset)/pageHeight)+1)*pageHeight+24-r.top;
      shifts.push({element:block,offset});
    });
    const shift=element=>shifts.find(item=>item.element.contains(element))?.offset||0;
    function emit(y,command){const n=Math.max(0,Math.floor(y/pageHeight));while(pages.length<=n)pages.push([]);pages[n].push(command(n));}
    doc.querySelectorAll('th,td,.er-identity span').forEach(element=>{
      const r=element.getBoundingClientRect(),y=r.top+shift(element);
      emit(y,n=>element.matches('.er-identity span')?`0.5 w ${num(r.left*scale)} ${num(841.89-(r.bottom+shift(element)-n*pageHeight)*scale)} m ${num(r.right*scale)} ${num(841.89-(r.bottom+shift(element)-n*pageHeight)*scale)} l S`:`0.5 w ${num(r.left*scale)} ${num(841.89-(y-n*pageHeight+r.height)*scale)} ${num(r.width*scale)} ${num(r.height*scale)} re S`);
    });
    const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())) {
      const element=node.parentElement;
      if(element.closest('style,script')||!node.textContent.trim())continue;
      const style=frame.contentWindow.getComputedStyle(element);
      const size=parseFloat(style.fontSize),bold=Number(style.fontWeight)>=600||style.fontWeight==='bold';
      const words=[...node.textContent.matchAll(/\S+/g)];
      for(const word of words){
        const range=doc.createRange();range.setStart(node,word.index);range.setEnd(node,word.index+word[0].length);
        const r=range.getBoundingClientRect();if(!r.width||!r.height)continue;
        const y=r.top+shift(element);
        emit(y,n=>`BT /${bold?'F2':'F1'} ${num(size*scale)} Tf 1 0 0 1 ${num(r.left*scale)} ${num(841.89-(y-n*pageHeight+size*.84)*scale)} Tm (${escape(word[0])}) Tj ET`);
      }
    }
    const objects=[];
    const add=value=>{objects.push(value);return objects.length;};
    const catalog=add(''),root=add('');
    const regular=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const bold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const kids=[];
    for(const commands of pages){const content=commands.join('\n');const stream=add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);kids.push(add(`<< /Type /Page /Parent ${root} 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> >> /Contents ${stream} 0 R >>`));}
    objects[catalog-1]=`<< /Type /Catalog /Pages ${root} 0 R >>`;
    objects[root-1]=`<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(id=>id+' 0 R').join(' ')}] >>`;
    let pdf='%PDF-1.4\n',positions=[0];
    objects.forEach((object,index)=>{positions.push(pdf.length);pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;});
    const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+positions.slice(1).map(p=>String(p).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const url=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));
    const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  } finally {frame.remove();}
}
