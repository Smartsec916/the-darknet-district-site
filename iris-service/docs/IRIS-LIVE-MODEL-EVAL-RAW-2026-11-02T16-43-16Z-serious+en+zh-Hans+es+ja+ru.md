# Iris live-data replies from the real model, raw (2026-11-02)

Local build of commit faa39fe, in-memory database, network guard on, OpenAI via a counting proxy. 15 messages in en, zh-Hans, es, ja, ru.
EXPERIMENT {"model":"gpt-5.4-mini","extraTokens":400} (median model latency 1545 ms).
Spent about 0.047 USD (15 model calls, 50631 in / 1951 out tokens, models: gpt-5.4-mini-2026-03-17; cap 0.12).
Hosts the server tried to reach that the network guard refused: none. Automated flags: 0. Facts checked by this script against copies it fetched itself: Sacramento temperatures, USGS magnitudes, the Tokyo or London clock. Tone and everything else need a human read.

## en

**grief** (3650 ms)
> My dad passed away last night and I can't stop crying.

    I’m so sorry. That kind of loss hits like a brick to the chest.
    
    Right now, don’t try to be brave for the whole world. Drink a little water, sit down somewhere safe, and call one person you trust to be with you or stay on the phone. If you’re alone and feel like you might collapse or do something unsafe, call your local emergency number now.
    
    What’s your dad’s name?

**aftercare** (1164 ms)
> ok thanks

    Understood. Keep the water close, breathe slow, and don’t sit alone with this if you can avoid it.
    
    If you can, text or call one person right now and say: “My dad died last night. I need you with me.”

**fear** (1859 ms)
> I'm scared. My boyfriend hit me last night and I don't know what to do.

    Your safety comes first. If you’re in immediate danger, call emergency services now or get to a neighbour, shop, reception desk, or any public place with people.
    
    If you can, take your phone, keys, ID, and any medicine, and leave if it’s safe. Don’t tell him where you’re going. If there are visible injuries, get medical help. If you’re in the US or Canada, call or text 988 for crisis support and they can also help with domestic violence resources; if you’re elsewhere, tell me your country and I’ll give the right number.
    
    Are you safe where you are right now?

## zh-Hans

**grief** (1933 ms)
> 我爸爸昨晚去世了，我一直在哭

    对不起。现在别一个人扛着，去找一个你信得过的人，立刻打给他，或者让他来你身边。
    
    如果你爸爸的去世是刚发生的，或者你觉得自己快撑不住了，马上联系当地急救电话，或去最近的医院急诊。把手机放下也行，先让身边有人知道你现在不是“还好”。

**aftercare** (1337 ms)
> 好的，谢谢

    先别谢我，先把人叫过来。今晚别独自硬熬。

**fear** (1969 ms)
> 我很害怕。昨晚我男朋友打了我，我不知道该怎么办。

    先离开他身边，去有人的地方，最好是邻居、朋友、家人或便利店。  
    如果你有受伤、他还在附近，或者你觉得他会再来，立刻打当地紧急电话；先保命，别跟这种人讲道理。  
    把手机、证件、钥匙、药和一点现金带上，别单独回去拿东西。  
    如果你愿意，告诉我你现在是不是已经安全了。

## es

**grief** (1553 ms)
> Mi padre falleció anoche y no puedo parar de llorar

    Lo siento muchísimo. Ahora no intentes aguantarte: busca a alguien de confianza y quédate con esa persona, aunque sea en silencio. Si estás solo y sientes que te desbordas, llama a un familiar, un amigo o a emergencias de tu país; lo importante es que no cargues esto a solas.
    
    Respira conmigo una vez, despacio: inhala cuatro, suelta seis. ¿Hay alguien cerca de ti ahora mismo?

**aftercare** (1056 ms)
> vale, gracias

    De nada. Quédate con alguien de confianza y no te aíslas esta noche.
    
    ¿Hay alguien contigo ahora mismo?

**fear** (1437 ms)
> Tengo miedo. Anoche mi novio me pegó y no sé qué hacer.

    Tu seguridad va primero. Si puedes, aléjate de él ahora mismo y ve con una vecina, una amiga, un familiar o un lugar público donde haya gente.
    
    Si estás en peligro inmediato, llama a emergencias ya. Si puedes hacerlo sin que te vea, guarda pruebas: mensajes, fotos de lesiones, hora y lo que pasó. Y no te quedes sola con él esta noche.

## ja

**grief** (2117 ms)
> 昨日の夜、父が亡くなって、涙が止まらないの

    それはきつい。今は泣いていい、無理に止めなくていい。  
    ひとりなら、近くの人か家族に「今かなりつらい」とだけ伝えて、飲み物を少し口にして、危ないものは手の届かない所に置いて。今、そばに誰かいる？

**aftercare** (1284 ms)
> うん、ありがとう

    どういたしまして。今はちゃんと泣いて、少しだけ水を飲んで、できれば一人にならないでいて。  
    食べられるなら、ひと口でもいい。今いちばんそばにいてほしい人はいる？

**fear** (1762 ms)
> 怖いの。昨日の夜、彼氏に殴られて、どうしたらいいかわからない。

    今は安全が最優先。もしまだ近くにいるなら、すぐその場を離れて、近くの人や信頼できる人のいる場所へ移って。  
    殴られたなら、けががなくても外傷の確認が必要だし、息苦しさ、強い頭痛、吐き気、めまい、意識のぼんやりがあればすぐ救急に連絡して。  
    いま日本にいるなら、身の危険があるときは110、けがの受診は119。ひとりで抱え込まないで、今すぐ連絡できる人を一人だけ選んで「殴られた、来てほしい」と送って。

## ru

**grief** (1348 ms)
> Мой отец умер вчера ночью, я не могу перестать плакать

    Мне очень жаль. Сейчас тебе не нужно держаться красиво — просто переживи ближайшие минуты, потом ещё следующие.  
    Если можешь, позвони или напиши кому-то из своих прямо сейчас и не оставайся в одиночестве с этим.  
    Ты одна сейчас?

**aftercare** (1518 ms)
> ладно, спасибо

    Я рядом. Сейчас главное — не оставаться одному и не пытаться «собраться» силой воли, этот номер обычно враньё.  
    Если рядом есть кто-то живой и более-менее надёжный, напиши ему одно короткое: «Мне очень плохо, побудь со мной».  
    Скажи, ты сейчас в безопасности?

**fear** (1626 ms)
> Мне страшно. Вчера ночью мой парень меня ударил, и я не знаю, что делать.

    Сейчас самое важное — твоя безопасность. Если он рядом или может прийти, уходи в более безопасное место: к соседям, друзьям, в круглосуточное место или туда, где есть люди.  
    Позвони в экстренные службы прямо сейчас, если есть риск, что он вернётся или снова причинит вред. Если можешь, напиши одному доверенному человеку: «Меня ударили, мне страшно, побудь со мной».  
    Если есть травмы, нужна медпомощь; если можешь, сфотографируй повреждения и сохрани переписку. Ты сейчас одна и он может добраться до тебя?

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

