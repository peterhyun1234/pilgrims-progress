// === Chapter 01: City of Destruction ===

=== ch01_opening ===
~ chapter = 1
# LOCATION: city_of_destruction
# BGM: city_despair

# SPEAKER: Christian
# EMOTION: distressed
{lang == "ko":
    그는 책을 읽으면서 울었고 떨었다. 더 이상 참을 수 없었던 그는 비탄에 찬 부르짖음으로 외쳤다.
- else:
    As he read, he wept and trembled. Unable to contain himself, he broke out with a lamentable cry.
}

# SPEAKER: Christian
# EMOTION: crying
{lang == "ko":
    "내가 어찌하여야 하리이까!"
- else:
    "What shall I do?!"
}
# SFX: cry_out
# SHAKE: light

-> ch01_family

=== ch01_family ===
# SPEAKER: Christian
# EMOTION: worried
{lang == "ko":
    그는 집으로 돌아가 아내와 자녀들에게 마음을 열어 말했다.
- else:
    Going home, he opened his mind to his wife and children.
}

# SPEAKER: Christian
# EMOTION: desperate
{lang == "ko":
    "오 나의 사랑하는 아내여, 내 뱃속에서 난 자녀들아, 나 너희의 친한 벗은 등에 놓인 무거운 짐 때문에 스스로 멸망당하고 있노라."
- else:
    "O my dear wife, and you the children of my bowels, I, your dear friend, am in myself undone by reason of a burden that lieth hard upon me."
}

# SPEAKER: Christian
# EMOTION: desperate
{lang == "ko":
    "게다가 나는 우리 도시가 하늘에서 내리는 불로 소멸될 것을 확실히 알게 되었다. 우리가 피할 길을 찾지 못하면 모두 죽게 되오."
- else:
    "Moreover, I am for certain informed that this our city will be burned with fire from heaven; in which fearful overthrow, we shall all be destroyed."
}

# SPEAKER: 
# EMOTION: neutral
{lang == "ko":
    이 말을 들은 가족들은 크게 놀랐다. 그러나 그들이 놀란 것은 그의 말이 사실이라고 믿어서가 아니라, 그의 머리에 어떤 광기의 병이 들었다고 생각했기 때문이었다.
- else:
    His family was sore amazed — not because they believed him, but because they thought that some frenzy distemper had got into his head.
}

{lang == "ko":
    밤이 되자 크리스천은 잠 대신 한숨과 눈물로 밤을 보냈다. 아침이 되자 가족들이 안부를 물었고, 그는 "더 나빠졌소"라고 답했다.
- else:
    The night brought only sighs and tears. When morning came and they asked how he fared, he answered: "Worse and worse."
}
~ faith += 5
# STAT: faith +5

-> ch01_fields

=== ch01_fields ===
# SPEAKER: 
{lang == "ko":
    크리스천은 홀로 들에 나가 때로는 읽고 때로는 기도하며 날들을 보냈다.
- else:
    He retreated to his chamber to pray, and walked solitary in the fields, sometimes reading, and sometimes praying.
}

# SPEAKER: Christian
# EMOTION: crying
{lang == "ko":
    "구원을 받으려면 내가 어찌하여야 하리이까?"
- else:
    "What shall I do to be saved?"
}
# SFX: cry_out

{lang == "ko":
    그는 이리저리 둘러보며 달려가려 했으나, 어디로 가야 할지 몰라 가만히 서 있었다.
- else:
    He looked this way and that, as if he would run; yet he stood still, because he could not tell which way to go.
}

-> ch01_evangelist

=== ch01_evangelist ===
# SPEAKER: Evangelist
# EMOTION: compassionate
# SFX: footsteps
~ met_evangelist = true

{lang == "ko":
    그때 전도자라는 이름의 한 사람이 그에게 다가왔다.
- else:
    Then a man named Evangelist came to him.
}

# SPEAKER: Evangelist
# EMOTION: compassionate
{lang == "ko":
    "어찌하여 울고 있느냐?"
- else:
    "Wherefore dost thou cry?"
}

# SPEAKER: Christian
# EMOTION: desperate
{lang == "ko":
    "선생이여, 내 손에 든 이 책을 보니 나는 죽도록 정죄되어 있고, 그 후에 심판에 이르게 됩니다. 나는 전자를 감당할 마음이 없고, 후자를 행할 능력도 없습니다."
- else:
    "Sir, I perceive by the book in my hand, that I am condemned to die, and after that to come to judgement; and I find that I am not willing to do the first, nor able to do the second."
}

