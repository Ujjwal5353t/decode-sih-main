"""
One-off script — authors original, NCERT-aligned EVS chapter content for
Class 3-5 and loads it into `document_chunks` (branch_name="SELF"), closing
two documented gaps:

  1. `src/db/ncert_content.py`'s EVS entries are tiny (~300-500 char)
     hand-authored placeholder paragraphs, one chunk per chapter, not real
     textbook content — grounding quiz/lesson generation in them produces
     content "out of sync" with the real NCERT syllabus.
  2. `src/ai/evs_fact_bank.py`'s docstring documents that the seeded Class 4
     EVS text has NO coverage at all for the `EVS4_NUTRITION` and
     `EVS4_WATER_CYCLE` topics in `src/db/curriculum_seed.py`.

This script writes substantially longer, original chapter prose — one
chapter per EVS Topic (see curriculum_seed.py), so every one of the 12 EVS
topics for classes 3-5 has direct, traceable chapter coverage, including
the two gap topics — and re-chunks it via the existing
`src.ai.chunking.extract_chapters_and_chunks` pipeline (same ~800-char
chunks / ~150-char overlap / embedding scheme every other ingestion path
uses).

Content here is original, self-written prose that is topically and
pedagogically aligned to what NCERT's "Looking Around" Class 3-5 EVS
textbooks actually teach (family/community, plants/animals/habitats, human
body, food/nutrition, water, transport, environment, local governance,
disaster safety) — it paraphrases and reorganizes those themes in new
wording; it is not a copy of any textbook page.

Idempotent / scoped: DELETEs only `document_chunks` WHERE branch_name='SELF'
AND subject='EVS' before inserting, so re-running this script is safe and
touches no other subject's rows.

Usage (from backend/):
    uv run python scripts/authored_content_evs.py --dry-run
    uv run python scripts/authored_content_evs.py
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sqlmodel import delete, select

from src.ai.chunking import extract_chapters_and_chunks
from src.core.database import AsyncSessionFactory
from src.models.chunk import DocumentChunk
from src.models.ncert import NCERTBook


# ═════════════════════════════════════════════════════════════════════════
# Chapter content — one chapter per EVS Topic (curriculum_seed.py), grouped
# by class. Each chapter maps 1:1 to a Topic.code, called out in a comment.
# ═════════════════════════════════════════════════════════════════════════

EVS_CLASS_3_TEXT = """Chapter 1: My Family and Our Relationships
A family is a group of people who live together, share their home, and take care of one another. Families give us love, food, shelter, and support when we need it most. Every person belongs to a family, and every family is a small community of its own.

Families come in different shapes and sizes. A nuclear family usually has parents and their children living together. A joint family is larger — it may include grandparents, uncles, aunts, and cousins, all living together or very close by, sharing meals and responsibilities. Both kinds of families are equally normal; there is no single "correct" way for a family to look.

Every member of a family has a special name that shows how they are related to us. A mother's brother is called a maama, another word for uncle. A father's mother or a mother's mother is our grandmother, and their husbands are our grandfathers. Our parents' siblings' children are our cousins. Drawing a simple family tree, with grandparents at the top and children at the bottom, helps us see how everyone is connected.

Every family member plays a role. Some cook, some earn money, some go to school, and some look after younger children or elderly grandparents. When family members share these responsibilities and help each other, the whole household runs smoothly and happily.

Families come together to celebrate festivals, birthdays, weddings, and other special occasions. These celebrations create memories that are treasured for years and help family members, even those who live far away, feel connected to one another.

Not every family looks the same, and that is completely normal. A family in a village might be a large joint family living in one house, while a family in a city might be small, with just one or two children. Sometimes a parent must travel far away for work; even then, phone calls, letters, and visits help the family stay close in heart, even when they are apart in distance.

Our family is usually the first community we belong to. It is where we first learn to love, to share, to be responsible, and to work together, lessons that help us get along with other people throughout our lives.

