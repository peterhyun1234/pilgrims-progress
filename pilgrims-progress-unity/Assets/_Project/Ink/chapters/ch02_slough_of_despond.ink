// === Chapter 02: Slough of Despond ===

=== ch02_opening ===
~ chapter = 2
# LOCATION: slough_of_despond
# BGM: slough_dread
# TRANSITION: fade_black

# SPEAKER:
{lang == "ko":
    {player_name}과 유연은 절망의 늪을 향해 걸어갔다. 길은 좁고 흐릿했으며, 그들은 조심스럽게 발을 내딛었다.
- else:
    {player_name} and Pliable walked toward the Slough of Despond. The path was narrow and dim, and they trod carefully.
}

# SPEAKER: Christian
# EMOTION: cautious
{lang == "ko":
    "조심하시오. 이곳은 위험한 곳이라 하였소."
- else:
    "Take care. I was told this place is perilous."
}

# SPEAKER: Pliable
# EMOTION: confident
{lang == "ko":
    "걱정 마시오. 우리는 곧 천성에 도착할 것이오."
- else:
    "Fear not. We shall soon reach the Celestial City."
}

-> ch02_fall

=== ch02_fall ===
# SFX: mud_splash
# SHAKE: medium
# EMOTION: shocked

{lang == "ko":
    갑자기 땅이 무너지며, 둘은 절망의 늪 속으로 빠져들었다.
- else:
    Suddenly the ground gave way, and both fell into the Slough of Despond.
}

# SPEAKER: Pliable
# EMOTION: panicked
{lang == "ko":
    "이게 무슨 일이오?!"
- else:
    "What is this?!"
}

# SPEAKER: Christian
# EMOTION: struggling
{lang == "ko":
    "빠져나가시오! 등에 짐이 있어서..."
- else:
    "Struggle free! This burden upon my back—"
}

# SFX: struggle
# WAIT: 1.0

-> ch02_pliable_leaves

=== ch02_pliable_leaves ===
# SPEAKER: Pliable
# EMOTION: angry
{lang == "ko":
    유연은 격렬히 몸부림치며 얕은 쪽으로 기어 올라갔다.
- else:
    Pliable thrashed violently and crawled toward the shallower side.
}

# SPEAKER: Pliable
# EMOTION: bitter
{lang == "ko":
    "이것이 네가 말한 그 행복이냐? 처음부터 이런 곳으로 데려오다니!"
- else:
    "Is this the happiness you told me of? To bring me into such a place as this!"
}

# SPEAKER: Pliable
# EMOTION: dismissive
{lang == "ko":
    "네가 천성을 가진다 해도 나는 네 것이 아니다."
- else:
    "If you get the kingdom, keep it to yourself. I will have none of it."
}

# SFX: footsteps_leaving
~ pliable_left = true

{lang == "ko":
    유연은 진흙을 털어내고, 고향으로 돌아갔다.
- else:
    Pliable shook off the mire and turned back toward his own house.
}

# TRANSITION: fade_black
# WAIT: 1.0

-> ch02_struggle

=== ch02_struggle ===
# SPEAKER: Christian
# EMOTION: desperate
# BGM: slough_struggle

{lang == "ko":
    {player_name}은 홀로 남았다. 등에 진 짐이 그를 깊은 곳으로 끌어당겼다.
- else:
    {player_name} was left alone. The burden upon his back drew him toward the deeper part.
}

# SPEAKER: Christian
# EMOTION: weary
{lang == "ko":
    "주여... 나를 버리지 마옵소서..."
- else:
    "Lord... forsake me not..."
}

# SFX: struggle_heavy
# WAIT: 1.5

{lang == "ko":
    그는 허우대까지 빠져들었으나, 여전히 손을 뻗었다.
- else:
    He sank up to his middle, yet still he reached out his hands.
}

# SPEAKER: Christian
# EMOTION: desperate
{lang == "ko":
    "구원을 받으려면 내가 어찌하여야 하리이까..."
- else:
    "What shall I do to be saved..."
}

# WAIT: 2.0

-> ch02_help_arrives

=== ch02_help_arrives ===
# SFX: footsteps_approach
# BGM: hope_theme

# SPEAKER: Help
# EMOTION: compassionate
{lang == "ko":
    그때 한 사람이 다가왔다. 그의 이름은 도움이었다.
- else:
    Then a man drew near. His name was Help.
}

# SPEAKER: Help
# EMOTION: gentle
{lang == "ko":
    "네 손을 내게 주라."
- else:
    "Give me your hand."
}

# SFX: pull_rescue
# TRANSITION: fade_white
# WAIT: 1.0

{lang == "ko":
    도움이 {player_name}의 손을 잡아당겼다. {player_name}은 진흙 속에서 끌어올려져 단단한 땅 위에 서게 되었다.
- else:
    Help took {player_name} by the hand and drew him out. {player_name} stood upon firm ground once more.
}

# SPEAKER: Christian
# EMOTION: grateful
{lang == "ko":
    "당신은... 어떻게..."
- else:
    "You... how did you..."
}

# SPEAKER: Help
# EMOTION: solemn
{lang == "ko":
    "이 늪은 죄에 대한 확신이 마음에 쌓일 때 생기는 것이다. 두려움과 의심, 절망의 습기가 모여 이 진흙탕을 만들었다."
- else:
    "This slough is the conviction of sin that settles in the heart. The fears and doubts and despairing thoughts gather here and make this mire."
}

# SPEAKER: Help
# EMOTION: hopeful
{lang == "ko":
    "그러나 왕께서는 이 길을 고치시려고 돌을 주셨다. 아직 많은 구멍이 남아 있지만, 믿음으로 건너가는 사람은 넘어지지 않는다."
- else:
    "Yet the King has given stones to mend this way. Though many gaps remain, those who cross in faith will not fall."
}

+ {lang == "ko"} ["감사합니다." (faith+5)]
    ~ faith += 5
    # STAT: faith +5
    -> ch02_end
+ {lang == "ko"} ["이곳은 왜 고쳐지지 않았습니까?" (wisdom+5)]
    ~ wisdom += 5
    # STAT: wisdom +5
    -> ch02_end
+ {lang != "ko"} ["Thank you." (faith+5)]
    ~ faith += 5
    # STAT: faith +5
    -> ch02_end
+ {lang != "ko"} ["Why is this place not fixed?" (wisdom+5)]
    ~ wisdom += 5
    # STAT: wisdom +5
    -> ch02_end

=== ch02_end ===
# SPEAKER: Help
# EMOTION: encouraging
{lang == "ko":
    "앞으로 나아가라. 좁은 문이 너를 기다리고 있다."
- else:
    "Press onward. The wicket-gate awaits you."
}

# SPEAKER: Christian
# EMOTION: determined
{lang == "ko":
    {player_name}은 고개를 숙여 감사하고, 다시 길을 걸었다.
- else:
    {player_name} bowed his head in thanks and took to the path once more.
}

# TRANSITION: fade_black
{lang == "ko":
    [ 제2장 끝 — 절망의 늪 ]
- else:
    [ End of Chapter 2 — Slough of Despond ]
}
-> ch03_opening
