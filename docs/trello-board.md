# Trello — Video to Prompt

## 5 cột

`1. Cần sửa` → `2. Làm tiếp` → `3. Blog & SEO` → `4. Domain & tự động` → `✅ Xong`

Làm từ trái sang phải. Xong hết checklist trong thẻ thì kéo sang cột `✅ Xong`.

---

# Cột 1 — Cần sửa

### Nâng Gemini lên gói trả phí
Đang ở gói free: **5 lượt/phút cho cả website**. Có traffic là gãy. Đây là việc duy nhất còn lại ở cột này, và cần tài khoản Google của bạn nên tôi không làm thay được.
- [ ] Bật billing Google AI Studio
- [ ] Đặt giới hạn ngân sách
- [ ] Chốt hạn mức miễn phí mỗi người/ngày
- [ ] Thêm cache cho request trùng

### Cân nhắc làm database cho project
Đã có xuất/nhập JSON và cảnh báo, nhưng dữ liệu vẫn chỉ nằm trên một máy.
- [ ] Quyết định có làm tài khoản + database không
- [ ] Nếu có → chọn Supabase hoặc Neon

---

# Cột 2 — Làm tiếp

> Đã soát code: `/projects` hiện có sẵn tạo/xoá project, chọn model, chọn kiểu đầu vào,
> quản lý Bible 3 loại (nhân vật / đồ vật / địa điểm), chia scene, thêm xoá scene tay,
> tạo prompt từng scene, tạo hàng loạt, copy, xuất Markdown và JSON.
> Các thẻ dưới đây là phần **còn thiếu**.

### Brief đầy đủ khi tạo project
Hiện chỉ hỏi ý tưởng + model + kiểu đầu vào.
- [ ] Hỏi thêm: đối tượng xem, nền tảng đăng, thời lượng, tone, CTA
- [ ] Gợi ý 3–5 hướng nội dung để chọn
- [ ] Chia kịch bản theo khung: Hook → Vấn đề → Giải pháp → CTA

### Storyboard sửa được
Hiện thêm/xoá scene được, nhưng chưa sắp xếp hay tinh chỉnh được.
- [ ] Kéo thả đổi thứ tự scene
- [ ] Tách / gộp / nhân đôi scene
- [ ] Khoá scene đã duyệt
- [ ] Trạng thái scene: nháp / sẵn sàng / đã duyệt

### Xuất thêm định dạng
Markdown và JSON đã có trong `src/lib/project/export.ts`.
- [ ] Xuất CSV
- [ ] Xuất PDF storyboard
- [ ] Link chia sẻ chỉ xem

### Nâng cấp phân tích video
- [ ] Chia theo timecode
- [ ] Mổ xẻ từng shot
- [ ] Xuất phụ đề SRT
- [ ] Prompt tái tạo theo từng model

### Nâng cấp chấm điểm & nhất quán
Bible đã có đủ 3 loại, còn thiếu phần kiểm tra.
- [ ] Kiểm tra thời lượng có khả thi không
- [ ] Đối chiếu model có hỗ trợ không
- [ ] Cảnh báo khi scene làm sai thuộc tính đã khoá
- [ ] Thêm bộ nhận diện thương hiệu (logo, màu, font)

---

# Cột 3 — Blog & SEO

### Dựng blog WordPress
Hiện `/blog`, `/guide` đều 404.
- [ ] Chọn hosting WordPress
- [ ] Đặt ở `tênmiền.com/blog` (đừng dùng subdomain — SEO không chảy sang app)
- [ ] Cài plugin SEO
- [ ] Sitemap + Google Search Console
- [ ] Link qua lại với app

### Viết hướng dẫn trong app
- [ ] Tạo trang `/guide`
- [ ] Bài "5 phút đầu tiên"
- [ ] Hướng dẫn riêng Veo / Kling / Runway / Seedance
- [ ] Từ điển thuật ngữ quay phim
- [ ] Dịch 3 ngôn ngữ

### n8n viết bài SEO
- [ ] Dựng n8n
- [ ] Nguồn từ khoá → AI viết bài → đăng WordPress
- [ ] **Có bước người duyệt trước khi đăng** (Google phạt content AI rác, phạt cả domain)
- [ ] Chống trùng nội dung
- [ ] Kế hoạch 30 bài đầu

---

# Cột 4 — Domain & tự động

### Mua & cắm domain
- [ ] Chốt tên, mua (~200k)
- [ ] Trỏ DNS về Vercel + SSL
- [ ] Trỏ `/blog` về WordPress
- [ ] Redirect link vercel cũ sang domain mới

### n8n vận hành
- [ ] Theo dõi model AI video mới → nhắc cập nhật
- [ ] Gom feedback về một chỗ
- [ ] Cảnh báo khi API lỗi / chạm quota
- [ ] Cài analytics + uptime monitor

### Chốt bản v1
- [ ] Cột 1 và 2 sạch
- [ ] Blog live, ≥10 bài đã index
- [ ] n8n chạy ổn định 2 tuần
- [ ] Domain live

---

# Cột 5 — ✅ Xong

