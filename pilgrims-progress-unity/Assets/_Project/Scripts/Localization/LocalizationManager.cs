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

                // Epilogue
                {"epilogue_burden_falls", "짐이 풀려 떨어졌다!"},
                {"epilogue_free", "마침내 자유를 얻었도다"},
                {"epilogue_demo_end", "데모가 끝났습니다"},
                {"epilogue_full_version", "정식 버전에서 순례의 여정을 이어가세요"},
                {"epilogue_thank_you", "감사합니다"}
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

                // Epilogue
                {"epilogue_burden_falls", "The burden fell from his back!"},
                {"epilogue_free", "At last, he was free"},
                {"epilogue_demo_end", "End of Demo"},
                {"epilogue_full_version", "Continue the pilgrimage in the full version"},
                {"epilogue_thank_you", "Thank You"}
            };

            _stringTables["ko"] = ko;
            _stringTables["en"] = en;
        }
    }
}
