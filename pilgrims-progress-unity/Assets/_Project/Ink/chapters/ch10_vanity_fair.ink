// === Chapter 10: Vanity Fair ===

=== ch10_opening ===
~ chapter = 10
# LOCATION: vanity_fair_entrance
# BGM: ch10_market

# SPEAKER:
{lang == "ko":
    {player_name}은 허영의 시장에 도착하였다. 이 시장은 5,000년 전 브엘세불이 세운 것으로, 세상의 모든 허영을 팔고 있었다.
- else:
    {player_name} arrived at Vanity Fair — a market established 5,000 years ago by Beelzebub, selling every vanity of the world.
}

# SPEAKER:
{lang == "ko":
    명예, 쾌락, 부, 권력... 무엇이든 살 수 있는 곳이었다.
- else:
    Honor, pleasure, wealth, power... everything could be bought here.
}

-> ch10_faithful_meeting

=== ch10_faithful_meeting ===
# SPEAKER:
{lang == "ko":
    시장에서 한 사람을 만났다. 신실(Faithful)이었다. 그도 천성을 향해 순례하고 있었다.
- else:
    In the market, a fellow pilgrim was found — Faithful. He too journeyed toward the Celestial City.
}

# SPEAKER: Faithful
# EMOTION: glad
{lang == "ko":
    "{player_name}! 동행이여! 나도 같은 길을 가고 있다오."
- else:
    "{player_name}! Fellow pilgrim! I walk the same road."
}

~ faithful_alive = true

-> ch10_temptation

=== ch10_temptation ===
# LOCATION: vanity_fair_market

# SPEAKER:
{lang == "ko":
    상인들이 다가왔다. "사시오, 사시오! 이 세상의 좋은 것들을 드리리다!"
- else:
    Merchants approached. "Buy, buy! We offer the finest things of this world!"
}

# SPEAKER: Merchant
{lang == "ko":
    "순례자여, 이 보석을 보시오. 이 금을 보시오. 무엇을 사겠소?"
- else:
    "Pilgrim, see these jewels. See this gold. What will you buy?"
}

+ {lang == "ko"} [아무것도 사지 않겠다] "진리 외에는 아무것도 사지 않겠소!"
    -> ch10_refuse_buy
+ {lang != "ko"} [Buy nothing] "We buy nothing but the truth!"
    -> ch10_refuse_buy
+ {lang == "ko"} [구경만 한다] 주위를 둘러보았다.
    -> ch10_look_around
+ {lang != "ko"} [Just look around] Looking around curiously.
    -> ch10_look_around

=== ch10_refuse_buy ===
~ faith += 10
# STAT: faith +10

# SPEAKER:
{lang == "ko":
    시장 사람들이 분노하였다. "이들은 우리를 멸시하는 자들이다!"
- else:
    The people of the fair grew angry. "These people despise us!"
}

-> ch10_arrest

=== ch10_look_around ===
~ wisdom -= 3
# STAT: wisdom -3

# SPEAKER:
{lang == "ko":
    잠시 구경하는 사이, 시장의 유혹이 마음을 흔들었다. 하지만 신실이 일깨워 주었다.
- else:
    While looking, the temptations stirred the heart. But Faithful gave a reminder.
}

# SPEAKER: Faithful
{lang == "ko":
    "돈을 사랑하는 것이 모든 악의 뿌리입니다." (디모데전서 6:10, 새번역)
- else:
    "The love of money is the root of all evil." (1 Timothy 6:10, NIV)
}

~ bible_card_1tim_6_10 = true
# BIBLE_CARD: 1tim_6_10

-> ch10_arrest

=== ch10_arrest ===
# LOCATION: vanity_fair_prison
# BGM: ch10_trial

# SPEAKER:
{lang == "ko":
    두 순례자는 체포되어 감옥에 갇혔다. 재판이 열렸다.
- else:
    The two pilgrims were arrested and thrown into a cage. A trial was held.
}

# SPEAKER: Judge
{lang == "ko":
    "이자들은 우리 시장의 질서를 어지럽히고, 상거래를 방해한 자들이로다!"
- else:
    "These people have disturbed the order of our fair and disrupted trade!"
}

# SPEAKER: Faithful
# EMOTION: resolute
{lang == "ko":
    "우리는 진리만을 따릅니다. 이 시장의 것들은 허영에 불과합니다."
- else:
    "We follow truth alone. The wares of this market are nothing but vanity."
}

-> ch10_faithful_martyrdom

=== ch10_faithful_martyrdom ===
# BGM: ch10_martyrdom
# CG: faithful_martyrdom

# SPEAKER:
{lang == "ko":
    군중은 격분하였다. 신실은 사형을 선고받았다.
- else:
    The crowd was enraged. Faithful was sentenced to death.
}

# SPEAKER: Faithful
# EMOTION: peaceful
{lang == "ko":
    "두려워하지 마시오, {player_name}. 나는 먼저 천성으로 가는 것뿐이오."
- else:
    "Fear not, {player_name}. I merely go to the Celestial City ahead of you."
}

