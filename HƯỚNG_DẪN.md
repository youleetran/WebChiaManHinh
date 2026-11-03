# Hướng dẫn sử dụng — Trang web chia đôi màn hình (Mazda3 2020)

File chính: `index.html` — mở là chạy, không cần cài đặt gì.

## 1. Chạy thử trên máy tính ngay
- Mở terminal trong thư mục này, chạy `python -m http.server 8000`, rồi vào `http://localhost:8000`.
- ⚠️ **Không nhấp đúp** mở `index.html`: khi mở bằng `file://`, trình duyệt chặn GPS và không đọc được dữ liệu đường trong `data/roads`.
- Trên điện thoại hoặc xe, trang phải được mở qua **HTTPS** thì GPS mới chạy (xem mục 2).

## 2. Đưa lên mạng (miễn phí, có HTTPS → GPS hoạt động)
⚠️ Phải đưa lên **cả thư mục**, gồm `data/roads` (3.226 file, khoảng 133 MB). Nếu thiếu thư mục này, trang không có giới hạn tốc độ. Thư mục `tools` thì không cần đưa lên. Dung lượng này chưa được thử trên các dịch vụ dưới đây, nên kiểm tra giới hạn của gói miễn phí trước khi chọn:
- **GitHub Pages**: đẩy cả thư mục lên repo → Settings → Pages → bật.
- **Netlify**: vào [netlify.com](https://netlify.com) → Deploy manually → kéo thư mục.
- **Vercel**: vào [vercel.com](https://vercel.com) → New Project → kéo thư mục `WebChiaManHinh` → Deploy.

Sau khi deploy bạn sẽ có link dạng `https://tên-bạn.vercel.app` — mở link này thì GPS mới chạy được.

## 3. Đưa lên màn hình xe Mazda3 2020
Màn hình Mazda Connect **không có trình duyệt chính thức**. Chọn 1 cách:

### Cách A — Android Auto + Fermata Auto (phổ biến)
1. Trên điện thoại: cài **AAAD** (Android Auto Apps Downloader) từ [github.com/shmykelsa/AAAD](https://github.com/shmykelsa/AAAD).
2. Dùng AAAD cài **Fermata Auto** (có webview + trình duyệt).
3. Cắm điện thoại vào xe (Android Auto) → mở Fermata → vào trình duyệt → gõ link trang web của bạn.
4. GPS sẽ lấy từ điện thoại → tốc độ + giới hạn tốc độ hoạt động.

### Cách B — Tweak Mazda Connect
- Dùng [MZD-WEB](https://github.com/bencroskery/MZD-WEB) để mở trình duyệt trên Mazda Connect.
- Lưu ý: trình duyệt này có thể không cấp GPS cho trang web → bạn phải **chạm vào bản đồ để đặt vị trí tay**.

## 4. Giới hạn của phần "cảnh báo tốc độ" (quan trọng)
- Trang web hiển thị **giới hạn tốc độ (km/h)** của con đường hiện tại, lấy từ dữ liệu **OpenStreetMap**.
- Khi chạy quá giới hạn **+5 km/h** → bảng tốc độ đổi màu đỏ + nháy "CHẠY QUÁ TỐC ĐỘ" + tiếng bíp.
- ❌ Đây **KHÔNG phải** cảnh báo **camera bắn tốc độ** thời gian thực (tính năng đó chỉ có ở app Waze). Trang web không thay thế được Waze nếu bạn cần cảnh báo camera.
- Trên bản đồ có hai ô chỉ hiện số: biển tròn là giới hạn, ô bên cạnh là tốc độ hiện tại.
- Đường chưa có dữ liệu `maxspeed` trên OpenStreetMap → hiện số **ước tính** theo loại đường, màu xám, có dấu `~` (ví dụ `~50`). Số ước tính **không kích hoạt cảnh báo** và có thể khác biển báo thật. Bảng tốc độ chỉ hiện `--` khi không xác định được đường đang chạy (ví dụ xe cách đường trên 35 m).
- Dữ liệu đường nằm sẵn trong `data/roads` (OpenStreetMap, bản ngày 01/11/2026), mỗi lần chỉ tải ô quanh vị trí xe, ô nặng nhất dưới 1 MB. Rớt mạng vẫn tra được trong các ô đã tải.
- ⚠️ **Phần lớn đường chưa có biển số trong dữ liệu**, nên trên các đường đó trang chỉ hiện số ước tính và không cảnh báo. Tỷ lệ đường có số trên toàn quốc: cao tốc 80%, quốc lộ/đường trục 22–25%, đường cấp 2 khoảng 11%, đường cấp 3 khoảng 7%, đường dân cư gần 0%.

**Cập nhật dữ liệu đường:** tải [vietnam-latest.osm.pbf](https://download.geofabrik.de/asia/vietnam-latest.osm.pbf) (khoảng 332 MB), rồi chạy:
```bash
pip install osmium
python tools/build_roads.py vietnam-latest.osm.pbf data/roads
```
Dữ liệu © OpenStreetMap, giấy phép ODbL: giữ dòng ghi nguồn ở góc bản đồ.
- Nút 🔔 bật/tắt tiếng bíp. Bấm nút để bật sẽ kêu thử một lần. Trên iPhone, tiếng bíp lúc chạy quá tốc độ có thể không kêu, nên hãy nhìn cả cảnh báo đỏ trên màn hình.

## 5. Bản đồ dẫn đường
- Khi có GPS, bản đồ tự nghiêng, xoay theo hướng xe chạy, phóng sát và hiện mũi tên xanh. Đây chỉ là bản đồ bám vị trí, chưa có chỉ đường theo lộ trình.
- Kéo bản đồ để xem chỗ khác thì trang tạm thôi bám theo, sau 10 giây tự quay về xe. Nút **+ / −** ở góc dưới để phóng to, thu nhỏ.
- GPS tự bật khi mở trang. Nếu lúc đó bị từ chối quyền vị trí, hãy cho phép rồi tải lại trang.
- Bản đồ lấy từ [OpenFreeMap](https://openfreemap.org) (miễn phí, không cần tài khoản) nên cần mạng, và thiết bị phải hỗ trợ WebGL. Nếu không có WebGL, bản đồ sẽ báo lỗi.

## 6. Khi video bị giật
- Trang chỉ phát H.264 tối đa 480p (`VIDEO_MAX_HEIGHT`) và tải trước 45 giây (`VIDEO_BUFFER_S`), để đỡ nặng máy và chịu được lúc mạng yếu.
- Video đi qua máy chủ Invidious công khai, mỗi đoạn mất khoảng 1–2 giây mới bắt đầu tải (đo ngày 03/11/2026 từ máy tính). Máy chủ quá tải thì video vẫn có thể dừng để tải.
- Hình trên màn hình xe do điện thoại gửi sang. Nếu bản thân điện thoại phát mượt mà trên xe vẫn giật, thì nguyên nhân nằm ở đường truyền điện thoại–xe hoặc ứng dụng đang dùng để mở trang, sửa trang web không hết được.

## 7. Khi video không tìm/phát được
- Trang tự đổi máy chủ khi một máy chủ lỗi hoặc tải quá 25 giây, và tự lấy thêm máy chủ mới từ [api.invidious.io/instances.json](https://api.invidious.io/instances.json) khi mở trang.
- ⚠️ Máy chủ Invidious công khai hay bị YouTube chặn. Lúc kiểm tra (03/11/2026) chỉ có **một** máy chủ công khai cho phép gọi API là `https://yt.chocolatemoo53.com`. Nếu nó hỏng và chưa có máy chủ mới thì không xem được video.
- Video trực tiếp (live) không phát được nên không hiện trong kết quả tìm kiếm.

## 8. Yêu thích và đã xem
- Khi đang phát, video chiếm hết nửa bên phải. Rê chuột hoặc chạm vào video thì tên bài hiện nhỏ trong 3 giây, nút ☆ nằm ở đó.
- Bấm **☰ Danh sách** hoặc tìm kiếm để xem danh sách, video thu nhỏ ở góc. Chạm vào video nhỏ để quay lại. Nút ▲ ▼ để cuộn danh sách.
- Chạm vào ô tìm sẽ hiện các tìm kiếm gần đây và gợi ý có sẵn.
- Bấm ☆ để lưu video. Xem lại ở tab **★ Yêu thích** và **Đã xem** (tối đa 50 video gần nhất). Dữ liệu lưu trong trình duyệt của thiết bị đang dùng.

## 9. Lưu ý an toàn
- ⚠️ **Không xem/nghịch màn hình khi đang lái.** Trang này để hành khách dùng hoặc khi xe dừng/đỗ.
- Khi xe chạy trên 5 km/h, hình và danh sách tự ẩn, chỉ còn tiếng và nút điều khiển. Hình hiện lại sau khi xe dừng 3 giây, hoặc khi GPS không báo tốc độ quá 10 giây.
- Nút **👤 Hành khách** tắt việc ẩn hình, chỉ dùng khi hành khách đang xem. Trang nhớ lựa chọn này cho lần mở sau, nên nhớ tắt khi đi một mình. Không có tín hiệu tốc độ từ GPS thì hình cũng không tự ẩn.
- Tốc độ hiển thị có độ trễ GPS nhỏ, không thay thế đồng hồ xe và biển báo.
