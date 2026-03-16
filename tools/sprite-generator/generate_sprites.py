#!/usr/bin/env python3
"""
Pilgrim's Progress - High-Quality Pixel Art Sprite Generator
Generates 16x16 and 32x32 character sprites with 4-direction walk animations.
Output: PNG sprite sheets ready for Unity import.
"""

from PIL import Image
import os
import math

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 
    'pilgrims-progress-unity', 'Assets', '_Project', 'Sprites', 'Characters')

# ─── Color Helpers ───

def rgba(r, g, b, a=255):
    return (r, g, b, a)

def darken(color, factor=0.7):
    return (int(color[0]*factor), int(color[1]*factor), int(color[2]*factor), color[3] if len(color) > 3 else 255)

def lighten(color, factor=1.3):
    return (min(255, int(color[0]*factor)), min(255, int(color[1]*factor)), min(255, int(color[2]*factor)), color[3] if len(color) > 3 else 255)

def blend(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(min(len(c1), len(c2))))

CLEAR = (0, 0, 0, 0)

# ─── Character Definitions ───

SKIN_LIGHT = rgba(220, 185, 155)
SKIN_MEDIUM = rgba(200, 168, 135)
SKIN_DARK = rgba(145, 110, 85)
SKIN_PALE = rgba(235, 210, 190)

EYE_COLOR = rgba(35, 25, 20)
EYE_WHITE = rgba(240, 235, 225)

class CharDef:
    def __init__(self, name, npc_id, skin, robe, accent, hair,
                 size=16, hair_style='short', has_beard=False,
                 accessory=None, is_female=False, is_angry=False,
                 has_horns=False, has_halo=False, has_wings=False,
                 glow_color=None, outline_color=None):
        self.name = name
        self.npc_id = npc_id
        self.skin = skin
        self.robe = robe
        self.accent = accent
        self.hair = hair
        self.size = size
        self.hair_style = hair_style
        self.has_beard = has_beard
        self.accessory = accessory
        self.is_female = is_female
        self.is_angry = is_angry
        self.has_horns = has_horns
        self.has_halo = has_halo
        self.has_wings = has_wings
        self.glow_color = glow_color
        self.outline_color = outline_color or darken(robe, 0.5)

