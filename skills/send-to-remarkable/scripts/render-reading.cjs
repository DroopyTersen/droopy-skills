#!/usr/bin/env node
// Styled local Markdown -> self-contained HTML -> selectable PDF.
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const Diff = require('diff2html');
const highlight = require('highlight.js');
const [input, output, ...flags] = process.argv.slice(2);
if (!input || !output || flags.length) throw Error('Usage: render-reading.cjs source.md reading.pdf');
const decode = s => s.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1),16) : Number(n))).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
function diffHtml(patch) {
  const parsed = Diff.parse(patch);
  if (!parsed.length) throw Error('A diff block is not a unified file patch; label structural sketches as text');
  const language = highlight.getLanguage(path.extname(parsed[0].newName).slice(1)) ? path.extname(parsed[0].newName).slice(1) : 'plaintext';
  return Diff.html(parsed, {drawFileList:false,outputFormat:'line-by-line',matching:'lines',diffStyle:'word'}).replace(/(<span class="d2h-code-line-ctn">)([\s\S]*?)(<\/span>)/g, (_, a, b, c) => a + b.replace(/(^|>)([^<>]+)(?=<|$)/g, (_, prefix, text) => prefix + highlight.highlight(decode(text), {language,ignoreIllegals:true}).value) + c);
}
const rawHtml = html => '\n```{=html}\n' + html + '\n```\n';
let md = fs.readFileSync(input,'utf8');
let diagramIndex = 0;
md = md.replace(/^```mermaid\s*\n([\s\S]*?)^```\s*$/gm, (_, definition) => {
  const assets = path.join(path.dirname(path.resolve(output)), path.basename(output, '.pdf') + '-diagrams');
  fs.mkdirSync(assets, {recursive:true});
  const name = path.join(assets, 'diagram-' + (++diagramIndex));
  const config = path.join(assets,'mermaid.json');
  const browserConfig = path.join(assets,'browser.json');
  fs.writeFileSync(name + '.mmd', definition);
  fs.writeFileSync(config, JSON.stringify({theme:'base',htmlLabels:false,fontFamily:'Arial',flowchart:{htmlLabels:false},themeVariables:{fontSize:'20px',primaryColor:'#eeeeee',primaryTextColor:'#111111',primaryBorderColor:'#555555',lineColor:'#333333',secondaryColor:'#ffffff',tertiaryColor:'#f5f5f5',actorBkg:'#eeeeee',actorTextColor:'#111111',actorBorder:'#555555',signalColor:'#333333',signalTextColor:'#111111',noteBkgColor:'#f5f5f5',noteTextColor:'#111111',noteBorderColor:'#777777'}}));
  fs.writeFileSync(browserConfig, JSON.stringify({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}));
  cp.execFileSync(path.join(__dirname,'../node_modules/.bin/mmdc'), ['-i',name+'.mmd','-o',name+'.svg','-c',config,'-p',browserConfig,'-b','white'], {timeout:60000,stdio:'pipe'});
  const svg = fs.readFileSync(name + '.svg');
  if (!svg.toString().includes('<svg')) throw Error('Mermaid did not generate an SVG');
  const measured = JSON.parse(cp.execFileSync(process.execPath, [path.join(__dirname,'measure-diagram.cjs'),name+'.svg'], {timeout:20000,encoding:'utf8'}));
  const targetFontPt = 10.98, minimumFontPt = 9.27;
  const availableWidthPt = 612 - 72 * (.21 + .75), maximumHeightPt = 520;
  const scale = Math.min(targetFontPt / (.75 * measured.labelFontPx), availableWidthPt / (.75 * measured.width), maximumHeightPt / (.75 * measured.height));
  const layout = {...measured, widthPt:.75 * measured.width * scale, heightPt:.75 * measured.height * scale, labelFontPt:.75 * measured.labelFontPx * scale, smallestFontPt:.75 * measured.smallestFontPx * scale};
  fs.writeFileSync(name+'.layout.json',JSON.stringify(layout,null,2)+'\n');
  if (layout.smallestFontPt < minimumFontPt - .01) throw Error('Mermaid diagram ' + diagramIndex + ' needs a simpler layout or splitting: fitted labels would be ' + layout.smallestFontPt.toFixed(2) + 'pt');
  return rawHtml('<figure class="mermaid-diagram"><img style="width:' + layout.widthPt.toFixed(2) + 'pt;height:' + layout.heightPt.toFixed(2) + 'pt" alt="Rendered Mermaid diagram ' + diagramIndex + '" src="data:image/svg+xml;base64,' + svg.toString('base64') + '"></figure>');
});

