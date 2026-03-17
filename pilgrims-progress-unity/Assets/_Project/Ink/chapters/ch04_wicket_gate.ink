// === Chapter 04: The Wicket Gate ===

=== ch04_opening ===
~ chapter = 4
# LOCATION: path_to_gate
# BGM: path_hope

# SPEAKER:
{lang == "ko":
    {player_name}은 좁은 문을 향해 걸었다. 전도자가 말한 빛이 그를 인도하였다.
- else:
    {player_name} walked toward the wicket-gate. The light that Evangelist had spoken of guided him.
}

# SPEAKER:
{lang == "ko":
    마침내 문이 보였다. 좁고 낮은 문이었다.
- else:
    At last the gate came into view. It was narrow and low.
}

-> ch04_arrival

=== ch04_arrival ===
# LOCATION: wicket_gate
# BGM: gate_anticipation

# SPEAKER: Christian
# EMOTION: hopeful
{lang == "ko":
    "두드리면 열리리라."
- else:
    "Knock, and it shall be opened."
}

# SFX: knock

# SPEAKER: Christian
# EMOTION: earnest
{lang == "ko":
    {player_name}은 문을 두드렸다.
- else:
    {player_name} knocked upon the gate.
}

# WAIT: 1.0

-> ch04_gate_opens

=== ch04_gate_opens ===
# SFX: gate_open
# SHAKE: light

{lang == "ko":
    문이 열리기 시작했다. 그 순간, 뒤에서 화살이 날아왔다.
- else:
    The gate began to open. In that moment, arrows flew from behind.
}

# SFX: arrow_whistle
# SFX: arrow_impact

# SPEAKER:
{lang == "ko":
    벨세붑이 성 위에서 화살을 쏘고 있었다. 그러나 문 안에서 한 손이 뻗어 나와 {player_name}을 잡아당겼다.
- else:
    Beelzebub shot from the castle above. But a hand reached out from within the gate and pulled {player_name} through.
}

# TRANSITION: fade_white
# WAIT: 0.5

# SPEAKER: Good-will
# EMOTION: welcoming
{lang == "ko":
    "기꺼이 받아들이겠다. 우리는 아무도 거절하지 않는다."
- else:
    "I am willing with all my heart. We make no objections against any."
}

# SPEAKER: Good-will
# EMOTION: gentle
{lang == "ko":
    "내게로 오는 사람은 내가 결코 내쫓지 않겠다." (요한복음 6:37, 새번역)
- else:
    "Whoever comes to me I will never drive away." (John 6:37, NIV)
}
~ bible_card_john_6_37 = true
# BIBLE_CARD: john_6_37

# SPEAKER: Christian
# EMOTION: relieved
{lang == "ko":
    "감사합니다. 저는... 저는 길을 잃었었습니다."
- else:
    "Thank you. I... I had lost my way."
}

-> ch04_confession

=== ch04_confession ===
# SPEAKER: Good-will
# EMOTION: gentle
{lang == "ko":
    "무슨 일이 있었느냐?"
- else:
    "What has happened to you?"
}

# SPEAKER: Christian
# EMOTION: ashamed
{lang == "ko":
    "세상지혜씨를 만나 도덕 마을로 가려 했습니다. 시내산 앞에서 두려움에 떨다가 전도자께서 저를 꾸짖으셨습니다."
- else:
    "I met Worldly Wiseman and sought the Village of Morality. I trembled before Mount Sinai until Evangelist rebuked me."
}

# SPEAKER: Good-will
# EMOTION: understanding
{lang == "ko":
    "전도자가 한 말이 옳았다. 시내산은 네 짐을 벗기지 못한다. 오직 앞에 있는 곳에서만 벗을 수 있다."
- else:
    "Evangelist did well. Mount Sinai cannot ease your burden. Only at the place ahead will you be delivered."
}

-> ch04_narrow_way

=== ch04_narrow_way ===
# SPEAKER: Good-will
# EMOTION: solemn
{lang == "ko":
    "이 앞에는 좁은 길이 있다. 곧게 나아가라. 이 문에서 짐을 벗을 수는 없다. 해방의 장소까지 짐을 지고 가야 한다."
- else:
    "Before you lies the narrow way. Go straight on. Your burden cannot be removed at this gate. Bear it until you come to the place of deliverance."
}