Chapter 2: Keeping My Body Healthy
Our body is made of many parts, and each part does an important job. Eyes let us see the world, ears let us hear sounds, hands let us hold and touch things, and legs let us walk, run, and jump. Taking care of every part of our body keeps us active and happy.

Good personal hygiene keeps illness away. We should bathe every day, brush our teeth at least twice a day, and wash our hands with soap before every meal and after using the toilet. Wearing clean clothes and keeping our nails trimmed also stops germs from spreading to our body or to others.

Our senses help us understand the world around us: eyes for sight, ears for hearing, nose for smell, tongue for taste, and skin for touch. Protecting our senses matters too — for example, we should never look directly at the sun, and we should keep loud noises away from our ears.

Eating a mix of different foods, vegetables, fruits, grains like rice and wheat, and milk, gives our body the energy and strength it needs to grow. No single food gives everything the body needs, which is why variety at every meal matters.

Our body also needs rest and movement in balance. Playing outdoors, running, and exercising keep our muscles and heart strong, while enough sleep every night lets our body repair itself and helps our brain remember what we learned during the day.

When we feel unwell, visiting a doctor and taking prescribed medicines helps us recover faster. Vaccinations given by doctors protect us from several serious diseases before we even catch them, which is why children receive them on a regular schedule.

Simple daily habits, hygiene, balanced meals, play, rest, and timely doctor visits, together keep our body strong and ready for each new day.

Chapter 3: Plants Around Us
Plants are living things that grow all around us, in gardens, forests, farms, and even in cracks of a pavement. Most plants have four main parts: roots, a stem, leaves, and often flowers or fruits, and each part does a different job for the plant.

Roots grow underground and do two jobs: they hold the plant firmly in the soil, and they absorb water and nutrients that travel up through the stem to the rest of the plant. Without healthy roots, a plant cannot stand or feed itself.

The stem supports the plant and carries water and food between the roots and the leaves. Leaves use sunlight, water, and air to make food for the plant, in a process that also releases the oxygen we breathe, which is one reason plants are so important to every living creature.

Plants can be grouped by their size and stem type. Herbs are small, soft-stemmed plants like coriander and mint. Shrubs are medium-sized plants with several woody stems branching close to the ground, like a rose bush. Trees are the tallest, with one thick, hard, woody stem called a trunk, like a mango or banyan tree. Climbers and creepers use other plants or structures for support as they grow, like a money plant or a pumpkin vine.

Many plants also produce flowers, which later turn into fruits containing seeds. A new plant can grow from a seed if it gets enough water, air, and sunlight, and this is how forests and gardens keep renewing themselves year after year.

Plants give us far more than we usually notice: food from fruits, vegetables, and grains; shade on a hot day; wood for furniture and buildings; cotton for clothes; and medicines made from leaves, bark, or roots. Taking care of plants, watering them, protecting them from harm, and planting new trees, helps keep our surroundings green and healthy for everyone.

Chapter 4: Water Sources and Uses
Water is one of the most important things every living being needs to survive. It comes to us from many different natural sources: rain falling from clouds, rivers flowing across land, lakes and ponds collecting still water, wells and borewells reaching underground water, and glaciers melting in the mountains.

We use water for many daily activities: drinking, cooking food, bathing, washing clothes and utensils, and watering crops and gardens. Factories also use large amounts of water to make the things we use every day, and it takes water to generate some kinds of electricity too.

Not all water is safe to drink straight from its source. Water from rivers, ponds, and even some wells can carry germs and dirt, so it is usually boiled or filtered before drinking to make it safe. Water straight from a treated tap or a sealed bottle is generally safer to drink without extra treatment.

The sea and oceans hold most of the water on Earth, but seawater is salty and cannot be used for drinking, cooking, or watering plants without special, expensive treatment to remove the salt. This is why freshwater sources like rivers, lakes, and rain are so precious.

Water should never be wasted, because many villages and towns already do not have enough of it, especially in the hot summer months. Simple daily habits, like turning off the tap while brushing our teeth, fixing leaking pipes quickly, and reusing water for plants when possible, help save a resource that everyone needs.

