using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// Self-contained dialogue system that creates all UI at runtime.
/// Attach to any GameObject → Press Play → dialogue runs.
/// No manual UI setup required.
/// </summary>
public class SimpleDialogueRunner : MonoBehaviour
{
    Canvas _canvas;
    CanvasScaler _scaler;
    GameObject _dialoguePanel;
    Text _speakerText;
    Text _bodyText;
    Text _locationText;
    List<Button> _choiceButtons = new();
    List<Text> _choiceTexts = new();
    GameObject _choiceContainer;
    Button _continueButton;
    Image _fadeOverlay;

    List<DialogueNode> _story;
    int _currentIndex;

    void Start()
    {
        BuildUI();
        LoadStory();
        ShowNode(0);
    }

    #region Story Data

    void LoadStory()
    {
        _story = new List<DialogueNode>
        {
            // === 멸망의 도시 (City of Destruction) ===
            new()
            {
                Location = "멸망의 도시 (City of Destruction)",
                Speaker = "",
                Body = "어느 날, 한 남자가 누더기 옷을 입고 등에 무거운 짐을 진 채 서 있었다.\n" +
                       "그의 손에는 한 권의 책이 들려 있었다.",
                IsNarration = true
            },
            new()
            {
                Speaker = "크리스천 (Christian)",
                Body = "\"아, 어찌해야 하는가!\"\n\n" +
                       "책을 읽으면 읽을수록, 그의 얼굴에는 두려움이 깊어졌다.\n" +
                       "이 도시에 불과 유황의 심판이 내릴 것이라는 경고가 적혀 있었다."
            },
            new()
            {
                Speaker = "크리스천 (Christian)",
                Body = "그는 집으로 돌아가 아내와 자녀들에게 말했다.\n\n" +
                       "\"여보, 아이들아, 우리가 사는 이 도시에 하늘로부터 불이 내려와\n" +
                       "멸망할 것이오. 우리가 피할 길을 찾지 못하면 모두 죽게 되오.\""
            },
            new()
            {
                Speaker = "가족들",
                Body = "그러나 가족들은 그의 말을 믿지 않았다.\n" +
                       "아내는 한숨을 쉬었고, 자녀들은 아버지를 이상하게 바라보았다.\n\n" +
                       "밤이 되자 크리스천은 잠을 이루지 못하고 탄식하며 울었다."
            },
            new()
            {
                Speaker = "",
                Body = "다음 날, 크리스천은 홀로 들판을 걸으며 책을 읽고 기도했다.",
                IsNarration = true
            },
            // 전도자 등장
            new()
            {
                Speaker = "전도자 (Evangelist)",
                Body = "\"어찌하여 울고 있소?\"\n\n" +
                       "한 남자가 크리스천에게 다가와 물었다."
            },
            new()
            {
                Speaker = "크리스천 (Christian)",
                Body = "\"이 책에 의하면, 나는 죽게 되어 있고 그 후에 심판을 받아야 합니다.\n" +
                       "그런데 나는 죽을 준비도, 심판 받을 준비도 되어 있지 않습니다.\""
            },
            new()
            {
                Speaker = "전도자 (Evangelist)",
                Body = "전도자가 말했다.\n\n" +
                       "\"저기 넓은 들판이 보이시오?\""
            },
            new()
            {
                Speaker = "크리스천 (Christian)",
                Body = "\"예, 보입니다.\""
            },
            new()
            {
                Speaker = "전도자 (Evangelist)",
                Body = "\"저기 빛나는 문이 보이시오?\""
            },
            // 첫 번째 선택지
            new()
            {
                Speaker = "크리스천 (Christian)",
                Body = "크리스천은 눈을 가늘게 뜨고 먼 곳을 바라보았다.",
                Choices = new List<Choice>
                {
                    new() { Text = "\"잘 모르겠습니다... 하지만 빛은 보이는 것 같습니다.\"", NextIndex = 11 },
                    new() { Text = "\"아무것도 보이지 않습니다. 정말 그런 문이 있습니까?\"", NextIndex = 12 }
                }
            },
            // 선택 A: 빛이 보인다
            new()
            {
                Speaker = "전도자 (Evangelist)",
                Body = "\"그렇소! 그 빛을 향해 똑바로 가시오.\n" +
                       "그러면 그 문에 이르게 될 것이오.\n" +
                       "문을 두드리면 어찌해야 할지 알게 될 것이오.\"\n\n" +
                       "전도자는 양피지 두루마리를 건네주었다.\n" +
                       "거기에는 이렇게 적혀 있었다:\n\n" +
                       "\"장차 올 진노를 피하라\" (마태복음 3:7)"
            },
            // 선택 B: 안 보인다
            new()
            {
                Speaker = "전도자 (Evangelist)",
                Body = "\"괜찮소. 문은 아직 보이지 않더라도, 빛을 따라가시오.\n" +
                       "빛이 당신을 인도할 것이오.\"\n\n" +
                       "전도자는 양피지 두루마리를 건네주었다.\n" +
                       "거기에는 이렇게 적혀 있었다:\n\n" +
                       "\"장차 올 진노를 피하라\" (마태복음 3:7)"
            },
            // 합류 — 출발
            new()
            {
                Speaker = "",
                Body = "크리스천은 두루마리를 읽고 뛰기 시작했다.\n" +
                       "등에 진 짐이 무거웠지만, 뒤를 돌아보지 않았다.\n\n" +
                       "\"살려고 하면, 앞으로 가야 한다!\"",
                IsNarration = true
            },
            new()
            {
                Speaker = "완고 (Obstinate)",
                Body = "\"이봐! 어디를 가는 거야?\"\n\n" +
                       "이웃 완고와 유연이 뒤쫓아왔다."
            },
            new()
            {
                Speaker = "크리스천 (Christian)",
                Body = "\"이 도시는 멸망합니다. 나는 천성을 향해 가는 중이오.\""
            },
            // 두 번째 선택지
            new()
            {
                Speaker = "완고 (Obstinate)",
                Body = "\"허튼소리! 돌아가자! 여기가 안전한 집이야!\"",
                Choices = new List<Choice>
                {
                    new() { Text = "\"돌아갈 수 없소. 함께 가시오!\" (설득)", NextIndex = 17 },
                    new() { Text = "\"혼자라도 가겠소.\" (결연)", NextIndex = 18 }
                }
            },
            // 설득 선택
            new()
            {
                Speaker = "유연 (Pliable)",
                Body = "완고는 돌아섰지만, 유연이 말했다.\n\n" +
                       "\"그 천성이라는 곳... 어떤 곳이오? 내가 함께 가겠소.\""
            },
            // 결연 선택
            new()
            {
                Speaker = "유연 (Pliable)",
                Body = "완고는 비웃으며 돌아갔다.\n" +
                       "그러나 유연이 잠시 머뭇거리더니 뒤따라왔다.\n\n" +
                       "\"잠깐, 나도... 나도 가보겠소.\""
            },
            // 합류 → 엔딩
            new()
            {
                Speaker = "",
                Body = "크리스천과 유연은 함께 걸었다.\n" +
                       "크리스천은 천성의 영광에 대해 이야기했고,\n" +
                       "유연은 점점 기대에 부풀었다.\n\n" +
                       "그러나 앞에는 — 절망의 늪이 기다리고 있었다...",
                IsNarration = true
            },
            new()
            {
                Speaker = "",
                Body = "[ 데모 끝 ]\n\n" +
                       "천로역정 — 순례자의 여정\n" +
                       "멸망의 도시에서 시작된 크리스천의 여정은 계속됩니다.\n\n" +
                       "감사합니다.",
                IsNarration = true,
                IsEnding = true
            }
        };
    }