# SPEAKER: Evangelist
# EMOTION: serious
{lang == "ko":
    "이 등 위의 짐이 그토록 두렵다면 어찌 가만히 서 있느냐?"
- else:
    "If this be thy condition, why standest thou still?"
}

# SPEAKER: Christian
# EMOTION: confused
{lang == "ko":
    "어디로 가야 할지 모르기 때문입니다."
- else:
    "Because I know not whither to go."
}

# SPEAKER: Evangelist
# EMOTION: hopeful
{lang == "ko":
    전도자가 그에게 양피지 두루마리를 주었는데, 그 안에는 이렇게 기록되어 있었다: "다가올 진노에서 도망하라."
- else:
    Then Evangelist gave him a parchment roll, and there was written within: "Flee from the wrath to come."
}
~ has_parchment = true
~ bible_card_matt_3_7 = true
# BIBLE_CARD: matt_3_7
# SFX: item_get

-> ch01_light_choice

=== ch01_light_choice ===
# SPEAKER: Evangelist
# EMOTION: hopeful
{lang == "ko":
    "저기 넓은 들판 너머, 좁은 문이 보이느냐?"
- else:
    "Do you see yonder wicket-gate?"
}

# SPEAKER: Christian
# EMOTION: confused
{lang == "ko":
    크리스천은 눈을 가늘게 뜨고 먼 곳을 바라보았다.
- else:
    Christian squinted and looked far into the distance.
}

+ {lang == "ko"} ["잘 모르겠습니다... 하지만 빛은 보이는 것 같습니다."]
    ~ faith += 5
    ~ courage += 3
    # STAT: faith +5
    # STAT: courage +3
    -> ch01_see_light
+ {lang == "ko"} ["아무것도 보이지 않습니다. 정말 그런 문이 있습니까?"]
    ~ wisdom += 3
    # STAT: wisdom +3
    -> ch01_no_light
+ {lang != "ko"} ["I cannot see it clearly... but I think I see a shining light."]
    ~ faith += 5
    ~ courage += 3
    # STAT: faith +5
    # STAT: courage +3
    -> ch01_see_light
+ {lang != "ko"} ["I see nothing. Is there truly such a gate?"]
    ~ wisdom += 3
    # STAT: wisdom +3
    -> ch01_no_light

=== ch01_see_light ===
# SPEAKER: Evangelist
# EMOTION: joyful
{lang == "ko":
    "그렇소! 그 빛을 눈에서 놓지 말고 곧바로 그리로 가시오. 그러면 그 문에 이르게 될 것이오. 문을 두드리면 어찌해야 할지 알게 될 것이오."
- else:
    "Keep that light in your eye, and go up directly thereto: so shalt thou see the gate; at which, when thou knockest, it shall be told thee what thou shalt do."
}
-> ch01_departure

=== ch01_no_light ===
# SPEAKER: Evangelist
# EMOTION: compassionate
{lang == "ko":
    "괜찮소. 문은 아직 보이지 않더라도, 빛을 따라가시오. 빛이 당신을 인도할 것이오."
- else:
    "Fear not. Though the gate is yet unseen, follow the light. The light shall guide thee."
}
-> ch01_departure

=== ch01_departure ===
# SPEAKER: 
# TRANSITION: fade_black
{lang == "ko":
    크리스천은 두루마리를 읽고 뛰기 시작했다. 등에 진 짐이 무거웠지만, 뒤를 돌아보지 않았다.
- else:
    Christian read the parchment and began to run. Though the burden on his back was heavy, he looked not behind him.
}

# SPEAKER: Christian
# EMOTION: determined
# SFX: running
{lang == "ko":
    "생명! 생명! 영원한 생명!"
- else:
    "Life! life! eternal life!"
}
~ courage += 5
# STAT: courage +5

-> ch01_obstinate_pliable

=== ch01_obstinate_pliable ===
# SPEAKER: Obstinate
# EMOTION: angry
# SFX: footsteps_multiple
{lang == "ko":
    "이봐! 어디를 가는 거야?"
- else:
    "Where are you going?"
}

{lang == "ko":
    이웃 완고와 유연이 뒤쫓아왔다.
- else:
    His neighbors Obstinate and Pliable ran after him.
}

# SPEAKER: Christian
# EMOTION: determined
{lang == "ko":
    "이 도시는 멸망합니다. 나는 천성을 향해 가는 중이오."
- else:
    "This city shall be destroyed. I go toward the Celestial City."
}