Some communities collect and store rainwater in tanks, pits, or ponds during the rainy season, a practice called rainwater harvesting, so that there is enough water saved for drier months. Every drop saved today means more water available for tomorrow."""


EVS_CLASS_4_TEXT = """Chapter 1: Food and Nutrition
Our body needs food for three main reasons: to get energy for all our activities, to grow bigger and stronger, and to repair itself when it gets hurt or worn out. Without enough of the right food, our body cannot do any of these jobs well.

Foods can be grouped by what they mainly do for our body. Energy-giving foods, like rice, wheat, maize, oil, ghee, and sugar, power our muscles and keep us active through the day. Body-building foods, like pulses (dal), milk, eggs, meat, fish, and nuts, help build and repair muscles, bones, and other body tissues. Protective foods, mainly fruits and vegetables, are packed with vitamins and minerals that help our body fight off illness and stay strong.

A balanced diet means eating a little from each of these food groups every day, not just eating our favourite foods over and over. A plate with some grains, some pulses or milk, and some fruits or vegetables gives the body most of what it needs to stay healthy.

Eating only sugary, fried, or packaged "junk" food, and skipping fruits and vegetables, can make a person feel tired, fall sick more often, or grow unevenly. Eating far too little food, or food that lacks variety, is called malnutrition, and it can make a child weak, underweight, or slow to grow; eating far too much unhealthy food can be unhealthy in the opposite way.

Meals look different across India, and that variety is completely healthy. A family in the north might eat roti with dal and sabzi; a family in the south might eat rice with sambar and a vegetable curry; a family elsewhere might eat khichdi or idli. Whatever the style of cooking, a meal is balanced as long as it includes a mix of energy-giving, body-building, and protective foods.

Keeping food clean and safe matters just as much as choosing the right foods. Washing fruits and vegetables before eating, covering cooked food to keep insects away, and drinking clean, safe water with every meal all help prevent stomach illness.

Chapter 2: Animal Habitats and Adaptation
A habitat is the natural home of a plant or animal, the place that gives it food, shelter, and safety. Different animals live in very different kinds of habitats: forests, deserts, water bodies like ponds, rivers, and seas, cold mountain and polar regions, and open grasslands.

Animals have special body features, called adaptations, that help them survive in their particular habitat. A camel living in the desert has a hump that stores fat for energy, broad feet that do not sink into loose sand, and long eyelashes that keep out blowing sand. A fish living in water has gills to breathe underwater and a smooth, fin-covered body built for swimming. An animal like a polar bear living in freezing cold regions has thick fur and a layer of fat to trap body heat.

Birds show adaptation clearly in their beaks, which are shaped for the food they eat: a strong hooked beak for tearing meat, a thin pointed beak for picking out insects, a short thick beak for cracking seeds, and a long beak for probing into mud or water for fish.

Animals can also be grouped by how their babies are born. Animals like elephants, dogs, cows, and rabbits, whose ears we can usually see and whose skin has hair, give birth to live young; these are called viviparous animals. Animals like birds, frogs, snakes, and lizards, whose ears are often just tiny hidden openings, mostly hatch from eggs laid outside the body; these are called oviparous animals.

Elephants are a good example of habitat and social life working together. Elephants live in herds made up mainly of adult females and their young, led by the oldest and most experienced female. A herd may travel long distances to find enough food, since an adult elephant eats more than 100 kilograms of leaves and twigs in a single day, and it sleeps for only two to four hours, spending the rest of its time finding food, walking, or cooling off by playing in mud and water.

When forests are cut down or water bodies are polluted, animals lose the very habitat that keeps them alive, making it harder for them to find food, shelter, and safety. Communities that protect trees and water bodies protect animal habitats too; the Bishnoi villagers of Khejadli in Rajasthan, who sacrificed their lives to stop trees being cut down, are still remembered as an example of people standing up to protect nature for every living being that depends on it.

