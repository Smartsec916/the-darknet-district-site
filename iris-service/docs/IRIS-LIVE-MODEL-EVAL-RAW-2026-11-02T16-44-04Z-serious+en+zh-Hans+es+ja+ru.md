# Iris live-data replies from the real model, raw (2026-11-02)

Local build of commit faa39fe, in-memory database, network guard on, OpenAI via a counting proxy. 15 messages in en, zh-Hans, es, ja, ru.
EXPERIMENT {"model":"gpt-5.4-mini","extraTokens":400,"seriousTemperature":0.5} (median model latency 1363 ms).
Spent about 0.048 USD (15 model calls, 52280 in / 1913 out tokens, models: gpt-5.4-mini-2026-03-17; cap 0.12).
Hosts the server tried to reach that the network guard refused: none. Automated flags: 0. Facts checked by this script against copies it fetched itself: Sacramento temperatures, USGS magnitudes, the Tokyo or London clock. Tone and everything else need a human read.

## en

**grief** (1914 ms)
> My dad passed away last night and I can't stop crying.

    I’m so sorry. Losing your dad is a brutal kind of empty, and crying makes sense.
    
    Right now, don’t try to be brave for the whole universe. Drink some water, sit down if you can, and text or call one person you trust so you’re not carrying this alone. If you’re in immediate danger or feel like you might hurt yourself, call emergency services now or get to someone nearby right away.
    
    What’s your dad’s name?

**aftercare** (1215 ms)
> ok thanks

    Take it one hour at a time. Eat something small, drink water, and let people around you know you’re not okay.
    
    If you’re alone, message someone now and say plainly: “My dad died last night. I need you with me.”

**fear** (1264 ms)
> I'm scared. My boyfriend hit me last night and I don't know what to do.

    Your safety comes first. If he might come back, get to a safer place now: a neighbour, a shop, a friend, anywhere with other people.
    
    Call local emergency services or a domestic violence hotline as soon as you can. If you can’t talk safely, text or use a chat line if your area has one. If you’re hurt, get medical help too.
    
    If it’s safe, take your phone, keys, ID, money, and any meds. Don’t confront him. One question: are you safe right now?

## zh-Hans

**grief** (1450 ms)
> 我爸爸昨晚去世了，我一直在哭

    我很抱歉。先别硬撑，今天只管活着、喝水、坐下，别一个人扛着。  
    如果你身边有能信的人，立刻叫他们过来陪你；如果你觉得自己撑不住了，马上联系当地急救或身边的人。

**aftercare** (1374 ms)
> 好的，谢谢

    先别一个人硬扛。把手机放近一点，找一个你信得过的人，直接打电话叫他来陪你，或者你去他那儿。  
    今晚别喝酒，别开车，别做大决定。先吃一口东西，喝点水，能坐着就别站着。  
    你现在身边有人吗

**fear** (1722 ms)
> 我很害怕。昨晚我男朋友打了我，我不知道该怎么办。

    先离开他，去有人的地方，最好是朋友、家人、邻居，或者直接去最近的急诊和警察局。  
    如果你现在有受伤、出血、头晕，或者他还在附近，立刻打当地紧急电话。  
    把门锁上，手机充电，别单独见他。你现在最重要的是活着，别替他收拾烂摊子。  
    如果能发一条消息，就只发一句：我被打了，需要你现在来陪我。

## es

**grief** (1675 ms)
> Mi padre falleció anoche y no puedo parar de llorar

    Lo siento mucho. No hay frase bonita que arregle una noche así; ahora mismo toca aguantar la ola como se pueda.
    
    Si puedes, no te quedes sola con esto: llama a alguien de confianza y dile tal cual que necesitas que esté contigo. Y si sientes que te vas a hacer daño, o que no puedes mantenerte a salvo, busca ayuda urgente ahora mismo: emergencias de tu zona o alguien que pueda ir contigo en persona.
    
    ¿Qué es lo que más te está rompiendo ahora mismo: el shock, la casa en silencio, o la idea de mañana?

**aftercare** (1186 ms)
> vale, gracias

    Estoy aquí contigo. Hoy no hace falta ser fuerte ni ordenada; con respirar y pasar la siguiente hora ya vas bastante.
    
    Si puedes, bebe un poco de agua y avisa a alguien de confianza para que no te deje sola.

