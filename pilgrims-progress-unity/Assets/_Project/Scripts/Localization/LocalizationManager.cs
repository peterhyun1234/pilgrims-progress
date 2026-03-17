using System;
using System.Collections.Generic;
using UnityEngine;
using PilgrimsProgress.Core;

namespace PilgrimsProgress.Localization
{
    public class LocalizationManager : MonoBehaviour
    {
        public static LocalizationManager Instance { get; private set; }

        public event Action<string> OnLanguageChanged;

        private string _currentLanguage = "ko";

        private Dictionary<string, Dictionary<string, string>> _stringTables =
            new Dictionary<string, Dictionary<string, string>>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            ServiceLocator.Register(this);
            LoadStringTables();

            _currentLanguage = GameManager.Instance != null
                ? GameManager.Instance.CurrentLanguage
                : "ko";
        }

        public string CurrentLanguage => _currentLanguage;

        public void SetLanguage(string langCode)
        {
            _currentLanguage = langCode;
            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetLanguage(langCode);
            }

            var inkService = ServiceLocator.TryGet<Narrative.InkService>(out var ink) ? ink : null;
            if (inkService != null)
            {
                inkService.SetLanguageVariable();
            }

            OnLanguageChanged?.Invoke(_currentLanguage);
        }

        public string Get(string key)
        {
            if (_stringTables.TryGetValue(_currentLanguage, out var table))
            {
                if (table.TryGetValue(key, out var value))
                {
                    return value;
                }
            }

            if (_currentLanguage != "en" && _stringTables.TryGetValue("en", out var fallback))
            {
                if (fallback.TryGetValue(key, out var value))
                {
                    return value;
                }
            }

            return $"[{key}]";
        }

        private void LoadStringTables()
        {
            var ko = new Dictionary<string, string>
            {
                // Main Menu
                {"menu_new_game", "새 게임"},
                {"menu_continue", "이어하기"},
                {"menu_collection", "컬렉션"},
                {"menu_settings", "설정"},
                {"menu_language", "언어"},
                {"menu_quit", "종료"},

                // Settings
                {"settings_title", "설정"},
                {"settings_master_volume", "전체 볼륨"},
                {"settings_bgm_volume", "배경음악"},
                {"settings_sfx_volume", "효과음"},
                {"settings_ambient_volume", "환경음"},
                {"settings_back", "뒤로"},

                // Language Select
                {"lang_title", "언어를 선택하세요"},
                {"lang_korean", "한국어"},
                {"lang_english", "English"},

                // Gameplay
                {"ui_continue", "계속"},
                {"ui_save", "저장"},
                {"ui_load", "불러오기"},
                {"ui_auto", "자동"},
                {"ui_skip", "스킵"},
                {"ui_log", "기록"},
                {"ui_menu", "메뉴"},

                // Stats
                {"stat_faith", "믿음"},
                {"stat_courage", "용기"},
                {"stat_wisdom", "지혜"},
                {"stat_burden", "짐"},

                // Save/Load
                {"save_title", "저장"},
                {"load_title", "불러오기"},
                {"save_slot", "슬롯"},
                {"save_empty", "비어 있음"},
                {"save_auto", "자동 저장"},
                {"save_confirm", "저장하시겠습니까?"},
                {"load_confirm", "불러오시겠습니까?"},
                {"confirm_yes", "예"},
                {"confirm_no", "아니오"},

                // Game
                {"game_title", "천로역정"},
                {"game_subtitle", "순례자의 여정"},
                {"game_guest", "게스트"},
                {"game_create_account", "계정 만들기"},

                // Prologue
                {"prologue_line1", "나는 꿈을 꾸었노라..."},
                {"prologue_line2", "이 세상의 광야에서"},
                {"prologue_line3", "한 사람이 누더기를 입고 서 있었으니"},
                {"prologue_line4", "그의 등에는 무거운 짐이 지워져 있었고"},
                {"prologue_line5", "그의 손에는 한 권의 책이 들려 있었다."},
                {"prologue_city", "당신은 멸망의 도시에 살고 있습니다."},
                {"prologue_judgment", "이 도시는 곧 심판의 불로 멸망할 것입니다."},
                {"prologue_burden", "등에 진 짐은 당신의 죄의 무게입니다."},
                {"prologue_only_place", "이 짐은 오직 한 곳에서만 벗을 수 있습니다."},
                {"prologue_goal_title", "순례의 목표"},
                {"prologue_goal1", "멸망의 도시에서 천상의 도시까지 순례하라"},
                {"prologue_goal2", "짐을 지고 걸으며 믿음, 용기, 지혜를 키워라"},
                {"prologue_goal3", "십자가에서 짐을 벗고, 끝까지 인내하라"},
                {"prologue_start", "순례를 시작하다"},
                {"prologue_tap", "화면을 터치하여 계속"},
                {"prologue_game_desc", "1678년, 존 번연이 감옥에서 쓴 불멸의 고전\n'천로역정'의 세계에 오신 것을 환영합니다."},
                {"prologue_game_desc2", "당신은 '순례자'가 되어 멸망의 도시에서 천상의 도시까지\n12개의 챕터를 여행하며, NPC들과 대화하고,\n선택에 따라 믿음, 용기, 지혜가 성장합니다."},
                {"prologue_controls_title", "조작 방법"},
                {"prologue_controls_move", "방향키 / WASD: 캐릭터 이동"},
                {"prologue_controls_talk", "E 또는 Space: NPC와 대화"},
                {"prologue_controls_escape", "ESC: 대화 종료"},
                {"prologue_controls_tip", "머리 위 표시가 있는 NPC를 순서대로 만나세요!"},

                // Epilogue
                {"epilogue_burden_falls", "짐이 풀려 떨어졌다!"},
                {"epilogue_free", "마침내 자유를 얻었도다"},
                {"epilogue_demo_end", "순례가 끝났습니다"},
                {"epilogue_full_version", "신앙의 여정은 계속됩니다"},
                {"epilogue_thank_you", "감사합니다"},

                // Pause Menu
                {"pause_title", "일시정지"},
                {"pause_resume", "\u25B6  게임 계속"},
                {"pause_save", "\u2B07  저장"},
                {"pause_journey", "\u2690  여정 지도"},
                {"pause_settings", "\u2699  설정"},
                {"pause_main_menu", "\u2302  메인 메뉴"},
                {"pause_quit", "\u274C  종료"},
                {"pause_hint_esc", "ESC로 게임 재개"},
                {"pause_saved", "게임이 저장되었습니다"},
                {"pause_confirm_menu", "메인 메뉴로 돌아가시겠습니까?\n저장하지 않은 진행은 사라집니다."},
                {"pause_confirm_quit", "게임을 종료하시겠습니까?"},

                // Chapter Transition
                {"chapter_complete", "챕터 완료"},
                {"next_journey", "다음 여정"},
                {"press_continue", "아무 키나 눌러 계속"},

                // Confirm
                {"confirm_yes", "예"},
                {"confirm_no", "아니오"},

                // Interaction
                {"interact_hint", "E / Space 로 대화"},
                {"dialogue_done", "대화 완료"}
            };

            var en = new Dictionary<string, string>
            {
                // Main Menu
                {"menu_new_game", "New Game"},
                {"menu_continue", "Continue"},
                {"menu_collection", "Collection"},
                {"menu_settings", "Settings"},
                {"menu_language", "Language"},
                {"menu_quit", "Quit"},

                // Settings
                {"settings_title", "Settings"},
                {"settings_master_volume", "Master Volume"},
                {"settings_bgm_volume", "Background Music"},
                {"settings_sfx_volume", "Sound Effects"},
                {"settings_ambient_volume", "Ambient"},
                {"settings_back", "Back"},

                // Language Select
                {"lang_title", "Select Language"},
                {"lang_korean", "한국어"},
                {"lang_english", "English"},

                // Gameplay
                {"ui_continue", "Continue"},
                {"ui_save", "Save"},
                {"ui_load", "Load"},
                {"ui_auto", "Auto"},
                {"ui_skip", "Skip"},
                {"ui_log", "Log"},
                {"ui_menu", "Menu"},

                // Stats
                {"stat_faith", "Faith"},
                {"stat_courage", "Courage"},
                {"stat_wisdom", "Wisdom"},
                {"stat_burden", "Burden"},

                // Save/Load
                {"save_title", "Save Game"},
                {"load_title", "Load Game"},
                {"save_slot", "Slot"},
                {"save_empty", "Empty"},
                {"save_auto", "Auto Save"},
                {"save_confirm", "Save to this slot?"},
                {"load_confirm", "Load this save?"},
                {"confirm_yes", "Yes"},
                {"confirm_no", "No"},

                // Game
                {"game_title", "The Pilgrim's Progress"},
                {"game_subtitle", "A Journey of Faith"},
                {"game_guest", "Guest"},
                {"game_create_account", "Create Account"},

                // Prologue
                {"prologue_line1", "I dreamed a dream..."},
                {"prologue_line2", "In the wilderness of this world"},
                {"prologue_line3", "A man stood clothed in rags"},
                {"prologue_line4", "A heavy burden upon his back"},
                {"prologue_line5", "And a book in his hand."},
                {"prologue_city", "You live in the City of Destruction."},
                {"prologue_judgment", "This city will soon be consumed by the fire of judgment."},
                {"prologue_burden", "The burden on your back is the weight of your sin."},
                {"prologue_only_place", "This burden can only be removed at one place."},
                {"prologue_goal_title", "The Pilgrim's Goal"},
                {"prologue_goal1", "Journey from the City of Destruction to the Celestial City"},
                {"prologue_goal2", "Walk with the burden, growing in Faith, Courage, and Wisdom"},
                {"prologue_goal3", "Lay down your burden at the Cross, and endure to the end"},
                {"prologue_start", "Begin the Pilgrimage"},
                {"prologue_tap", "Tap to continue"},
                {"prologue_game_desc", "Welcome to the world of John Bunyan's immortal classic\n'The Pilgrim's Progress', written in prison in 1678."},
                {"prologue_game_desc2", "You become the Pilgrim, journeying from the City of Destruction\nto the Celestial City across 12 chapters.\nTalk to NPCs and let your choices grow\nyour Faith, Courage, and Wisdom."},
                {"prologue_controls_title", "Controls"},
                {"prologue_controls_move", "Arrow Keys / WASD: Move character"},
                {"prologue_controls_talk", "E or Space: Talk to NPCs"},
                {"prologue_controls_escape", "ESC: End conversation"},
                {"prologue_controls_tip", "Follow the markers above NPCs to meet them in order!"},

                // Epilogue
                {"epilogue_burden_falls", "The burden fell from his back!"},
                {"epilogue_free", "At last, he was free"},
                {"epilogue_demo_end", "The pilgrimage is complete"},
                {"epilogue_full_version", "The journey of faith continues"},
                {"epilogue_thank_you", "Thank You"},

                // Pause Menu
                {"pause_title", "Paused"},
                {"pause_resume", "\u25B6  Resume"},
                {"pause_save", "\u2B07  Save"},
                {"pause_journey", "\u2690  Journey Map"},
                {"pause_settings", "\u2699  Settings"},
                {"pause_main_menu", "\u2302  Main Menu"},
                {"pause_quit", "\u274C  Quit"},
                {"pause_hint_esc", "Press ESC to resume"},
                {"pause_saved", "Game saved"},
                {"pause_confirm_menu", "Return to main menu?\nUnsaved progress will be lost."},
                {"pause_confirm_quit", "Quit the game?"},

                // Chapter Transition
                {"chapter_complete", "Chapter Complete"},
                {"next_journey", "Next Journey"},
                {"press_continue", "Press any key to continue"},

                // Confirm
                {"confirm_yes", "Yes"},
                {"confirm_no", "No"},

                // Interaction
                {"interact_hint", "E / Space to talk"},
                {"dialogue_done", "Dialogue complete"}
            };

            _stringTables["ko"] = ko;
            _stringTables["en"] = en;
        }
    }
}
