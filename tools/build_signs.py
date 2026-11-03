"""Lấy đèn giao thông và biển báo từ dữ liệu OpenStreetMap, cắt thành các file nhỏ để web tự đọc.

Cách dùng:
    pip install osmium
    python tools/build_signs.py vietnam.osm.pbf data/signs

File vào tải từ https://download.geofabrik.de/asia/vietnam-latest.osm.pbf
Mỗi file ra là một ô lưới giống tools/build_roads.py, tên {x}_{y}.json.

Mỗi điểm trong file: [lat, lon, loại, giá_trị]
    lat, lon: số nguyên, đơn vị 1e-5 độ
    loại: vị trí trong SIGN_TYPES, phải giống SIGN_TYPES trong index.html
    giá_trị: số km/h với loại speed, còn lại là 0
"""
import argparse
import json
import math
import re
import shutil
from collections import defaultdict
from pathlib import Path

import osmium

TILE_DEG = 0.1
SIGN_TYPES = ['light', 'stop', 'give_way', 'camera', 'speed']
MERGE_M = 40       # các điểm cùng loại gần nhau hơn mức này coi là một (đèn cùng ngã tư)
MIN_LIMIT, MAX_LIMIT = 5, 130


def sign_type(tags):
    """Trả về (loại, giá trị), hoặc None nếu không rõ là biển gì."""
    highway = tags.get('highway')
    sign = tags.get('traffic_sign') or ''
    if highway == 'traffic_signals' or sign == 'signal':
        return 'light', 0
    if highway == 'stop' or sign == 'stop':
        return 'stop', 0
    if highway == 'give_way' or sign.startswith('W.208'):
        return 'give_way', 0
    if highway == 'speed_camera':
        return 'camera', 0
    match = re.fullmatch(r'(\d+)(\s*km/h)?', (tags.get('maxspeed') or '').strip())
    if match and MIN_LIMIT <= int(match.group(1)) <= MAX_LIMIT:
        return 'speed', int(match.group(1))
    return None


class SignHandler(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.points = []

    def node(self, n):
        found = sign_type(n.tags)
        if found:
            self.points.append((n.location.lat, n.location.lon, found[0], found[1]))


def distance_m(a, b):
    dy = (a[0] - b[0]) * 111320
    dx = (a[1] - b[1]) * 111320 * math.cos(a[0] * math.pi / 180)
    return math.hypot(dx, dy)


def merge_nearby(points):
    """Giữ một điểm cho mỗi cụm cùng loại, cùng giá trị."""
    cell_deg = MERGE_M / 111320
    cells = defaultdict(list)
    kept = []
    for p in points:
        cx, cy = int(p[1] / cell_deg), int(p[0] / cell_deg)
        near = (q for dx in (-1, 0, 1) for dy in (-1, 0, 1) for q in cells[(cx + dx, cy + dy)])
        if any(q[2:] == p[2:] and distance_m(p, q) < MERGE_M for q in near):
            continue
        cells[(cx, cy)].append(p)
        kept.append(p)
    return kept


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pbf')
    parser.add_argument('out')
    args = parser.parse_args()

    handler = SignHandler()
    handler.apply_file(args.pbf)
    points = merge_nearby(handler.points)

    tiles = defaultdict(list)
    for lat, lon, kind, value in points:
        key = f'{math.floor(lon / TILE_DEG)}_{math.floor(lat / TILE_DEG)}'
        tiles[key].append([round(lat * 1e5), round(lon * 1e5), SIGN_TYPES.index(kind), value])

    out = Path(args.out)
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    for key, records in tiles.items():
        (out / f'{key}.json').write_text(json.dumps(records, separators=(',', ':')), encoding='utf-8')

    counts = defaultdict(int)
    for p in points:
        counts[p[2]] += 1
    print(f'{len(handler.points)} điểm gốc, còn {len(points)} sau khi gộp, {len(tiles)} file: {dict(counts)}')


if __name__ == '__main__':
    main()
