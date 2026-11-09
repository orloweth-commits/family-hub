# Family Hub

A glassy, themeable family planner card for Home Assistant wall panels.

- Week / day / month planner from your Home Assistant calendars
- Five themes: Sea & Sun, Cottesloe Sunset, Coral Reef, Aussie Bush, Space Mission
- Weather, who's home, now playing, kitchen timer, reminders
- All lights on / off, announcement button, night mode photo-frame clock

## Install (HACS)

1. HACS → ⋮ → **Custom repositories** → add this repo's URL, category **Dashboard**.
2. Install **Family Hub**, then reload the browser.
3. Create a dashboard with a **Panel** view and add the card.

## Configuration

```yaml
type: custom:family-hub-card
family_name: Smiths
theme: sea                    # sea | sunset | reef | bush | space
weather: weather.home
music_player: media_player.living_room
reminders: todo.reminders
announce_script: script.dinners_ready
night: { start: "21:00", end: "06:00" }
people:                       # colour: 1–5 or family
  - { name: Alex, entity: person.alex, colour: 1 }
  - { name: Sam, entity: person.sam, colour: 2 }
kids:
  - { name: Riley, colour: 3 }
calendars:
  - { entity: calendar.family, colour: family, name: Family }
  - { entity: calendar.riley, colour: 3, name: Riley }
```

All personal details live in your Home Assistant configuration, never in this repo.

## Develop

```bash
npm install
npm run build   # → dist/family-hub.js
```
