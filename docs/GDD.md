# Still Out There: Game Design Document

*Abandoned, but not forgotten.*

Version 2.0 · Remake of “Lost, Not Forgotten” v1.0 · Draft for team review · 9 November 2026

> **Read this first.**
>
> **1. AI-assisted draft.** Written with Claude from the team’s collection sheet, the Moon and Mars JSON files and data.zip. Log it on the SI Log tab and have a human review every section.
>
> **2. Timing.** The collection sheet notes that the Space Apps guide asks teams not to start project work before 14 Nov, 9:00 AM local time. Ask your Local Lead whether planning documents count, and hold this one if they do.
>
> **3. Not independently verified.** Facts here come from the team’s files, and Section 14 lists conflicts between them. Every entry still needs the NASA-source check in Section 13.

## 1. Project overview

### 1.1 High concept

Still Out There is a browser game about the machines humans have left on the Moon and Mars. A small robot travels to 17 real NASA sites. At each one it finds a machine, completes a short jetpack landing challenge, and unlocks a sourced Archive entry that explains what the machine was, what it did, and where it stands today.

The game carries the storytelling. The Archive carries the proof. Every claim a player can read is tied to a NASA source, and the robot’s fiction is always kept separate from the facts.

### 1.2 Challenge theme

“Abandoned but not forgotten: storytelling about NASA’s discarded equipment on the Moon and Mars.” The game’s tagline is **“Abandoned, but not forgotten.”** The title, *Still Out There*, covers both sides of the theme: machines left behind, and machines that are still working.

### 1.3 What changed from v1.0

| Topic | v1.0 | v2.0 |
| --- | --- | --- |
| Name and tagline | Lost, Not Forgotten: “Lost, but not forgotten.” | Still Out There: “Abandoned, but not forgotten.” |
| Subject | Space-history artifacts in general, including Soviet craft | NASA equipment only |
| Content | 3 unverified candidate artifacts | 17 curated entries (8 Moon, 9 Mars) with coordinates and source links |
| Story | Robot with corrupted memories | Robot follows echoes to real sites; machines are described in short, source-bound first-person lines |
| World | Invented lunar regions | Real coordinates, a hub map and small site scenes |
| Labels | Four classifications | Five statuses: active, dormant, ended, lost, drifting |
| Mars | Future expansion | In scope (Target level) |
| Stack | Phaser 3, TypeScript recommended | TypeScript required; Phaser version to confirm (Section 12) |
| Sourcing | General editorial checklist | A source URL for every fact; writer and verifier must differ |

### 1.4 Product definition

| Category | Definition |
| --- | --- |
| Working title | Still Out There |
| Tagline | Abandoned, but not forgotten. |
| Genre | Educational exploration game with a physics-based landing challenge |
| Platform | Responsive website (desktop, tablet and mobile browsers) |
| Language | English first; all text kept in data files so it can be translated later |
| Visual style | 16-bit pixel art in the world; real NASA images, credited, in the Archive |
| Cameras | Top-down 2D for exploration; side-view 2D for landing challenges |
| Worlds | Moon, then Mars |
| Content | 17 entries: 8 Moon, 9 Mars |
| Accounts and data | No accounts; progress saved on the device only |
| Core verbs | Listen, travel, discover, land, learn, archive |

### 1.5 Design pillars

| Pillar | Intention |
| --- | --- |
| Truth first | Every fact is sourced, dated and checked by a second person. |
| Story through objects | Each machine gets a short, plain-language story: what it was, what it did, where it is now. |
| Exploration | Real places, readable maps and clear signals. |
| Fair challenge | A short landing challenge that is winnable, retryable and never blocks learning. |
| Learning as reward | Reading an entry is what the player wins. |

### 1.6 Audience

- Students and young learners. Entry summaries are written at about a grade 4 to 5 reading level, as the collection sheet specifies.
- Space and science enthusiasts.
- Casual players who enjoy exploring and collecting.
- Educators and challenge reviewers who want to check the sources.

### 1.7 Design philosophy

> Education should feel like a reward for curiosity, not an interruption to play. And no fun fact is worth an unverified claim.

## 2. Scope and content strategy

### 2.1 NASA equipment only

`moon-objects.json` lists 88 objects from NASA’s Catalogue of Manmade Material on the Moon. Of these, 57 are flagged as in NASA project scope and 31 are not (22 Soviet, 5 Japanese, 2 Indian, 1 Chinese, 1 European). The 31 stay out of the game. That includes Lunokhod 1, which was a candidate in v1.0. Other nations’ missions can return later as an optional extension.

`mars-landing-sites.json` lists 10 Mars sites with landing dates, coordinates and a source type for each. Three of them (InSight, Perseverance and Mars Polar Lander) rely on non-NASA pages for coordinates, and those pages must be replaced with NASA or JPL sources.

These two files are lookup layers. The 17 entries group them: one entry can cover several catalogue lines, such as the descent stage, instruments and rover at an Apollo site.

### 2.2 The 17 entries

| # | Entry ID | Name | World | Tier | Draft status | Markers |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | apollo-11-site | Apollo 11 landing site (Eagle descent stage, instruments) | Moon | Flagship | dormant | 1 |
| 2 | apollo-15-lrv | Apollo 15 Lunar Roving Vehicle | Moon | Flagship | dormant | 1 |
| 3 | surveyor-3 | Surveyor 3 | Moon | Flagship | dormant | 1 |
| 4 | apollo-12-site | Apollo 12 landing site | Moon | Standard | dormant | 1 |
| 5 | apollo-17-site | Apollo 17 landing site | Moon | Standard | dormant | 1 |
| 6 | apollo-retroreflectors | Apollo laser retroreflectors | Moon | Standard | active | 3 |
| 7 | blue-ghost-1 | Blue Ghost Mission 1 | Moon | Standard | ended | 1 |
| 8 | im-1-odysseus | IM-1 Odysseus | Moon | Standard | dormant | 1 |
| 9 | sojourner-pathfinder | Sojourner / Pathfinder | Mars | Flagship | ended | 1 |
| 10 | spirit-opportunity | Spirit and Opportunity | Mars | Flagship | ended | 2 |
| 11 | ingenuity | Ingenuity helicopter | Mars | Flagship | ended | 1 |
| 12 | viking-1-2 | Viking 1 and 2 landers | Mars | Standard | ended | 2 |
| 13 | phoenix | Phoenix lander | Mars | Standard | ended | 1 |
| 14 | insight | InSight lander | Mars | Standard | ended | 1 |
| 15 | mars-polar-lander | Mars Polar Lander | Mars | Standard | lost | 1 |
| 16 | curiosity | Curiosity rover | Mars | Standard | active | 1 |
| 17 | perseverance-landing-hardware | Perseverance landing hardware (heat shield, parachute, descent stage) | Mars | Standard | dormant | 1 |

