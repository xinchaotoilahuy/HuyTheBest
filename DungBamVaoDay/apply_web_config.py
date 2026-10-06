#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONFIG = ROOT / 'WEB_CONFIG.txt'
OUTPUT = ROOT / 'js' / 'site-config.js'


def parse_value(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value.startswith('"') and value.endswith('"'):
        value = value[1:-1]
    return value.replace('\\n', '\n').replace('\\\\', '\\')


def read_config(path: Path):
    sections = {}
    current = None
    for raw in path.read_text(encoding='utf-8-sig').splitlines():
        # Do NOT strip the whole line: trailing spaces may be intentional in text values.
        line = raw
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        if stripped.startswith('[') and stripped.endswith(']'):
            current = stripped[1:-1].strip()
            sections[current] = {}
            continue
        if current is None or '=' not in line:
            continue
        key, value = line.split('=', 1)
        sections[current][key.strip()] = parse_value(value)
    return sections


def on(value: str | None) -> bool:
    return str(value or '').strip().upper() not in {'OFF', 'NO', 'FALSE', '0'}


def number(value: str | None, default: int) -> int:
    try:
        return int(str(value).strip())
    except Exception:
        return default


def build(sections):
    website = sections.get('WEBSITE', {})
    raw_sections = sections.get('SECTIONS', {})
    layout = sections.get('LAYOUT', {})
    home = sections.get('HOME', {})
    project = sections.get('PROJECT', {})
    case_ui = sections.get('CASE_UI', {})
    summary = sections.get('SUMMARY', {})
    dialog = sections.get('DIALOG', {})
    evidence = sections.get('EVIDENCE', {})
    global_ui = sections.get('GLOBAL_UI', {})
    noscript = sections.get('NOSCRIPT', {})

    cases = []
    for i in range(1, 10):
        c = sections.get(f'CASE_{i}', {})
        records = []
        for j in range(1, 5):
            label = c.get(f'record{j}_label')
            text = c.get(f'record{j}_text')
            if label is not None or text is not None:
                records.append({'label': label or '', 'text': text or ''})
        cases.append({
            'enabled': on(c.get('enabled', 'ON')),
            'kind': c.get('kind', ''),
            'short': c.get('short', ''),
            'category': c.get('category', ''),
            'mark': c.get('mark', ''),
            'title': c.get('title', ''),
            'context': c.get('context', ''),
            'question': c.get('question', ''),
            'answer': c.get('answer', ''),
            'verdict': c.get('verdict', ''),
            'records': records,
            'proof': c.get('proof', ''),
            'method': c.get('method', ''),
            'better': c.get('better', ''),
            'support': c.get('support', ''),
            'studentWork': c.get('studentWork', ''),
            'lesson': c.get('lesson', ''),
            'color': c.get('color', ''),
            'art_meta': c.get('art_meta', ''),
            'art_aria': c.get('art_aria', ''),
            'art_caption': c.get('art_caption', ''),
            'art_key1': c.get('art_key1', ''),
            'art_key1_note': c.get('art_key1_note', ''),
            'art_key2': c.get('art_key2', ''),
            'art_key2_note': c.get('art_key2_note', ''),
            'art_key3': c.get('art_key3', ''),
            'art_key3_note': c.get('art_key3_note', ''),
        })

    # These notes are intentionally kept in the text file too, so all visible project copy lives in one place.
    project_notes = {
        'task': project.get('task', 'Em xây dựng một website với 9 tình huống để luyện cách kiểm tra câu trả lời của AI trong học tập.'),
        'aiHelp': project.get('aiHelp', 'AI hỗ trợ chỉnh lời văn, gợi ý cách kiểm tra, sửa mã và hoàn thiện giao diện, minh họa, hiệu ứng.'),
        'check': project.get('check', 'Đối chiếu với dữ kiện trong từng ví dụ; tự tính lại bài Toán và lịch học. Khi dùng thông tin thật, tìm bản gốc và xem nguồn, thời điểm áp dụng.'),
        'student': project.get('student', 'Em tự viết nội dung ban đầu và một phần mã web. Em chọn cách trình bày và góp ý các bản sửa.'),
        'safety': project.get('safety_text', 'Dùng AI để hỗ trợ học tập. Kiểm tra nội dung và ghi rõ phần AI hỗ trợ.'),
        'scope': project.get('scope', 'Tên trường, nhân vật, thông báo và số liệu tuyển sinh trong 9 tình huống đều là giả định để học cách kiểm tra thông tin.'),
        'assignment': project.get('assignment', 'Sản phẩm theo chủ đề Tin học “Em làm chủ AI” của cuộc thi “Sản phẩm số của em”.'),
        'inspiration': project.get('inspiration', 'Em lấy ý tưởng nội dung từ bài học thực hành môn Tin học.'),
    }

    # Preserve old project-note fields when users want to add them later.
    out = {
        'website': website,
        'sections': {k: on(v) for k, v in raw_sections.items()},
        'layout': {
            'homeOrder': [x.strip() for x in layout.get('home_order', 'hero,credits,assignment,chapters,report').split(',') if x.strip()],
            'caseOrder': [x.strip() for x in layout.get('case_order', 'heading,brief,art,object,answer').split(',') if x.strip()],
            'caseBottomOrder': [x.strip() for x in layout.get('case_bottom_order', 'decision,next').split(',') if x.strip()],
            'chapterColumns': max(1, min(6, number(layout.get('chapter_columns'), 3))),
            'homeAlign': layout.get('home_align', 'left').strip().lower() or 'left',
        },
        'home': home,
        'project': project,
        'projectNotes': project_notes,
        'caseUI': case_ui,
        'summary': summary,
        'dialog': dialog,
        'evidence': evidence,
        'globalUI': global_ui,
        'noscript': noscript,
        'cases': cases,
    }
    return out


def validate(sections):
    known_sections={
        'WEBSITE','SECTIONS','LAYOUT','HOME','PROJECT','CASE_UI','SUMMARY','DIALOG','EVIDENCE','GLOBAL_UI','NOSCRIPT',
        *{f'CASE_{i}' for i in range(1,10)}
    }
    known_keys={
        'SECTIONS': {'opening','header','footer','home_hero','home_credits','home_assignment','chapters','project_report','case_art','case_ai_answer','case_decision','case_next','summary_process','summary_log','summary_header','summary_count','summary_results','summary_no_score','summary_restart','case_nav','case_rail','case_counter','case_heading','case_brief','case_object','home_actions','home_principle','home_hero_depth','project_inspiration','project_cards','project_safety','project_card_1','project_card_2','project_card_3','project_card_4'},
        'LAYOUT': {'home_order','case_order','case_bottom_order','chapter_columns','home_align'},
        'HOME': {'eyebrow','title_line_1','title_line_2','title_accent','lead','start_button','index_link','principle_a','principle_b','hero_label','hero_step','hero_equation_label','hero_formula','hero_ai_label','hero_ai_text','hero_ai_answer','hero_question','hero_tip','hero_coordinate','hero_case','hero_button_aria','credits_author_label','credits_class_label','credits_teacher_label','chapters_eyebrow','chapters_heading','chapters_guide','simulation'},
    }
    warnings=[]
    unknown=[name for name in sections if name not in known_sections]
    for name in unknown:warnings.append(f'Phần [{name}] không được nhận diện.')
    for sec,keys in known_keys.items():
        for key in sections.get(sec,{}):
            if key not in keys:warnings.append(f'[{sec}] có khóa chưa được hỗ trợ: {key}')
    valid_sections={
        'hero','credits','assignment','chapters','report'
    }
    for key in sections.get('LAYOUT',{}).get('home_order','hero,credits,assignment,chapters,report').split(','):
        key=key.strip()
        if key and key not in valid_sections:warnings.append(f'[LAYOUT] home_order có khối không tồn tại: {key}')
    valid_case={'heading','brief','art','object','answer'}
    for key in sections.get('LAYOUT',{}).get('case_order','heading,brief,art,object,answer').split(','):
        key=key.strip()
        if key and key not in valid_case:warnings.append(f'[LAYOUT] case_order có khối không tồn tại: {key}')
    for key in sections.get('LAYOUT',{}).get('case_bottom_order','decision,next').split(','):
        key=key.strip()
        if key and key not in {'decision','next'}:warnings.append(f'[LAYOUT] case_bottom_order có khối không tồn tại: {key}')
    for name,values in sections.items():
        if name=='SECTIONS':
            for key,val in values.items():
                if str(val).strip().upper() not in {'ON','OFF','YES','NO','TRUE','FALSE','1','0',''}:
                    warnings.append(f'[SECTIONS] {key} nên là ON hoặc OFF (đang là: {val})')
    return warnings

def main():
    sections = read_config(CONFIG)
    warnings = validate(sections)
    site = build(sections)
    js = 'window.SITE_CONFIG = ' + json.dumps(site, ensure_ascii=False, indent=2) + ';\n'
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    backup = OUTPUT.with_suffix('.backup.js')
    if OUTPUT.exists():
        backup.write_text(OUTPUT.read_text(encoding='utf-8'), encoding='utf-8')
    OUTPUT.write_text(js, encoding='utf-8')
    print(f'Đã áp dụng WEB_CONFIG.txt → {OUTPUT.relative_to(ROOT)}')
    if warnings:
        print('\nCảnh báo cấu hình:')
        for warning in warnings:
            print(' - ' + warning)
    print('Bạn có thể mở index.html để xem thay đổi.')

if __name__ == '__main__':
    main()
