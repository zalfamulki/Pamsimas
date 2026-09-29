"""Generate PNG icons for PAMSIMAS PWA from the SVG design (blue rounded square + water drop)."""
from PIL import Image, ImageDraw
import math
import os

BLUE = (0, 102, 204, 255)
WHITE = (255, 255, 255, 255)
LIGHT_BLUE = (127, 196, 255, 255)


def draw_icon(size):
    S = size
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # rounded rect background
    radius = int(S * 0.22)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=radius, fill=BLUE)

    cx = S * 0.5
    # water drop: apex at top, circular bottom
    apex_y = S * 0.15
    drop_r = S * 0.26
    cy = S * 0.60

    # drop silhouette = triangle apex + circle bottom
    d.ellipse([cx - drop_r, cy - drop_r, cx + drop_r, cy + drop_r], fill=WHITE)
    # tangent lines from apex to circle
    dx, dy = cx - cx, cy - apex_y
    dist = math.hypot(dx, dy)
    if dist > drop_r:
        alpha = math.asin(drop_r / dist)
        # left and right tangent points
        base_angle = math.atan2(dy, dx)
        for sign in (-1, 1):
            ang = base_angle + sign * (math.pi / 2 - alpha)
            tx = cx + drop_r * math.cos(ang)
            ty = cy + drop_r * math.sin(ang)
            # draw a filled polygon apex -> tangent -> center-ish, ellipse covers bottom
        # simpler: filled polygon apex to two points wide on the circle
        spread = drop_r * 0.96
        d.polygon([
            (cx, apex_y),
            (cx - spread, cy - drop_r * 0.2),
            (cx + spread, cy - drop_r * 0.2),
        ], fill=WHITE)
        # re-draw circle over seam
        d.ellipse([cx - drop_r, cy - drop_r, cx + drop_r, cy + drop_r], fill=WHITE)

    # highlight arc inside drop
    hl_r = drop_r * 0.55
    hl_cx = cx - drop_r * 0.30
    hl_cy = cy - drop_r * 0.15
    d.arc(
        [hl_cx - hl_r, hl_cy - hl_r, hl_cx + hl_r, hl_cy + hl_r],
        start=120, end=250,
        fill=LIGHT_BLUE,
        width=max(2, int(S * 0.03)),
    )

    return img


os.makedirs(os.path.dirname(__file__), exist_ok=True)
for px in (192, 512):
    out = os.path.join(os.path.dirname(__file__), f"icon-{px}.png")
    draw_icon(px).save(out, "PNG")
    print("wrote", out)
