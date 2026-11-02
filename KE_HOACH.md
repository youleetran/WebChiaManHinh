# Kế hoạch: Trang web chia đôi màn hình cho xe Mazda3 2020

> Mục tiêu: Trái = bản đồ + tuyến đường + cảnh báo tốc độ · Phải = YouTube không quảng cáo.
> Thiết bị: màn hình Mazda3 2020 (Mazda Connect), truy cập qua trình duyệt web.

---

## 1. Ràng buộc thực tế (quan trọng, phải hiểu trước)

1. **Màn hình Mazda3 2020 không có trình duyệt web chính thức.** Để mở web trên màn hình thường dùng 1 trong 2 cách:
   - **Android Auto + app sideload** (phổ biến nhất): cài [AAAD](https://github.com/shmykelsa/AAAD) rồi cài **Fermata Auto** (có webview) hoặc **Screen2Auto** trên điện thoại. Xem thêm [XDA — xem YouTube, duyệt web trên Android Auto](https://www.xda-developers.com/this-useful-sideloaded-android-auto-app-lets-me-watch-youtube-browse-the-web/) và [MakeUseOf — trình duyệt trên Android Auto](https://www.makeuseof.com/browser-on-android-auto/).
   - **Tweak Mazda Connect**: dùng [MZD-WEB](https://github.com/bencroskery/MZD-WEB) (mở trình duyệt trên Mazda Connect).
2. **Không cài được extension (uBlock Origin)** trên trình duyệt/webview của xe → không thể chặn quảng cáo YouTube bằng extension thông thường.
3. **Google Maps không nhúng được chế độ dẫn đường đầy đủ.** `google.com/maps` chặn iframe (X-Frame-Options). Chỉ nhúng được qua **Google Maps Embed API** — hiển thị bản đồ + tuyến đường, nhưng **không có** giọng nói turn-by-turn và **không có** cảnh báo tốc độ. Xem [Maps Embed API](https://developers.google.com/maps/documentation/embed/embedding-map).
4. **Cảnh báo bắn tốc độ/camera thời gian thực** là tính năng của *app* (Waze / Google Maps app), **bản web không có sẵn**. Trên trang web ta chỉ hiển thị được **giới hạn tốc độ (km/h)** của con đường hiện tại.

> ✅ Nhờ bạn chỉ cần *"xem bản đồ + tuyến đường + cảnh báo tốc độ"* (không cần giọng nói), bài toán trở nên **khả thi** và đơn giản hơn rất nhiều.

---

## 2. Kiến trúc đề xuất

Một trang web đơn (HTML + CSS + JS), chia đôi màn hình bằng CSS Grid:

```
+----------------------------------------------+
|  TRÁI: Bản đồ + tốc độ   |  PHẢI: YouTube     |
|  Google Maps Embed /     |  Piped/Invidious   |
|  Leaflet+OSM + km/h      |  embed (không QC)  |
+----------------------------------------------+
```

---

## 3. Phần trái — Bản đồ + tốc độ

### Phương án 1 (khuyến nghị khởi đầu): Google Maps Embed API
- Tạo API key miễn phí (Google Cloud) → nhúng iframe bản đồ, hiển thị vị trí + tuyến đường.
- **Ưu:** đẹp, quen thuộc, ít code.
- **Nhược:** **không** hiển thị giới hạn tốc độ / camera.

### Phương án 2 (nâng cao, có hiển thị km/h): Leaflet + OpenStreetMap
- Dùng [Leaflet](https://leafletjs.com/) + OpenStreetMap, lấy vị trí GPS (`navigator.geolocation`), vẽ tuyến đường.
- Lấy **giới hạn tốc độ** con đường hiện tại từ dữ liệu OpenStreetMap (Overpass API) → hiển thị số km/h to rõ.
- **Ưu:** tự do, hiển thị được giới hạn tốc độ, không cần key Google.
- **Nhược:** nhiều công sức hơn; "camera bắn tốc độ" vẫn phải tự thêm dữ liệu (không có nguồn free đáng tin).

> 💡 **Trung thực về "cảnh báo tốc độ":** nếu bạn thực sự cần cảnh báo *camera bắn tốc độ* thời gian thực, giải pháp đáng tin nhất là chạy **Waze** riêng (điện thoại) — nó có cảnh báo tốc độ + camera. Trang web chỉ làm tốt phần *hiển thị giới hạn tốc độ (km/h)*.

---

## 4. Phần phải — YouTube không quảng cáo

Vì không có extension, dùng **frontend thay thế không quảng cáo** (ad-free theo thiết kế):
- **[Piped](https://github.com/TeamPiped/Piped)** — nhẹ, có API + embed player riêng.
- **[Invidious](https://github.com/iv-org/invidious)** — phổ biến, hỗ trợ iframe embed.
- So sánh nhanh: [Invidious vs Piped](https://selfhosting.sh/compare/invidious-vs-piped/).

Cách làm: chọn 1 instance đang hoạt động (instance công khai, hoặc tự host) → nhúng video qua iframe/player → **hoàn toàn không quảng cáo**.

---

## 5. Các bước triển khai (checklist)

- [ ] **Bước 0 — Xác định cách mở web trên màn hình xe** (quyết định):
  - Android Auto → cài AAAD → Fermata Auto (webview).
  - Hoặc tweak Mazda Connect → MZD-WEB.
- [ ] **Bước 1** — Tạo trang chia đôi: `index.html` + CSS Grid (50/50) + JS.
- [ ] **Bước 2** — Nhúng bản đồ (Google Maps Embed **hoặc** Leaflet + OSM).
- [ ] **Bước 3** — Thêm hiển thị giới hạn tốc độ (nếu chọn Phương án 2).
- [ ] **Bước 4** — Nhúng YouTube không QC qua Piped/Invidious.
- [ ] **Bước 5** — Host trang web: máy chủ local (điện thoại phát hotspot) hoặc host free (GitHub Pages / Vercel). Lưu ý màn hình xe cần có mạng.
- [ ] **Bước 6** — Kiểm tra trên xe: độ phân giải, cảm ứng, cỡ chữ lớn cho dễ nhìn khi lái.

---

## 6. Lưu ý an toàn

- ⚠️ **Xem video khi đang lái xe có thể vi phạm luật và rất nguy hiểm.** Chỉ dùng cho hành khách hoặc khi xe dừng/đỗ.
- Hiển thị tốc độ trên web **không thay thế** việc quan sát biển báo giao thông.

---

## 7. Câu hỏi cần bạn xác nhận trước khi bắt tay làm

1. Bạn đang mở web trên màn hình Mazda bằng cách nào: **Android Auto + Fermata Auto**, hay **tweak trình duyệt Mazda Connect**? → quyết định Bước 0.
2. Bạn muốn tôi bắt đầu **Phương án 1 (Google Maps embed, nhanh)** hay **Phương án 2 (Leaflet + hiển thị km/h, nâng cao)** cho phần bản đồ?
3. Bạn có sẵn tài khoản **Google Cloud** để tạo API key (nếu dùng Google Maps embed) không?
