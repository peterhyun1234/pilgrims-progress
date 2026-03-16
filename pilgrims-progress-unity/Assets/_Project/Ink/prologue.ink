// === Prologue: I Dreamed a Dream ===

=== prologue ===
# TRANSITION: fade_black
# BGM: title_theme
# WAIT: 1.5

{lang == "ko":
    나는 꿈을 꾸었노라...
- else:
    I dreamed a dream...
}
# WAIT: 2.0

{lang == "ko":
    이 세상이라는 광야를 걸어가던 중,
- else:
    As I walked through the wilderness of this world,
}
# WAIT: 1.5

{lang == "ko":
    어느 굴 앞에 이르러 잠이 들었고, 꿈을 꾸었다.
- else:
    I lighted on a certain place where was a Den, and I laid me down to sleep.
}
# WAIT: 2.0

# TRANSITION: fade_white
# LOCATION: city_of_destruction
# BGM: city_despair

{lang == "ko":
    꿈속에서 나는 한 사람을 보았다.
- else:
    And as I slept, I dreamed a dream. I saw a man...
}
# WAIT: 1.0

# SPEAKER: Christian
# EMOTION: worried
{lang == "ko":
    누더기 옷을 입은 그는 자기 집을 등지고 서 있었다.
- else:
    Clothed in rags, standing with his face from his own house.
}

{lang == "ko":
    그의 손에는 책 한 권이 들려 있었고, 등에는 커다란 짐이 지워져 있었다.
- else:
    A book in his hand, and a great burden upon his back.
}
# WAIT: 1.0

-> ch01_opening
