// === Chapter 11: Doubting Castle & Delectable Mountains ===

=== ch11_opening ===
~ chapter = 11
# LOCATION: bypath_meadow
# BGM: ch11_meadow

# SPEAKER:
{lang == "ko":
    길이 험해지자, 옆에 부드러운 초원이 보였다. 샛길 초원이었다.
- else:
    As the road grew rough, a soft meadow appeared alongside — By-path Meadow.
}

# SPEAKER: Hopeful
{lang == "ko":
    "저 초원으로 가면 편하지 않겠습니까? 길과 나란히 가니 문제없을 것입니다."
- else:
    "Would it not be easier to walk through that meadow? It runs alongside the path."
}

+ {wisdom >= 60} {lang == "ko"} [거절한다] "아니오, 길을 벗어나면 안 됩니다."
    -> ch11_refuse_bypath
+ {wisdom >= 60} {lang != "ko"} [Refuse] "No, we must not leave the path."
    -> ch11_refuse_bypath
+ {lang == "ko"} [초원으로 간다] "그래, 잠깐이면 괜찮겠지."
    -> ch11_take_bypath
+ {lang != "ko"} [Go to the meadow] "Sure, just for a bit."
    -> ch11_take_bypath

=== ch11_refuse_bypath ===
~ wisdom += 10
# STAT: wisdom +10

# SPEAKER:
{lang == "ko":
    {player_name}은 험한 길을 계속 걸었다. 지혜로운 선택이었다.
- else:
    {player_name} continued on the hard road. It was the wise choice.
}

-> ch11_delectable_mountains

=== ch11_take_bypath ===
~ wisdom -= 10
~ courage -= 5
# STAT: wisdom -10
# STAT: courage -5

# SPEAKER:
{lang == "ko":
    처음에는 편했으나, 곧 폭풍이 몰아치고 밤이 되었다. 길을 완전히 잃었다.
- else:
    At first it was easy, but soon a storm came and night fell. The way was completely lost.
}

-> ch11_captured

=== ch11_captured ===
# LOCATION: doubting_castle
# BGM: ch11_castle

# SPEAKER:
{lang == "ko":
    아침이 되자, 거인 절망(Giant Despair)이 나타났다. 그의 성 — 의심의 성이 앞에 있었다.
- else:
    At morning, Giant Despair appeared. His castle — Doubting Castle — loomed ahead.
}

# SPEAKER: Giant Despair
# EMOTION: menacing
{lang == "ko":
    "내 땅에 무단침입한 자들이로다! 감옥에 가두어라!"
- else:
    "Trespassers on my grounds! Throw them in the dungeon!"
}

# SPEAKER:
{lang == "ko":
    {player_name}과 소망은 어둡고 축축한 감옥에 갇혔다. 수요일부터 토요일까지 굶주리며 매를 맞았다.
- else:
    {player_name} and Hopeful were locked in a dark, damp dungeon. From Wednesday to Saturday they starved and were beaten.
}

-> ch11_despair_temptation

=== ch11_despair_temptation ===
# SPEAKER: Giant Despair
# EMOTION: cruel
{lang == "ko":
    "너희에게는 희망이 없다. 차라리 스스로 목숨을 끊는 것이 나으리라."
- else:
    "There is no hope for you. It would be better to end your own lives."
}

+ {lang == "ko"} [거부한다] "아니오. 자살은 죄입니다."
    -> ch11_refuse_suicide
+ {lang != "ko"} [Refuse] "No. Self-murder is a sin."
    -> ch11_refuse_suicide

=== ch11_refuse_suicide ===
~ faith += 10
~ courage += 10
# STAT: faith +10
# STAT: courage +10

# SPEAKER: Hopeful
# EMOTION: encouraging
{lang == "ko":
    "형제여, 인내합시다. 우리를 건지실 분이 계십니다."
- else:
    "Brother, let us endure. There is One who can deliver us."
}

-> ch11_promise_key

=== ch11_promise_key ===
# BGM: ch11_key

# SPEAKER: Christian
# EMOTION: realization
{lang == "ko":
    토요일 밤, {player_name}이 소리쳤다. "내가 얼마나 어리석었는가! 내 품에 약속이라는 열쇠가 있었는데!"
- else:
    Saturday night, {player_name} cried out: "What a fool I have been! I have a key in my bosom called Promise!"
}

# SPEAKER: Hopeful
# EMOTION: hopeful
{lang == "ko":
    "어서 꺼내시오!"
- else:
    "Take it out at once!"
}

~ has_promise_key = true

# SPEAKER:
{lang == "ko":
    "나는 결코 너를 버리지 않고, 결코 너를 떠나지 않겠다." (히브리서 13:5, 새번역)
- else:
    "Never will I leave you; never will I forsake you." (Hebrews 13:5, NIV)
}

~ bible_card_heb_13_5 = true
# BIBLE_CARD: heb_13_5