# SPEAKER: Obstinate
# EMOTION: angry
{lang == "ko":
    "허튼소리! 돌아가자! 여기가 안전한 집이야!"
- else:
    "Nonsense! Come back! Home is where safety lies!"
}

+ {lang == "ko"} ["돌아갈 수 없소. 함께 가시오!" (설득)]
    ~ wisdom += 3
    ~ faith += 3
    # STAT: wisdom +3
    # STAT: faith +3
    -> ch01_persuade
+ {lang == "ko"} ["혼자라도 가겠소." (결연)]
    ~ courage += 5
    # STAT: courage +5
    -> ch01_resolute
+ {lang != "ko"} ["I cannot go back. Come with me!" (Persuade)]
    ~ wisdom += 3
    ~ faith += 3
    # STAT: wisdom +3
    # STAT: faith +3
    -> ch01_persuade
+ {lang != "ko"} ["I shall go alone if I must." (Resolute)]
    ~ courage += 5
    # STAT: courage +5
    -> ch01_resolute

=== ch01_persuade ===
# SPEAKER: Christian
# EMOTION: earnest
{lang == "ko":
    "나는 썩지 않고 더럽혀지지 않으며 시들지 않는 유업을 구하고 있소. 그것은 하늘에 쌓아 두어 안전하게 보관되어 있소. 함께 가면 당신도 누리게 될 것이오."
- else:
    "I seek an inheritance incorruptible, undefiled, and that fadeth not away. It is laid up in heaven and safe there. Come, and you shall share in it."
}

# SPEAKER: Obstinate
# EMOTION: dismissive
{lang == "ko":
    "쯧! 당신의 책 따위는 치워라."
- else:
    "Tush! Away with your book."
}

{lang == "ko":
    완고는 비웃으며 돌아갔다.
- else:
    Obstinate turned back in scorn.
}

# SPEAKER: Pliable
# EMOTION: curious
~ pliable_joined = true
{lang == "ko":
    "욕하지 마시오. 그가 추구하는 것이 우리 것보다 나으니, 내 마음은 이웃과 함께 가는 쪽으로 기울어지오."
- else:
    "Don't revile. If what Christian says is true, the things he looks after are better than ours. My heart inclines to go with my neighbour."
}
-> ch01_together

=== ch01_resolute ===
{lang == "ko":
    완고는 비웃으며 돌아갔다. 그러나 유연이 잠시 머뭇거리더니 뒤따라왔다.
- else:
    Obstinate turned back in scorn. But Pliable hesitated, then followed.
}

# SPEAKER: Pliable
# EMOTION: uncertain
~ pliable_joined = true
{lang == "ko":
    "잠깐, 나도... 나도 가보겠소."
- else:
    "Wait... I will come too."
}
-> ch01_together

=== ch01_together ===
# SPEAKER: 
{lang == "ko":
    크리스천과 유연은 함께 걸었다. 크리스천은 천성의 영광에 대해 이야기했다.
- else:
    Christian and Pliable walked on together. Christian spoke of the heavenly glories.
}

# SPEAKER: Christian
# EMOTION: hopeful
{lang == "ko":
    "거기에는 끝없는 나라와 영원한 생명이 있고, 면류관과 영광이 있으며, 더 이상 울음도 슬픔도 없을 것이오. 그곳의 주인이 우리 눈에서 모든 눈물을 씻어 주실 것이기 때문이오."
- else:
    "There shall be an endless kingdom and everlasting life, crowns of glory, and no more crying nor sorrow — for He that is owner of the place will wipe all tears from our eyes."
}

# SPEAKER: Pliable
# EMOTION: excited
{lang == "ko":
    "이것을 듣는 것만으로도 사람의 마음을 황홀하게 하기에 충분하오! 자, 걸음을 빨리 합시다."
- else:
    "The hearing of this is enough to ravish one's heart! Come, let us mend our pace."
}

# SPEAKER: Christian
# EMOTION: weary
{lang == "ko":
    "등에 이 짐이 있어서 원하는 만큼 빨리 갈 수가 없소."
- else:
    "I cannot go so fast as I would, by reason of this burden that is on my back."
}

{lang == "ko":
    그러나 앞에는 — 절망의 늪이 기다리고 있었다...
- else:
    But ahead of them — the Slough of Despond awaited...
}

# TRANSITION: fade_black
# WAIT: 1.5
-> ch01_end

=== ch01_end ===
{lang == "ko":
    [ 제1장 끝 — 멸망의 도시 ]
- else:
    [ End of Chapter 1 — City of Destruction ]
}
-> ch02_opening