md = md.replace(/^```diff\s*\n([\s\S]*?)^```\s*$/gm, (_, patch) => rawHtml(diffHtml(patch)));
md = md.replace(/<pre class="full-diff"><code>([\s\S]*?)<\/code><\/pre>/g, (_, patch) => rawHtml(diffHtml(decode(patch))));
const body = cp.execFileSync('pandoc',['--from=markdown','--to=html5','--embed-resources','--resource-path='+path.dirname(path.resolve(input))], {input:md,encoding:'utf8',maxBuffer:32*1024*1024});
const css = fs.readFileSync(require.resolve('diff2html/bundles/css/diff2html.min.css'),'utf8') + fs.readFileSync(require.resolve('highlight.js/styles/github.css'),'utf8') + `
@page{size:Letter;margin:.28in .75in .28in .21in}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}
body{font:10.98pt/1.4 Arial,sans-serif;color:#111;margin:0}h1{font-size:19.8pt;line-height:1.15}h2{font-size:15.3pt;margin:20pt 0 9pt}h3{font-size:12.6pt}h1,h2,h3{break-after:avoid}p{margin:9pt 0}a{color:#111;overflow-wrap:anywhere}code,pre{font:9.27pt/1.35 Menlo,Consolas,monospace}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f5f5f5;padding:9pt;border:1px solid #ddd}table{border-collapse:collapse;width:100%}th,td{padding:5pt;border:1px solid #ddd;overflow-wrap:anywhere}img{max-width:100%}.mermaid-diagram{margin:16pt 0;break-inside:avoid}.mermaid-diagram img{display:block;margin:0 auto;max-width:100%;object-fit:contain}blockquote{border-left:2pt solid #aaa;margin:12pt 0;padding-left:10pt}
.d2h-code-line-ctn [class*="hljs-"]{color:#222!important}.d2h-code-line-ctn .hljs-keyword,.d2h-code-line-ctn .hljs-literal{font-weight:600}
.d2h-wrapper{font-size:9.27pt;margin:12pt 0}.d2h-file-wrapper{border-color:#999;break-inside:avoid}p:has(>strong:only-child){break-after:avoid}.d2h-file-header{height:auto;padding:8pt;font:9.9pt Arial;overflow-wrap:anywhere}.d2h-file-name{white-space:normal}.d2h-file-diff{overflow:visible}.d2h-diff-table{font-size:9.27pt;table-layout:fixed;width:100%;border-collapse:collapse}.d2h-diff-table td{padding:0;border-width:0}.d2h-diff-table td:first-child{width:48pt!important;display:table-cell!important}.d2h-code-linenumber{position:static!important;display:table-cell!important;width:48pt!important;min-width:48pt;font-size:7.65pt;padding:0 4pt!important;vertical-align:top;white-space:nowrap;background:#f5f5f5}.line-num1,.line-num2{display:inline-block;width:19pt!important;max-width:19pt;overflow:visible;text-overflow:clip!important;color:#333}.line-num1{float:left}.line-num2{float:right}.d2h-code-line{padding:0 5pt;width:100%!important;display:block!important;white-space:normal!important;line-height:1.35}.d2h-code-line-ctn{white-space:pre-wrap!important;overflow-wrap:anywhere;display:inline-block!important;width:calc(100% - 14pt)!important}.d2h-code-line-prefix{display:inline!important;vertical-align:top;font-weight:bold}.d2h-info{background:#eee;color:#333}.d2h-tag,.d2h-file-collapse{display:none}.d2h-del{background:#ffe2e2}.d2h-code-line ins{text-decoration:none!important}.d2h-code-line del{text-decoration:none}.d2h-diff-table tr{break-inside:avoid}
`;
const out = path.resolve(output);fs.mkdirSync(path.dirname(out),{recursive:true});
const html = out.replace(/\.pdf$/i,'.html');if(html===out)throw Error('Output must end in .pdf');
fs.writeFileSync(html,`<!doctype html><html><head><meta charset="utf-8"><title>${path.basename(out)}</title><style>${css}</style></head><body>${body}</body></html>`);
const work=fs.mkdtempSync('/tmp/remarkable-render-');
const temporary=path.join(work,'reading.pdf');
const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const proc=cp.spawn(chrome,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--user-data-dir='+path.join(work,'chrome'),'--no-pdf-header-footer','--print-to-pdf='+temporary,'file://'+html],{stdio:'ignore',detached:true});
const timeout=setTimeout(()=>{try{process.kill(-proc.pid,'SIGTERM')}catch{}},30000);
proc.on('error', e=>{clearTimeout(timeout);throw e});
proc.on('exit',()=>{clearTimeout(timeout);cp.execFileSync('pdfinfo',[temporary],{stdio:'ignore'});fs.copyFileSync(temporary,out);fs.rmSync(work,{recursive:true,force:true});console.log(out)});