Statuses are drafts from the collection sheet and must each be checked on a NASA page. That makes 10 Moon markers and 11 Mars markers in total.

### 2.3 How to read the table

- **Tiers.** The 6 flagship entries get the most polish: best images, richest story, built first. The 11 standard entries follow the same pipeline with less custom art.
- **Two entries are drafted as active:** the Apollo retroreflectors and Curiosity. The game must never call an active machine abandoned. Every entry shows a status badge, and the theme holds: some machines are silent, some are still working, all are still out there.
- **Multi-marker entries.** Viking, Spirit and Opportunity each get one entry and one page with two map markers. The Apollo retroreflectors need three (Apollo 11, 14 and 15), but the collection sheet has room for only two markers, so the data format must allow a list of any length (Section 8).

### 2.4 Scope levels

| Level | What ships |
| --- | --- |
| **Core** (must ship) | Hub maps for the Moon and Mars with all markers. An Archive with all 17 entries, fully sourced and through the quality gate in Section 13. A playable Moon loop (site scenes and landing challenges) for the three Moon flagships: Apollo 11, Apollo 15 rover, Surveyor 3. Save and restore, desktop and touch controls, accessibility basics. |
| **Target** | All 8 Moon entries playable. Mars unlocks, with the three Mars flagships playable: Pathfinder, Spirit and Opportunity, Ingenuity. |
| **Stretch** | All 17 entries playable. Sound design. A short “Beyond” tier for deep-space probes (Section 16). Extra polish on clusters and transitions. |

Any entry that is not yet playable still ships with a **visit-only recovery**: the player reaches the site scene and the Archive entry unlocks without the jetpack challenge. This keeps all 17 entries reachable at every scope level. If time runs short, cut from the bottom of this table upward.

## 3. Story and narrative

### 3.1 Premise

A small robot powers on with one working sense: it can hear echoes. In the game world, each machine left on the Moon or Mars gives off a faint echo that the robot can follow. The robot’s mission is simple: visit each echo, learn what the machine was, and keep its story from being forgotten.

The echoes are a storytelling device. They do not claim that real machines are transmitting.

### 3.2 Tone

Quiet, reflective and hopeful. There is no combat or horror. The robot speaks through short system messages and visual reactions. Machines are never given feelings the sources do not support.

### 3.3 Opening sequence

1. The screen starts black with faint electronic sound.
2. The robot’s visor flickers on and a short system message appears.
3. A first-person view shows the lunar surface.
4. The camera pulls back into the top-down view and the first echo pulses on the map.

Example opening text:

> POWER ON. LISTENING. ECHOES FOUND: 8. OBJECTIVE: VISIT EACH ONE. KEEP THEIR STORIES.

When Mars unlocks, the count changes to 9 echoes. Every cinematic line has a text equivalent and can be skipped.

### 3.4 Machine voice rules

Each entry has one first-person line in the machine’s voice, called the hook. Rules:

- One short line, in plain words.
- Only facts that the entry’s own sources support.
- No feelings, wishes, loneliness or intent unless NASA itself states them.
- The line must be traceable: a reviewer can find its fact in the entry’s source list.

Allowed patterns (placeholders, not facts): “I landed in \[place\] on \[date\].” “I worked for \[number\] days.” Not allowed: “I miss home.” “I was waiting for someone to come back.”

### 3.5 Chapters

| Chapter | World | Purpose |
| --- | --- | --- |
| Prologue | Moon | Wake up, learn movement, find the first echo (a Moon flagship). |
| Chapter 1 | Moon | Visit the Moon echoes and recover their entries. |
| Transition | Moon to Mars | Completing the Moon flagships unlocks the journey to Mars. |
| Chapter 2 | Mars | Visit the Mars echoes, with a different gravity, palette and map. |
| Epilogue | Both | The Archive screen sums up the collection and the statuses. Closing line: some are silent, some are still working, all are still out there. |

### 3.6 Fiction and fact labels

The robot’s story is fiction. The Archive is a record. They look different on purpose:

- Game-story text (cinematic, robot messages, echoes) uses a cyan frame and a “Game story” tag.
- Archive text uses an amber frame, a “Verified record” tag and the entry’s last-verified date.
- An About screen explains the difference in one short paragraph.

## 4. Visual direction

### 4.1 Art direction

16-bit pixel art with a retro RPG feel. The world is quiet and spacious, with silhouettes, restrained effects and clear signal glows. The robot and the machines stay the visual focus; the HUD stays small.

### 4.2 Palette

| Element | Treatment |
| --- | --- |
| Lunar terrain | Dark grey, silver, muted stone |
| Sky and space | Near-black, navy, sparse stars |
| Robot | White and grey with cyan accents |
| Echoes and interactive objects | Cyan or cool blue glow |
| Recovered entries | Warm amber or gold |
| Warnings | Muted orange or red |
| Mars terrain | Rust red, dark orange, dusty brown |

Color is never the only signal. Every glow also has a shape, icon or text cue.

### 4.3 Robot

A compact body with a clear silhouette at small sizes, lit visor, small integrated jetpack, and a cyan accent. Animations: idle, walk, interact, discovery scan, thrust, landing and a short non-punishing reset on failure. Proportions stay consistent in both camera views.

### 4.4 Imagery rules

- **In the world:** original pixel art. Machine sprites are silhouettes inspired by real hardware. Do not use NASA logos or insignia unless the NASA media guidelines have been checked and followed.
- **In the Archive:** real NASA images, each with a NASA ID or file name, credit, source URL and alt text. Copies are hosted with the game, not loaded from NASA at runtime.
- Every image is also listed on the Sources tab of the collection sheet, which becomes the submission’s reference list.

