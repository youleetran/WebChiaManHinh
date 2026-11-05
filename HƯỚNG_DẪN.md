# Hướng dẫn sử dụng — Trang web chia đôi màn hình (Mazda3 2020)

File chính: `index.html` — mở là chạy, không cần cài đặt gì.

## 1. Chạy thử trên máy tính ngay
- Mở terminal trong thư mục này, chạy `python -m http.server 8000`, rồi vào `http://localhost:8000`.
- ⚠️ **Không nhấp đúp** mở `index.html`: khi mở bằng `file://`, trình duyệt chặn GPS và không đọc được dữ liệu đường trong `data/roads`.
- Trên điện thoại hoặc xe, trang phải được mở qua **HTTPS** thì GPS mới chạy (xem mục 2).

## 2. Đưa lên mạng (miễn phí, có HTTPS → GPS hoạt động)
⚠️ Phải đưa lên **cả thư mục**, gồm `data/roads` (3.226 file, khoảng 133 MB) và `data/cams`. Nếu thiếu `data/roads`, trang không có giới hạn tốc độ. Nếu thiếu `data/cams`, bản đồ không có camera từ `speedcams.json`. Thư mục `tools` và file `speedcams.json` thì không cần đưa lên. Dung lượng này chưa được thử trên các dịch vụ dưới đây, nên kiểm tra giới hạn của gói miễn phí trước khi chọn:
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
- Khi chạy quá giới hạn **+5 km/h** → bảng tốc độ đổi màu đỏ + viền đỏ nháy quanh bản đồ + tiếng bíp.
- ❌ Cảnh báo camera trên trang chỉ dựa vào danh sách có sẵn trong `speedcams.json`, **không** cập nhật thời gian thực như app Waze. Camera mới hoặc camera di động sẽ không được báo.
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
- Khi có GPS, bản đồ tự xoay theo hướng xe chạy, hiện mũi tên xanh ở phía dưới, tên các đường và lối rẽ phía trước. Con đường đang chạy được tô màu xanh ngọc. Khi khớp được đường, mũi tên được đặt lên mặt đường và xoay theo hướng đường để bản đồ không lắc vì nhiễu GPS. Đây chỉ là bản đồ bám vị trí, chưa có chỉ đường theo lộ trình.
- Kéo bản đồ để xem chỗ khác thì trang tạm thôi bám theo, sau 10 giây tự quay về xe. Nút **+ / −** ở góc dưới để phóng to, thu nhỏ.
- GPS tự bật khi mở trang. Nếu lúc đó bị từ chối quyền vị trí, hãy cho phép rồi tải lại trang.
- Bản đồ lấy từ [OpenFreeMap](https://openfreemap.org) (miễn phí, không cần tài khoản) nên cần mạng, và thiết bị phải hỗ trợ WebGL. Nếu không có WebGL, bản đồ sẽ báo lỗi.

- Bản đồ hiện biểu tượng đèn giao thông, biển dừng, biển nhường đường, camera tốc độ và biển giới hạn khi xe tới gần, lấy từ `data/signs` (OpenStreetMap). Biểu tượng đèn chỉ cho biết vị trí, **không** cho biết đèn đang xanh hay đỏ.
- ⚠️ Dữ liệu biển báo rất ít: cả nước 18 biển nhường đường, 11 biển dừng, 83 biển giới hạn, và phần lớn nơi không có biển nào. Không thấy biểu tượng không có nghĩa là ngoài đường không có biển. Luôn nhìn biển thật.
- Camera lấy thêm từ `speedcams.json` (đủ 19.609 camera, camera hai chiều đường có thể nằm sát nhau), nằm trong `data/cams` (1.495 file). Camera có giới hạn tốc độ hiện con số màu đỏ. Dữ liệu có thể thiếu hoặc cũ.
- Góc trên bên trái hiện đường có tên sắp cắt qua trong vòng 500 m nếu đi tiếp, kèm khoảng cách. Khi chưa chọn điểm đến, đây **không** phải chỉ đường và mũi tên không bảo bạn rẽ. Hẻm, ngõ và đường không tên không được báo. Dữ liệu không cho biết đường nào đi cầu vượt nên có thể báo cả đường chạy ngầm bên dưới.
- Tới ngã có từ 3 lối đi trở lên trong vòng 300 m, dưới tên đường hiện khung mũi tên chỉ các hướng đi, tính từ hình dạng đường có tên trong dữ liệu. Mỗi mũi tên là một **lối đi**, **không** phải một làn đường, và không bảo bạn nên đi hướng nào. Dữ liệu có thể thiếu đường cấm rẽ, nên luôn nhìn biển và vạch kẻ thật.
- Trên cùng cột nút bên phải là nút về vị trí xe (đưa bản đồ về xe ngay và phóng lại đúng mức khi chạy). Góc dưới bên trái có nút kính lúp và nút menu (menu để dành cho chức năng sau, hiện chưa làm gì). Kính lúp mở màn hình tìm địa điểm, có lịch sử tìm kiếm lưu trong máy và các ô tắt. Bấm ⋯ ở một địa điểm để lưu làm Nhà, Cơ quan, Yêu thích. Các ô Xưởng DV, Trạm sạc, Showroom chỉ tìm trong khoảng 50 km quanh xe, cần GPS, và dữ liệu còn thiếu nhiều. Chọn một kết quả thì hiện khung chi tiết: **Xem lộ trình** vạch tuyến kèm quãng đường và thời gian, **Bắt đầu** vào màn hình dẫn đường với khung hướng rẽ ở trên, thanh giờ tới, số phút, số km ở dưới; đi sai thì tự tính lại, tới nơi thì báo, bấm ✕ để dừng. Không bấm gì sau 30 giây thì khung chi tiết tự đóng và về xe, không tự bắt đầu dẫn đường. Cần có mạng và GPS, chưa có giọng đọc. Tuyến dành cho ô tô, tính từ dữ liệu OpenStreetMap nên có thể sai với cấm rẽ, đường một chiều thực tế: luôn nhìn biển báo. Chữ bạn gõ được gửi tới dịch vụ Photon kèm vị trí làm tròn khoảng 11 km; vị trí chính xác của xe và điểm đến được gửi tới máy chủ thử nghiệm của OSRM để tính tuyến, máy chủ này không đảm bảo luôn chạy. Không nên gõ tìm khi đang lái.
- Khi có camera phía trước trong vòng 500 m, bản đồ nhấp nháy khung vàng có biểu tượng camera và khoảng cách (không có chữ), cả khi khóa iPhone. Cảnh báo chỉ nháy, **không** có tiếng. File không cho biết camera bắn chiều nào nên có thể báo cả camera của chiều ngược lại. Camera ở khúc cua có thể báo muộn hơn vì trang chỉ xét đường thẳng trước mũi xe.
- Khi có `speedcams.json` mới: `python tools/build_cams.py speedcams.json data/cams`
- Bản đồ cũng hiện cây xăng từ OpenStreetMap, kèm tên hãng nếu có. Dữ liệu có thể thiếu hoặc cũ, ví dụ cây đã đóng cửa.
- Cập nhật cùng dữ liệu đường: `python tools/build_signs.py vietnam-latest.osm.pbf data/signs`

- Khi khóa iPhone, chữ và bản đồ thường không được cập nhật lên màn hình xe, nên trang vẽ bản đồ, mũi tên, tốc độ và tên đường qua một lớp video. Thiết bị không hỗ trợ thì tự trở về bản đồ thường. Lúc khóa máy không bấm được các nút trên trang.

## 6. Khi video bị giật
- Trang chỉ phát H.264 tối đa 480p (`VIDEO_MAX_HEIGHT`) và tải trước 45 giây (`VIDEO_BUFFER_S`), để đỡ nặng máy và chịu được lúc mạng yếu.
- Video đi qua máy chủ Invidious công khai, mỗi đoạn mất khoảng 1–2 giây mới bắt đầu tải (đo ngày 03/11/2026 từ máy tính). Máy chủ quá tải thì video vẫn có thể dừng để tải.
- Hình trên màn hình xe do điện thoại gửi sang. Nếu bản thân điện thoại phát mượt mà trên xe vẫn giật, thì nguyên nhân nằm ở đường truyền điện thoại–xe hoặc ứng dụng đang dùng để mở trang, sửa trang web không hết được.

## 7. Khi video không tìm/phát được
- Trang tự đổi máy chủ khi một máy chủ lỗi hoặc tải quá 25 giây, và tự lấy thêm máy chủ mới từ [api.invidious.io/instances.json](https://api.invidious.io/instances.json) khi mở trang.
- ⚠️ Máy chủ Invidious công khai hay bị YouTube chặn. Lúc kiểm tra (03/11/2026) chỉ có **một** máy chủ công khai cho phép gọi API là `https://yt.chocolatemoo53.com`. Nếu nó hỏng và chưa có máy chủ mới thì không xem được video.
- Máy chủ quá tải hay báo lỗi thoáng qua, nên trang tự thử lại 3 lần. Video vẫn không mở được thì trang tự sang bài sau, lỗi 3 bài liên tiếp mới báo.
- Video trực tiếp (live) không phát được nên không hiện trong kết quả tìm kiếm.

## 8. Yêu thích và đã xem
- Khi đang phát, video chiếm hết nửa bên phải. Rê chuột hoặc chạm vào video thì tên bài hiện nhỏ trong 3 giây, nút ☆ nằm ở đó.
- Bấm **☰ Danh sách** hoặc tìm kiếm để xem danh sách, video thu nhỏ ở góc. Chạm vào video nhỏ để quay lại. Nút ▲ ▼ để cuộn danh sách.
- Chạm vào ô tìm là gõ được ngay, đồng thời xổ xuống các tìm kiếm gần đây và gợi ý có sẵn để chọn. Nếu màn hình bị lệch sau khi chạm, mở trang với `?debug` ở cuối địa chỉ để xem số đo ở cạnh dưới màn hình.
- Nút ⏮ ⏭ trên trang và trên vô lăng để chuyển bài. Hết danh sách thì quay lại bài đầu; đang ở bài đầu thì ⏮ phát lại từ đầu. Nút trên vô lăng chỉ hoạt động khi iPhone coi ứng dụng mở trang là ứng dụng đang phát nhạc.
- Bấm ☆ để lưu video. Xem lại ở tab **★ Yêu thích** và **Đã xem** (tối đa 50 video gần nhất). Dữ liệu lưu trong trình duyệt của thiết bị đang dùng.

## 9. Lưu ý an toàn
- ⚠️ **Không xem/nghịch màn hình khi đang lái.** Trang này để hành khách dùng hoặc khi xe dừng/đỗ.
- Khi xe chạy trên 5 km/h, hình và danh sách tự ẩn, chỉ còn tiếng và nút điều khiển. Hình hiện lại sau khi xe dừng 3 giây, hoặc khi GPS không báo tốc độ quá 10 giây.
- Nút **👤 Hành khách** tắt việc ẩn hình, chỉ dùng khi hành khách đang xem. Trang nhớ lựa chọn này cho lần mở sau, nên nhớ tắt khi đi một mình. Không có tín hiệu tốc độ từ GPS thì hình cũng không tự ẩn.
- Tốc độ hiển thị có độ trễ GPS nhỏ, không thay thế đồng hồ xe và biển báo.