Chapter 3: The Water Cycle
Water on Earth is always on the move, travelling endlessly between the sky, the land, and the sea in a repeating pattern called the water cycle. This cycle has no real beginning or end, but it is easiest to understand by starting at the ocean or a river.

The sun heats the water in oceans, rivers, and lakes, turning some of the water into an invisible gas called water vapour. This process, called evaporation, sends water vapour rising up into the air, even though we cannot see it happening.

As water vapour rises higher into the sky, the air becomes cooler, and the vapour changes back into tiny droplets of liquid water. This process is called condensation. Millions of these tiny droplets gather together around specks of dust in the sky, forming the clouds we see above us.

Inside a cloud, water droplets keep bumping into each other and joining together, growing bigger and heavier over time. Eventually, they become too heavy for the cloud to hold, and they fall back down to Earth as precipitation, which we usually see as rain, or in colder places, as snow or hail.

Once water falls back to the ground, it takes two main paths. Some of it flows over the land into rivers, lakes, and eventually back to the ocean; this flow is called runoff. The rest soaks down into the soil, refilling the underground water that feeds wells and springs. Either way, the water is ready to evaporate again and begin the same cycle once more.

The water cycle matters enormously for life on Earth. It refills the rivers, lakes, and groundwater that people, animals, and plants depend on, and it shapes weather and seasons, including the monsoon rains that Indian farmers rely on to grow their crops.

Human activity can disturb this cycle. Cutting down forests and covering the ground with concrete means less rainwater can soak into the soil, which can cause more flooding after heavy rain and less water stored underground for the dry months. Planting trees and protecting ponds, lakes, and wetlands helps the water cycle keep working the way it should.

Chapter 4: Transport and Communication
Transport means the different ways people and goods move from one place to another, by land, by water, or by air. The transport people use often depends on where they live and what the land around them looks like.

On land, people travel by walking, cycling, or riding in a bullock cart, a camel cart, a bus, a car, or a train. In hilly, river-crossed, or desert regions, getting to school or the market can look very different from place to place: children in parts of Assam cross bamboo and rope bridges during heavy rain; children in parts of Ladakh cross a wide river using a trolley attached to a strong rope; children in Rajasthan's desert may travel by camel cart across hot sand; and in flat, green plains, a bicycle or bullock cart is often enough to get around.

Where rivers, lakes, backwaters, or the sea connect places, water transport becomes important. Small wooden boats, like the vallam used in Kerala's backwaters, ferries, and larger ships carry people and goods where roads cannot easily reach, and for some communities, a boat is the only way to reach school, a market, or a hospital.

Air transport, using airplanes and helicopters, is the fastest way to travel long distances or to reach a remote area quickly, especially during emergencies like floods or accidents, when every minute matters.

Communication means sharing news, messages, and information with others, and it has changed enormously over time. In the past, people relied on messengers who travelled on foot or by animal, on handwritten letters carried over long distances, and later on the telegraph, which could send short coded messages quickly over wires.

Today, telephones, mobile phones, video calls, and the internet let people communicate almost instantly across huge distances, hearing or even seeing each other in real time. This instant communication is especially valuable during emergencies, when calling for help quickly can save lives.

Transport and communication work together to connect people's daily lives: getting children to school, carrying farm produce to market, calling a doctor during an emergency, and helping families that live far apart stay close through regular calls and visits."""