# SPEAKER: Christian
# EMOTION: determined
{lang == "ko":
    "알겠습니다."
- else:
    "I understand."
}

+ {lang == "ko"} ["짐에 대해 더 묻다." (wisdom+3)]
    ~ wisdom += 3
    # STAT: wisdom +3
    -> ch04_ask_burden
+ {lang == "ko"} ["감사를 표현하다." (faith+5)]
    ~ faith += 5
    # STAT: faith +5
    -> ch04_gratitude
+ {lang != "ko"} ["Ask about the burden." (wisdom+3)]
    ~ wisdom += 3
    # STAT: wisdom +3
    -> ch04_ask_burden
+ {lang != "ko"} ["Express gratitude." (faith+5)]
    ~ faith += 5
    # STAT: faith +5
    -> ch04_gratitude

=== ch04_ask_burden ===
# SPEAKER: Christian
# EMOTION: curious
{lang == "ko":
    "이 짐은 언제, 어디서 벗게 됩니까?"
- else:
    "When and where shall this burden be taken from me?"
}

# SPEAKER: Good-will
# EMOTION: patient
{lang == "ko":
    "해방의 언덕에 이르면 알게 될 것이다. 그곳에서 짐이 저절로 떨어질 것이다."
- else:
    "You will know when you reach the hill of deliverance. There it will fall from you of itself."
}

-> ch04_end

=== ch04_gratitude ===
# SPEAKER: Christian
# EMOTION: grateful
{lang == "ko":
    "이 문을 열어 주신 것만으로도 감사하나이다. 이제 믿음으로 나아가겠나이다."
- else:
    "I am grateful that this gate was opened to me. I shall press on in faith."
}

# SPEAKER: Good-will
# EMOTION: kind
{lang == "ko":
    "하나님이 너와 함께 하시기를."
- else:
    "God go with you."
}

-> ch04_end

=== ch04_end ===
# TRANSITION: fade_black

{lang == "ko":
    {player_name}은 해석자의 집을 향해 좁은 길을 걸었다.
- else:
    {player_name} took the narrow way toward the Interpreter's House.
}

{lang == "ko":
    [ 제4장 끝 — 좁은 문 ]
- else:
    [ End of Chapter 4 — The Wicket Gate ]
}
-> ch05_opening

// ── NPC Interaction Knots (standalone) ──

=== ch04_goodwill ===
# SPEAKER: Good-will
# EMOTION: welcoming
{lang == "ko":
    누가 거기 있소? 문을 두드리는 자여!
- else:
    Who is there? You who knock at the gate!
}
# SPEAKER: Christian
# EMOTION: desperate
{lang == "ko":
    저는 멸망의 도시에서 온 불쌍한 순례자입니다. 이 짐을 지고 더는 견딜 수 없습니다. 들여보내 주십시오!
- else:
    I am a poor pilgrim from the City of Destruction. I can bear this burden no longer. Please let me in!
}
# SFX: door_open
# SPEAKER: Good-will
# EMOTION: kind
{lang == "ko":
    기꺼이! 이리 오시오.
- else:
    Gladly! Come in, come in.
}
{lang == "ko":
    이 문은 좁지만, 진심으로 구하는 자에게는 항상 열려 있소. "두드리라, 그러면 열릴 것이요." (마태복음 7:7)
- else:
    This gate is narrow, but it is always open to those who truly seek. "Knock, and it shall be opened to you." (Matthew 7:7)
}
# STAT: faith +4
# STAT: courage +2
+ {lang == "ko"} 감사합니다. 이 짐은 어떻게 벗을 수 있습니까?
    # SPEAKER: Good-will
    {lang == "ko":
        이 길을 따라가면 십자가에 이르게 되오. 그곳에서 짐이 풀리리라. 먼저 해석자의 집에 들르시오.
    - else:
        Follow this path and you will reach the Cross. There your burden will fall away. But first, visit the Interpreter's House.
    }
    # STAT: wisdom +2
    -> DONE
+ {lang != "ko"} Thank you. How can I be rid of this burden?
    # SPEAKER: Good-will
    Follow this path and you will reach the Cross. There your burden will fall away. But first, visit the Interpreter's House.
    # STAT: wisdom +2
    -> DONE
