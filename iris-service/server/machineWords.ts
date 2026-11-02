// Words that show her machine worldview (processors, circuits, sensors, signals, encryption, systems, ...) in English, Chinese, Japanese, Spanish and
// Russian. The server uses it to remember which technical images she used in her last replies, so she picks different ones next time. It is a
// copy of the list the evaluation measures with (scripts/android-identity.mjs); a test keeps the two identical.
export const MACHINE_WORDS =
  /processor|circuit|sensor|signal|encrypt|firmware|firewall|network|\bsystems?\b|protocol|packet|bandwidth|latency|buffer|\bcache|compil|debug|reboot|diagnostic|algorithm|malware|subnet|overclock|calibrat|voltage|battery|\bbinary\b|hacker|hacking|\bcore\b|\bchip\b|upload|download|数据流|數據流|信标|信標|处理器|處理器|电路|電路|传感器|傳感器|感应器|信号|信號|加密|固件|防火墙|防火牆|网络|網絡|系统|系統|协议|協議|数据包|带宽|缓存|编译|調試|调试|重启|重啟|算法|黑客|程序|代码|代碼|芯片|运算|運算|电量|電量|プロセッサ|回路|センサー|信号|暗号|ファームウェア|ファイアウォール|ネットワーク|システム|プロトコル|パケット|帯域|キャッシュ|コンパイル|デバッグ|再起動|アルゴリズム|ハッキング|プログラム|バッテリー|チップ|演算|procesador|circuito|sensor(?:es)?|señal|señales|cifrad|encript|cortafuegos|\bred\b|sistema|protocolo|paquete|ancho de banda|caché|compil|depur|reinici|algoritmo|programa|batería|procesamiento|процессор|схем|сенсор|датчик|сигнал|шифр|прошивк|брандмауэр|сеть|систем|протокол|пакет|пропускн|кэш|компил|отлад|перезагруз|алгоритм|взлом|программ|батаре|чип/giu;

// The distinct technical words in a reply, lowercase, in order of appearance
export function technicalWords(text: string): string[] {
  const found = String(text ?? "").match(MACHINE_WORDS) ?? [];
  return [...new Set(found.map(word => word.toLowerCase()))];
}