CHARACTERS = [
    # ── Ch01-06: Main characters ──
    CharDef("Christian", "christian",
            SKIN_MEDIUM, rgba(100, 85, 70), rgba(140, 120, 90), rgba(80, 60, 40),
            hair_style='medium', accessory='burden'),
    CharDef("Christian_Free", "christian_free",
            SKIN_MEDIUM, rgba(180, 170, 150), rgba(210, 195, 150), rgba(80, 60, 40),
            hair_style='medium'),
    CharDef("Evangelist", "evangelist",
            SKIN_MEDIUM, rgba(50, 45, 85), rgba(200, 180, 110), rgba(100, 85, 70),
            hair_style='short', has_beard=True, accessory='book'),
    CharDef("Obstinate", "obstinate",
            SKIN_MEDIUM, rgba(140, 55, 45), rgba(180, 75, 50), rgba(65, 45, 30),
            hair_style='spiky', is_angry=True),
    CharDef("Pliable", "pliable",
            SKIN_LIGHT, rgba(90, 140, 90), rgba(115, 165, 100), rgba(130, 105, 65),
            hair_style='medium'),
    CharDef("Help", "help",
            SKIN_MEDIUM, rgba(65, 100, 150), rgba(100, 140, 190), rgba(90, 70, 50),
            hair_style='short', accessory='shield'),
    CharDef("WorldlyWiseman", "worldlywiseman",
            SKIN_LIGHT, rgba(130, 95, 130), rgba(165, 130, 155), rgba(140, 130, 115),
            hair_style='short', has_beard=True),
    CharDef("Goodwill", "goodwill",
            SKIN_MEDIUM, rgba(200, 180, 125), rgba(225, 205, 140), rgba(115, 95, 70),
            hair_style='medium', has_halo=True),
    CharDef("Interpreter", "interpreter",
            SKIN_DARK, rgba(100, 70, 130), rgba(140, 100, 165), rgba(75, 60, 50),
            hair_style='short', has_beard=True, accessory='book'),

    # ── Ch06: Shining Ones ──
    CharDef("ShiningOne1", "shining1",
            SKIN_PALE, rgba(240, 240, 230), rgba(230, 215, 140), rgba(230, 220, 180),
            hair_style='medium', has_halo=True, glow_color=rgba(255, 245, 200, 80)),
    CharDef("ShiningOne2", "shining2",
            SKIN_PALE, rgba(235, 235, 225), rgba(225, 210, 135), rgba(225, 215, 175),
            hair_style='long', has_halo=True, glow_color=rgba(255, 245, 200, 80)),
    CharDef("ShiningOne3", "shining3",
            SKIN_PALE, rgba(230, 230, 220), rgba(220, 205, 130), rgba(220, 210, 170),
            hair_style='short', has_halo=True, glow_color=rgba(255, 245, 200, 80)),

    # ── Ch07: Palace Beautiful ──
    CharDef("Prudence", "prudence",
            SKIN_LIGHT, rgba(140, 115, 165), rgba(180, 155, 205), rgba(80, 55, 45),
            hair_style='long', is_female=True),
    CharDef("Piety", "piety",
            SKIN_MEDIUM, rgba(100, 65, 140), rgba(140, 90, 180), rgba(65, 45, 30),
            hair_style='long', is_female=True),
    CharDef("Charity", "charity",
            SKIN_LIGHT, rgba(165, 65, 65), rgba(205, 90, 90), rgba(90, 50, 40),
            hair_style='long', is_female=True),

    # ── Ch08: Apollyon ──
    CharDef("Apollyon", "apollyon",
            rgba(120, 75, 75), rgba(75, 25, 25), rgba(155, 40, 25), rgba(50, 25, 20),
            size=32, hair_style='spiky', is_angry=True,
            has_horns=True, has_wings=True,
            outline_color=rgba(40, 15, 15)),

    # ── Ch10: Vanity Fair ──
    CharDef("Faithful", "faithful",
            SKIN_DARK, rgba(180, 140, 75), rgba(215, 180, 100), rgba(50, 40, 25),
            hair_style='short'),
    CharDef("Hopeful", "hopeful",
            SKIN_LIGHT, rgba(90, 140, 180), rgba(130, 180, 215), rgba(140, 115, 75),
            hair_style='medium'),
    CharDef("ByEnds", "byends",
            SKIN_LIGHT, rgba(140, 115, 50), rgba(190, 165, 75), rgba(90, 70, 45),
            hair_style='short', has_beard=True, accessory='coins'),
    CharDef("Demas", "demas",
            SKIN_MEDIUM, rgba(170, 150, 60), rgba(210, 195, 90), rgba(100, 80, 50),
            hair_style='medium', glow_color=rgba(255, 220, 100, 50)),

    # ── Ch11: Doubting Castle ──
    CharDef("GiantDespair", "giant_despair",
            rgba(100, 90, 75), rgba(65, 50, 45), rgba(90, 70, 55), rgba(50, 38, 25),
            size=32, hair_style='spiky', is_angry=True,
            outline_color=rgba(30, 20, 15)),
    CharDef("Diffidence", "diffidence",
            rgba(150, 135, 120), rgba(80, 65, 60), rgba(100, 85, 75), rgba(60, 45, 35),
            hair_style='long', is_female=True, is_angry=True),
    CharDef("Shepherd1", "shepherd1",
            SKIN_MEDIUM, rgba(215, 210, 200), rgba(190, 180, 155), rgba(130, 105, 80),
            hair_style='medium', accessory='staff'),
    CharDef("Shepherd2", "shepherd2",
            SKIN_DARK, rgba(210, 205, 195), rgba(185, 175, 150), rgba(55, 45, 30),
            hair_style='short', has_beard=True, accessory='staff'),
    CharDef("Shepherd3", "shepherd3",
            SKIN_LIGHT, rgba(220, 215, 205), rgba(195, 185, 160), rgba(115, 90, 60),
            hair_style='medium', accessory='staff'),
    CharDef("Shepherd4", "shepherd4",
            SKIN_MEDIUM, rgba(205, 200, 190), rgba(180, 170, 145), rgba(80, 65, 45),
            hair_style='short', accessory='staff'),

    # ── Ch12: Final Journey ──
    CharDef("Ignorance", "ignorance",
            SKIN_LIGHT, rgba(155, 140, 115), rgba(180, 165, 130), rgba(155, 130, 90),
            hair_style='medium'),
    CharDef("Flatterer", "flatterer",
            SKIN_PALE, rgba(155, 50, 130), rgba(195, 80, 165), rgba(100, 80, 40),
            hair_style='long'),
    CharDef("Atheist", "atheist",
            SKIN_LIGHT, rgba(70, 70, 75), rgba(100, 100, 105), rgba(130, 120, 100),
            hair_style='short'),
]

