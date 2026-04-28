import axios from 'axios';
const key = 'AIzaSyCspUN7ksjAvgL8Br_xNnB8FZDTTRJOrhg';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
const payload = {
  contents: [{ role: 'user', parts: [{ text: 'Hola' }] }]
};
axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } })
  .then(r => console.log(r.data.candidates[0].content.parts[0].text))
  .catch(e => console.error(e.response?.data || e.message));
