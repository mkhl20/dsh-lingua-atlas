import fs from 'node:fs';

const base = 'C:/Users/33927/Documents/deepseek-harness/default-workspace/dsh-lingua-atlas/data/dict';
const index = {
  zh: JSON.parse(fs.readFileSync(`${base}/zh.index.json`, 'utf8')),
  en: JSON.parse(fs.readFileSync(`${base}/en.index.json`, 'utf8')),
};
const fds = {
  zh: fs.openSync(`${base}/zh.jsonl`, 'r'),
  en: fs.openSync(`${base}/en.jsonl`, 'r'),
};
function read(dir, word) {
  const slot = index[dir][word];
  if (!slot) return null;
  const [offset, length] = slot;
  const buffer = Buffer.alloc(length);
  fs.readSync(fds[dir], buffer, 0, length, offset);
  return JSON.parse(buffer.toString('utf8'));
}

for (const w of ['水', '河', '江', '湖', '海', '雨', '看', '打', '月']) {
  const e = read('zh', w);
  console.log(JSON.stringify({
    w: e.w,
    py: e.py,
    cn: e.cn?.slice(0, 3),
    r: e.r?.map((x) => ({ p: x.p, n: x.n, d: x.d.slice(0, 3) })),
  }, null, 1));
}

for (const w of ['water', 'liquid', 'river', 'sea', 'rain', 'look', 'run']) {
  const e = read('en', w);
  console.log(JSON.stringify({
    w: e.w,
    ph: e.ph,
    s: e.s?.slice(0, 3),
    d: e.d?.slice(0, 4),
    fr: e.fr,
    bnc: e.bnc,
  }, null, 1));
}
