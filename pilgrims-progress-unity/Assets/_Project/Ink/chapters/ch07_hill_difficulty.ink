// === Chapter 07: Hill Difficulty & Palace Beautiful ===

=== ch07_opening ===
~ chapter = 7
# LOCATION: hill_difficulty
# BGM: ch07_hill

# SPEAKER:
{lang == "ko":
    {player_name}의 앞에 가파른 언덕이 나타났다. 길은 셋으로 갈라졌다.
- else:
    Before {player_name} rose a steep hill. The path divided into three.
}

# SPEAKER:
{lang == "ko":
    정면으로 가파른 길이 곧바로 올라가고, 왼쪽과 오른쪽에는 편한 길이 보였다.
- else:
    The steep path went straight up, while easier roads curved left and right.
}

+ {lang == "ko"} [곧은 길로 올라간다] "어려워도 바른 길로 가자."
    -> ch07_steep_path
+ {lang != "ko"} [Take the steep path] "Though hard, I'll take the right way."
    -> ch07_steep_path
+ {lang == "ko"} [왼쪽 편한 길로 간다] 편한 길이 눈에 들어왔다.
    -> ch07_wrong_path
+ {lang != "ko"} [Take the easier left path] The easy road looked inviting.
    -> ch07_wrong_path

=== ch07_steep_path ===
~ courage += 10
# STAT: courage +10

# SPEAKER:
{lang == "ko":
    {player_name}은 가파른 길을 올라가기 시작했다. 숨이 가빴지만 발걸음은 확고했다.
- else:
    {player_name} began climbing the steep path. Though breathless, the steps were sure.
}

-> ch07_arbor

=== ch07_wrong_path ===
~ courage -= 5
~ wisdom -= 5
# STAT: courage -5
# STAT: wisdom -5

# SPEAKER:
{lang == "ko":
    편한 길은 점점 어두워지더니, 길을 잃고 말았다. 결국 되돌아와야 했다.
- else:
    The easy path grew dark, and {player_name} became lost. In the end, the only choice was to turn back.
}

-> ch07_arbor

=== ch07_arbor ===
# LOCATION: arbor_on_hill

# SPEAKER:
{lang == "ko":
    언덕 중턱에 쉼터가 있었다. {player_name}은 지쳐서 잠시 쉬기로 했다.
- else:
    Halfway up, there was an arbor. {player_name}, weary, sat down to rest.
}

# SPEAKER:
{lang == "ko":
    쉼터에서 쉬다가 그만 잠이 들고 말았다. 깨어 보니 두루마리가 떨어져 있었다!
- else:
    Resting in the arbor, sleep overtook the pilgrim. Upon waking — the scroll had fallen!
}

+ {lang == "ko"} [두루마리를 찾으러 되돌아간다]
    -> ch07_retrieve_scroll
+ {lang != "ko"} [Go back for the scroll]
    -> ch07_retrieve_scroll

=== ch07_retrieve_scroll ===
~ wisdom += 5
# STAT: wisdom +5

# SPEAKER:
{lang == "ko":
    {player_name}은 두루마리를 되찾았으나, 같은 길을 두 번 걸어야 했다.
- else:
    {player_name} recovered the scroll, but had to walk the same ground twice.
}

-> ch07_lions

=== ch07_lions ===
# LOCATION: lions_gate
# BGM: ch07_tension

# SPEAKER:
{lang == "ko":
    언덕 꼭대기에 이르자, 길 양쪽에 사자 두 마리가 있었다. 으르렁거리고 있었다.
- else:
    At the hilltop, two lions flanked the path. They growled menacingly.
}

# SPEAKER:
{lang == "ko":
    파수꾼이 멀리서 외쳤다. "두려워 마라! 사슬에 묶여 있다. 길 한가운데로 걸어라!"
- else:
    A watchman called from afar: "Fear not! They are chained. Walk in the middle of the path!"
}

+ {courage >= 30} {lang == "ko"} [용기를 내어 한가운데로 걸어간다]
    -> ch07_pass_lions
+ {courage >= 30} {lang != "ko"} [Walk boldly through the middle]
    -> ch07_pass_lions
+ {lang == "ko"} [조심스럽게 천천히 지나간다]
    -> ch07_pass_lions_slow