## 5. World and map design

### 5.1 Structure: hub map plus site scenes

The real sites are spread across two worlds, from near the lunar south pole (IM-1, about 80° S) to the Apollo sites near the equator. Walking between them is not realistic, so the game has three layers:

1. **World map (hub).** A flat map of the Moon or Mars with a marker for each entry. The player chooses a marker and the robot flies there.
2. **Site scene (top-down).** A small walkable area, about three screens by three, built from a shared Moon or Mars template plus the entry’s props. An echo pulse guides the player to the machine.
3. **Landing challenge (side-view).** The jetpack challenge, followed by the entry reveal.

This is a recommended change from v1.0’s one continuous lunar region (see decision D1 in Section 16).

### 5.2 Coordinate rules

- Latitude is positive north. Longitude is positive east, from −180 to 180. Mars values given as 0 to 360 are converted, as the collection sheet already does.
- Each entry stores a list of markers, each with a label, latitude, longitude and source URL.
- Marker positions on the map use a simple equirectangular projection.
- Where a position is approximate or not confirmed, the map and entry say “approximate”.

### 5.3 Moon markers

| Entry | Marker | Latitude | Longitude | Source status |
| --- | --- | --- | --- | --- |
| apollo-11-site | LM descent stage | 0.67408 | 23.47297 | NASA catalogue |
| apollo-15-lrv | LM descent stage (rover parked about 160 m east per LROC; verify) | 26.13222 | 3.63386 | NASA catalogue, no separate rover coordinate |
| surveyor-3 | Surveyor 3 site | −3.015 | −23.418 | NASA catalogue |
| apollo-12-site | LM descent stage | −3.01239 | −23.42157 | NASA catalogue |
| apollo-17-site | LM descent stage | 20.1908 | 30.77168 | NASA catalogue |
| apollo-retroreflectors | Apollo 11 | 0.67337 | 23.47293 | NASA catalogue |
| apollo-retroreflectors | Apollo 14 | −3.64421 | −17.4788 | NASA catalogue |
| apollo-retroreflectors | Apollo 15 | 26.13333 | 3.62837 | NASA catalogue |
| blue-ghost-1 | Mare Crisium, near Mons Latreille | 18.562 | 61.81 | From an LRO caption mirrored on Friends of NASA; find the original NASA page |
| im-1-odysseus | Near Malapert A, south polar region | −80.13 | 1.44 | Reported from LROC by non-NASA outlets; confirm on a NASA page |

### 5.4 Mars markers

| Entry | Marker | Latitude | Longitude | Source status |
| --- | --- | --- | --- | --- |
| sojourner-pathfinder | Ares Vallis | 19.47 | −33.25 | NASA GISS Mars24; other sources differ, pick one and cite |
| spirit-opportunity | Gusev Crater (Spirit) | −14.5692 | 175.4729 | PDS Analyst’s Notebook |
| spirit-opportunity | Meridiani Planum (Opportunity) | −1.9462 | −5.5266 | PDS Analyst’s Notebook |
| ingenuity | Jezero Crater (approximate) | 18.44 | 77.45 | Uses the Perseverance landing area; find the final airfield from JPL |
| viking-1-2 | Chryse Planitia (Viking 1) | 22.27 | −47.95 | NASA GISS Mars24 |
| viking-1-2 | Utopia Planitia (Viking 2) | 47.668 | 134.28 | PDS ODE; sources disagree |
| phoenix | Vastitas Borealis | 68.22 | −125.75 | Mars24 and PDS agree |
| insight | Elysium Planitia | 4.5 | 135.62 | Non-NASA pages; replace |
| mars-polar-lander | South polar region (approximate) | −76.57 | 165.2 | Read from a map, not a confirmed landing; find a NASA source |
| curiosity | Bradbury Landing, Gale Crater | −4.59 | 137.44 | PDS ODE |
| perseverance-landing-hardware | Landing debris field, Jezero | 18.44 | 77.45 | Landing area, not the debris spot; replace with a JPL or MRO position |

### 5.5 Overlapping markers

Several markers sit almost on top of each other at map scale: Surveyor 3 and the Apollo 12 descent stage, the Apollo 11 descent stage and its reflector, the Apollo 15 descent stage and its reflector, and Ingenuity and Perseverance hardware (identical placeholder coordinates).

- Group nearby markers into a cluster badge that expands when selected.
- Never move a marker to avoid overlap without labelling it.
- The collection sheet notes that the catalogue cross-references Surveyor 3 from the Apollo 12 entry, so the two can share a site scene. Any story link between them must come from a NASA source before it is written.

### 5.6 Map imagery

Map images are hosted with the game. `data.zip` includes two 256 by 256 pixel global tiles (Moon LRO and Mars MOLA, from NASA Trek), which are enough for a small overview map. A full-screen map needs higher-zoom tiles downloaded once at build time and hosted locally, with credit. Layer names come from the Trek capabilities document, not from guesses. The team rule against third-party requests at runtime means the live Trek services are never called while the game runs.

## 6. Core gameplay loop and exploration

### 6.1 Core loop

1. **Listen.** On the hub map, echoes pulse where machines are.
2. **Travel.** Pick a marker and the robot flies to that site.
3. **Discover.** Explore the site scene; the echo pulse speeds up as the robot gets close.
4. **Land.** Start the side-view jetpack challenge (or the visit-only recovery).
5. **Restore.** The entry opens with a short summary and a link to the full page.
6. **Archive.** The marker turns amber and the progress counter updates.
7. **Unlock.** Recovering the Moon flagships opens the way to Mars.

### 6.2 Controls

| Action | Desktop | Mobile and tablet |
| --- | --- | --- |
| Move | WASD or arrow keys | Virtual joystick or direction pad |
| Interact | E, or on-screen prompt | Large touch button |
| World map | M, or interface button | Map icon |
| Archive | I, or interface button | Archive icon |
| Pause and settings | Esc | Pause icon |

Every action also works through on-screen buttons and keyboard-accessible menus.

### 6.3 Movement and camera

