# Hướng dẫn sử dụng — Trang web chia đôi màn hình (Mazda3 2020)

File chính: `index.html` — mở là chạy, không cần cài đặt gì.

## 1. Chạy thử trên máy tính ngay
- Mở terminal trong thư mục này, chạy `python -m http.server 8000`, rồi vào `http://localhost:8000`.
- ⚠️ **Không nhấp đúp** mở `index.html`: khi mở bằng `file://`, trình duyệt chặn GPS và không đọc được dữ liệu đường trong `data/roads`.
- Trên điện thoại hoặc xe, trang phải được mở qua **HTTPS** thì GPS mới chạy (xem mục 2).

## 2. Đưa lên mạng (miễn phí, có HTTPS → GPS hoạt động)
⚠️ Phải đưa lên **cả thư mục `data`**: `data/roads` (đường, khoảng 133 MB), `data/speed` (giới hạn tốc độ, khoảng 78 MB), `data/signs` (biển báo và camera, khoảng 11 MB), `data/icons` và `data/types.json`. Thiếu `data/speed` và `data/roads` thì trang không có giới hạn tốc độ; thiếu `data/signs`, `data/icons` hoặc `data/types.json` thì bản đồ không có biển báo và camera. Thư mục `Audio` (giọng đọc, khoảng 12 MB) cũng phải đưa lên, thiếu thì trang chỉ kêu bíp. Thư mục `tools`, `nguon` và `FIle_vietmap` thì không cần đưa lên. Dung lượng này chưa được thử trên các dịch vụ dưới đây, nên kiểm tra giới hạn của gói miễn phí trước khi chọn:
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
- Trang web hiển thị **giới hạn tốc độ (km/h)** của con đường hiện tại, lấy từ `data/speed` (2.925.604 đoạn đường, dữ liệu bản 2023.06, có giới hạn riêng cho từng chiều). Đoạn nào không có trong đó thì mới lấy từ **OpenStreetMap** trong `data/roads`. Dữ liệu 2023 có thể đã cũ so với biển ngoài đường.
- Khi chạy quá giới hạn **+5 km/h** → bảng tốc độ đổi màu đỏ + viền đỏ nháy quanh bản đồ + tiếng bíp.
- ❌ Cảnh báo camera trên trang chỉ dựa vào danh sách có sẵn trong `nguon/camera.geojson`, **không** cập nhật thời gian thực như app Waze. Camera mới hoặc camera di động sẽ không được báo.
- Trên bản đồ có hai ô chỉ hiện số: biển tròn là giới hạn, ô bên cạnh là tốc độ hiện tại.
- Đường không có trong `data/speed` và cũng chưa có dữ liệu `maxspeed` trên OpenStreetMap → hiện số **ước tính** theo loại đường, màu xám, có dấu `~` (ví dụ `~50`). Số ước tính **không kích hoạt cảnh báo** và có thể khác biển báo thật. Bảng tốc độ chỉ hiện `--` khi không xác định được đường đang chạy (ví dụ xe cách đường trên 35 m).
- Dữ liệu đường nằm sẵn trong `data/roads` (OpenStreetMap, bản ngày 01/11/2026), mỗi lần chỉ tải ô quanh vị trí xe, ô nặng nhất dưới 1 MB. Rớt mạng vẫn tra được trong các ô đã tải.
- Thử trên tuyến Nhơn Hòa 20 → Bạch Đằng (Đà Nẵng): `data/speed` có giới hạn ở cả 36/36 điểm thử, còn OpenStreetMap chỉ có ở 10 điểm. Phần lớn đường trong thành phố là 50 km/h; đây là số trong dữ liệu, không phải số đọc từ biển thật.

