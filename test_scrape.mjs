import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function testBiblia() {
  const res = await fetch('https://www.bible.com/es/verse-of-the-day');
  const html = await res.text();
  const $ = cheerio.load(html);
  console.log("VERSE:", $('meta[property="og:description"]').attr('content'));
  console.log("TITLE:", $('meta[property="og:title"]').attr('content'));
}

async function testDevocional() {
  const res = await fetch('https://www.bibliaon.com/es/devocional_diario/');
  const html = await res.text();
  const $ = cheerio.load(html);
  const title = $('h1').first().text().trim();
  const content = $('.article-body').first().text().substring(0, 500); // just checking
  console.log("DEVOCIONAL TITLE:", title);
  console.log("DEVOCIONAL CONTENT:", content);
}

testBiblia();
testDevocional();