Movement is eight-direction with a short acceleration ramp, so small targets stay easy to reach. The camera follows the robot and stays inside the site scene. A reduced-motion setting removes camera easing and screen shake. (Both are proposed defaults; see decision D5 in Section 16.)

### 6.4 Echo states

| State | Presentation |
| --- | --- |
| Unvisited | Cyan ring on the hub map, with a small pulse. |
| Near | In the site scene: faster pulse, a sound cue and an edge arrow that points toward the machine. |
| Ready | A clear interaction prompt appears beside the machine. |
| Archived | Amber filled marker with a check icon and the word “Archived”. The machine stays in the scene, tagged as archived. |

The real machines are still on the Moon and Mars, so the game never removes a machine from the world. Recovering an entry restores its story, not the object. A failed challenge changes nothing: the echo stays available for another try.

## 7. Landing challenge and physics

### 7.1 Concept

A side-view 2D challenge inspired by classic lunar landing games. The robot starts on the left and must make a controlled landing on a marked platform beside the machine on the right. The challenge uses the gravity of the world the player is on, so the same jetpack feels different on Mars than on the Moon.

### 7.2 Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Steer left | A or left arrow | Left button |
| Steer right | D or right arrow | Right button |
| Thrust | Space | Press-and-hold thrust button |
| Pause | Esc | Pause button |

The robot stays upright in the first build. Steering gives sideways acceleration; thrust gives upward acceleration. Thrust is press-and-hold, never repeated tapping, and mobile buttons are large and well separated.

### 7.3 Physics model

The y-axis points down, so gravity is positive. In each fixed step:

`v_y(t + Δt) = v_y(t) + (g − a_t · T) Δt`

`v_x(t + Δt) = v_x(t) + a_h · S · Δt`

Here `g` is the world’s gravity, `a_t` is upward thrust acceleration, `T` is 1 while thrust is held and 0 otherwise, `a_h` is sideways acceleration and `S` is −1, 0 or +1 for steering. Position is updated from velocity each step.

- **Fixed timestep.** Physics runs at 60 steps per second (Δt = 1/60 s) using an accumulator, separate from rendering, so the challenge plays the same on every device.
- **Gravity.** About 1.62 m/s² on the Moon and about 3.71 m/s² on Mars. These values must be cited to a NASA page before they appear in the Archive or About screen.
- **Thrust as a ratio.** Thrust is set as a multiple of gravity: `a_t = r · g`. This keeps the challenge fair on both worlds. In v1.0, Mars risked being unwinnable or trivial because gravity and thrust were tuned separately.
- **Scale.** One game metre is 8 pixels at a 320 by 180 internal resolution (proposed).
- **Fuel.** Fuel counts seconds of thrust. Steering uses fuel at half the thrust rate. Fuel rewards short, controlled burns over holding thrust down.

### 7.4 Starting parameters

These are proposed starting values. They must be tuned by play-testing.

| Parameter | Easy | Normal | Hard |
| --- | --- | --- | --- |
| Thrust-to-gravity ratio `r` | 2.6 | 2.2 | 1.9 |
| Sideways acceleration (share of `a_t`) | 0.50 | 0.45 | 0.40 |
| Travel distance | about 20 m | about 26 m | about 32 m |
| Fuel | 1.5 × the reference route | 1.35 × | 1.2 × |
| Safe vertical landing speed | 2.5 m/s or less | 2.0 m/s or less | 1.5 m/s or less |
| Safe sideways landing speed | 2.0 m/s or less | 1.5 m/s or less | 1.0 m/s or less |
| Platform width | 8 m | 6 m | 4 m |
| Starting velocity | Low | Moderate | Varies, shown before the run |

**Mars scaling.** If every acceleration scales with gravity and distances stay the same, all times shrink and all speeds grow by the square root of the gravity ratio, about 1.51 (3.71 divided by 1.62, then square-rooted). To keep Mars equally fair, multiply the safe-speed limits by about 1.51, or make Mars harder on purpose through other settings that are clearly signposted. Dust or wind effects appear only when they have a clear gameplay purpose and an accessible cue.

### 7.5 Landing conditions

The robot must touch the platform inside its safe horizontal edges, with vertical and sideways speeds under the level’s limits. Anything else fails the attempt: running out of fuel before reaching the platform, landing too fast, or missing the platform.

### 7.6 Failure, retry and assist

- A failure shows a short, non-punishing animation and one clear button: **Try again**. A second button, **Back to site**, returns the player to the site scene beside the machine.
- After three failed attempts in a row, the game offers **Assist**: 25% more fuel and a wider platform.
- After Assist, or through a setting at any time, the player can choose **Skip challenge**, which completes a visit-only recovery. The save marks the entry as assisted. The Archive never shows that mark.
- A failure never removes collected entries or progress.

This resolves the open retry question from v1.0, and it keeps learning from being gated behind a physics challenge.

### 7.7 Level design rules

Each entry with a jetpack challenge has a level file with: start position, start velocity, platform position and width, world, difficulty, fuel, and optional ledges or obstacles (none in Core). Difficulty is fixed per entry and shown before the run with an icon and a word. The first Moon flagship is Easy and Hard is reserved for later Mars entries.

A solver bot must find a successful route for every level, and fuel is set as a multiple of the fuel that route uses. An automated test runs the bot against every level. Hard must demand precision, never impossible fuel use.

## 8. Archive and entry content standard

### 8.1 Purpose

The Archive is the central learning feature and the proof behind the story. Once an entry is unlocked, it stays readable at any time, from the hub map, from the site scene, and without replaying the challenge.

### 8.2 Entry page layout

In order: name, status badge and world; image with credit and alt text; one-sentence summary; the machine’s one-line hook; how it worked; the science (one specific result); two key facts with source links; dates; locations with coordinates and the coordinate source; the full source list; and the last-verified date. The page is tagged “Verified record”. Long text stays short, with expandable details.

### 8.3 Entry fields

These fields follow the collection sheet. Each entry is one file at `data/artifacts/<world>/<id>.json`.