    #endregion

    #region Dialogue Logic

    void ShowNode(int index)
    {
        if (index < 0 || index >= _story.Count) return;

        _currentIndex = index;
        var node = _story[index];

        _locationText.text = node.Location ?? _locationText.text;

        if (node.IsNarration)
        {
            _speakerText.text = "";
            _speakerText.transform.parent.gameObject.SetActive(false);
        }
        else
        {
            _speakerText.text = node.Speaker;
            _speakerText.transform.parent.gameObject.SetActive(true);
        }

        _bodyText.text = node.Body;

        bool hasChoices = node.Choices is { Count: > 0 };
        _choiceContainer.SetActive(hasChoices);
        _continueButton.gameObject.SetActive(!hasChoices && !node.IsEnding);

        if (hasChoices)
        {
            for (int i = 0; i < _choiceButtons.Count; i++)
            {
                if (i < node.Choices.Count)
                {
                    _choiceButtons[i].gameObject.SetActive(true);
                    _choiceTexts[i].text = node.Choices[i].Text;
                    int nextIdx = node.Choices[i].NextIndex;
                    _choiceButtons[i].onClick.RemoveAllListeners();
                    _choiceButtons[i].onClick.AddListener(() => ShowNode(nextIdx));
                }
                else
                {
                    _choiceButtons[i].gameObject.SetActive(false);
                }
            }
        }
    }

