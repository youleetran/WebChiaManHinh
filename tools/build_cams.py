"""Cắt danh sách camera tốc độ (speedcams.json) thành các file nhỏ để web tự đọc. Giữ đủ mọi camera.

Cách dùng:
    python tools/build_cams.py speedcams.json data/cams

Mỗi file ra là một ô lưới giống tools/build_signs.py, tên {x}_{y}.json, và cùng định dạng điểm:
    [lat, lon, loại, giá_trị]
    lat, lon: số nguyên, đơn vị 1e-5 độ
    loại: luôn là vị trí của 'camera' trong SIGN_TYPES
    giá_trị: giới hạn tốc độ km/h của camera, không có thì là 0
"""
import argparse
import json
import math
import shutil
from collections import defaultdict
from pathlib import Path

TILE_DEG = 0.1
CAMERA_TYPE = 3    # vị trí của 'camera' trong SIGN_TYPES ở index.html và tools/build_signs.py


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('cams')
    parser.add_argument('out')
    args = parser.parse_args()

    cams = json.loads(Path(args.cams).read_text(encoding='utf-8'))

    tiles = defaultdict(list)
    for cam in cams:
        lat, lon = cam['lat'], cam['lon']
        key = f'{math.floor(lon / TILE_DEG)}_{math.floor(lat / TILE_DEG)}'
        tiles[key].append([round(lat * 1e5), round(lon * 1e5), CAMERA_TYPE, cam['speed_limit_kmh'] or 0])

    out = Path(args.out)
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    for key, records in tiles.items():
        (out / f'{key}.json').write_text(json.dumps(records, separators=(',', ':')), encoding='utf-8')

    with_limit = sum(1 for c in cams if c['speed_limit_kmh'])
    print(f'{len(cams)} camera ({with_limit} có giới hạn), {len(tiles)} file')


if __name__ == '__main__':
    main()
