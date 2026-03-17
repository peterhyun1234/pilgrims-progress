// === Chapter 08: Valley of Humiliation — Apollyon Battle ===

=== ch08_opening ===
~ chapter = 8
# LOCATION: valley_humiliation
# BGM: ch08_descent

# SPEAKER:
{lang == "ko":
    {player_name}은 아름다운 궁전을 떠나 골짜기로 내려갔다. 굴욕의 골짜기라 불리는 곳이었다.
- else:
    {player_name} descended from the palace into the Valley of Humiliation.
}

# SPEAKER:
{lang == "ko":
    골짜기는 좁고 어두웠다. 갑자기 길을 가로막는 형체가 나타났다.
- else:
    The valley was narrow and dark. Suddenly, a figure blocked the path.
}

-> ch08_apollyon_appears

=== ch08_apollyon_appears ===
# BGM: ch08_battle
# SPEAKER:
{lang == "ko":
    물고기 비늘 같은 갑옷, 용의 날개, 곰의 발, 사자의 입을 가진 괴물이 나타났다.
- else:
    A creature appeared — scales like a fish, wings of a dragon, feet of a bear, mouth of a lion.
}

# SPEAKER: Apollyon
# EMOTION: menacing
{lang == "ko":
    "나는 아볼론이다. 이 나라의 왕이자 신이니라. 너는 어디서 와서 어디로 가느냐?"
- else:
    "I am Apollyon, king and god of this land. Where do you come from, and where do you go?"
}

# SPEAKER: Christian
{lang == "ko":
    "나는 멸망의 도시에서 나와 시온의 도시로 가는 중이오."
- else:
    "I came from the City of Destruction and journey toward the City of Zion."
}

# SPEAKER: Apollyon
# EMOTION: angry
{lang == "ko":
    "너는 나의 신하였다! 멸망의 도시는 내 영토다. 돌아오너라, 그러면 보상하리라."
- else:
    "You are my subject! The City of Destruction belongs to me. Return, and I will reward you."
}

+ {lang == "ko"} [단호히 거절한다] "결코 돌아가지 않겠소!"
    -> ch08_refuse
+ {lang != "ko"} [Refuse firmly] "I will never go back!"
    -> ch08_refuse
+ {faith >= 50} {lang == "ko"} [성경 말씀으로 대답한다] "기록되었으되..."
    -> ch08_scripture_reply
+ {faith >= 50} {lang != "ko"} [Reply with Scripture] "It is written..."
    -> ch08_scripture_reply

=== ch08_refuse ===
~ courage += 5
# STAT: courage +5

# SPEAKER: Apollyon
# EMOTION: furious
{lang == "ko":
    "그렇다면 죽을 각오를 하여라!"
- else:
    "Then prepare to die!"
}

-> ch08_battle

=== ch08_scripture_reply ===
~ faith += 10
~ courage += 5
# STAT: faith +10
# STAT: courage +5

# SPEAKER: Christian
{lang == "ko":
    "내가 섬기는 왕의 봉급과 나라가 가장 좋소. '잠깐 받는 고난은 영원한 영광과 비교할 수 없소.'" (고린도후서 4:17, 새번역)
- else:
    "My King's wages and kingdom are best. 'Our light and momentary troubles are achieving an eternal glory.'" (2 Corinthians 4:17, NIV)
}

# SPEAKER: Apollyon
# EMOTION: furious
{lang == "ko":
    아볼론은 분노하여 불꽃 화살을 던졌다.
- else:
    Apollyon, enraged, hurled flaming darts.
}

-> ch08_battle

=== ch08_battle ===
# LOCATION: apollyon_arena
# BGM: ch08_battle_intense

# SPEAKER:
{lang == "ko":
    반나절에 걸친 싸움이 벌어졌다. 아볼론은 불꽃 화살을 퍼붓고, {player_name}은 믿음의 방패로 막았다.
- else:
    A half-day battle ensued. Apollyon rained fiery darts, and {player_name} blocked them with the shield of faith.
}

