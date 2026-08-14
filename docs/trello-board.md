# Trello — Video to Prompt

## 5 cột

`1. Cần sửa` → `2. Làm tiếp` → `3. Blog & SEO` → `4. Domain & tự động` → `✅ Xong`

Làm từ trái sang phải. Xong hết checklist trong thẻ thì kéo sang cột `✅ Xong`.

---

# Cột 1 — Cần sửa

### Nâng Gemini lên gói trả phí
Gói free chặn ở **hai tầng**, cả hai đều tính cho toàn bộ website chứ không phải mỗi người:
- **5 lượt/phút** — `GenerateRequestsPerMinutePerProjectPerModel`
- **20 lượt/NGÀY** — `GenerateRequestsPerDayPerProjectPerModel`

Tầng theo ngày mới là tầng chết người: 20 lượt là hết sạch hạn mức cho cả 24 giờ, chỉ cần vài người dùng thử là site đứng im tới hôm sau. Tôi chạm trần này khi đang test.

Cần tài khoản Google của bạn nên tôi không làm thay được.
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
- [x] Hỏi thêm: đối tượng xem, nền tảng đăng, thời lượng, tone, CTA
- [x] Mọi ô đều không bắt buộc, chỉ ô có nội dung mới gửi đi
- [x] Thời lượng tự suy ra số phân cảnh (~1 cảnh/4 giây), hiện ngay dưới ô nhập
- [x] Server lọc brief, bỏ key lạ, cắt 200 ký tự mỗi ô
- [ ] So sánh đầu ra có/không brief — kẹt vì hết quota Gemini hôm nay
- [ ] Gợi ý 3–5 hướng nội dung để chọn
- [ ] Chia kịch bản theo khung: Hook → Vấn đề → Giải pháp → CTA

### Storyboard sửa được
- [x] Đổi thứ tự scene bằng nút lên/xuống, số thứ tự tự đánh lại 1..n
- [x] Nhân đôi scene, bản sao chèn ngay dưới và luôn ở trạng thái mở khoá
- [x] Khoá scene đã duyệt — mọi ô thành chỉ đọc, nút tạo prompt tắt
- [x] Batch "tạo tất cả" bỏ qua scene đã khoá, không đốt quota ghi đè
- [x] Kéo thả bằng chuột qua tay nắm riêng, nút lên/xuống vẫn giữ
- [x] Tách một scene thành hai ở ranh giới câu

### Xuất thêm định dạng
Markdown và JSON đã có trong `src/lib/project/export.ts`.
- [x] Xuất CSV — một dòng mỗi phân cảnh, mở thẳng bằng Sheets/Excel
- [x] Đúng chuẩn RFC 4180: bọc dấu phẩy, nhân đôi dấu nháy, xuống dòng nằm trong ô
- [x] Có BOM UTF-8 để Excel không vỡ tiếng Việt và tiếng Trung
- [x] Xuất PDF qua hộp thoại in, không thêm thư viện ngoài
- [x] Link chia sẻ chỉ xem — nén vào URL, không cần backend
- [x] Sửa lỗi `importProject` làm rơi mất brief khi nhập lại

### Nâng cấp phân tích video
- [ ] Chia theo timecode
- [ ] Mổ xẻ từng shot
- [ ] Xuất phụ đề SRT
- [ ] Prompt tái tạo theo từng model

### Nâng cấp chấm điểm & nhất quán
Bible đã có đủ 3 loại.
- [x] Đối chiếu model có hỗ trợ không — hiện ngay khi gõ, không tốn lượt gọi AI
- [x] Cảnh báo khi prompt đã cũ so với scene/Bible đã đổi
- [x] Batch bỏ qua scene có prompt còn đúng, đỡ đốt quota
- [ ] Kiểm tra thời lượng có khả thi không (cần AI)
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
- [x] File lớn đã chạy — video >4 MB tự cắt khung hình trên trình duyệt

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
- [x] Thông báo lỗi đã theo ngôn ngữ; prompt giữ tiếng Anh là quyết định có chủ ý, FAQ đã nói rõ

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
- [x] **Video lớn không còn bị chặn** — xem thẻ cắt keyframe
- [x] Đã thử upload thẳng lên Google Files API: key không lộ nhưng **Google chặn CORS**, không đi được

### Cắt keyframe trên trình duyệt
Bỏ được trần 4 MB cho video mà không cần thêm dịch vụ nào.
- [x] Rút 8 khung hình cách đều bằng `<video>` + `<canvas>`, thu nhỏ về 768px, JPEG 70%
- [x] Video ≤ 4 MB vẫn gửi nguyên tệp (chất lượng tốt hơn: có chuyển động và âm thanh)
- [x] Video > 4 MB tự chuyển sang khung hình, **tệp gốc không rời khỏi máy người dùng**
- [x] Vá lỗi WebM báo `duration: Infinity` — máy quay màn hình và nhiều máy Android dính lỗi này
- [x] Prompt hệ thống cấm bịa âm thanh và chuyển động giữa các khung
- [x] Hiện tiến trình "Đang đọc khung hình… 3/8" vì việc này chạy trước khi gửi request
- [x] Đo thật: video 31.5 MB → 8 khung, tổng 893 KB → Gemini trả 200 sau 23 giây

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
