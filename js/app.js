/* AI ƠI, CHẮC CHƯA? — offline scene composition & single transition controller. */
(() => {
  'use strict';
  const sculpture=Promise.resolve(window.SITE_SCULPTURE);
  const cfg=window.SITE_CONFIG||{};
  const $=id=>document.getElementById(id), data=(cfg.cases&&cfg.cases.length?cfg.cases:window.CASES), motion=window.Motion, sound=window.Sound;
  const ui=cfg.home||{}, project=cfg.project||{}, caseUI=cfg.caseUI||{}, summaryUI=cfg.summary||{}, dialogUI=cfg.dialog||{}, evidenceUI=cfg.evidence||{}, globalUI=cfg.globalUI||{}, noscriptUI=cfg.noscript||{}, sections=cfg.sections||{}, layout=cfg.layout||{}, website=cfg.website||{};
  const sectionOn=name=>sections[name]!==false;
  const caseOn=index=>data[index]?.enabled!==false;
  const nextEnabledCase=start=>{for(let i=start+1;i<data.length;i++)if(caseOn(i))return i;return -1;};
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hasKey=(obj,key)=>Object.prototype.hasOwnProperty.call(obj||{},key);
  const text=(obj,key,fallback='')=>hasKey(obj,key)?String(obj[key]??''):fallback;
  const hasText=(obj,key)=>text(obj,key).trim()!=='';
  // Safely join human-readable config fragments without relying on invisible trailing spaces.
  const joinText=(...parts)=>parts.map(v=>String(v??'')).reduce((out,part)=>{if(!part)return out;if(!out)return part;return /\s$/.test(out)||/^\s/.test(part)?out+part:out+' '+part;},'');
  const n=value=>String(value+1).padStart(2,'0');
  const delay=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
  const scenes=[
    {kind:'school',short:'Chọn trường',category:'SO SÁNH TRƯỚC KHI CHỌN TRƯỜNG',accent:'#96e4ec',rgb:'150,228,236',mark:'A/B'},
    {kind:'score',short:'Điểm chuẩn',category:'THÔNG TIN CÓ CÒN PHÙ HỢP?',accent:'#d5dfe9',rgb:'213,223,233',mark:'26'},
    {kind:'subjects',short:'Nhóm ôn tập',category:'CHỌN NHÓM ÔN TẬP',accent:'#c6a2ff',rgb:'198,162,255',mark:'01/02'},
    {kind:'chat',short:'Thông báo nhóm lớp',category:'XEM NGÀY VÀ NGUỒN THÔNG BÁO',accent:'#d78a96',rgb:'215,138,150',mark:'12/10'},
    {kind:'math',short:'Kiểm tra nghiệm',category:'KIỂM TRA ĐỦ NGHIỆM',accent:'#a3e1b4',rgb:'163,225,180',mark:'x²'},
    {kind:'planner',short:'Một giờ ôn bài',category:'CHIA THỜI GIAN ÔN BÀI',accent:'#d9bd83',rgb:'217,189,131',mark:'60′'},
    {kind:'poster',short:'Báo tường 20/11',category:'ĐẶT TÊN BÁO TƯỜNG',accent:'#e5e1d8',rgb:'229,225,216',mark:'20/11'},
    {kind:'source',short:'Nguồn trích dẫn',category:'TÌM NGUỒN TRÍCH DẪN',accent:'#97b7ee',rgb:'151,183,238',mark:'“ ”'},
    {kind:'writer',short:'Tự viết bài',category:'PHÂN BIỆT PHẦN AI VÀ PHẦN EM LÀM',accent:'#d4bd81',rgb:'212,189,129',mark:'09'}
  ];
  scenes.forEach((scene,i)=>{const c=data[i]||{};scene.kind=hasKey(c,'kind')&&String(c.kind).trim()!==''?c.kind:scene.kind;scene.short=hasKey(c,'short')?String(c.short):scene.short;scene.category=hasKey(c,'category')?String(c.category):scene.category;scene.mark=hasKey(c,'mark')?String(c.mark):scene.mark;});
  const lightAccents=[['#00778e','0,119,142'],['#3151c8','49,81,200'],['#7531c1','117,49,193'],['#c82c49','200,44,73'],['#0c814c','12,129,76'],['#ac650a','172,101,10'],['#c12d86','193,45,134'],['#087183','8,113,131'],['#946015','148,96,21']];
  const canvases=['#d2f6fc','#dae3ff','#ead8ff','#ffd8e0','#d1f7e4','#ffe7b5','#ffdaef','#cdeef6','#f5e4b8'];
  scenes.forEach((s,i)=>{s.lightAccent=lightAccents[i][0];s.lightRgb=lightAccents[i][1];s.canvas=canvases[i];});
  const state={route:'home',index:0,choices:Array(data.length).fill(null),opened:Array(data.length).fill(false),busy:false,opening:false,mode:'cinematic',theme:'light',epoch:0};
  const palette=s=>state.theme==='light'?{accent:s.lightAccent,rgb:s.lightRgb}:s;
  const saved={get(key,session=false){try{return(session?sessionStorage:localStorage).getItem(key);}catch(_){return null;}},set(key,value,session=false){try{(session?sessionStorage:localStorage).setItem(key,value);}catch(_){}}};
  let evidenceBusy=false, evidenceEpoch=0,openingEpoch=0,openingStart=0,openingTimer=0,bridgeTimer=0,scrollObserver;
  const parseElement=html=>{const template=document.createElement('template');template.innerHTML=html.trim();return template.content.firstElementChild;};
  const objectLabel=(left,right='VÍ DỤ')=>`<p class="object-label"><span>${left}</span><span>${right}</span></p>`;

  function projectReport(){
    const note=cfg.projectNotes||window.PROJECT_NOTES||{};
    const items=[
      [text(project,'card_1','Nhiệm vụ của em'),note.task,'project_card_1'],
      [text(project,'card_2','AI giúp ở khâu nào?'),note.aiHelp,'project_card_2'],
      [text(project,'card_3','Em kiểm tra như thế nào?'),note.check,'project_card_3'],
      [text(project,'card_4','Phần em tự làm'),note.student,'project_card_4']
    ].filter(([title,body,key])=>sectionOn(key)&&((title??'').trim()!==''||(body??'').trim()!==''));
    const inspiration=sectionOn('project_inspiration')&&((text(project,'inspiration_label','Ý tưởng từ lớp học').trim()!=='')||String(note.inspiration??'').trim()!=='')
      ? `<p class="project-inspiration">${hasText(project,'inspiration_label')||!hasKey(project,'inspiration_label')?`<span>${escape(text(project,'inspiration_label','Ý tưởng từ lớp học'))}</span>`:''}${escape(note.inspiration??'')}</p>` : '';
    const cards=sectionOn('project_cards')?`<div class="contribution-grid">${items.map(([title,body],i)=>`<article class="contribution-card glass"><span class="contribution-index">${n(i)}</span>${String(title).trim()!==''?`<h3>${escape(title)}</h3>`:''}${String(body??'').trim()!==''?`<p>${escape(body)}</p>`:''}</article>`).join('')}</div>`:'';
    const safety=sectionOn('project_safety')&&((text(project,'safety_heading','Dùng AI có trách nhiệm.').trim()!=='')||String(text(project,'safety_text',note.safety||'')).trim()!=='')
      ? `<p class="project-safety">${text(project,'safety_heading','Dùng AI có trách nhiệm.').trim()!==''?`<strong>${escape(text(project,'safety_heading','Dùng AI có trách nhiệm.'))}</strong>`:''}${text(project,'safety_text',note.safety||'').trim()!==''?`${text(project,'safety_heading','').trim()!==''?' ':''}${escape(text(project,'safety_text',note.safety||''))}`:''}</p>` : '';
    const eyebrow=text(project,'eyebrow','');
    const heading=text(project,'heading','Em thực hiện sản phẩm như thế nào?');
    if(!hasText(project,'heading') && heading==='') return '<section class="project-report" data-scroll-enter></section>';
    return `<section class="project-report" aria-labelledby="project-report-title" data-scroll-enter><header>${eyebrow.trim()!==''?`<p class="eyebrow">${escape(eyebrow)}</p>`:''}${heading.trim()!==''?`<h2 id="project-report-title">${escape(heading)}</h2>`:''}</header>${inspiration}${cards}${safety}</section>`;
  }

  const chapterIcons = [
  "<path class=\"mini-shadow\" d=\"M11 83 57 98 106 74 58 60Z\"/><path class=\"mini-side\" d=\"M66 42 95 32V72L66 85Z\"/><path class=\"mini-front\" d=\"M22 42 66 55V85L22 72Z\"/><path class=\"mini-top\" d=\"M18 41 48 19 99 33 66 56Z\"/><path class=\"mini-ink\" d=\"m41 78 0-20 12 4v20M28 52l8 3v9l-8-3M59 62l0 11 5 1M76 49l10-5v10l-10 5\"/>",
  "<path class=\"mini-shadow\" d=\"M10 85 58 101 108 79 60 63Z\"/><path class=\"mini-front\" d=\"M25 37 48 45V85L25 77Z\"/><path class=\"mini-side\" d=\"m48 45 14-8v40l-14 8Z\"/><path class=\"mini-top\" d=\"m25 37 14-8 23 8-14 8Z\"/><path class=\"mini-front\" d=\"m70 59 19 7v24l-19-7Z\"/><path class=\"mini-side\" d=\"m89 66 13-7v24l-13 7Z\"/><path class=\"mini-top\" d=\"m70 59 13-7 19 7-13 7Z\"/><text x=\"35\" y=\"22\" class=\"mini-label\">400</text><text x=\"82\" y=\"45\" class=\"mini-label\">300</text>",
  "<path class=\"mini-shadow\" d=\"M9 83 59 101 108 78 58 60Z\"/><path class=\"mini-side\" d=\"m16 28 33 10v53L16 81Z\"/><path class=\"mini-front\" d=\"m21 22 33 10v53L21 75Z\"/><path class=\"mini-top\" d=\"m21 22-5 6 33 10 5-6Z\"/><path class=\"mini-side\" d=\"m67 40 32-11v53L67 93Z\"/><path class=\"mini-top\" d=\"m62 34 5 6 32-11-5-6Z\"/><path class=\"mini-front\" d=\"m62 34 32-11v53L62 87Z\"/><path class=\"mini-ink\" d=\"m27 39 20 6m-20 8 15 5m27-9 18-6m-18 19 18-6\"/><text x=\"55\" y=\"64\" class=\"mini-plus\">+</text>",
  "<path class=\"mini-shadow\" d=\"M13 86 63 101 107 84 56 69Z\"/><path class=\"mini-side\" d=\"m29 21 64 13v60L29 81Z\"/><path class=\"mini-front\" d=\"m21 26 64 13v60L21 86Z\"/><path class=\"mini-top\" d=\"m21 26 8-5 64 13-8 5Z\"/><path class=\"mini-ink\" d=\"m21 44 64 13M36 22v16m35-9v16\"/><text x=\"28\" y=\"69\" transform=\"rotate(11 28 69)\" class=\"mini-date\">12/10</text>",
  "<path class=\"mini-shadow\" d=\"M12 85 58 101 108 78 59 60Z\"/><path class=\"mini-side\" d=\"m28 29 64-3v62l-64 3Z\"/><path class=\"mini-front\" d=\"m20 23 64-3v62l-64 3Z\"/><path class=\"mini-top\" d=\"m20 23 8 6 64-3-8-6Z\"/><text x=\"29\" y=\"59\" class=\"mini-math\">x²</text><path class=\"mini-ink\" d=\"m32 71 35-2\"/><circle class=\"mini-badge\" cx=\"88\" cy=\"87\" r=\"14\"/><text x=\"88\" y=\"94\" class=\"mini-question\">?</text>",
  "<path class=\"mini-shadow\" d=\"M15 87 63 103 106 85 59 69Z\"/><circle class=\"mini-side\" cx=\"64\" cy=\"59\" r=\"36\"/><circle class=\"mini-front\" cx=\"56\" cy=\"54\" r=\"36\"/><path class=\"mini-ink\" d=\"M56 29v25l18 11m-18-37v4m0 44v4M30 54h4m44 0h4\"/><circle class=\"mini-badge\" cx=\"56\" cy=\"54\" r=\"4\"/>",
  "<path class=\"mini-shadow\" d=\"M9 84 60 102 110 79 57 61Z\"/><path class=\"mini-side\" d=\"m28 30 64 13v50L28 80Z\"/><path class=\"mini-front\" d=\"m19 21 63 13v55L19 76Z\"/><path class=\"mini-top\" d=\"m82 34 10 9v50l-10-4Z\"/><text x=\"27\" y=\"48\" transform=\"rotate(11 27 48)\" class=\"mini-date\">20/11</text><path class=\"mini-ink\" d=\"m30 56 40 9m-40 1 23 5m-23 1 35 8\"/>",
  "<path class=\"mini-shadow\" d=\"M9 85 56 101 109 80 59 63Z\"/><path class=\"mini-side\" d=\"m18 26 42-4v65l-42 4Z\"/><path class=\"mini-front\" d=\"m13 21 42-4v65l-42 4Z\"/><path class=\"mini-ink\" d=\"m23 35 23-2m-23 13 23-2m-23 13 15-1\"/><circle class=\"mini-lens\" cx=\"78\" cy=\"57\" r=\"19\"/><path class=\"mini-handle\" d=\"m91 72 13 19\"/><text x=\"78\" y=\"65\" class=\"mini-question\">?</text>",
  "<path class=\"mini-shadow\" d=\"M10 86 60 102 108 81 59 63Z\"/><path class=\"mini-side\" d=\"m21 31 52-13v59L21 90Z\"/><path class=\"mini-front\" d=\"m15 26 52-13v59L15 85Z\"/><path class=\"mini-ink\" d=\"m25 37 31-8m-31 20 31-8m-31 20 22-5\"/><path class=\"mini-top\" d=\"m83 25 12 7-21 40-12-7Z\"/><path class=\"mini-side\" d=\"m95 32 5 5-21 40-5-5Z\"/><path class=\"mini-pencil-tip\" d=\"m62 65 12 7-15 9Z\"/>"
];
  const chapterIcon=index=>`<span class="chapter-icon" aria-hidden="true"><svg viewBox="0 0 120 116">${chapterIcons[index]}</svg></span>`;

  function homeView(){
    const H=ui;
    const enabledIndices=data.map((_,i)=>i).filter(caseOn);
    const firstCase=enabledIndices[0];
    const configuredHeroCase=Math.max(1,Math.min(data.length,Number(text(H,'hero_case','5'))||5))-1;
    const heroCase=caseOn(configuredHeroCase)?configuredHeroCase:firstCase;
    const hero=sectionOn('home_hero')?`<div class="home-hero">
        <div class="home-copy">
          ${text(H,'eyebrow','').trim()!==''?`<p class="eyebrow" data-enter="0"><span class="home-dot" aria-hidden="true"></span>${escape(text(H,'eyebrow',''))}</p>`:''}
          <h1 id="home-title" tabindex="-1" data-enter="80">${text(H,'title_line_1','AI ƠI,').trim()!==''?`<span class="title-line">${escape(text(H,'title_line_1','AI ƠI,'))}</span>`:''}${(text(H,'title_line_2','CHẮC?').trim()!==''||text(H,'title_accent','CHƯA?').trim()!=='')?`<span class="title-line">${text(H,'title_line_2','CHẮC?').trim()!==''?`<span>${escape(text(H,'title_line_2','CHẮC?'))}</span>`:''}${text(H,'title_accent','CHƯA?').trim()!==''?` <span class="title-accent">${escape(text(H,'title_accent','CHƯA?'))}</span>`:''}</span>`:''}</h1>
          ${text(H,'lead','').trim()!==''?`<p class="home-lead" data-enter="180">${escape(text(H,'lead',''))}</p>`:''}
          ${sectionOn('home_actions')?`<div class="home-actions" data-enter="290">${firstCase!==undefined&&text(H,'start_button','Bắt đầu tìm hiểu').trim()!==''?`<button class="button primary" type="button" data-case="${firstCase}">${escape(text(H,'start_button','Bắt đầu tìm hiểu'))} <span class="action-arrow" aria-hidden="true">↗</span></button>`:''}${sectionOn('chapters')&&text(H,'index_link','Xem 9 tình huống').trim()!==''?`<a class="home-index-link" href="#chapters-title">${escape(text(H,'index_link','Xem 9 tình huống'))} <span aria-hidden="true">↓</span></a>`:''}</div>`:''}
          ${sectionOn('home_principle')&&((text(H,'principle_a','AI hỗ trợ.').trim()!=='')||(text(H,'principle_b','Em kiểm tra và tự quyết định.').trim()!==''))?`<p class="home-principle" data-enter="360">${text(H,'principle_a','AI hỗ trợ.').trim()!==''?escape(text(H,'principle_a','AI hỗ trợ.')):''}${text(H,'principle_a','').trim()!==''&&text(H,'principle_b','Em kiểm tra và tự quyết định.').trim()!==''?' ':''}${text(H,'principle_b','Em kiểm tra và tự quyết định.').trim()!==''?`<strong>${escape(text(H,'principle_b','Em kiểm tra và tự quyết định.'))}</strong>`:''}</p>`:''}
        </div>
        ${sectionOn('home_hero_depth')?`<div class="hero-depth" data-enter="100">
          <div class="hero-orbit" aria-hidden="true"></div>
          <div class="hero-proof glass" data-tilt aria-label="Bảng minh họa kiểm tra lời giải">
            <div class="hero-card-content">
              <p class="surface-top"><span><i aria-hidden="true"></i>${escape(text(H,'hero_label','THỬ KIỂM TRA LỜI GIẢI'))}</span><b>${escape(text(H,'hero_step','05 / 09'))}</b></p>
              <div class="hero-equation"><span class="equation-label">${escape(text(H,'hero_equation_label','BÀI TOÁN'))}</span><p class="hero-formula">${escape(text(H,'hero_formula','x² = 9'))}</p><span class="formula-grid" aria-hidden="true"></span></div>
              <div class="hero-statement"><span><small>${escape(text(H,'hero_ai_label','AI GỢI Ý'))}</small>${escape(text(H,'hero_ai_text','Ví dụ câu trả lời'))}</span><strong>${escape(text(H,'hero_ai_answer','x = 3'))}</strong><span class="answer-doubt" aria-hidden="true">?</span></div>
              <div class="hero-under"><p>${escape(text(H,'hero_question','Lời giải đã đủ nghiệm chưa?'))}<small>${escape(text(H,'hero_tip','Em thay số để kiểm tra.'))}</small></p><button type="button" class="hero-check" data-case="${heroCase??0}" aria-label="${escape(text(H,'hero_button_aria','Thử kiểm tra lời giải trong tình huống 5'))}" ${heroCase===undefined?'disabled':''}><span aria-hidden="true">↗</span></button></div>
            </div>
          </div>
          <span class="hero-coordinate" aria-hidden="true">${escape(text(H,'hero_coordinate','VÍ DỤ HỌC TẬP / 05'))}</span>
        </div>`:''}
      </div>`:'';
    const credits=sectionOn('home_credits')?`<div class="home-credits" data-enter="450"><span>${escape(text(H,'credits_author_label','THỰC HIỆN'))}<strong>${escape(text(website,'author','Phan Gia Huy'))}</strong></span><span>${escape(text(H,'credits_class_label','LỚP'))}<strong>${escape(text(website,'class','9/13'))}</strong></span><span>${escape(text(H,'credits_teacher_label','CÔ GIÁO'))}<strong>${escape(text(website,'teacher','Cô Hà Thị Hạnh').replace(/^Cô /i,''))}</strong></span></div>`:'';
    const assignment=sectionOn('home_assignment')&&text(cfg.projectNotes||{},'assignment','').trim()!==''?`<p class="project-note" data-enter="510">${escape(text(cfg.projectNotes||{},'assignment',''))}</p>`:'';
    const chapters=sectionOn('chapters')?`<section class="chapter-section" aria-labelledby="chapters-title" data-scroll-enter>
        <div class="section-heading"><div>${text(H,'chapters_eyebrow','').trim()!==''?`<p class="eyebrow">${escape(text(H,'chapters_eyebrow',''))}</p>`:''}${text(H,'chapters_heading','Chọn một tình huống.').trim()!==''?`<h2 id="chapters-title">${escape(text(H,'chapters_heading','Chọn một tình huống.'))}</h2>`:''}</div>${text(H,'chapters_guide','').trim()!==''?`<p class="chapter-guide">${escape(text(H,'chapters_guide','')).replace(/ \/ /g,'<br>')}</p>`:''}</div>
        <ol class="chapter-grid">${enabledIndices.map(i=>{const s=scenes[i];return `<li><button class="chapter" type="button" data-case="${i}" style="--chapter-accent:${s.lightAccent};--chapter-rgb:${s.lightRgb}"><span class="chapter-top"><strong>${n(i)}</strong><span>${escape(s.short)}</span><i class="chapter-arrow" aria-hidden="true">↗</i></span><span class="chapter-body">${chapterIcon(i)}<h3>${escape(data[i].title)}</h3></span></button></li>`;}).join('')}</ol>
        ${text(cfg.projectNotes||{},'scope','').trim()!==''||text(H,'simulation','').trim()!==''?`<p class="simulation">${escape(text(cfg.projectNotes||{},'scope',text(H,'simulation','')))}</p>`:''}
      </section>`:'';
    const report=sectionOn('project_report')?projectReport():'';
    const blocks={hero,credits,assignment,chapters,report};
    const order=Array.isArray(layout.homeOrder)&&layout.homeOrder.length?layout.homeOrder:['hero','credits','assignment','chapters','report'];
    return parseElement(`<section class="screen home home-align-${escape(text(layout,'homeAlign','left'))}" aria-labelledby="home-title" style="--chapter-columns:${Math.max(1,Math.min(6,Number(layout.chapterColumns)||3))}">${order.map(key=>blocks[key]||'').join('')}</section>`);
  }

  const objects=[
    ()=>`<div class="school-space glass" data-tilt>${objectLabel('SO SÁNH HAI TRƯỜNG','A / B')}<div class="school-network" aria-hidden="true"><svg viewBox="0 0 420 140"><path d="M210 36C210 85 96 60 96 121M210 36C210 85 326 60 326 121"/><circle cx="210" cy="36" r="5" class="home-node"/><circle cx="96" cy="121" r="4"/><circle cx="326" cy="121" r="4"/><text x="210" y="18">NHÀ CỦA VÕ KHẢI</text><text x="95" y="80">20 phút</text><text x="327" y="80">Chưa rõ</text></svg></div><article class="school-file" data-object-enter><span class="file-index">LỰA CHỌN A</span><h3>Trường A</h3><p class="file-detail">Cách nhà 20 phút.</p><span class="file-tag">CLB Sinh học</span></article><article class="school-file" data-object-enter><span class="file-index">LỰA CHỌN B</span><h3>Trường B</h3><p class="file-detail">Điểm chuẩn năm trước cao hơn.</p><p>Chưa rõ câu lạc bộ và đường đi.</p><span class="file-tag">Chưa rõ</span></article></div>`,
    ()=>`<div class="score-field glass" data-tilt>${objectLabel('ĐIỂM CỦA KIÊN','NĂM TRƯỚC / NĂM NAY')}<span class="reference-tag" aria-hidden="true">NĂM NAY CHƯA CÓ KẾT QUẢ</span><div class="score-main" data-object-enter><strong>26<sup>đ</sup></strong><span>Điểm của<br>Kiên</span></div><div class="score-reference" data-object-enter><b>24,5</b><span>Điểm chuẩn trường A<br>Năm trước</span></div><div class="data-bars"><div>Chỉ tiêu năm trước <strong>400</strong><i></i></div><div>Chỉ tiêu năm nay <strong>300</strong><i></i></div></div></div>`,
    ()=>`<div class="subjects-board"><article class="subject-group glass" data-tilt><h3>Nhóm 01 <small>4 MÔN ÔN TẬP</small></h3><div class="subject-blocks">${['Vật lí','Hóa học','Sinh học','Toán'].map((v,i)=>`<div class="subject-block ${i===0||i===3?'highlight':''}" data-object-enter>${v}</div>`).join('')}</div></article><article class="subject-group glass" data-tilt><h3>Nhóm 02 <small>4 MÔN ÔN TẬP</small></h3><div class="subject-blocks">${['Địa lí','Giáo dục kinh tế và pháp luật','Công nghệ','Toán'].map((v,i)=>`<div class="subject-block ${i===3?'highlight':''}" data-object-enter>${v}</div>`).join('')}</div></article><p class="subjects-note">Triết muốn ôn cả Vật lí và Toán.</p></div>`,
    ()=>`<div class="chat-space glass"><div class="chat-header"><span class="chat-avatar">9/13</span><div><strong>Nhóm lớp</strong><small>Tin nhắn trong ví dụ</small></div></div><div class="chat-body"><p class="chat-time">ẢNH ĐƯỢC CHIA SẺ</p><div class="message" data-object-enter>Mình nhận được ảnh thông báo này.</div><div class="cropped-notice" data-object-enter><span>THÔNG BÁO</span><strong>12/10</strong><p>NGHỈ HỌC</p></div><div class="message you" data-object-enter>Ảnh này của năm nào?</div></div><div class="chat-bottom"><i></i> Kiểm tra năm và nơi đăng trước khi chia sẻ.</div></div>`,
    ()=>`<div class="math-field glass">${objectLabel('THAY SỐ ĐỂ KIỂM TRA','x² = 9')}<p class="equation" data-object-enter>x<sup>2</sup> = 9</p><svg class="math-graph" viewBox="0 0 500 230" role="img" aria-label="Đồ thị minh họa y bằng x bình phương và đường y bằng 9, có hai giao điểm"><path class="grid-line" d="M70 35H430M70 80H430M70 125H430M70 170H430M70 215H430M110 20V215M180 20V215M320 20V215M390 20V215"/><path class="axis" d="M55 215H445M250 17V224"/><path class="level" d="M64 80H438"/><path class="curve" d="M78 25Q250 405 422 25"/><text x="450" y="220">x</text><text x="259" y="25">y</text><text x="61" y="71">9</text><text x="356" y="38">y = x²</text><text x="262" y="230">0</text></svg><p class="math-caption"><span>ĐỀ KHÔNG YÊU CẦU x DƯƠNG</span><span>CẦN TÌM ĐỦ NGHIỆM</span></p></div>`,
    ()=>`<div class="planner-space glass">${objectLabel('THỜI GIAN CỦA KHANG','19:00 — 20:00')}<div class="time-heading"><strong>60 phút.</strong><span>Khang muốn nghỉ 5 phút.</span></div><div class="planner-scale"><span>19:00</span><span>19:30</span><span>20:00</span><span>20:30</span></div><div class="planner-track"><div class="time-block" data-object-enter>Toán<strong>30′</strong></div><div class="time-block" data-object-enter>Ngữ văn<strong>30′</strong></div><div class="time-block" data-object-enter>Tiếng Anh<strong>30′</strong></div></div><div class="time-window"></div><p class="planner-legend"><span>THỜI GIAN CỦA KHANG</span><span>LỊCH AI GỢI Ý, CHƯA TÍNH NGHỈ</span></p></div>`,
    ()=>`<div class="poster-page"><div class="poster-top"><span>BÁO TƯỜNG</span><span>GỢI Ý CỦA AI</span></div><p class="poster-date" data-object-enter>20/11</p><h3 class="poster-title" data-object-enter>Nét phấn<br>yêu thương.</h3><div class="poster-rule"></div><p class="poster-desc" data-object-enter>AI gợi ý tên; nhóm tự chọn và thực hiện báo tường.</p><div class="poster-foot"><span>TỐI ĐA 5 TỪ</span><span>NHÓM TỰ CHỌN VÀ THỰC HIỆN</span></div></div>`,
    ()=>`<div class="source-space glass">${objectLabel('KIỂM TRA NGUỒN AI GHI','CHƯA KIỂM TRA ĐƯỢC')}<div class="query-box" data-object-enter><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><span>“Một tài liệu <em>của trường</em>”</span></div><div class="source-connection" aria-hidden="true"></div><div class="source-checks">${['Tên tài liệu','Tác giả','Bản gốc'].map(label=>`<div class="source-check" data-object-enter><span><i class="document-icon" aria-hidden="true"></i>${label}</span><b>CHƯA CÓ</b></div>`).join('')}</div><p class="source-status">Trong ví dụ, Bình chưa tìm thấy bản gốc.<em>Chưa tìm thấy nguồn chưa đủ để kết luận câu trích là giả.</em></p></div>`,
    ()=>`<div class="writer-space glass" data-tilt><div class="writer-top"><span>BÀI VIẾT CỦA HUY TRONG VÍ DỤ</span><span>AI HỖ TRỢ</span></div><h3 class="writer-topic" data-object-enter>Giảm rác<br>trong lớp.<span class="writer-cursor" aria-hidden="true"></span></h3><div class="draft-flow"><span class="draft-step" data-object-enter>DÀN Ý</span><span class="draft-step" data-object-enter>TỰ VIẾT</span><span class="draft-step" data-object-enter>KIỂM TRA</span></div><ol class="draft-lines">${['Dùng điều mình quan sát.','Chỉ dùng số liệu có căn cứ.','Hiểu và giải thích từng ý.'].map((v,i)=>`<li class="draft-line" data-object-enter><i>${n(i)}</i><span>${v}</span></li>`).join('')}</ol><p class="writer-note">AI hỗ trợ dàn ý; Huy tự viết, kiểm tra và ghi rõ phần AI đã giúp.</p></div>`
  ];
  /* Exact contextual illustrations: each visual shows the case's own facts. */
  const diagrams=[
    ['Điều Võ Khải quan tâm','Sở thích Sinh học và mong muốn đi học gần nhà của Võ Khải.','So sánh trường với sở thích và việc đi lại của Võ Khải.'],
    ['So sánh chỉ tiêu hai năm','Chỉ tiêu trường A từ 400 xuống 300.','Năm trước tuyển 400, năm nay còn 300 học sinh.'],
    ['Hai môn Triết muốn ôn','Triết muốn ôn cả Vật lí và Toán.','Đối chiếu từng môn trong hai nhóm.'],
    ['Ảnh thiếu năm và nguồn','Ảnh thông báo ngày 12 tháng 10 thiếu năm và nguồn đăng.','Tìm ảnh đầy đủ rồi xem thông báo mới của cô.'],
    ['Thử lại lời giải','Minh họa 3 bình phương bằng 9; cần thử thêm nghiệm âm.','Thử cả x = 3 và x = −3 để kiểm tra đủ nghiệm.'],
    ['Kiểm tra giới hạn 60 phút','Khang có 60 phút từ 19 giờ đến 20 giờ.','Tổng thời gian cần gồm cả 5 phút nghỉ.'],
    ['Đếm từ trong tên gợi ý','Nét phấn yêu thương có bốn từ, giới hạn tối đa năm từ.','Nhóm tự chọn tên, thực hiện báo tường và ghi phần AI hỗ trợ.'],
    ['Tìm bản gốc của câu trích','Cần tìm bản gốc để kiểm tra câu trích dẫn.','Tìm tên tài liệu, tác giả và bản gốc.'],
    ['AI hỗ trợ, Huy tự thực hiện','AI gợi ý dàn ý, Huy tự viết và kiểm tra bài về giảm rác trong lớp.','Tự viết từ quan sát, kiểm tra và ghi rõ phần AI hỗ trợ.']
  ];
  const modelKeys=[
    [['Sinh học','Võ Khải thích học'],['Gần nhà','Đi học thuận tiện']],
    [['400','Năm trước'],['300','Năm nay']],
    [['Vật lí',''],['Toán','']],
    [['Năm ?',''],['Nguồn ?','']],
    [['3² = 9','Thử thêm x = −3']],
    [['60 phút','19:00 – 20:00']],
    [['4 từ','Tối đa 5 từ']],
    [['Câu trích dẫn','Bản gốc ở đâu?']],
    [['AI','Gợi ý dàn ý'],['Huy','Tự viết, kiểm tra']]
  ];
  const artView=index=>{const c=data[index]||{},d=diagrams[index]||['','',''],keys=[[text(c,'art_key1',modelKeys[index]?.[0]?.[0]||''),text(c,'art_key1_note',modelKeys[index]?.[0]?.[1]||'')],[text(c,'art_key2',modelKeys[index]?.[1]?.[0]||''),text(c,'art_key2_note',modelKeys[index]?.[1]?.[1]||'')],[text(c,'art_key3',modelKeys[index]?.[2]?.[0]||''),text(c,'art_key3_note',modelKeys[index]?.[2]?.[1]||'')]].filter(([a,b])=>a.trim()!==''||b.trim()!=='');return `<figure class="case-art data-art sculpture diagram-${scenes[index].kind}" data-enter="140" data-tilt>${text(c,'art_meta',d[0]).trim()!==''?`<div class="diagram-meta"><span>${escape(text(c,'art_meta',d[0]))}</span><button type="button" data-art-motion aria-label="Phát lại minh họa ${escape(text(c,'short',scenes[index].short))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M19 12a7 7 0 1 0-2 5M20 7l-3-2"/></svg></button></div>`:''}<div class="art-camera depth-stage sculpt-stage" data-model="${scenes[index].kind}" role="img" aria-label="${escape(text(c,'art_aria',d[1]))}"></div>${keys.length?`<div class="model-key">${keys.map(([a,b])=>`<span>${a.trim()!==''?`<b>${escape(a)}</b>`:''}${b.trim()!==''?`<small>${escape(b)}</small>`:''}</span>`).join('')}</div>`:''}${text(c,'art_caption',d[2]).trim()!==''?`<figcaption>${escape(text(c,'art_caption',d[2]))}</figcaption>`:''}</figure>`;};
  function caseView(index){
    const c=data[index],s=scenes[index],choice=state.choices[index],read=state.opened[index];
    const rail=data.map((_,i)=>i).filter(caseOn).map(i=>{const v=scenes[i];return `<li><button type="button" data-case="${i}" style="--tab-color:${v.lightAccent};--tab-rgb:${v.lightRgb}" class="${state.opened[i]?'is-read':''}" ${i===index?'aria-current="step"':''} aria-label="Tình huống ${i+1}: ${escape(v.short)}">${n(i)}</button></li>`}).join('');
    const art=sectionOn('case_art')?artView(index):'';
    const aiAnswer=sectionOn('case_ai_answer')?`<article class="ai-answer glass" data-enter="280">${text(caseUI,'ai_label','AI TRẢ LỜI').trim()!==''||text(caseUI,'ai_badge','MÔ PHỎNG').trim()!==''?`<p class="answer-label">${text(caseUI,'ai_label','AI TRẢ LỜI').trim()!==''?escape(text(caseUI,'ai_label','AI TRẢ LỜI')):''}${text(caseUI,'ai_badge','MÔ PHỎNG').trim()!==''?` <span>${escape(text(caseUI,'ai_badge','MÔ PHỎNG'))}</span>`:''}</p>`:''}${text(c,'answer','').trim()!==''?`<blockquote>${escape(text(c,'answer',''))}</blockquote>`:''}${text(caseUI,'ai_note','Em đối chiếu với dữ kiện trước khi dùng câu trả lời.').trim()!==''?`<p class="answer-note">${escape(text(caseUI,'ai_note','Em đối chiếu với dữ kiện trước khi dùng câu trả lời.'))}</p>`:''}</article>`:'';
    const decision=sectionOn('case_decision')?`<div class="decision-dock" data-enter="360"><div>${text(caseUI,'decision_label','Nhận xét ban đầu của em là gì?').trim()!==''?`<p class="decision-label" id="decision-label">${escape(text(caseUI,'decision_label','Nhận xét ban đầu của em là gì?'))}</p>`:''}<div class="choice-row" role="group" aria-labelledby="decision-label"><button class="button choice" type="button" data-choice="trust" aria-pressed="${choice==='trust'}">${escape(text(caseUI,'trust','Có vẻ hợp lí'))}</button><button class="button choice" type="button" data-choice="verify" aria-pressed="${choice==='verify'}">${escape(text(caseUI,'verify','Cần kiểm tra thêm'))}</button></div></div><div class="decision-action">${choice?`<p class="choice-status" role="status">${escape(joinText(text(caseUI,'after_choice_prefix','Em chọn '),choice==='trust'?text(caseUI,'trust_status','Có vẻ hợp lí.'):text(caseUI,'verify_status','Cần kiểm tra thêm.'),text(caseUI,'choice_after',' Xem phần kiểm tra để đối chiếu.')))}</p>`:(text(caseUI,'choice_note','Chọn nhận xét ban đầu, rồi xem phần kiểm tra.').trim()!==''?`<p class="choice-status" role="status">${escape(text(caseUI,'choice_note','Chọn nhận xét ban đầu, rồi xem phần kiểm tra.'))}</p>`:'')}<button class="button primary evidence-button" type="button" data-action="evidence" ${!choice?'hidden':''}>${escape(read?text(caseUI,'evidence_button_read','Xem lại cách kiểm tra'):text(caseUI,'evidence_button','Xem cách kiểm tra'))}</button></div></div>`:'';
    const nextRow=sectionOn('case_next')?`<div class="case-next-row" data-enter="400">${text(caseUI,'case_simulation','Đây là tình huống mô phỏng để học cách dùng AI.').trim()!==''?`<p class="simulation">${escape(text(caseUI,'case_simulation','Đây là tình huống mô phỏng để học cách dùng AI.'))}</p>`:''}${(nextEnabledCase(index)===-1?text(caseUI,'summary_button','Xem tổng kết'):text(caseUI,'next_button','Sang tình huống tiếp')).trim()!==''?`<button class="text-button" type="button" data-action="next" ${!read?'hidden':''}>${escape(nextEnabledCase(index)===-1?text(caseUI,'summary_button','Xem tổng kết'):text(caseUI,'next_button','Sang tình huống tiếp'))}</button>`:''}</div>`:'';
    const contentBlocks={
      heading:sectionOn('case_heading')?`<header class="case-heading" data-enter="30">${text(c,'category','').trim()!==''?`<p class="eyebrow">${escape(text(c,'category',''))}</p>`:''}${text(c,'title','').trim()!==''?`<h1 id="case-title" tabindex="-1">${escape(text(c,'title',''))}</h1>`:'<h1 id="case-title" tabindex="-1"></h1>'}</header>`:'',
      brief:sectionOn('case_brief')&&((text(c,'context','').trim()!=='')||(text(c,'question','').trim()!==''))?`<div class="case-brief" data-enter="110">${text(c,'context','').trim()!==''?`<p>${escape(text(c,'context',''))}</p>`:''}${text(c,'question','').trim()!==''?`<p class="case-question">${escape(text(c,'question',''))}</p>`:''}</div>`:'',
      art,
      object:sectionOn('case_object')?`<div class="case-object" data-enter="170" data-dir="${index%2?'-1':'1'}" data-scroll-depth="object">${objects[index]()}</div>`:'',
      answer:aiAnswer
    };
    const caseOrder=Array.isArray(layout.caseOrder)&&layout.caseOrder.length?layout.caseOrder:['heading','brief','art','object','answer'];
    const bottomOrder=Array.isArray(layout.caseBottomOrder)&&layout.caseBottomOrder.length?layout.caseBottomOrder:['decision','next'];
    const bottomBlocks={decision,next:nextRow};
    const caseNav=sectionOn('case_nav')?`<nav class="case-nav" aria-label="${escape(text(caseUI,'nav_label','Chuyển tình huống'))}" data-enter="0"><button class="back-home" type="button" data-action="home">${escape(text(caseUI,'back_home','9 tình huống'))}</button>${sectionOn('case_rail')?`<ol class="case-rail">${rail}</ol>`:''}${sectionOn('case_counter')?`<p class="case-counter"><b>${n(index)}</b>${text(caseUI,'counter_suffix',String(data.length).padStart(2,'0')).trim()!==''?`/ ${escape(text(caseUI,'counter_suffix',String(data.length).padStart(2,'0')))}`:''}</p>`:''}</nav>`:'';
    return parseElement(`<section class="screen exercise scene-${s.kind}" aria-labelledby="case-title" data-scene="${s.kind}">${caseNav}<div class="case-stage"><div class="case-layout">${caseOrder.map(key=>contentBlocks[key]||'').join('')}</div></div>${bottomOrder.map(key=>bottomBlocks[key]||'').join('')}</section>`);
  }

  function summaryView(){
    const enabled=data.map((_,i)=>i).filter(caseOn);
    const count=enabled.filter(i=>state.opened[i]).length;
    const resultRows=enabled.map(i=>{const c=data[i];return `<li class="result-row"><span>${n(i)}</span>${text(c,'title','').trim()!==''?`<h2>${escape(text(c,'title',''))}</h2>`:''}${state.opened[i]?text(c,'lesson','').trim()!==''?`<p>${escape(text(c,'lesson',''))}</p>`:``:text(summaryUI,'unread','Chưa xem phần kiểm tra.').trim()!==''?`<p>${escape(text(summaryUI,'unread','Chưa xem phần kiểm tra.'))}</p>`:''}</li>`;}).join('');
    const processItems=[1,2,3,4].map((num)=>text(summaryUI,`process_${num}`,['Xác định yêu cầu','Nhờ AI hỗ trợ','Tự kiểm tra','Ghi phần đóng góp'][num-1]).trim()!==''?`<li><span>${String(num).padStart(2,'0')}</span>${escape(text(summaryUI,`process_${num}`,['Xác định yêu cầu','Nhờ AI hỗ trợ','Tự kiểm tra','Ghi phần đóng góp'][num-1]))}</li>`:'').filter(Boolean);
    const process=sectionOn('summary_process')&&processItems.length?`<ol class="process" data-scroll-enter>${processItems.join('')}</ol>`:'';
    const log=sectionOn('summary_log')&&enabled.length?`<section class="log-section" data-scroll-enter aria-labelledby="log-title">${text(summaryUI,'log_title','Em kiểm tra từng tình huống ra sao?').trim()!==''?`<h2 id="log-title">${escape(text(summaryUI,'log_title','Em kiểm tra từng tình huống ra sao?'))}</h2>`:''}<div class="table-wrap">${text(summaryUI,'log_caption','Cách kiểm tra và kết luận trong các ví dụ').trim()!==''?`<table><caption>${escape(text(summaryUI,'log_caption','Cách kiểm tra và kết luận trong các ví dụ'))}</caption><thead><tr><th scope="col">${escape(text(summaryUI,'log_col_1','Tình huống'))}</th><th scope="col">${escape(text(summaryUI,'log_col_2','Cách kiểm tra ví dụ'))}</th><th scope="col">${escape(text(summaryUI,'log_col_3','Kết luận trong ví dụ'))}</th></tr></thead><tbody>${enabled.map(i=>{const c=data[i];return `<tr><td>${escape(text(c,'title',''))}</td><td>${state.opened[i]?escape(text(c,'method','')):escape(text(summaryUI,'unread','Chưa xem phần kiểm tra.'))}</td><td>${state.opened[i]?escape(text(c,'verdict','')):escape(text(summaryUI,'unread','Chưa xem phần kiểm tra.'))}</td></tr>`;}).join('')}</tbody></table>`:''}</div></section>`:'';
    const report=sectionOn('project_report')?projectReport():'';
    const header=sectionOn('summary_header')?`<header class="summary-hero">${text(summaryUI,'eyebrow_prefix','ĐÃ XEM PHẦN KIỂM TRA').trim()!==''?`<p class="eyebrow" data-enter="0">${escape(text(summaryUI,'eyebrow_prefix','ĐÃ XEM PHẦN KIỂM TRA'))} ${count}/${enabled.length} TÌNH HUỐNG</p>`:''}${(text(summaryUI,'title_1','DÙNG AI.').trim()!==''||text(summaryUI,'title_2','TỰ KIỂM TRA.').trim()!=='')?`<h1 id="summary-title" tabindex="-1" data-enter="100">${text(summaryUI,'title_1','DÙNG AI.').trim()!==''?escape(text(summaryUI,'title_1','DÙNG AI.')):''}${text(summaryUI,'title_2','TỰ KIỂM TRA.').trim()!==''?`<span>${escape(text(summaryUI,'title_2','TỰ KIỂM TRA.'))}</span>`:''}</h1>`:''}${text(summaryUI,'copy','').trim()!==''?`<p class="summary-copy" data-enter="220">${escape(text(summaryUI,'copy',''))}</p>`:''}${sectionOn('summary_count')?`<div class="summary-count" aria-hidden="true">${String(count).padStart(2,'0')}${text(summaryUI,'count_label','ĐÃ XEM').trim()!==''?`<small>${escape(text(summaryUI,'count_label','ĐÃ XEM'))}</small>`:''}</div>`:''}</header>`:'';
    const results=sectionOn('summary_results')&&enabled.length?`<ol class="result-list" data-enter="300">${resultRows}</ol>`:'';
    const noScore=sectionOn('summary_no_score')&&text(summaryUI,'no_score','').trim()!==''?`<p class="no-score">${escape(text(summaryUI,'no_score',''))}</p>`:'';
    const restart=sectionOn('summary_restart')&&text(summaryUI,'restart','Xem lại từ đầu').trim()!==''?`<button class="button primary" type="button" data-action="restart">${escape(text(summaryUI,'restart','Xem lại từ đầu'))}</button>`:'';
    const aria=sectionOn('summary_header')&&((text(summaryUI,'title_1','DÙNG AI.').trim()!=='')||(text(summaryUI,'title_2','TỰ KIỂM TRA.').trim()!==''))?' aria-labelledby="summary-title"':'';
    return parseElement(`<section class="screen summary"${aria}>${header}${results}${noScore}${process}${restart}${log}${report}</section>`);
  }

  function applyWebsiteText(){
    document.title=text(website,'title',document.title);
    const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=text(website,'description',meta.content);
    const brand=$('.brand');
    if(brand){brand.setAttribute('aria-label',text(website,'brand_aria','AI ơi, chắc chưa? — Trang đầu'));brand.querySelector('.brand-mark')?.replaceChildren(document.createTextNode('?'));const spans=brand.querySelectorAll(':scope > span');const line1=text(website,'brand_line1','AI ƠI,').trim(),line2=text(website,'brand_line2','CHẮC CHƯA?').trim();if(spans[1])spans[1].innerHTML=`${line1?escape(line1):''}${line1&&line2?'<br>':''}${line2?escape(line2):''}`;}
    const subject=document.querySelector('.header-subject');if(subject){const a=text(website,'subject','TIN HỌC 9').trim(),b=text(website,'subject_suffix','LỚP 9/13').trim();subject.innerHTML=`${a?escape(a):''}${a&&b?' <i>/</i> ':''}${b?escape(b):''}`;subject.hidden=!a&&!b;}
    const footer=document.querySelector('.site-footer');if(footer){const spans=footer.querySelectorAll('span');if(spans[0])spans[0].textContent=text(website,'footer_left','PHAN GIA HUY / 9/13');if(spans[1])spans[1].textContent=text(website,'footer_middle','AI hỗ trợ. Em tự kiểm tra.');if(spans[2])spans[2].textContent=text(website,'footer_right','CÔ HÀ THỊ HẠNH');footer.hidden=!sectionOn('footer');}
    const header=document.querySelector('.site-header');if(header)header.hidden=!sectionOn('header');
    const opening=$('opening');if(opening){opening.hidden=!sectionOn('opening');const authorName=text(website,'author','Phan Gia Huy').trim(),className=text(website,'class','9/13').trim(),teacherName=text(website,'teacher','Cô Hà Thị Hạnh').trim();opening.setAttribute('aria-label',`Giới thiệu${authorName?' '+authorName+',':''}${className?' lớp '+className+',':''}${teacherName?' '+teacherName:''}`.replace(/, $/,''));const author=document.querySelector('.cut-author');if(author)author.hidden=!authorName;const authorOver=document.querySelector('.cut-author .credit-overline');if(authorOver)authorOver.textContent=authorName.split(' ').slice(0,-1).join(' ');const authorFront=document.querySelector('.cut-author .credit-display');if(authorFront&&authorName){const last=authorName.split(' ').pop()||'';authorFront.innerHTML=[...last].map(ch=>`<span class="credit-letter"><span class="glyph-echo">${escape(ch)}</span><span class="glyph-front">${escape(ch)}</span></span>`).join('');}const cls=document.querySelector('.cut-class');if(cls)cls.hidden=!className;const parts=className.split('/');document.querySelector('.cut-class p')?.setAttribute('aria-label',className?`Lớp ${className}`:'');document.querySelector('.cut-class .credit-digit.digit-nine')?.replaceChildren(document.createTextNode(parts[0]||''));document.querySelector('.cut-class .credit-digit.digit-one')?.replaceChildren(document.createTextNode(parts[1]?.[0]||''));document.querySelector('.cut-class .credit-digit.digit-three')?.replaceChildren(document.createTextNode(parts[1]?.[1]||''));const teacher=document.querySelector('.cut-teacher');if(teacher)teacher.hidden=!teacherName;const teach=document.querySelector('.cut-teacher .credit-overline');if(teach)teach.textContent=teacherName.split(' ').slice(0,-1).join(' ');const teachFront=document.querySelector('.cut-teacher .credit-display');if(teachFront&&teacherName){const last=teacherName.split(' ').pop()||'';teachFront.innerHTML=[...last].map(ch=>`<span class="credit-letter"><span class="glyph-echo">${escape(ch)}</span><span class="glyph-front">${escape(ch)}</span></span>`).join('');}}
    document.querySelector('.skip-link')?.replaceChildren(document.createTextNode(text(globalUI,'skip_link','Đến nội dung chính')));
    const commandButton=document.querySelector('#command-button');if(commandButton){commandButton.querySelector('span')?.replaceChildren(document.createTextNode(text(globalUI,'command_button','Điều khiển')));commandButton.setAttribute('aria-label',text(globalUI,'command_button','Điều khiển'));}
    const noscript=document.querySelector('noscript');if(noscript){const title=text(noscriptUI,'title','AI ƠI, CHẮC CHƯA?'),message=text(noscriptUI,'message','Bật JavaScript trong trình duyệt để xem các tình huống và cách kiểm tra câu trả lời của AI.'),credits=text(noscriptUI,'credits','Phan Gia Huy · Lớp 9/13 · Cô Hà Thị Hạnh');const h=noscript.querySelector('h1'),p=noscript.querySelectorAll('p');if(h)h.textContent=title;if(p[0])p[0].textContent=message;if(p[1])p[1].textContent=credits;}
    const cmdTitle=$('command-title');if(cmdTitle)cmdTitle.textContent=text(dialogUI,'control_title','Điều khiển');const cmdClose=$('close-command');if(cmdClose)cmdClose.setAttribute('aria-label',text(dialogUI,'close','Đóng điều khiển'));
    const menuLabels=document.querySelectorAll('#command-dialog .menu-label');if(menuLabels[0])menuLabels[0].textContent=text(dialogUI,'appearance','GIAO DIỆN');if(menuLabels[1])menuLabels[1].textContent=text(dialogUI,'effects','HIỆU ỨNG');
    const themeButtons=document.querySelectorAll('[data-theme-option]');themeButtons.forEach(b=>{if(b.dataset.themeOption==='light')b.lastChild.textContent=` ${text(dialogUI,'light','Sáng')}`;if(b.dataset.themeOption==='dark')b.lastChild.textContent=` ${text(dialogUI,'dark','Tối')}`;});
    const modeButtons=document.querySelectorAll('[data-mode]');modeButtons.forEach(b=>{b.textContent=b.dataset.mode==='cinematic'?text(dialogUI,'full','Đầy đủ'):text(dialogUI,'compact','Gọn nhẹ');});
    const settingRows=document.querySelectorAll('#command-dialog .setting-row');if(settingRows[0]){settingRows[0].querySelector(':scope > span')?.childNodes[0]&&(settingRows[0].querySelector(':scope > span').childNodes[0].textContent=text(dialogUI,'motion','Chuyển động'));settingRows[0].querySelector('small')?.replaceChildren(document.createTextNode(text(dialogUI,'motion_note','Bật sẵn khi mở web')));}if(settingRows[1]){settingRows[1].querySelector(':scope > span')?.childNodes[0]&&(settingRows[1].querySelector(':scope > span').childNodes[0].textContent=text(dialogUI,'sound','Âm thanh'));}const volumeLabel=document.querySelector('.sound-volume-control > label');if(volumeLabel){volumeLabel.childNodes[0].textContent=text(dialogUI,'volume','Âm lượng');}
    document.querySelector('.menu-links #replay-opening span:first-child')?.replaceChildren(document.createTextNode(text(dialogUI,'replay','Xem lại giới thiệu')));document.querySelector('.menu-links #replay-opening .menu-meta')?.replaceChildren(document.createTextNode(text(dialogUI,'replay_meta','3,5 GIÂY')));
    document.querySelector('.menu-links button[data-action="home"] span:first-child')?.replaceChildren(document.createTextNode(text(dialogUI,'go_home','Về trang đầu')));document.querySelector('.menu-links button[data-action="home"] .menu-meta')?.replaceChildren(document.createTextNode(text(dialogUI,'go_home_meta','09 TÌNH HUỐNG')));
    const creditSpans=document.querySelectorAll('.menu-credits span');if(creditSpans[0])creditSpans[0].textContent=text(dialogUI,'credits_line1',text(website,'author','PHAN GIA HUY'));if(creditSpans[1])creditSpans[1].textContent=text(dialogUI,'credits_line2',`${text(website,'class','9/13')} · ${text(website,'teacher','Cô Hà Thị Hạnh')}`);
    const evidenceClose=document.querySelector('#evidence-dialog .close-button');if(evidenceClose)evidenceClose.setAttribute('aria-label',text(evidenceUI,'close','Đóng phần kiểm tra'));
    const evidenceBack=document.querySelector('#evidence-dialog .secondary');if(evidenceBack)evidenceBack.textContent=text(evidenceUI,'back','Quay lại tình huống');
    document.documentElement.style.setProperty('--chapter-columns',String(layout.chapterColumns??3));
  }

  function setAtmosphere(scene){
    const colors=palette(scene);
    document.documentElement.style.setProperty('--accent',colors.accent);
    document.documentElement.style.setProperty('--accent-rgb',colors.rgb);
    document.documentElement.style.setProperty('--scene-canvas',scene.canvas);
    document.body.dataset.scene=scene.kind;
  }
  function render(route,index){
    const root=route==='home'?homeView():route==='summary'?summaryView():caseView(index);
    root.style.visibility='hidden';
    return root;
  }
  function announce(message){$('live-status').textContent=message;}
  function focusMain(){const title=$('main').querySelector('h1');if(title)title.focus({preventScroll:true});}
  function watchScroll(root){
    if(scrollObserver)scrollObserver.disconnect();
    if(!('IntersectionObserver' in window)||!motion.active())return;
    scrollObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;scrollObserver.unobserve(entry.target);
      motion.reveal(entry.target,{duration:780,y:32,scale:.976});
      entry.target.querySelectorAll('.chapter,.result-row').forEach((el,i)=>motion.reveal(el,{delay:Math.min(i*55,270),duration:580,y:25,scale:.965}));
    }),{threshold:.07});
    root.querySelectorAll('[data-scroll-enter]').forEach(el=>scrollObserver.observe(el));
  }

  const controller={
    async go(route,index=state.index,{reset=false}={}){
      if(state.busy||state.opening||evidenceBusy)return false;
      if(!['home','case','summary'].includes(route))throw new Error('Unknown scene');
      if(route==='case'&&(!Number.isInteger(index)||index<0||index>=data.length||!caseOn(index)))throw new RangeError(`Case must be enabled and between 0–${data.length-1}`);
      if(route===state.route&&(route!=='case'||index===state.index)&&!reset)return true;
      state.busy=true;const epoch=++state.epoch,main=$('main'),sheet=$('transition-layer'),old=main.firstElementChild;
      main.inert=true;main.setAttribute('aria-busy','true');document.body.dataset.phase='exit';
      const design=route==='case'?scenes[index]:route==='summary'?scenes[8]:scenes[0];
      const colors=palette(design);
      sheet.style.setProperty('--from-rgb',getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb'));
      sheet.style.setProperty('--to-rgb',colors.rgb);
      let next=null;
      const commit=()=>{
        if(epoch!==state.epoch)return;
        if(reset){state.choices=Array(data.length).fill(null);state.opened=Array(data.length).fill(false);}
        next=render(route,index);
        motion.cancelWithin(old);main.replaceChildren(next);
        next.style.visibility='';
        state.route=route;state.index=index;setAtmosphere(design);
        window.scrollTo({top:0,behavior:'instant'});
        document.body.dataset.phase='enter';
      };
      try{
        sound.effect('transition',index);
        await motion.refocus(main,sheet,async()=>{
          commit();
          if(next){await (await sculpture).Sculpture.prepare(next);motion.study(next,design.kind,{still:true});}
        },{kind:design.kind});
        if(next)watchScroll(next);
        announce(route==='case'?`Tình huống ${index+1}/${data.length}: ${data[index].title}`:route==='summary'?(text(summaryUI,'announce_summary','Trang tổng kết và phần đóng góp của em.')):(text(summaryUI,'announce_home','Trang giới thiệu sản phẩm.')));
        return true;
      }finally{
        if(epoch===state.epoch){sheet.hidden=true;motion.cancelWithin(sheet);main.firstElementChild?.style.removeProperty('visibility');state.busy=false;main.inert=false;main.removeAttribute('aria-busy');document.body.dataset.phase='active';focusMain();}
      }
    }
  };

  function choose(value){
    if(state.busy||state.opening||state.route!=='case'||!['trust','verify'].includes(value))return false;
    state.choices[state.index]=value;
    const main=$('main');main.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.choice===value)));
    const status=main.querySelector('.choice-status');if(status)status.textContent=joinText(text(caseUI,'after_choice_prefix','Em chọn '),value==='trust'?text(caseUI,'trust_status','Có vẻ hợp lí.'):text(caseUI,'verify_status','Cần kiểm tra thêm.'),text(caseUI,'choice_after',' Xem phần kiểm tra để đối chiếu.'));
    const button=main.querySelector('.evidence-button');if(!button)return true;const wasHidden=button.hidden;button.hidden=false;
    if(wasHidden)motion.reveal(button,{duration:420,y:8,scale:.92});
    motion.play(main.querySelector('.case-object'),[{transform:'none'},{transform:`scale(${value==='trust'?1.018:.985})`,filter:motion.blur(1),offset:.5,easing:motion.EASE.settle},{transform:'none',filter:motion.blur(0)}],{duration:480});
    return true;
  }
  async function openEvidence(){
    if(state.route!=='case'||state.busy||state.opening||evidenceBusy||!state.choices[state.index])return false;
    const dialog=$('evidence-dialog');if(dialog.open)return true;
    evidenceBusy=true;const epoch=++evidenceEpoch,c=data[state.index];
    dialog.dataset.phase='enter';$('evidence-next').disabled=true;
    dialog.querySelector('.evidence-bottom').inert=true;
    $('evidence-index').textContent=`${text(evidenceUI,'index_prefix','KIỂM TRA VÍ DỤ')}${text(evidenceUI,'index_prefix','KIỂM TRA VÍ DỤ').trim()?' / ':''}${n(state.index)}`;
    $('evidence-content').innerHTML=`<div class="evidence-heading" data-evidence-enter><span class="evidence-stamp"><i aria-hidden="true">✓</i> ${escape(text(evidenceUI,'stamp','EM ĐỐI CHIẾU'))}</span><h2 id="evidence-title" tabindex="-1">${escape(c.verdict)}</h2></div><div class="evidence-grid"><div data-evidence-enter><p class="evidence-label">${escape(text(evidenceUI,'records','Dữ kiện trong ví dụ'))}</p><dl class="records">${c.records.map(r=>`<div class="record"><dt>${escape(r.label)}</dt><dd>${escape(r.text)}</dd></div>`).join('')}</dl></div><div class="evidence-reason"><div class="reason-block" data-evidence-enter><p class="evidence-label">${escape(text(evidenceUI,'proof','Vì sao em kết luận như vậy?'))}</p><p>${escape(c.proof)}</p></div><div class="reason-block" data-evidence-enter><p class="evidence-label">${escape(text(evidenceUI,'method','Cách em kiểm tra'))}</p><p>${escape(c.method)}</p></div><div class="reason-block" data-evidence-enter><p class="evidence-label">${escape(text(evidenceUI,'better','Câu trả lời sau khi đối chiếu'))}</p><p class="better-answer">${escape(c.better)}</p></div><div class="reason-block" data-evidence-enter><p class="evidence-label">${escape(text(evidenceUI,'support','AI giúp ở khâu nào?'))}</p><p>${escape(c.support)}</p></div><div class="reason-block" data-evidence-enter><p class="evidence-label">${escape(text(evidenceUI,'student','Phần người học tự làm'))}</p><p>${escape(c.studentWork)}</p></div></div></div><p class="lesson" data-evidence-enter>${escape(c.lesson)}</p>`;
    $('evidence-next').textContent=nextEnabledCase(state.index)===-1?text(caseUI,'summary_button',text(evidenceUI,'summary_next','Xem tổng kết')):text(caseUI,'next_button',text(evidenceUI,'next','Sang tình huống tiếp'));
    document.body.classList.add('has-evidence');
    if(typeof dialog.showModal==='function')dialog.showModal();else{dialog.setAttribute('open','');dialog.setAttribute('aria-modal','true');$('site-ui').inert=true;}
    dialog.scrollTop=0;sound.effect('evidence');
    state.opened[state.index]=true;
    const next=$('main').querySelector('[data-action=next]');if(next)next.hidden=false;
    const evidenceButton=$('main').querySelector('.evidence-button');if(evidenceButton)evidenceButton.textContent=text(caseUI,'evidence_button_read','Xem lại cách kiểm tra');
    $('main').querySelector(`.case-rail [data-case="${state.index}"]`)?.classList.add('is-read');
    const jobs=[motion.play(dialog,[{opacity:0,transform:'perspective(1600px) translate3d(0,75px,-200px) rotateX(7deg) scale(.87)',filter:motion.blur(10),easing:motion.EASE.velocity},{opacity:1,transform:'translate3d(0,-2px,0) scale(1.009)',filter:motion.blur(0),offset:.76,easing:motion.EASE.settle},{opacity:1,transform:'none',filter:motion.blur(0)}],{duration:660})];
    dialog.querySelectorAll('[data-evidence-enter]').forEach((el,i)=>jobs.push(motion.reveal(el,{delay:Math.min(160+i*85,540),duration:480,y:18,scale:.98})));
    await Promise.all(jobs);
    if(epoch===evidenceEpoch){evidenceBusy=false;dialog.dataset.phase='active';$('evidence-next').disabled=false;dialog.querySelector('.evidence-bottom').inert=false;$('evidence-title').focus({preventScroll:true});}
    return true;
  }
  async function closeEvidence({animate=true,restoreFocus=true}={}){
    const dialog=$('evidence-dialog');if(!dialog.open)return;
    const epoch=++evidenceEpoch;evidenceBusy=true;dialog.dataset.phase='exit';$('evidence-next').disabled=true;motion.cancelWithin(dialog);
    if(animate)await motion.play(dialog,[{opacity:1,transform:'none',easing:motion.EASE.exit},{opacity:0,transform:'translate3d(0,20px,0) scale(.95)',filter:motion.blur(5)}],{duration:230,hold:true});
    if(epoch!==evidenceEpoch)return;
    if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');
    motion.cancelWithin(dialog);document.body.classList.remove('has-evidence');$('site-ui').inert=false;evidenceBusy=false;
    if(restoreFocus)$('main').querySelector('.evidence-button')?.focus({preventScroll:true});
  }
  async function next(){
    if(!state.opened[state.index]||state.route!=='case'||state.busy)return false;
    if($('evidence-dialog').open)await closeEvidence({animate:false,restoreFocus:false});
    const target=nextEnabledCase(state.index);
    return controller.go(target===-1?'summary':'case',target===-1?state.index:target);
  }
  function closeCommand(){const dialog=$('command-dialog');if(dialog.open||dialog.hasAttribute('open')){if(typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');$('site-ui').inert=false;}motion.cancelWithin(dialog);$('command-button').focus({preventScroll:true});}}
  function openCommand(){if(state.opening||$('evidence-dialog').open)return;const d=$('command-dialog');if(d.open||d.hasAttribute('open')){closeCommand();return;}if(typeof d.showModal==='function')d.showModal();else{d.setAttribute('open','');d.setAttribute('aria-modal','true');$('site-ui').inert=true;}motion.reveal(d,{duration:360,x:14,y:-7,scale:.94});}
  function setMode(mode){
    if(!['cinematic','performance'].includes(mode))return;
    state.mode=mode;document.body.classList.toggle('performance',mode==='performance');document.body.classList.toggle('cinematic',mode==='cinematic');
    document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
    $('mode-description').textContent=mode==='cinematic'?(text(dialogUI,'cinematic_desc','Hiển thị đầy đủ hiệu ứng.')):(text(dialogUI,'performance_desc','Giảm hiệu ứng để web chạy mượt hơn.'));
    saved.set('ai-cinema-mode',mode);
  }
  function setTheme(theme){
    if(!['light','dark'].includes(theme))return;
    state.theme=theme;document.documentElement.dataset.theme=theme;
    document.querySelectorAll('[data-theme-option]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeOption===theme)));
    document.querySelector('meta[name="theme-color"]').content=theme==='light'?'#f4f8fc':'#050505';
    setAtmosphere(state.route==='case'?scenes[state.index]:state.route==='summary'?scenes[8]:scenes[0]);
    if(!state.busy)motion.focus($('main').firstElementChild,{duration:420,amount:6});
  }
  function setMotion(enabled){motion.enabled=enabled;$('motion-setting').checked=enabled;if(!enabled&&state.opening)finishOpening();}
  function soundUI(event){
    const on=sound.enabled&&sound.unlocked&&sound.volume>0;
    $('sound-setting').checked=sound.enabled;
    $('sound-button').setAttribute('aria-pressed',String(on));
    $('sound-button').setAttribute('aria-label',on?text(globalUI,'sound_on_aria','Tắt âm thanh'):text(globalUI,'sound_off_aria','Bật âm thanh'));
    $('sound-volume').value=Math.round(sound.volume*100);
    $('sound-volume-value').textContent=`${Math.round(sound.volume*100)}${text(globalUI,'sound_volume_suffix','%')}`;
    const notes={playing:text(globalUI,'sound_note_playing','Âm thanh đang bật'),blocked:text(globalUI,'sound_note_blocked','Âm thanh bật sau lần chạm đầu'),muted:text(globalUI,'sound_note_muted','Âm thanh đang tắt'),loading:text(globalUI,'sound_note_loading','Đang chuẩn bị âm thanh'),error:text(globalUI,'sound_note_error','Chưa tải được âm thanh')};
    $('sound-note').textContent=sound.volume===0?text(globalUI,'sound_note_zero','Âm lượng đang ở 0%'):(notes[sound.state]??'');
    document.body.dataset.soundState=sound.state;
    if(event?.detail?.cue)document.body.dataset.soundCue=event.detail.cue;
  }

  function finishOpening(epoch=openingEpoch){
    if(epoch!==openingEpoch||!state.opening)return;
    clearTimeout(openingTimer);clearTimeout(bridgeTimer);
    $('opening').hidden=true;motion.cancelWithin($('opening'));state.opening=false;
    document.body.classList.remove('is-opening');document.body.dataset.phase='active';
    $('site-ui').hidden=false;$('site-ui').inert=false;sound.stopIntro();
    if(state.route==='home'&&!$('main').dataset.bridged)motion.enter($('main').firstElementChild,{still:true});
    delete $('main').dataset.bridged;focusMain();
  }
  function runOpeningFilm(epoch,time=performance.now()){
    clearTimeout(openingTimer);clearTimeout(bridgeTimer);
    openingStart=time;
    const opening=$('opening');motion.cancelWithin(opening);
    const introDuration=motion.film(opening);
    if(motion.reviewFrame!==null)return;
    const elapsed=Math.max(0,performance.now()-time);
    bridgeTimer=setTimeout(()=>{if(state.opening&&epoch===openingEpoch){$('site-ui').hidden=false;if(state.route==='home'){motion.enter($('main').firstElementChild,{still:true});$('main').dataset.bridged='true';}}},Math.max(0,introDuration-185-elapsed));
    openingTimer=setTimeout(()=>finishOpening(epoch),Math.max(0,introDuration-elapsed));
  }
  document.addEventListener('introstart',event=>{
    if(!state.opening||motion.reviewFrame!==null)return;
    const startedAt=event.detail.startedAt;
    // A blocked or slow score starts from its first beat, with a fresh visual timeline.
    if(startedAt-openingStart<40)return;
    $('site-ui').hidden=true;delete $('main').dataset.bridged;
    runOpeningFilm(openingEpoch,startedAt);
  });
  function startOpening({gesture=false}={}){
    if(state.busy||evidenceBusy)return;
    closeCommand();clearTimeout(openingTimer);clearTimeout(bridgeTimer);
    const opening=$('opening'),epoch=++openingEpoch;
    state.opening=true;document.body.classList.add('is-opening');document.body.dataset.phase='opening';
    opening.hidden=false;$('site-ui').inert=true;
    motion.cancelWithin(opening);sound.reserveIntro();
    if(!motion.active()){finishOpening(epoch);return;}
    if(sound.enabled&&motion.reviewFrame===null)void (gesture?sound.unlock():sound.tryAutoplay());
    runOpeningFilm(epoch);
    if(motion.reviewFrame===null)sound.startIntro(openingStart);
    opening.focus({preventScroll:true});
    if(motion.reviewFrame!==null)return;
  }
  $('replay-opening').addEventListener('click',()=>startOpening({gesture:true}));
  $('command-button').addEventListener('click',openCommand);$('close-command').addEventListener('click',closeCommand);
  $('motion-setting').addEventListener('change',e=>setMotion(e.target.checked));
  $('sound-setting').addEventListener('change',e=>{sound.enabled=e.target.checked;saved.set('ai-cinema-sound',String(sound.enabled));});
  $('sound-button').addEventListener('click',()=>{
    const on=sound.enabled&&sound.unlocked&&sound.volume>0;
    if(!on&&sound.volume===0){sound.volume=.82;saved.set('ai-cinema-volume','0.82');}
    sound.enabled=!on;saved.set('ai-cinema-sound',String(sound.enabled));soundUI();
  });
  $('sound-volume').addEventListener('input',e=>{sound.volume=Number(e.target.value)/100;saved.set('ai-cinema-volume',String(sound.volume));});
  document.addEventListener('soundchange',soundUI);
  $('evidence-next').addEventListener('click',next);
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  document.querySelectorAll('[data-theme-option]').forEach(b=>b.addEventListener('click',()=>setTheme(b.dataset.themeOption)));
  document.addEventListener('click',e=>{
    const button=e.target.closest('button');
    if(!button){
      const stage=e.target.closest('.depth-stage');
      if(stage&&!state.busy)motion.artImpulse(stage.closest('.case-art'),scenes[state.index].kind);
      return;
    }
    if(button.closest('#opening')||button.closest('#command-dialog')){}else motion.ripple(button,e);
    if(!button.closest('#opening')&&button.dataset.case===undefined&&!['home','next','evidence','restart'].includes(button.dataset.action)&&button.id!=='evidence-next'&&button.id!=='replay-opening')sound.effect('click');
    if(button.dataset.case!==undefined){controller.go('case',Number(button.dataset.case));return;}
    if(button.dataset.choice){choose(button.dataset.choice);return;}
    if(button.hasAttribute('data-art-motion')){motion.artImpulse(button.closest('.case-art'),scenes[state.index].kind);return;}
    switch(button.dataset.action){
      case 'home':closeCommand();controller.go('home');break;
      case 'evidence':openEvidence();break;
      case 'close-evidence':closeEvidence();break;
      case 'next':next();break;
      case 'restart':controller.go('case',0,{reset:true});break;
    }
  });
  document.addEventListener('keydown',e=>{
    if(state.opening){
      if(e.key==='Escape'){e.preventDefault();finishOpening();}
      if(e.key==='Tab'){
        e.preventDefault();
        $('opening').focus({preventScroll:true});
      }
      return;
    }
    if(e.key==='Escape'&&$('command-dialog').open){e.preventDefault();closeCommand();}
  });
  $('evidence-dialog').addEventListener('cancel',e=>{e.preventDefault();closeEvidence();});
  $('command-dialog').addEventListener('cancel',e=>{e.preventDefault();closeCommand();});
  for(const id of ['evidence-dialog','command-dialog'])$(id).addEventListener('click',e=>{if(e.target!==$(id))return;const rect=$(id).getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom){if(id==='evidence-dialog')closeEvidence();else closeCommand();}});
  document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('is-background',document.hidden);if(!document.hidden&&state.opening&&document.body.dataset.phase==='opening'){if(performance.now()-openingStart>=motion.FILM_MS)finishOpening();else sound.alignIntro();}});
  window.addEventListener('pagehide',()=>{sound.stop();});

  /* Inertial pointer response: no constant render loop once the cursor settles. */
  let pointerFrame=0,targetX=0,targetY=0,currentX=0,currentY=0;
  const trackPointer=()=>{
    currentX+=(targetX-currentX)*.08;currentY+=(targetY-currentY)*.08;
    document.body.style.setProperty('--pointer-x',currentX.toFixed(2)+'px');document.body.style.setProperty('--pointer-y',currentY.toFixed(2)+'px');
    if(Math.abs(currentX-targetX)+Math.abs(currentY-targetY)>.05)pointerFrame=requestAnimationFrame(trackPointer);else pointerFrame=0;
  };
  document.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch'||state.mode==='performance'||!motion.active()||motion.mobile()||state.opening)return;
    targetX=(e.clientX/innerWidth-.5)*28;targetY=(e.clientY/innerHeight-.5)*22;
    document.body.style.setProperty('--mouse-x',e.clientX+'px');document.body.style.setProperty('--mouse-y',e.clientY+'px');
    if(!pointerFrame)pointerFrame=requestAnimationFrame(trackPointer);
    const card=e.target.closest('[data-tilt]');if(!card)return;
    const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
    card.style.setProperty('--glow-x',(x*100).toFixed(1)+'%');card.style.setProperty('--glow-y',(y*100).toFixed(1)+'%');
    const hero=card.classList.contains('hero-proof');
    card.style.setProperty('--tilt-x',((.5-y)*(hero?9:3.6)).toFixed(2)+'deg');card.style.setProperty('--tilt-y',((x-.5)*(hero?14:4.8)).toFixed(2)+'deg');
  },{passive:true});
  document.addEventListener('pointerout',e=>{const card=e.target.closest('[data-tilt]');if(card&&(!e.relatedTarget||!card.contains(e.relatedTarget))){card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');}},{passive:true});
  let scrollFrame=0,scrollReset=0,lastScroll=0;
  window.addEventListener('scroll',()=>{if(scrollFrame||state.busy||state.opening||state.mode==='performance'||!motion.active())return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;const root=$('main').firstElementChild;if(!root)return;const speed=Math.min(1.5,Math.abs(scrollY-lastScroll)*.014);lastScroll=scrollY;root.querySelectorAll('[data-scroll-depth]').forEach(el=>{const r=el.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;const progress=Math.min(1,Math.max(0,-r.top/Math.max(1,r.height)));const planes=el.querySelectorAll('.hero-plane');planes.forEach((plane,i)=>{plane.style.translate=`0 ${(-progress*(i+1)*25).toFixed(1)}px`;});el.style.setProperty('--scroll-scale',String(1+progress*(motion.mobile()?.012:.035)));el.style.setProperty('--scroll-y',(-progress*(motion.mobile()?7:22)).toFixed(1)+'px');el.style.setProperty('--scroll-blur',speed.toFixed(2)+'px');});clearTimeout(scrollReset);scrollReset=setTimeout(()=>root.querySelectorAll('[data-scroll-depth]').forEach(el=>el.style.setProperty('--scroll-blur','0px')),130);});},{passive:true});

  /* Browser-agent tools use exactly the same visible state and actions. */
  const webContext=document.modelContext;
  if(webContext?.registerTool){
    const lifecycle=new AbortController();
    const read=()=>({route:state.route,case:state.route==='case'?state.index+1:null,busy:state.busy,choices:[...state.choices],evidenceRead:[...state.opened]});
    const definitions=[
      {name:'read_learning_progress',title:'Xem tiến trình học',description:'Read the current learning scene, choices and evidence opened.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:read},
      {name:'open_learning_case',title:'Mở tình huống',description:'Navigate to one of the nine AI verification cases.',inputSchema:{type:'object',properties:{case:{type:'integer',minimum:1,maximum:9}},required:['case'],additionalProperties:false},execute:async input=>{if(!Number.isInteger(input?.case)||input.case<1||input.case>9)throw new RangeError('case must be 1–9');if(state.opening)finishOpening();await controller.go('case',input.case-1);return read();}},
      {name:'choose_and_open_evidence',title:'Xem cách kiểm tra',description:'Record trust or verify for the current case and open its evidence.',inputSchema:{type:'object',properties:{choice:{type:'string',enum:['trust','verify']}},required:['choice'],additionalProperties:false},execute:async input=>{if(!['trust','verify'].includes(input?.choice))throw new TypeError('choice must be trust or verify');if(!choose(input.choice))throw new Error('A case must be active');await openEvidence();return read();}}
    ];
    definitions.forEach(tool=>{try{Promise.resolve(webContext.registerTool({...tool,annotations:{readOnlyHint:false,...tool.annotations,untrustedContentHint:false}},{signal:lifecycle.signal})).catch(()=>{});}catch(_){}});
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }

  async function boot(){
    applyWebsiteText();
    setMode(saved.get('ai-cinema-mode')==='performance'?'performance':'cinematic');
    motion.enabled=true;$('motion-setting').checked=true;
    setTheme('light');
    sound.enabled=true;
    const soundVolume=Number(saved.get('ai-cinema-volume'));
    if(Number.isFinite(soundVolume)&&soundVolume>0)sound.volume=soundVolume;soundUI();
    const showIntro=motion.active()&&sectionOn('opening');
    if(showIntro)sound.reserveIntro();void sound.prepare();
    const root=homeView();$('main').replaceChildren(root);setAtmosphere(scenes[0]);
    if(document.fonts){await Promise.race([Promise.all([document.fonts.load('400 16px Cinema'),document.fonts.load('700 16px Cinema'),document.fonts.load('400 16px Editorial')]),delay(800)]);}
    $('site-ui').hidden=false;watchScroll(root);
    if(showIntro)startOpening();
    else{$('opening').hidden=true;document.body.classList.remove('is-opening');document.body.dataset.phase='active';motion.enter(root,{still:true});}
  }
  boot().catch(error=>{ console.error('Không thể mở phần giới thiệu:',error); $('opening').hidden=true;$('site-ui').hidden=false;$('site-ui').inert=false;document.body.classList.remove('is-opening');$('main').firstElementChild?.style.removeProperty('visibility');announce('Nội dung đã sẵn sàng.'); });
})();