EVS_CLASS_5_TEXT = """Chapter 1: Human Body Systems
Our body keeps working every single second, even while we are asleep, because several body systems work together without us having to think about them at all.

The digestive system breaks down the food we eat so our body can use it for energy and growth. Digestion begins in the mouth, where teeth chew food and saliva starts breaking it down. The chewed food travels down the food pipe, or oesophagus, into the stomach, where it is mixed with digestive juices. It then moves into the small and large intestines, which absorb the nutrients our body needs and pass out what is left as waste.

The respiratory system brings oxygen into our body and removes carbon dioxide, a waste gas, every time we breathe. Air enters through the nose, which filters out dust, travels down the windpipe, and reaches the lungs, where oxygen passes into the blood and carbon dioxide passes out. Our breathing rate increases automatically when we run or exercise, because our muscles need extra oxygen at that time.

The circulatory system moves blood, and everything it carries, all around the body. The heart is a powerful muscle that beats continuously, pumping blood through a network of blood vessels. This blood carries oxygen (from the lungs) and nutrients (from digested food) to every part of the body, and carries away waste products at the same time.

These three systems depend on each other closely. The digestive system supplies nutrients, the respiratory system supplies oxygen, and the circulatory system carries both of these to every single cell in the body, which is why damage to one system usually affects the others too.

We can keep these systems healthy with simple daily habits: eating a balanced diet, exercising regularly, sleeping enough hours, drinking clean water, washing hands before eating, and staying away from smoke and heavily polluted air, all of which protect the digestive, respiratory, and circulatory systems from unnecessary strain.

Chapter 2: Natural Resources and Conservation
A natural resource is anything that comes from nature and that people use in their daily lives, such as water, soil, forests, minerals, sunlight, wind, and fuels like coal and petroleum.

Renewable resources are ones that nature keeps replenishing, so they do not run out if we use them sensibly. Sunlight, wind, and water (through the water cycle) are renewable, and forests can also be renewable if new trees are planted to replace the ones that are cut down.

Non-renewable resources are ones that took millions of years to form deep inside the Earth and that we cannot replace quickly. Coal, petroleum, natural gas, and minerals like iron ore are non-renewable; once a country uses up its share, there is no quick way to make more, so if these resources are overused, they will eventually run out.

As more people use more resources every year, the pressure on both kinds of resources keeps growing. Overusing resources can also harm the environment directly, through deforestation, air and water pollution, and soil that becomes less fertile from overuse.

Conservation means using resources wisely so that they last for future generations too. Simple conservation habits include switching off lights and fans when not needed (most electricity still comes from burning coal, a non-renewable resource), not wasting water, following the idea of reduce-reuse-recycle for the things we buy and throw away, walking, cycling, or using public transport instead of private vehicles, planting trees, and using solar energy where possible.

Protecting resources is not the job of the government alone; the small daily choices made by individuals, families, and communities add up to real change, and everyone shares the responsibility of leaving enough resources behind for the generations that come after us.

Chapter 3: Disaster Awareness and Safety
A natural disaster is a sudden, powerful event caused by nature that can seriously harm people, property, and the environment. Some disasters are made worse by human activity too; for example, cutting down forests on hillsides can make flooding more severe when heavy rain falls.

Common types of natural disasters include earthquakes, caused by sudden movements deep beneath the Earth's surface that make the ground shake; floods, caused by heavy rain or an overflowing river; cyclones, which are powerful, spinning windstorms with heavy rain that mainly strike coastal areas; droughts, which are long periods without enough rain; and fires, which can spread quickly through homes, forests, or dry grassland.

During an earthquake, the safest action is to drop to the ground, take cover under sturdy furniture, and hold on, staying well away from windows and glass; if already outdoors, it is safer to move to open ground, away from buildings and trees.

During a flood, people should move to higher ground as early as possible and avoid walking or driving through moving water, since even shallow fast-moving water can sweep a person off their feet.

During a cyclone, it is safest to stay indoors, away from windows, and to secure or bring inside any loose outdoor objects that strong wind could turn into a danger; families should keep emergency supplies ready and follow official evacuation instructions if they are given.

If a fire breaks out, remembering to stop, drop, and roll if clothing catches fire, using the stairs instead of a lift, covering the nose and mouth to avoid breathing in smoke, and always knowing at least two ways out of a building can save precious time and lives.

A basic emergency kit, kept ready at home, usually includes a torch with extra batteries, safe drinking water, first-aid supplies, and copies of important documents; every family should also know their local emergency contact numbers. Schools that practise regular safety drills help everyone learn to stay calm and act quickly when a real disaster happens, and neighbours who look out for one another make a community far safer overall.

Chapter 4: Community and Local Governance
A community is a group of people who live in the same area and share resources, spaces, and everyday needs, whether that area is a small village or a busy city neighbourhood.

In villages, local governance is usually carried out by a Gram Panchayat, a local governing body led by an elected leader called the Sarpanch, along with elected ward members. The Gram Panchayat looks after everyday needs like village roads, drinking water supply, local schools, cleanliness, and street lighting.

In towns and cities, a Municipal Corporation or Municipality carries out similar work on a larger scale, managing garbage collection, drainage systems, public parks, and giving permissions for new buildings, among other responsibilities.

Citizens are not just watchers of local governance; they are active participants in it. People vote in local elections to choose their Sarpanch, ward members, or municipal representatives, and in villages, residents can attend Gram Sabha meetings, where local issues are discussed openly and decisions are made together. Citizens can also directly report problems, like a broken streetlight or a blocked drain, to their local governing body.

Being a responsible citizen means more than voting; it includes keeping public spaces clean, following traffic and safety rules, paying local taxes that fund shared services, and respecting community resources like parks, water supply systems, and public buildings so that everyone can continue to use and enjoy them.

When local governance works well and citizens participate actively, everyday community life runs smoothly, clean water reaches homes, roads stay in good repair, schools function properly, and problems get fixed quickly, showing how closely a community's wellbeing depends on both its local government and its citizens working together."""


