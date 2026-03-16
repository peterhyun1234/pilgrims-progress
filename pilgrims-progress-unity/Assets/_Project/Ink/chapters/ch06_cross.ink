// === Chapter 06: The Cross (MVP Climax) ===

=== ch06_opening ===
~ chapter = 6
# LOCATION: path_to_cross
# BGM: cross_approach

# SPEAKER:
{lang == "ko":
    크리스천은 해석자의 집을 떠나 십자가가 있는 언덕을 향해 걸었다.
- else:
    Christian left the Interpreter's House and walked toward the hill where the Cross stood.
}

# SPEAKER:
{lang == "ko":
    등에 짐이 여전히 무거웠으나, 그의 걸음은 확고하였다.
- else:
    The burden upon his back was still heavy, yet his steps were sure.
}

-> ch06_ascent

=== ch06_ascent ===
# LOCATION: hill_of_cross
# BGM: ascent_sacred

# SPEAKER:
{lang == "ko":
    언덕이 다가왔다. 그 위에 십자가가 서 있었다.
- else:
    The hill drew near. Upon it stood the Cross.
}

# SPEAKER: Christian
# EMOTION: awestruck
{lang == "ko":
    "저기... 저기가 해방의 장소로다."
- else:
    "There... there is the place of deliverance."
}

# TRANSITION: fade_white
# WAIT: 1.0

{lang == "ko":
    크리스천은 짐을 지고 언덕을 오르기 시작하였다.
- else:
    Christian began to climb the hill, burden upon his back.
}

# SFX: footsteps_climb
# BGM: cross_theme

-> ch06_cross_scene

=== ch06_cross_scene ===
# LOCATION: cross_hilltop
# BGM: cross_reverence
# CG: cross_reveal

{lang == "ko":
    그는 십자가 아래에 이르렀다. 빛이 그곳을 비추고 있었다.
- else:
    He came to the foot of the Cross. A light shone upon that place.
}

# SPEAKER: Christian
# EMOTION: overwhelmed
{lang == "ko":
    "주여..."
- else:
    "Lord..."
}

# WAIT: 2.0

-> ch06_burden_falls

=== ch06_burden_falls ===
# SHAKE: heavy
# SFX: burden_roll
# TRANSITION: flash_white

{lang == "ko":
    그 순간, 등에 지운 짐이 풀어지며 그의 등에서 굴러 떨어졌다.
- else:
    In that moment, the burden upon his back loosed itself and rolled from his shoulders.
}

# SFX: burden_tumble
# WAIT: 1.5

{lang == "ko":
    짐은 굴러가 빈 무덤 속으로 떨어져 들어갔다. 다시는 보이지 않았다.
- else:
    It rolled and fell into the empty sepulchre. It was seen no more.
}

# SHAKE: medium
# WAIT: 2.0

~ burden = 0
# STAT: burden 0

# SPEAKER: Christian
# EMOTION: joyful
{lang == "ko":
    "벗었나이다! 벗었나이다! 주께서 나의 짐을 벗기셨나이다!"
- else:
    "It is gone! It is gone! He has taken my burden from me!"
}

# SFX: joy_cry
# WAIT: 1.5

-> ch06_three_shining_ones

=== ch06_three_shining_ones ===
# BGM: shining_ones
# CG: three_shining_ones

{lang == "ko":
    그때 세 분의 빛나는 자들이 그에게로 다가왔다.
- else:
    Then three Shining Ones drew near to him.
}

# TRANSITION: fade_white
# WAIT: 1.0

# SPEAKER: First Shining One
# EMOTION: glorious
{lang == "ko":
    첫째가 말하였다. "네 죄가 용서받았다." (마가복음 2:5, 새번역)
- else:
    The first said, "Your sins are forgiven." (Mark 2:5, NIV)
}

# SFX: garment_change

{lang == "ko":
    그가 크리스천에게 새 옷을 입혔다.
- else:
    He clothed Christian in raiment new.
}

# SPEAKER: Second Shining One
# EMOTION: glorious
{lang == "ko":
    둘째가 그의 이마에 표를 새기며 말하였다. "이제 너는 그분의 것이다."
- else:
    The second set a mark upon his forehead and said, "You are now His."
}

# SPEAKER: Third Shining One
# EMOTION: glorious
{lang == "ko":
    셋째가 봉인된 두루마리를 주며 말하였다. "이것을 읽고 천성에 이르라."
- else:
    The third gave him a sealed roll and said, "Read this as you journey to the Celestial City."
}

~ faith += 20
~ courage += 10
~ wisdom += 10
# STAT: faith +20
# STAT: courage +10
# STAT: wisdom +10

~ bible_card_john_3_16 = true
# BIBLE_CARD: john_3_16

# WAIT: 2.0

-> ch06_end

=== ch06_end ===
# BGM: triumph_theme
# TRANSITION: fade_white
# CG: christian_transformed

# SPEAKER:
{lang == "ko":
    크리스천은 새 옷을 입고, 이마에 표를 받고, 두루마리를 품에 넣었다.
- else:
    Christian stood clothed in new raiment, marked upon his brow, the roll held close.
}

# SPEAKER: Christian
# EMOTION: joyful
{lang == "ko":
    "하나님이 세상을 이처럼 사랑하셔서, 외아들을 주셨으니..." (요한복음 3:16, 새번역)
- else:
    "For God so loved the world that he gave his one and only Son..." (John 3:16, NIV)
}

# WAIT: 2.0

# TRANSITION: fade_black

{lang == "ko":
    [ 제6장 끝 — 십자가 ]
- else:
    [ End of Chapter 6 — The Cross ]
}

{lang == "ko":
    [ MVP 클라이맥스 ]
- else:
    [ MVP Climax ]
}

-> epilogue_start
