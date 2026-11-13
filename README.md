# Family Hub

A glassy, themeable family planner card for Home Assistant wall panels.

- Week / day / month planner from your Home Assistant calendars
- Five themes: Sea & Sun, Cottesloe Sunset, Coral Reef, Aussie Bush, Space Mission
- Weather, who's home, now playing, kitchen timer, reminders
- All lights on / off, announcement button, night mode photo-frame clock
- Looks: switch the whole design language from the palette button – Glass (the original, with photo themes), Fridge door (sticky notes and magnets), Orbit (dark, built from rings) or Home Ground (`sports`: a local clubhouse on a quiet morning, with mown lanes for the week, a scoreboard that only shows the time, people in bibs with their initials, a different ball each day, and floodlights in the evening; all drawn as plain generic objects, and nothing ever compares one child with another). Set a default with `look: fridge` in the card config.
- Per-child settings (palette button on a child's page, behind the parent PIN): his own look, print or handwriting, one job at a time (Now / Next / Later), calm mode and sound level. Defaults can be set per kid in the config: `look_id`, `font`, `focus`, `calm`, `sound_level`.
- Morning board shows team progress (one row of stars everyone fills together), never child against child. Time is shown once, for the whole family: one clock that empties towards the next time anyone leaves, with the minutes left and the time in numerals and words. A column says when its own child leaves, with no bar and no count.
- A child’s rank is shown on that child’s own page and nowhere else.
- Calm mode: on the kids' pages looping motion runs once and tilted cards sit straight. A child’s calm setting goes with him to the Music page when Music is opened from his page (nothing loops; records stand still). `calm: true` applies it everywhere, `calm: false` turns it off.
- Looks stay linked to the base through a small contract (`HOOKS` in `src/looks.ts`), checked on every build by `npm run check:looks`. `preview/index.html` and `npm run shots` show every screen in every look with sample data.
- Looks restyle text through type roles and weight tokens rather than fixed sizes, and never use `!important` (the look check refuses it). Each look can also add drawings of its own: Orbit shows the day view as a clock face with the list beside it, and each look has its own night clock.
- Colour is never the only cue for a person: chips carry an initial as well (kept distinct when two names start alike).
- Fonts ship with the card in `dist/fonts` and load from beside `family-hub.js`. Nothing is fetched from a font service. If you copy the card by hand, copy the `fonts` folder next to it (without it the panel falls back to the device's own font).
- Fits the screen it is on: the panel is drawn on a fixed canvas and scaled up or down so nothing is cut off, portrait tablets get a stacked arrangement, and long lists tighten (closer rows, then extra columns) before they ever scroll. `scale: 1.2` in the config overrides the automatic size. Below tablet width (600 px) the card switches to a phone arrangement: one scrolling column, the dock fixed along the bottom, the day view by default, and the phone's own keyboard instead of the on-screen one. Those rules are keyed to `data-phone` and never apply to larger screens.
- Kid pages: chores with points, streaks, levels, rewards (optional parent PIN), their own week
- Avatars with 70+ unlockable items (hair, hats, sunnies, tops, gear, buddies, scenes) and an animated style studio
- Groceries with an on-screen keyboard, aisle sorting and send-to-phone
- Home: rooms, devices, scenes and automations
- Music (best with Music Assistant): one search across every connected service with play now / play next / queue / radio-from-this; rooms as a mixer (add rooms, a volume each, Everywhere, move the music); up next, favourite and shuffle; a shelf of pinned favourites per child that plays on their own speaker; a take-turns jukebox; radio; and "Call a room", which speaks a message over the music. Without Music Assistant the page keeps rooms, radio and Call a room.
  - The Rooms tab can show the rooms six ways, chosen from a picker and remembered per device: **House** (floors and rooms from `music_map`), **Scene** (the theme draws the rooms: boats, fish, campfires, kites and magnets float free, and bringing two together shares the music; in Space and Orbit each piece of music has its own orbit and its rooms circle on it; the shelf is drawn into each world as buoys, shells, a constellation, lanterns, beach balls or pegged-up photos, to carry to a room or to the music), **Dial** (an arc per room round one big knob, with what plays next, whose turn it is to choose, a sleep fade, and a tuner to slide across favourites and stations), **Desk** (a fader per room, a jog wheel that moves through the song, and four moment pads), **Crate** (flick through a crate of records with a divider per person, drop one on the turntable or a speaker, and plug speakers in with cables) and **List**. The House has the shelf beside it and a place to drop music for the whole house. In every one a drag changes a room's volume and a tap adds the room to the music.
  - With a `music_map`, the Music page shows only the speakers it names: a speaker discovered somewhere else never appears, and one that cannot be reached keeps its place, marked offline, with a note saying how many are. Set `music_lock: false` to go back to listing every speaker found.
  - Shelves are to-do lists named `todo.family_music` and `todo.<child>_music`. Each item's name is the title and its description is `uri | picture url | @calm`. Pin from a search result (behind the PIN) or edit the list in Home Assistant. During a child's wind-down their shelf offers only `@calm` items and fades out after `music_sleep_minutes` (default 30).
  - The moment pads on the Desk come from `music_moments` (up to four). Each has a `name` and either `find` (searched for; a playlist unless `kind` says otherwise) or a `uri`, and optionally `rooms` (speakers: the first leads and the rest join it; without them it plays in the room in focus), `volume` (0–100), `shuffle` and `icon`. Without the setting the pads are Dinner, Dance, Tidy-up and Wind down, each searching by name. `rooms: all` plays in every room. A pad that plays in a bedroom after bedtime asks for the PIN. Any search result can also be put on a pad from its Pin sheet (behind the PIN): that replaces what the pad plays on that device and keeps its rooms and volume; ↺ puts it back.
    ```yaml
    music_moments:
      - { name: Dinner, find: "dinner jazz", rooms: [media_player.lounge], volume: 25 }
      - { name: Wind down, find: "sleep sounds", rooms: [media_player.kids_room], volume: 15 }
    ```
  - After a child’s bedtime their bedroom is asleep: anything that would start music there (adding the room, a record, the play key, Radio, Search, a pad, moving music there) asks for the parent PIN first. Pausing, turning down and taking the room out never ask. Music for the whole house (Whole house, a pad for all rooms, a record dropped on the whole house) and Call a room (the parents’ room included) are free by day. After bedtime they ask for the parent PIN, and the pad says why. “After bedtime” is one test, the same one Ask and All on use: the `quiet` hours, or from any child’s bedtime until the quiet hours end. A typed message to a room always asks. Three wrong PINs rest the pad for a minute.
  - Whole house and the jukebox’s Clear can be undone from the message that follows. A second tap on Sleep fade cancels it. A jukebox turn starts with pictures (that person’s shelf, then the family’s), with Search beside them; the jukebox shows whose turn is next, not a count of turns. Calm mode stops every looping animation.
  - Call a room speaks in `call_language` (default `en-AU`; add `call_voice` for one of that language's voices, e.g. `NatashaNeural` with Home Assistant Cloud) and, on Music Assistant speakers, at `call_volume` (0–100, default 70) whatever the room's music is set to. Other speakers say it at their own volume.
  - The sleep fade uses `script.fh_music_sleep` (fields `player`, `minutes`) if it exists, otherwise the Sonos sleep timer.
  - A timed job tagged `@song` (e.g. "Tidy toys 3 min", description `+10 @job @song`) gets a play button: `tidy_song` (card or per child) plays on the child's speaker until the time is up.
  - A reward with `dj: true`, or named like "DJ" or "dinner music", makes that child tonight's DJ: their jukebox picks play first.
  - `speaker:` on a child sets their speaker; by default it is the room whose name contains theirs.
- Life behind the page, one illustrated world per look and theme (`src/scenes/`): a West Australian beach (sea and sunset), a Ningaloo-style reef, the bush, space (also the Orbit look, in luminous line) and the Fridge door itself. Each has slow life that is always there and follows the clock and the season (clouds, a sun that crosses the sky, light shafts, swaying grass, planets on their orbits, window light across the fridge) and about thirty visitors that wander through one at a time, every half-minute to a minute and a half: gulls and a chip thief, a dugong, a kangaroo with a joey, a saucer that beams up a cow, ants carrying a pizza on Fridays. A few small ones cross in front of the page. It never takes a touch; calm mode or the device's "reduce motion" setting switches it all off, and `ambient: false` turns it off altogether. `&guest=<id>` in the preview shows a visitor straight away.
- Small effects on the things you touch (`src/sparks.ts`): a tick, points, a finished list (footprints by day, a moon at bedtime), a ute delivering the last grocery item, a rocket when the kitchen timer starts, a marble into the family jar, a trumpet or clarinet flourish when practice is ticked. Each has a form per look and a still form for calm mode. `preview/sparks.html` shows them all.
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
music_hide: [media_player.tv]   # optional: speakers to leave off the Music page
music_map:                    # optional: the house as the Music page draws it, top floor first
  - name: Upstairs
    rooms:
      - { name: Main bedroom, player: media_player.bedroom, size: 2 }
      - { name: Kids’ room, player: media_player.kids_room, kids: [Riley] }   # quiet after that child’s bedtime
  - name: Downstairs
    rooms:
      - name: Kitchen and lounge                 # one open room, two speakers
        zones:
          - { name: Kitchen, player: media_player.kitchen }
          - { name: Lounge, player: media_player.lounge }
      - { stairs: true }
      - { name: Office, player: media_player.office }
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
keep_on: [light.hallway_night, light.fish_tank]   # "All off" leaves these on (and everything in a group named here), and says how many it kept on
quiet: { start: "20:00", end: "06:30" }
sounds: true                        # touch sounds from the panel's own speaker: true, "quiet" (softer) or false; the kitchen timer always sounds
add_calendar: calendar.family
babysitter: { title: House info, lines: ["Bedtime 7:30"] }
calendars:
  - { entity: calendar.family, colour: family, name: Family }
  - { entity: calendar.riley, colour: 3, name: Riley }
```

### House info, emergency button, medication and bin night

```yaml
babysitter:                   # the "i" button: house info for sitters, grandparents and visitors
  address: 1 Example Street, Sampleton
  lines:                      # "Name: number" becomes a contact; anything else is a note
    - "Mum: 0400 000 001"
    - "Torch and first-aid kit are in the laundry cupboard"
  wifi: { name: Example-Guest, password: welcome-in }
emergency:                    # a red hold-to-send button on that sheet
  notify: [notify.mobile_app_mums_phone, notify.mobile_app_dads_phone]
  who: Mum and Dad
meds:                         # the pill button: daily medication, ticked off by a grown-up
  - { id: riley_am, who: Riley, label: Morning dose, time: "06:30" }
med_log: todo.medicine_record # where "something else given" (paracetamol and the like) is kept; without it, on this screen only
bins: { day: 1, always: [green], alternate: [yellow, red], anchor: "2026-11-09" }   # Monday; yellow went out on the anchor date
address_search: true          # look places up while adding an event (Photon, OpenStreetMap data, Australia only)
```

The emergency button must be held for a second and a half, then sends a critical alert (it sounds through silent mode) to each phone through the Home Assistant app. Each daily medication needs two helpers: `input_datetime.fh_med_<id>` and `input_text.fh_med_<id>_by`. The medication record shows what was given and when; it gives no advice on doses.

### Ask: a chat for the children

```yaml
chat:                         # the speech-bubble button in the header; without this there is no button
  agent: conversation.kids_helper   # a conversation agent in Home Assistant
  pipeline: 01abcdefexamplepipelineid   # optional: an Assist pipeline id, for talking instead of typing
  name: Ask                   # what the helper is called
  pin_after_bedtime: true     # after any child's bedtime and in quiet hours, ask for the parent PIN first
```

A sheet with big speech bubbles, six picture buttons a child who cannot read yet can tap, the on-screen keyboard and, with a `pipeline`, a microphone button. What the helper may talk about and how it speaks to a child are its own instructions in Home Assistant, on the agent: write them for your children there. The card sends only the child's words (never names or a location), reads answers aloud unless that is switched off, closes itself after three quiet minutes, and keeps the last 30 questions and answers on that screen only, behind the PIN ("For grown-ups"). The microphone needs a secure page (https or the Home Assistant app); elsewhere the sheet says so and typing still works. After bedtime with no `parent_pin` set, the chat stays shut until morning.

### Weather page

With `weather:` set, the dock gains a **Weather** page (and the weather chip in the header opens it): what it is doing now, the next 24 hours, a seven-day outlook, a rain radar and a wind map, drawn in the language of whichever look and world is on.

It works with any weather entity. With the [Bureau of Meteorology integration](https://github.com/bremor/bureau_of_meteorology) installed it also finds that integration's sensors by itself (feels-like, gusts, rain since 9 am, UV and sun-protection times, fire danger, sunrise and sunset, the Bureau's own words for the day, and warnings).

```yaml
weather: weather.my_suburb
weather_page:                 # all optional; `weather_page: false` leaves the page out
  hourly: weather.my_suburb_hourly   # found by itself when it is called <weather>_hourly
  observations: my_town       # prefix of sensor.my_town_temp_feels_like and friends
  forecast: my_suburb         # prefix of sensor.my_suburb_uv_max_index_0 and friends
  warnings: sensor.my_suburb_warnings
  radar: true                 # rain radar: RainViewer pictures over an Esri map
  wind: true                  # wind map: an embedded Windy map
  zoom: 6                     # radar zoom to start at, 4 to 7
```

The radar and wind maps load from the internet. The radar only ever asks for map squares a few hundred kilometres across, and the wind map is centred on your location rounded to a tenth of a degree (about 10 km), so the address of the house is not sent to either.


Chore items are to-do list items whose description holds their points, e.g. `+10`. A nightly automation that
re-opens completed chores and updates streaks keeps things fresh each day.

### Settings (for parents)

Most of the configuration can be changed on the panel itself. Open the house-info sheet (the "i" button) and tap the cog. It asks for the parent PIN every time, except within a minute of the last time; with no PIN yet, its first step is setting one.

- **Children** (one at a time): name, colour, reading mode, bedtime, what the child's page starts with (look, calm mode, sounds), and the child's jobs and routines. Jobs live in Home Assistant to-do lists, so they are changed there straight away, with form fields in place of the tags below.
- **Rewards**: each child's rewards (name, picture, cost, whether it needs the PIN) and the family jar.
- **Morning**: when the "Out the door" board shows, leaving times, travel time, the morning routine, things to bring by day, school terms and holidays.
- **Medicines**: each medicine's name, who it is for and its time, and the names offered under "something else given". A medicine is only a name and a time: there is nowhere to write an amount. A new medicine needs two helpers in Home Assistant (`input_datetime.fh_med_<id>` and `input_text.fh_med_<id>_by`); Settings lists them and can make them for an administrator.
- **PIN**: change the PIN, and choose whether recording medicine and Ask after bedtime need it.
- **House**: night screen and quiet hours, bin night, what "All off" leaves on (`keep_on`), the look, background and sounds a screen starts with, calm mode.
- **Music**: the moment pads, the sleep timer, call volume.
- **People and safety**: parents' names, the house-info page, the alert button's phones (a test is sent only after a second, explicit tap), Ask's name.
- **Advanced**: the wiring (calendars, lists, speakers, scripts), read-only, and "Restore an earlier version".

How saving works: each pane has one Save. The card's configuration is checked with the same rules the card applies when it loads, then written back into the dashboard that hosts the card (`lovelace/config/save`), and the card on that screen takes the new configuration at once. Other screens pick it up when they next load the dashboard (Home Assistant offers "Refresh").

Settings can save only when the person signed in is a Home Assistant **administrator** and the dashboard is kept in the UI (storage mode). A wall panel signed in as an ordinary user, or a YAML dashboard, shows Settings read-only and says why.

Safety net: before every save the card is kept as it was. The last five versions are kept on that screen (browser storage) and the single previous version in the dashboard itself, under the top-level key `family_hub_previous` (safe to delete). The PIN is left out of every kept copy. The toast after a save offers Undo, and Advanced lists the earlier versions to restore.

New options that Settings writes: `bedtime_weekend_extra` (minutes later on Friday and Saturday nights, default 30) and, on a child, `id` (the name the child's helpers were made under, written when a child is renamed so the helpers stay his).

### Chore tags

Put tags in each to-do item's description:

- `@routine` with `@am`, `@after` or `@bed`: checklists (no points unless `+N` is given, e.g. for pre-readers)
- `+10 @job`: family jobs that earn points and add a marble to the family jar
- `@grow`: practice, reading, homework; logged rather than paid, with surprise unlocks ("20 min" in the name adds a timer, shown as a shrinking wedge)
- A picture for a job (used in picture and mixed modes): start the item's name with an emoji, e.g. `🦷 Brush teeth`, or add `@icon:🦷` to the description. Without one, the card picks a picture from the words in the name.

Points are added by a queued Home Assistant script (`script.fh_add_points`), so quick taps and several devices never lose points.

All personal details live in your Home Assistant configuration, never in this repo.

## Develop

```bash
npm install
npm run build   # → dist/family-hub.js (type check, look check, bundle)
```

Checks that need Playwright (not a dependency of the card) run against `preview/index.html`, an invented family and house with mocked speakers and music search:

```bash
export PLAYWRIGHT=/path/to/playwright/index.mjs CHROME=/path/to/chrome   # CHROME is optional
npm run test:fit     # every page at wall, laptop, tablet and portrait sizes: reports scrolling, clipping, off-screen controls
npm run test:click   # base panel and Music page click tests; each action asserts the service call it makes
npm run test:phone   # phone arrangement at 390x844
npm run shots        # screenshots of every look on every screen → preview/shots/
```
