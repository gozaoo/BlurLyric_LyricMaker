// lyricParser.js
const methods={
    parseYRClyric(contentText) {
        const lyrics = {
            type: "yrc",
            headers: {},
            lines: []
        };
        // 按行分割歌词文本
        const lines = contentText.split('\n');
        // 解析头部信息
        let headerEndIndex = lines.findIndex(line => line.startsWith('['));
        lines.slice(0, headerEndIndex).forEach(headerLine => {
            try {
                const header = JSON.parse(headerLine);
                const key = header.c[0].tx.replace(/:$/, '');
                const value = header.c.slice(1).map(item => item.tx).join('/');
                lyrics.headers[key] = value;
            } catch (e) {
                console.error('解析头部信息出错:', e);
            }
        });
        // 解析歌词
        lines.slice(headerEndIndex).forEach(line => {
            if (line.startsWith('[')) {
                const timestamps = line.match(/\[(\d+),(\d+)\]/);
                const startTime = Number(timestamps[1]) / 1000;
                const duration = Number(timestamps[2]) / 1000;
                const words = [];

                line.replace(/\((\d+),(\d+),\d+\)([^\(]*)/g, (_, wordStart, wordDuration, word) => {
                    let startTime = Number(wordStart) / 1000,
                        duration = Number(wordDuration) / 1000;
                    let endTime = Number((startTime + duration).toFixed(3))

                    if(word==''||word == ' ')return'';

                    if(word=='’'||word==', '||word=='ll '||word=='s '||word=='t '||word=='m '||word=='re '){
                        words[words.length-1].duration += duration
                        words[words.length-1].endTime = endTime
                        words[words.length-1].word += word
                        return ''
                    }
                    words.push({
                        startTime,
                        duration,
                        endTime,
                        word
                    });
                    return '';
                });
                let text = ''
                words.forEach(element => {
                    text+=element.word
                });
                lyrics.lines.push({
                    startTime:words[0].startTime,
                    duration,
                    endTime: words[words.length-1].endTime,
                    words,
                    text
                });
            }
        });
        return lyrics;
    },
    parseLRClyric(content) {
        // 初始化歌词数组和一个用于存储元数据的对象
        const lyrics = [];
        const headers = {};

        // 将歌词文本按行分割
        const lines = content.split('\n');
        // 初始化上一个时间戳为0
        let previousTime = 0;

        // 遍历每一行歌词
        lines.forEach(line => {
            // 如果行以'['开头，则可能是时间戳或元数据标签
            if (line.startsWith('[')) {
                // 使用正则表达式匹配时间戳
                const timestampMatch = line.match(/\[(\d*):(\d*)\.(\d*)\]/g);
                if (timestampMatch) {
                    // 从行中移除时间戳并修剪空白字符
                    const text = line.replace(timestampMatch.join(''), '').trim();
                    // 遍历每个时间戳
                    timestampMatch.forEach(timestamp => {
                        // 解构时间戳的分钟、秒和毫秒
                        const [_, mm, ss, sss] = timestamp.match(/(\d*):(\d*)\.(\d*)/);
                        // 计算时间戳的总秒数
                        const time = (Number(mm) * 60) + Number(ss) + (Number(sss) / 1000);
                        // 如果行包含歌词文本，则添加到歌词数组
                        if (text) {
                            lyrics.push({
                                startTime: time,
                                endTime: 0,
                                text,
                                duration: 0
                            });
                        }
                        // 更新上一个时间戳为当前时间戳（取最大值以处理乱序时间戳）
                        previousTime = Math.max(previousTime, time);
                    });
                } else {
                    // 如果不是时间戳，则可能是元数据标签
                    const [key, value] = line.replace('[', '').replace(']', '').split(':');
                    // 避免重复标签，只有当元数据对象中不存在该键时才添加
                    if (!headers.hasOwnProperty(key)) {
                        headers[key] = value.trim();
                    }
                }
            } else if (line.trim() === '') {
                // 如果是空白行，表示较长的音乐间隔
                if (lyrics.length > 0) {
                    // 获取最后一行歌词
                    const lastLyric = lyrics[lyrics.length - 1];
                    // 如果最后一行歌词的结束时间未设置，则设置为上一个时间戳
                    if (lastLyric.endTime === 0) {
                        lastLyric.endTime = previousTime;
                        lastLyric.duration = lastLyric.endTime - lastLyric.startTime;
                    }
                }
            }
        });

        // 如果歌词数组不为空，处理最后一行歌词的结束时间和时长
        if (lyrics.length > 0) {
            const lastLyric = lyrics[lyrics.length - 1];
            if (lastLyric.endTime === 0) {
                lastLyric.endTime = previousTime;
            }
            lastLyric.duration = lastLyric.endTime - lastLyric.startTime;
        }

        // 计算每行歌词的结束时间和时长
        for (let i = 1; i < lyrics.length; i++) {
            const currentLyric = lyrics[i];
            const previousLyric = lyrics[i - 1];
            previousLyric.endTime = currentLyric.startTime;
            previousLyric.duration = previousLyric.endTime - previousLyric.startTime;
        }

        // 返回元数据和歌词数组
        return {
            type: 'lrc',
            headers,
            lines:lyrics
        };

    },
    parseBLFlyric(blfContent) {
        const blfLyric = JSON.parse(blfContent);
    
        const parsedLyric = {
            type: 'yrc',
            headers: blfLyric.headers,
            lines: [],
        };
    
        blfLyric.lines.forEach(line => {
            const parsedLine = {
                startTime: line[0][0],
                duration: 0,
                endTime:line[line.length-1][0] + line[line.length-1][1],
                words: [],
                text: ''
            };
            parsedLine.duration = parsedLine.endTime - parsedLine.startTime

            line.forEach(word => {
                const parsedWord = {
                    startTime: word[0],
                    duration: word[1],
                    endTime: word[0] + word[1],
                    word: word[2]
                };
                parsedLine.words.push(parsedWord);
                parsedLine.text += parsedWord.word;
            });
    
            parsedLyric.lines.push(parsedLine);
        });
    
        return parsedLyric;
    },
    toBLFfile(parsedLyric) {
        const blfLyric = {
            type: 'exact',
            headers: parsedLyric.headers,
            lines: []
        };
    
        parsedLyric.lines.forEach(line => {
            const blfLine = []
    
            line.words.forEach(word => {
                blfLine.push([word.startTime, word.duration, word.word]);
            });
    
            blfLyric.lines.push(blfLine);
        });
        console.log( JSON.stringify(blfLyric, null, 0));
        
        return JSON.stringify(blfLyric, null, 0); // 使用两个空格缩进格式化JSON
    }
}
export default methods
let tempBLF = {
    type: "exact",
    headers: {
        ar: 'artist name',
        ti: 'song title',
        al: 'album Name',
        ly: 'lyric '
    },
    lines: [[[0,1,'Hello'],[1.5,0.5,'Hello']],[[0,1,'Second'],[1.5,0.5,'line']],]
}
// let tempYrc = '{"t":0,"c":[{"tx":"作词: "},{"tx":"Christopher James Brenner"}]}\n{"t":165,"c":[{"tx":"作曲: "},{"tx":"Christopher James Brenner"}]}\n[330,4350](330,390,0)All (720,120,0)of (840,270,0)my (1110,570,0)senses (1680,630,0)screaming(2310,0,0), (2310,120,0)I (2430,390,0)should (2820,510,0)better (3330,360,0)let (3690,90,0)it (3780,870,0)slide(4650,30,0) \n[4680,4260](4680,360,0)All (5040,150,0)of (5190,420,0)my (5610,990,0)inhibitions(6600,0,0), (6600,270,0)got (6870,240,0)me (7110,510,0)wasting (7620,630,0)precious (8250,660,0)time(8910,30,0) \n[8940,4230](8940,630,0)Nothing (9570,270,0)hits (9840,540,0)harder (10380,300,0)than (10680,150,0)the (10830,720,0)sunshine (11550,420,0)after (11970,420,0)rainy (12390,780,0)skies\n[13170,2400](13170,360,0)I (13530,30,0) (13560,390,0)know (13950,180,0) (14130,270,0)I(14400,0,0)’(14400,210,0)ll (14610,30,0) (14640,450,0)be (15090,480,0)fine\n[15570,4200](15570,300,0)The (15870,270,0)air (16140,120,0)it (16260,600,0)tastes (16860,450,0)like (17310,780,0)sugar(18090,1680,0) \n[19770,4320](19770,420,0)The (20190,270,0)air (20460,90,0)it (20550,630,0)tastes (21180,450,0)like (21630,780,0)sugar(22410,1680,0) \n[24090,4290](24090,420,0)The (24510,270,0)air (24780,120,0)it (24900,600,0)tastes (25500,450,0)like (25950,810,0)sugar(26760,1620,0) \n[28380,5580](28380,450,0)The (28830,270,0)air (29100,120,0)it (29220,600,0)tastes (29820,420,0)like (30240,1380,0)sugar(31620,2340,0) \n[33960,1890](33960,360,0)Spray (34320,360,0)some (34680,360,0)water (35040,60,0)on (35100,120,0)my (35220,240,0)dumb (35460,390,0)face\n[35850,2310](35850,30,0)I(35880,0,0)’(35880,60,0)m (35940,30,0) (35970,330,0)kinda (36300,300,0)happy (36600,180,0)that (36780,60,0)I (36840,300,0)came (37140,120,0)to (37260,150,0)the (37410,270,0)wrong (37680,450,0)place(38130,30,0) \n[38160,2190](38160,330,0)Looking (38490,150,0)through (38640,180,0)my (38820,210,0)empty (39030,330,0)pocket (39360,120,0)for (39480,180,0)some (39660,300,0)spare (39960,360,0)change(40320,30,0) \n[40350,3210](40350,240,0)Guess (40590,30,0)I(40620,0,0)’(40620,90,0)m (40710,210,0)gonna (40920,210,0)get (41130,90,0)it (41220,210,0)now (41430,210,0)cause (41640,90,0)I (41730,240,0)don(41970,0,0)’(41970,90,0)t (42060,240,0)chase(42300,1260,0) \n[43560,4260](43560,390,0)My (43950,300,0)eyes (44250,150,0)are (44400,630,0)focused (45030,270,0)on (45300,120,0)the (45420,360,0)ground (45780,330,0)while (46110,120,0)I (46230,300,0)should (46530,360,0)face (46890,240,0)the (47130,660,0)music(47790,30,0) \n[47820,4380](47820,750,0)Sometimes (48570,180,0)its (48750,360,0)best (49110,210,0)to (49320,840,0)overthink (50160,120,0)it(50280,0,0)’(50280,120,0)s (50400,330,0)how (50730,150,0)I (50880,570,0)always (51450,360,0)do (51810,360,0)it(52170,30,0) \n[52200,2220](52200,420,0)Don(52620,0,0)’(52620,90,0)t (52710,30,0) (52740,390,0)need (53130,300,0)no (53430,930,0)attention(54360,60,0) \n[54420,2040](54420,210,0)I(54630,0,0)’(54630,30,0)ll (54660,270,0)keep (54930,330,0)my (55260,480,0)eyes (55740,690,0)closed(56430,30,0) \n[56460,4410](56460,540,0)So (57000,30,0) (57030,480,0)sick (57510,180,0)of (57690,1050,0)pretending(58740,2130,0) \n[60870,4350](60870,390,0)All (61260,120,0)of (61380,270,0)my (61650,570,0)senses (62220,630,0)screaming(62850,0,0), (62850,120,0)I (62970,390,0)should (63360,510,0)better (63870,360,0)let (64230,90,0)it (64320,840,0)slide(65160,60,0) \n[65220,4260](65220,360,0)All (65580,150,0)of (65730,420,0)my (66150,990,0)inhibitions(67140,0,0), (67140,270,0)got (67410,240,0)me (67650,510,0)wasting (68160,630,0)precious (68790,660,0)time(69450,30,0) \n[69480,4230](69480,630,0)Nothing (70110,270,0)hits (70380,540,0)harder (70920,300,0)than (71220,150,0)the (71370,720,0)sunshine (72090,420,0)after (72510,420,0)rainy (72930,780,0)skies\n[73710,2400](73710,360,0)I (74070,30,0) (74100,510,0)know (74610,60,0) (74670,240,0)I(74910,0,0)’(74910,240,0)ll (75150,30,0) (75180,450,0)be (75630,480,0)fine\n[76110,4170](76110,300,0)The (76410,270,0)air (76680,120,0)it (76800,600,0)tastes (77400,450,0)like (77850,810,0)sugar(78660,1620,0) \n[80280,4320](80280,450,0)The (80730,270,0)air (81000,90,0)it (81090,630,0)tastes (81720,420,0)like (82140,840,0)sugar(82980,1620,0) \n[84600,4350](84600,450,0)The (85050,270,0)air (85320,120,0)it (85440,630,0)tastes (86070,420,0)like (86490,810,0)sugar(87300,1650,0) \n[88950,5640](88950,420,0)The (89370,270,0)air (89640,120,0)it (89760,630,0)tastes (90390,390,0)like (90780,810,0)sugar(91590,3000,0) \n[94590,2730](94590,300,0)They (94890,510,0)say(95400,30,0), (95430,330,0)good (95760,420,0)karma(96180,0,0)’(96180,120,0)s (96300,360,0)coming (96660,180,0)your (96840,450,0)way(97290,30,0) \n[97320,2430](97320,240,0)What (97560,120,0)if (97680,210,0)that(97890,0,0)’(97890,150,0)s (98040,150,0)it(98190,0,0), (98190,210,0)what (98400,120,0)if (98520,480,0)everything (99000,480,0)changed (99480,30,0) (99510,180,0)and(99690,60,0) \n[99750,1950](99750,30,0)I(99780,0,0)’(99780,60,0)m (99840,240,0)outta (100080,300,0)breath (100380,240,0)from (100620,330,0)keeping (100950,180,0)the (101130,480,0)pace(101610,90,0) \n[101700,2310](101700,60,0)I (101760,120,0)don(101880,0,0)’(101880,90,0)t (101970,300,0)wanna (102270,270,0)rush(102540,0,0), (102540,210,0)thought (102750,90,0)of (102840,300,0)hitting (103140,150,0)the (103290,390,0)breaks (103680,300,0)but(103980,30,0) \n[104010,4410](104010,480,0)Sleep (104490,240,0)on (104730,120,0)the (104850,660,0)sofa(105510,0,0), (105510,300,0)bless (105810,210,0)my (106020,450,0)lucky (106470,450,0)stars (106920,180,0)now (107100,390,0)that (107490,90,0)it(107580,0,0)’(107580,150,0)s (107730,540,0)over(108270,150,0) \n[108420,4320](108420,450,0)Dead (108870,240,0)of (109110,720,0)October(109830,0,0), (109830,240,0)no (110070,480,0)longer (110550,360,0)do (110910,150,0)this (111060,360,0)shit (111420,360,0)for (111780,930,0)exposure(112710,30,0) \n[112740,2220](112740,450,0)Don(113190,0,0)’(113190,60,0)t (113250,30,0) (113280,390,0)need (113670,300,0)no (113970,900,0)attention(114870,90,0) \n[114960,2130](114960,210,0)I(115170,0,0)’(115170,30,0)ll (115200,270,0)keep (115470,330,0)my (115800,480,0)eyes (116280,630,0)closed(116910,180,0) \n[117090,2190](117090,270,0)I(117360,0,0)’(117360,90,0)m (117450,90,0) (117540,480,0)sick (118020,150,0)of (118170,930,0)pretending(119100,180,0) \n[119280,4350](119280,270,0)I(119550,0,0)’(119550,60,0)m (119610,240,0)good (119850,240,0)to (120090,540,0)let (120630,810,0)go(121440,2190,0) \n[123630,7020](123630,240,0)I(123870,0,0)’(123870,120,0)m (123990,240,0)good (124230,210,0)to (124440,600,0)let (125040,1050,0)go(126090,4560,0) \n[130650,2040](130650,270,0)I (130920,180,0)know (131100,30,0)I(131130,0,0)’(131130,90,0)m (131220,450,0)sounding (131670,990,0)crazy(132660,30,0) \n[132690,2190](132690,30,0)I (132720,30,0) (132750,360,0)can(133110,0,0)’(133110,60,0)t (133170,240,0)blame (133410,180,0)you (133590,210,0)if (133800,180,0)you(133980,0,0)’(133980,60,0)re (134040,810,0)leaving(134850,30,0) \n[134880,2130](134880,420,0)So (135300,390,0)happy (135690,300,0)that (135990,60,0)you(136050,0,0)’(136050,60,0)re (136110,870,0)patient(136980,30,0) \n[137010,2220](137010,210,0)When (137220,90,0)I(137310,0,0)’(137310,90,0)m (137400,480,0)going (137880,180,0)off (138060,150,0)the (138210,630,0)deep (138840,360,0)end(139200,30,0) \n[139230,2100](139230,360,0)No (139590,180,0)you (139770,210,0)can(139980,0,0)’(139980,60,0)t (140040,150,0)be (140190,180,0)my (140370,930,0)savior(141300,30,0) \n[141330,2340](141330,210,0)But (141540,120,0)I (141660,480,0)finally (142140,240,0)got (142380,210,0)some (142590,660,0)sleep (143250,330,0)and(143580,90,0) \n[143670,2130](143670,210,0)I (143880,450,0)kinda (144330,270,0)like (144600,120,0)the (144720,1020,0)flavor(145740,60,0) \n[145800,3750](145800,210,0)It (146010,660,0)tastes (146670,600,0) (147270,840,0)sugar(148110,1440,0) \n[149550,4350](149550,420,0)The (149970,210,0)air (150180,150,0)it (150330,660,0)tastes (150990,690,0)like (151680,750,0)sugar(152430,1470,0) \n[153900,4290](153900,390,0)The (154290,210,0)air (154500,150,0)it (154650,720,0)tastes (155370,630,0)like (156000,30,0) (156030,930,0)sugar(156960,1230,0) \n[158190,7270](158190,840,0)Everything (159030,600,0)tastes (159630,660,0)like (160290,30,0) (160320,720,0)sugar(161040,4420,0) \n'
// console.log(methods.parseBLFlyric(JSON.stringify(tempBLF)));
// console.log(methods.parseYRClyric(tempYrc))
 