# SFX: battle_clash

# SPEAKER:
{lang == "ko":
    {player_name}은 상처를 입었으나 넘어지지 않았다. 마침내 성령의 검을 뽑아 들었다.
- else:
    {player_name} was wounded but did not fall. At last, the sword of the Spirit was drawn.
}

+ {lang == "ko"} [검을 휘두른다] "야곱의 하나님께 감사하리라!"
    -> ch08_victory
+ {lang != "ko"} [Strike with the sword] "Thanks be to the God of Jacob!"
    -> ch08_victory

=== ch08_victory ===
# SFX: sword_strike
# SHAKE: heavy

# SPEAKER:
{lang == "ko":
    "이 모든 일에 우리를 사랑하시는 분을 통하여 우리가 이기고도 남습니다." (로마서 8:37, 새번역)
- else:
    "In all these things we are more than conquerors through him who loved us." (Romans 8:37, NIV)
}

# SPEAKER:
{lang == "ko":
    아볼론은 날개를 펼쳐 도망갔다. {player_name}은 승리하였다.
- else:
    Apollyon spread his wings and fled. {player_name} was victorious.
}

~ faith += 15
~ courage += 15
# STAT: faith +15
# STAT: courage +15

~ bible_card_eph_6_17 = true
# BIBLE_CARD: eph_6_17

# SPEAKER:
{lang == "ko":
    하나님의 손에서 생명나무 잎사귀가 내려와 상처를 치유해 주었다.
- else:
    Leaves from the Tree of Life came from God's hand and healed the wounds.
}

-> ch08_end

=== ch08_end ===
# TRANSITION: fade_black

{lang == "ko":
    [ 제8장 끝 — 아볼론과의 전투 ]
- else:
    [ End of Chapter 8 — Battle with Apollyon ]
}

-> ch09_opening

// ── NPC Interaction Knots (standalone) ──

=== ch08_apollyon_battle ===
# SPEAKER: Apollyon
# EMOTION: threatening
{lang == "ko":
    멈춰라! 나는 아폴리온, 이 골짜기의 왕이다. 네가 어디서 왔고 어디로 가는지 알고 있다.
- else:
    Stop! I am Apollyon, prince of this valley. I know where you came from and where you're going.
}
# SPEAKER: Christian
# EMOTION: scared
{lang == "ko":
    나는... 나는 천상의 도시를 향해 가는 순례자입니다.
- else:
    I am... I am a pilgrim bound for the Celestial City.
}
# SPEAKER: Apollyon
# EMOTION: rage
{lang == "ko":
    너는 한때 내 백성이었다! 멸망의 도시는 내 영토다. 돌아가라! 아니면 여기서 끝장내주마!
- else:
    You were once my subject! The City of Destruction is my territory. Turn back, or I will destroy you here!
}
+ {lang == "ko"} 나는 만왕의 왕을 섬기기로 했습니다. 물러서시오!
    # SPEAKER: Apollyon
    # EMOTION: rage
    {lang == "ko":
        그렇다면 쓰러뜨려주마!
    - else:
        Then I will strike you down!
    }
    # SHAKE: strong
    # SPEAKER: Christian
    # EMOTION: prayerful
    {lang == "ko":
        "너는 칼과 창으로 오지만, 나는 만군의 여호와의 이름으로 나아간다!" (사무엘상 17:45)
    - else:
        "You come with sword and spear, but I come in the name of the Lord of Hosts!" (1 Samuel 17:45)
    }
    # STAT: courage +8
    # STAT: faith +5
    -> DONE
+ {lang != "ko"} I serve the King of kings now. Stand aside!
    # SPEAKER: Apollyon
    # EMOTION: rage
    Then I will strike you down!
    # SHAKE: strong
    # SPEAKER: Christian
    # EMOTION: prayerful
    "You come with sword and spear, but I come in the name of the Lord of Hosts!" (1 Samuel 17:45)
    # STAT: courage +8
    # STAT: faith +5
    -> DONE