_CLASS_TEXT: dict[int, str] = {
    3: EVS_CLASS_3_TEXT,
    4: EVS_CLASS_4_TEXT,
    5: EVS_CLASS_5_TEXT,
}


async def _get_book_ids() -> dict[int, "uuid.UUID"]:  # noqa: F821 - forward ref only
    async with AsyncSessionFactory() as session:
        result = await session.execute(select(NCERTBook).where(NCERTBook.subject == "EVS"))
        books = result.scalars().all()
        return {b.class_number: b.id for b in books}


async def main() -> None:
    parser = argparse.ArgumentParser(description="Author original EVS chapter content into document_chunks.")
    parser.add_argument("--dry-run", action="store_true", help="Print output, do not write to DB.")
    args = parser.parse_args()

    book_ids = await _get_book_ids()
    print(f"NCERT book ids found for EVS: {book_ids}")

    total_chunks = 0
    async with AsyncSessionFactory() as session:
        if not args.dry_run:
            result = await session.execute(
                delete(DocumentChunk).where(
                    DocumentChunk.branch_name == "SELF",
                    DocumentChunk.subject == "EVS",
                )
            )
            print(f"Deleted {result.rowcount} existing EVS 'SELF' document_chunks.")

        for class_number, full_text in _CLASS_TEXT.items():
            chunks = extract_chapters_and_chunks(
                full_text, default_module_title=f"EVS Class {class_number}"
            )
            book_id = book_ids.get(class_number)
            chapters_seen: dict[int, str] = {}
            for c in chunks:
                chapters_seen[c["chapter_number"]] = c["chapter_title"]
                if not args.dry_run:
                    session.add(
                        DocumentChunk(
                            module_id=None,
                            ncert_book_id=book_id,
                            branch_name="SELF",
                            class_number=class_number,
                            subject="EVS",
                            chapter_number=c["chapter_number"],
                            chapter_title=c["chapter_title"],
                            chunk_index=c["chunk_index"],
                            content=c["content"],
                            token_count=c["token_count"],
                            char_count=c["char_count"],
                            start_char=c["start_char"],
                            end_char=c["end_char"],
                            embedding=json.dumps(c["embedding"]),
                        )
                    )
                total_chunks += 1

            print(f"Class {class_number}: {len(chunks)} chunk(s) across {len(chapters_seen)} chapter(s)")
            for ch_num in sorted(chapters_seen):
                print(f"  {chapters_seen[ch_num]}")

        if not args.dry_run:
            await session.commit()

    print(
        f"\nDone. {'[dry-run] ' if args.dry_run else ''}"
        f"{total_chunks} chunk(s) prepared across {len(_CLASS_TEXT)} classes."
    )


if __name__ == "__main__":
    asyncio.run(main())
