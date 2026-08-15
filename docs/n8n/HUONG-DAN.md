# Dựng luồng viết bài SEO tự động — hướng dẫn từ đầu

> Dành cho người **chưa từng dùng WordPress**. Làm theo đúng thứ tự, mỗi bước
> đều có cách kiểm tra xem đã đúng chưa trước khi sang bước sau.
>
> Toàn bộ chạy trên máy bạn, **không tốn đồng nào**. Khi quy trình chạy ngon rồi
> mới thuê hosting và chuyển lên.

**Luồng cuối cùng sẽ là:**

```
Google Sheet (danh sách từ khoá)
   → n8n lấy 1 chủ đề chưa viết
   → Gemini viết bài
   → đẩy vào WordPress ở dạng BÀI NHÁP
   → Telegram báo "có bài chờ duyệt"
   → bạn đọc, sửa, bấm Đăng
```

Bài **không bao giờ tự lên sóng**. Luôn dừng ở bước bạn duyệt.

---

## Phần 1 — Cài WordPress trên máy (30 phút)

### 1.1. Tải LocalWP

Vào <https://localwp.com>, tải bản Windows, cài như phần mềm bình thường.

Đây là công cụ dựng sẵn WordPress trên máy — bạn không phải cài PHP, MySQL hay
cấu hình gì cả.

### 1.2. Tạo site

1. Mở LocalWP → bấm **`+`** ở góc dưới bên trái
2. Đặt tên: `blog-video-to-prompt`
3. Chọn **Preferred** khi hỏi cấu hình
4. Đặt tài khoản quản trị:
   - Username: `admin`
   - Password: **đặt một mật khẩu và ghi lại**
   - Email: email của bạn
5. Bấm **Add Site**, chờ vài phút

### 1.3. Bật HTTPS

Trong màn hình site vừa tạo, tab **Overview** → mục **SSL** → bấm **Trust**.

> **Vì sao bắt buộc:** WordPress chỉ cho tạo "mật khẩu ứng dụng" (thứ n8n cần để
> đăng bài) khi site chạy HTTPS. Bỏ qua bước này thì đến bước 2.2 sẽ không thấy
> mục đó đâu.

### 1.4. Mở trang quản trị

Bấm **WP Admin** trong LocalWP. Trình duyệt mở ra `https://blog-video-to-prompt.local/wp-admin`.

Đăng nhập bằng tài khoản vừa tạo.

**Kiểm tra:** thấy màn hình Dashboard với menu bên trái (Posts, Media, Pages...)
là xong phần 1.

### 1.5. Làm quen 3 khái niệm

| Tiếng Anh | Là gì |
|---|---|
| **Posts** (Bài viết) | Bài blog. Thứ n8n sẽ tạo |
| **Pages** (Trang) | Trang tĩnh: Giới thiệu, Liên hệ. Không dùng ở đây |
| **Draft** (Bản nháp) | Bài đã lưu nhưng **chưa ai xem được**. Đây là cổng duyệt của chúng ta |

---

## Phần 2 — Cho n8n quyền đăng bài (15 phút)

### 2.1. Tạo tài khoản riêng cho n8n

**Đừng dùng tài khoản admin của bạn.** Nếu mật khẩu rò rỉ, kẻ xấu chiếm được
toàn bộ site.

1. Menu trái → **Users** → **Add New User**
2. Điền:
   - Username: `n8n-bot`
   - Email: một email khác email admin (ví dụ `n8n@local.test`)
   - Role: chọn **Author**
3. Bấm **Add New User**

> **Vì sao chọn Author:** đủ quyền tạo và sửa bài của chính nó, **không** đủ
> quyền đổi cấu hình, cài plugin hay xoá site. Key có lộ thì thiệt hại giới hạn
> trong mấy bài viết.

### 2.2. Tạo mật khẩu ứng dụng

1. **Users** → bấm vào `n8n-bot` → kéo xuống cuối trang
2. Tìm mục **Application Passwords**
3. Ô "New Application Password Name" gõ: `n8n`
4. Bấm **Add New Application Password**
5. **Chép ngay chuỗi hiện ra** — dạng `abcd EFGH ijkl MNOP qrst UVWX`

> Chuỗi này **chỉ hiện một lần**. Đóng trang là mất, phải tạo lại.
> Giữ nguyên cả dấu cách.