| Field | Rule |
| --- | --- |
| `id` | Lowercase with hyphens; matches the sheet, for example `apollo-11-site`. |
| `name` | The name as NASA writes it. |
| `world`, `tier` | `moon` or `mars`; `flagship` or `standard`. |
| `status` | One of: active, dormant, ended, lost, drifting. |
| `launch_date`, `end_date` | `YYYY-MM-DD`. Two-craft entries give one date per craft. Leave the end empty if active. |
| `locations` | A **list** of markers, each with label, latitude, longitude, source URL and an approximate flag. |
| `summary` | One plain sentence at about grade 4 to 5. |
| `hook` | One first-person line that follows Section 3.4. |
| `how_it_worked` | One or two short paragraphs. |
| `science` | One specific result the machine made possible. |
| `facts` | Two facts in the team’s own words, each with a source URL. |
| `image` | NASA ID or file name, credit, source URL and alt text. |
| `written_by`, `verified_by` | Must be different people. |
| `last_verified` | `YYYY-MM-DD`. |
| `recovery` | `jetpack` or `visit`. |

### 8.4 Status definitions (proposed)

| Status | Meaning |
| --- | --- |
| active | Still operating or still in scientific use. |
| dormant | Left in place and not operating; the sources record no formal end of mission. |
| ended | The mission formally concluded, with a documented end date. |
| lost | Contact or position lost and not confirmed. |
| drifting | Travelling away from the Moon and Mars with no planned return; for deep-space probes. |

The drafts in the collection sheet fit these meanings, but the team must confirm them (decision D3). Each status must match what the NASA source says, and the verification date matters because statuses change. Curiosity is an example.

### 8.5 Example file

Only coordinates and the sheet’s launch date are filled in. Every other field stays `TODO` until it is written from NASA sources, and the launch date is still marked “verify” in the sheet.

```json
{
  "id": "surveyor-3",
  "name": "Surveyor 3",
  "world": "moon",
  "tier": "flagship",
  "status": "dormant",
  "launch_date": "1967-04-17",
  "end_date": null,
  "locations": [
    {
      "label": "Surveyor 3 site (Apollo 12 area)",
      "lat": -3.015,
      "lon": -23.418,
      "source_url": "https://www.nasa.gov/wp-content/uploads/2024/02/final-catalogue-of-manmade-material-on-the-moon.pdf",
      "approximate": false
    }
  ],
  "summary": "TODO",
  "hook": "TODO",
  "how_it_worked": "TODO",
  "science": "TODO",
  "facts": [
    { "text": "TODO", "source_url": "TODO" },
    { "text": "TODO", "source_url": "TODO" }
  ],
  "image": { "nasa_id": "TODO", "credit": "TODO", "source_url": "TODO", "alt": "TODO" },
  "written_by": "TODO",
  "verified_by": "TODO",
  "last_verified": null,
  "recovery": "jetpack"
}
```

## 9. Interface, HUD and navigation

### 9.1 HUD

| Element | Position | Function |
| --- | --- | --- |
| Pause and settings | Top left | Controls, accessibility and audio. |
| Progress | Top center | “3 of 17”, with Moon and Mars counts in the map view. |
| World map and Archive | Top right | Two icon buttons with text labels. |
| Interaction prompt | Beside the machine | Says when and how to interact. |
| Movement controls | Bottom left on touch | Joystick or direction pad. |
| Interact button | Bottom right on touch | Large, contextual. |

The permanent HUD stays small, and the robot and machines stay the focus. This also fixes the v1.0 clash where the Archive and Pause both sat top right.

### 9.2 Hub map

- A switch between Moon and Mars. Mars shows why it is locked until the unlock condition is met.
- Markers use color and shape: cyan ring for unvisited, amber filled with a check for archived, a numbered badge for clusters.
- Selecting a marker opens a small card: name, status badge, coordinates (with “approximate” where it applies) and a **Fly here** button.

### 9.3 Archive

A responsive grid of cards, each with an image or sprite, name, status badge and world. Locked cards show a silhouette and “Echo not yet visited”, with no spoilers. Selecting an unlocked card opens the full entry. Filters cover world and status. Technical terms such as “retroreflector” get a short tooltip or glossary line.

### 9.4 Consistency

The HUD, map, Archive, challenge and cinematic share one typeface, pixel-art frame style and color language. Menus stay readable on small screens, and the mobile layout is designed on its own rather than scaled down from desktop.

## 10. Progression, rewards and saving

### 10.1 Progression

| Player action | Result |
| --- | --- |
| Fly to an echo | The site scene opens. |
| Complete a recovery | The entry unlocks and the marker turns amber. |
| Read an entry | The reading is recorded for the Epilogue summary. |
| Recover the three Moon flagships | Mars unlocks (decision D4). |
| Recover every entry | The Epilogue opens. |

### 10.2 Optional achievements

First Echo (first recovery), Moon Keeper (all Moon entries), Mars Keeper (all Mars entries), Soft Landing (land at half the safe speed or less), Fuel Saver (finish with at least a third of the fuel left) and Still Working (read both active entries). Achievements never gate any entry or fact.

### 10.3 Saving

The game saves automatically after a recovery, after an entry is read, and after a settings change. Saves live in the browser’s local storage. The save file has a version number so later builds can migrate it, and a **Reset progress** button clears it. If storage is blocked, the game still runs and shows a notice that progress will not be kept.

| Saved data | Examples |
| --- | --- |
| Archived entries | Entry IDs and whether each was assisted. |
| Challenge results | Level ID, attempts, completed or not. |
| Position | Current world and site. |
| Unlocks | Mars unlock. |
| Settings | Text size, contrast, reduced motion, audio, controls. |

The game collects no personal data and uses no accounts or analytics.

## 11. Accessibility, devices and performance

### 11.1 Accessibility requirements

- Adjustable text size and a high-contrast option.
- Keyboard-accessible menus and controls, and large touch targets (at least 44 by 44 pixels, a common guideline).
- Alt text for every image. It is a required field in the entry format.
- Captions or text equivalents for every sound cue, cinematic line and robot message.
- No important information carried by color alone.
- Reduced-motion option for camera effects and transitions, and no flashing content.
- Pause available everywhere, and no timed menus.
- Assist and Skip challenge options (Section 7.6).
- The Archive, menus and entry pages are built as real web page elements over the game canvas, so screen readers and keyboard users can reach them.