# ─── 16x16 Sprite Drawing ───

def draw_char_16(char_def, direction='down', frame=0):
    """Draw a 16x16 character sprite.
    direction: 'down', 'up', 'left', 'right'
    frame: 0=idle, 1=walk1, 2=walk2
    """
    s = 16
    img = Image.new('RGBA', (s, s), CLEAR)
    px = img.load()
    c = char_def
    
    # Walk animation offsets
    walk_offset = 0
    if frame == 1:
        walk_offset = 1
    elif frame == 2:
        walk_offset = -1
    
    is_side = direction in ('left', 'right')
    is_back = direction == 'up'
    flip = direction == 'right'
    
    # ── Outline color for depth ──
    outline = c.outline_color
    
    # ── Draw glow if present ──
    if c.glow_color:
        gc = c.glow_color
        for gy in range(1, 15):
            for gx in range(1, 15):
                dx = gx - 7.5
                dy = gy - 7.5
                dist = math.sqrt(dx*dx + dy*dy)
                if dist < 8:
                    alpha = int(gc[3] * (1.0 - dist/8.0))
                    if alpha > 0:
                        px[gx, s - 1 - gy] = (gc[0], gc[1], gc[2], alpha)
    
    # ── Body (y=2..9, from bottom) ──
    body_top = 9
    body_bot = 2
    body_left = 4
    body_right = 11
    
    if is_side:
        body_left = 5
        body_right = 11
    
    # Outline
    for y in range(body_bot, body_top + 1):
        for x in range(body_left, body_right + 1):
            if y == body_bot or y == body_top or x == body_left or x == body_right:
                set_px(px, s, x, y, outline, flip)
            else:
                set_px(px, s, x, y, c.robe, flip)
    
    # Belt / accent stripe
    for x in range(body_left + 1, body_right):
        set_px(px, s, x, 5, c.accent, flip)
        set_px(px, s, x, 6, darken(c.accent, 0.85), flip)
    
    # Robe shading (left side darker)
    for y in range(body_bot + 1, body_top):
        set_px(px, s, body_left + 1, y, darken(c.robe, 0.8), flip)
    
    # Robe bottom detail
    if frame == 0:
        for x in range(body_left + 1, body_right):
            set_px(px, s, x, body_bot, darken(c.robe, 0.7), flip)
    
    # ── Feet ──
    shoe_color = darken(c.robe, 0.5)
    if frame == 0:
        set_px(px, s, 5, 1, shoe_color, flip)
        set_px(px, s, 6, 1, shoe_color, flip)
        set_px(px, s, 5, 0, darken(shoe_color, 0.8), flip)
        set_px(px, s, 6, 0, darken(shoe_color, 0.8), flip)
        set_px(px, s, 9, 1, shoe_color, flip)
        set_px(px, s, 10, 1, shoe_color, flip)
        set_px(px, s, 9, 0, darken(shoe_color, 0.8), flip)
        set_px(px, s, 10, 0, darken(shoe_color, 0.8), flip)
    elif frame == 1:
        set_px(px, s, 4, 1, shoe_color, flip)
        set_px(px, s, 5, 1, shoe_color, flip)
        set_px(px, s, 4, 0, darken(shoe_color, 0.8), flip)
        set_px(px, s, 5, 0, darken(shoe_color, 0.8), flip)
        set_px(px, s, 10, 1, shoe_color, flip)
        set_px(px, s, 11, 1, shoe_color, flip)
        set_px(px, s, 10, 0, darken(shoe_color, 0.8), flip)
        set_px(px, s, 11, 0, darken(shoe_color, 0.8), flip)
    else:
        set_px(px, s, 6, 1, shoe_color, flip)
        set_px(px, s, 7, 1, shoe_color, flip)
        set_px(px, s, 6, 0, darken(shoe_color, 0.8), flip)
        set_px(px, s, 7, 0, darken(shoe_color, 0.8), flip)
        set_px(px, s, 8, 1, shoe_color, flip)
        set_px(px, s, 9, 1, shoe_color, flip)
        set_px(px, s, 8, 0, darken(shoe_color, 0.8), flip)
        set_px(px, s, 9, 0, darken(shoe_color, 0.8), flip)
    
    # ── Arms ──
    arm_y_base = 5
    if frame == 1:
        # Left arm forward
        set_px(px, s, body_left - 1, arm_y_base + 1, c.robe, flip)
        set_px(px, s, body_left - 1, arm_y_base, darken(c.robe, 0.85), flip)
        set_px(px, s, body_left - 1, arm_y_base - 1, c.skin, flip)
        # Right arm back
        set_px(px, s, body_right + 1, arm_y_base + 2, darken(c.robe, 0.85), flip)
        set_px(px, s, body_right + 1, arm_y_base + 1, c.robe, flip)
        set_px(px, s, body_right + 1, arm_y_base, c.skin, flip)
    elif frame == 2:
        set_px(px, s, body_left - 1, arm_y_base + 2, darken(c.robe, 0.85), flip)
        set_px(px, s, body_left - 1, arm_y_base + 1, c.robe, flip)
        set_px(px, s, body_left - 1, arm_y_base, c.skin, flip)
        set_px(px, s, body_right + 1, arm_y_base + 1, c.robe, flip)
        set_px(px, s, body_right + 1, arm_y_base, darken(c.robe, 0.85), flip)
        set_px(px, s, body_right + 1, arm_y_base - 1, c.skin, flip)
    else:
        for dy in range(3):
            set_px(px, s, body_left - 1, arm_y_base + dy, c.robe if dy < 2 else c.skin, flip)
            set_px(px, s, body_right + 1, arm_y_base + dy, darken(c.robe, 0.9) if dy < 2 else c.skin, flip)
    
    # ── Neck ──
    set_px(px, s, 7, 10, c.skin, flip)
    set_px(px, s, 8, 10, c.skin, flip)
    
    # ── Head ──
    head_left = 5
    head_right = 10
    head_bot = 10
    head_top = 14
    
    # Head outline
    for y in range(head_bot, head_top + 1):
        for x in range(head_left, head_right + 1):
            if y == head_bot and (x == head_left or x == head_right):
                continue  # Rounded corners
            if y == head_top and (x == head_left or x == head_right):
                continue
            if y == head_bot or y == head_top or x == head_left or x == head_right:
                set_px(px, s, x, y, darken(c.skin, 0.7), flip)
            else:
                set_px(px, s, x, y, c.skin, flip)
    
    # Cheek highlight
    set_px(px, s, 9, 12, lighten(c.skin, 1.1), flip)
    
    # ── Face ──
    if not is_back:
        if is_side:
            # Side view: one eye
            set_px(px, s, 8, 12, EYE_WHITE, flip)
            set_px(px, s, 9, 12, EYE_COLOR, flip)
            # Mouth
            if c.is_angry:
                set_px(px, s, 9, 11, rgba(160, 50, 40), flip)
            else:
                set_px(px, s, 8, 11, darken(c.skin, 0.6), flip)
        else:
            # Front view: two eyes
            set_px(px, s, 6, 12, EYE_WHITE, flip)
            set_px(px, s, 7, 12, EYE_COLOR, flip)
            set_px(px, s, 8, 12, EYE_WHITE, flip)
            set_px(px, s, 9, 12, EYE_COLOR, flip)
            # Mouth
            if c.is_angry:
                set_px(px, s, 7, 11, rgba(160, 50, 40), flip)
                set_px(px, s, 8, 11, rgba(160, 50, 40), flip)
            else:
                set_px(px, s, 7, 11, darken(c.skin, 0.65), flip)
                set_px(px, s, 8, 11, darken(c.skin, 0.65), flip)
    
    # ── Hair ──
    draw_hair(px, s, c, is_back, is_side, flip)
    
    # ── Beard ──
    if c.has_beard and not is_back:
        beard_c = darken(c.hair, 0.9)
        set_px(px, s, 6, 10, beard_c, flip)
        set_px(px, s, 7, 10, beard_c, flip)
        set_px(px, s, 8, 10, beard_c, flip)
        set_px(px, s, 9, 10, beard_c, flip)
        set_px(px, s, 7, 9, darken(beard_c, 0.9), flip)
        set_px(px, s, 8, 9, darken(beard_c, 0.9), flip)
    
    # ── Accessories ──
    if c.accessory == 'burden' and not is_back:
        burden_c = rgba(130, 90, 50)
        for by in range(8, 14):
            for bx in range(10, 14):
                if by == 8 and bx == 10:
                    continue
                if by == 13 and bx == 13:
                    continue
                set_px(px, s, bx, by, burden_c if (bx + by) % 3 != 0 else darken(burden_c, 0.8), flip)
        for bx in range(10, 14):
            set_px(px, s, bx, 13, darken(burden_c, 0.6), flip)
    
    if c.accessory == 'book':
        book_c = rgba(130, 90, 45)
        page_c = rgba(220, 200, 160)
        if not is_side:
            set_px(px, s, 12, 5, book_c, flip)
            set_px(px, s, 13, 5, book_c, flip)
            set_px(px, s, 12, 6, book_c, flip)
            set_px(px, s, 13, 6, page_c, flip)
            set_px(px, s, 12, 7, book_c, flip)
            set_px(px, s, 13, 7, book_c, flip)
    
    if c.accessory == 'shield':
        shield_c = rgba(130, 115, 100)
        shield_accent = rgba(100, 140, 190)
        set_px(px, s, 2, 5, shield_c, flip)
        set_px(px, s, 2, 6, shield_c, flip)
        set_px(px, s, 2, 7, shield_c, flip)
        set_px(px, s, 1, 5, shield_c, flip)
        set_px(px, s, 1, 6, shield_accent, flip)
        set_px(px, s, 1, 7, shield_c, flip)
    
    if c.accessory == 'staff':
        staff_c = rgba(140, 110, 65)
        for sy in range(2, 15):
            set_px(px, s, 13, sy, staff_c, flip)
        set_px(px, s, 12, 14, darken(staff_c, 0.8), flip)
        set_px(px, s, 14, 14, darken(staff_c, 0.8), flip)
    
    if c.accessory == 'coins':
        coin_c = rgba(220, 195, 80)
        set_px(px, s, 12, 4, coin_c, flip)
        set_px(px, s, 13, 5, coin_c, flip)
        set_px(px, s, 11, 3, darken(coin_c, 0.8), flip)
    
    # ── Halo ──
    if c.has_halo:
        halo_c = rgba(255, 235, 130, 200)
        halo_dim = rgba(255, 235, 130, 120)
        y_h = 15
        set_px(px, s, 6, y_h, halo_dim, flip)
        set_px(px, s, 7, y_h, halo_c, flip)
        set_px(px, s, 8, y_h, halo_c, flip)
        set_px(px, s, 9, y_h, halo_dim, flip)
    
    # ── Horns ──
    if c.has_horns:
        horn_c = rgba(80, 30, 25)
        horn_tip = rgba(60, 20, 15)
        set_px(px, s, 4, 14, horn_c, flip)
        set_px(px, s, 4, 15, horn_tip, flip)
        set_px(px, s, 11, 14, horn_c, flip)
        set_px(px, s, 11, 15, horn_tip, flip)
    
    return img


