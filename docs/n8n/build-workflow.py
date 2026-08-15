# -*- coding: utf-8 -*-
"""
Sinh file workflow n8n cho luồng viết bài SEO đăng WordPress.

Viết bằng script thay vì gõ tay JSON để: id node không trùng, toạ độ đều nhau,
và phần connections khớp chắc chắn với danh sách node.

Phiên bản node lấy đúng theo workflow Comment2DM đang chạy, để import không lỗi.
"""
import json, io, os

WF_NAME = "SEO Blog - Viet bai va dang WordPress"

# Đường dẫn tương đối trong sheet cấu hình. Đổi ở đây thì đổi cả workflow.
SHEET_TOPICS = "topics"
SHEET_POSTS = "posts"
SHEET_ERRORS = "errors"

nodes = []
conns = {}
_y = 0


def node(name, ntype, version, params, x, y, extra=None):
    n = {
        "parameters": params,
        "id": f"n{len(nodes):03d}",
        "name": name,
        "type": ntype,
        "typeVersion": version,
        "position": [x, y],
    }
    if extra:
        n.update(extra)
    nodes.append(n)
    return name


def link(src, dst, out=0):
    """Nối src -> dst. `out` = 0 với node thường, 0/1 với IF (true/false)."""
    conns.setdefault(src, {"main": []})
    while len(conns[src]["main"]) <= out:
        conns[src]["main"].append([])
    conns[src]["main"][out].append({"node": dst, "type": "main", "index": 0})


def sheet(op, sheet_name, extra=None):
    p = {
        "documentId": {"__rl": True, "value": "={{ $env.BLOG_SHEET_ID }}", "mode": "id"},
        "sheetName": {"__rl": True, "value": sheet_name, "mode": "name"},
    }
    if op != "read":
        p["operation"] = op
    if extra:
        p.update(extra)
    return p


# ─────────────────────────────────────────────────────── 1. Kích hoạt + cấu hình
X0 = 0
node("⏰ Lich chay", "n8n-nodes-base.scheduleTrigger", 1.2,
     {"rule": {"interval": [{"field": "days", "daysInterval": 1}]}}, X0, 300)

node("CFG: Doc bang chu de", "n8n-nodes-base.googleSheets", 4.5,
     sheet("read", SHEET_TOPICS), X0 + 200, 300)

# Lọc chủ đề chưa viết. So sánh chữ thường để "Pending"/"pending" đều khớp —
# đúng lỗi đã gặp ở workflow Comment2DM.
node("CFG: Loc chu de cho viet", "n8n-nodes-base.filter", 2,
     {"conditions": {"options": {"caseSensitive": False, "version": 2},
                     "conditions": [{
                         "leftValue": "={{ ($json.status || '').toLowerCase().trim() }}",
                         "rightValue": "pending",
                         "operator": {"type": "string", "operation": "equals"}}],
                     "combinator": "and"}},
     X0 + 400, 300)

node("CFG: Kiem tra chu de", "n8n-nodes-base.code", 2,
     {"jsCode": """// === Kiểm tra một dòng chủ đề có đủ dữ liệu để viết bài không ===
// Thiếu trường nào thì đánh dấu lỗi thay vì để AI đoán bừa.
const out = [];

for (const item of $input.all()) {
  const d = item.json;
  const missing = [];

  if (!d.topic_id) missing.push('topic_id');
  if (!d.keyword) missing.push('keyword');
  if (!d.title_hint) missing.push('title_hint');

  out.push({
    json: {
      ...d,
      _valid: missing.length === 0,
      _error_message: missing.length ? `Thieu truong: ${missing.join(', ')}` : '',
    },
  });
}

return out;"""}, X0 + 600, 300)

node("IF: Chu de hop le?", "n8n-nodes-base.if", 2,
     {"conditions": {"options": {"version": 2},
                     "conditions": [{"leftValue": "={{ $json._valid }}", "rightValue": True,
                                     "operator": {"type": "boolean", "operation": "true", "singleValue": True}}],
                     "combinator": "and"}},
     X0 + 800, 300)

# ─────────────────────────────────────────────────────── nhánh lỗi cấu hình
node("ERR: Dinh dang loi cau hinh", "n8n-nodes-base.code", 2,
     {"jsCode": """const d = $input.item.json;
return [{ json: {
  log_id: `ERR-CFG-${Date.now()}`,
  topic_id: d.topic_id || 'UNKNOWN',
  error_type: 'config',
  error_message: d._error_message || 'Dong chu de khong hop le',
  timestamp: new Date().toISOString(),
} }];"""}, X0 + 1000, 520)

