import fs from 'node:fs';

const base = 'C:/Users/33927/Documents/deepseek-harness/default-workspace/dsh-lingua-atlas/data/dict';
const zh = JSON.parse(fs.readFileSync(`${base}/related.zh.json`, 'utf8')).words;
const en = JSON.parse(fs.readFileSync(`${base}/related.en.json`, 'utf8')).words;

for (const word of ['水', '河', '江', '湖', '海', '雨', '看', '打', '月', '爱', '走', '美']) {
  console.log('\nZH', word, JSON.stringify(zh[word], null, 1));
}
for (const word of ['water', 'liquid', 'river', 'sea', 'rain', 'look', 'run', 'love', 'beauty']) {
  console.log('\nEN', word, JSON.stringify(en[word], null, 1));
}
