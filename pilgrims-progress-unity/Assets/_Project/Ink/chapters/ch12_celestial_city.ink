// === Chapter 12: Enchanted Ground → River of Death → Celestial City ===

=== ch12_opening ===
~ chapter = 12
# LOCATION: enchanted_ground
# BGM: ch12_enchanted

# SPEAKER:
{lang == "ko":
    마법의 땅에 들어서자, 공기가 무겁고 나른해졌다. 졸음이 밀려왔다.
- else:
    Upon entering the Enchanted Ground, the air grew heavy and drowsy. Sleep pressed in.
}

# SPEAKER: Hopeful
{lang == "ko":
    "눈이 감기는 것 같습니다..."
- else:
    "My eyes are growing heavy..."
}

# SPEAKER: Christian
{lang == "ko":
    "안 됩니다! 여기서 잠들면 다시 깨어나지 못합니다. 서로 이야기하며 걸읍시다."
- else:
    "No! If we sleep here, we shall never wake again. Let us talk as we walk."
}

* {lang == "ko": [소망에게 회심 이야기를 물어본다] -> ch12_hopeful_story} {lang != "ko": [Ask Hopeful about his conversion] -> ch12_hopeful_story}

=== ch12_hopeful_story ===
~ wisdom += 5
# STAT: wisdom +5

# SPEAKER: Hopeful
{lang == "ko":
    "허영의 시장에서 신실이 순교하는 것을 보았습니다. 그의 평안한 얼굴에서 진리를 보았습니다."
- else:
    "I saw Faithful martyred at Vanity Fair. In his peaceful face, I saw the truth."
}

# SPEAKER: Hopeful
{lang == "ko":
    "우리가 깨어 있고 정신을 차립시다." (데살로니가전서 5:6, 새번역)
- else:
    "Let us be awake and sober." (1 Thessalonians 5:6, NIV)
}

~ bible_card_1thes_5_6 = true
# BIBLE_CARD: 1thes_5_6

-> ch12_ignorance

=== ch12_ignorance ===
# LOCATION: enchanted_road

# SPEAKER:
{lang == "ko":
    길에서 한 젊은이를 만났다. 무지(Ignorance)였다. 그는 자신만만하게 걷고 있었다.
- else:
    On the road, they met a young man — Ignorance. He walked with great confidence.
}

# SPEAKER: Ignorance
# EMOTION: confident
{lang == "ko":
    "나도 천성에 갈 것입니다. 나는 좋은 사람이니까요. 마음이 착하면 되는 것 아닙니까?"
- else:
    "I too will enter the Celestial City. I am a good person. Isn't a good heart enough?"
}

* {lang == "ko": [경고한다] "좁은 문으로 들어가야 합니다." -> ch12_warn_ignorance} {lang != "ko": [Warn him] "You must enter through the narrow gate." -> ch12_warn_ignorance}
* {lang == "ko": [대화를 이어간다] "그 마음은 어디에서 오는 것입니까?" -> ch12_discuss_ignorance} {lang != "ko": [Continue the conversation] "Where does that confidence come from?" -> ch12_discuss_ignorance}

=== ch12_warn_ignorance ===
~ wisdom += 5
# STAT: wisdom +5

# SPEAKER: Ignorance
# EMOTION: dismissive
{lang == "ko":
    무지는 웃으며 지나갔다. "바른 길로 가면 자연히 될 것이오."
- else:
    Ignorance laughed and walked on. "If I walk a good road, it will work out."
}

# SPEAKER:
{lang == "ko":
    "사람의 눈에는 바른 것 같으나, 끝에 가서는 죽음의 길이 되는 것이 있다." (잠언 14:12, 새번역)
- else:
    "There is a way that appears to be right, but in the end it leads to death." (Proverbs 14:12, NIV)
}

~ bible_card_prov_14_12 = true
# BIBLE_CARD: prov_14_12

-> ch12_beulah

=== ch12_discuss_ignorance ===
~ wisdom += 3
# STAT: wisdom +3

# SPEAKER: Christian
{lang == "ko":
    "선한 행위만으로는 충분하지 않습니다. 은혜로 말미암아 구원을 받는 것입니다."
- else:
    "Good works alone are not enough. We are saved by grace."
}

# SPEAKER: Ignorance
{lang == "ko":
    무지는 고개를 저으며 자신의 길로 갔다.
- else:
    Ignorance shook his head and went his own way.
}

-> ch12_beulah

=== ch12_beulah ===
# LOCATION: land_of_beulah
# BGM: ch12_beulah

# SPEAKER:
{lang == "ko":
    블라의 나라에 도달하였다. 꽃이 만발하고, 새가 노래하고, 태양이 늘 빛나는 아름다운 땅이었다.
- else:
    They reached the Land of Beulah. Flowers bloomed, birds sang, and the sun always shone — a beautiful land.
}

# SPEAKER:
{lang == "ko":
    저 멀리 천성의 윤곽이 보였다. 금빛 탑과 찬란한 성문이 빛나고 있었다.
- else:
    In the distance, the outline of the Celestial City was visible — golden towers and brilliant gates gleaming.
}

~ faith += 10
# STAT: faith +10

-> ch12_river_of_death

=== ch12_river_of_death ===
# LOCATION: river_of_death
# BGM: ch12_river