### 11.2 Responsive layout

Desktop, tablet and mobile each get a layout designed for them, with bigger controls and a compact information display on touch screens. The mobile Archive and map must stay usable on a narrow portrait screen.

### 11.3 Performance (proposed budgets)

- Under about 8 MB downloaded before the first interaction. Each world’s assets load when that world is opened.
- Target 60 frames per second on a mid-range phone, with a reduced-effects option if it drops.
- Compressed sprite sheets, limited particles, and responsive scaling at an integer multiple of the 320 by 180 internal resolution.
- Test on a low-powered phone and on current Chrome, Edge, Firefox and Safari. Check what the chosen Phaser version needs from the browser (Section 12.2).

### 11.4 Audio

Quiet ambient sound and short interface sounds, off until the player chooses to turn them on. Every cue has a visual equivalent and a caption.

### 11.5 Privacy

No accounts, no analytics, no cookies and no personal data. The game uses local storage only for the save file. Under the team rule, it makes no third-party requests at runtime: fonts, images and map tiles are all hosted with the game.

## 12. Technical architecture

### 12.1 Stack

| Technology | Role |
| --- | --- |
| TypeScript (strict mode, required) | All game, UI and tooling code. No plain JavaScript and no `any`. |
| Phaser | 2D game engine for site scenes and landing challenges. Version in 12.2. |
| Vite | Build tool and dev server. |
| HTML and CSS | Hub map UI, Archive, menus and the About screen. |
| Schema validation (for example Zod) | Checks every data file at build time. |
| Vitest | Unit tests for physics, the solver bot and data rules. |
| Playwright | End-to-end tests for the core loop. |
| Browser local storage | Versioned save file. |
| Static hosting | The build is a folder of files; nothing runs on a server. |

### 12.2 Phaser version (decision D2)

Phaser 4 is now stable: the Phaser site lists v4.0.0 on 10 April 2026 and v4.1.0 on 30 April 2026. The Phaser Vite and TypeScript template pages found while preparing this draft listed Phaser 3.90.0, so check the template’s current version before cloning. Recommendation: use Phaser 4 for a new build if the Claude Code game-creator Phaser skill supports it, and otherwise pin Phaser 3.90.x. Pin an exact version either way. Nothing in this document depends on a version-specific feature.

### 12.3 Layers

| Layer | Contents |
| --- | --- |
| Website shell | Boot and cinematic, hub map, Archive, settings, About. |
| Game scenes | Site scene, landing scene, shared input, camera and fixed-step physics. |
| Game data | Entry files, level files, glossary, map images, text. |
| Save | Versioned local storage with migration. |
| Tooling | Data validator, level solver bot, asset fetch script. |

### 12.4 Project layout

```
still-out-there/
  CLAUDE.md
  docs/GDD.md
  data/artifacts/moon/*.json
  data/artifacts/mars/*.json
  data/levels/*.json
  public/assets/   (sprites, maps, images, audio, fonts)
  src/             (main.ts, scenes/, systems/, ui/, data/, save/)
  tools/           (validate-data.ts, solve-levels.ts, fetch-assets.ts)
  tests/
```

### 12.5 Build gates: no source, no ship

The build fails if any of these are true:

- A field is empty or still says `TODO`.
- A fact has no source URL.
- A status is not one of the five allowed values.
- `written_by` and `verified_by` match.
- An image is missing its credit, source URL or alt text.
- `last_verified` is missing.
- `locations` is not a list, or a coordinate is out of range (latitude −90 to 90, longitude −180 to 180).
- Two entries share an ID.
- The solver bot cannot land a level within its fuel.

A non-NASA source URL raises a warning until it is replaced. The coordinate check would already have caught two problems in the current data: Ranger 9’s latitude of 112.828 in the Moon file, and Viking 2’s longitude of −225.99 in `data.zip`.

### 12.6 Asset pipeline

A fetch script downloads NASA images and map tiles at build time, using the NASA Image and Video Library API (no key needed, per the collection sheet), and writes the credit and source URL into each entry file. The finished game never calls NASA while running.

### 12.7 AI-assisted development

The team may use Claude Code with the game-creator Phaser skill, guided by a `CLAUDE.md` that holds this document’s rules: strict TypeScript, Core scope first, data-driven entries, fixed-step physics, accessibility, and no monetization or leaderboard features. Every use of an AI tool is logged on the SI Log tab. AI output is never a source for a fact.

## 13. Research standards, sourcing and responsible AI use

### 13.1 Source tiers

| Tier | Sources | How to use |
| --- | --- | --- |
| 1. NASA primary | NASA’s Catalogue of Manmade Material on the Moon (NASA History Program Office, 2012); NASA and JPL mission pages; PDS pages (ODE, Analyst’s Notebook); NASA GISS Mars24; LRO and LROC pages; NASA Image and Video Library | Final sources for facts, coordinates and images. |
| 2. Researcher or reference | Academic estimates and reference lists, such as a 2022 Mars debris estimate by Cagri Kilic | Attribute exactly. Never present as a NASA figure. |
| 3. Other | News, aggregators, mirrors, map pages | Leads only. Replace with a Tier 1 source before shipping. |

### 13.2 Team rules

These come from the collection sheet’s “Read me” tab.

1. Every fact has a source URL. No source URL, no ship.
2. Paraphrase. Do not copy sentences, quotes or lyrics from sources.
3. The first-person hook claims no feelings or facts the NASA data does not support.
4. Written by and verified by must be different people.
5. Status uses only: active, dormant, ended, lost, drifting. Check each on a NASA page.
6. Every image has credit and a source URL on the Artifacts tab, and its source is also on the Sources tab.
7. Every use of an AI tool is logged on the SI Log tab.
8. Where sources disagree, pick one, cite it, and note the difference in the entry’s notes.
9. Approximate or unconfirmed positions are labelled “approximate”.

### 13.3 Entry quality gate

An entry ships only when:

- All fields are filled and the build gates in Section 12.5 pass.
- Dates, status and coordinates were each checked on a Tier 1 page.
- A second person has verified the text and recorded the date.
- The summary reads at about grade 4 to 5.
- Image rights and credit are recorded.

