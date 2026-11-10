# Family Hub

A glassy, themeable family planner card for Home Assistant wall panels.

- Week / day / month planner from your Home Assistant calendars
- Five themes: Sea & Sun, Cottesloe Sunset, Coral Reef, Aussie Bush, Space Mission
- Weather, who's home, now playing, kitchen timer, reminders
- All lights on / off, announcement button, night mode photo-frame clock
- Looks: switch the whole design language from the palette button – Glass (the original, with photo themes), Fridge door (sticky notes and magnets) or Orbit (dark, built from rings). Set a default with `look: fridge` in the card config.
- Per-child settings (palette button on a child's page, behind the parent PIN): his own look, print or handwriting, one job at a time (Now / Next / Later), calm mode and sound level. Defaults can be set per kid in the config: `look_id`, `font`, `focus`, `calm`, `sound_level`.
- Morning board shows team progress (one row of stars everyone fills together), never child against child.
- Calm mode: on the kids' pages looping motion runs once and tilted cards sit straight. `calm: true` applies it everywhere, `calm: false` turns it off.
- Looks stay linked to the base through a small contract (`HOOKS` in `src/looks.ts`), checked on every build by `npm run check:looks`. `preview/index.html` and `npm run shots` show every screen in every look with sample data.
- Kid pages: chores with points, streaks, levels, rewards (optional parent PIN), their own week
- Avatars with 70+ unlockable items (hair, hats, sunnies, tops, gear, buddies, scenes) and an animated style studio
- Groceries with an on-screen keyboard, aisle sorting and send-to-phone
- Home: rooms, devices, scenes and automations · Music: every speaker plus internet radio
- Doodle pad with a shared "fridge" gallery · rotating photo backgrounds · returns to the planner when idle

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
  - name: Riley
    colour: 3
    mode: text                # picture (pre-readers) | mixed | text
    # entities default to todo.riley_chores, input_number.riley_points,
    # input_number.riley_lifetime_points, input_number.riley_streak, input_text.riley_avatar, calendar.riley
    rewards:
      - { name: Extra screen time, cost: 50, icon: "🎮" }
    favourites: [skateboard, footy]   # shown first as the next unlock
parent_pin: "1234"            # optional: guards rewards, locks and automations
music_players: [media_player.kitchen, media_player.lounge]
radio:                        # names to match, or { name, id } with a Radio Browser station uuid
  - ABC Jazz
radio_source: media-source://radio_browser/country/AU
photos: media-source://media_source/local/photos   # optional background slideshow
photo_minutes: 10
idle_seconds: 180
private: [medication]          # matching events become a discreet chip
meds: [{ id: riley_am, who: Riley, label: Morning dose, time: "07:00" }]   # input_datetime.fh_med_<id> + input_text.fh_med_<id>_by
parents: [Alex, Sam]
school_terms: [["2026-10-12", "2026-12-17"]]
public_holidays: ["2026-12-25"]
morning: { start: "06:30", end: "08:45", leave_by: "08:15" }   # "Out the door" on school days
bring_rules: [{ match: swim, item: Swim bag }]
jar: { target: 120, reward: pizza night }   # input_number.family_jar
all_on: [light.lounge]
quiet: { start: "20:00", end: "06:30" }
add_calendar: calendar.family
babysitter: { title: House info, lines: ["Bedtime 7:30"] }
calendars:
  - { entity: calendar.family, colour: family, name: Family }
  - { entity: calendar.riley, colour: 3, name: Riley }
```

Chore items are to-do list items whose description holds their points, e.g. `+10`. A nightly automation that
re-opens completed chores and updates streaks keeps things fresh each day.

### Chore tags

Put tags in each to-do item's description:

- `@routine` with `@am`, `@after` or `@bed`: checklists (no points unless `+N` is given, e.g. for pre-readers)
- `+10 @job`: family jobs that earn points and add a marble to the family jar
- `@grow`: practice, reading, homework; logged rather than paid, with surprise unlocks ("20 min" in the name adds a timer)

Points are added by a queued Home Assistant script (`script.fh_add_points`), so quick taps and several devices never lose points.

All personal details live in your Home Assistant configuration, never in this repo.

## Develop

```bash
npm install
npm run build   # → dist/family-hub.js
```