Không thấy mục Application Passwords? Quay lại bước 1.3 bật HTTPS.

### 2.3. Kiểm tra n8n gọi được vào WordPress

Mở PowerShell, thay `MAT-KHAU-UNG-DUNG` bằng chuỗi vừa chép:

```bash
curl -u "n8n-bot:MAT-KHAU-UNG-DUNG" https://blog-video-to-prompt.local/wp-json/wp/v2/users/me
```

**Đúng:** trả về JSON có `"name":"n8n-bot"`
**Sai:** `401 Unauthorized` → chép lại mật khẩu, giữ cả dấu cách

Bước này quan trọng: nó chứng minh đường đi thông **trước khi** dựng workflow.
Sai ở đây mà không biết thì sau này rất khó tìm.

### 2.4. Cài plugin SEO

1. **Plugins** → **Add New Plugin**
2. Tìm `Rank Math SEO` → **Install Now** → **Activate**
3. Chạy trình cài đặt, chọn phương án mặc định

> Chọn Rank Math thay vì Yoast vì nó hỗ trợ REST API tốt hơn. Ở giai đoạn này
> chưa cần cấu hình sâu — bạn sẽ chỉnh tiêu đề SEO tay lúc duyệt bài.

---

## Phần 3 — Bảng chủ đề trên Google Sheets (15 phút)

Tạo một Google Sheet mới, đặt tên `Blog Automation`. Tạo **3 sheet con** với
đúng tên dưới đây (chữ thường):

### Sheet `topics` — danh sách chủ đề cần viết

| topic_id | keyword | title_hint | language | status | notes |
|---|---|---|---|---|---|
| T001 | giữ nhân vật nhất quán video AI | Cách giữ nhân vật giống nhau qua nhiều cảnh | Tiếng Việt | pending | nhấn mạnh tính năng Bible |
| T002 | prompt video AI bị lỗi | 5 lỗi prompt khiến video AI ra sai | Tiếng Việt | pending | |

- `status`: để `pending` là chờ viết. Muốn tạm dừng chủ đề nào thì đổi thành `paused`
- `notes`: để trống cũng được

### Sheet `posts` — nhật ký bài đã tạo (n8n tự ghi)

Chỉ cần tạo **dòng tiêu đề**, để trống phần dưới:

```
topic_id | keyword | post_title | wp_post_id | wp_edit_url | status | error_message | created_at
```

### Sheet `errors` — nhật ký lỗi (n8n tự ghi)

```
log_id | topic_id | error_type | error_message | timestamp
```

### Lấy ID của Sheet

Nhìn thanh địa chỉ:

```
https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit
                                      └────────── phần này ──────────┘
```

Chép đoạn đó lại, lát nữa dùng.

---

## Phần 4 — Cấu hình n8n (20 phút)

### 4.1. Đặt biến môi trường

Trong file `.env` của n8n (hoặc phần Settings nếu dùng bản desktop):

```bash
# WordPress
WP_URL=https://blog-video-to-prompt.local

# Google Sheet
BLOG_SHEET_ID=<ID chép ở bước 3>

# Gemini — dùng chung key với app video-to-prompt
GEMINI_API_KEY=<key của bạn>

# Số bài tối đa mỗi ngày. Bắt đầu bằng 1 để dễ theo dõi.
BLOG_POSTS_PER_DAY=1

# Telegram báo có bài chờ duyệt
TELEGRAM_CHAT_ID=<chat id của bạn>
```

Khởi động lại n8n sau khi sửa.

### 4.2. Tạo 3 thông tin đăng nhập trong n8n

Vào **Credentials** → **Add credential**:

| Loại | Điền gì |
|---|---|
| **Google Sheets OAuth2** | Đăng nhập Google, cho quyền truy cập Sheets |
| **Basic Auth** | User: `n8n-bot` · Password: mật khẩu ứng dụng ở bước 2.2 |
| **Telegram** | Token của bot (tạo bot qua @BotFather) |

### 4.3. Nhập workflow

1. n8n → **Workflows** → **Import from File**
2. Chọn `docs/n8n/seo-blog-workflow.json`
3. Mở từng node có biểu tượng cảnh báo, chọn credential tương ứng:
   - 4 node Google Sheets → chọn Google Sheets OAuth2
   - Node `WP: Tao bai nhap` → chọn Basic Auth
   - Node `ALERT: Bao co bai cho duyet` → chọn Telegram