### 13.4 Scale facts policy

From the collection sheet’s “Scale facts” tab:

| Fact | Rule |
| --- | --- |
| About 800 items in NASA’s Moon catalogue | A news write-up gives 796 items, 765 from American missions. Say “about 800” and check the count in the catalogue PDF first. |
| Total mass left on the Moon | Figures disagree between lists. Do not use a single figure; find a NASA mass or give an attributed range. |
| “Over 70” vehicles on the Moon; “around 96” bags of waste | Unverified. Do not use. |
| Mars debris: 15,694 lb (7,119 kg) | A 2022 academic estimate, not NASA. Attribute to the author and year. |
| Objects sent to Mars | Sources cited say 18 objects over 14 missions; one chat said 15 craft. Use the sourced figure with attribution. |
| Perseverance landing debris | A JPL image page supports it: backshell, parachute and debris field seen by Ingenuity on 19 April 2022. Credit NASA/JPL-Caltech. |
| Dacron netting seen on 12 July 2022 | Known only from news reports quoting JPL. Find the JPL page first. |
| Five S-IVB stages crashed on the Moon | Secondary source. The Moon file lists S-IVB stages for Apollo 13, 14, 15 and 17; check the catalogue. |

### 13.5 Responsible AI use

AI tools may draft, but humans decide and verify. Each AI-assisted task gets a line on the SI Log tab with the date, person, file, tool, what the tool did and whether a human check was done. This GDD is one such task. A mistake that an AI tool introduced is the team’s mistake once it ships, so the quality gate applies to AI-written text exactly as it does to human-written text.

## 14. Data reconciliation: conflicts and open checks

This section compares the team’s files with each other and with the collection sheet’s own notes. No NASA page was opened for this review, so nothing here is verified against a source. Distances marked as arithmetic are rough calculations from catalogue coordinates.

| # | Item | What the files say | Action |
| --- | --- | --- | --- |
| 1 | Viking 1 latitude | Sheet and Mars file: 22.27 N (Mars24). `data.zip`: 22.48 N. | Pick one NASA page, cite it, note the other. |
| 2 | Viking 2 position | Sheet: 47.668 N, 134.28 E (PDS), with a note that online values run from 47.64 to 48.27. `data.zip`: 48.27 N and −225.99, which is outside the −180 to 180 range (it equals about 134.01 E). | Fix the longitude convention. Pick one NASA value and cite it. |
| 3 | Pathfinder position | Sheet: 19.47 N, 33.25 W (Mars24). The sheet notes PDS gives 19.095 N and a non-NASA map gives 19.33 N, 33.55 W. `data.zip` uses the non-NASA map value. | Use a NASA value and cite it. |
| 4 | Ingenuity launch date | Sheet gives 2020-07-20 for Ingenuity but 2020-07-30 for the Perseverance hardware entry, and Ingenuity travelled to Mars with Perseverance. | One is likely a typo. Confirm on a NASA or JPL page. |
| 5 | Ingenuity status | Sheet: ended, 2024-01-25, from news rather than JPL. `data.zip`: retired but “operating as stationary weather station”. | Find the JPL statement and set status and dates from it. |
| 6 | Ingenuity and Perseverance markers | Both use 18.44 N, 77.45 E, the landing area. | Replace with JPL positions: Ingenuity’s final airfield, and the debris field. |
| 7 | InSight position | Non-NASA map pages. | Replace with NASA or JPL, or Mars24. |
| 8 | Mars Polar Lander position | A position read from a map by a non-NASA site, not a confirmed landing. | Keep “lost” and “approximate”. Find a NASA source. |
| 9 | Apollo site positions | The catalogue gives several positions per site, for example Apollo 11: landing location 0.41 N, 23.26 E; descent stage 0.67408 N, 23.47297 E; reflector 0.67337 N, 23.47293 E. Apollo 12 and 17 follow the same pattern. `data.zip` uses slightly different values. | Use the catalogue descent-stage position as the marker and say so on the page. |
| 10 | Apollo 15 rover | The catalogue has no separate rover coordinate. LROC says the rover was parked about 160 m east of the lunar module; a NASA history page says about 500 feet (about 152 m). | Keep the descent-stage position, say “about”, cite one source. |
| 11 | Blue Ghost position and launch date | Position comes from a Friends of NASA mirror of an LRO caption. The launch date comes from Firefly, not NASA. | Find the original NASA pages. |
| 12 | IM-1 position | Reported from LROC by CBS and DLR, not seen on the NASA page. | Confirm on a NASA page. |
| 13 | Retroreflectors | Three catalogue positions (Apollo 11, 14, 15), but two marker slots in the sheet. | Make `locations` a list of any length. |
| 14 | Surveyor 3 and Apollo 12 | Catalogue positions are about 0.003° to 0.004° apart, roughly 100 to 150 m by arithmetic. | Expect overlapping markers (Section 5.5). Verify the distance before stating it. |
| 15 | Hook text in `data.zip` | The `storytelling_hook` lines mix facts with unsourced claims and feelings, for example a machine “waiting for human hands” or a probe “outliving humanity and our Sun”. | Do not copy. Rewrite from sources under the Section 3.4 rules. Use the file for leads only. |
| 16 | Numbers in `data.zip` text | Distances, masses, speeds and durations (such as “163 meters”, “2,245 sols”, “120 km/h”) carry no sources. | Each needs a NASA source or is cut. |
| 17 | Items outside the 17 entries | `data.zip` also covers LCROSS, Apollo 14 and 16 landing sites, Voyager 1 and Pioneer 10. | Park for Stretch or drop (decision D8). |
| 18 | Copied notes | The same note about the Apollo 15 rover’s entry is attached to the Apollo 15, 16 and 17 rover lines in the Moon file. | Clean up before using the file as data. |
| 19 | Ranger 9 | Latitude printed as 112.828, which is impossible. Out of scope, flagged in the file. | Do not use. |
| 20 | Dates “from memory” | Many launch and end dates in the sheet are marked “verify”. | Check each on a NASA page before the entry ships. |

## 15. Roadmap, acceptance criteria and risks

### 15.1 Roadmap

