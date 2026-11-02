"""Cắt dữ liệu đường OpenStreetMap thành các file nhỏ để web tự đọc, không cần Overpass.

Cách dùng:
    pip install osmium
    python tools/build_roads.py vietnam.osm.pbf data/roads

File vào tải từ https://download.geofabrik.de/asia/vietnam-latest.osm.pbf
Mỗi file ra là một ô lưới TILE_DEG độ, tên {x}_{y}.json với x = floor(lon / TILE_DEG),
y = floor(lat / TILE_DEG). TILE_DEG và ROAD_TYPES phải giống ROAD_TILE_DEG và
ROAD_TYPES trong index.html.

Mỗi đoạn đường trong file: [tên, loại, một_chiều, giới_hạn_xuôi, giới_hạn_ngược, tọa_độ]
    loại: vị trí trong ROAD_TYPES
    một_chiều: 0 = hai chiều, 1 = một chiều, 2 = một chiều ngược hướng vẽ
    tọa_độ: [lat, lon, dlat, dlon, ...] là số nguyên, đơn vị 1e-5 độ, từ điểm thứ hai
            trở đi là phần chênh so với điểm trước
"""
import argparse
import gzip
import json
import math
import re
import shutil
import sys
from collections import defaultdict
from pathlib import Path

import osmium

TILE_DEG = 0.1
ROAD_TYPES = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary',
              'unclassified', 'residential', 'living_street']
SIMPLIFY_M = 3.0   # bỏ các điểm lệch dưới mức này để file nhỏ hơn
MIN_LIMIT, MAX_LIMIT = 5, 130   # số ngoài khoảng này coi là dữ liệu sai


def parse_maxspeed(raw):
    """"50" / "50 km/h" / "30 mph" -> số km/h. "VN:urban", "none"... -> None."""
    if not raw:
        return None
    match = re.search(r'\d+(?:\.\d+)?', raw)
    if not match:
        return None
    value = float(match.group())
    if 'mph' in raw.lower():
        value *= 1.60934
    value = round(value)
    return value if MIN_LIMIT <= value <= MAX_LIMIT else None


def simplify(points, tolerance_m):
    """Douglas-Peucker, tính trên mặt phẳng vì đoạn đường ngắn."""
    if len(points) < 3:
        return points
    cos_lat = math.cos(math.radians(points[0][0]))
    keep = {0, len(points) - 1}
    stack = [(0, len(points) - 1)]
    while stack:
        first, last = stack.pop()
        ax, ay = points[first][1] * cos_lat, points[first][0]
        bx, by = points[last][1] * cos_lat, points[last][0]
        sx, sy = bx - ax, by - ay
        length2 = sx * sx + sy * sy
        worst, worst_dist = None, tolerance_m
        for i in range(first + 1, last):
            px, py = points[i][1] * cos_lat - ax, points[i][0] - ay
            u = max(0.0, min(1.0, (px * sx + py * sy) / length2)) if length2 else 0.0
            dist = math.hypot(px - u * sx, py - u * sy) * 111320
            if dist > worst_dist:
                worst, worst_dist = i, dist
        if worst is not None:
            keep.add(worst)
            stack.append((first, worst))
            stack.append((worst, last))
    return [points[i] for i in sorted(keep)]


def tiles_of_segment(a, b):
    """Mọi ô lưới mà khung bao của đoạn a-b chạm vào."""
    x0, x1 = sorted((math.floor(a[1] / TILE_DEG), math.floor(b[1] / TILE_DEG)))
    y0, y1 = sorted((math.floor(a[0] / TILE_DEG), math.floor(b[0] / TILE_DEG)))
    return [(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]


def encode(points):
    out = []
    prev_lat = prev_lon = 0
    for lat, lon in points:
        ilat, ilon = round(lat * 1e5), round(lon * 1e5)
        out += [ilat - prev_lat, ilon - prev_lon]
        prev_lat, prev_lon = ilat, ilon
    return out


class RoadHandler(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.tiles = defaultdict(list)
        self.ways = 0
        self.with_limit = 0

    def way(self, w):
        highway = w.tags.get('highway', '')
        road_type = highway[:-5] if highway.endswith('_link') else highway
        if road_type not in ROAD_TYPES:
            return
        try:
            points = [(n.lat, n.lon) for n in w.nodes]
        except osmium.InvalidLocationError:
            return
        if len(points) < 2:
            return

        limit = parse_maxspeed(w.tags.get('maxspeed'))
        forward = parse_maxspeed(w.tags.get('maxspeed:forward')) or limit
        backward = parse_maxspeed(w.tags.get('maxspeed:backward')) or limit
        oneway_tag = w.tags.get('oneway', '')
        if oneway_tag == '-1':
            oneway = 2
        elif oneway_tag == 'yes' or highway == 'motorway' or w.tags.get('junction') == 'roundabout':
            oneway = 1
        else:
            oneway = 0

        self.ways += 1
        if forward or backward:
            self.with_limit += 1

        # Cắt đường theo ô lưới. Đoạn nằm trên ranh giới có mặt ở cả hai ô.
        points = simplify(points, SIMPLIFY_M)
        pieces = {}
        for i in range(len(points) - 1):
            for tile in tiles_of_segment(points[i], points[i + 1]):
                piece = pieces.setdefault(tile, [])
                if piece and piece[-1][-1] == i:
                    piece[-1].append(i + 1)
                else:
                    piece.append([i, i + 1])
        record = [w.tags.get('name', ''), ROAD_TYPES.index(road_type), oneway, forward, backward]
        for tile, runs in pieces.items():
            for run in runs:
                self.tiles[tile].append(record + [encode([points[i] for i in run])])


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('input', help='file .osm.pbf')
    parser.add_argument('output', help='thư mục ra (sẽ bị xóa và tạo lại)')
    args = parser.parse_args()

    handler = RoadHandler()
    handler.apply_file(args.input, locations=True, idx='flex_mem')

    out = Path(args.output)
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    total = total_gz = biggest = 0
    for (x, y), ways in handler.tiles.items():
        body = json.dumps(ways, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
        (out / f'{x}_{y}.json').write_bytes(body)
        total += len(body)
        total_gz += len(gzip.compress(body, 6))
        biggest = max(biggest, len(body))

    print(f'Đường: {handler.ways}, có giới hạn tốc độ: {handler.with_limit} '
          f'({handler.with_limit * 100 / max(handler.ways, 1):.1f}%)')
    print(f'File: {len(handler.tiles)}, tổng {total / 1e6:.1f} MB, '
          f'khi nén gzip {total_gz / 1e6:.1f} MB, file lớn nhất {biggest / 1e6:.2f} MB')


if __name__ == '__main__':
    sys.exit(main())