node("ERR: Ghi log loi", "n8n-nodes-base.googleSheets", 4.5,
     sheet("append", SHEET_ERRORS, {"columns": {"mappingMode": "defineBelow", "value": {
         "log_id": "={{ $json.log_id }}",
         "topic_id": "={{ $json.topic_id }}",
         "error_type": "={{ $json.error_type }}",
         "error_message": "={{ $json.error_message }}",
         "timestamp": "={{ $json.timestamp }}"}}}),
     X0 + 1200, 520)

# ─────────────────────────────────────────────────────── 2. Chống trùng + hạn mức
node("DATA: Chia tung chu de", "n8n-nodes-base.splitInBatches", 3,
     {"options": {"reset": False}}, X0 + 1000, 300)

node("LOG: Doc bai da viet", "n8n-nodes-base.googleSheets", 4.5,
     sheet("read", SHEET_POSTS), X0 + 1200, 300)

node("DATA: Chong trung va han muc", "n8n-nodes-base.code", 2,
     {"jsCode": """// === Bỏ chủ đề đã viết, và chặn khi đã đủ số bài trong ngày ===
//
// Hai việc gộp một chỗ vì cùng đọc một nguồn: bảng bài đã đăng.
//   - Chống trùng: cùng topic_id đã có bài thì bỏ qua.
//   - Hạn mức ngày: đếm bài tạo hôm nay, chạm trần thì dừng.
//
// Trần lấy từ biến môi trường để đổi nhịp đăng mà không phải sửa workflow.
const topic = $('DATA: Chia tung chu de').first().json;
const posts = $('LOG: Doc bai da viet').all();

const dailyCap = parseInt($env.BLOG_POSTS_PER_DAY || '2', 10);
const today = new Date().toISOString().split('T')[0];

const writtenTopics = new Set();
let createdToday = 0;

for (const p of posts) {
  const row = p.json;
  if (row.topic_id) writtenTopics.add(String(row.topic_id));
  if ((row.created_at || '').startsWith(today)) createdToday++;
}

let shouldWrite = true;
let skipReason = '';

if (writtenTopics.has(String(topic.topic_id))) {
  shouldWrite = false;
  skipReason = 'da_co_bai';
} else if (createdToday >= dailyCap) {
  shouldWrite = false;
  skipReason = 'het_han_muc_ngay';
}

return [{ json: {
  ...topic,
  _should_write: shouldWrite,
  _skip_reason: skipReason,
  _created_today: createdToday,
  _daily_cap: dailyCap,
} }];"""}, X0 + 1400, 300)

node("IF: Co nen viet?", "n8n-nodes-base.if", 2,
     {"conditions": {"options": {"version": 2},
                     "conditions": [{"leftValue": "={{ $json._should_write }}", "rightValue": True,
                                     "operator": {"type": "boolean", "operation": "true", "singleValue": True}}],
                     "combinator": "and"}},
     X0 + 1600, 300)

# ─────────────────────────────────────────────────────── 3. AI viết bài
node("AI: Viet bai", "n8n-nodes-base.httpRequest", 4.2,
     {"method": "POST",
      "url": "=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      "sendHeaders": True,
      "headerParameters": {"parameters": [
          {"name": "x-goog-api-key", "value": "={{ $env.GEMINI_API_KEY }}"},
          {"name": "Content-Type", "value": "application/json"}]},
      "sendBody": True,
      "specifyBody": "json",
      "jsonBody": """={{ JSON.stringify({
  system_instruction: { parts: [{ text: `Ban la nguoi viet noi dung SEO cho mot cong cu AI lam video.

Viet bai chuan SEO bang ngon ngu duoc yeu cau. Yeu cau:
- Bam sat tu khoa chinh, dat tu khoa o tieu de va doan mo dau.
- Viet cho nguoi doc that, khong nhoi tu khoa.
- Dung the HTML don gian: <h2>, <h3>, <p>, <ul>, <li>, <strong>. KHONG dung <h1>.
- Do dai khoang 800-1200 tu.
- Khong bia so lieu, khong bia trich dan.

Tra ve DUNG dinh dang sau, khong them gi khac:

[TITLE]
<tieu de bai viet, duoi 60 ky tu>
[EXCERPT]
<tom tat 1-2 cau, duoi 155 ky tu>
[CONTENT]
<noi dung HTML>` }] },
  contents: [{ role: 'user', parts: [{ text:
    `Tu khoa chinh: ${$json.keyword}\\n` +
    `Goi y tieu de: ${$json.title_hint}\\n` +
    `Ngon ngu: ${$json.language || 'Tieng Viet'}\\n` +
    ($json.notes ? `Ghi chu them: ${$json.notes}\\n` : '') +
    `\\nViet bai theo dung dinh dang da yeu cau.` }] }]
}) }}""",
      "options": {"timeout": 120000}},
     X0 + 1800, 200,
     {"retryOnFail": True, "maxTries": 3, "waitBetweenTries": 5000,
      "onError": "continueRegularOutput"})