The build window is not known, so milestones are ordered by exit condition rather than by date (decision D11). Two tracks run in parallel.

**Build track**

| Milestone | Deliverable | Exit condition |
| --- | --- | --- |
| M0. Setup | Vite, TypeScript and Phaser project; `CLAUDE.md`; test scaffolding | Project builds and runs. The Phaser version and skill support are confirmed. |
| M1. Data foundation | Entry template with a locations list; 17 stub files with coordinates and sources; validator | The validator runs on all 17 stubs and reports the gaps. |
| M2. Hub map | Moon and Mars maps, 21 markers, clusters, marker card | Every marker is selectable on desktop and touch. |
| M3. Archive and save | Card grid, entry page, locked and unlocked states, save and restore | A sample entry unlocks and survives a reload. |
| M4. Site scene | Shared site template, movement, echo states | The player can reach and trigger Ready at any site. |
| M5. Landing challenge | Physics, fuel, landing checks, difficulties, retry, Assist, solver bot | Each level is winnable by the bot and can be failed. |
| M6. Access and polish | Accessibility options, mobile layout, performance pass | Section 15.2 passes on a real phone. |
| M7. Core release | Integrated game with the three Moon flagships playable | Every Core criterion is met. |
| M8. Target and Stretch | Remaining Moon entries, Mars unlock, Mars flagships, extras | Added only after M7 is stable. |

**Content track** (owners from the sheet: P5 for Moon, P6 for Mars)

| Step | Deliverable | Exit condition |
| --- | --- | --- |
| C1 | Coordinates, dates and status for all 17 entries confirmed on NASA pages | Every item in Section 14 is closed. |
| C2 | The three Moon flagships written, verified and illustrated | They pass the quality gate. |
| C3 | Remaining Moon entries, then all Mars entries | Each passes the quality gate. |

### 15.2 Core acceptance criteria

- A player can start the game, finish the opening and reach the hub map.
- All 21 markers appear; selecting one shows the name, status badge and coordinates, with “approximate” where it applies.
- Mars shows a locked state with a reason until the unlock condition is met.
- The robot moves on desktop and touch, and echo states respond correctly.
- The landing challenge can be entered and exited; a safe landing succeeds and an unsafe one fails; physics behaves the same on repeated runs.
- A failed attempt leaves the entry available and all progress intact. Assist and Skip challenge both work.
- A recovered entry appears in the Archive, stays after a reload, and its marker turns amber. The machine stays in the scene.
- Every Archive entry shows its sources, image credit, alt text, status and last-verified date.
- All 17 entries pass the build gates in Section 12.5.
- A network test shows no requests to third-party hosts while the game runs.
- Text size, high contrast and reduced motion work. Menus work by keyboard. The interface is usable on a narrow phone screen.
- No entry calls an active machine abandoned.

### 15.3 Risks

| Risk | Mitigation |
| --- | --- |
| Verifying 17 entries takes longer than building the game | Content and build run in parallel. Core makes only three entries playable, and visit-only recovery keeps the rest reachable. |
| Conflicting or non-NASA data | Section 14 list, validator warnings, and the pick-one-and-cite rule. |
| Landing challenge feels too hard | Assist, Skip, solver-bot checks, visible difficulty and play-testing. |
| Mars physics feels unfair | Thrust set as a ratio of gravity, speed limits scaled for Mars, and tests on both worlds. |
| Overlapping markers confuse players | Clusters, labels and mobile map tests. |
| Poor mobile performance | Budgets, a reduced-effects option and testing on a low-powered phone. |
| Image rights or missing credits | Credit and source recorded per image, NASA IDs used, no NASA logos. |
| Fiction mistaken for fact | Fiction and fact labels (Section 3.6) and hook rules. |
| Out-of-date statuses (Curiosity, for example) | Last-verified date on every entry and a recheck before submission. |
| AI-introduced errors | The quality gate, the SI Log and a second-person check. |
| Tool or version mismatch | Pin versions and confirm skill support at M0. |
| Starting before the allowed time | Confirm with the Local Lead what counts as work. |

## 16. Open decisions

| ID | Decision | Recommendation |
| --- | --- | --- |
| D1 | World structure | A hub map plus small site scenes (Section 5.1). The alternative is one continuous stylized region per world, as in v1.0, which costs more and fits real coordinates less well. |
| D2 | Phaser version | Phaser 4 if the game-creator skill supports it; otherwise Phaser 3.90.x. |
| D3 | Status definitions | Use the Section 8.4 definitions and confirm each draft status on a NASA page. |
| D4 | Mars unlock rule | Recover the three Moon flagships. The alternative is all 8 Moon entries. |
| D5 | Movement and camera | Eight-direction movement with a short ramp and a following camera. Confirm in the first prototype. |
| D6 | Active machines in an “abandoned” game | Keep the retroreflectors and Curiosity with clear status badges. |
| D7 | Marker convention at Apollo sites | Use the lunar module descent stage position and explain it on each page. |
| D8 | A “Beyond” tier | Voyager 1 and Pioneer 10 (status “drifting”) appear in `data.zip` with nothing verified. Stretch only, and only if the challenge rules allow objects beyond the Moon and Mars. |
| D9 | Assist and Skip challenge | Keep both (Section 7.6). The alternative is retry only. |
| D10 | Language | English first, with text kept in data files so it can be translated. |
| D11 | Build window | Confirm the dates with the Local Lead, then set milestone dates. The scope levels stay as they are. |

## Appendix A. Short pitch

Still Out There is a browser game about the machines humans have left on the Moon and Mars. A small robot follows faint echoes to 17 real NASA sites, makes a short jetpack landing at each one, and unlocks a sourced record of what the machine was, what it did and where it stands today. Some are silent. Some are still working. All of them are still out there. Abandoned, but not forgotten.

## Appendix B. Design principles at a glance

- No source, no ship.
- Keep the robot and the machines as the visual focus.
- Label fiction as fiction and records as records.
- Make failure retryable and never let it block learning.
- The real machines stay in the world; the game only restores their stories.
- Design mobile and desktop on purpose.
- Build Core first, then Target, then Stretch.

*Still Out There · Game Design Document · Version 2.0 draft*
