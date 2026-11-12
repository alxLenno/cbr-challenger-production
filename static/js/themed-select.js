// Keep native selects as form values; render all visible choices in the app theme.
(() => {
  const controls = new Map();
  let opened = null, nextId = 0;
  function enhance(select) {
    if (controls.has(select) || select.hidden || select.style.display === 'none' || select.getAttribute('aria-hidden') === 'true') return;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'themed-select-trigger';
    button.setAttribute('role', 'combobox'); button.setAttribute('aria-haspopup', 'listbox'); button.setAttribute('aria-expanded', 'false');
    const menu = document.createElement('div'); menu.className = 'themed-select-menu'; menu.id = `themed-options-${nextId++}`; menu.setAttribute('role', 'listbox'); menu.hidden = true;
    button.setAttribute('aria-controls', menu.id);
    select.after(button); select.classList.add('themed-select-source'); select.tabIndex = -1; select.setAttribute('aria-hidden', 'true');
    (select.closest('dialog') || document.body).append(menu);
    let active = 0, typed = '', timer;
    const label = select.labels?.[0];
    const labelText = label ? [...label.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').trim() : '';
    button.setAttribute('aria-label', select.getAttribute('aria-label') || labelText || select.id || 'Choose an option');
    function sync() {
      button.textContent = select.selectedOptions[0]?.textContent || 'Choose an option';
      button.disabled = select.disabled;
      if (select.required) button.setAttribute('aria-required', 'true');
    }
    function close() { menu.hidden = true; button.setAttribute('aria-expanded', 'false'); if (opened?.button === button) opened = null; }
    function position() {
      const r = button.getBoundingClientRect();
      menu.style.width = `${Math.min(Math.max(r.width, 180), innerWidth - 16)}px`;
      menu.style.left = `${Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8))}px`;
      const below = innerHeight - r.bottom - 8;
      menu.style.maxHeight = `${Math.min(280, Math.max(below, r.top - 8))}px`;
      menu.style.top = `${below >= Math.min(menu.scrollHeight, 280) ? r.bottom + 4 : Math.max(8, r.top - menu.offsetHeight - 4)}px`;
    }
    function focusOption(index) {
      const options = [...menu.querySelectorAll('button:not(:disabled)')];
      if (!options.length) return;
      active = (index + options.length) % options.length; options[active].focus();
    }
    function open() {
      opened?.close(); sync(); menu.replaceChildren();
      [...select.options].forEach(option => {
        const item = document.createElement('button'); item.type = 'button'; item.setAttribute('role', 'option'); item.setAttribute('aria-selected', String(option.selected)); item.textContent = option.textContent; item.disabled = option.disabled || option.parentElement.disabled;
        item.addEventListener('click', () => { select.value = option.value; select.dispatchEvent(new Event('input', {bubbles:true})); select.dispatchEvent(new Event('change', {bubbles:true})); sync(); close(); button.focus(); });
        menu.append(item);
      });
      menu.hidden = false; button.setAttribute('aria-expanded', 'true'); opened = {button, menu, close}; position();
      const options = [...menu.querySelectorAll('button:not(:disabled)')]; focusOption(Math.max(0, options.findIndex(o => o.getAttribute('aria-selected') === 'true')));
    }
    button.addEventListener('click', () => menu.hidden ? open() : close());
    button.addEventListener('keydown', event => { if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) { event.preventDefault(); open(); if(event.key==='Home') focusOption(0); if(event.key==='End') focusOption(-1); } });
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); button.focus(); }
      else if (event.key === 'Tab') { close(); button.focus(); }
      else if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) { event.preventDefault(); focusOption(event.key==='Home'?0:event.key==='End'?-1:active+(event.key==='ArrowDown'?1:-1)); }
      else if (event.key.length === 1 && event.key !== ' ') { typed += event.key.toLowerCase(); clearTimeout(timer); timer=setTimeout(()=>typed='',600); const options=[...menu.querySelectorAll('button:not(:disabled)')]; const index=options.findIndex(o=>o.textContent.toLowerCase().startsWith(typed)); if(index>=0) focusOption(index); }
    });
    select.addEventListener('change', sync); select.addEventListener('invalid', event => { event.preventDefault(); button.focus(); button.setAttribute('aria-invalid','true'); });
    select.addEventListener('change', () => button.removeAttribute('aria-invalid'));
    for (const property of ['value', 'selectedIndex']) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, property);
      Object.defineProperty(select, property, {configurable:true, get(){return descriptor.get.call(this);}, set(value){descriptor.set.call(this,value);sync();}});
    }
    controls.set(select, {sync,button,menu,close}); sync();
    new MutationObserver(sync).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected','label','required']});
  }
  function scan() { document.querySelectorAll('select').forEach(enhance); for(const [s,c] of controls) if(!s.isConnected){c.button.remove();c.menu.remove();controls.delete(s);} }
  document.addEventListener('DOMContentLoaded', () => { scan(); new MutationObserver(scan).observe(document.body,{childList:true,subtree:true}); });
  document.addEventListener('pointerdown', event => { if(opened && !opened.menu.contains(event.target) && !opened.button.contains(event.target)) opened.close(); });
  document.addEventListener('reset', () => setTimeout(()=>controls.forEach(c=>c.sync()),0));
  window.addEventListener('resize',()=>opened?.close());
  document.addEventListener('scroll',event=>{if(opened && !opened.menu.contains(event.target)) opened.close();},true);
})();