def draw_hair(px, s, c, is_back, is_side, flip):
    hair = c.hair
    dark_hair = darken(hair, 0.7)
    
    if c.hair_style == 'short':
        # Top of head
        for x in range(5, 11):
            set_px(px, s, x, 14, hair, flip)
            set_px(px, s, x, 15, dark_hair if x in (5, 10) else hair, flip)
        # Sides
        set_px(px, s, 4, 13, dark_hair, flip)
        set_px(px, s, 11, 13, dark_hair, flip)
        if is_back:
            for x in range(5, 11):
                set_px(px, s, x, 13, hair, flip)
                
    elif c.hair_style == 'medium':
        for x in range(5, 11):
            set_px(px, s, x, 14, hair, flip)
            set_px(px, s, x, 15, hair, flip)
        set_px(px, s, 4, 13, hair, flip)
        set_px(px, s, 4, 12, dark_hair, flip)
        set_px(px, s, 11, 13, hair, flip)
        set_px(px, s, 11, 12, dark_hair, flip)
        if is_back:
            for x in range(5, 11):
                for y in range(11, 14):
                    set_px(px, s, x, y, hair if y > 11 else dark_hair, flip)
                    
    elif c.hair_style == 'long':
        for x in range(5, 11):
            set_px(px, s, x, 14, hair, flip)
            set_px(px, s, x, 15, hair, flip)
        set_px(px, s, 4, 13, hair, flip)
        set_px(px, s, 4, 12, hair, flip)
        set_px(px, s, 4, 11, dark_hair, flip)
        set_px(px, s, 11, 13, hair, flip)
        set_px(px, s, 11, 12, hair, flip)
        set_px(px, s, 11, 11, dark_hair, flip)
        # Long hair falls down sides
        if c.is_female:
            set_px(px, s, 3, 10, dark_hair, flip)
            set_px(px, s, 3, 9, dark_hair, flip)
            set_px(px, s, 12, 10, dark_hair, flip)
            set_px(px, s, 12, 9, dark_hair, flip)
        if is_back:
            for x in range(5, 11):
                for y in range(10, 14):
                    set_px(px, s, x, y, hair if y > 11 else dark_hair, flip)
                    
    elif c.hair_style == 'spiky':
        for x in range(5, 11):
            set_px(px, s, x, 14, hair, flip)
        # Spiky top
        set_px(px, s, 5, 15, hair, flip)
        set_px(px, s, 7, 15, hair, flip)
        set_px(px, s, 9, 15, hair, flip)
        set_px(px, s, 4, 14, dark_hair, flip)
        set_px(px, s, 11, 14, dark_hair, flip)


