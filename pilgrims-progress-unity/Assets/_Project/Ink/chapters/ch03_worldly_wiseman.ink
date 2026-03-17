// === Chapter 03: Mr. Worldly Wiseman ===

=== ch03_opening ===
~ chapter = 3
# LOCATION: path_to_gate
# BGM: path_uncertain

# SPEAKER:
{lang == "ko":
    {player_name}은 절망의 늪을 벗어나 좁은 문을 향해 걸었다. 등에 짐이 무거웠지만, 희망이 그를 이끌었다.
- else:
    {player_name} had escaped the Slough and walked toward the wicket-gate. Though his burden was heavy, hope led him on.
}

# SPEAKER:
{lang == "ko":
    그때 한 사람이 들에서 그를 만났다. 세상지혜씨라 불리는 자였다.
- else:
    Then a man met him in the field. One called Mr. Worldly Wiseman.
}

-> ch03_wiseman_appears

=== ch03_wiseman_appears ===
# SPEAKER: Worldly Wiseman
# EMOTION: friendly
# SFX: footsteps

{lang == "ko":
    "어찌하여 그렇게 무거운 짐을 지고 가는가? 어디로 향하는가?"
- else:
    "Well now, good fellow! Where are you going with such a heavy burden?"
}

# SPEAKER: Christian
# EMOTION: weary
{lang == "ko":
    "좁은 문으로 가는 길이오. 그곳에서 이 짐을 벗을 수 있다고 들었소."
- else:
    "I am going to the wicket-gate. I was told I might be eased of my burden there."
}

# SPEAKER: Worldly Wiseman
# EMOTION: concerned
{lang == "ko":
    "누가 그런 말을 하였느냐?"
- else:
    "Who told you to go that way?"
}

# SPEAKER: Christian
# EMOTION: uncertain
{lang == "ko":
    "전도자라 하는 분이오."
- else:
    "One called Evangelist."
}

-> ch03_temptation

=== ch03_temptation ===
# SPEAKER: Worldly Wiseman
# EMOTION: dismissive

{lang == "ko":
    "그가 한 말은 헛된 것이니, 그 길은 위험하고 고통이 많다. 네가 겪은 절망의 늪이 그 증거가 아니냐?"
- else:
    "Evangelist has given you bad advice. That way is dangerous and full of trouble. The Slough you passed through is proof of it."
}

# SPEAKER: Worldly Wiseman
# EMOTION: persuasive
{lang == "ko":
    "내가 더 나은 길을 알려 주겠다. 도덕 마을에 가서 법률씨를 만나라. 그가 네 짐을 쉽게 벗겨 줄 수 있다."
- else:
    "I will show you a better way. Go to the Village of Morality. There lives one Mr. Legality, who can ease your burden with far less trouble."
}

# SPEAKER: Christian
# EMOTION: tempted
{lang == "ko":
    "정말 그런가요? 이 짐을 빨리 벗고 싶소."
- else:
    "Is it true? I would love to be rid of this burden."
}

# SPEAKER: Worldly Wiseman
# EMOTION: confident
{lang == "ko":
    "그 마을은 가깝고, 그곳에서 네가 원하는 안식과 명예를 얻을 수 있다."
- else:
    "The village is near, and there you will find rest and honor."
}

# TRANSITION: fade_black

{lang == "ko":
    {player_name}은 유혹에 넘어가 길을 벗어나 시내산 근처로 향했다.
- else:
    {player_name}, overcome by the temptation, turned aside from the path and made toward Mount Sinai.
}

-> ch03_mount_sinai

=== ch03_mount_sinai ===
# LOCATION: mount_sinai
# BGM: mount_sinai_dread
# SFX: thunder

{lang == "ko":
    산이 다가왔다. 그 산은 하늘에 닿을 듯 높았고, 벼락이 쏟아지며 불꽃이 번쩍였다.
- else:
    The mountain drew near. It seemed to reach the heavens, and lightning flashed about its peak.
}

# SHAKE: heavy
# SFX: lightning

# SPEAKER: Christian
# EMOTION: terrified
{lang == "ko":
    "이 산이 내 위에 떨어지면 어찌 되리오!"
- else:
    "If this mountain fall upon me, I am undone!"
}