node("DATA: Tach tieu de va noi dung", "n8n-nodes-base.code", 2,
     {"jsCode": """// === Tách [TITLE] / [EXCERPT] / [CONTENT] từ kết quả AI ===
//
// Dùng khối có nhãn thay vì JSON: nội dung bài viết đầy dấu nháy, dấu hai chấm
// và xuống dòng — những thứ làm vỡ JSON. Nhãn thì không bị ảnh hưởng.
const topic = $('DATA: Chong trung va han muc').first().json;
const res = $input.first().json;

const raw = res?.candidates?.[0]?.content?.parts?.[0]?.text || '';

function field(label, next) {
  const re = new RegExp(`\\\\[${label}\\\\]([\\\\s\\\\S]*?)(?=\\\\[${next}\\\\]|$)`, 'i');
  const m = raw.match(re);
  return m ? m[1].trim() : '';
}

const title = field('TITLE', 'EXCERPT');
const excerpt = field('EXCERPT', 'CONTENT');
const content = field('CONTENT', 'KHONG_CO_NHAN_NAY');

// Không có tiêu đề hoặc nội dung thì coi như thất bại — đừng đẩy bài rỗng lên
// WordPress rồi mới phát hiện.
const ok = Boolean(title && content);

return [{ json: {
  ...topic,
  _ai_ok: ok,
  _ai_error: ok ? '' : 'AI tra ve khong dung dinh dang',
  post_title: title,
  post_excerpt: excerpt,
  post_content: content,
} }];"""}, X0 + 2000, 200)

node("IF: AI viet duoc khong?", "n8n-nodes-base.if", 2,
     {"conditions": {"options": {"version": 2},
                     "conditions": [{"leftValue": "={{ $json._ai_ok }}", "rightValue": True,
                                     "operator": {"type": "boolean", "operation": "true", "singleValue": True}}],
                     "combinator": "and"}},
     X0 + 2200, 200)

# ─────────────────────────────────────────────────────── 4. Đăng lên WordPress
node("WAIT: Gian nhip", "n8n-nodes-base.wait", 1.1,
     {"amount": "={{ Math.floor(Math.random() * 4) + 2 }}"}, X0 + 2400, 120)

# Đăng ở dạng nháp. Đây chính là cổng duyệt: bài nằm chờ trong wp-admin cho
# người đọc rồi mới bấm đăng.
node("WP: Tao bai nhap", "n8n-nodes-base.httpRequest", 4.2,
     {"method": "POST",
      "url": "={{ $env.WP_URL }}/wp-json/wp/v2/posts",
      "authentication": "genericCredentialType",
      "genericAuthType": "httpBasicAuth",
      "sendBody": True,
      "specifyBody": "json",
      "jsonBody": """={{ JSON.stringify({
  title: $json.post_title,
  content: $json.post_content,
  excerpt: $json.post_excerpt,
  status: 'draft'
}) }}""",
      "options": {"timeout": 60000}},
     X0 + 2600, 120,
     {"retryOnFail": True, "maxTries": 3, "waitBetweenTries": 5000,
      "onError": "continueRegularOutput"})

node("DATA: Kiem tra ket qua dang", "n8n-nodes-base.code", 2,
     {"jsCode": """// === Xem WordPress có nhận bài không ===
const topic = $('DATA: Tach tieu de va noi dung').first().json;
const res = $input.first().json;

// WordPress trả về object có id khi tạo thành công.
const postId = res?.id || null;
const ok = Boolean(postId);

return [{ json: {
  ...topic,
  _published_ok: ok,
  wp_post_id: postId || '',
  wp_edit_url: ok ? `${$env.WP_URL}/wp-admin/post.php?post=${postId}&action=edit` : '',
  status: ok ? 'draft' : 'failed',
  error_message: ok ? '' : (res?.message || 'Khong tao duoc bai'),
  created_at: new Date().toISOString(),
} }];"""}, X0 + 2800, 120)

node("LOG: Ghi bai da tao", "n8n-nodes-base.googleSheets", 4.5,
     sheet("append", SHEET_POSTS, {"columns": {"mappingMode": "defineBelow", "value": {
         "topic_id": "={{ $json.topic_id }}",
         "keyword": "={{ $json.keyword }}",
         "post_title": "={{ $json.post_title }}",
         "wp_post_id": "={{ $json.wp_post_id }}",
         "wp_edit_url": "={{ $json.wp_edit_url }}",
         "status": "={{ $json.status }}",
         "error_message": "={{ $json.error_message }}",
         "created_at": "={{ $json.created_at }}"}}}),
     X0 + 3000, 120)

