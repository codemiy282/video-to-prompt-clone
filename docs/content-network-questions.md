# Node #1 — những gì cần chốt để làm tiếp

> Lộ trình: dựng 1 node hoàn chỉnh (dịch vụ giá trị + content SEO tự động +
> automation) → đóng gói v1 → thạo rồi thì lặp lại với các dịch vụ khác.
>
> Node #1: `video-to-prompt` — app đã chạy trên Vercel, các công cụ đã kiểm chứng
> hoạt động thật. Còn thiếu lớp content và lớp automation.
>
> Tài liệu này gom những chỗ em đang chờ anh chốt, và những việc em làm được ngay.

---

## 1. Blog đặt ở đâu — đang chặn phần n8n

Đây là quyết định duy nhất đang chặn việc tiếp theo. n8n viết bài xong phải đăng
vào đâu đó, mà "đâu đó" chưa chốt thì chưa lắp được khâu cuối.

|  | WordPress | MDX trong app | Headless CMS |
|---|---|---|---|
| Phải tự nuôi database | **Có (MySQL)** | Không | Không |
| Tiền hàng tháng | Có | 0 | 0 (gói free) |
| Cùng domain, không cần proxy | Không | Có | Có |
| Người non-tech sửa bài | **Có** | Không | **Có** |
| Nhúng tool sống vào bài viết | Không | **Có** | **Có** |
| Bước duyệt bài | phải tự dựng | **chính là pull request** | có sẵn |
| Lặp lại cho node sau | dựng hosting + DB mỗi lần | `git clone` | 1 project/node |

Hiện **cả hệ thống chưa có database nào** — app lưu trong trình duyệt, n8n dùng
Google Sheets. Chọn WordPress thì blog thành thứ duy nhất có database, kéo theo
sao lưu, cập nhật, di chuyển hosting.

**Câu quyết định:** ai sẽ sửa bài blog bằng tay?
- Chỉ n8n + em → **MDX**
- Có người non-tech viết/sửa → **headless CMS**

Em nghiêng MDX, vì lặp lại nhanh nhất và bài viết nhúng được công cụ thật của app
(bảng so sánh model đọc thẳng từ registry nên không bao giờ lỗi thời).

---

## 2. Nội dung nhắm vào từ khoá nào

2 hướng, cho kết quả khác hẳn nhau:

- **Từ khoá hàng hoá** — "veo 3 prompt", "kling prompt generator".
  Dễ lên, nhưng người ta lấy prompt rồi đi, và ai cũng làm được.
- **Từ khoá vấn đề** — "giữ nhân vật giống nhau qua nhiều cảnh", "prompt AI video
  bị lỗi tay/chữ", "tính số cảnh cho video 30 giây".
  Khó hơn, nhưng đúng thứ site này giải được mà nơi khác không có.

Node #1 có 3 thứ khó sao chép: **Bible giữ nhân vật nhất quán**, **bộ chấm điểm
prompt trước khi đốt credit**, **luồng project từ ý tưởng tới bộ prompt**.
Bốn trang tạo prompt theo model thì là hàng phổ thông.

**Hỏi anh:** nội dung nên nhắm hướng nào?

---

## 3. Khâu duyệt bài

Google có chính sách xử lý nội dung AI sản xuất hàng loạt chất lượng thấp, và án
phạt áp lên cả tên miền — dính là kéo tụt luôn phần app.

**Hỏi anh:** anh duyệt bài theo cách nào? Đọc từng bài, hay có ngưỡng/tiêu chí
tự động rồi chỉ đọc bài dưới ngưỡng?

Nếu dùng MDX thì bước duyệt có sẵn: n8n mở pull request, anh/em đọc rồi merge.

---

## 4. Kiếm tiền — ảnh hưởng tới việc có làm database hay không

Chưa cần chốt ngay, nhưng nếu là **thuê bao** thì phải làm tài khoản + thanh toán
+ database **ngay từ node #1**, vì schema phụ thuộc cách tính tiền. Còn quảng cáo
hay affiliate thì app giữ nguyên như hiện tại.

