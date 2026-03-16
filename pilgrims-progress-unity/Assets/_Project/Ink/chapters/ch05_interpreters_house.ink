// === Chapter 05: Interpreter's House ===

=== ch05_opening ===
~ chapter = 5
# LOCATION: interpreters_house_exterior
# BGM: house_peaceful

# SPEAKER:
{lang == "ko":
    크리스천은 해석자의 집에 이르렀다. 그 집은 고요하고 따뜻한 빛으로 가득하였다.
- else:
    Christian came to the Interpreter's House. It was filled with a quiet, warm light.
}

-> ch05_arrival

=== ch05_arrival ===
# LOCATION: interpreters_house
# BGM: interpreter_theme

# SPEAKER: Interpreter
# EMOTION: welcoming
{lang == "ko":
    해석자가 그를 맞이하였다.
- else:
    The Interpreter welcomed him.
}

# SPEAKER: Interpreter
# EMOTION: kind
{lang == "ko":
    "들어오라. 내가 네게 보여줄 것들이 있다."
- else:
    "Come in. I have things to show you."
}

# SPEAKER: Christian
# EMOTION: curious
{lang == "ko":
    "무엇을 보여 주시겠습니까?"
- else:
    "What will you show me?"
}

# SPEAKER: Interpreter
# EMOTION: solemn
{lang == "ko":
    "네가 앞으로 갈 길에 필요한 것들이다."
- else:
    "Things you will need for the way ahead."
}

-> ch05_portrait_room

=== ch05_portrait_room ===
# LOCATION: room_portrait
# BGM: room_contemplation

# SPEAKER: Interpreter
# EMOTION: reverent
{lang == "ko":
    해석자는 그를 한 방으로 데려갔다. 벽에는 한 사람의 초상화가 걸려 있었다.
- else:
    The Interpreter led him to a room. Upon the wall hung the portrait of a man.
}

# SPEAKER: Interpreter
# EMOTION: solemn
{lang == "ko":
    "이 사람은 참된 목자다. 그의 눈은 하늘을 향하고, 그의 손에는 진리의 책이 있으며, 그의 입에는 정의가 새겨져 있다."
- else:
    "This man is the true pastor. His eyes are lifted to heaven, the book of truth is in his hand, and the law of truth is written upon his lips."
}

# SPEAKER: Interpreter
# EMOTION: earnest
{lang == "ko":
    "그는 영혼을 구원하기 위해 자기 생명을 내어놓는 사람이다."
- else:
    "He gives his life for the salvation of souls."
}

+ {lang == "ko"} ["의미를 깊이 묵상하다." (wisdom+5)]
    ~ wisdom += 5
    # STAT: wisdom +5
    -> ch05_portrait_reflect
+ {lang == "ko"} ["빨리 다음으로 가다." (courage+3)]
    ~ courage += 3
    # STAT: courage +3
    -> ch05_portrait_quick
+ {lang != "ko"} ["Reflect deeply on the meaning." (wisdom+5)]
    ~ wisdom += 5
    # STAT: wisdom +5
    -> ch05_portrait_reflect
+ {lang != "ko"} ["Press on quickly." (courage+3)]
    ~ courage += 3
    # STAT: courage +3
    -> ch05_portrait_quick

=== ch05_portrait_reflect ===
# SPEAKER: Christian
# EMOTION: contemplative
{lang == "ko":
    크리스천은 초상화 앞에 잠시 머물며 그 의미를 마음에 새겼다.
- else:
    Christian tarried before the portrait, imprinting its meaning upon his heart.
}

# SPEAKER: Christian
# EMOTION: humble
{lang == "ko":
    "참된 목자를 따르는 자가 되겠나이다."
- else:
    "I would be one who follows the true Shepherd."
}

-> ch05_patience_passion

=== ch05_portrait_quick ===
# SPEAKER: Christian
# EMOTION: determined
{lang == "ko":
    "알겠습니다. 다음은 무엇입니까?"
- else:
    "I understand. What is next?"
}

-> ch05_patience_passion

=== ch05_patience_passion ===
# LOCATION: room_patience_passion
# BGM: room_contrast

# SPEAKER: Interpreter
# EMOTION: solemn
{lang == "ko":
    해석자는 그를 또 다른 방으로 데려갔다. 그 방에는 두 사람이 있었다.
- else:
    The Interpreter led him to another room. In it were two men.
}

# SPEAKER: Interpreter
# EMOTION: instructive
{lang == "ko":
    "한 사람은 인내라 하고, 다른 사람은 정욕이라 한다. 인내는 기다리며 면류관을 받을 것이다. 정욕은 서두르다가 모든 것을 잃을 것이다."
- else:
    "One is called Patience, the other Passion. Patience shall wait and receive a crown. Passion hastens and shall lose all."
}

