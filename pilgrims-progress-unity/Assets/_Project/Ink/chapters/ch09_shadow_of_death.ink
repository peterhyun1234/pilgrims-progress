// === Chapter 09: Valley of the Shadow of Death ===

=== ch09_opening ===
~ chapter = 9
# LOCATION: shadow_valley_entrance
# BGM: ch09_shadow

# SPEAKER:
{lang == "ko":
    {player_name}은 사망의 음침한 골짜기에 들어섰다. 사방이 칠흑같이 어두웠다.
- else:
    {player_name} entered the Valley of the Shadow of Death. Darkness surrounded on every side.
}

# SPEAKER:
{lang == "ko":
    길의 오른쪽에는 깊은 구렁텅이가, 왼쪽에는 위험한 늪이 있었다. 길은 극도로 좁았다.
- else:
    On the right was a deep ditch; on the left, a dangerous quagmire. The path was extremely narrow.
}

-> ch09_darkness

=== ch09_darkness ===
# LOCATION: shadow_valley_deep

# SPEAKER:
{lang == "ko":
    어둠 속에서 소리가 들려왔다. 악마의 속삭임이었다.
- else:
    Voices came from the darkness — whispers of demons.
}

# SPEAKER: Whisper
# EMOTION: sinister
{lang == "ko":
    "돌아가라... 앞에는 죽음뿐이다... 네 하나님은 너를 버렸다..."
- else:
    "Turn back... only death lies ahead... your God has abandoned you..."
}

* {lang == "ko": [기도한다] "내가 사망의 음침한 골짜기로 다닐지라도..." -> ch09_pray} {lang != "ko": [Pray] "Even though I walk through the valley of the shadow of death..." -> ch09_pray}
* {lang == "ko": [묵묵히 앞으로 걷는다] -> ch09_walk_silent} {lang != "ko": [Walk forward in silence] -> ch09_walk_silent}

=== ch09_pray ===
~ faith += 10
# STAT: faith +10

# SPEAKER: Christian
{lang == "ko":
    "내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라." (시편 23:4, 새번역)
- else:
    "Even though I walk through the darkest valley, I will fear no evil, for you are with me." (Psalm 23:4, NIV)
}

~ bible_card_psalm_23_4 = true
# BIBLE_CARD: psalm_23_4

# SPEAKER:
{lang == "ko":
    기도의 말이 어둠을 뚫었다. 속삭임이 잠시 멈추었다.
- else:
    The prayer pierced the darkness. The whispers paused.
}

-> ch09_flames

=== ch09_walk_silent ===
~ courage += 8
# STAT: courage +8

# SPEAKER:
{lang == "ko":
    {player_name}은 이를 악물고 걸었다. 한 발, 또 한 발.
- else:
    {player_name} clenched teeth and walked. One step, then another.
}

-> ch09_flames

=== ch09_flames ===
# LOCATION: shadow_valley_fire
# SFX: flames_crackling

# SPEAKER:
{lang == "ko":
    골짜기 한가운데에서 불꽃이 치솟았다. 유황 냄새가 코를 찔렀다.
- else:
    In the midst of the valley, flames shot up. The stench of brimstone filled the air.
}

# SPEAKER:
{lang == "ko":
    길은 불꽃 사이를 지나야 했다. 한 치의 오차도 허용되지 않았다.
- else:
    The path led between the flames. Not a single misstep was allowed.
}

* {lang == "ko": [조심스럽게 불꽃 사이를 지나간다] -> ch09_through_flames} {lang != "ko": [Carefully pass through the flames] -> ch09_through_flames}

=== ch09_through_flames ===
~ courage += 10
~ faith += 5
# STAT: courage +10
# STAT: faith +5

# SPEAKER:
{lang == "ko":
    머리카락이 그을리고 옷이 탔으나, {player_name}은 통과하였다.
- else:
    Hair was singed and clothes burned, but {player_name} made it through.
}

-> ch09_dawn

=== ch09_dawn ===
# BGM: ch09_dawn
# TRANSITION: fade_white

# SPEAKER:
{lang == "ko":
    마침내 동이 텄다. 아침 해가 골짜기 끝을 비추었다.
- else:
    At last, dawn broke. Morning light illuminated the end of the valley.
}

# SPEAKER:
{lang == "ko":
    {player_name}은 뒤를 돌아보았다. 지나온 길이 얼마나 좁고 위험했는지, 빛 아래서야 보였다.
- else:
    {player_name} looked back. Only in the light could the narrowness and danger of the path be seen.
}

# SPEAKER: Christian
# EMOTION: grateful
{lang == "ko":
    "주님, 그 어둠 속에서도 함께 하셨군요."
- else:
    "Lord, You were with me even in that darkness."
}

~ faith += 5
# STAT: faith +5

-> ch09_end

=== ch09_end ===
# TRANSITION: fade_black

{lang == "ko":
    [ 제9장 끝 — 사망의 음침한 골짜기 ]
- else:
    [ End of Chapter 9 — Valley of the Shadow of Death ]
}

-> ch10_opening
