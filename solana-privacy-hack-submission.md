# Solana Privacy Hack - Submission Form

> **Form URL:** https://solanafoundation.typeform.com/privacyhacksub
> **Form ID:** `ia4wZ2DT`
> **Total Fields:** 11

---

## Field Details

### 1. Project Name
| Property | Value |
|----------|-------|
| **Field ID** | `tZ1nOh8gAhQt` |
| **Question** | "What's the name of your project?" |
| **Type** | Short text |
| **Required** | Yes |
| **Placeholder** | "Type your answer here..." |
| **Helper Text** | — |

---

### 2. Project Description
| Property | Value |
|----------|-------|
| **Field ID** | `7Ny8imJl4fby` |
| **Question** | "Please provide a one-line description of your project" |
| **Type** | Short text |
| **Required** | Yes |
| **Placeholder** | "Type your answer here..." |
| **Helper Text** | — |

---

### 3. GitHub Repository
| Property | Value |
|----------|-------|
| **Field ID** | `h7Hu4FnnP1Tj` |
| **Question** | "Drop a link to your project's GitHub repository:" |
| **Type** | Short text (URL) |
| **Required** | Yes |
| **Helper Text** | "Must be public for the judging period (today until Feb 7)" |

---

### 4. Presentation Video
| Property | Value |
|----------|-------|
| **Field ID** | `qSgAI9VKVs6P` |
| **Question** | "Share a link to a presentation video:" |
| **Type** | Short text (URL) |
| **Required** | Yes |
| **Helper Text** | "4 minutes max \| Please ensure the video is shared publicly so judges can view" |

---

### 5. Live Demo Link
| Property | Value |
|----------|-------|
| **Field ID** | `Zoi3EGnryTH6` |
| **Question** | "Share a link to a live demo (optional):" |
| **Type** | Short text (URL) |
| **Required** | No |
| **Helper Text** | — |

---

### 6. Track Selection
| Property | Value |
|----------|-------|
| **Field ID** | `dJtfiyZ70beA` |
| **Question** | "Which track did you build your project for?" |
| **Type** | Dropdown (single select) |
| **Required** | Yes |
| **Helper Text** | "Only select one option" |

**Options:**
- `Private payments`
- `Privacy tooling`
- `Open track (pool prize)`

---

### 7. Light Protocol Usage
| Property | Value |
|----------|-------|
| **Field ID** | `DHl6Z4KRD9nk` |
| **Question** | "Did you build using Light Protocol?" |
| **Type** | Yes/No |
| **Required** | Yes |
| **Helper Text** | "$3,000 of the Open Track is dedicated to projects built using Light Protocol" |

---

### 8. Sponsor Bounties
| Property | Value |
|----------|-------|
| **Field ID** | `Ph8dXkkU6gZA` |
| **Question** | "Are you submitting for any sponsor bounties? If so, which ones?" |
| **Type** | Multiple choice (checkboxes) |
| **Required** | No |
| **Helper Text** | "Select only the technologies that are directly implemented in your project. Choosing a sponsor bounty without genuinely utilizing their technology will result in disqualification." |

**Options (14 total):**
- [ ] Privacy Cash
- [ ] Radr Labs
- [ ] Anoncoin
- [ ] Arcium
- [ ] Aztec/Noir
- [ ] Inco
- [ ] Helius
- [ ] MagicBlock
- [ ] SilentSwap
- [ ] Quicknode
- [ ] Starpay
- [ ] PNP Exchange
- [ ] Range
- [ ] Encrypt.Trade

---

### 9. Technical Description
| Property | Value |
|----------|-------|
| **Field ID** | `TpwYHOAMGwBT` |
| **Question** | "Please describe your project in technical detail. Include what was built during the hackathon, and be specific about which technologies or sponsor features you have implemented." |
| **Type** | Long text |
| **Required** | Yes |
| **Helper Text** | "Obvious AI-generated answers may result in disqualification" |

---

### 10. Project Roadmap
| Property | Value |
|----------|-------|
| **Field ID** | `Cug1cEeuiOwC` |
| **Question** | "What's next on the roadmap for {{project_name}}?" |
| **Type** | Long text |
| **Required** | Yes |
| **Helper Text** | — |
| **Note** | Uses dynamic field reference to project name from field 1 |

---

### 11. Telegram Handle
| Property | Value |
|----------|-------|
| **Field ID** | `kdZLPYvz7X7I` |
| **Question** | "What's your Telegram handle so we can contact you?" |
| **Type** | Short text |
| **Required** | Yes |
| **Helper Text** | "If you are in a team, please only leave one Telegram handle" |

---

## Form Logic Rules

