"""GG Trading hero background generator.

Renders a dark, cinematic "wall of trading monitors" in the site's palette:
navy base, violet/blue nebula glow, emerald gains, red as accent only.
The left ~40% is kept soft and dark because the frosted text panel sits there.

Usage: python3 gen.py OUT.webp [seed]
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy.ndimage import gaussian_filter, zoom

W, H = 2560, 1440
SEED = int(sys.argv[2]) if len(sys.argv) > 2 else 7
rng = np.random.default_rng(SEED)

MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

# Palette (hex conversions of the site's oklch tokens)
NAVY0 = np.array([5, 7, 15]) / 255
NAVY1 = np.array([10, 15, 36]) / 255
VIOLET = (142, 97, 252)
VIOLET_DEEP = (123, 47, 255)
BLUE = (30, 111, 255)
GREEN = (0, 214, 143)
RED = (232, 72, 92)
WHITE = (235, 238, 255)
GRID = (60, 70, 120)


# ---------------------------------------------------------------- helpers
def fbm(h, w, octaves=6, base=4):
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        s = base * 2 ** o
        n = rng.random((s, int(s * w / h) + 1)).astype(np.float32)
        n = zoom(n, (h / n.shape[0], w / n.shape[1]), order=3)[:h, :w]
        out += amp * n
        tot += amp
        amp *= 0.55
    out /= tot
    return (out - out.min()) / (out.max() - out.min())


def blob(cx, cy, sx, sy):
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    return np.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2))


def coeffs(dst, src):
    """Perspective coefficients mapping dst quad -> src quad (PIL convention)."""
    m = []
    for (x, y), (u, v) in zip(dst, src):
        m.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        m.append([0, 0, 0, x, y, 1, -v * x, -v * y])
    A = np.array(m, float)
    b = np.array(src, float).reshape(8)
    return np.linalg.solve(A, b).tolist()


def ema(a, n):
    k = 2 / (n + 1)
    out = np.empty_like(a)
    out[0] = a[0]
    for i in range(1, len(a)):
        out[i] = a[i] * k + out[i - 1] * (1 - k)
    return out


def walk(n, drift=0.08, vol=1.0):
    r = rng.normal(drift, vol, n)
    # a couple of regime swings so it reads like a real session
    r += np.sin(np.linspace(0, rng.uniform(2, 4) * np.pi, n)) * 0.25
    return np.cumsum(r)


# ---------------------------------------------------------------- panels
def panel_base(pw, ph, title):
    img = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    d.rounded_rectangle([0, 0, pw - 1, ph - 1], 14, fill=(9, 13, 32, 235),
                        outline=(80, 70, 170, 160), width=3)
    d.rectangle([3, 3, pw - 4, 44], fill=(14, 19, 44, 255))
    f = ImageFont.truetype(MONO, 22)
    d.text((22, 11), title, font=f, fill=(170, 175, 215, 220))
    for i, c in enumerate([GREEN, VIOLET, (90, 100, 140)]):
        d.ellipse([pw - 40 - i * 26, 16, pw - 26 - i * 26, 30], fill=c + (200,))
    return img, d


def grid(d, x0, y0, x1, y1, nx=10, ny=6):
    for i in range(nx + 1):
        x = x0 + (x1 - x0) * i / nx
        d.line([x, y0, x, y1], fill=GRID + (55,), width=1)
    for j in range(ny + 1):
        y = y0 + (y1 - y0) * j / ny
        d.line([x0, y, x1, y], fill=GRID + (55,), width=1)


def candle_panel(pw, ph, title, n=90, boxes=True):
    img, d = panel_base(pw, ph, title)
    x0, y0, x1, y1 = 20, 64, pw - 110, ph - 30
    grid(d, x0, y0, x1, y1)
    close = walk(n + 1, drift=0.12, vol=1.1)
    # keep the session net-bullish: swap the walk's trend for a clear uptrend
    xi = np.arange(n + 1)
    close = close - np.polyval(np.polyfit(xi, close, 1), xi)
    close += np.linspace(0, np.ptp(close) * 1.3, n + 1)
    o = close[:-1]
    c = close[1:]
    hi = np.maximum(o, c) + np.abs(rng.normal(0, 0.6, n))
    lo = np.minimum(o, c) - np.abs(rng.normal(0, 0.6, n))
    fast, slow = ema(c, 9), ema(c, 21)
    ma = gaussian_filter(c, 9, mode="nearest")
    vmin, vmax = lo.min() - 1, hi.max() + 1
    sy = lambda v: y1 - (v - vmin) / (vmax - vmin) * (y1 - y0)
    cw = (x1 - x0) / n
    xs = [x0 + cw * (i + 0.5) for i in range(n)]

    # EMA ribbon (violet when fast > slow, muted red otherwise)
    for i in range(n - 1):
        up = fast[i] >= slow[i]
        col = (VIOLET_DEEP if up else RED) + ((70 if up else 45),)
        d.polygon([(xs[i], sy(fast[i])), (xs[i + 1], sy(fast[i + 1])),
                   (xs[i + 1], sy(slow[i + 1])), (xs[i], sy(slow[i]))], fill=col)

    # Trade boxes (long position tool: target above, stop below)
    if boxes:
        for _ in range(2):
            i = int(rng.integers(n * 0.25, n * 0.8))
            entry = c[i]
            risk = (vmax - vmin) * rng.uniform(0.05, 0.08)
            bx0, bx1 = xs[i], min(xs[i] + cw * rng.integers(10, 18), x1)
            d.rectangle([bx0, sy(entry + 2 * risk), bx1, sy(entry)],
                        fill=GREEN + (40,), outline=GREEN + (120,))
            d.rectangle([bx0, sy(entry), bx1, sy(entry - risk)],
                        fill=RED + (34,), outline=RED + (100,))

    for i in range(n):
        up = c[i] >= o[i]
        col = GREEN if up else RED
        a = 235 if up else 170
        d.line([xs[i], sy(hi[i]), xs[i], sy(lo[i])], fill=col + (a,), width=2)
        top, bot = sy(max(o[i], c[i])), sy(min(o[i], c[i]))
        if bot - top < 2:
            bot = top + 2
        d.rectangle([xs[i] - cw * 0.32, top, xs[i] + cw * 0.32, bot], fill=col + (a,))

    d.line([(xs[i], sy(fast[i])) for i in range(n)], fill=VIOLET + (230,), width=3)
    d.line([(xs[i], sy(ma[i])) for i in range(n)], fill=WHITE + (245,), width=5)

    # price axis + last price tag
    f = ImageFont.truetype(MONO, 18)
    for j in range(7):
        v = vmin + (vmax - vmin) * j / 6
        d.text((x1 + 14, sy(v) - 10), f"{18200 + v * 4:,.2f}", font=f,
               fill=(120, 128, 170, 200))
    ly = sy(c[-1])
    d.line([x0, ly, x1, ly], fill=GREEN + (120,), width=1)
    d.rectangle([x1 + 6, ly - 13, pw - 10, ly + 13], fill=GREEN + (230,))
    d.text((x1 + 12, ly - 10), f"{18200 + c[-1] * 4:,.2f}", font=f, fill=(5, 20, 15, 255))
    return img


def depth_panel(pw, ph, title):
    img, d = panel_base(pw, ph, title)
    x0, y0, x1, y1 = 20, 64, pw - 20, ph - 24
    rows = 22
    rh = (y1 - y0) / rows
    mid = rows // 2
    f = ImageFont.truetype(MONO, 16)
    for r in range(rows):
        bid = r > mid
        size = rng.gamma(2.2, 0.22) * (1 + abs(r - mid) * 0.08)
        size = min(size, 1)
        col = GREEN if bid else RED
        yy = y0 + r * rh
        xm = (x0 + x1) / 2
        if bid:
            d.rectangle([xm, yy + 2, xm + (x1 - xm) * size, yy + rh - 2], fill=col + (90,))
        else:
            d.rectangle([xm - (xm - x0) * size, yy + 2, xm, yy + rh - 2], fill=col + (42,))
        d.text((xm - 44, yy + rh / 2 - 9), f"{18450 - r * 0.25:.2f}", font=f,
               fill=(150, 155, 200, 170))
    d.line([x0, y0 + mid * rh + rh, x1, y0 + mid * rh + rh], fill=VIOLET + (200,), width=2)
    return img


def line_panel(pw, ph, title):
    img, d = panel_base(pw, ph, title)
    x0, y0, x1, y1 = 20, 64, pw - 20, ph - 24
    grid(d, x0, y0, x1, y1, 8, 5)
    n = 160
    for k, col in enumerate([BLUE, VIOLET, GREEN]):
        s = gaussian_filter(walk(n, 0.06 + k * 0.03, 0.9), 2)
        s = (s - s.min()) / (s.max() - s.min())
        pts = [(x0 + (x1 - x0) * i / (n - 1), y1 - 12 - s[i] * (y1 - y0 - 40) * (0.7 + 0.15 * k))
               for i in range(n)]
        if k == 2:
            d.polygon(pts + [(x1, y1), (x0, y1)], fill=col + (38,))
        d.line(pts, fill=col + (230,), width=3)
    return img


def heat_panel(pw, ph, title):
    img, d = panel_base(pw, ph, title)
    x0, y0, x1, y1 = 16, 60, pw - 16, ph - 16
    cols, rows = 9, 6
    cw, rh = (x1 - x0) / cols, (y1 - y0) / rows
    f = ImageFont.truetype(MONO, 15)
    syms = ["NQ", "ES", "GC", "CL", "YM", "RTY", "ZN", "SI", "6E"]
    for i in range(cols):
        for j in range(rows):
            v = rng.normal(0.35, 0.9)
            col = GREEN if v > 0 else RED
            a = int(min(abs(v), 1.6) / 1.6 * 150 + 30)
            if v < 0:
                a = int(a * 0.7)
            d.rectangle([x0 + i * cw + 3, y0 + j * rh + 3, x0 + (i + 1) * cw - 3,
                         y0 + (j + 1) * rh - 3], fill=col + (a,))
            if j == 0:
                d.text((x0 + i * cw + 10, y0 + 8), syms[i], font=f, fill=(230, 235, 255, 200))
    return img


# ---------------------------------------------------------------- 3D wall
def project(X, Y, Z, f=1500, cx=W * 0.46, cy=H * 0.47):
    return (cx + f * X / Z, cy - f * Y / Z)


def wall_quad(u0, u1, v0, v1, yaw, origin, depth_bend=0.0):
    """Quad for a panel spanning [u0,u1]x[v0,v1] on a yawed wall."""
    ox, oy, oz = origin
    pts = []
    for u, v in [(u0, v1), (u1, v1), (u1, v0), (u0, v0)]:  # TL TR BR BL
        a = yaw + depth_bend * u
        X = ox + u * np.cos(a)
        Z = oz + u * np.sin(a)
        pts.append(project(X, v + oy, Z))
    return pts


def place(canvas, panel, quad, blur=0.0, alpha=1.0):
    pw, ph = panel.size
    src = [(0, 0), (pw, 0), (pw, ph), (0, ph)]
    warped = panel.transform((W, H), Image.PERSPECTIVE, coeffs(quad, src),
                             Image.BICUBIC)
    if blur:
        warped = warped.filter(ImageFilter.GaussianBlur(blur))
    if alpha < 1:
        a = warped.getchannel("A").point(lambda p: int(p * alpha))
        warped.putalpha(a)
    canvas.alpha_composite(warped)


# ---------------------------------------------------------------- compose
def main(out):
    # base gradient
    t = np.linspace(0, 1, H)[:, None, None]
    base = NAVY0 * (1 - t) + NAVY1 * t
    img = np.broadcast_to(base, (H, W, 3)).copy().astype(np.float32)

    # nebula
    n1, n2 = fbm(H, W, 7, 3), fbm(H, W, 6, 5)
    neb_v = blob(W * 0.70, H * 0.30, W * 0.38, H * 0.45) * (n1 ** 1.8)
    neb_b = blob(W * 0.92, H * 0.75, W * 0.28, H * 0.40) * (n2 ** 2.0)
    neb_m = blob(W * 0.40, H * 0.10, W * 0.25, H * 0.25) * (n2 ** 2.5)
    img += neb_v[..., None] * (np.array(VIOLET_DEEP) / 255) * 0.95
    img += neb_b[..., None] * (np.array(BLUE) / 255) * 0.65
    img += neb_m[..., None] * (np.array((180, 60, 220)) / 255) * 0.35
    # stars / dust
    stars = (rng.random((H, W)) > 0.9993).astype(np.float32)
    stars = gaussian_filter(stars, 0.8) * 3
    img += stars[..., None] * 0.6

    canvas = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).convert("RGBA")

    # giant faint background chart sweeping across the sky (the "white MA arc")
    sky = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sky, "RGBA")
    n = 260
    s = gaussian_filter(walk(n, 0.15, 1.0), 6)
    s = (s - s.min()) / (s.max() - s.min())
    pts = [(W * 0.05 + W * 1.0 * i / (n - 1), H * 0.82 - s[i] * H * 0.62) for i in range(n)]
    sd.polygon(pts + [(W * 1.05, H), (W * 0.05, H)], fill=VIOLET_DEEP + (16,))
    sd.line(pts, fill=WHITE + (90,), width=4)
    glow = sky.filter(ImageFilter.GaussianBlur(18))
    canvas.alpha_composite(glow)
    canvas.alpha_composite(sky.filter(ImageFilter.GaussianBlur(1.2)))

    # monitor wall: recedes to the left, nearest panels on the right
    yaw = np.deg2rad(-38)
    origin = (-0.05, -0.12, 3.2)
    PW = 1500
    panels = [
        # (u0,u1, v0,v1, maker, blur, alpha)
        (-1.95, -1.25, 0.10, 0.62, lambda: line_panel(1100, 800, "ES1!  ·  5m  ·  SESSION"), 4.5, 0.55),
        (-1.95, -1.25, -0.48, 0.04, lambda: heat_panel(1100, 800, "FUTURES HEATMAP"), 4.5, 0.50),
        (-1.18, -0.30, 0.10, 0.72, lambda: depth_panel(1100, 800, "MNQ  DOM"), 2.6, 0.75),
        (-1.18, -0.30, -0.48, 0.04, lambda: line_panel(1100, 800, "NQ / ES / GC  CORRELATION"), 2.6, 0.70),
        (-0.22, 1.28, -0.48, 0.72, lambda: candle_panel(PW, 1050, "MNQ1!  ·  5m  ·  FVG / EMA 9-21  ·  ORB 06:30"), 0.6, 0.95),
        (1.36, 2.20, 0.10, 0.72, lambda: candle_panel(1100, 800, "MES1!  ·  5m", n=60, boxes=False), 1.4, 0.85),
        (1.36, 2.20, -0.48, 0.04, lambda: depth_panel(1100, 800, "MES  DOM"), 1.4, 0.80),
    ]
    wall = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for u0, u1, v0, v1, mk, bl, al in panels:
        q = wall_quad(u0, u1, v0, v1, yaw, origin, depth_bend=0.06)
        place(wall, mk(), q, bl, al)

    # reflection on a glossy desk / floor
    refl = wall.transpose(Image.FLIP_TOP_BOTTOM)
    shift = int(H * 0.47 * 2 - H * 0.07)
    refl = refl.transform((W, H), Image.AFFINE, (1, 0, 0, 0, 1, H - shift + 0), Image.BICUBIC)
    refl = refl.filter(ImageFilter.GaussianBlur(10))
    ra = np.array(refl.getchannel("A"), np.float32)
    fade = np.clip((np.arange(H) - H * 0.80) / (H * 0.2), 0, 1)[:, None]
    ra *= (1 - fade) * 0.22 * (np.arange(H)[:, None] > H * 0.78)
    refl.putalpha(Image.fromarray(ra.astype(np.uint8)))

    # bloom
    wa = np.asarray(wall, np.float32) / 255
    bright = wa[..., :3] * wa[..., 3:4]
    bloom = gaussian_filter(bright, (26, 26, 0)) * 1.1 + gaussian_filter(bright, (6, 6, 0)) * 0.35

    canvas.alpha_composite(refl)
    canvas.alpha_composite(wall)
    out_arr = (np.asarray(canvas, np.float32)[..., :3] / 255 + bloom) * 1.18

    # left darkening (text panel zone) + vignette
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    left = np.clip(1 - x / (W * 0.55), 0, 1) ** 1.6
    out_arr *= (1 - 0.40 * left)[..., None]
    vig = 1 - 0.55 * (((x - W * 0.6) / (W * 0.75)) ** 2 + ((y - H * 0.45) / (H * 0.75)) ** 2)
    out_arr *= np.clip(vig, 0.25, 1)[..., None]

    # subtle scanlines + grain
    out_arr *= (1 - 0.025 * (np.arange(H) % 3 == 0))[:, None, None]
    out_arr += rng.normal(0, 0.012, out_arr.shape).astype(np.float32)

    final = Image.fromarray((np.clip(out_arr, 0, 1) * 255).astype(np.uint8))
    final.save(out, "WEBP", quality=82, method=6)
    final.resize((W // 2, H // 2), Image.LANCZOS).save(out.replace(".webp", "_preview.png"))


if __name__ == "__main__":
    main(sys.argv[1])
