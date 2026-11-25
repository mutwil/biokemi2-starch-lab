'use strict';

(() => {
  const slots = document.querySelectorAll('[data-answer-key]');
  const bytes = encoded => Uint8Array.from(atob(encoded), character => character.charCodeAt(0));

  async function unlock(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const password = form.querySelector('input');
    const status = form.querySelector('[role=status]');
    if (!globalThis.crypto?.subtle) {
      status.textContent = 'Open the workbook on its HTTPS site or in a modern browser to unlock answers.';
      return;
    }
    const button = form.querySelector('button');
    button.disabled = true;
    status.textContent = 'Unlocking…';
    try {
      const { salt, iv, ciphertext } = encryptedAnswerKey;
      const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password.value),
        'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey({
        name: 'PBKDF2', salt: bytes(salt), iterations: 600000, hash: 'SHA-256'
      }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      const decoded = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(iv) }, key, bytes(ciphertext));
      const answers = JSON.parse(new TextDecoder().decode(decoded));
      for (const slot of slots) {
        slot.innerHTML = answers[slot.dataset.answerKey];
      }
      const pdf = document.querySelector('[data-answer-pdf]');
      if (pdf) pdf.href = URL.createObjectURL(new Blob([bytes(answers.pdf)], { type: 'application/pdf' }));
    } catch {
      status.textContent = 'Could not unlock the answers. Check the password and try again.';
      button.disabled = false;
      password.select();
    }
  }

  for (const slot of slots) {
    const form = document.createElement('form');
    form.className = 'key-form';
    form.innerHTML = '<label>Answer password<input type="password" required autocomplete="off"></label>' +
      '<button type="submit">Unlock answers</button><span role="status"></span>';
    form.addEventListener('submit', unlock);
    slot.replaceChildren(form);
  }
})();