+ {lang != "ko"} [Pass carefully and slowly]
    -> ch07_pass_lions_slow

=== ch07_pass_lions ===
~ courage += 10
# STAT: courage +10

# SPEAKER:
{lang == "ko":
    {player_name}은 담대히 걸어갔다. 사자들은 으르렁거렸으나 닿지 못했다.
- else:
    {player_name} walked boldly through. The lions roared but could not reach.
}

-> ch07_palace

=== ch07_pass_lions_slow ===
~ courage += 5
# STAT: courage +5

# SPEAKER:
{lang == "ko":
    떨리는 마음으로 지나갔다. 사슬이 팽팽했지만, 무사히 통과했다.
- else:
    With trembling heart, the pilgrim passed. The chains held, and no harm came.
}

-> ch07_palace

=== ch07_palace ===
# LOCATION: palace_beautiful
# BGM: ch07_palace

# SPEAKER:
{lang == "ko":
    아름다운 궁전이 나타났다. 세 자매 — 신중, 경건, 사랑이 맞이해 주었다.
- else:
    A beautiful palace appeared. Three sisters — Prudence, Piety, and Charity — welcomed the pilgrim.
}

# SPEAKER: Prudence
{lang == "ko":
    "순례자여, 어디서 왔으며 어디로 가는가?"
- else:
    "Pilgrim, where have you come from, and where are you going?"
}

# SPEAKER: Christian
{lang == "ko":
    "멸망의 도시에서 왔습니다. 천성을 향해 갑니다. 십자가에서 짐을 벗었습니다."
- else:
    "I come from the City of Destruction, bound for the Celestial City. My burden fell at the Cross."
}

# SPEAKER: Piety
{lang == "ko":
    "십자가에서 짐이 떨어질 때, 무엇을 느꼈는가?" (베드로전서 1:8, 새번역)
- else:
    "What did you feel when the burden fell at the Cross?" (1 Peter 1:8, NIV)
}

+ {lang == "ko"} [말로 형용할 수 없는 기쁨이었습니다]
    -> ch07_joy_answer
+ {lang != "ko"} [An inexpressible joy]
    -> ch07_joy_answer
+ {lang == "ko"} [아직도 잘 모르겠습니다]
    -> ch07_uncertain_answer