# SFX: key_unlock

# SPEAKER:
{lang == "ko":
    약속의 열쇠로 감옥 문이 열렸다. 성 문도, 철문도 열렸다. 두 순례자는 탈출하였다!
- else:
    The key of Promise opened the dungeon door. The castle gate opened too. The pilgrims escaped!
}

~ faith += 15
~ wisdom += 15
# STAT: faith +15
# STAT: wisdom +15

# SHAKE: medium

-> ch11_delectable_mountains

=== ch11_delectable_mountains ===
# LOCATION: delectable_mountains
# BGM: ch11_mountains

# SPEAKER:
{lang == "ko":
    기쁨의 산에 이르렀다. 네 명의 목자 — 지식, 경험, 파수, 진실이 맞이해 주었다.
- else:
    They reached the Delectable Mountains. Four shepherds — Knowledge, Experience, Watchful, and Sincere — welcomed them.
}

# SPEAKER: Knowledge
{lang == "ko":
    "순례자들이여, 이 산 꼭대기에서 천성의 문을 볼 수 있다오."
- else:
    "Pilgrims, from this mountaintop you can see the gate of the Celestial City."
}

# SPEAKER: Watchful
{lang == "ko":
    "하지만 조심하시오. 아직 남은 길에 위험이 도사리고 있소."
- else:
    "But be careful. Dangers still lurk on the road ahead."
}

# SPEAKER: Sincere
{lang == "ko":
    "아첨꾼을 조심하시오. 그리고 마법의 땅에서 잠들지 마시오."
- else:
    "Beware the Flatterer. And do not fall asleep in the Enchanted Ground."
}

~ wisdom += 8
# STAT: wisdom +8

-> ch11_end

=== ch11_end ===
# TRANSITION: fade_black

{lang == "ko":
    [ 제11장 끝 — 의심의 성과 기쁨의 산 ]
- else:
    [ End of Chapter 11 — Doubting Castle & Delectable Mountains ]
}

-> ch12_opening

// ── NPC Interaction Knots (standalone) ──

=== ch11_giant_despair ===
# SPEAKER: Giant Despair
# EMOTION: threatening
{lang == "ko":
    누가 감히 내 땅에 들어왔느냐! 나는 절망의 거인이다!
- else:
    Who dares trespass on my grounds! I am Giant Despair!
}
# SHAKE: strong
# SPEAKER: Christian
# EMOTION: scared
{lang == "ko":
    이건 우리의 실수입니다... 정해진 길을 벗어났기 때문에...
- else:
    This was our mistake... we strayed from the appointed path...
}
# SPEAKER: Giant Despair
# EMOTION: cruel
{lang == "ko":
    어리석은 것들! 내 감옥에 던져 넣겠다. 희망 따위는 버려라!
- else:
    Foolish wretches! I'll cast you into my dungeon. Abandon all hope!
}
+ {lang == "ko"} 소망이여, 약속의 열쇠를 기억하시오!
    # SPEAKER: Christian
    # EMOTION: hopeful
    {lang == "ko":
        내 가슴에... '약속'이라는 열쇠가 있소! 이 열쇠로 어떤 자물쇠든 열 수 있다 했소!
    - else:
        In my breast... there is a key called Promise! It was said this key can open any lock!
    }
    # STAT: faith +6
    # STAT: courage +5
    -> DONE
+ {lang != "ko"} Hopeful, remember the key of Promise!
    # SPEAKER: Christian
    # EMOTION: hopeful
    In my breast... there is a key called Promise! It was said this key can open any lock!
    # STAT: faith +6
    # STAT: courage +5
    -> DONE

=== ch11_shepherds ===
# SPEAKER: Shepherd
# EMOTION: welcoming
{lang == "ko":
    기쁨의 산에 온 것을 환영하오, 순례자들이여! 우리는 임마누엘 땅의 목자들이라오.
- else:
    Welcome to the Delectable Mountains, pilgrims! We are the shepherds of Immanuel's Land.
}
# SPEAKER: Christian
# EMOTION: relieved
{lang == "ko":
    의심의 성에서 간신히 벗어났습니다. 여기는 정말 평화로운 곳이군요.
- else:
    We barely escaped from Doubting Castle. This place is truly peaceful.
}
# SPEAKER: Shepherd
# EMOTION: wise
{lang == "ko":
    여기서 네 가지를 보여주리다. 오류의 산, 경고의 산, 그리고 저 멀리... 천상의 도시가 보이는 전망을.
- else:
    We will show you four things. The Hill of Error, the Mountain of Caution, and far away... a view of the Celestial City itself.
}
# STAT: wisdom +5
# STAT: faith +4
{lang == "ko":
    저 빛나는 문을 보시오. 너희의 목적지가 바로 저곳이라오.
- else:
    See that shining gate. Your destination lies there.
}
-> DONE
