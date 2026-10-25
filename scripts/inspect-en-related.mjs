import fs from 'node:fs';
const file = 'C:/Users/33927/Documents/deepseek-harness/default-workspace/dsh-lingua-atlas/data/dict/related.en.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8')).words;
for (const word of ['water', 'liquid', 'river', 'sea', 'rain', 'look', 'run', 'love', 'beauty', 'happy', 'home', 'light']) {
  console.log(word, JSON.stringify(data[word] || null, null, 1));
}