| Condition | Action |
|-----------|--------|
| Track = "Open track (pool prize)" | Jump to Light Protocol question (#7) |
| Track = "Private payments" or "Privacy tooling" | Skip to Sponsor Bounties question (#8) |

---

## Submission Checklist

- [ ] Project name finalized
- [ ] One-line description written
- [ ] GitHub repo is **public** (until Feb 7)
- [ ] Video recorded (under 4 min) and uploaded publicly
- [ ] Track selected
- [ ] Light Protocol usage confirmed (if Open Track)
- [ ] Technical description complete (no AI-generated content)
- [ ] Roadmap outlined
- [ ] Telegram handle provided
- [ ] (Optional) Live demo deployed
- [ ] (Optional) Sponsor bounties selected (only if genuinely using their tech)

---

## Raw Form Data

```json
{
  "formId": "ia4wZ2DT",
  "title": "Solana Privacy Hack Submissions",
  "type": "quiz",
  "fields": [
    {
      "id": "tZ1nOh8gAhQt",
      "title": "What's the name of your project?",
      "type": "short_text",
      "required": true
    },
    {
      "id": "7Ny8imJl4fby",
      "title": "Please provide a one-line description of your project",
      "type": "short_text",
      "required": true
    },
    {
      "id": "h7Hu4FnnP1Tj",
      "title": "Drop a link to your project's GitHub repository:",
      "type": "short_text",
      "required": true,
      "description": "Must be public for the judging period (today until Feb 7)"
    },
    {
      "id": "qSgAI9VKVs6P",
      "title": "Share a link to a presentation video:",
      "type": "short_text",
      "required": true,
      "description": "4 minutes max | Please ensure the video is shared publicly so judges can view"
    },
    {
      "id": "Zoi3EGnryTH6",
      "title": "Share a link to a live demo (optional):",
      "type": "short_text",
      "required": false
    },
    {
      "id": "dJtfiyZ70beA",
      "title": "Which track did you build your project for?",
      "type": "dropdown",
      "required": true,
      "description": "Only select one option",
      "choices": [
        { "label": "Private payments" },
        { "label": "Privacy tooling" },
        { "label": "Open track (pool prize)" }
      ]
    },
    {
      "id": "DHl6Z4KRD9nk",
      "title": "Did you build using Light Protocol?",
      "type": "yes_no",
      "required": true,
      "description": "$3,000 of the Open Track is dedicated to projects built using Light Protocol"
    },
    {
      "id": "Ph8dXkkU6gZA",
      "title": "Are you submitting for any sponsor bounties? If so, which ones?",
      "type": "multiple_choice",
      "required": false,
      "allow_multiple_selections": true,
      "description": "Select only the technologies that are directly implemented in your project. Choosing a sponsor bounty without genuinely utilizing their technology will result in disqualification.",
      "choices": [
        { "label": "Privacy Cash" },
        { "label": "Radr Labs" },
        { "label": "Anoncoin" },
        { "label": "Arcium" },
        { "label": "Aztec/Noir" },
        { "label": "Inco" },
        { "label": "Helius" },
        { "label": "MagicBlock" },
        { "label": "SilentSwap" },
        { "label": "Quicknode" },
        { "label": "Starpay" },
        { "label": "PNP Exchange" },
        { "label": "Range" },
        { "label": "Encrypt.Trade" }
      ]
    },
    {
      "id": "TpwYHOAMGwBT",
      "title": "Please describe your project in technical detail. Include what was built during the hackathon, and be specific about which technologies or sponsor features you have implemented.",
      "type": "long_text",
      "required": true,
      "description": "Obvious AI-generated answers may result in disqualification"
    },
    {
      "id": "Cug1cEeuiOwC",
      "title": "What's next on the roadmap for {{field:tZ1nOh8gAhQt}}?",
      "type": "long_text",
      "required": true,
      "ref": "tZ1nOh8gAhQt"
    },
    {
      "id": "kdZLPYvz7X7I",
      "title": "What's your Telegram handle so we can contact you?",
      "type": "short_text",
      "required": true,
      "description": "If you are in a team, please only leave one Telegram handle"
    }
  ],
  "logic": [
    {
      "type": "field",
      "ref": "dJtfiyZ70beA",
      "actions": [
        {
          "condition": { "op": "equal", "value": "Open track (pool prize)" },
          "action": { "type": "jump", "to": "DHl6Z4KRD9nk" }
        },
        {
          "condition": { "op": "always" },
          "action": { "type": "jump", "to": "Ph8dXkkU6gZA" }
        }
      ]
    }
  ],
  "settings": {
    "is_public": true,
    "progress_bar": "proportion"
  }
}
```

---

*Scraped from Typeform on January 31, 2026*