Đã gọi thẳng API production kiểm chứng, không phải hardcode.

### Tạo prompt từ video / ảnh / chữ
- [x] Nhập chữ → chạy
- [x] Link YouTube → mô tả đúng nội dung thật
- [x] Upload ảnh → mô tả đúng ảnh
- [x] Có giới hạn tần suất theo IP
- [ ] File lớn vẫn chết → xem thẻ "Upload quá 4.5 MB"

### Chia ý tưởng thành scene
- [x] 2 ý tưởng khác nhau → 2 kết quả khác hẳn
- [x] Trả đủ: cỡ cảnh, chuyển động máy, tâm trạng
- [x] Chọn Bible theo từng scene
- [x] Tạo prompt hàng loạt cho mọi scene

### Chấm điểm prompt
- [x] Prompt tốt 78 điểm, prompt mâu thuẫn 25 điểm
- [x] Bắt đúng lỗi camera mâu thuẫn
- [x] Giải thích cụ thể từng tiêu chí

### Chuyển prompt sang từng model
- [x] Veo có phần âm thanh + thoại
- [x] Kling tự bỏ âm thanh (vì không hỗ trợ)
- [x] Có trả cảnh báo

### 3 ngôn ngữ en / vi / zh
- [x] Cả 3 file dictionary đủ 372 key, không lệch key nào
- [x] Không còn chuỗi bỏ quên tiếng Anh (trừ tên riêng Kling/Runway/Seedance/Veo)
- [x] Đổi ngôn ngữ trên live chạy đúng, `<html lang>` đổi theo
- [x] Mọi trang đều dùng dictionary, không hardcode
- [ ] Thông báo lỗi và prompt đầu ra chưa theo ngôn ngữ → xem cột 1

### Privacy & Terms
- [x] Hết 404
- [x] Privacy đủ 8 mục, Terms đủ 9 mục, dịch cả 3 ngôn ngữ
- [x] Nêu đích danh Google Gemini API (gemini-2.5-flash)
- [x] Khẳng định không dùng upload để train model
- [x] Nêu rõ lưu trữ: xử lý trong bộ nhớ, không lưu server sau khi xong
- [x] Giải thích vì sao không cần nút xoá (không lưu gì server-side)

### Giao diện
- [x] Mọi trang đã có trạng thái chờ, báo lỗi, khoá nút khi đang chạy
- [x] Mobile 375px: không trang nào bị tràn ngang
- [x] Bỏ số liệu marketing bịa
- [x] Thông tin model gom về một chỗ
- [x] Nút Thử lại qua component chung `ErrorNotice`, chỉ hiện khi thử lại có ích

### Giới hạn upload
- [x] Hạ trần xuống 4 MB ở `src/lib/uploadLimits.ts`, một nguồn duy nhất
- [x] Chặn ngay ở trình duyệt trước khi gửi
- [x] Bắt cả trường hợp 413 từ gateway, đổi thành thông báo dịch được
- [x] Sửa chữ "20 MB" trên trang chủ và FAQ cả 3 ngôn ngữ
- [ ] Về lâu dài: upload thẳng lên Google Files API để bỏ được trần 4 MB

### Thông báo lỗi
- [x] API trả mã lỗi, không còn trả message thô của Google
- [x] Chi tiết chỉ ghi vào log server (`classifyUpstream`)
- [x] Client tra dictionary qua `lib/apiError.ts`, hiện đúng ngôn ngữ
- [x] Thêm 10 mã lỗi vào cả 3 file `en/vi/zh`
- [x] Test 8 lượt liên tiếp: không response nào chứa `generativelanguage`

### Ngôn ngữ đầu ra
- [x] Nhận xét của Validator theo ngôn ngữ user — test `lang=vi` ra tiếng Việt
- [x] Prompt giữ tiếng Anh (model video bám tiếng Anh chuẩn hơn)
- [x] Sửa FAQ cả 3 ngôn ngữ, nói rõ điều trên thay vì hứa suông

### Chốt chặn đầu vào
- [x] Prompt rỗng, ý tưởng rỗng, feedback rỗng → báo lỗi 400 đúng
- [x] Link YouTube sai định dạng → báo lỗi 400 đúng
- [x] Model id sai ở `convert-prompt` và `validate-prompt` → 400 kèm danh sách id hợp lệ
- [x] `count` ngoài khoảng đã được kẹp về 3–8, không phải lỗ hổng

### Xuất/nhập project
- [x] Nhập file JSON, tự cấp id mới nên không đè project đang có
- [x] Từ chối file không phải bản xuất, kèm thông báo dịch được
- [x] Cảnh báo "chỉ lưu trên trình duyệt này" ngay đầu trang Dự án

---

# Ghi chú

**Image to Video** — để nguyên, chưa đụng tới. Lưu ý là nó đang trả video stock ngẫu nhiên chứ không generate thật (`route.ts` ghi "DUMMY MODE"). Khi nào muốn xử lý thì tính sau.

**Chưa làm:** editor kiểu CapCut, render cloud, kho stock, text-to-speech, sinh nhạc, face swap, lip-sync, đăng mạng xã hội, train model riêng.