# SPEAKER:
{lang == "ko":
    그러나 천성 앞에 강이 있었다. 사망의 강이었다. 다리는 없었다.
- else:
    But before the City lay a river — the River of Death. There was no bridge.
}

# SPEAKER: Christian
# EMOTION: fearful
{lang == "ko":
    "이 강은... 깊습니다. 건너갈 수 있을까요?"
- else:
    "This river... it is deep. Can we cross?"
}

# SPEAKER: Hopeful
# EMOTION: encouraging
{lang == "ko":
    "두려워하지 마십시오. '물 가운데를 지날 때에 내가 너와 함께 하겠다.'" (이사야 43:2, 새번역)
- else:
    "'When you pass through the waters, I will be with you.'" (Isaiah 43:2, NIV)
}

~ bible_card_isa_43_2 = true
# BIBLE_CARD: isa_43_2

* {lang == "ko": [용기를 내어 강에 들어간다] -> ch12_crossing} {lang != "ko": [Enter the river with courage] -> ch12_crossing}

=== ch12_crossing ===
# SFX: water_splash
# SHAKE: medium

# SPEAKER:
{lang == "ko":
    {player_name}은 강에 발을 들였다. 물이 차올랐다. 두려움이 엄습했다.
- else:
    {player_name} stepped into the river. The water rose. Fear pressed in.
}

# SPEAKER: Christian
# EMOTION: drowning
{lang == "ko":
    "물이... 너무 깊습니다... 파도에 삼켜지고 있습니다..."
- else:
    "The water... it is so deep... the waves are swallowing me..."
}

# SPEAKER: Hopeful
# EMOTION: firm
{lang == "ko":
    "형제여! 견디십시오! 바닥이 느껴집니다. 견고합니다!"
- else:
    "Brother! Be of good cheer! I feel the bottom, and it is solid!"
}

~ faith += 15
~ courage += 15
# STAT: faith +15
# STAT: courage +15

# TRANSITION: fade_white
# WAIT: 2.0

-> ch12_celestial_arrival

=== ch12_celestial_arrival ===
# LOCATION: celestial_city
# BGM: ch12_celestial
# CG: celestial_city_arrival

# SPEAKER:
{lang == "ko":
    강을 건너자, 빛나는 두 분이 기다리고 있었다. 그들이 두 순례자를 맞이하였다.
- else:
    On the other side, two Shining Ones awaited. They greeted the pilgrims.
}

# SPEAKER: Shining One
# EMOTION: glorious
{lang == "ko":
    "우리는 그들을 섬기라고 보내심을 받은 자들이오. 천성으로 안내하겠소."
- else:
    "We are sent to minister to you. We will guide you to the City."
}

# SPEAKER:
{lang == "ko":
    산을 올라갔다. 구름 위를 걸었다. 천사들의 합창이 울려 퍼졌다.
- else:
    They ascended the hill. They walked above the clouds. A choir of angels sang.
}

# SFX: trumpet_fanfare

# SPEAKER:
{lang == "ko":
    천성의 문이 열렸다. 나팔이 울렸다. 환영의 외침이 들렸다.
- else:
    The gates of the Celestial City opened. Trumpets sounded. Shouts of welcome were heard.
}

# SPEAKER:
{lang == "ko":
    "주님 안에서 죽은 자들은 복이 있도다. 모든 눈물을 그 눈에서 닦아 주시리니, 다시는 죽음이 없고, 슬픔도 울부짖음도 아픔도 없으리라." (요한계시록 21:4, 새번역)
- else:
    "Blessed are the dead who die in the Lord. He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain." (Revelation 21:4, NIV)
}

~ bible_card_rev_21_4 = true
# BIBLE_CARD: rev_21_4

~ faith = 100
~ courage = 100
~ wisdom = 100
# STAT: faith 100
# STAT: courage 100
# STAT: wisdom 100

# TRANSITION: fade_white
# WAIT: 3.0

-> ch12_ignorance_end

=== ch12_ignorance_end ===
# BGM: ch12_warning

# SPEAKER:
{lang == "ko":
    그 후에, 무지도 강을 건너왔다. 누군가 배를 태워 주었다.
- else:
    After this, Ignorance also crossed the river. Someone ferried him across.
}

# SPEAKER:
{lang == "ko":
    하지만 천성의 문 앞에서 두루마리를 요구받았을 때, 그에게는 아무것도 없었다.
- else:
    But when asked for the certificate at the gate, he had nothing to show.
}

# SPEAKER:
{lang == "ko":
    문이 닫혔다. 무지는 돌려보내졌다.
- else:
    The gate closed. Ignorance was turned away.
}

# SPEAKER:
{lang == "ko":
    좁은 문을 통하지 않고, 은혜를 거부한 자의 결말이었다.
- else:
    This was the end of one who refused the narrow gate and rejected grace.
}

-> ch12_end

=== ch12_end ===
# TRANSITION: fade_black
# WAIT: 2.0

{lang == "ko":
    [ 제12장 끝 — 천상의 도시 ]
- else:
    [ End of Chapter 12 — The Celestial City ]
}

{lang == "ko":
    {player_name}의 순례가 끝났다.
- else:
    The pilgrimage of {player_name} is complete.
}

-> epilogue_start