Trang chủ đang ghi *"Free — no signup, no credit card"*.

**Hỏi anh:** định vị này giữ lâu dài, hay chỉ giai đoạn đầu?

---

## 5. Cấu trúc code — để lặp lại cho nhanh

Hiện `video-to-prompt` là app độc lập. Nếu về sau lặp lại thì nên **tách phần
dùng chung thành template ngay bây giờ**, càng viết thêm càng khó tách.

Phần dùng chung được: bộ giao diện, khung 3 ngôn ngữ, khung SEO (sitemap, robots,
canonical — đã dựng xong), khung xử lý lỗi, khung blog, workflow n8n.

Phần phải làm mới cho mỗi ngách: chính cái công cụ bên trong.

**Ý em về n8n:** workflow `Comment2DM` của anh đã dùng đúng mẫu cần thiết —
**cấu hình nằm trong Google Sheets, workflow viết chung**. Áp mẫu đó thì mỗi node
là một dòng trong Sheets, dùng chung một workflow. Em định dựng theo hướng này,
anh xem có ổn không.

---

## 6. Node #1 coi như xong khi nào

Em cần một mốc rõ, vì "xong" đang được hiểu là "đủ tính năng", mà đủ tính năng
không chứng minh được mô hình chạy.

**Hỏi anh:** node #1 đạt con số gì thì coi như đóng gói được v1 và chuyển sang
node tiếp theo? Nếu anh đã có node nào chạy đủ vòng rồi thì số liệu thật của nó
là mốc tốt nhất để em nhắm theo.

---

## 7. Việc em làm ngay, không chờ câu trả lời nào

- [ ] Thêm `og:image` — hiện chia sẻ link ra Facebook/Zalo hiện thẻ trắng,
      mọi bài blog sau này share ra cũng vậy
- [ ] Dựng khung workflow n8n viết bài, tái dùng ~70% từ `Comment2DM`
      (lịch chạy, đọc config từ Sheets, chống trùng, hạn mức ngày, xử lý lỗi,
      cảnh báo Telegram, báo cáo) — để trống đúng node đăng bài
- [ ] Sửa thông báo hết lượt cho đúng sự thật: hiện báo "thử lại sau 30 giây"
      trong khi thực ra là hết hạn mức cả ngày, người dùng tưởng site hỏng
- [ ] Giới hạn lượt theo từng người, để một người không đốt hết phần cả ngày

## Việc chờ anh chốt

- [ ] Blog đặt ở đâu (mục 1) — chặn khâu đăng bài của n8n
- [ ] Nội dung nhắm từ khoá nào (mục 2) — đầu vào cho n8n
- [ ] Cách duyệt bài (mục 3)
- [ ] Mô hình kiếm tiền (mục 4) — quyết định có làm database không

---

## Phụ lục — trạng thái node #1

**Đã kiểm chứng chạy thật** (gọi thẳng API production):

| Chức năng | Bằng chứng |
|---|---|
| Video/ảnh/chữ → prompt | Link YouTube ra mô tả đúng nội dung thật |
| Video lớn | 31.5 MB → cắt 8 khung trên trình duyệt → 893 KB → chạy |
| Chia ý tưởng thành phân cảnh | 2 ý tưởng khác nhau ra 2 kết quả khác hẳn |
| Chấm điểm prompt | Prompt tốt 78đ, prompt mâu thuẫn 25đ, chỉ đúng chỗ sai |
| Chuyển prompt theo model | Veo có audio, Kling tự bỏ audio |
| 3 ngôn ngữ | en/vi/zh khớp 100% key |
| SEO kỹ thuật | sitemap 15 URL, robots.txt, canonical từng trang |
| Hướng dẫn | trang `/guide` đủ 3 ngôn ngữ |

**Giới hạn hiện tại:** Gemini đang ở gói free — **5 lượt/phút và 20 lượt/ngày cho
toàn site**. Đủ cho nhóm thử nghiệm, chưa đủ cho công chúng. Anh nói để MVP chạy
trước rồi nâng sau, em ghi nhận.
