# October 2026 source review

Visually inspected: `references/Screenshot 2026-10-06 at 8.31.21 AM.png`, header “September/October 2026 — ELC and CHEVERUS SCHOOL MENU.” Data lives in `src/data/october-2026.json`; September 28–30 are intentionally excluded.

## Confidently transcribed lunch entrées

| October date | Calendar entrée                         | Included accompaniments                                                                 |
| ------------ | --------------------------------------- | --------------------------------------------------------------------------------------- |
| 1            | Juicy Cheeseburger (H)                  | Crispy Potato Puffs, Cucumber Coins, Baby Banana, Choice of Milk                        |
| 2            | Slice of Pizza (V)                      | Romaine Side Salad, Three Bean Salad, Fruit Cup, Choice of Milk                         |
| 5            | Meatball Sub                            | Green Beans, Celery Sticks, Juicy Apple, Choice of Milk                                 |
| 6            | Asian Chicken                           | Whole Grain Rice, Roasted Broccoli, Red Pepper Strips, Sweet Orange, Choice of Milk     |
| 7            | Macaroni & Cheese (V)                   | Sweet Peas, Fresh Broccoli, Green Apple, Choice of Milk                                 |
| 8            | Chicken Bites (H)                       | Whole Grain Snack, Tater Tots, Sweet Carrots, Baby Banana, Choice of Milk               |
| 9            | Slice of Pizza (V)                      | Romaine Side Salad, Three Bean Salad, Fruit Cup, Choice of Milk                         |
| 12           | No School Today                         | All services disabled                                                                   |
| 13           | Chicken Dumplings With Asian Sauce      | Vegetable Fried Rice, Roasted Broccoli, Red Pepper Strips, Sweet Orange, Choice of Milk |
| 14           | Spaghetti and Meatballs                 | WG Dinner Roll, Green Beans, Celery Sticks, Green Apple, Choice of Milk                 |
| 15           | All Beef Hot Dog; Pre-K = Cheeseburger  | Boston Baked Beans, Sweet Carrots, Baby Banana, Choice of Milk                          |
| 16           | Pan Pizza (V)                           | Romaine Side Salad, Three Bean Salad, Fruit Cup, Choice of Milk                         |
| 19           | Crispy Chicken Parmesan Sandwich        | Whole Grain Bun, Green Beans, Celery Sticks, Juicy Apple, Choice of Milk                |
| 20           | Beef Nachos Grande                      | Seasoned Black Beans, Roasted Corn, Red Pepper Strips, Sweet Orange, Choice of Milk     |
| 21           | French Toast Sticks + Breakfast Sausage | Crispy Hash Brown, Sweet Carrots, Green Apple, Choice of Milk                           |
| 22           | Barbacoa Soft Tacos                     | Roasted Corn, Cucumber Coins, Baby Banana, Choice of Milk                               |
| 23           | Slice of Pizza (V)                      | Romaine Side Salad, Three Bean Salad, Fruit Cup, Choice of Milk                         |
| 26           | Cheesy Breadsticks                      | Green Beans, Celery Sticks, Juicy Apple, Choice of Milk                                 |
| 27           | Seasoned Beef Soft Tacos                | Roasted Corn, Red Pepper Strips, Sweet Orange, Choice of Milk                           |
| 28           | Chicken Penne Alfredo                   | WG Dinner Roll, Broccoli, Cucumber Coins, Green Apple, Choice of Milk                   |
| 29           | Macaroni and Cheese Bites               | Green Beans, Sweet Carrots, Baby Banana, Choice of Milk                                 |
| 30           | Pan Pizza (V)                           | Romaine Side Salad, Three Bean Salad, Fruit Cup, Choice of Milk                         |

Daily alternatives: “Jammie Sunbutter and Jelly Sandwich (V)” and “American Cheese on Wheat Bread (V).” The source says every meal comes complete with fruit, milk, and vegetables. The fruit/vegetable bar list is informational, not a guarantee of every listed item each day. V = Vegetarian; H = Halal. Preserve these labels only where the source marks them, without inferring labels for other dishes.

October 21 is **lunch**, although its lunch entrée includes breakfast foods. It is not a separate breakfast menu.

## Breakfast

The footer says “Enjoy Free Breakfast Every Day” and describes daily grab-and-go breakfast. Whole grain items include muffins, cereal, cereal bars, breakfast breads, hot breakfast items, and a variety of whole grain snack items. Fruit or 100% fruit juice, additional fruit/vegetable options, and fat-free or 1% milk are described. These are general examples, **not dated selectable options**. October therefore uses breakfast participation opt-in, with no individual breakfast food options seeded.

## Ambiguity and review

- No unreadable entrée names remain in the transcription. Punctuation/capitalization is normalized. “WG” is retained from the source; it likely means whole grain but the UI does not silently expand it.
- The October 8 small side text reads “Tater Tots”; verify its print spelling against the PDF before publication if needed.
- October 15 Pre-K substitution is explicit. No grade is collected; a clearly labeled Pre-K option is shown only that day. Justin/school should confirm families self-select the applicable option.
- The source does not explicitly state the number of entrée selections. One calendar entrée **or** one daily alternative is the conservative implementation; school confirmation is required before publishing.
- The footer establishes a general breakfast offering; confirm that requesting participation without choosing a specific food is the intended communication.
- The screenshot states menus are subject to change. Do not describe this transcription as school-confirmed publication.

## EDP and calendar confirmation

The source contains **no EDP information**. Justin confirmed on October 6, 2026: “EDP is from 2pm - 6pm everyday.” All 21 October school-day EDP availability values are therefore `true`, with a “2–6 pm · Confirmed by Justin” note. October 12 is unavailable because no school is explicitly stated. This is a human-confirmed schedule, not a claim inferred from the screenshot. Future unconfirmed dates use `null`; unknown availability is visually different from unavailable and from “Not attending.”

Only October 12 is marked no school in this source. Review any later calendar changes. Production October is seeded as draft and needs admin review/publication. No teacher, teacher email, school recipient, or attendance schedule has been invented.