---

## Phần 5 — Chạy thử (10 phút)

### 5.1. Chạy tay một lần

1. Đảm bảo sheet `topics` có ít nhất 1 dòng `status = pending`
2. Trong n8n bấm **Execute Workflow**
3. Xem từng node chuyển xanh

### 5.2. Kiểm tra kết quả

| Nơi kiểm tra | Phải thấy gì |
|---|---|
| **WordPress** → Posts | Một bài mới, nhãn **Draft** |
| **Sheet `posts`** | Một dòng mới, `status = draft`, có `wp_edit_url` |
| **Telegram** | Tin nhắn "📝 Bài mới chờ duyệt" kèm link |

### 5.3. Duyệt bài

Bấm link trong Telegram → mở thẳng trang sửa bài trong WordPress.

**Đọc kỹ trước khi đăng.** Việc cần làm:
- Bài có đúng chủ đề không, có bịa số liệu không
- Sửa tiêu đề SEO và mô tả trong hộp Rank Math ở cuối trang
- Thêm ảnh đại diện nếu muốn
- Bấm **Publish**

> **Đừng bỏ bước này.** Google có chính sách xử lý nội dung AI hàng loạt chất
> lượng thấp, và án phạt áp lên **cả tên miền** — dính là kéo tụt luôn phần app.

---

## Khi có sự cố

| Hiện tượng | Nguyên nhân thường gặp |
|---|---|
| Node WordPress báo `401` | Sai mật khẩu ứng dụng, hoặc chép thiếu dấu cách |
| Node WordPress không kết nối được | LocalWP chưa bật site. Mở LocalWP, bấm **Start site** |
| Không thấy Application Passwords | Chưa bật HTTPS — quay lại bước 1.3 |
| AI trả về sai định dạng | Hết hạn mức Gemini. Xem sheet `errors` |
| Không có bài nào được tạo | Đã đủ hạn mức ngày, hoặc chủ đề đã viết rồi. Xem cột `status` trong sheet `posts` |
| Node Google Sheets báo lỗi quyền | Credential chưa được cấp quyền, tạo lại |

---

## Sau khi chạy ngon

Ba việc tiếp theo, theo thứ tự:

1. **Bật lịch chạy tự động** — workflow đã đặt sẵn 1 lần/ngày, chỉ cần bật
   Active. Trước đó hãy chạy tay vài lần cho chắc.
2. **Tăng dần `BLOG_POSTS_PER_DAY`** — bắt đầu 1, chỉ tăng khi bạn duyệt kịp.
3. **Chuyển lên hosting thật** — dùng plugin *All-in-One WP Migration* để xuất
   toàn bộ site từ máy lên hosting. Xong chỉ cần sửa `WP_URL` trong n8n.

---

## Phụ lục — workflow có gì

22 node, tái dùng khoảng 70% cấu trúc từ workflow `Comment2DM` của bạn.

| Nhóm | Node | Việc |
|---|---|---|
| Cấu hình | 4 | Đọc bảng chủ đề, lọc, kiểm tra hợp lệ |
| Chống trùng | 3 | Bỏ chủ đề đã viết, chặn khi đủ hạn mức ngày |
| Viết bài | 3 | Gọi Gemini, tách tiêu đề/nội dung, kiểm tra kết quả |
| Đăng bài | 4 | Giãn nhịp, tạo bài nháp, kiểm tra, ghi log |
| Thông báo | 1 | Telegram báo có bài chờ duyệt |
| Xử lý lỗi | 5 | Ghi log lỗi cấu hình và lỗi AI riêng |
| Điều phối | 2 | Chia từng chủ đề, quay vòng |

**Ba điểm an toàn đã cài sẵn:**

- Bài luôn ở dạng **nháp**, không có đường nào tự đăng
- Node gọi AI và node đăng bài đều **thử lại 3 lần** rồi mới bỏ qua, một chủ đề
  hỏng không làm gãy cả lượt chạy
- Chống trùng theo `topic_id`, chạy lại nhiều lần cũng **không tạo bài trùng**

**Chưa có, thêm sau nếu cần:** ảnh đại diện tự sinh, gán chuyên mục và thẻ,
đặt tiêu đề SEO qua API.