+ {lang != "ko"} [I'm still not sure]
    -> ch07_uncertain_answer

=== ch07_joy_answer ===
~ faith += 8
# STAT: faith +8

# SPEAKER: Charity
{lang == "ko":
    사랑이 미소 지었다. "그 기쁨을 기억하라. 앞으로의 길에서 그것이 너를 지탱하리라."
- else:
    Charity smiled. "Remember that joy. It will sustain you in the road ahead."
}

-> ch07_armory

=== ch07_uncertain_answer ===
~ wisdom += 5
# STAT: wisdom +5

# SPEAKER: Prudence
{lang == "ko":
    "솔직한 마음이구나. 은혜는 때로 조용히 작동한다. 천성에 이르러 온전히 알게 되리라."
- else:
    "An honest heart. Grace sometimes works quietly. You will understand fully at the Celestial City."
}

-> ch07_armory

=== ch07_armory ===
# LOCATION: palace_armory

# SPEAKER:
{lang == "ko":
    자매들은 {player_name}을 무기고로 데려갔다. 순례의 무장을 갖추게 해 주었다.
- else:
    The sisters led {player_name} to the armory, equipping the pilgrim for the road ahead.
}

# SPEAKER:
{lang == "ko":
    "진리의 허리띠, 의의 흉배, 믿음의 방패, 구원의 투구, 성령의 검을 취하라." (에베소서 6:14-17, 새번역)
- else:
    "Take the belt of truth, breastplate of righteousness, shield of faith, helmet of salvation, and sword of the Spirit." (Ephesians 6:14-17, NIV)
}

~ faith += 5
~ courage += 5
~ wisdom += 5
# STAT: faith +5
# STAT: courage +5
# STAT: wisdom +5

-> ch07_end

=== ch07_end ===
# TRANSITION: fade_black

{lang == "ko":
    {player_name}은 궁전에서 하룻밤을 쉬고, 무장을 갖추고, 다음 날 여정을 이어갔다.
- else:
    {player_name} rested one night in the palace, armed and equipped, and continued the journey at dawn.
}

{lang == "ko":
    [ 제7장 끝 — 어려움의 언덕과 아름다운 궁전 ]
- else:
    [ End of Chapter 7 — Hill Difficulty & Palace Beautiful ]
}

-> ch08_opening

// ── NPC Interaction Knots (standalone) ──

=== ch07_prudence ===
# SPEAKER: Prudence
# EMOTION: gentle
{lang == "ko":
    순례자여, 궁전에 온 것을 환영하오. 나는 '신중'이라 하오. 네가 왜 이 길을 걷게 되었는지 듣고 싶구나.
- else:
    Welcome to the palace, pilgrim. I am Prudence. I would hear why you walk this path.
}
+ {lang == "ko"} 전도자의 말씀을 듣고 멸망의 도시를 떠났습니다.
    # SPEAKER: Prudence
    {lang == "ko":
        그 결심이 참되구나. 때로 옛 생각이 떠오르지 않느냐?
    - else:
        That resolve is true. Do old thoughts sometimes return?
    }
    # SPEAKER: Christian
    # EMOTION: honest
    {lang == "ko":
        네, 하지만 더 좋은 것을 바라보려 합니다.
    - else:
        Yes, but I try to look toward better things.
    }
    # STAT: wisdom +3
    # SPEAKER: Prudence
    # EMOTION: approving
    {lang == "ko":
        잘하는 것이다. 위의 것을 생각하라. 하나님의 것을 구하라.
    - else:
        You do well. Set your mind on things above. Seek the things of God.
    }
    -> DONE
+ {lang != "ko"} I heard the Evangelist's words and left the City of Destruction.
    # SPEAKER: Prudence
    That resolve is true. Do old thoughts sometimes return?
    # SPEAKER: Christian
    # EMOTION: honest
    Yes, but I try to look toward better things.
    # STAT: wisdom +3
    # SPEAKER: Prudence
    # EMOTION: approving
    You do well. Set your mind on things above. Seek the things of God.
    -> DONE

=== ch07_piety ===
# SPEAKER: Piety
# EMOTION: warm
{lang == "ko":
    나는 '경건'이라 하오. 지금까지의 여정에서 하나님을 어떻게 경험했소?
- else:
    I am Piety. How have you experienced God on your journey so far?
}
+ {lang == "ko"} 십자가에서 짐이 풀렸을 때, 형언할 수 없는 기쁨을 느꼈습니다.
    # SPEAKER: Piety
    # EMOTION: joyful
    {lang == "ko":
        그 경험을 절대 잊지 마시오! 앞으로 어둡고 힘든 때가 올 것이나, 그 은혜를 기억하시오.
    - else:
        Never forget that experience! Dark and difficult times lie ahead, but remember that grace.
    }
    # STAT: faith +4
    -> DONE
+ {lang != "ko"} When my burden fell at the Cross, I felt indescribable joy.
    # SPEAKER: Piety
    # EMOTION: joyful
    Never forget that experience! Dark and difficult times lie ahead, but remember that grace.
    # STAT: faith +4
    -> DONE

=== ch07_charity ===
# SPEAKER: Charity
# EMOTION: compassionate
{lang == "ko":
    나는 '사랑'이라 하오. 순례자여, 네 가족은 어떻게 되었소?
- else:
    I am Charity. Pilgrim, what became of your family?
}
# SPEAKER: Christian
# EMOTION: sad
{lang == "ko":
    함께 오자고 간청했지만, 아무도 따라오지 않았습니다. 마음이 무겁습니다.
- else:
    I begged them to come with me, but none would follow. It weighs heavy on my heart.
}
# SPEAKER: Charity
# EMOTION: gentle
{lang == "ko":
    그들을 위해 기도하라. 네 본이 되는 삶이 그들의 마음을 돌릴 수도 있소. 사랑은 모든 것을 참으며 모든 것을 바라느니라.
- else:
    Pray for them. Your faithful life may yet turn their hearts. Love bears all things and hopes all things.
}
# STAT: wisdom +2
# STAT: faith +3
-> DONE