# WAIT: 2.0
# SPEAKER:
{lang == "ko":
    신실은 순교하였다. 불꽃 가운데서도 평안한 얼굴이었다.
- else:
    Faithful was martyred. Even amid the flames, his face was peaceful.
}

~ faithful_alive = false
~ faith += 10
~ courage += 10
# STAT: faith +10
# STAT: courage +10

# TRANSITION: fade_white
# SPEAKER:
{lang == "ko":
    전차가 하늘에서 내려와 신실을 구름 사이로 데려갔다. 나팔소리가 울려 퍼졌다.
- else:
    A chariot descended from heaven and carried Faithful through the clouds. Trumpet sounds echoed.
}

-> ch10_hopeful

=== ch10_hopeful ===
# BGM: ch10_hope
# LOCATION: vanity_fair_outskirts

# SPEAKER:
{lang == "ko":
    시장에서 한 젊은이가 {player_name}에게 다가왔다. 신실의 순교를 보고 회심한 소망(Hopeful)이었다.
- else:
    A young man approached {player_name} outside the fair — Hopeful, converted by witnessing Faithful's martyrdom.
}

# SPEAKER: Hopeful
# EMOTION: earnest
{lang == "ko":
    "저도 함께 가겠습니다! 신실의 믿음이 저를 변화시켰습니다."
- else:
    "Let me join you! Faithful's faith has changed me."
}

~ hopeful_joined = true

+ {lang == "ko"} [환영한다] "함께 갑시다, 소망."
    -> ch10_welcome_hopeful
+ {lang != "ko"} [Welcome him] "Let us go together, Hopeful."
    -> ch10_welcome_hopeful

=== ch10_welcome_hopeful ===
~ faith += 5
# STAT: faith +5

# SPEAKER:
{lang == "ko":
    이제부터 {player_name}과 소망은 함께 순례의 길을 걸었다.
- else:
    From this point, {player_name} and Hopeful walked the pilgrim's road together.
}

-> ch10_end

=== ch10_end ===
# TRANSITION: fade_black

{lang == "ko":
    [ 제10장 끝 — 허영의 시장 ]
- else:
    [ End of Chapter 10 — Vanity Fair ]
}

-> ch11_opening

// ── NPC Interaction Knots (standalone) ──

=== ch10_faithful ===
# SPEAKER: Faithful
# EMOTION: warm
{lang == "ko":
    크리스천! 반갑다! 나도 멸망의 도시를 떠나 순례의 길을 걷고 있다네.
- else:
    Christian! How good to see you! I too left the City of Destruction and walk the pilgrim's way.
}
# SPEAKER: Christian
# EMOTION: joyful
{lang == "ko":
    신실이여! 동행이 생기다니 기쁩니다. 여정은 어떠했습니까?
- else:
    Faithful! What joy to have a companion. How has your journey been?
}
# SPEAKER: Faithful
# EMOTION: reflective
{lang == "ko":
    순탄치 않았지. '정욕'이란 여인이 유혹했고, '수치'라는 자도 만났네. 하지만 은혜로 이겨냈다네.
- else:
    Not easy. Madam Wanton tried to tempt me, and I met one called Shame. But by grace, I overcame.
}
# STAT: courage +3
# STAT: faith +3
{lang == "ko":
    함께 가세. 동행이 있으면 위로가 되지 않겠나.
- else:
    Let us go together. A companion brings comfort on the road.
}
-> DONE

=== ch10_byends ===
# SPEAKER: By-ends
# EMOTION: friendly
{lang == "ko":
    이봐요, 순례자들! 나도 천상의 도시로 가는 중이라오. '사리사욕'이라 하오.
- else:
    Hey there, pilgrims! I too am headed for the Celestial City. The name's By-ends.
}
# SPEAKER: Christian
# EMOTION: cautious
{lang == "ko":
    사리사욕이라... 어떤 원칙으로 살고 계십니까?
- else:
    By-ends... what principles do you live by?
}
# SPEAKER: By-ends
# EMOTION: casual
{lang == "ko":
    나는 바람이 부는 쪽으로 돛을 올리는 현명한 사람이오. 비 올 때만 종교를 따르고, 불편하면 잠시 쉬지.
- else:
    I'm a wise man who sets my sails with the wind. I follow religion when it suits and rest when it's inconvenient.
}
+ {lang == "ko"} 그것은 참된 순례가 아닙니다. 함께 갈 수 없습니다.
    # SPEAKER: By-ends
    # EMOTION: offended
    {lang == "ko":
        흥, 고집쟁이들. 나 혼자 가면 되지.
    - else:
        Hmph, stubborn fools. I'll go my own way then.
    }
    # STAT: wisdom +4
    # STAT: faith +2
    -> DONE
+ {lang != "ko"} That is not true pilgrimage. We cannot walk together.
    # SPEAKER: By-ends
    # EMOTION: offended
    Hmph, stubborn fools. I'll go my own way then.
    # STAT: wisdom +4
    # STAT: faith +2
    -> DONE