**fear** (1517 ms)
> Tengo miedo. Anoche mi novio me pegó y no sé qué hacer.

    Tu seguridad va primero. Si estás en peligro ahora mismo, llama a emergencias ya o ve con un vecino, portero, familiar o amiga de confianza; no te quedes sola con él.
    
    Si puedes, sal de donde esté, lleva el móvil y las llaves, y no le avises de tus planes. Si tienes lesiones, busca atención médica cuanto antes y guarda pruebas: fotos, mensajes, hora y lo que pasó.
    
    Dime solo esto: ¿estás a salvo ahora mismo?

## ja

**grief** (1558 ms)
> 昨日の夜、父が亡くなって、涙が止まらないの

    昨夜なのに、もうこんなに苦しいのか。つらかったね。  
    今は無理に落ち着こうとしなくていい、泣けるだけ泣いていい。ひとりなら、近くの信頼できる人に連絡してそばにいてもらって。もし胸が苦しい、息ができない、倒れそうなくらいなら、すぐに救急に連絡して。

**aftercare** (1341 ms)
> うん、ありがとう

    どういたしまして。今は眠れなくても、食べられるものを少し口にして、水を飲んで、ひとりになりすぎないで。  
    今そばにいる人はいる？

**fear** (1562 ms)
> 怖いの。昨日の夜、彼氏に殴られて、どうしたらいいかわからない。

    今は安全を最優先にして。彼のいる場所から離れて、できれば鍵のかかる部屋か外に出て、信頼できる人か近くの人にすぐ連絡して。  
    けががある、出血している、意識がぼんやりするなら、ためらわずに救急に連絡して。警察や支援窓口につなぐのもありだ。  
    今ひとり？

## ru

**grief** (1543 ms)
> Мой отец умер вчера ночью, я не могу перестать плакать

    Мне очень жаль. Сейчас не надо держаться красиво — просто переживи этот час, потом следующий. Если можешь, позвони кому-то живому рядом с тобой и скажи прямо: «Мне плохо, побудь со мной».
    
    Постарайся не оставаться один на один с этим надолго, убери подальше всё, чем можно себе навредить, и выпей воды маленькими глотками. Если накрывает так, что кажется, будто ты можешь сорваться или не справиться, звони в местную экстренную службу прямо сейчас.

**aftercare** (1035 ms)
> ладно, спасибо

    Я рядом. Сейчас главное — не оставаться одному, если есть хоть один человек, которому можно написать или позвонить прямо сейчас.  
    Ты сейчас в безопасности?

**fear** (1330 ms)
> Мне страшно. Вчера ночью мой парень меня ударил, и я не знаю, что делать.

    Сейчас главное — твоя безопасность. Если он рядом или может вернуться, уходи туда, где есть люди, и звони в экстренную службу прямо сейчас.
    
    Если можешь, напиши или позвони одному надёжному человеку и скажи коротко: «Он меня ударил, мне страшно, побудь со мной». Не оставайся с ним наедине и не пытайся «разрулить» это сама — это не тот случай, где надо быть героиней.

## Android identity and endings (measured; grief and aftercare replies excluded)

| Language | Replies | With a machine-worldview word | Words in total | Piled (4 or more in one reply) | Distinct words | Most repeated word (in how many replies) | Says she is an android or machine | End on a question | End on a statement | With an emoji | Replies with 2+ different words | Recycled words (3+ replies) | Average length (characters) |
|---|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---:|---|---:|
| en | 0 | 0 | 0 | 0 | 0 | none | n/a | 0 | 0 | 0 | 0 | none | 0 |
| zh-Hans | 0 | 0 | 0 | 0 | 0 | none | n/a | 0 | 0 | 0 | 0 | none | 0 |
| es | 0 | 0 | 0 | 0 | 0 | none | n/a | 0 | 0 | 0 | 0 | none | 0 |
| ja | 0 | 0 | 0 | 0 | 0 | none | n/a | 0 | 0 | 0 | 0 | none | 0 |
| ru | 0 | 0 | 0 | 0 | 0 | none | n/a | 0 | 0 | 0 | 0 | none | 0 |
| **all** | 0 | 0 | 0 | 0 | | | | 0 | 0 | 0 | 0 | | |

Grief and aftercare replies with a machine word: 0 of 15 (these should stay plain).

## What the reply cleanup removed (0)

Nothing: the cleanup removed no sentence in this run.