def draw_char_32(char_def, direction='down', frame=0):
    """Draw a 32x32 character (bosses/large characters) by scaling up 16x16 with extra detail."""
    img_16 = draw_char_16(char_def, direction, frame)
    img_32 = img_16.resize((32, 32), Image.NEAREST)
    px = img_32.load()
    
    # Add extra detail at 32x32 scale
    if char_def.has_wings:
        wing_c = rgba(100, 35, 30, 200)
        wing_edge = rgba(60, 20, 15, 180)
        # Left wing
        for wy in range(10, 26):
            wx = max(0, 2 - (wy - 18) // 3)
            set_px_32(px, 32, wx, wy, wing_c)
            set_px_32(px, 32, wx + 1, wy, wing_edge)
        # Right wing
        for wy in range(10, 26):
            wx = min(31, 29 + (wy - 18) // 3)
            set_px_32(px, 32, wx, wy, wing_c)
            set_px_32(px, 32, wx - 1, wy, wing_edge)
    
    return img_32


def set_px(pixels, size, x, y, color, flip=False):
    if flip:
        x = size - 1 - x
    if 0 <= x < size and 0 <= y < size:
        iy = size - 1 - y  # Convert from math coords (y-up) to image coords (y-down)
        existing = pixels[x, iy]
        if len(color) > 3 and color[3] < 255 and existing[3] > 0:
            # Alpha blend
            a = color[3] / 255.0
            blended = tuple(int(color[i] * a + existing[i] * (1 - a)) for i in range(3))
            pixels[x, iy] = blended + (min(255, existing[3] + color[3]),)
        else:
            pixels[x, iy] = color[:4] if len(color) >= 4 else color + (255,)


def set_px_32(pixels, size, x, y, color):
    if 0 <= x < size and 0 <= y < size:
        pixels[x, y] = color[:4] if len(color) >= 4 else color + (255,)


# ─── Sprite Sheet Generation ───

def generate_sprite_sheet(char_def):
    """Generate a sprite sheet: 4 directions × 3 frames = 12 sprites.
    Layout: each row is a direction (down, left, right, up), each column is a frame.
    """
    s = char_def.size
    cols = 3  # idle, walk1, walk2
    rows = 4  # down, left, right, up
    sheet = Image.new('RGBA', (s * cols, s * rows), CLEAR)
    
    directions = ['down', 'left', 'right', 'up']
    draw_fn = draw_char_32 if s == 32 else draw_char_16
    
    for row, direction in enumerate(directions):
        for col in range(cols):
            frame = col
            sprite = draw_fn(char_def, direction, frame)
            sheet.paste(sprite, (col * s, row * s))
    
    return sheet


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"Generating sprites to: {OUTPUT_DIR}")
    print(f"Characters to generate: {len(CHARACTERS)}")
    print()
    
    for char_def in CHARACTERS:
        sheet = generate_sprite_sheet(char_def)
        filename = f"{char_def.npc_id}_spritesheet.png"
        filepath = os.path.join(OUTPUT_DIR, filename)
        sheet.save(filepath)
        
        size_label = f"{char_def.size}x{char_def.size}"
        sheet_size = f"{sheet.width}x{sheet.height}"
        print(f"  [{size_label}] {char_def.name:20s} -> {filename} ({sheet_size})")
    
    # Also generate individual preview images
    preview_dir = os.path.join(OUTPUT_DIR, 'previews')
    os.makedirs(preview_dir, exist_ok=True)
    
    for char_def in CHARACTERS:
        draw_fn = draw_char_32 if char_def.size == 32 else draw_char_16
        preview = draw_fn(char_def, 'down', 0)
        # Scale up 8x for preview visibility
        scale = 8
        preview_big = preview.resize((char_def.size * scale, char_def.size * scale), Image.NEAREST)
        preview_big.save(os.path.join(preview_dir, f"{char_def.npc_id}_preview.png"))
    
    print(f"\nDone! Generated {len(CHARACTERS)} sprite sheets + previews.")
    print(f"Sprite sheets: {OUTPUT_DIR}/")
    print(f"Previews (8x): {OUTPUT_DIR}/previews/")


if __name__ == '__main__':
    main()