# SPEAKER: Christian
# EMOTION: desperate
{lang == "ko":
    "법률씨를 찾아가도 이 짐을 벗을 수 없을 것 같소. 오히려 죽을 뿐이오!"
- else:
    "I cannot reach Mr. Legality. I shall perish here!"
}

# SFX: fire_crackle
# WAIT: 1.5

# SPEAKER: Evangelist
# EMOTION: stern
# SFX: footsteps

{lang == "ko":
    그때 전도자가 나타났다.
- else:
    Then Evangelist appeared.
}

-> ch03_evangelist_rebuke

=== ch03_evangelist_rebuke ===
# SPEAKER: Evangelist
# EMOTION: stern

{lang == "ko":
    "{player_name}아, 여기서 무엇을 하느냐?"
- else:
    "{player_name}, what are you doing here?"
}

# SPEAKER: Christian
# EMOTION: ashamed
{lang == "ko":
    "저... 세상지혜씨가 말한 길로..."
- else:
    "I... I turned to the way that Worldly Wiseman showed..."
}

# SPEAKER: Evangelist
# EMOTION: grave
{lang == "ko":
    "네가 세 가지 죄를 범했다. 첫째, 빛을 버리고 어둠을 택했고, 둘째, 고난의 길을 피하고 쉬운 길을 구했으며, 셋째, 전도자의 말을 거역하고 세상 사람의 말을 들었다."
- else:
    "You have sinned in three ways. First, you forsook the light and chose the way of darkness. Second, you fled from the way of suffering and sought the easy path. Third, you rejected the words of Evangelist and listened to a man of this world."
}

# SPEAKER: Christian
# EMOTION: repentant
{lang == "ko":
    "저는... 저는 잘못하였습니다."
- else:
    "I... I have done wrong."
}

# SPEAKER: Evangelist
# EMOTION: compassionate
{lang == "ko":
    "이제 돌아서라. 빛이 있던 곳으로 돌아가라. 그러면 네 죄가 용서받을 것이다."
- else:
    "Turn again. Return to the place where the light shone. There your sin will be forgiven."
}

# SPEAKER: Evangelist
# EMOTION: solemn
{lang == "ko":
    "율법의 행위에 의존하는 사람은 누구나 저주 아래에 놓여 있다." (갈라디아서 3:10, 새번역)
- else:
    "For all who rely on the works of the law are under a curse." (Galatians 3:10, NIV)
}
~ bible_card_gal_3_10 = true
# BIBLE_CARD: gal_3_10

-> ch03_repentance

=== ch03_repentance ===
# TRANSITION: fade_black
# BGM: repentance_theme

{lang == "ko":
    {player_name}은 무릎을 꿇고 통회하였다.
- else:
    {player_name} fell upon his knees and wept in repentance.
}

# SPEAKER: Christian
# EMOTION: repentant
{lang == "ko":
    "주여, 저를 용서하여 주옵소서. 다시는 길을 벗어나지 않겠나이다."
- else:
    "Lord, forgive me. I will stray from the path no more."
}

# SPEAKER: Evangelist
# EMOTION: gentle
{lang == "ko":
    "일어나라. 빛을 따라 가라."
- else:
    "Arise. Follow the light."
}

{lang == "ko":
    {player_name}은 일어나 다시 좁은 문을 향한 길로 돌아섰다.
- else:
    {player_name} rose and turned back to the path that led to the wicket-gate.
}

+ {lang == "ko"} ["절망 속에서 응답하라." (courage+3)]
    ~ courage += 3
    # STAT: courage +3
    -> ch03_despair
+ {lang == "ko"} ["희망 속에서 응답하라." (faith+5)]
    ~ faith += 5
    # STAT: faith +5
    -> ch03_hope
+ {lang != "ko"} ["Respond with despair." (courage+3)]
    ~ courage += 3
    # STAT: courage +3
    -> ch03_despair
+ {lang != "ko"} ["Respond with hope." (faith+5)]
    ~ faith += 5
    # STAT: faith +5
    -> ch03_hope

=== ch03_despair ===
# SPEAKER: Christian
# EMOTION: broken
{lang == "ko":
    "저는... 저는 너무나 부족한 자입니다. 그래도 일어서겠나이다."
- else:
    "I am... I am so unworthy. Yet I will rise."
}
-> ch03_end

=== ch03_hope ===
# SPEAKER: Christian
# EMOTION: hopeful
{lang == "ko":
    "주님의 은혜가 저를 붙드시리라 믿나이다."
- else:
    "I believe Your grace will uphold me."
}
-> ch03_end

