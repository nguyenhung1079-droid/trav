# Website Bản tin Phòng vệ thương mại & Cảnh báo sớm (TRAV)

Website tin tức phát hành **hàng tuần**, kiến trúc **JAMstack**: giao diện tĩnh (chạy nhanh, bảo mật) + **Decap CMS** để soạn/đăng nội dung, dùng **GitHub làm "cơ sở dữ liệu"** (mỗi lần Publish = một commit). Không cần máy chủ riêng, không cần cơ sở dữ liệu, miễn phí lưu trữ.

## 1. Cấu trúc thư mục
```
bantin-web/
├─ index.html          Trang chủ (báo điện tử)
├─ article.html        Trang bài viết (?issue=...&id=...)
├─ issues.html         Lưu trữ các số
├─ about.html          Giới thiệu
├─ assets/
│  ├─ css/style.css    Thiết kế (nhận diện TRAV)
│  ├─ js/app.js        Bộ nạp & dựng nội dung + trình Markdown
│  └─ img/             Logo, QR…
├─ content/
│  ├─ site.json        Cấu hình site (tên, liên hệ, chuyên mục)
│  ├─ index.json       Chỉ mục các số (tạo tự động khi deploy)
│  ├─ issues/          MỖI SỐ = 1 file JSON (vd: 2026-20.json)
│  └─ images/          Ảnh nội dung, biểu đồ
├─ admin/              Trang quản trị Decap CMS (/admin)
├─ scripts/build-index.js   Tạo index.json
└─ .github/workflows/deploy.yml  Tự build + deploy GitHub Pages
```

## 2. Chạy thử trên máy
Vì trang nạp dữ liệu qua `fetch`, cần một máy chủ HTTP cục bộ (không mở trực tiếp bằng `file://`):
```bash
cd bantin-web
python3 -m http.server 8080
# mở http://localhost:8080
```

## 3. Đưa lên GitHub
```bash
cd bantin-web
git init && git add . && git commit -m "Khởi tạo website bản tin"
git branch -M main
git remote add origin https://github.com/<tai-khoan>/<repo>.git
git push -u origin main
```

## 4. Xuất bản (chọn 1 trong 2 cách)

### Cách A — Netlify (khuyến nghị, dễ nhất cho phần quản trị)
Repo vẫn nằm trên GitHub, chỉ dùng Netlify để chạy site + xác thực CMS.
1. Vào https://app.netlify.com → **Add new site → Import from GitHub** → chọn repo. Build command để trống, Publish directory `.`.
2. **Site settings → Identity → Enable Identity**; phần *Registration* chọn **Invite only**; bật **Git Gateway** (Services → Git Gateway → Enable).
3. **Identity → Invite users** mời email người biên tập.
4. Truy cập `https://<ten-site>.netlify.app/admin/` → đăng nhập → soạn tin → **Publish**.
   (Cấu hình mặc định trong `admin/config.yml` đã dùng `git-gateway`.)

### Cách B — Chỉ dùng GitHub Pages
1. Trên GitHub: **Settings → Pages → Source: GitHub Actions**. Mỗi lần push, workflow sẽ build `index.json` và deploy. Site chạy tại `https://<tai-khoan>.github.io/<repo>/`.
2. Để dùng `/admin` với GitHub, cần một dịch vụ OAuth nhỏ (Decap không tự xác thực trên GitHub Pages). Cách phổ biến, miễn phí: dựng **Cloudflare Worker** `decap-cms` OAuth (tìm "decap-cms cloudflare worker oauth"), rồi trong `admin/config.yml` bỏ khối `git-gateway`, mở khối `backend: github` và điền `repo`, `base_url` trỏ tới Worker.
> Nếu chưa cần `/admin` ngay, bạn vẫn xuất bản được bằng cách **sửa trực tiếp file JSON** trong `content/issues/` rồi commit (xem mục 6).

## 5. Ra số mới qua trang quản trị `/admin`
1. Mở `/admin` → **Số bản tin → New**.
2. Điền: Số, Năm, Ngày phát hành, Tiêu đề; tải **Ảnh bìa**; thêm **2 Tin nổi bật**.
3. Thêm các **Bài viết**: mỗi bài có *Mã bài (id)* (vd `a1`), *Chuyên mục*, *Tiêu đề*, *Ảnh* (tuỳ chọn), *Tóm tắt*, *Nội dung* (Markdown).
4. **Publish** → site tự cập nhật sau ~1 phút.

## 6. Ra số mới thủ công (không cần CMS)
Tạo file mới `content/issues/2026-21.json` theo mẫu file `2026-20.json`, bỏ ảnh vào `content/images/`, rồi `git push`. Workflow sẽ tự cập nhật `index.json`.

### Mẹo viết Nội dung (Markdown)
- Tiêu đề mục: `## 1. Tiêu đề`
- In đậm `**chữ**`, in nghiêng `_chữ_`
- Ảnh/biểu đồ: `![](images/chart1.png)`
- Bảng:
  ```
  | Chỉ tiêu | 2024 | 2025 |
  | --- | --- | --- |
  | Kim ngạch | 3,0 | 3,4 |
  ```

## 7. Ghi chú
- Chuyên mục lấy từ `content/site.json` (`sections`).
- Biểu đồ hiện là ảnh PNG trong `content/images/`; thay ảnh để đổi số liệu.
- Phông chữ tải từ Google Fonts (Be Vietnam Pro, Noto Serif) — cần Internet khi xem; có phông dự phòng hệ thống.
- Trang chủ, bài viết, lưu trữ đều **tự động** dựng từ dữ liệu — bạn chỉ cần thêm/sửa nội dung.