**Cập nhật dữ liệu đường:** tải [vietnam-latest.osm.pbf](https://download.geofabrik.de/asia/vietnam-latest.osm.pbf) (khoảng 332 MB), rồi chạy:
```bash
pip install osmium
python tools/build_roads.py vietnam-latest.osm.pbf data/roads
```
Dữ liệu © OpenStreetMap, giấy phép ODbL: phải ghi nguồn trên bản đồ. Dòng ghi nguồn được thu gọn thành nút ⓘ ở góc dưới bên phải, bấm vào mới hiện chữ; không xóa hẳn nút này.
- Loa cảnh báo **mặc định tắt** (nút 🔕). Nút 🔔 và công tắc **Tiếng cảnh báo** trong Cài đặt → Giọng nói cùng bật/tắt mọi tiếng: giọng đọc và tiếng bíp. Tắt thì dừng luôn câu đang đọc. Bấm nút để bật sẽ đọc thử một câu (hoặc kêu bíp nếu đã tắt giọng). Trên iPhone, tiếng có thể không phát khi chưa chạm vào trang lần nào hoặc lúc khóa máy, nên hãy nhìn cả cảnh báo đỏ trên màn hình.

## 5. Bản đồ dẫn đường
- Khi có GPS, bản đồ tự xoay theo hướng xe chạy, hiện mũi tên xanh ở phía dưới, tên các đường và lối rẽ phía trước. Con đường đang chạy được tô màu xanh ngọc. Khi khớp được đường, mũi tên được đặt lên mặt đường và xoay theo hướng đường để bản đồ không lắc vì nhiễu GPS. Đây chỉ là bản đồ bám vị trí, chưa có chỉ đường theo lộ trình.
- Kéo bản đồ để xem chỗ khác thì trang tạm thôi bám theo, sau 10 giây tự quay về xe. Nút **+ / −** ở góc dưới để phóng to, thu nhỏ.
- GPS tự bật khi mở trang. Nếu lúc đó bị từ chối quyền vị trí, hãy cho phép rồi tải lại trang.
- Bản đồ lấy từ [OpenFreeMap](https://openfreemap.org) (miễn phí, không cần tài khoản) nên cần mạng, và thiết bị phải hỗ trợ WebGL. Nếu không có WebGL, bản đồ sẽ báo lỗi.

- Bản đồ hiện 276.653 biển cảnh báo (28 loại: ngã tư, ngã rẽ, đường cong, trường học, người đi bộ, nhường đường, đèn giao thông, cấm vượt, cấm rẽ, cấm quay đầu…) từ zoom 15 trở lên, và 23.418 camera (12 loại) từ zoom 14, lấy từ `data/signs`. Biển nằm sát nhau thì chỉ hiện biển không bị che; camera luôn hiện. Biểu tượng đèn chỉ cho biết vị trí, **không** cho biết đèn đang xanh hay đỏ.
- ⚠️ Theo ghi chú của bộ dữ liệu, biển nằm đâu đó trên một đoạn đường và điểm trên bản đồ đặt ở cuối đoạn, nên vị trí có thể lệch, nhất là đoạn dài. Bản đồ hiện biển của cả hai chiều. Dữ liệu bản 2023 có thể thiếu hoặc cũ: luôn nhìn biển thật.
- Camera có giới hạn tốc độ (784 camera) hiện thêm biển tròn nhỏ có con số ở góc icon.
- Góc trên bên trái hiện đường có tên sắp cắt qua trong vòng 500 m nếu đi tiếp, kèm khoảng cách. Khi chưa chọn điểm đến, đây **không** phải chỉ đường và mũi tên không bảo bạn rẽ. Hẻm, ngõ và đường không tên không được báo. Dữ liệu không cho biết đường nào đi cầu vượt nên có thể báo cả đường chạy ngầm bên dưới.
- Tới ngã có từ 3 lối đi trở lên trong vòng 300 m, chỉ hiện một ô mũi tên nhỏ cạnh mũi tên xe (khung hình ngã to dưới khung hướng dẫn đã bỏ). Khi chưa dẫn đường, mũi tên tính từ hình dạng đường có tên trong dữ liệu: mỗi mũi tên là một **lối đi**, **không** phải một làn đường, và không bảo bạn nên đi hướng nào. Dữ liệu đường không có đường nhánh lên xuống cao tốc, nên khi chưa dẫn đường thì nút giao cao tốc không hiện khung này.
- Khi dẫn đường, khung hiện khi còn cách bước rẽ 500 m: lối sẽ đi tô xanh. Nếu OpenStreetMap có ghi làn ở đó (turn:lanes) thì hàng trên là từng làn, làn nên đi tô xanh; ở Việt Nam dữ liệu này còn rất ít (thử 4 tuyến ở Hà Nội, TP.HCM chưa gặp bước rẽ nào có), nên thường chỉ thấy các lối đi. Dữ liệu có thể thiếu đường cấm rẽ, nên luôn nhìn biển và vạch kẻ thật.
- Góc dưới bên trái có nút về vị trí xe (đưa bản đồ về xe ngay và phóng lại đúng mức khi chạy, vẫn có khi đang dẫn đường), nút kính lúp và nút ☰ mở bảng **Cài đặt**. Kính lúp mở màn hình tìm địa điểm, có lịch sử tìm kiếm lưu trong máy và các ô tắt. Bấm ⋯ ở một địa điểm để lưu làm Nhà, Cơ quan, Yêu thích. Các ô Xưởng DV, Trạm sạc, Showroom chỉ tìm trong khoảng 50 km quanh xe, cần GPS, và dữ liệu còn thiếu nhiều. Chọn một kết quả thì hiện khung chi tiết: **Xem lộ trình** vạch tuyến kèm quãng đường và thời gian, **Bắt đầu** vào màn hình dẫn đường với khung hướng rẽ to ở trên (mũi tên rẽ, khoảng cách, tên đường, và dòng "Sau đó (…) ↱" khi bước rẽ kế tiếp cách không quá 2 km), thanh giờ tới, số phút, số km ở dưới; đi sai thì tự tính lại, tới nơi thì báo, bấm ✕ để dừng. Không bấm gì sau 30 giây thì khung chi tiết tự đóng và về xe, không tự bắt đầu dẫn đường. Cần có mạng và GPS. Giọng đọc báo hướng rẽ khi còn khoảng 300 m và khi sắp tới, báo đi sai đường và tới nơi; các câu này là câu ghi sẵn nên chỉ nói hướng, không đọc tên đường. Tuyến dành cho ô tô, tính từ dữ liệu OpenStreetMap nên có thể sai với cấm rẽ, đường một chiều thực tế: luôn nhìn biển báo. Chữ bạn gõ được gửi tới dịch vụ Photon kèm vị trí làm tròn khoảng 11 km; vị trí chính xác của xe và điểm đến được gửi tới máy chủ thử nghiệm của OSRM để tính tuyến, máy chủ này không đảm bảo luôn chạy. Không nên gõ tìm khi đang lái.
- **Phóng to ở ngã lớn:** còn cách 200 m tới ngã cắt qua đường chính (quốc lộ, đường trục, đường chính) hoặc ngã từ 4 lối trở lên, bản đồ tự phóng to thêm khoảng 1 mức để dễ nhìn đường rẽ; qua ngã thì trả về mức cũ. Ngã tư thường trong phố thì không phóng, để bản đồ không phóng ra vào liên tục. Khi dẫn đường thì phóng to ở mọi bước rẽ trong 200 m. Nếu bạn tự đổi mức phóng lúc đó thì trang giữ mức của bạn.
- **Giới hạn tốc độ tiếp theo:** trang xét dọc con đường đang chạy (cùng tên) tới 600 m phía trước, theo dữ liệu `data/speed`. Chỗ giới hạn đổi khác chỗ xe thì hiện chấm đỏ đúng chỗ đó, nối lên biển tốc độ mới trên bản đồ. Còn cách 300 m thì hiện thêm thanh dưới cùng "(60) Tốc độ giới hạn tiếp theo … 40 m", tên đường đẩy lên trên thanh này. Chỉ tính đoạn cùng hướng (lệch không quá 30°) và phải giữ số mới 20 m liền, để không nhầm với đường cắt ngang. Đường không tên thì chỉ xét tới hết đoạn đang chạy.
- Khi có camera phía trước trong vòng 500 m, bản đồ nhấp nháy khung vàng có biểu tượng camera và khoảng cách (không có chữ), cả khi khóa iPhone. Bản đồ chỉ hiện camera phía trước trên đường đang chạy trong vòng 500 m, các camera khác ẩn đi; chưa có GPS thì không hiện camera nào. Camera gần nhất đổi thành chấm đỏ đúng chỗ camera, có đường đỏ nối lên biểu tượng camera lớn ở phía trên bên phải (kèm giới hạn tốc độ nếu có), hiện cả khi đã ẩn lớp Camera trong Cài đặt. Mỗi camera được đọc một lần, ví dụ "camera tốc độ" hoặc "camera giao thông" với camera đèn đỏ, làn xe buýt, kèm giới hạn nếu camera có. Chỉ báo camera nằm trên chính con đường xe đang chạy (trong khoảng 25 m), ở phía trước theo con đường đó, kể cả qua khúc cua; khoảng cách cũng tính dọc theo đường. Camera gần một đường khác hơn hẳn (chiều bên kia dải phân cách, đường cắt ngang, đường song song) thì không báo. Thử với 405 camera ở trung tâm TP.HCM: báo đủ 150/150 lần chạy trên đúng đường của camera, 0/11 lần chạy chiều bên kia dải phân cách, 2/52 lần chạy trên đường bên cạnh. Đường hai chiều không có dải phân cách thì vẫn báo cả hai chiều, vì hướng ghi trong dữ liệu camera không khớp với chiều xe chạy nên không dùng được. Đường chưa có tên trong dữ liệu thì chỉ xét tới hết đoạn đường đang chạy. Chưa khớp được đường (chưa tải dữ liệu đường) thì trở lại cách cũ: camera trước mũi xe, lệch ngang không quá 30 m.
- Khi có bộ dữ liệu mới, đặt `bien_bao.geojson`, `camera.geojson`, thư mục `toc_do` và `icons` vào `nguon/` rồi chạy `python tools/build_map_data.py nguon data`. Script xóa và tạo lại `data/signs`, `data/speed`, `data/icons`, `data/types.json`. Ghi chú gốc của bộ dữ liệu nằm ở `nguon/README.md`.
- ⚠️ Theo `nguon/README.md`, icon camera và icon tốc độ thuộc bản quyền Vietmap.
- Bản đồ cũng hiện cây xăng lấy thẳng từ nền bản đồ OpenFreeMap (OpenStreetMap), kèm tên nếu có. Dữ liệu có thể thiếu hoặc cũ, ví dụ cây đã đóng cửa.

- **Cài đặt:** bấm nút ☰ ở góc dưới bên trái. Trang chính có các mục, bấm vào để mở, bấm ‹ để quay lại:
  - **Tốc độ:** chỉnh tốc độ GPS từ −10 tới +10 km/h cho khớp đồng hồ xe (mặc định 0, không chỉnh). Chỉ cộng/trừ khi xe chạy từ 5 km/h trở lên. Số đã chỉnh dùng cho cả ô tốc độ và cảnh báo chạy quá tốc độ. Đồng hồ xe thường chỉ cao hơn tốc độ thật vài km/h, nên chỉnh cộng thêm sẽ cảnh báo sớm hơn.
  - **Giọng nói:** bật/tắt tiếng và chọn giọng, xem dưới.
  - **Màu bản đồ:** Tự động (mặc định: sáng ban ngày, tối sau khi mặt trời lặn, tính theo giờ mặt trời ở chỗ xe, xét lại mỗi phút), Luôn sáng hoặc Luôn tối. Lựa chọn lưu trong máy. Bản đồ không còn vẽ nhà 3D cho gọn và nhẹ máy; khung hướng dẫn cũng đổi màu theo.
  - **Tùy chỉnh cảnh báo:** bật/tắt riêng từng loại câu đọc: camera tốc độ, camera giao thông (đèn đỏ, làn xe buýt), camera khác, chạy quá tốc độ, giới hạn tốc độ mới, vào hầm, cấm vượt/hết cấm vượt, hướng rẽ, đi sai đường, tới nơi. Mặc định bật hết. Bật lại một mục thì nghe thử câu đó. Tắt "Chạy quá tốc độ" thì vẫn kêu bíp và vẫn có viền đỏ; tắt các loại camera thì vẫn có khung vàng nhấp nháy. Mọi lựa chọn trong Cài đặt được lưu trong trình duyệt cho lần sau.
  - **Biển báo trên bản đồ:** ẩn/hiện cả lớp Biển báo, Camera, Cây xăng, và ẩn/hiện riêng từng loại trong 28 loại biển (có icon để nhận ra). Mặc định hiện hết. Chỉ ẩn biểu tượng trên bản đồ: khung vàng báo camera, giọng đọc và cảnh báo tốc độ vẫn chạy như cũ.
- **Giọng đọc:** trong Cài đặt → Giọng nói, chọn một trong 3 giọng nữ: miền Bắc, miền Trung, miền Nam (mặc định), hoặc tắt giọng chỉ kêu bíp. Bấm một giọng là nghe thử ngay; lựa chọn được lưu trong máy. Giọng đọc báo:
  - camera phía trước trong vòng 500 m (mỗi camera một lần);
  - chạy quá tốc độ, nhắc lại sau 15 giây nếu vẫn còn quá;
  - giới hạn tốc độ mới, sau khi số giữ nguyên 3 lần GPS liền và cách lần đọc trước ít nhất 20 giây, để đường đổi số liên tục không đọc liên tục. Chỉ có câu cho 30, 40, 50, 60, 70, 80, 90, 100, 120 km/h; số khác thì không đọc;
  - vào hầm, bắt đầu và hết cấm vượt trong vòng 200 m, cùng chiều xe chạy (theo hướng ghi trong dữ liệu biển, khớp khoảng 80%) và nằm trên con đường xe đang chạy như camera;
  - hướng rẽ, đi sai đường và tới nơi khi đang dẫn đường.
- Lúc đọc, tiếng video tự tắt, đọc xong các câu đang chờ thì bật lại. Video bạn đã tự tắt tiếng thì vẫn giữ tắt. Giọng đọc phát với bộ đệm âm thanh lớn để không rè, giật khi máy đang vẽ bản đồ nặng.
- Câu đọc lấy từ `FIle_vietmap` (bản ghi âm của Vietmap), chỉ chép những câu trang dùng sang `Audio/<giọng>/`: `north` là miền Bắc, `central` miền Trung, `south` miền Nam, 61 câu mỗi giọng.
- Khi khóa iPhone, chữ và bản đồ thường không được cập nhật lên màn hình xe, nên trang vẽ bản đồ, mũi tên, tốc độ và tên đường qua một lớp video. Thiết bị không hỗ trợ thì tự trở về bản đồ thường. Lúc khóa máy không bấm được các nút trên trang.

## 6. Khi video bị giật
- **Trình phát video** (Cài đặt → Trình phát video): mặc định là **khung YouTube** giống duoscreen, phát bằng trình phát nhúng của YouTube nên ổn định hơn; quảng cáo có hay không là do YouTube, trang không chặn được (khung đó là trang của youtube.com). Chọn **Invidious** thì không có quảng cáo nhưng máy chủ hay bị chặn; khi mọi máy chủ Invidious lỗi, trang tự chuyển sang khung YouTube. Tìm kiếm vẫn đi qua Invidious ở cả hai cách. Các nút phát, tắt tiếng khi đọc cảnh báo, nút trên vô lăng dùng được với cả hai. Vào trang là tự mở video: bài đang nghe dở, hoặc một bài nhạc chill nếu chưa nghe bài nào. Nếu iPhone chặn tự phát có tiếng, trang phát không tiếng trước (nút loa hiện gạch đỏ); chạm vào bất kỳ đâu trên trang là có tiếng. Bạn đã bấm dừng thì trang không tự phát lại.
- **Tắt màn hình (tiếng nền):** iPhone đóng băng trang nếu lúc tắt màn hình trang không phát tiếng gì, kể cả vài giây chờ tải (nhật ký: đóng băng 31 giây, 759 giây). Vì vậy khi đang nghe, trang luôn chạy sẵn phần tiếng của bài (lấy qua Invidious, không quảng cáo) trong một thẻ âm thanh **tắt tiếng**, khớp giây với video. Tắt màn hình thì chỉ cần bật tiếng thẻ đó, không phải tải gì; hết bài thì bài kế cũng phát bằng phần tiếng. Mở màn hình thì trả tiếng về video đúng giây. Thẻ này cần được mở một lần trong lúc bạn chạm vào trang (iPhone bắt buộc). Tốn thêm khoảng 1 MB mỗi phút 4G cho phần tiếng chạy sẵn. Cần máy chủ Invidious chạy được (`yt.chocolatemoo53.com` chạy được ngày 08/11/2026).
  - **Muốn vừa nghe vừa xem video trên CarPlay khi khóa iPhone: chọn Invidious.** Lúc khóa máy, video Invidious cứ chạy có tiếng; nếu iPhone dừng nó thì trang phát lại ngay. iPhone hay tự gửi lệnh "dừng" tới màn hình khóa sau 10–30 giây: lúc khóa máy trang bỏ qua lệnh dừng đơn lẻ, muốn dừng thật thì **bấm dừng 2 lần liền** (trong 3 giây) trên vô lăng hoặc màn hình khóa. Lúc khóa máy trang **không đọc cảnh báo và không kêu bíp** (bật tiếng cảnh báo có thể làm iPhone dừng video); mở màn hình thì cảnh báo chạy lại bình thường. Với khung YouTube, lúc khóa máy hình đứng yên, chỉ có tiếng (phát qua phần tiếng riêng).
- **Tắt màn hình:** giống duoscreen, khi đang nghe trang phát kèm một đoạn âm thanh im lặng lặp mãi (thẻ `<audio>` ẩn) và báo iPhone đây là trang phát nhạc (`navigator.audioSession.type = 'playback'`), để iPhone không dừng trang khi tắt màn hình. Đoạn im lặng chỉ bắt đầu sau khi bạn chạm vào trang hoặc chọn bài (iPhone bắt buộc vậy), và dừng khi bạn bấm dừng nhạc. Trang cũng báo lại màn hình khóa mỗi 1,2 giây (tên bài, đang phát, các nút) như duoscreen. Nếu nhạc vẫn bị dừng mà không phải do bạn bấm nút của trang, màn hình khóa, vô lăng hay vừa chạm vào khung video, trang tự phát lại (Carvia vẫn hiện trang trên xe khi khóa iPhone, nên không dựa vào việc trang có đang hiện hay không), thử 8 lần giãn dần, đồng thời cứ 2 giây kiểm tra một lần khi màn hình tắt; bật màn hình lên cũng phát tiếp. Bạn tự bấm dừng (nút trên trang, trong khung YouTube, màn hình khóa, vô lăng) thì không phát lại. Chưa thử được trên iPhone thật: nếu khung YouTube vẫn dừng hẳn khi tắt màn hình thì thử chọn Invidious.
- Video mặc định 360p để đỡ nặng máy và tốn 4G: Invidious chỉ phát H.264 tối đa 360p (`VIDEO_MAX_HEIGHT`) và tải trước 45 giây (`VIDEO_BUFFER_S`); khung YouTube được xin 360p mỗi lần bắt đầu phát (`YT_QUALITY`). YouTube coi đây là lời đề nghị, có thể tự đổi chất lượng khi mạng thay đổi.
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