=== ch03_end ===
# SPEAKER: Evangelist
# EMOTION: encouraging
{lang == "ko":
    "좁은 문을 두드리라. 문이 열리리라."
- else:
    "Knock at the wicket-gate. It will be opened to you."
}

# TRANSITION: fade_black
{lang == "ko":
    [ 제3장 끝 — 세상지혜씨 ]
- else:
    [ End of Chapter 3 — Mr. Worldly Wiseman ]
}
-> ch04_opening

// ── NPC Interaction Knots (standalone) ──

=== ch03_worldly_wiseman ===
# SPEAKER: Worldly Wiseman
# EMOTION: friendly
{lang == "ko":
    이보시오, 여행자! 등에 그 무거운 짐을 지고 어디를 가시오?
- else:
    Well now, traveler! Where might you be going with that heavy burden on your back?
}
# SPEAKER: Christian
# EMOTION: tired
{lang == "ko":
    좁은 문을 향해 가고 있습니다. 거기서 이 짐을 벗을 수 있다 하셨어요.
- else:
    I'm heading for the Wicket Gate. I was told I could lose this burden there.
}
# SPEAKER: Worldly Wiseman
# EMOTION: persuasive
{lang == "ko":
    좁은 문이라... 험한 길이지. 차라리 '도덕' 마을로 가시오. 거기 '율법'이란 분이 짐을 내려줄 수 있소.
- else:
    The Wicket Gate... a difficult path indeed. Why not go to the village of Morality? Mr. Legality there can remove your burden easily.
}
+ {lang == "ko"} 그 말이 맞는 것 같습니다. 좀 더 쉬운 길이 있다면...
    # SPEAKER: Worldly Wiseman
    # EMOTION: satisfied
    {lang == "ko":
        그렇지! 고생할 필요 없소. 편한 길을 가시오.
    - else:
        That's right! No need to suffer. Take the easy road.
    }
    # STAT: wisdom -3
    # STAT: faith -2
    -> DONE
+ {lang == "ko"} 아닙니다. 전도자의 말씀을 따르겠습니다.
    # SPEAKER: Worldly Wiseman
    # EMOTION: dismissive
    {lang == "ko":
        고집이 세군. 후회할 걸세.
    - else:
        Stubborn fool. You'll regret it.
    }
    # STAT: faith +3
    # STAT: wisdom +2
    -> DONE
+ {lang != "ko"} That sounds wise. If there's an easier way...
    # SPEAKER: Worldly Wiseman
    # EMOTION: satisfied
    That's right! No need to suffer. Take the easy road.
    # STAT: wisdom -3
    # STAT: faith -2
    -> DONE
+ {lang != "ko"} No. I will follow the Evangelist's words.
    # SPEAKER: Worldly Wiseman
    # EMOTION: dismissive
    Stubborn fool. You'll regret it.
    # STAT: faith +3
    # STAT: wisdom +2
    -> DONE

=== ch03_evangelist_return ===
# SPEAKER: Evangelist
# EMOTION: stern
{lang == "ko":
    크리스천! 네가 무엇을 하고 있느냐? 세상지혜씨의 말을 들었느냐?
- else:
    Christian! What have you been doing? Did you listen to Mr. Worldly Wiseman?
}
# SPEAKER: Christian
# EMOTION: ashamed
{lang == "ko":
    예... 그의 말이 그럴듯해서... 좀 더 쉬운 길이 있다기에...
- else:
    Yes... his words seemed so reasonable... he said there was an easier way...
}
# SPEAKER: Evangelist
# EMOTION: passionate
{lang == "ko":
    "좁은 문으로 들어가라! 멸망으로 인도하는 문은 크고 그 길이 넓어 많은 사람이 그리로 들어가지만, 생명으로 인도하는 문은 좁고 길이 협착하니라." (마태복음 7:13-14)
- else:
    "Enter through the narrow gate! For wide is the gate and broad is the road that leads to destruction, but small is the gate and narrow the road that leads to life." (Matthew 7:13-14)
}
# STAT: faith +5
# STAT: wisdom +3
# SPEAKER: Christian
# EMOTION: repentant
{lang == "ko":
    잘못했습니다. 다시 바른 길로 돌아가겠습니다!
- else:
    I was wrong. I will return to the true path!
}
-> DONE