# SPEAKER: Interpreter
# EMOTION: grave
{lang == "ko":
    "세상의 모든 것은 지나간다. 오직 끝까지 인내하는 사람만이 구원받는다."
- else:
    "All things of this world pass away. Only the one who endures to the end will be saved."
}

+ {lang == "ko"} ["의미를 깊이 묵상하다." (wisdom+5)]
    ~ wisdom += 5
    # STAT: wisdom +5
    -> ch05_patience_reflect
+ {lang == "ko"} ["빨리 다음으로 가다." (courage+3)]
    ~ courage += 3
    # STAT: courage +3
    -> ch05_patience_quick
+ {lang != "ko"} ["Reflect deeply on the meaning." (wisdom+5)]
    ~ wisdom += 5
    # STAT: wisdom +5
    -> ch05_patience_reflect
+ {lang != "ko"} ["Press on quickly." (courage+3)]
    ~ courage += 3
    # STAT: courage +3
    -> ch05_patience_quick

=== ch05_patience_reflect ===
# SPEAKER: Christian
# EMOTION: thoughtful
{lang == "ko":
    "인내... 나는 너무 많이 서두르고 있었나이다."
- else:
    "Patience... I have been too hasty."
}

-> ch05_fire_room

=== ch05_patience_quick ===
# SPEAKER: Christian
# EMOTION: attentive
{lang == "ko":
    "기억하겠습니다."
- else:
    "I shall remember."
}

-> ch05_fire_room

=== ch05_fire_room ===
# LOCATION: room_fire
# BGM: room_fire
# SFX: fire_crackle

# SPEAKER: Interpreter
# EMOTION: solemn
{lang == "ko":
    마지막으로 해석자는 그를 불이 타오르는 방으로 데려갔다.
- else:
    At last the Interpreter led him to a room where a fire burned.
}

# SPEAKER: Interpreter
# EMOTION: reverent
{lang == "ko":
    "벽난로 옆에 한 사람이 서 있다. 그는 은혜의 물을 부어 불을 끄려는 자의 시도를 막고 있다."
- else:
    "Beside the fire stands one who pours water of grace, resisting those who would quench it."
}

# SPEAKER: Interpreter
# EMOTION: grave
{lang == "ko":
    "사탄은 네 믿음의 불을 끄려 할 것이다. 그러나 그리스도의 은혜가 그것을 지킨다."
- else:
    "Satan would quench the fire of your faith, but the grace of Christ will preserve it."
}

# SFX: water_pour

+ {lang == "ko"} ["의미를 깊이 묵상하다." (wisdom+5)]
    ~ wisdom += 5
    # STAT: wisdom +5
    -> ch05_fire_reflect
+ {lang == "ko"} ["빨리 다음으로 가다." (courage+3)]
    ~ courage += 3
    # STAT: courage +3
    -> ch05_fire_quick
+ {lang != "ko"} ["Reflect deeply on the meaning." (wisdom+5)]
    ~ wisdom += 5
    # STAT: wisdom +5
    -> ch05_fire_reflect
+ {lang != "ko"} ["Press on quickly." (courage+3)]
    ~ courage += 3
    # STAT: courage +3
    -> ch05_fire_quick

=== ch05_fire_reflect ===
# SPEAKER: Christian
# EMOTION: moved
{lang == "ko":
    "은혜가 없으면 저의 믿음은 꺼지고 말았을 것이옵니다."
- else:
    "Without grace, my faith would have been quenched."
}

-> ch05_departure

=== ch05_fire_quick ===
# SPEAKER: Christian
# EMOTION: grateful
{lang == "ko":
    "은혜를 기억하겠나이다."
- else:
    "I shall remember the grace."
}

-> ch05_departure

=== ch05_departure ===
# LOCATION: interpreters_house_exterior
# BGM: path_hope

# SPEAKER: Interpreter
# EMOTION: encouraging
{lang == "ko":
    "이제 가라. 네가 본 것을 마음에 품고, 십자가가 있는 언덕을 향해 나아가라."
- else:
    "Now go. Keep what you have seen in your heart, and press toward the hill where the Cross stands."
}

# SPEAKER: Christian
# EMOTION: determined
{lang == "ko":
    "감사합니다. 이제 갈 준비가 되었나이다."
- else:
    "Thank you. I am ready to go."
}

# TRANSITION: fade_black

-> ch05_end

=== ch05_end ===
{lang == "ko":
    [ 제5장 끝 — 해석자의 집 ]
- else:
    [ End of Chapter 5 — Interpreter's House ]
}
-> ch06_opening