    void OnContinue()
    {
        var node = _story[_currentIndex];

        if (node.Choices is { Count: > 0 }) return;

        int next = _currentIndex + 1;
        if (next < _story.Count)
            ShowNode(next);
    }

    #endregion

    #region UI Construction

    void BuildUI()
    {
        var canvasGo = new GameObject("DialogueCanvas");
        _canvas = canvasGo.AddComponent<Canvas>();
        _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        _canvas.sortingOrder = 100;

        _scaler = canvasGo.AddComponent<CanvasScaler>();
        _scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        _scaler.referenceResolution = new Vector2(1920, 1080);
        _scaler.matchWidthOrHeight = 0.5f;

        canvasGo.AddComponent<GraphicRaycaster>();

        // Background
        var bg = CreatePanel(canvasGo.transform, "Background",
            new Color(0.118f, 0.165f, 0.227f, 1f));
        SetAnchors(bg, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);

        // Location bar
        var locBar = CreatePanel(canvasGo.transform, "LocationBar",
            new Color(0.078f, 0.118f, 0.165f, 0.9f));
        SetAnchors(locBar, new Vector2(0, 0.93f), Vector2.one, Vector2.zero, Vector2.zero);
        _locationText = CreateText(locBar.transform, "LocationText",
            "멸망의 도시 (City of Destruction)", 22,
            new Color(0.831f, 0.663f, 0.325f), TextAnchor.MiddleCenter);
        SetAnchors(_locationText.rectTransform, Vector2.zero, Vector2.one,
            Vector2.zero, Vector2.zero);

        // Speaker name plate
        var speakerPlate = CreatePanel(canvasGo.transform, "SpeakerPlate",
            new Color(0.784f, 0.588f, 0.424f, 0.85f));
        SetAnchors(speakerPlate,
            new Vector2(0.05f, 0.42f), new Vector2(0.4f, 0.48f),
            Vector2.zero, Vector2.zero);
        _speakerText = CreateText(speakerPlate.transform, "SpeakerText",
            "", 20, Color.white, TextAnchor.MiddleLeft);
        SetAnchors(_speakerText.rectTransform,
            Vector2.zero, Vector2.one, new Vector2(15, 0), new Vector2(-15, 0));

        // Dialogue box
        var dialogueBox = CreatePanel(canvasGo.transform, "DialogueBox",
            new Color(0.961f, 0.902f, 0.824f, 0.95f));
        SetAnchors(dialogueBox,
            new Vector2(0.05f, 0.08f), new Vector2(0.95f, 0.42f),
            Vector2.zero, Vector2.zero);

        var innerBorder = CreatePanel(dialogueBox.transform, "InnerBorder",
            new Color(0.784f, 0.588f, 0.424f, 0.3f));
        SetAnchors(innerBorder, Vector2.zero, Vector2.one,
            new Vector2(4, 4), new Vector2(-4, -4));

        _bodyText = CreateText(dialogueBox.transform, "BodyText",
            "", 24, new Color(0.231f, 0.184f, 0.184f), TextAnchor.UpperLeft);
        SetAnchors(_bodyText.rectTransform,
            Vector2.zero, Vector2.one, new Vector2(30, 20), new Vector2(-30, -20));
        _bodyText.lineSpacing = 1.4f;

        // Continue button
        var contGo = CreatePanel(canvasGo.transform, "ContinueButton",
            new Color(0.784f, 0.588f, 0.424f, 0.6f));
        SetAnchors(contGo,
            new Vector2(0.8f, 0.09f), new Vector2(0.94f, 0.13f),
            Vector2.zero, Vector2.zero);
        _continueButton = contGo.AddComponent<Button>();
        _continueButton.onClick.AddListener(OnContinue);
        var contText = CreateText(contGo.transform, "ContText",
            "계속 ▶", 18, Color.white, TextAnchor.MiddleCenter);
        SetAnchors(contText.rectTransform, Vector2.zero, Vector2.one,
            Vector2.zero, Vector2.zero);

        // Choice container
        _choiceContainer = new GameObject("ChoiceContainer",
            typeof(RectTransform));
        _choiceContainer.transform.SetParent(canvasGo.transform, false);
        SetAnchors(_choiceContainer.GetComponent<RectTransform>(),
            new Vector2(0.1f, 0.5f), new Vector2(0.9f, 0.88f),
            Vector2.zero, Vector2.zero);
        _choiceContainer.SetActive(false);

        var choiceBg = CreatePanel(_choiceContainer.transform, "ChoiceBg",
            new Color(0, 0, 0, 0.6f));
        SetAnchors(choiceBg, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);

        for (int i = 0; i < 3; i++)
        {
            float yMax = 0.85f - i * 0.35f;
            float yMin = yMax - 0.28f;

            var btnGo = CreatePanel(_choiceContainer.transform, $"Choice{i}",
                new Color(0.961f, 0.902f, 0.824f, 0.9f));
            SetAnchors(btnGo,
                new Vector2(0.05f, yMin), new Vector2(0.95f, yMax),
                Vector2.zero, Vector2.zero);

            var btn = btnGo.AddComponent<Button>();
            var colors = btn.colors;
            colors.highlightedColor = new Color(0.831f, 0.663f, 0.325f, 1f);
            colors.pressedColor = new Color(0.7f, 0.55f, 0.25f, 1f);
            btn.colors = colors;

            var txt = CreateText(btnGo.transform, $"ChoiceText{i}",
                "", 20, new Color(0.231f, 0.184f, 0.184f), TextAnchor.MiddleCenter);
            SetAnchors(txt.rectTransform, Vector2.zero, Vector2.one,
                new Vector2(20, 5), new Vector2(-20, -5));

            _choiceButtons.Add(btn);
            _choiceTexts.Add(txt);
        }
    }

    RectTransform CreatePanel(Transform parent, string name, Color color)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Image));
        go.transform.SetParent(parent, false);
        go.GetComponent<Image>().color = color;
        return go.GetComponent<RectTransform>();
    }

    Text CreateText(Transform parent, string name, string content,
        int fontSize, Color color, TextAnchor alignment)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Text));
        go.transform.SetParent(parent, false);
        var text = go.GetComponent<Text>();
        text.text = content;
        text.fontSize = fontSize;
        text.color = color;
        text.alignment = alignment;
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        text.horizontalOverflow = HorizontalWrapMode.Wrap;
        text.verticalOverflow = VerticalWrapMode.Overflow;
        text.supportRichText = true;
        return text;
    }

    void SetAnchors(RectTransform rt, Vector2 anchorMin, Vector2 anchorMax,
        Vector2 offsetMin, Vector2 offsetMax)
    {
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.offsetMin = offsetMin;
        rt.offsetMax = offsetMax;
    }

    #endregion
}

public class DialogueNode
{
    public string Location;
    public string Speaker;
    public string Body;
    public bool IsNarration;
    public bool IsEnding;
    public List<Choice> Choices;
}

public class Choice
{
    public string Text;
    public int NextIndex;
}
