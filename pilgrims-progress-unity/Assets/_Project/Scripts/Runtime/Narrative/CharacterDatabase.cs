using System.Collections.Generic;
using UnityEngine;

namespace PP.Narrative
{
    [CreateAssetMenu(fileName = "CharacterDatabase", menuName = "PP/Character Database")]
    public class CharacterDatabase : ScriptableObject
    {
        [SerializeField] private List<CharacterDataSO> _characters = new();

        private Dictionary<string, CharacterDataSO> _lookup;

        public bool TryGet(string speakerId, out CharacterDataSO data)
        {
            BuildLookup();
            return _lookup.TryGetValue(speakerId, out data);
        }

        public CharacterDataSO Get(string speakerId)
        {
            BuildLookup();
            return _lookup.TryGetValue(speakerId, out var data) ? data : null;
        }

        private void BuildLookup()
        {
            if (_lookup != null) return;
            _lookup = new Dictionary<string, CharacterDataSO>();
            foreach (var c in _characters)
            {
                if (c != null && !string.IsNullOrEmpty(c.Id))
                    _lookup[c.Id] = c;
            }
        }

        private void OnEnable()
        {
            _lookup = null;
        }
    }
}