node("ALERT: Bao co bai cho duyet", "n8n-nodes-base.telegram", 1.2,
     {"chatId": "={{ $env.TELEGRAM_CHAT_ID }}",
      "text": """=📝 Bài mới chờ duyệt

*{{ $json.post_title }}*

Từ khoá: {{ $json.keyword }}
Trạng thái: {{ $json.status }}

{{ $json.wp_edit_url }}""",
      "additionalFields": {"parse_mode": "Markdown"}},
     X0 + 3200, 120)

# ─────────────────────────────────────────────────────── nhánh bỏ qua / lỗi AI
node("LOG: Ghi chu de bo qua", "n8n-nodes-base.googleSheets", 4.5,
     sheet("append", SHEET_POSTS, {"columns": {"mappingMode": "defineBelow", "value": {
         "topic_id": "={{ $json.topic_id }}",
         "keyword": "={{ $json.keyword }}",
         "post_title": "",
         "wp_post_id": "",
         "wp_edit_url": "",
         "status": "={{ $json._skip_reason || 'skipped' }}",
         "error_message": "",
         "created_at": "={{ new Date().toISOString() }}"}}}),
     X0 + 1800, 460)

node("ERR: Dinh dang loi AI", "n8n-nodes-base.code", 2,
     {"jsCode": """const d = $input.item.json;
return [{ json: {
  log_id: `ERR-AI-${Date.now()}`,
  topic_id: d.topic_id || '',
  error_type: 'ai',
  error_message: d._ai_error || 'AI khong tra ve noi dung',
  timestamp: new Date().toISOString(),
} }];"""}, X0 + 2400, 320)

node("ERR: Ghi log loi AI", "n8n-nodes-base.googleSheets", 4.5,
     sheet("append", SHEET_ERRORS, {"columns": {"mappingMode": "defineBelow", "value": {
         "log_id": "={{ $json.log_id }}",
         "topic_id": "={{ $json.topic_id }}",
         "error_type": "={{ $json.error_type }}",
         "error_message": "={{ $json.error_message }}",
         "timestamp": "={{ $json.timestamp }}"}}}),
     X0 + 2600, 320)

# ─────────────────────────────────────────────────────── nối dây
link("⏰ Lich chay", "CFG: Doc bang chu de")
link("CFG: Doc bang chu de", "CFG: Loc chu de cho viet")
link("CFG: Loc chu de cho viet", "CFG: Kiem tra chu de")
link("CFG: Kiem tra chu de", "IF: Chu de hop le?")
link("IF: Chu de hop le?", "DATA: Chia tung chu de", 0)
link("IF: Chu de hop le?", "ERR: Dinh dang loi cau hinh", 1)
link("ERR: Dinh dang loi cau hinh", "ERR: Ghi log loi")

link("DATA: Chia tung chu de", "LOG: Doc bai da viet", 1)
link("LOG: Doc bai da viet", "DATA: Chong trung va han muc")
link("DATA: Chong trung va han muc", "IF: Co nen viet?")
link("IF: Co nen viet?", "AI: Viet bai", 0)
link("IF: Co nen viet?", "LOG: Ghi chu de bo qua", 1)
link("LOG: Ghi chu de bo qua", "DATA: Chia tung chu de")

link("AI: Viet bai", "DATA: Tach tieu de va noi dung")
link("DATA: Tach tieu de va noi dung", "IF: AI viet duoc khong?")
link("IF: AI viet duoc khong?", "WAIT: Gian nhip", 0)
link("IF: AI viet duoc khong?", "ERR: Dinh dang loi AI", 1)
link("ERR: Dinh dang loi AI", "ERR: Ghi log loi AI")
link("ERR: Ghi log loi AI", "DATA: Chia tung chu de")

link("WAIT: Gian nhip", "WP: Tao bai nhap")
link("WP: Tao bai nhap", "DATA: Kiem tra ket qua dang")
link("DATA: Kiem tra ket qua dang", "LOG: Ghi bai da tao")
link("LOG: Ghi bai da tao", "ALERT: Bao co bai cho duyet")
# Xong một chủ đề thì quay lại lấy chủ đề kế tiếp.
link("ALERT: Bao co bai cho duyet", "DATA: Chia tung chu de")

wf = {
    "name": WF_NAME,
    "nodes": nodes,
    "connections": conns,
    "settings": {"executionOrder": "v1"},
    "pinData": {},
}

out = os.path.join(os.path.dirname(__file__), "seo-blog-workflow.json")
io.open(out, "w", encoding="utf-8").write(json.dumps(wf, ensure_ascii=False, indent=2))
print(f"da sinh: {out}")
print(f"so node: {len(nodes)}")
